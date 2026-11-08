"""Send the Studio assets using the standalone or integrated USB receiver."""
import argparse
from pathlib import Path
import time

import serial

SD = Path(__file__).resolve().parent / "sd_files"
SIZES = {
    **{f"{name}.raw": 320 * 480 * 2 for name in ("day", "dusk", "night")},
    "rosy.raw": 32 * 144 * 144 * 2,
    **{f"room_{name}.raw": 3 * 237 * 320 * 2 for name in ("eat", "play", "wash", "sleep", "pet")},
    "ui_full.raw": 320 * 480 * 2,
    "ui_care.raw": 320 * 480 * 2,
}


def expect(port, expected, seconds=12):
    deadline = time.monotonic() + seconds
    while time.monotonic() < deadline:
        reply = port.readline().decode("utf-8", "replace").strip()
        if reply == expected:
            return
        if reply.startswith("ERR"):
            raise RuntimeError(f"ESP32 : {reply}")
    raise TimeoutError(f"Réponse absente : {expected}. Vérifier le port et le récepteur USB.")


def transfer(port, files):
    for index, file in enumerate(files, 1):
        size = SIZES[file.name]
        port.write(f"PUT {file.name} {size}\n".encode("ascii"))
        expect(port, "GO")
        print(f"[{index}/{len(files)}] {file.name} — {size:,} octets", flush=True)
        with file.open("rb") as payload:
            while block := payload.read(256):
                if port.write(block) != len(block):
                    raise RuntimeError(f"Écriture série incomplète : {file.name}")
        port.flush()
        expect(port, f"OK {file.name}", seconds=30)
        print(f"    OK {file.name}", flush=True)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("port")
    parser.add_argument("--probe", action="store_true", help="Vérifier PING/PONG sans modifier la carte")
    args = parser.parse_args()
    try:
        files = [SD / name for name in SIZES]
        for file in files:
            if file.stat().st_size != SIZES[file.name]:
                raise RuntimeError(f"Taille incorrecte : {file.name}")
        with serial.Serial(baudrate=115200, timeout=0.4, write_timeout=20) as port:
            port.port = args.port
            port.dtr = False
            port.rts = False
            port.open()
            time.sleep(2)
            port.reset_input_buffer()
            port.write(b"PING\n")
            expect(port, "PONG", seconds=5)
            print("Récepteur USB détecté (PONG).", flush=True)
            if not args.probe:
                transfer(port, files)
    except (OSError, RuntimeError) as error:
        parser.exit(1, f"Installation interrompue. {error}\n")
    if not args.probe:
        print("Les 11 ressources ont été confirmées par le récepteur.")


if __name__ == "__main__":
    main()
