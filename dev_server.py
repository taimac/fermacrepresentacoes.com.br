"""Purpose: local no-cache dev server for Fermac website previews.
Date: 2026-05-07
Author: Codex for Tailor Maciel
Domain: Fermac website development
"""

from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer


class NoCacheHandler(SimpleHTTPRequestHandler):
    """Serve static files while forcing the browser to request fresh assets."""

    def _strip_cache_validators(self):
        for header in ("If-Modified-Since", "If-None-Match"):
            if header in self.headers:
                del self.headers[header]

    def do_GET(self):
        self._strip_cache_validators()
        super().do_GET()

    def do_HEAD(self):
        self._strip_cache_validators()
        super().do_HEAD()

    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()


if __name__ == "__main__":
    server = ThreadingHTTPServer(("0.0.0.0", 8001), NoCacheHandler)
    print("Serving Fermac site without cache at http://127.0.0.1:8001/")
    server.serve_forever()
