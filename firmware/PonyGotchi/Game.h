#pragma once
#include <stdint.h>
#include <stddef.h>

namespace pony {
constexpr uint16_t Width=320, Height=480;
enum class Action : uint8_t { Idle, Walk, Blink, Happy, Eat, Sleep, Sad, Wash };
enum class Scene : uint8_t { Day, Dusk, Night };
struct Rect { int16_t x,y,w,h; };
inline Rect unite(Rect a, Rect b) {
 int x=a.x<b.x?a.x:b.x, y=a.y<b.y?a.y:b.y;
 int r=a.x+a.w>b.x+b.w?a.x+a.w:b.x+b.w;
 int bottom=a.y+a.h>b.y+b.h?a.y+a.h:b.y+b.h;
 return {int16_t(x),int16_t(y),int16_t(r-x),int16_t(bottom-y)};
}
inline bool elapsed(uint32_t now,uint32_t then,uint32_t interval) { return uint32_t(now-then)>=interval; }
struct Save {
 uint32_t magic=0x504F4E59, version=1;
 uint32_t minutes=12*60, day=1, stars=30, xp=0, level=1;
 uint8_t hunger=82,happiness=90,energy=78,hygiene=88;
 uint8_t water=0,quests=0,owned=1,equipped=0,explored=0;
};
inline bool valid(const Save& s) {
 return s.magic==0x504F4E59 && s.version==1 && s.minutes<1440 && s.day>0 && s.day<1000000 && s.level>=1 && s.level<=10000 && s.xp<75+s.level*25 && s.stars<=10000000 && s.hunger<=100 && s.happiness<=100 && s.energy<=100 && s.hygiene<=100 && s.water<=3 && s.quests<32 && s.owned<8 && s.equipped<3 && (s.owned&(1<<s.equipped)) && s.explored<8;
}
inline uint8_t add(int n,int delta) { int v=n+delta;return v<0?0:v>100?100:v; }
class Game {
 public:
 Save save;
 Action pose=Action::Idle;
 float x=88;
 int direction=1;
 uint8_t frame=0;
 bool hud=false, panel=false;
 uint32_t lastInput=0;
 void reward(uint32_t stars,uint32_t xp) {
  save.stars+=stars; save.xp+=xp;
  while(save.xp>=75+save.level*25) { save.xp-=75+save.level*25;save.level++;save.stars+=15; }
 }
 Scene scene() const { return save.minutes<420 || save.minutes>=1260 ? Scene::Night : save.minutes<540 || save.minutes>=1080 ? Scene::Dusk : Scene::Day; }
 void setTime(uint8_t hour,uint8_t minute) { if(hour<24 && minute<60) save.minutes=hour*60+minute; }
 void minute() {
  if(++save.minutes==1440) { save.minutes=0;save.day++;save.water=0;save.quests=0; }
  save.hunger=add(save.hunger,-2);save.happiness=add(save.happiness,-1);
  save.energy=add(save.energy,pose==Action::Sleep?2:-1);save.hygiene=add(save.hygiene,-1);
 }
 bool care(uint8_t action,uint32_t now) {
  if(action>3 || (action==1 && (save.hunger<10 || save.energy<10))) return false;
  switch(action) {
   case 0: save.hunger=add(save.hunger,25);save.hygiene=add(save.hygiene,-4);pose=Action::Eat;break;
   case 1: save.happiness=add(save.happiness,20);save.energy=add(save.energy,-10);save.hunger=add(save.hunger,-6);pose=Action::Happy;break;
   case 2: save.energy=add(save.energy,30);save.hunger=add(save.hunger,-5);pose=Action::Sleep;break;
   case 3: save.hygiene=add(save.hygiene,35);save.happiness=add(save.happiness,5);pose=Action::Wash;break;
  }
  if(!(rewarded&(1<<action)) || elapsed(now,rewardAt[action],30000)) {reward(2,4);rewardAt[action]=now;rewarded|=1<<action;}
  actionAt=now;actionActive=true;frame=0;return true;
 }
 bool quest(uint8_t q) {
  if(q>5) return false;
  if(q==5) {if(save.water>=3)return false;save.water++;reward(5,7);return true;}
  if(save.quests&(1<<q))return false;
  save.quests|=1<<q;reward(q==4?10:12,q==3?20:q==4?15:18);
  if(q<3 && (save.quests&7)==7)reward(20,30);
  return true;
 }
 bool equip(uint8_t item) {
  if(item>2 || save.level<(item==2?2:1))return false;
  uint8_t cost=item==1?20:40;
  if(!(save.owned&(1<<item))) {if(save.stars<cost)return false;save.stars-=cost;save.owned|=1<<item;}
  save.equipped=item;return true;
 }
 bool explore(uint8_t spot) {
  if(spot>2 || save.level<uint32_t(spot)+1 || (save.explored&(1<<spot)))return false;
  save.explored|=1<<spot;reward(5,10);return true;
 }
 void update(uint32_t now,uint32_t dt,uint32_t randomValue) {
  if(hud && !panel && elapsed(now,lastInput,9000))hud=false;
  if(elapsed(now,frameAt,pose==Action::Sleep?650:180)) {frameAt=now;frame=(frame+1)%4;}
  if(actionActive && elapsed(now,actionAt,pose==Action::Sleep?8000:3000)) {actionActive=false;behaviorAt=now;pose=Action::Idle;}
  if(actionActive)return;
  if(save.energy<12)pose=Action::Sleep;
  else if(save.hunger<15 || save.happiness<15 || save.hygiene<10)pose=Action::Sad;
  else if(elapsed(now,behaviorAt,3200)) {behaviorAt=now;pose=Action(randomValue%4); if(randomValue&16)direction=-direction;}
  if(pose==Action::Walk) {x+=direction*(dt>100?100:dt)*.014f;if(x<24){x=24;direction=1;}if(x>152){x=152;direction=-1;}}
 }
 private:
 uint32_t frameAt=0,behaviorAt=0,actionAt=0,rewardAt[4]={};
 uint8_t rewarded=0;
 bool actionActive=false;
};
}
