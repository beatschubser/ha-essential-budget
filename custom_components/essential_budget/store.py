"""The budget file /config/.storage/essential_budget.json: read at startup, written on every save from the card."""

from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Any

from homeassistant.core import HomeAssistant
from homeassistant.helpers import issue_registry as ir
from homeassistant.helpers.dispatcher import async_dispatcher_send
from homeassistant.util.file import write_utf8_file_atomic
from homeassistant.util.hass_dict import HassKey

from .const import DATA_FILE, DOMAIN, ISSUE_INVALID_FILE, SIGNAL_CHANGED
from .logic import BudgetError, default_data, validate

_LOGGER = logging.getLogger(__name__)

DATA_STORE: HassKey[BudgetStore] = HassKey(f"{DOMAIN}_store")


class BudgetStore:
    """Holds the budget in memory.

    If the file cannot be read (e.g. a typo after editing it by hand), the card shows an error,
    a repair issue appears and saving is blocked, so the file is never overwritten by accident.
    """

    def __init__(self, hass: HomeAssistant) -> None:
        self.hass = hass
        self.path = Path(hass.config.path(DATA_FILE))
        self.data: dict[str, Any] | None = None
        self.error: str | None = None

    async def async_load(self, name_a: str = "", name_b: str = "") -> None:
        """Read the file; a missing file is created with an empty budget."""
        try:
            raw = await self.hass.async_add_executor_job(self._read)
            if raw is None:
                self.data = default_data(name_a, name_b)
                await self._async_write(self.data)
                _LOGGER.info("Created %s", self.path)
            else:
                self.data = validate(raw)
            self.error = None
            ir.async_delete_issue(self.hass, DOMAIN, ISSUE_INVALID_FILE)
        except (OSError, ValueError) as err:  # json.JSONDecodeError and BudgetError are ValueErrors
            self.data = None
            self.error = str(err)
            _LOGGER.error("%s could not be read: %s", self.path, err)
            ir.async_create_issue(
                self.hass,
                DOMAIN,
                ISSUE_INVALID_FILE,
                is_fixable=False,
                severity=ir.IssueSeverity.ERROR,
                translation_key=ISSUE_INVALID_FILE,
                translation_placeholders={"file": str(self.path), "error": self.error},
            )

    async def async_save(self, data: Any) -> dict[str, Any]:
        """Validate and write; raises BudgetError for invalid data or a broken file."""
        if self.error is not None:
            raise BudgetError(f"{DATA_FILE} could not be read, fix it and restart Home Assistant ({self.error})")
        cleaned = validate(data)
        await self._async_write(cleaned)
        self.data = cleaned
        async_dispatcher_send(self.hass, SIGNAL_CHANGED)
        return cleaned

    def _read(self) -> Any:
        if not self.path.exists():
            return None
        return json.loads(self.path.read_text(encoding="utf-8"))

    async def _async_write(self, data: dict[str, Any]) -> None:
        text = json.dumps(data, indent=2, ensure_ascii=False) + "\n"
        await self.hass.async_add_executor_job(self._write, text)

    def _write(self, text: str) -> None:
        self.path.parent.mkdir(parents=True, exist_ok=True)
        write_utf8_file_atomic(str(self.path), text)
