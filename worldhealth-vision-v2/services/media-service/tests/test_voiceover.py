import wave

from media_service.voiceover import (
    _write_pcm_wav,
    transcript_match_score,
)


def test_transcript_match_score_is_exact_for_same_script():
    script = "Le Gabon compte 3 518 621 habitants."

    assert transcript_match_score(script, script) == 100


def test_transcript_match_tolerates_case_accents_and_punctuation():
    expected = "À Libreville, l'actualité évolue très vite."
    actual = "A Libreville l actualite evolue tres vite"

    assert transcript_match_score(expected, actual) >= 95


def test_write_pcm_wav_preserves_expected_duration(tmp_path):
    # 24 kHz, mono, signed 16-bit PCM => 48,000 bytes for exactly one second.
    pcm = bytes(24_000 * 2)
    output = tmp_path / "voice.wav"

    duration = _write_pcm_wav(pcm, output)

    assert duration == 1.0
    assert output.exists()

    with wave.open(str(output), "rb") as reader:
        assert reader.getnchannels() == 1
        assert reader.getsampwidth() == 2
        assert reader.getframerate() == 24_000
        assert reader.getnframes() == 24_000
