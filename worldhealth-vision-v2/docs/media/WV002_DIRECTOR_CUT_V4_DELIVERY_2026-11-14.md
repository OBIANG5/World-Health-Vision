# World-Vision — WV002 Director's Cut V4, 14 November 2026

**Status:** 39-second documentary-style review video successfully rendered, QA passed, NOT user-approved final publication.

## Stable iPhone preview

https://raw.githack.com/OBIANG5/World-Health-Vision/whv-media-studio-browser-preview/media-lab/reportages/worldvision-002-director-v4/index.html

MP4: https://raw.githack.com/OBIANG5/World-Health-Vision/whv-media-studio-browser-preview/media-lab/reportages/worldvision-002-director-v4/WORLD_VISION_002_DIRECTOR_CUT_V4.mp4

Final SHA-256: `520617c23644e29b6005ee7e35720b63806f631608c49d20e81d01d9d35fc382`.
Final file: 21,366,869 bytes, H.264 1080×1920 at 30 fps, **1170 frames / 39.0 s**; AAC 48kHz 39.019s.

## Changes actually delivered

- No repeated bottom archival captions; one non-decorative disclosure only on the intro shot: `Images d'archives USCG — pas celles de l'accident`.
- Original legitimate `DM Sans` typeface sourced from Google Fonts under the SIL OFL; loaded using Remotion `FontFace` and `staticFile`. **Never share the font bytes** in review downloads.
- No corner watermark/emoji, no fake cartoon crash, no tacky banner, no overlaid subtitle track.
- Headline font enlarged and the filmed image area expanded from 850 to 1130 px in the 1080×1920 composition.
- Original 2014 USCG shot reframed to remove the distracting baked-in old production credit, while keeping attribution in the accompanying player metadata and here.
- Human rescue images featured in multiple separate shots, 180 onboard and 32 hospitalized animated with Remotion easing.
- Kinetic headline timing aligned to narration boundary words: Mississippi ~4.264s, ~180 onboard 12.276s, rescue 16.514s, 32 hospitalized 21.179s, all accounted 25.776s, cause question 29.190s, investigation 33.323s.
- Same speech model as user-selected C5.2: `fr-FR-VivienneMultilingualNeural`. This is a **new** uninterrupted 35.904-second recording at **+5%** (user felt +8% slightly fast), not the original fixed C5.2 audio; source is versioned independently. No assembly of separate phrases.
- Original G0 eye/globe signature on approved light-steel/graphite background, silent final 90 frames.

## Actual sources — not the crash

US Coast Guard public-domain DVIDS footage IDs: 350155 (2014 port inspection), 445860 (2016 Mississippi aerial), 869071 (2022 rescue operation). These do **NOT** show the 13 November 2026 collision. The historic shots are used as clearly identified *contextual archives*, not event evidence. Original story facts are based on Associated Press and CBS, including roughly 180 passengers and crew, 32 hospitalized with no critical injuries and an ongoing investigation.

DO NOT caption this video as real filmed evidence of the November 13, 2026 impact. A future edit using the actual impact requires separately confirmed reuse permission or TikTok native Stitch/Collage, if enabled by the author. User does not want to submit rights applications.

## Technical evidence

Successful GitHub Actions render: https://github.com/OBIANG5/World-Health-Vision/actions/runs/43626292183

16 true encoded video frames inspected in `worldvision-002-v4-director-cut-39s-mp4-and-actual-review-frames` artifact. `worldvision_real_frame_audit.py` returned `READY_FOR_HUMAN_VISUAL_REVIEW`: no objective geometry/blank-frame errors, no motion warnings. Actual video is 39.0s, AAC audio 39.019s.

## Quality review observations and remaining limitations

- Frame 35 shows authentic port vessel shot and large DM Sans text with no baked source name.
- Rescue footage appears in the center through the 180/32 and rescue chapters. Due to archival source quality (some 720×480), it cannot match current high-resolution footage of the actual collision.
- This is better paced and much more kinetic than the 17.1s rejected film, but a programmatic video renderer cannot certify that the result is editorially compelling or aesthetically 9/10. User must watch full iPhone preview.
- Intro note alone does not replace per-clip clear attribution in the external TikTok caption. Provide full provenance and archival dates there.
- **Commercial licensing of the Edge-derived Vivienne voice is not yet confirmed**, and no TikTok publication was automated.

## Reuse across future projects

`src/director-v4/index.tsx` — reusable Remotion 9-scene editor with spring headlines/counters; CSS resets via `src/director-v4/style.css`. Narration via `scripts/worldvision_extended_vivienne_voice.py`. Assets/reproducible render and external preview via `.github/workflows/worldvision-002-director-v4-render.yml`. Approved G0 unchanged. A separate GH Actions asset job makes the original font and single-take voice and can be reused without another conversation.
