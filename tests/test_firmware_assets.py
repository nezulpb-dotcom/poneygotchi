import importlib.util
from pathlib import Path
import struct
import tempfile
import unittest
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('assets',ROOT/'scripts/convert_firmware_assets.py')
assets=importlib.util.module_from_spec(spec);spec.loader.exec_module(assets)
class FirmwareAssets(unittest.TestCase):
    def test_validated_backgrounds_and_complete_sprite_bank(self):
        with tempfile.TemporaryDirectory() as folder:
            out=Path(folder);assets.build(out)
            self.assertEqual(len(list(out.glob('*.raw'))),35)
            for scene in ['day','dusk','night']:
                self.assertEqual((out/f'bg_{scene}.raw').stat().st_size,320*480*2)
            for file in (ROOT/'assets/ponies/rosy').glob('*.png'):
                self.assertEqual((out/(file.stem+'.raw')).stat().st_size,144*144*2)
    def test_rgb_order_transparency_and_dimensions(self):
        with tempfile.TemporaryDirectory() as folder:
            source=Path(folder)/'pixels.png';dest=Path(folder)/'pixels.raw'
            image=Image.new('RGBA',(3,1));image.putdata([(255,0,0,255),(0,255,0,255),(0,0,0,0)]);image.save(source)
            assets.convert(source,dest,(3,1))
            self.assertEqual(struct.unpack('<3H',dest.read_bytes()),(0xF800,0x07E0,0xF81F))
            with self.assertRaises(ValueError):assets.convert(source,dest,(1,3))
if __name__=='__main__':unittest.main()
