from media_service.wikimedia_assets import (
    _rights_status,
    parse_commons_search_response,
)


def test_rights_policy_auto_approves_cc_by_but_reviews_sharealike():
    cc_by, _ = _rights_status(
        "CC BY 4.0",
        "https://creativecommons.org/licenses/by/4.0/",
    )
    cc_by_sa, _ = _rights_status(
        "CC BY-SA 4.0",
        "https://creativecommons.org/licenses/by-sa/4.0/",
    )
    public_domain, _ = _rights_status(
        "Public domain",
        "https://creativecommons.org/publicdomain/mark/1.0/",
    )

    assert cc_by == "approved"
    assert cc_by_sa == "review_required"
    assert public_domain == "approved"


def test_commons_parser_preserves_file_provenance_and_attribution():
    payload = {
        "query": {
            "pages": [
                {
                    "pageid": 42,
                    "title": "File:Libreville skyline.jpg",
                    "imageinfo": [
                        {
                            "url": "https://upload.wikimedia.org/example/libreville.jpg",
                            "thumburl": "https://upload.wikimedia.org/example/1080px-libreville.jpg",
                            "mime": "image/jpeg",
                            "mediatype": "BITMAP",
                            "extmetadata": {
                                "Artist": {"value": "<b>Jane Doe</b>"},
                                "LicenseShortName": {"value": "CC BY 4.0"},
                                "LicenseUrl": {
                                    "value": "https://creativecommons.org/licenses/by/4.0/"
                                },
                                "Credit": {"value": "Wikimedia Commons"},
                            },
                        }
                    ],
                }
            ]
        }
    }

    assets = parse_commons_search_response(
        payload,
        query="Libreville Gabon",
    )

    assert len(assets) == 1
    asset = assets[0]
    assert asset.rights_status == "approved"
    assert asset.author == "Jane Doe"
    assert asset.license_name == "CC BY 4.0"
    assert "Jane Doe" in asset.attribution
    assert asset.thumbnail_url.endswith("1080px-libreville.jpg")
    assert asset.source_page_url.startswith("https://commons.wikimedia.org/wiki/File:")


def test_commons_parser_ignores_non_image_media():
    payload = {
        "query": {
            "pages": [
                {
                    "title": "File:Audio.ogg",
                    "imageinfo": [
                        {
                            "url": "https://upload.wikimedia.org/example/audio.ogg",
                            "mime": "audio/ogg",
                            "extmetadata": {},
                        }
                    ],
                }
            ]
        }
    }

    assert parse_commons_search_response(payload, query="audio") == []



def test_commons_parser_accepts_supported_webm_video():
    payload = {
        "query": {
            "pages": [
                {
                    "pageid": 77,
                    "title": "File:Libreville street.webm",
                    "imageinfo": [
                        {
                            "url": "https://upload.wikimedia.org/example/libreville.webm",
                            "thumburl": "https://upload.wikimedia.org/example/libreville-video.jpg",
                            "mime": "video/webm",
                            "mediatype": "VIDEO",
                            "extmetadata": {
                                "Artist": {"value": "Video Author"},
                                "LicenseShortName": {"value": "CC BY 4.0"},
                                "LicenseUrl": {
                                    "value": "https://creativecommons.org/licenses/by/4.0/"
                                },
                            },
                        }
                    ],
                }
            ]
        }
    }

    assets = parse_commons_search_response(
        payload,
        query="Libreville street",
        requested_kind="video",
    )

    assert len(assets) == 1
    asset = assets[0]
    assert asset.kind == "video"
    assert asset.mime_type == "video/webm"
    assert asset.rights_status == "approved"
    assert asset.media_url.endswith(".webm")


def test_commons_parser_rejects_unsupported_ogg_video():
    payload = {
        "query": {
            "pages": [
                {
                    "title": "File:Legacy video.ogv",
                    "imageinfo": [
                        {
                            "url": "https://upload.wikimedia.org/example/legacy.ogv",
                            "mime": "video/ogg",
                            "mediatype": "VIDEO",
                            "extmetadata": {},
                        }
                    ],
                }
            ]
        }
    }

    assert parse_commons_search_response(
        payload,
        query="legacy",
        requested_kind="video",
    ) == []
