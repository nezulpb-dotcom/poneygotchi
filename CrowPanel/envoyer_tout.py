"""Transfert PonyGotchi v2 avec reprise par fichier et vérification sur la microSD."""
import argparse
from pathlib import Path
import time
import zlib

import serial

SD = Path(__file__).resolve().parent / "sd_files"
BLOCK = 512
ATTEMPTS = 3
SIZES = {
    **{f"{name}.raw": 320 * 480 * 2 for name in ("day", "dusk", "night")},
    "rosy.raw": 32 * 144 * 144 * 2,
    **{f"room_{name}.raw": 3 * 237 * 320 * 2 for name in ("eat", "play", "wash", "sleep", "pet")},
    "ui_full.raw": 320 * 480 * 2,
    "ui_care.raw": 320 * 480 * 2,
}


class ReceiverError(RuntimeError):
    pass


def send(port, command):
    data = (command + "\n").encode("ascii")
    if port.write(data) != len(data):
        raise OSError("Écriture série incomplète")


def receive(port, matches, seconds):
    deadline = time.monotonic() + seconds
    while time.monotonic() < deadline:
        reply = port.readline().decode("ascii", "replace").strip()
        if matches(reply):
            return reply
        if reply.startswith("ERR "):
            raise ReceiverError(reply)
    raise TimeoutError("délai de réponse dépassé")


def command(port, request, *answers, seconds=15):
    send(port, request)
    return receive(port, lambda reply: any(reply == answer for answer in answers), seconds)


def probe(port):
    command(port, "PING", "PONG", seconds=5)
    try:
        command(port, "HELLO", "PONYUSB 2", seconds=3)
    except TimeoutError:
        return False
    except ReceiverError as error:
        if str(error) == "ERR COMMAND":
            return False
        raise
    return True


def local_files():
    files = {}
    for name, size in SIZES.items():
        data = (SD / name).read_bytes()
        if len(data) != size:
            raise ValueError(f"{name} : {len(data)} octets au lieu de {size}")
        files[name] = data
    return files


def file_status(port, name, size, crc):
    send(port, f"STAT {name}")
    reply = receive(port, lambda line: line == f"MISSING {name}" or line.startswith(f"FILE {name} "), 40)
    return reply == f"FILE {name} {size} {crc:08x}"


def send_block(port, name, offset, block):
    next_offset = offset + len(block)
    ack = f"ACK {next_offset}"
    request = f"DATA {offset} {len(block)} {zlib.crc32(block):08x} {block.hex()}"
    reason = ""
    for attempt in range(1, ATTEMPTS + 1):
        # A newline terminates a potentially truncated previous frame.
        if attempt > 1:
            send(port, "")
        send(port, request)
        try:
            reply = receive(port, lambda line: line == ack or line.startswith(f"RETRY {offset} "), 8)
            if reply == ack:
                return
            reason = reply
        except TimeoutError as error:
            reason = str(error)
        print(f"    {name} à {offset:,} octets : {reason} ({attempt}/{ATTEMPTS})", flush=True)
    raise ReceiverError(f"BLOCK_RETRIES {name} {offset} {reason}")


def upload_file(port, name, data, crc):
    command(port, f"BEGIN {name} {len(data)} {crc:08x}", f"READY {BLOCK}")
    for offset in range(0, len(data), BLOCK):
        send_block(port, name, offset, data[offset:offset + BLOCK])
        if offset and offset % (256 * 1024) == 0:
            print(f"    {offset:,}/{len(data):,} octets", flush=True)
    command(port, "END", f"OK {name} {len(data)} {crc:08x}", seconds=45)


def transfer(port, files):
    checksums = {name: zlib.crc32(data) for name, data in files.items()}
    for index, (name, data) in enumerate(files.items(), 1):
        crc = checksums[name]
        print(f"[{index}/{len(files)}] {name} — {len(data):,} octets", flush=True)
        if file_status(port, name, len(data), crc):
            print("    Déjà validé sur la microSD, copie ignorée.", flush=True)
            continue
        for attempt in range(1, ATTEMPTS + 1):
            try:
                upload_file(port, name, data, crc)
                break
            except (ReceiverError, TimeoutError) as error:
                print(f"    {name} : {error} (essai fichier {attempt}/{ATTEMPTS})", flush=True)
                if attempt == ATTEMPTS:
                    raise
                # Resynchronize only if the same receiver still answers.
                send(port, "")
                command(port, "ABORT", "ABORTED", seconds=20)
                if file_status(port, name, len(data), crc):
                    break
        print(f"    OK {name} — CRC32 {crc:08x}", flush=True)

    for name, data in files.items():
        if not file_status(port, name, len(data), checksums[name]):
            raise ReceiverError(f"FINAL_VERIFY {name}")
    print(f"{len(files)}/{len(SIZES)} fichiers relus et vérifiés sur la microSD.", flush=True)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("port")
    parser.add_argument("--probe", action="store_true")
    args = parser.parse_args()
    try:
        files = local_files()
        with serial.Serial(baudrate=115200, timeout=0.25, write_timeout=20) as port:
            port.port = args.port
            port.dtr = False
            port.rts = False
            port.open()
            time.sleep(2)
            port.reset_input_buffer()
            if not probe(port):
                if args.probe:
                    print("Ancien récepteur USB détecté.")
                    return 3
                raise ReceiverError("le récepteur PonyGotchi USB v2 est requis")
            print("Récepteur PonyGotchi USB v2 détecté.", flush=True)
            if not args.probe:
                transfer(port, files)
    except (OSError, RuntimeError, ValueError) as error:
        parser.exit(1, f"Installation interrompue. {error}\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
