import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const header = fs.readFileSync(path.join(root, "CrowPanel/PonyGotchi_Studio_CrowPanel/care_layout.h"), "utf8");
const firmware = fs.readFileSync(path.join(root, "CrowPanel/PonyGotchi_Studio_CrowPanel/PonyGotchi_Studio_CrowPanel.ino"), "utf8");
function constant(name) {
  const expression = new RegExp("constexpr int " + name + "=([0-9]+);");
  const match = header.match(expression);
  assert.ok(match, "layout constant " + name + " must exist");
  return Number(match[1]);
}
const v = Object.fromEntries(
  ["ponyTop", "ponyHeight", "statsLeft", "statsTop", "statsWidth", "statsHeight",
   "tileLeft", "tileTop", "tileWidth", "tileHeight", "columnPitch", "rowPitch",
   "gaugeWidth", "actionsLeft", "actionsTop", "actionWidth", "actionHeight",
   "actionPitch", "actionCount", "screenWidth", "screenHeight"].map(k => [k, constant(k)])
);

test("care gauge region does not conceal Rosy or care buttons", () => {
  assert.ok(v.ponyTop + v.ponyHeight < v.statsTop);
  assert.ok(v.statsTop + v.statsHeight < v.actionsTop);
  assert.ok(v.actionsTop + v.actionHeight <= v.screenHeight);
  assert.equal(v.gaugeWidth, 124);
  assert.equal(v.actionWidth, 73);
  assert.equal(v.actionHeight, 47);
});

test("all four gauges fit in a 2 by 2 grid", () => {
  for (let i = 0; i < 4; ++i) {
    const x = v.tileLeft + (i % 2) * v.columnPitch;
    const y = v.tileTop + Math.floor(i / 2) * v.rowPitch;
    assert.ok(x >= v.statsLeft && x + v.tileWidth <= v.statsLeft + v.statsWidth);
    assert.ok(y >= v.statsTop && y + v.tileHeight <= v.statsTop + v.statsHeight);
  }
});

test("care panel redraw/close preserves scene and correct touch dispatch", () => {
  assert.match(firmware, /CareLayout::careActionAt\(x,y\)/);
  assert.match(firmware, /CareLayout::inStats\(x,y\)/);
  assert.match(firmware, /drawStageRows\(CareLayout::statsTop,CareLayout::statsTop\+CareLayout::statsHeight\)/);
  assert.match(firmware, /CareLayout::gaugeWidth/);
  for (let i = 0; i < 4; ++i) {
    const x = v.actionsLeft + i * v.actionPitch;
    assert.ok(x + v.actionWidth <= v.screenWidth);
    assert.ok(v.statsTop + v.statsHeight < v.actionsTop);
  }
});
