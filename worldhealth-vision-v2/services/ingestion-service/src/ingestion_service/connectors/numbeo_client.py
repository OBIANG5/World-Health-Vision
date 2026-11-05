# WorldHealthVision V2 — NumbeoApiClient
# Accède à l'API Numbeo (clé requise) pour récupérer les indices coût de la vie.
# Documentation : https://www.numbeo.com/api/doc.jsp

import httpx


class NumbeoApiClient:
    """Client HTTP pour l'API Numbeo.

    Endpoint utilisé : GET /api/indices?api_key={key}
    Retourne un tableau de pays avec indices : coli, ri, coli_and_ri, gri, rpi, lppi.
    """

    def __init__(self, *, base_url: str, api_key: str, timeout_seconds: int) -> None:
        self._base_url = base_url.rstrip("/")
        self._api_key = api_key
        self._client = httpx.Client(timeout=timeout_seconds)

    def fetch_country_indices(self) -> list[dict]:
        """Télécharge les indices coût de la vie pour tous les pays disponibles."""
        response = self._client.get(
            f"{self._base_url}/indices",
            params={"api_key": self._api_key},
        )
        response.raise_for_status()
        data = response.json()
        return data.get("country", [])

    def close(self) -> None:
        self._client.close()

    def __enter__(self) -> "NumbeoApiClient":
        return self

    def __exit__(self, *_: object) -> None:
        self.close()