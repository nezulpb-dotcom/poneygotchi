import test from 'node:test';
import assert from 'node:assert/strict';
import { newGame, restoreGame, explore, setManualTime, displayDate, care } from '../src/core/game.js';
test('discoveries are gated, rewarded once and survive a restore', () => {
 const game=newGame();
 assert.equal(explore(game,'clearing'),false);
 assert.equal(explore(game,'meadow'),true);
 assert.equal(game.pet.stars,35);
 assert.equal(explore(game,'meadow'),false);
 const restored=restoreGame(game);
 assert.deepEqual(restored.explored,['meadow']);
 assert.equal(explore(restored,'meadow'),false);
});
test('manual time follows elapsed time without mutating the daily quest date', () => {
 const now=new Date(2026,10,7,12,30), game=newGame(now), day=game.daily.date;
 assert.equal(setManualTime(game,'23:59',now),true);
 assert.equal(displayDate(game,now).getHours(),23);
 assert.equal(displayDate(game,new Date(+now+60000)).getHours(),0);
 assert.equal(game.daily.date,day);
 assert.equal(setManualTime(game,'25:00',now),false);
 assert.equal(setManualTime(game,'<img>',now),false);
});
test('old saves migrate; invalid manual clock and exploration are discarded', () => {
 const game=restoreGame({settings:{clockOffsetMs:Infinity},explored:['bad','meadow','meadow']});
 assert.equal(game.settings.clockOffsetMs,0);
 assert.deepEqual(game.explored,['meadow']);
 assert.deepEqual(restoreGame({}).explored,[]);
});

test('corrupted numeric and cooldown data cannot break care or leveling', () => {
 const game=restoreGame({pet:{stars:Infinity,level:Infinity,xp:Infinity},lastCareAward:'broken',daily:{water:'2'},settings:{waterMinutes:-1}});
 assert.equal(game.pet.level,1);assert.equal(game.pet.xp,0);
 assert.equal(game.daily.water,2);assert.equal(game.settings.waterMinutes,90);
 assert.equal(care(game,'feed',100000).ok,true);
 assert.equal(game.pet.stars,32);
});
