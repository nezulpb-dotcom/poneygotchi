import test from 'node:test';
import assert from 'node:assert/strict';
import { newGame } from '../src/core/game.js';
import { renderPanel } from '../src/ui/panels.js';

test('journal offers tactile buttons only for collected meadow memories', () => {
  const game = newGame();
  assert.doesNotMatch(renderPanel('missions', game), /data-album-day=/);
  game.meadowAlbum = ['2026-11-16', '2026-11-17'];
  const html = renderPanel('missions', game, null, '2026-11-17');
  assert.match(html, /data-album-day="2026-11-17" aria-pressed="true"/);
  assert.match(html, /data-album-day="2026-11-16" aria-pressed="false"/);
  assert.match(html, /role="status" aria-live="polite">📖/);
  assert.match(html, /Rosy/);
  assert.doesNotMatch(renderPanel('missions', game, null, '2026-11-15'), /role="status" aria-live="polite">📖/);
});
