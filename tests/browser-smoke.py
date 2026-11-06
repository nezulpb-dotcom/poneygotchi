"""Smoke-test the offline preview using Playwright + Chromium (optional Python tools)."""
from pathlib import Path
from playwright.sync_api import sync_playwright

root = Path(__file__).resolve().parents[1]
html = (root/'preview-offline.html').read_text('utf-8')
with sync_playwright() as pw:
    browser = pw.chromium.launch(headless=True, executable_path='/usr/bin/chromium', args=['--no-sandbox'])
    page = browser.new_page(viewport={'width': 760, 'height': 850}, device_scale_factor=1)
    errors=[]
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.set_content(html, wait_until='load')
    page.wait_for_timeout(1300)
    assert page.locator('#timeText').inner_text() != '20:05'
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
    assert not errors, errors
    print('Browser smoke tests OK; no uncaught JS errors')
    browser.close()
