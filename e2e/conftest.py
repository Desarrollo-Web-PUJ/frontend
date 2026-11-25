import os
from pathlib import Path

import pytest
from selenium import webdriver
from selenium.webdriver.chrome.service import Service


@pytest.fixture
def driver(request):
    options = webdriver.ChromeOptions()
    if os.getenv("E2E_VISIBLE") != "1":
        options.add_argument("--headless=new")
    options.add_argument("--window-size=1440,1080")
    options.add_argument("--disable-dev-shm-usage")
    if os.getenv("E2E_CHROME"):
        options.binary_location = os.environ["E2E_CHROME"]
    if os.getenv("E2E_NO_SANDBOX") == "1":
        options.add_argument("--no-sandbox")
    # La tubería evita conflictos por el puerto de depuración entre sesiones.
    options.add_argument("--remote-debugging-pipe")
    browser = webdriver.Chrome(service=Service(os.getenv("E2E_DRIVER")), options=options)
    try:
        yield browser
    finally:
        try:
            report = getattr(request.node, "call_report", None)
            status = report.outcome if report else "setup"
            directory = Path(os.getenv("E2E_EVIDENCE", "e2e/evidencias"))
            directory.mkdir(parents=True, exist_ok=True)
            browser.get_screenshot_as_file(str(directory / f"{request.node.name}-{status}.png"))
        finally:
            browser.quit()


@pytest.hookimpl(hookwrapper=True)
def pytest_runtest_makereport(item, call):
    result = yield
    if call.when == "call":
        item.call_report = result.get_result()
