# World-Vision Media Service

Canonical V2 service for the World-Vision Media Studio.

Responsibilities:

- keep editorial story state;
- retain source provenance;
- calculate an explainable editorial opportunity score;
- expose human approval decisions;
- retain hooks and selected creative angle;
- expose dashboard counts for the Control Room.

This first slice intentionally uses an in-memory repository. Persistence, continuous
news ingestion, AI research, rendering, asset rights and publishing are separate
increments and must not be simulated as already implemented.

Run locally:

```bash
pip install -e '.[dev]'
uvicorn media_service.api:app --reload --port 8010
pytest -q
```
