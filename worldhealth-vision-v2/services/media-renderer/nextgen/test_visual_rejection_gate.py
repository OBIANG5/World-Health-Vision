#!/usr/bin/env python3
import json,sys,unittest
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'quality'))
import worldvision_visual_rejection_gate as gate

class VisualAcceptanceTests(unittest.TestCase):
    def setUp(self):
        self.legacy=json.loads((ROOT/'nextgen/rejected_episode_002.json').read_text(encoding='utf-8'))
    def test_reject_old_002_design_and_no_perceptual_claim(self):
        r=gate.review(self.legacy)
        self.assertEqual(r['status'],'REJECTED_DO_NOT_PUBLISH')
        self.assertGreaterEqual(len(r['errors']),8)
        self.assertFalse(r['aesthetic_signoff'])
        self.assertFalse(r['publishing_authorized'])
    def test_forbid_previous_script_functions(self):
        source='''W,H=720,1280
def topbar(draw,sec): pass
def footer(draw): pass
def make_tanker(): pass
def make_heritage(): pass
'''
        r=gate.review(self.legacy,source)
        for name in ('topbar','footer','make_tanker','make_heritage'):
            self.assertTrue(any(name in err for err in r['errors']))
    def test_prohibit_new_banners_even_with_rights(self):
        good={
            'format':{'width':1080,'height':1920,'fps':30},
            'source_canvas':[1080,1920],
            'format_name':'real_event_documentary',
            'topbar_enabled':False,'footer_enabled':False,
            'decorative_pills_enabled':False,
            'typography':{'max_headline_blocks_per_shot':1},
            'brand':{'outro':'worldvision-original-g0-graphite.mp4'},
            'voice':{'profile':'worldvision-vivienne-c52-impact-media'},
            'rights':{'all_footage_cleared':True},
            'review':{'watched_entire_final_video_on_phone':True},
            'delivery':{'permanent_video_url_verified':True}
        }
        self.assertEqual(gate.review(good)['status'],'TECHNICAL_PREFLIGHT_ONLY')
        good['topbar_enabled']=True
        self.assertEqual(gate.review(good)['status'],'REJECTED_DO_NOT_PUBLISH')

if __name__=='__main__':
    unittest.main()
