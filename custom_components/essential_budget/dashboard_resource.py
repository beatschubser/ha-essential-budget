"""Register the card as dashboard resource (like HACS does), so it does not have to be added by hand."""

from __future__ import annotations

import logging

from homeassistant.components.frontend import add_extra_js_url
from homeassistant.core import HomeAssistant

from .const import CARD_URL

_LOGGER = logging.getLogger(__name__)


def _resources(hass: HomeAssistant):
    """The dashboard resource collection, or None if dashboards run in YAML mode."""
    lovelace = hass.data.get("lovelace")
    resources = getattr(lovelace, "resources", None)
    return resources if hasattr(resources, "async_create_item") else None


async def _async_loaded(resources) -> None:
    if not getattr(resources, "loaded", True):
        await resources.async_load()
        resources.loaded = True


def _is_card(item: dict) -> bool:
    return str(item.get("url") or "").split("?")[0] == CARD_URL


async def async_register(hass: HomeAssistant, version: str) -> None:
    """Add the card as dashboard resource, or update its ?v= after an update."""
    url = f"{CARD_URL}?v={version}"
    try:
        resources = _resources(hass)
        if resources is not None:
            await _async_loaded(resources)
            item = next((i for i in resources.async_items() if _is_card(i)), None)
            if item is None:
                await resources.async_create_item({"res_type": "module", "url": url})
                _LOGGER.info("Budget card resource %s added", url)
            elif item["url"] != url:
                await resources.async_update_item(item["id"], {"res_type": "module", "url": url})
                _LOGGER.info("Budget card resource updated to %s", url)
            return
    except Exception:
        _LOGGER.exception("Could not register the budget card as dashboard resource")

    # Dashboards in YAML mode (or an error above): load the card on every page instead
    add_extra_js_url(hass, url)
    _LOGGER.warning(
        "Dashboard resources are not in UI mode. Add '%s' as JavaScript module if the budget card does not load",
        CARD_URL,
    )


async def async_remove(hass: HomeAssistant) -> None:
    """Remove the dashboard resource (after the integration was removed)."""
    try:
        resources = _resources(hass)
        if resources is None:
            return
        await _async_loaded(resources)
        for item in [i for i in resources.async_items() if _is_card(i)]:
            await resources.async_delete_item(item["id"])
    except Exception:
        _LOGGER.debug("Dashboard resource could not be removed", exc_info=True)
