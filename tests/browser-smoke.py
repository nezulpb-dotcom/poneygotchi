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
    clock = page.locator('#timeText').inner_text()
    assert len(clock) == 5 and clock[2] == ':'
    expected_date = page.evaluate("new Date().toLocaleDateString('fr-BE', { weekday: 'long', day: 'numeric', month: 'long' })")
    assert page.locator('#todayDate').inner_text() == expected_date
    assert page.locator('#hud').get_attribute('aria-hidden') == 'true'
    page.locator('#screen').screenshot(path=str(root/'docs'/'preview_lockscreen.png'))
    page.locator('#screenTap').click(position={'x':24,'y':215})
    assert page.locator('#hud').get_attribute('aria-hidden') == 'false'
    page.wait_for_timeout(300)
    page.locator('#screen').screenshot(path=str(root/'docs'/'preview_hud.png'))
    page.locator('[data-care="feed"]').click()
    assert 'Miam' in page.locator('#bubble').text_content()
    pet_tap = page.locator('#petTap')
    pet_tap.click(position={'x':72,'y':18})
    assert pet_tap.get_attribute('data-zone') == 'forehead'
    page.wait_for_timeout(80)
    assert page.locator('#ponyWrap').get_attribute('data-pose') == 'look'
    assert pet_tap.get_attribute('class').find('pet-burst') >= 0
    first_pet_message = page.locator('#bubble').inner_text()
    pet_tap.click(position={'x':72,'y':18})
    assert page.locator('#bubble').inner_text() == first_pet_message
    page.wait_for_timeout(450)
    pet_tap.click(position={'x':72,'y':70})
    assert pet_tap.get_attribute('data-zone') == 'cheek'
    page.wait_for_timeout(80)
    assert page.locator('#ponyWrap').get_attribute('data-pose') == 'happy'
    page.wait_for_timeout(450)
    pet_tap.click(position={'x':72,'y':120})
    assert pet_tap.get_attribute('data-zone') == 'mane'
    page.wait_for_timeout(80)
    assert page.locator('#ponyWrap').get_attribute('data-pose') == 'play'
    page.locator('#openMenu').click()
    assert page.locator('#sheetWrap').get_attribute('aria-hidden') == 'false'
    page.locator('[data-tab="shop"]').click()
    assert page.locator('.shop-item').count() >= 4
    page.locator('[data-tab="missions"]').click()
    page.locator('[data-quest="morning"]').click()
    assert 'Noté' in page.locator('[data-quest="morning"]').text_content()
    page.locator('#screen').screenshot(path=str(root/'docs'/'preview_sheet.png'))
    page.locator('[data-tab="memory"]').click()
    assert page.locator('[data-memory-start="3"]').count() == 1
    assert page.locator('[data-memory-start="4"]').count() == 1
    page.locator('[data-memory-start="4"]').click()
    assert page.locator('[data-memory-card]').count() == 8
    assert page.locator('.memory-grid-4').count() == 1
    assert page.locator('.memory-grid-4').get_attribute('aria-label') == 'Cartes du jardin de mémoire, 4 paires'
    assert page.locator('[role="status"][aria-live="polite"]').count() == 1
    hint_button = page.locator('[data-memory-hint]')
    assert hint_button.is_enabled()
    hint_button.click()
    hinted_cards = page.locator('.memory-card.hinted')
    assert hinted_cards.count() == 2
    first_hint_index = int(hinted_cards.nth(0).get_attribute('data-memory-card'))
    second_hint_index = int(hinted_cards.nth(1).get_attribute('data-memory-card'))
    assert hinted_cards.nth(0).inner_text() == hinted_cards.nth(1).inner_text()
    hinted_cards.nth(0).click()
    assert page.locator('.memory-card.hinted').count() == 0
    assert page.locator(f'[data-memory-card="{first_hint_index}"]').get_attribute('aria-pressed') == 'true'
    page.locator(f'[data-memory-card="{second_hint_index}"]').click()
    assert 'Paires : 1/4' in page.locator('#sheetContent').inner_text()
    assert 'Coups : 1' in page.locator('#sheetContent').inner_text()
    assert 'Deux fleurs pareilles' in page.locator('#bubble').inner_text()
    assert '1 indice' in page.locator('[data-memory-hint]').inner_text()
    assert not errors, errors
    print('Browser smoke tests OK; no uncaught JS errors')
    browser.close()
