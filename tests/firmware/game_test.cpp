#include <assert.h>
#include <stdio.h>
#include "Game.h"
using namespace pony;
int main(){
 Game g;assert(valid(g.save));
 assert(g.care(0,0));assert(g.save.hunger==100);assert(g.save.stars==32);
 assert(g.care(0,1));assert(g.save.stars==32);
 assert(g.care(0,30000));assert(g.save.stars==34);
 assert(!g.care(4,40000));
 for(int i=0;i<3;i++)assert(g.quest(5));
 assert(!g.quest(5));assert(g.save.water==3);
 for(int i=0;i<5;i++){assert(g.quest(i));assert(!g.quest(i));}
 auto stars=g.save.stars;assert(g.explore(0));assert(!g.explore(0));assert(g.save.stars==stars+5);
 g.save.level=1;assert(!g.explore(1));assert(!g.equip(2));
 assert(g.equip(1));assert(g.save.equipped==1);
 assert(g.equip(0));assert(!g.equip(3));
 g.setTime(23,59);auto day=g.save.day;g.minute();assert(g.save.minutes==0 && g.save.day==day+1);assert(g.save.water==0 && g.save.quests==0);
 assert(g.scene()==Scene::Night);g.setTime(12,0);assert(g.scene()==Scene::Day);g.setTime(18,0);assert(g.scene()==Scene::Dusk);
 g.setTime(25,0);assert(g.save.minutes==1080);
 g.save.hunger=g.save.energy=g.save.happiness=g.save.hygiene=80;
 g.pose=Action::Walk;g.x=151;g.update(31000,100,1);assert(g.x<=152);
 assert(elapsed(4,0xfffffff0,20));
 g.hud=true;g.lastInput=0xfffffff0;g.update(10000,66,1);assert(!g.hud);
 Save invalid;invalid.energy=101;assert(!valid(invalid));invalid=Save{};invalid.equipped=3;assert(!valid(invalid));
 auto rect=unite({10,10,144,144},{8,12,144,144});assert(rect.x==8 && rect.w==146 && rect.h==146);
 puts("Firmware core: care, reward caps, quests, exploration, inventory, clock, scenes, motion, rollover, saves OK");
}
