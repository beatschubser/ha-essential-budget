"""Tests with a real Home Assistant (pytest-homeassistant-custom-component), run by the GitHub workflow."""

from __future__ import annotations

import json
from pathlib import Path

import pytest
from homeassistant.config_entries import ConfigEntryState
from homeassistant.core import HomeAssistant
from homeassistant.data_entry_flow import FlowResultType
from homeassistant.helpers import issue_registry as ir
from homeassistant.setup import async_setup_component
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.essential_budget.const import DATA_FILE, DOMAIN, EDIT_PAGE_ELEMENT, EDIT_PATH, ISSUE_INVALID_FILE
from custom_components.essential_budget.logic import LIMITS

MANIFEST = Path(__file__).parent.parent / "custom_components" / DOMAIN / "manifest.json"
FRONTEND = MANIFEST.parent / "frontend"

BUDGET = {
    "persons": {"a": "Alex", "b": "Sam"},
    "income": [{"name": "Salary", "person": "a", "amount": 3150}],
    "shared_income": [{"name": "Child benefit", "to": "b", "amount": 255}],
    "fixed_costs": [{"name": "Rent", "category": "Home", "person": "a", "amount": 1480, "interval_months": 1}],
}


def data_file(hass: HomeAssistant) -> Path:
    return Path(hass.config.path(DATA_FILE))


async def setup(hass: HomeAssistant) -> MockConfigEntry:
    entry = MockConfigEntry(domain=DOMAIN, title="Essential Budget", data={"person_a": "Alex", "person_b": "Sam"})
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    return entry


@pytest.fixture(autouse=True)
def clean_file(hass: HomeAssistant):
    yield
    data_file(hass).unlink(missing_ok=True)


async def test_config_flow(hass: HomeAssistant) -> None:
    result = await hass.config_entries.flow.async_init(DOMAIN, context={"source": "user"})
    assert result["type"] is FlowResultType.FORM
    result = await hass.config_entries.flow.async_configure(result["flow_id"], {"person_a": " ", "person_b": "Sam"})
    assert result["errors"] == {"person_a": "empty"}
    result = await hass.config_entries.flow.async_configure(result["flow_id"], {"person_a": " Alex "})
    assert result["type"] is FlowResultType.CREATE_ENTRY
    assert result["data"] == {"person_a": "Alex", "person_b": ""}  # second person is optional
    await hass.async_block_till_done()

    result = await hass.config_entries.flow.async_init(DOMAIN, context={"source": "user"})
    assert result["type"] is FlowResultType.ABORT
    assert result["reason"] == "single_instance_allowed"


async def test_file_created_and_saved(hass: HomeAssistant, hass_ws_client) -> None:
    entry = await setup(hass)
    assert entry.state is ConfigEntryState.LOADED
    created = json.loads(data_file(hass).read_text(encoding="utf-8"))
    assert created["persons"] == {"a": "Alex", "b": "Sam"}
    assert created["fixed_costs"] == []

    client = await hass_ws_client(hass)
    await client.send_json_auto_id({"type": f"{DOMAIN}/version"})
    # the version comes from manifest.json, the only place where it is set
    version = json.loads(MANIFEST.read_text(encoding="utf-8"))["version"]
    assert (await client.receive_json())["result"] == {"version": version, "edit_path": f"/{EDIT_PATH}", "limits": LIMITS}

    await client.send_json_auto_id({"type": f"{DOMAIN}/subscribe"})
    assert (await client.receive_json())["success"]

    await client.send_json_auto_id({"type": f"{DOMAIN}/save", "data": BUDGET})
    assert (await client.receive_json())["event"] == {}  # open cards are told to reload
    result = await client.receive_json()
    assert result["success"], result
    assert result["result"]["data"]["fixed_costs"][0]["amount"] == 1480.0

    saved = json.loads(data_file(hass).read_text(encoding="utf-8"))
    assert saved["income"] == [{"name": "Salary", "person": "a", "amount": 3150.0}]

    await client.send_json_auto_id({"type": f"{DOMAIN}/get"})
    result = (await client.receive_json())["result"]
    assert result["data"] == saved

    # invalid data is rejected and the file stays unchanged
    bad = {**BUDGET, "fixed_costs": [{"name": "X", "person": "a", "amount": 1, "interval_months": 0}]}
    await client.send_json_auto_id({"type": f"{DOMAIN}/save", "data": bad})
    result = await client.receive_json()
    assert not result["success"]
    assert "interval_months" in result["error"]["message"]
    assert json.loads(data_file(hass).read_text(encoding="utf-8")) == saved


async def test_existing_file_is_kept(hass: HomeAssistant) -> None:
    data_file(hass).write_text(json.dumps(BUDGET), encoding="utf-8")
    await setup(hass)
    # the names from the setup dialog do not overwrite the file
    assert json.loads(data_file(hass).read_text(encoding="utf-8")) == BUDGET


async def test_broken_file_blocks_saving(hass: HomeAssistant, hass_ws_client) -> None:
    data_file(hass).write_text('{"persons": ', encoding="utf-8")
    await setup(hass)
    assert ir.async_get(hass).async_get_issue(DOMAIN, ISSUE_INVALID_FILE) is not None

    client = await hass_ws_client(hass)
    await client.send_json_auto_id({"type": f"{DOMAIN}/get"})
    result = await client.receive_json()
    assert result["error"]["code"] == ISSUE_INVALID_FILE

    await client.send_json_auto_id({"type": f"{DOMAIN}/save", "data": BUDGET})
    assert not (await client.receive_json())["success"]
    assert data_file(hass).read_text(encoding="utf-8") == '{"persons": '  # untouched


async def test_save_needs_admin(hass: HomeAssistant, hass_ws_client, hass_read_only_access_token) -> None:
    await setup(hass)
    client = await hass_ws_client(hass, hass_read_only_access_token)
    await client.send_json_auto_id({"type": f"{DOMAIN}/save", "data": BUDGET})
    result = await client.receive_json()
    assert result["error"]["code"] == "unauthorized"


async def test_edit_page_registered(hass: HomeAssistant) -> None:
    """The edit page is registered for admins only and without a sidebar entry."""
    await setup(hass)
    panel = hass.data["frontend_panels"][EDIT_PATH]
    assert panel.require_admin
    assert panel.sidebar_title is None
    assert panel.config["_panel_custom"]["name"] == EDIT_PAGE_ELEMENT
    assert panel.config["_panel_custom"]["module_url"].endswith("?v=" + json.loads(MANIFEST.read_text(encoding="utf-8"))["version"])
    assert panel.config_panel_domain == DOMAIN


async def test_frontend_files_served(hass: HomeAssistant, hass_client_no_auth) -> None:
    """The card and its modules are served."""
    await setup(hass)
    client = await hass_client_no_auth()
    names = [file.name for file in FRONTEND.glob("*.js")]
    assert "essential-budget-card.js" in names
    for name in names:
        assert (await client.get(f"/essential_budget_files/{name}")).status == 200
    assert (await client.get("/essential_budget_files/missing.js")).status == 404


async def test_not_set_up(hass: HomeAssistant, hass_ws_client) -> None:
    """Without a config entry the commands answer with "not found" (the card then shows a hint)."""
    assert await async_setup_component(hass, DOMAIN, {})
    client = await hass_ws_client(hass)
    for command in ({"type": f"{DOMAIN}/get"}, {"type": f"{DOMAIN}/save", "data": BUDGET}):
        await client.send_json_auto_id(command)
        assert (await client.receive_json())["error"]["code"] == "not_found"
