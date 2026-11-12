from media_service.radar import (
    _extract_output_text,
    _extract_retrieved_urls,
    canonical_url,
)
from media_service.source_registry import resolve_source


def test_canonical_url_removes_tracking_query_and_www():
    assert (
        canonical_url("https://www.reuters.com/world/test-story/?utm_source=x#top")
        == "https://reuters.com/world/test-story"
    )


def test_canonical_url_survives_invalid_port_without_crashing():
    raw = "https://example.org:not-a-port/story"
    assert canonical_url(raw) == raw


def test_registered_source_resolves_subdomains():
    source = resolve_source("https://www.agpgabon.ga/politique/exemple")
    assert source is not None
    assert source.id == "agp-gabon"
    assert source.scope == "local"
    assert source.country_iso3 == "GAB"


def test_retrieved_urls_are_extracted_from_search_sources_and_citations():
    payload = {
        "output": [
            {
                "type": "web_search_call",
                "action": {
                    "sources": [
                        {
                            "url": "https://www.reuters.com/world/example/?utm_source=test"
                        }
                    ]
                },
            },
            {
                "type": "message",
                "content": [
                    {
                        "type": "output_text",
                        "text": '{"candidates":[]}',
                        "annotations": [
                            {
                                "type": "url_citation",
                                "url": "https://agpgabon.ga/actualite/test/",
                            }
                        ],
                    }
                ],
            },
        ]
    }

    urls = _extract_retrieved_urls(payload)

    assert "https://reuters.com/world/example" in urls
    assert "https://agpgabon.ga/actualite/test" in urls


def test_output_text_fallback_reads_message_content():
    payload = {
        "output": [
            {
                "type": "message",
                "content": [
                    {"type": "output_text", "text": '{"candidates":[]}'}
                ],
            }
        ]
    }

    assert _extract_output_text(payload) == '{"candidates":[]}'
