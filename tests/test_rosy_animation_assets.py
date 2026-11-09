"""Hardware-independent checks for PonyGotchi's CrowPanel Rosy animation.

Run: python tests/test_rosy_animation_assets.py
These checks are NOT a firmware build or physical-display validation.
"""
from pathlib import Path
import unittest
import zlib

ROOT = Path(__file__).resolve().parents[1]
INO = ROOT / "CrowPanel" / "PonyGotchi_Studio_CrowPanel" / "PonyGotchi_Studio_CrowPanel.ino"
RAW = ROOT / "CrowPanel" / "sd_files" / "rosy.raw"
WIDTH = HEIGHT = 144
FRAMES = 32
BYTES_PER_FRAME = WIDTH * HEIGHT * 2
STATE_NAMES = ("idle", "walk", "blink", "happy", "eat", "sleep", "sad", "wash")


class RosyAnimationChecks(unittest.TestCase):
    def test_sprite_size_and_offsets(self):
        self.assertTrue(RAW.exists(), "rosy.raw must be present")
        data = RAW.read_bytes()
        self.assertEqual(len(data), FRAMES * BYTES_PER_FRAME)
        for state in range(8):
            for frame in range(4):
                offset = (state * 4 + frame) * BYTES_PER_FRAME
                self.assertEqual(len(data[offset:offset + BYTES_PER_FRAME]), BYTES_PER_FRAME)

    def test_moving_states_are_not_identical(self):
        data = RAW.read_bytes()
        for state in (0, 1, 2, 3, 4, 7):
            with self.subTest(state=STATE_NAMES[state]):
                checksums = {
                    zlib.crc32(data[(state * 4 + frame) * BYTES_PER_FRAME:
                                    (state * 4 + frame + 1) * BYTES_PER_FRAME])
                    for frame in range(4)
                }
                self.assertGreater(len(checksums), 1, "static state has no animation")
        # Historical sleep/sad art may have duplicated frames.
        # An art upgrade is separate from this firmware bug fix.

    def test_firmware_fallback_and_serial_diagnostics(self):
        src = INO.read_text(encoding="utf-8")
        self.assertIn("now-lastFrame>=175)", src)
        self.assertNotIn("now-lastFrame>=175&&comp", src)
        self.assertIn("stripe[W*8]", src)
        self.assertIn("[ANIM] page=", src)
        self.assertIn("[ANIM ERR]", src)
        self.assertIn("rosy.raw has wrong length", src)
        self.assertIn("if(frameOk)lastPetX=petX", src)


if __name__ == "__main__":
    unittest.main()
