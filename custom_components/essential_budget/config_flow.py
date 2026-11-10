"""Config flow: one budget per Home Assistant, with the name of one person and optionally a second one."""

from __future__ import annotations

import voluptuous as vol
from homeassistant.config_entries import ConfigFlow

from .const import CONF_PERSON_A, CONF_PERSON_B, DOMAIN
from .logic import MAX_PERSON_NAME, clean_name


class EssentialBudgetConfigFlow(ConfigFlow, domain=DOMAIN):
    VERSION = 1

    async def async_step_user(self, user_input=None):
        if self._async_current_entries():
            return self.async_abort(reason="single_instance_allowed")
        errors = {}
        if user_input is not None:
            names = {key: clean_name(str(user_input.get(key, ""))) for key in (CONF_PERSON_A, CONF_PERSON_B)}
            if not names[CONF_PERSON_A]:
                errors[CONF_PERSON_A] = "empty"
            for key, name in names.items():
                if len(name) > MAX_PERSON_NAME:
                    errors[key] = "too_long"
            if not errors:
                return self.async_create_entry(title="Essential Budget", data=names)

        return self.async_show_form(
            step_id="user",
            data_schema=vol.Schema({vol.Required(CONF_PERSON_A): str, vol.Optional(CONF_PERSON_B, default=""): str}),
            errors=errors,
        )
