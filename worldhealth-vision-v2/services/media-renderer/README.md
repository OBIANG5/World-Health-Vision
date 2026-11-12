# World-Vision Media Renderer

Asynchronous Remotion render worker for Media Studio.

- Remotion packages are pinned to exactly 4.0.542.
- One worker renders one job at a time by default.
- Increase `WHV_RENDER_CONCURRENCY` carefully or scale containers horizontally.
- The first bundle is cached in-process.
- The Remotion composition supports selected licensed imagery, attribution and QA-checked AI voice-over.
- Scenes lacking approved real-media assets remain explicitly unresolved rather than fabricated.
- Two render profiles exist: `canonical_newsroom_v1` (branded) and
  `tiktok_api_clean_v1` (separate export; not proof of platform approval).
- Completed jobs expose `output_sha256` and a browser-streamable H.264 MP4.
- Full production readiness still requires persistent queue storage, rendered-frame visual QA,
  loudness normalization, approved publishing connectors and deployed infrastructure.

Endpoints:

- `GET /health`
- `POST /api/media-renderer/jobs`
- `GET /api/media-renderer/jobs`
- `GET /api/media-renderer/jobs/:id`
- `GET /api/media-renderer/renders/:filename`
