#!/usr/bin/env python3
"""CI ONLY: serve the compiled V2 frontend and proxy GET /api/* to loopback Gateway.

No fixtures, no fake observations, no credentials, no writes, and no public bind.
Used to prove a real browser and the six existing services work together.
This is NOT a general-purpose production reverse proxy.
"""
import argparse
import json
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urlsplit
from urllib.request import Request, urlopen

LIMIT = 16 * 1024 * 1024


class Proxy(SimpleHTTPRequestHandler):
    gateway = "http://127.0.0.1:18080"

    def do_GET(self):
        path = urlsplit(self.path)
        if path.path.startswith("/api/"):
            self._forward_get(path)
        else:
            super().do_GET()

    def _forward_get(self, path):
        target = self.gateway + path.path + ("?" + path.query if path.query else "")
        request = Request(target, headers={"Accept": "application/json"}, method="GET")
        try:
            try:
                upstream = urlopen(request, timeout=25)
            except HTTPError as error:
                upstream = error
            with upstream:
                status = upstream.status
                payload = upstream.read(LIMIT + 1)
                content_type = upstream.headers.get("Content-Type", "application/json")
            if len(payload) > LIMIT:
                self._reply_json(502, {"detail": "Response too large for CI harness"})
                return
            self.send_response(status)
            self.send_header("Content-Type", content_type)
            self.send_header("Cache-Control", "no-store")
            self.send_header("X-World-Vision-Test-Only", "real-gateway-no-fixtures")
            self.send_header("Content-Length", str(len(payload)))
            self.end_headers()
            self.wfile.write(payload)
        except (URLError, TimeoutError, OSError):
            # Never make an upstream outage look like an empty country.
            self._reply_json(503, {"detail": "Gateway could not be contacted in CI"})

    def _reply_json(self, code, body):
        payload = json.dumps(body).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)

    def do_POST(self):
        self._reply_json(405, {"detail": "CI-only read-only proxy"})

    def do_PUT(self):
        self.do_POST()

    def do_PATCH(self):
        self.do_POST()

    def do_DELETE(self):
        self.do_POST()

    def log_message(self, format_string, *args):
        # Do not log query strings, bearer tokens, source values or cookies.
        print("CI proxy: " + str(args[1] if len(args) > 1 else "request"), flush=True)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", required=True)
    parser.add_argument("--port", type=int, default=5219)
    parser.add_argument("--gateway", default="http://127.0.0.1:18080")
    args = parser.parse_args()
    root = Path(args.root).resolve(strict=True)
    assert root.is_dir() and (root / "index.html").is_file(), "Compiled V2 required"
    assert args.gateway == "http://127.0.0.1:18080", "CI Gateway must be localhost"
    assert 1024 < args.port < 65536
    Proxy.gateway = args.gateway
    handler = partial(Proxy, directory=str(root))
    server = ThreadingHTTPServer(("127.0.0.1", args.port), handler)
    print("CI-only V2 static+Gateway GET proxy listening on loopback", flush=True)
    try:
        server.serve_forever(poll_interval=0.2)
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
