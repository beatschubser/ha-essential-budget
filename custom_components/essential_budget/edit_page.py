"""The edit page: an own page (panel) for editing the budget, defined in the card files."""

from __future__ import annotations

from homeassistant.components import panel_custom
from homeassistant.core import HomeAssistant

from .const import CARD_URL, DOMAIN, EDIT_PAGE_ELEMENT, EDIT_PATH


async def async_register(hass: HomeAssistant, version: str) -> None:
    """Register the page without a sidebar entry (no title).

    It is reached from the card, the card editor or the "Configure" button of the
    integration (config_panel_domain). Only administrators can open it.
    """
    await panel_custom.async_register_panel(
        hass,
        frontend_url_path=EDIT_PATH,
        webcomponent_name=EDIT_PAGE_ELEMENT,
        module_url=f"{CARD_URL}?v={version}",
        require_admin=True,
        config_panel_domain=DOMAIN,
    )
