#!/usr/bin/env python3
"""Offline tests that prevent fake voice improvements and spurious splice edits."""
import json
import sys
import tempfile
import unittest
import wave
from pathlib import Path
import numpy as np

ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/"scripts"))
import worldvision_voice_continuous_v2 as speech

class ContinuousAudioTests(unittest.TestCase):
    def test_one_utterance_same_text_all_voices(self):
        meta=json.loads((ROOT/"nextgen/continuous_v2_sample.json").read_text())
        text=speech.validate_script(meta)
        self.assertTrue(text.startswith("Imaginez"))
        self.assertEqual(len(speech.VOICES),3)
        self.assertEqual(len({x["voice"] for x in speech.VOICES.values()}),3)
        self.assertEqual(speech.VOICES["vivienne_continuous"]["voice"],
                         "fr-FR-VivienneMultilingualNeural")
    def test_prevent_publishing_and_empty_text(self):
        meta=json.loads((ROOT/"nextgen/continuous_v2_sample.json").read_text())
        meta["publication_authorized"]=True
        with self.assertRaises(ValueError):
            speech.validate_script(meta)
        meta["publication_authorized"]=False
        meta["script"]="OK."
        with self.assertRaises(ValueError):
            speech.validate_script(meta)
    def test_silence_splice_removes_pause_without_speech(self):
        fs=48000
        def sine(seconds):
            n=int(seconds*fs)
            idx=np.arange(n,dtype=np.float64)
            # 1kHz at 0.26 full scale
            return (np.sin(idx*2*np.pi*1000/fs)*8500).astype("<i2")
        samples=np.concatenate([
            sine(.41),np.zeros(int(.38*fs),dtype="<i2"),sine(.43)
        ])
        with tempfile.TemporaryDirectory() as d:
            src=Path(d)/"src.wav"
            dst=Path(d)/"out.wav"
            with wave.open(str(src),"wb") as w:
                w.setnchannels(1);w.setsampwidth(2);w.setframerate(fs)
                w.writeframes(samples.tobytes())
            proof=speech.tighten_gap_wav(src,dst,target_seconds=.145,min_silence=.23)
            self.assertGreater(proof["removed_duration_sec"],.14)
            self.assertEqual(proof["surgical_cuts"],1)
            with wave.open(str(dst),"rb") as w:
                arr=np.frombuffer(w.readframes(w.getnframes()),dtype="<i2")
            # Neither tone is time-stretched, and the first samples are identical.
            self.assertTrue(np.array_equal(arr[:int(fs*.30)],samples[:int(fs*.30)]))
            self.assertTrue(np.array_equal(arr[-int(fs*.30):],samples[-int(fs*.30):]))
    def test_no_edit_to_quiet_short_valid_pause(self):
        fs=48000
        samples=np.zeros(int(.18*fs),dtype="<i2")
        with tempfile.TemporaryDirectory() as d:
            a=Path(d)/"a.wav";b=Path(d)/"b.wav"
            with wave.open(str(a),"wb") as w:
                w.setnchannels(1);w.setsampwidth(2);w.setframerate(fs);w.writeframes(samples.tobytes())
            p=speech.tighten_gap_wav(a,b)
            self.assertEqual(p["surgical_cuts"],0)

if __name__=="__main__":
    unittest.main()
