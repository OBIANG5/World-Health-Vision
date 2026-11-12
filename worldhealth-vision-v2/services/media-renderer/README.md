# World-Vision Media Renderer

Asynchronous Remotion render worker for Media Studio.

- Remotion packages are pinned to exactly 4.0.542.
- One worker renders one job at a time by default.
- Increase `WHV_RENDER_CONCURRENCY` carefully or scale containers horizontally.
- The first bundle is cached in-process.
- Phase 1 previews are structural: they deliberately label unresolved real-media slots.
- Final asset composition, audio and voice-over are later increments.

Endpoints:

- `GET /health`
- `POST /api/media-renderer/jobs`
- `GET /api/media-renderer/jobs`
- `GET /api/media-renderer/jobs/:id`
- `GET /api/media-renderer/renders/:filename`
