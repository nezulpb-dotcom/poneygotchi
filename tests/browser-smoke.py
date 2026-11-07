"""Smoke-test the offline preview using Playwright + Chromium (optional Python tools)."""
from pathlib import Path
import os
import re
from playwright.sync_api import sync_playwright

root = Path(__file__).resolve().parents[1]
html = (root/'preview-offline.html').read_text('utf-8')
with sync_playwright() as pw:
    # Prefer the Playwright-managed browser in CI; keep the system Chromium
    # fallback for local Debian installations and allow an explicit override.
    browser_options = {'headless': True, 'args': ['--no-sandbox']}
    custom_browser = os.environ.get('PONYGOTCHI_CHROMIUM')
    if custom_browser:
        browser_options['executable_path'] = custom_browser
    elif os.environ.get('CI', '').lower() != 'true' and Path('/usr/bin/chromium').exists():
        browser_options['executable_path'] = '/usr/bin/chromium'
    browser = pw.chromium.launch(**browser_options)
    page = browser.new_page(viewport={'width': 760, 'height': 850}, device_scale_factor=1)
    errors=[]
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.set_content(html, wait_until='load')
    page.wait_for_timeout(1300)
    assert re.fullmatch(r'\d{2}:\d{2}', page.locator('#timeText').inner_text())
    assert page.locator('#hud').get_attribute('aria-hidden') == 'true'
    page.locator('#screen').screenshot(path=str(root/'docs'/'preview_lockscreen.png'))
    page.locator('#screenTap').click(position={'x':24,'y':215})
    assert page.locator('#hud').get_attribute('aria-hidden') == 'false'
    page.wait_for_timeout(300)
    page.locator('#screen').screenshot(path=str(root/'docs'/'preview_hud.png'))
    page.locator('[data-care="feed"]').click()
    assert 'Miam' in page.locator('#bubble').text_content()
    page.locator('#openMenu').click()
    assert page.locator('#sheetWrap').get_attribute('aria-hidden') == 'false'
    page.locator('[data-tab="shop"]').click()
    assert page.locator('.shop-item').count() >= 4
    page.locator('[data-tab="missions"]').click()
    page.locator('[data-quest="morning"]').click()
    assert 'Noté' in page.locator('[data-quest="morning"]').text_content()
    page.locator('#screen').screenshot(path=str(root/'docs'/'preview_sheet.png'))
    page.locator('[data-tab="explore"]').click()
    page.locator('[data-explore="meadow"]').click()
    assert 'Découvert' in page.locator('[data-explore="meadow"]').text_content()
    assert page.locator('[data-explore="meadow"]').is_disabled()
    page.locator('#screen').screenshot(path=str(root/'docs'/'preview_explore.png'))
    page.locator('[data-tab="settings"]').click()
    page.locator('#manualTime').fill('06:45')
    page.locator('#manualTime').dispatch_event('change')
    assert page.locator('#timeText').inner_text() == '06:45'
    assert page.locator('#screen').get_attribute('data-scene') == 'night'
    page.locator('#screen').screenshot(path=str(root/'docs'/'preview_clock.png'))
    page.locator('[data-clock-reset]').click()
    page.locator('#closeSheet').click()
    page.emulate_media(reduced_motion='reduce')
    assert page.locator('.petal').first.evaluate('(e) => getComputedStyle(e).display') == 'none'
    assert not errors, errors
    print('Browser smoke tests OK; no uncaught JS errors')
    browser.close()
