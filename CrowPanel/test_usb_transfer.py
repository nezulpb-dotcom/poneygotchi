"""Exercise the host transfer with real assets and simulated receiver faults."""
from collections import deque
from contextlib import redirect_stdout
from io import StringIO
import unittest
from unittest.mock import patch
import zlib

import envoyer_tout as sender


class Receiver:
    def __init__(self, files=None, corrupt_final=False):
        self.files = dict(files or {})
        self.replies = deque()
        self.begins = []
        self.aborts = 0
        self.retry_crc = False
        self.drop_ack = False
        self.disk_error = False
        self.fail_every_write = False
        self.corrupt_final = corrupt_final

    def write(self, wire):
        parts = wire.decode().split()
        if parts:
            self.handle(*parts)
        return len(wire)

    def reply(self, line):
        self.replies.append((line + "\r\n").encode())

    def readline(self):
        return self.replies.popleft() if self.replies else b""

    def handle(self, action, *args):
        if action == "STAT":
            name = args[0]
            if name in self.files:
                data = self.files[name]
                self.reply(f"FILE {name} {len(data)} {zlib.crc32(data):08x}")
            else:
                self.reply(f"MISSING {name}")
        elif action == "BEGIN":
            self.name, size, crc = args
            self.expected_size = int(size)
            self.expected_crc = int(crc, 16)
            self.begins.append(self.name)
            self.data = bytearray()
            self.reply("READY 512")
        elif action == "DATA":
            offset, length, crc, payload = args
            offset, length = int(offset), int(length)
            block = bytes.fromhex(payload)
            assert length == len(block) <= 512
            assert int(crc, 16) == zlib.crc32(block)
            if offset == 512 and self.retry_crc:
                self.retry_crc = False
                self.reply("RETRY 512 CRC")
                return
            if self.fail_every_write or (offset == 8192 and self.disk_error):
                self.disk_error = False
                self.reply(f"ERR SD_WRITE {self.name} {offset}")
                return
            if offset == len(self.data):
                self.data.extend(block)
            else:
                assert offset + length == len(self.data) and self.data[offset:] == block
            if offset == 1024 and self.drop_ack:
                self.drop_ack = False
                return
            self.reply(f"ACK {len(self.data)}")
        elif action == "END":
            data = bytes(self.data)
            assert len(data) == self.expected_size
            assert zlib.crc32(data) == self.expected_crc
            self.files[self.name] = data[:-1] if self.corrupt_final else data
            self.reply(f"OK {self.name} {len(data)} {self.expected_crc:08x}")
        elif action == "ABORT":
            self.aborts += 1
            self.reply("ABORTED")
        else:
            raise AssertionError(action)


class TransferTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.files = sender.local_files()

    def test_large_asset_retry_and_resume(self):
        self.assertEqual(len(self.files["rosy.raw"]), 1_327_104)
        existing = {name: self.files[name] for name in ("day.raw", "dusk.raw", "night.raw")}
        receiver = Receiver(existing)
        receiver.retry_crc = receiver.drop_ack = receiver.disk_error = True
        clock = iter(range(1_000_000))
        with redirect_stdout(StringIO()), patch.object(sender.time, "monotonic", lambda: next(clock)):
            sender.transfer(receiver, self.files)
        self.assertEqual(receiver.files, self.files)
        self.assertEqual(receiver.begins.count("rosy.raw"), 2)
        self.assertEqual(receiver.aborts, 1)
        self.assertTrue(existing.keys().isdisjoint(receiver.begins))

    def test_final_readback_rejects_truncated_file(self):
        with redirect_stdout(StringIO()), self.assertRaisesRegex(sender.ReceiverError, "FINAL_VERIFY rosy.raw"):
            sender.transfer(Receiver(corrupt_final=True), {"rosy.raw": self.files["rosy.raw"]})

    def test_persistent_sd_failure_is_reported_and_retries_are_bounded(self):
        receiver = Receiver()
        receiver.fail_every_write = True
        with redirect_stdout(StringIO()), self.assertRaisesRegex(sender.ReceiverError, "SD_WRITE rosy.raw 0"):
            sender.transfer(receiver, {"rosy.raw": self.files["rosy.raw"]})
        self.assertEqual(receiver.begins, ["rosy.raw"] * 3)
        self.assertFalse(receiver.files)


if __name__ == "__main__":
    unittest.main()
