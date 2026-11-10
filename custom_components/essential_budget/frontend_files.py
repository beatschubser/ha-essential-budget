"""Serve the JavaScript files of the card (custom_components/essential_budget/frontend)."""

from __future__ import annotations

from pathlib import Path

from aiohttp import web
from homeassistant.components.http import HomeAssistantView
from homeassistant.core import HomeAssistant

from .const import FRONTEND_URL

FOLDER = Path(__file__).parent / "frontend"


class FrontendView(HomeAssistantView):
    """Serves the card and its modules.

    "Cache-Control: no-cache" makes browsers and the companion app check for a
    newer file on every load (a cheap 304 if unchanged), so updates show up
    after a normal reload instead of needing a cache reset.
    """

    url = FRONTEND_URL + "/{name}"
    name = "essential_budget:frontend"
    requires_auth = False  # loaded by the browser as a module, like /local files

    def __init__(self, files: dict[str, Path]) -> None:
        self._files = files

    async def get(self, request: web.Request, name: str) -> web.StreamResponse:
        file = self._files.get(name)
        if file is None:
            raise web.HTTPNotFound
        return web.FileResponse(file, headers={"Cache-Control": "no-cache"})


def _list_files() -> dict[str, Path]:
    """Only the JavaScript files of the frontend folder are served (no directory access)."""
    return {file.name: file for file in sorted(FOLDER.glob("*.js"))}


async def async_register(hass: HomeAssistant) -> None:
    files = await hass.async_add_executor_job(_list_files)
    hass.http.register_view(FrontendView(files))
