"""Regression: 54 concurrent lenses must never duplicate provenance fetches.

No change to selected observations, temporal alignment, source diversity or
error semantics; request-local tasks protect against stampedes only.
"""
import asyncio
from collections import Counter
from types import SimpleNamespace

import pytest

from analytics_service.config import Settings
from analytics_service.service import (
    AnalyticsService, ResolutionCache, _shared_resolution,
)


def test_identical_inflight_lookups_are_loaded_only_once():
    async def main():
        result_cache, tasks = {}, {}
        calls = 0
        async def loader():
            nonlocal calls
            calls += 1
            await asyncio.sleep(0.01)
            return {"provenance": "synthetic"}
        values = await asyncio.gather(*[
            _shared_resolution(result_cache, tasks, "WORLD_BANK", loader)
            for _ in range(54)
        ])
        assert calls == 1
        assert len(values) == 54
        assert all(value is values[0] for value in values)
        assert result_cache["WORLD_BANK"] is values[0]
    asyncio.run(main())


def test_not_found_none_is_cached_per_request_without_repeating_io():
    async def main():
        result_cache, tasks = {}, {}
        count = 0
        async def missing():
            nonlocal count
            count += 1
            await asyncio.sleep(0)
            return None
        values = await asyncio.gather(*[
            _shared_resolution(result_cache, tasks, ("SOURCE", "MISSING"), missing)
            for _ in range(54)
        ])
        value_after = await _shared_resolution(result_cache, tasks, ("SOURCE", "MISSING"), missing)
        assert all(value is None for value in values)
        assert value_after is None
        assert count == 1
    asyncio.run(main())


def test_failed_shared_dependency_remains_a_failure_not_a_fabricated_none():
    async def main():
        result_cache, tasks = {}, {}
        count = 0
        async def failure():
            nonlocal count
            count += 1
            await asyncio.sleep(0)
            raise RuntimeError("synthetic unavailable")
        results = await asyncio.gather(*[
            _shared_resolution(result_cache, tasks, "WORLD_BANK", failure)
            for _ in range(54)
        ], return_exceptions=True)
        assert count == 1
        assert all(isinstance(result, RuntimeError) for result in results)
        assert result_cache == {}
    asyncio.run(main())


def test_cancelling_one_lens_does_not_cancel_other_consumers():
    async def main():
        result_cache, tasks = {}, {}
        release = asyncio.Event()
        count = 0
        async def slow():
            nonlocal count
            count += 1
            await release.wait()
            return "VERIFIED"
        first = asyncio.create_task(_shared_resolution(result_cache, tasks, "S", slow))
        second = asyncio.create_task(_shared_resolution(result_cache, tasks, "S", slow))
        await asyncio.sleep(0.01)
        first.cancel()
        with pytest.raises(asyncio.CancelledError):
            await first
        release.set()
        assert await second == "VERIFIED"
        assert count == 1
    asyncio.run(main())


def test_54_concurrent_contexts_resolve_four_sources_datasets_and_runs_once_each():
    class FakeCatalog:
        def __init__(self):
            self.counts = Counter()

        async def get_source(self, code):
            self.counts[("source", code)] += 1
            await asyncio.sleep(0.005)
            return SimpleNamespace(code=code)

        async def get_source_dataset(self, source_code, dataset_code):
            self.counts[("dataset", source_code, dataset_code)] += 1
            await asyncio.sleep(0.005)
            return SimpleNamespace(code=dataset_code)

    class FakeTimeseries:
        def __init__(self):
            self.counts = Counter()

        async def list_source_runs(self, source_code, dataset_code, status, limit):
            self.counts[("run", source_code, dataset_code)] += 1
            await asyncio.sleep(0.005)
            return [SimpleNamespace(runKey="SYNTHETIC_R2")]

    async def main():
        catalog, timeseries = FakeCatalog(), FakeTimeseries()
        service = AnalyticsService(Settings(), catalog, timeseries)
        pairs = {
            ("WORLD_BANK", "WDI"),
            ("IMF", "IMF_PUBLIC_DATA"),
            ("OECD", "OECD_PUBLIC_DATA"),
            ("EUROSTAT", "EUROSTAT_PUBLIC_DATA"),
        }
        cache = ResolutionCache()
        contexts = await asyncio.gather(*[
            service._resolve_source_contexts(pairs, cache)
            for _ in range(54)
        ])
        assert len(contexts) == 54
        assert all(len(context) == 4 for context in contexts)
        assert sum(value for (op, *_), value in catalog.counts.items() if op == "source") == 4
        assert sum(value for (op, *_), value in catalog.counts.items() if op == "dataset") == 4
        assert sum(timeseries.counts.values()) == 4
        assert all(ctx.latest_run.runKey == "SYNTHETIC_R2" for ctx in contexts[0].values())
        assert len(cache.sources) == len(cache.datasets) == len(cache.latest_runs) == 4

        # New independent snapshot gets fresh observations, no cross-request cache.
        await service._resolve_source_contexts(pairs, ResolutionCache())
        assert sum(timeseries.counts.values()) == 8

    asyncio.run(main())
