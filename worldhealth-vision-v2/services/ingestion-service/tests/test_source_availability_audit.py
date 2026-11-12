"""Official-site monitoring smoke tests: never confuse host health with truth."""

import httpx
import pytest

from ingestion_service.source_availability_audit import (
    approved_https_url,
    load_registered_country_sources,
    probe_homepage,
    run_country_source_availability_audit,
)


def test_only_code_reviewed_https_public_hosts_are_eligible():
    assert approved_https_url("https://www.beac.int/")
    assert approved_https_url("https://www.nigerianstat.gov.ng/")
    assert not approved_https_url("http://www.beac.int/")
    assert not approved_https_url("https://www.beac.int.evil.test/")
    assert not approved_https_url("https://127.0.0.1/")
    assert not approved_https_url("https://localhost/")
    assert not approved_https_url("https://user:pass@www.beac.int/")
    assert not approved_https_url("https://www.beac.int:444/")
    assert not approved_https_url("file:///etc/passwd")
    assert not approved_https_url("https://[::1]/")


def test_head_only_never_downloads_or_parses_official_homepages():
    requests = []

    def handler(request):
        requests.append(request)
        return httpx.Response(200, headers={"ETag": '"possibly-dynamic-site-etag"'})

    with httpx.Client(transport=httpx.MockTransport(handler)) as client:
        result = probe_homepage("https://www.beac.int/", client)
    assert result["status"] == "SITE_RESPONDED"
    assert result["httpStatus"] == 200
    assert len(requests) == 1
    assert requests[0].method == "HEAD"
    assert requests[0].url.host == "www.beac.int"


@pytest.mark.parametrize(
    ("http_status", "expected"),
    [
        (401, "ACCESS_RESTRICTED"),
        (403, "ACCESS_RESTRICTED"),
        (429, "RATE_LIMITED"),
        (405, "HEAD_NOT_SUPPORTED"),
        (501, "HEAD_NOT_SUPPORTED"),
        (503, "UPSTREAM_ERROR"),
        (404, "HTTP_UNEXPECTED"),
    ],
)
def test_http_response_classes_are_not_mislabeled_as_missing_economic_data(
    http_status, expected
):
    with httpx.Client(
        transport=httpx.MockTransport(lambda request: httpx.Response(http_status))
    ) as client:
        result = probe_homepage("https://www.census.gov/", client)
    assert result["status"] == expected
    assert result["httpStatus"] == http_status


def test_redirect_is_not_followed_or_sent_to_unreviewed_external_domains():
    requests = []

    def handler(request):
        requests.append(request)
        return httpx.Response(
            302, headers={"Location": "https://unreviewed-portal.example/private"}
        )

    with httpx.Client(
        transport=httpx.MockTransport(handler), follow_redirects=True
    ) as client:
        result = probe_homepage("https://www.beac.int/", client)
    assert result["status"] == "REDIRECT_REVIEW_REQUIRED"
    assert result["redirectTarget"] is None
    assert len(requests) == 1, "redirect must not be visited"


def test_safe_redirect_target_is_reported_not_auto_followed():
    with httpx.Client(
        transport=httpx.MockTransport(
            lambda request: httpx.Response(301, headers={"Location": "/fr/"})
        )
    ) as client:
        result = probe_homepage("https://www.beac.int/", client)
    assert result["status"] == "REDIRECT_REVIEW_REQUIRED"
    assert result["redirectTarget"] == "https://www.beac.int/fr/"


def test_unapproved_catalog_url_makes_zero_public_network_requests():
    def reject_public_request(request):
        raise AssertionError(f"unexpected public request to {request.url}")

    with httpx.Client(transport=httpx.MockTransport(reject_public_request)) as client:
        result = probe_homepage("https://10.0.0.1/metadata", client)
    assert result["status"] == "UNAPPROVED_HOST"


def catalog_routes(request: httpx.Request) -> httpx.Response:
    if request.url.path == "/api/catalog/local-sources/coverage":
        return httpx.Response(200, json={
            "totalCountryCount": 3,
            "items": [
                {"countryIso3": "GAB", "listedSourceCount": 2},
                {"countryIso3": "CMR", "listedSourceCount": 1},
                {"countryIso3": "JPN", "listedSourceCount": 0},
            ],
        })
    if request.url.path.endswith("/GAB/local-context"):
        return httpx.Response(200, json={
            "countryIso3": "GAB",
            "localSources": [
                {"sourceCode": "INSTAT_GABON", "homepageUrl": "https://new.instatgabon.org/fr",
                 "displayName": "INSTAT Gabon", "sourceType": "NATIONAL_OFFICIAL",
                 "connectionState": "CATALOG_ONLY"},
                {"sourceCode": "BEAC_CEMAC", "homepageUrl": "https://www.beac.int/",
                 "displayName": "BEAC", "sourceType": "REGIONAL_OFFICIAL",
                 "connectionState": "CATALOG_ONLY"},
            ],
        })
    if request.url.path.endswith("/CMR/local-context"):
        return httpx.Response(200, json={
            "countryIso3": "CMR",
            "localSources": [
                {"sourceCode": "BEAC_CEMAC", "homepageUrl": "https://www.beac.int/",
                 "displayName": "BEAC", "sourceType": "REGIONAL_OFFICIAL",
                 "connectionState": "CATALOG_ONLY"},
            ],
        })
    return httpx.Response(404)


