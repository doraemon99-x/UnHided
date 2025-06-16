import re
import time
from typing import Dict
import aiohttp  # Tambahan untuk request manual

from mediaflow_proxy.extractors.base import BaseExtractor, ExtractorError


class DoodStreamExtractor(BaseExtractor):
    """DoodStream URL extractor."""

    def __init__(self, request_headers: dict):
        super().__init__(request_headers)
        self.base_url = "https://vide0.net"

    async def _make_request(self, url, headers=None):
        """Override untuk abaikan SSL verification."""
        connector = aiohttp.TCPConnector(ssl=False)
        async with aiohttp.ClientSession(connector=connector, headers=headers) as session:
            async with session.get(url) as response:
                text = await response.text()
                return type("Response", (), {"text": text})

    async def extract(self, url: str, **kwargs) -> Dict[str, str]:
        """Extract DoodStream URL."""
        response = await self._make_request(url)

        # Extract URL pattern
        pattern = r"(\/pass_md5\/.*?)'.*(\?token=.*?expiry=)"
        match = re.search(pattern, response.text, re.DOTALL)
        if not match:
            raise ExtractorError("Failed to extract URL pattern")

        # Build final URL
        pass_url = f"{self.base_url}{match[1]}"
        referer = f"{self.base_url}/"
        headers = {"range": "bytes=0-", "referer": referer}

        response = await self._make_request(pass_url, headers=headers)
        timestamp = str(int(time.time()))
        final_url = f"{response.text}123456789{match[2]}{timestamp}"

        self.base_headers["referer"] = referer
        return {
            "destination_url": final_url,
            "request_headers": self.base_headers,
            "mediaflow_endpoint": self.mediaflow_endpoint,
        }
