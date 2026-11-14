# WV002 — DOCUMENTARY ARCHIVE DELIVERY — 14 NOVEMBER 2026

STATUS: Complete 17.1-second REVIEW FILM, NOT approved as a commercial or visually final master.
Working branch: production/worldvision-002-authentic-archives-documentary-2026-11-14.

## Confirmed outputs

iPhone player: https://raw.githack.com/OBIANG5/World-Health-Vision/whv-media-studio-browser-preview/media-lab/reportages/worldvision-002-archives/index.html
Permanent MP4: https://raw.githack.com/OBIANG5/World-Health-Vision/whv-media-studio-browser-preview/media-lab/reportages/worldvision-002-archives/WORLD_VISION_002_ARCHIVES_REAL_FILM_17s.mp4
Actual final Git blob SHA: 387fb753ff754fbc6f1586bdf7e51994d6c89f3c
Actual final SHA-256: 8a1df38bfbf7d6c0fa7c6c0141ad2aaac9cb915cc4ba664bfb32d73c0c71064b

Verified local FFprobe after artifact retrieval: true VIDEO stream 17.100 seconds, 513 video frames, H.264 1080x1920 @ 30fps; AAC 17.100 seconds. Video and format durations agree. MP4 7,535,423 bytes. Approved Vivienne C5.2 original 14.088s audio, original transparent G0 official steel-light outro 90 frames, no narrated slogan.

## Exact DVIDS public-domain source provenance

1. ID 350155, 10 July 2014, New Orleans, public-domain USCG port ship inspection, 720x406: https://www.dvidshub.net/video/350155/upon-further-inspection
2. ID 445860, 11 January 2016, aerial real Mississippi near Baton Rouge, USCG public domain, 1920x1080: https://www.dvidshub.net/video/445860/b-roll-footage-mississippi-river-near-baton-rouge
3. ID 869071, 20 December 2022, Southwest Pass Louisiana, USCG public-domain tanker helicopter medevac from a DIFFERENT incident, 720x480: https://www.dvidshub.net/video/869071/coast-guard-medevacs-crewmember-tanker-vessel-offshore-southwest-pass-la

These archival shots DO NOT show the November 13, 2026 collision. Each segment displays its true archival year and the 2022 segment explicitly says it concerns another operation. Do not call the montage real collision footage. Never present DVIDS as granting rights over unrelated WDSU/Reuters or TikTok clips. Some source video is lower resolution than the native 1080x1920 composition.

## Technical improvements relative to user-rejected video

No amateur vector boat crash, toy ship drawing, simulated sinking, decorative topbar/footer, corner logo stickers, overlapping subtitles or generic 'location' label. Factual headlines are brief, and numerical 32 treatment is restrained. Native 1080x1920 composition uses cropped sharp archive video over feather-blurred extension. The original approved G0 design is preserved. No changes to approved Vivienne voice.

GitHub Actions source probe: https://github.com/OBIANG5/World-Health-Vision/actions/runs/43619418262
USCG source acquisition: https://github.com/OBIANG5/World-Health-Vision/actions/runs/43619670006
**Successful final 513-frame render and phone preview:** https://github.com/OBIANG5/World-Health-Vision/actions/runs/43621257577

## Production safeguards proven by real failures

The first test MP4 had a format duration of 17.1s but a VIDEO track of only 14.1s / 423 frames, so the official 3s outro was missing. Cause: combining incompatible H.264 streams using concat demuxer and -c copy. Fixed by re-encoding the concatenation and blocking delivery unless the VIDEO track itself is 513 frames / 17.1s. A 16.5s frame was separately extracted to confirm the G0 ending.

The first opening shot from DVIDS had a large USCG lower-third credit baked into the archival footage, contrary to the user-approved style. Fixed by cropping the upper 70% of the original 2014 source before compositing, preserving the ship and avoiding masking stickers.

Another iteration failed with a Python syntax error in the renderer AFTER downloading 90MB of archives. The workflow now runs py_compile before downloading footage to fail fast and save time.

## Reproducible code

- services/media-renderer/scripts/worldvision_probe_archive.py: metadata/provenance.
- services/media-renderer/scripts/worldvision_download_dvids.py: only DVIDS clips marked public domain, manifest and genuine shot contact sheets.
- services/media-renderer/scripts/worldvision_002_true_archives_render.py: native 1080 vertical multi-shot edit, exact C5.2 and G0, hard frame-count gate.
- .github/workflows/worldvision-002-render-authentic-documentary.yml: build, FFprobe, full decode, 12 genuine frame captures, upload and permanent GitHack iPhone player.

## Remaining limitations (NOT waived)

User must judge full visual experience on iPhone; an automated successful encode is NOT an aesthetic 9/10 certification. Original event impact footage not present. Edge-TTS commercial audio rights not verified. No TikTok auto-publishing. If user demands the actual incident footage with no licensing requests, check whether official TikTok Stitch/Collage is available for the verified original post, or change to a different news story with authentic event footage explicitly licensed for reuse.