def test_shared_regional_bank_is_probed_once_and_preserves_each_country():
    public_calls = []

    def sites(request):
        public_calls.append(request)
        return httpx.Response(200)

    with (
        httpx.Client(base_url="http://catalog.test",
                     transport=httpx.MockTransport(catalog_routes)) as catalog,
        httpx.Client(transport=httpx.MockTransport(sites)) as public,
    ):
        audit = run_country_source_availability_audit(catalog, public)

    assert audit["auditType"] == "COUNTRY_SOURCE_HOME_PAGE_AVAILABILITY_ONLY"
    assert audit["uniqueOrganizationCount"] == 2
    assert audit["applicableCountryCount"] == 2
    assert audit["statusCounts"] == {"SITE_RESPONDED": 2}
    assert len(public_calls) == 2
    assert all(call.method == "HEAD" for call in public_calls)
    by_source = {record["sourceCode"]: record for record in audit["checks"]}
    assert by_source["BEAC_CEMAC"]["countryIso3s"] == ["CMR", "GAB"]
    assert by_source["INSTAT_GABON"]["countryIso3s"] == ["GAB"]
    assert audit["checks"][0]["connectionState"] == "CATALOG_ONLY"
    assert any("not evidence of a new published report" in note for note in audit["limitations"])


def test_country_catalog_does_not_silently_scan_a_partial_page():
    def partial(request):
        return httpx.Response(200, json={
            "totalCountryCount": 4,
            "items": [{"countryIso3": "GAB", "listedSourceCount": 2}],
        })

    with httpx.Client(
        base_url="http://catalog.test",
        transport=httpx.MockTransport(partial),
    ) as client:
        with pytest.raises(ValueError, match="incomplete"):
            load_registered_country_sources(client)


def test_contradictory_shared_source_homepages_are_not_silently_merged():
    def contradictory(request):
        if request.url.path.endswith("/CMR/local-context"):
            return httpx.Response(200, json={
                "countryIso3": "CMR",
                "localSources": [{
                    "sourceCode": "BEAC_CEMAC",
                    "homepageUrl": "https://unreviewed.example",
                    "sourceType": "REGIONAL_OFFICIAL",
                }],
            })
        return catalog_routes(request)

    with httpx.Client(
        base_url="http://catalog.test",
        transport=httpx.MockTransport(contradictory),
    ) as client:
        with pytest.raises(ValueError, match="contradictory"):
            load_registered_country_sources(client)


def test_catalogue_outage_is_not_misrepresented_as_all_sites_down():
    with (
        httpx.Client(
            base_url="http://catalog.test",
            transport=httpx.MockTransport(lambda request: httpx.Response(502)),
        ) as catalog,
        httpx.Client(
            transport=httpx.MockTransport(
                lambda request: (_ for _ in ()).throw(AssertionError("no probes"))
            ),
        ) as public,
    ):
        with pytest.raises(httpx.HTTPStatusError):
            run_country_source_availability_audit(catalog, public)


def test_timeout_is_a_network_state_not_evidence_a_statistic_is_missing():
    def timeout(request):
        raise httpx.ReadTimeout("official homepage did not answer HEAD", request=request)

    with httpx.Client(transport=httpx.MockTransport(timeout)) as client:
        result = probe_homepage("https://www.census.gov/", client)
    assert result == {
        "status": "TIMEOUT", "httpStatus": None, "redirectTarget": None,
    }


def test_transport_error_is_not_confused_with_website_http_status():
    def failed_connection(request):
        raise httpx.ConnectError("temporary connection refused", request=request)

    with httpx.Client(transport=httpx.MockTransport(failed_connection)) as client:
        result = probe_homepage("https://www.bea.gov/", client)
    assert result["status"] == "TRANSPORT_ERROR"
    assert result["httpStatus"] is None


def test_unapproved_redirect_with_credentials_or_custom_port_is_not_followed():
    for target in (
        "https://user:secret@www.beac.int/",
        "https://www.beac.int:8443/restricted",
        "http://www.beac.int/",
    ):
        network_requests = []

        def redirected(request):
            network_requests.append(request)
            return httpx.Response(302, headers={"Location": target})

        with httpx.Client(
            transport=httpx.MockTransport(redirected),
            follow_redirects=True,
        ) as client:
            result = probe_homepage("https://www.beac.int/", client)
        assert result["status"] == "REDIRECT_REVIEW_REQUIRED"
        assert result["redirectTarget"] is None
        assert len(network_requests) == 1


def test_scope_limit_blocks_unbounded_site_scanning_before_any_public_probe():
    def many_sources(request: httpx.Request):
        if request.url.path.endswith("/local-sources/coverage"):
            return httpx.Response(200, json={
                "totalCountryCount": 1,
                "items": [{"countryIso3": "GAB", "listedSourceCount": 41}],
            })
        return httpx.Response(200, json={
            "countryIso3": "GAB",
            "localSources": [
                {"sourceCode": f"CODE_{i}", "homepageUrl": "https://www.beac.int/",
                 "sourceType": "REGIONAL_OFFICIAL"}
                for i in range(41)
            ],
        })

    with (
        httpx.Client(
            base_url="http://catalog.test",
            transport=httpx.MockTransport(many_sources),
        ) as catalog,
        httpx.Client(
            transport=httpx.MockTransport(
                lambda request: (_ for _ in ()).throw(AssertionError("No public requests"))
            )
        ) as public,
    ):
        with pytest.raises(ValueError, match="capacity"):
            run_country_source_availability_audit(catalog, public)
