#!/usr/bin/env python3
"""Fast tests for actual-frame QC math without inventing event imagery."""
import sys,unittest
from pathlib import Path
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/"quality"))
import worldvision_real_frame_audit as q

class FrameAuditTests(unittest.TestCase):
    def test_times_include_ending(self):
        t=q.times(30.0,12)
        self.assertEqual(len(t),12)
        self.assertGreater(t[-1],27.0)
        self.assertTrue(all(a<b for a,b in zip(t,t[1:])))
    def test_no_illegal_counts(self):
        for num in (0,1,2,33):
            with self.assertRaises(ValueError):q.times(10,num)
    def test_blank_detection_is_diagnostic_only(self):
        frames=[Image.new("RGB",(100,100),(0,0,0)),
                Image.new("RGB",(100,100),(220,232,243))]
        stats,motions=q.bright_and_motion_stats(frames)
        self.assertTrue(stats[0]["possibly_blank"])
        self.assertFalse(stats[1]["possibly_blank"])
        self.assertGreater(motions[0],100)
    def test_dark_but_visible_branded_scene_not_automatically_blank(self):
        frame=Image.new("RGB",(100,100),(8,26,49))
        stats,motions=q.bright_and_motion_stats([frame])
        self.assertFalse(stats[0]["possibly_blank"])
        self.assertEqual(motions,[])
if __name__=="__main__":unittest.main()
