#!/usr/bin/env python3
import copy,json,sys,tempfile,unittest
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/"scripts"))
import worldvision_episode_queue as queue
SOURCE=ROOT.parents[1]/"docs/media/editorial_candidates_2026-11-14.json"
# When cwd is services/media-renderer: ROOT.parents[1] -> worldhealth-vision-v2
class QueueTest(unittest.TestCase):
    def setUp(self):
        self.source=json.loads(SOURCE.read_text(encoding="utf8"))
    def test_3_independent_unpublishable_briefs(self):
        candidates=queue.validate(self.source)
        self.assertEqual(len(candidates),3)
        with tempfile.TemporaryDirectory() as d:
            from concurrent.futures import ThreadPoolExecutor
            with ThreadPoolExecutor(max_workers=3) as ex:
                results=list(ex.map(lambda e:queue.prepare(e,Path(d),self.source["user_locked"]),candidates))
            self.assertEqual(len({x["path"] for x in results}),3)
            for item in results:
                data=json.loads(Path(item["path"]).read_text())
                self.assertFalse(data["video_render_permitted"])
                self.assertFalse(data["TikTok_publication_permitted"])
                self.assertEqual(data["voice"],"fr-FR-VivienneMultilingualNeural")
                self.assertEqual(data["outro_background"],"graphite (acier clair)")
    def test_cannot_fake_footage_rights(self):
        x=copy.deepcopy(self.source)
        x["candidates"][0]["rights_gate"]="CLEARED"
        with self.assertRaises(ValueError):queue.validate(x)
    def test_no_wrong_voice_or_opaque_logo(self):
        x=copy.deepcopy(self.source)
        x["user_locked"]["voice"]="fr-FR-HenriNeural"
        with self.assertRaises(AssertionError):queue.validate(x)
        x=copy.deepcopy(self.source)
        x["user_locked"]["outro_background"]="midnight"
        with self.assertRaises(AssertionError):queue.validate(x)
    def test_no_missing_sources(self):
        x=copy.deepcopy(self.source)
        x["candidates"][1]["sources"]=[]
        with self.assertRaises(ValueError):queue.validate(x)
if __name__=="__main__":unittest.main()
