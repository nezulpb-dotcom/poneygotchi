#include "BoardConfig.h"
#include <TFT_eSPI.h>
#include <SPI.h>
#include <SD.h>
#include <Preferences.h>
#include "Game.h"

using namespace pony;
TFT_eSPI tft;
TFT_eSprite tile(&tft);
SPIClass sdSPI(HSPI);
Preferences prefs;
Game game;
uint16_t *background=nullptr, *sprite=nullptr, *spriteBank=nullptr;
bool ready=false,calibrated=false,wasPressed=false,dirtySave=false;
uint32_t lastFrame=0,lastMinute=0,lastSave=0;
int loadedPose=-1,loadedFrame=-1;
Scene loadedScene=Scene::Day;
const char* poses[]={"idle","walk","blink","happy","eat","sleep","sad","wash"};
const char* scenes[]={"day","dusk","night"};
const char* tabs[]={"Quetes","Atelier","Niveau","Explorer","Horloge"};
uint8_t tab=0;
char serialLine[48];size_t serialLength=0;

bool readRaw(const char* path,uint16_t* data,size_t bytes) {
 File f=SD.open(path,FILE_READ);
 if(!f || f.size()!=bytes) {Serial.printf("Asset absent ou taille invalide: %s\n",path);return false;}
 size_t n=f.read(reinterpret_cast<uint8_t*>(data),bytes);f.close();return n==bytes;
}
bool loadScene() {
 char path[64];snprintf(path,sizeof(path),"/ponygotchi/bg_%s.raw",scenes[int(game.scene())]);
 if(!readRaw(path,background,320*480*2))return false;
 loadedScene=game.scene();return true;
}
void fail(const char* message) {
 ready=false;tft.fillScreen(TFT_BLACK);tft.setTextColor(TFT_WHITE,TFT_BLACK);tft.setTextSize(1);tft.setCursor(8,40);tft.println(message);Serial.println(message);
}
void persist() {prefs.putBytes("game",&game.save,sizeof(game.save));dirtySave=false;lastSave=millis();}
void text(const char* value,int x,int y,int origin,uint16_t color=TFT_WHITE) {
 tile.setTextColor(color);tile.drawString(value,x,y-origin,2);
}
void button(const char* label,int x,int y,int w,int h,int origin) {
 tile.fillRect(x,y-origin,w,h,0xFF5E);tile.drawRect(x,y-origin,w,h,0xAB15);
 text(label,x+4,y+8,origin,0x514D);
}
void drawOverlay(int origin) {
 char buf[100];
 snprintf(buf,sizeof(buf),"%02lu:%02lu",(unsigned long)(game.save.minutes/60),(unsigned long)(game.save.minutes%60));
 tile.setTextColor(TFT_WHITE);tile.setTextSize(2);tile.drawString(buf,100,62-origin,2);tile.setTextSize(1);
 snprintf(buf,sizeof(buf),"Jour %lu",(unsigned long)game.save.day);text(buf,126,108,origin);
 if(game.hud) {
  tile.fillRect(8,153-origin,304,40,0xFF5E);
  snprintf(buf,sizeof(buf),"Joie %u  Faim %u  Energie %u  Eau %u",game.save.happiness,game.save.hunger,game.save.energy,game.save.hygiene);
  // Two short lines are readable on the 320px target.
  snprintf(buf,sizeof(buf),"Joie %u    Faim %u",game.save.happiness,game.save.hunger);text(buf,26,157,origin,0x514D);
  snprintf(buf,sizeof(buf),"Energie %u    Proprete %u",game.save.energy,game.save.hygiene);text(buf,26,174,origin,0x514D);
  const char* labels[]={"Manger","Jouer","Dormir","Laver"};
  for(int i=0;i<4;i++)button(labels[i],4+i*79,398,75,42,origin);
  button("Quetes - Atelier - Niveau",36,445,248,30,origin);
 }
 if(game.panel) {
  tile.fillRect(0,196-origin,320,284,0xFF5E);
  button("<",4,201,30,30,origin);button(tabs[tab],40,201,210,30,origin);button("X",270,201,44,30,origin);
  if(tab==0) {
   text("Facultatif, sans aucune penalite",8,238,origin,0x514D);
   const char* q[]={"Petit-dejeuner","Dejeuner","Diner","Bouger un peu","Faire une pause","Pause eau (3 recompenses max)"};
   for(int i=0;i<6;i++) {snprintf(buf,sizeof(buf),"%s%s",i==5?(game.save.water==3?"OK ":"+ "):(game.save.quests&(1<<i)?"OK ":"+ "),q[i]);button(buf,8,262+i*32,304,29,origin);}
  } else if(tab==1) {
   snprintf(buf,sizeof(buf),"%lu etoiles",(unsigned long)game.save.stars);text(buf,10,240,origin,0x514D);
   const char* items[]={"Sans accessoire","Noeud rose : 20 etoiles","Fleur : niv.2 / 40 etoiles"};
   for(int i=0;i<3;i++)button(items[i],8,270+i*48,304,42,origin);
  } else if(tab==2) {
   snprintf(buf,sizeof(buf),"Niveau %lu - XP %lu / %lu",(unsigned long)game.save.level,(unsigned long)game.save.xp,(unsigned long)(75+game.save.level*25));text(buf,10,250,origin,0x514D);
   text("Les soins donnent de l'XP.",10,290,origin,0x514D);text("Sauvegarde locale automatique.",10,320,origin,0x514D);
  } else if(tab==3) {
   text("Decouvertes sans changer les fonds",8,240,origin,0x514D);
   const char* locations[]={"Prairie : niveau 1","Clairiere : niveau 2","Etoile : niveau 3"};
   for(int i=0;i<3;i++){snprintf(buf,sizeof(buf),"%s%s",game.save.explored&(1<<i)?"OK ":"+ ",locations[i]);button(buf,8,270+i*48,304,42,origin);}
  } else {
   text("Reglage manuel, sans Wi-Fi",8,240,origin,0x514D);
   button("Heure +",12,280,140,45,origin);button("Minute +",164,280,144,45,origin);
   text("Hors tension : horloge arretee.",8,345,origin,0x514D);
   text("USB : TIME HH:MM",8,375,origin,0x514D);
  }
 }
}
// Restore only invalidated horizontal bands, compose offscreen, then transfer.
// No screen clear in the frame loop. 320x32 tile = 20 KiB internal RAM.
void renderBand(int top,int bottom,int left=0,int right=320) {
 if(!ready)return;
 top=constrain(top,0,480);bottom=constrain(bottom,0,480);
 for(int y=top;y<bottom;y+=32) {
  int h=min(32,bottom-y);
  uint16_t* pixels=static_cast<uint16_t*>(tile.getPointer());
  // TFT_eSprite stores bytes in display order; source RAW is little-endian RGB565.
  for(int j=0;j<h*320;j++){uint16_t v=background[y*320+j];pixels[j]=(v>>8)|(v<<8);}
  int px=int(game.x), py=game.hud?242:264;
  for(int row=max(y,py);row<min(y+h,py+144);row++)for(int col=max(0,px);col<min(320,px+144);col++) {
   int sx=game.direction>0?col-px:143-(col-px);
   uint16_t v=sprite[(row-py)*144+sx];if(v!=0xF81F)tile.drawPixel(col,row-y,v);
  }
  if(game.save.equipped) {
   int ax=game.direction>0?px+100:px+30;
   tile.fillRect(ax,py+18-y,12,8,game.save.equipped==1?0xF992:0xFFE0);
  }
  drawOverlay(y);
  tft.setViewport(left,y,right-left,h,false);
  tft.setSwapBytes(false);tft.pushImage(0,y,320,h,pixels);
  tft.resetViewport();
 }
}
void calibrateTouch() {
 tft.fillScreen(TFT_BLACK);tft.setTextColor(TFT_WHITE,TFT_BLACK);tft.setCursor(8,10);tft.println("Touchez les coins pour calibrer");
 uint16_t cal[5];tft.calibrateTouch(cal,TFT_MAGENTA,TFT_BLACK,15);prefs.putBytes("touch",cal,sizeof(cal));tft.setTouch(cal);calibrated=true;
 if(ready)renderBand(0,480);
}
void input(uint16_t x,uint16_t y) {
 game.lastInput=millis();
 if(game.panel) {
  if(y<196 || (y<235 && x>=260)){game.panel=false;}
  else if(y<235){tab=(tab+1)%5;}
  else if(tab==0 && y>=262 && y<454)dirtySave|=game.quest((y-262)/32);
  else if(tab==1 && y>=270 && y<414)dirtySave|=game.equip((y-270)/48);
  else if(tab==3 && y>=270 && y<414)dirtySave|=game.explore((y-270)/48);
  else if(tab==4 && y>=280 && y<325) {game.setTime((game.save.minutes/60+(x<160?1:0))%24,(game.save.minutes%60+(x>=160?1:0))%60);dirtySave=true;}
 } else if(game.hud && y>=445) {game.panel=true;tab=0;}
 else if(game.hud && y>=398) {dirtySave|=game.care(min(3,int(x/79)),millis());}
 else game.hud=!game.hud;
 if(dirtySave)persist();
 if(game.scene()!=loadedScene && !loadScene()){fail("Fond SD invalide");return;}
 renderBand(0,480); // UI transitions only, never the periodic animation path.
}
void serialInput() {
 while(Serial.available()) {
  char c=Serial.read();
  if(c=='\n') {
   serialLine[serialLength]=0;unsigned hh,mm;int count=0;
   if(sscanf(serialLine,"TIME %u:%u%n",&hh,&mm,&count)==2 && count==int(serialLength) && hh<24 && mm<60) {game.setTime(hh,mm);persist();if(ready){if(game.scene()!=loadedScene)loadScene();renderBand(0,480);}}
   else if(!strcmp(serialLine,"CALIBRATE"))calibrateTouch();
   else Serial.println("Commandes: TIME HH:MM / CALIBRATE");
   serialLength=0;
  } else if(c!='\r' && serialLength<sizeof(serialLine)-1)serialLine[serialLength++]=c;
 }
}
void setup() {
 Serial.begin(115200);prefs.begin("ponygotchi",false);
 if(prefs.getBytesLength("game")==sizeof(Save)) {Save saved;prefs.getBytes("game",&saved,sizeof(saved));if(valid(saved))game.save=saved;}
 tft.init();tft.setRotation(0);pinMode(TFT_BL,OUTPUT);digitalWrite(TFT_BL,HIGH);
 if(tft.width()!=320 || tft.height()!=480){fail("Rotation incorrecte : 320x480 requis");return;}
 uint16_t cal[5];if(prefs.getBytesLength("touch")==sizeof(cal)){prefs.getBytes("touch",cal,sizeof(cal));tft.setTouch(cal);calibrated=true;}
 if(!calibrated)calibrateTouch();
 if(!psramFound()){fail("PSRAM requise : verifier le profil");return;}
 background=static_cast<uint16_t*>(ps_malloc(320*480*2));spriteBank=static_cast<uint16_t*>(ps_malloc(32*144*144*2));
 sprite=spriteBank;
 tile.setColorDepth(16);tile.setAttribute(PSRAM_ENABLE,false);
 if(!background || !sprite || !tile.createSprite(320,32)){fail("Allocation graphique impossible");return;}
 sdSPI.begin(18,19,23,5);
 if(!SD.begin(5,sdSPI,4000000)){fail("SD absente : copier /ponygotchi");return;}
 if(!loadScene()){fail("Fond SD absent ou invalide");return;}
 for(int pose=0;pose<8;pose++)for(int frame=0;frame<4;frame++) {
  char path[64];snprintf(path,sizeof(path),"/ponygotchi/%s_%02d.raw",poses[pose],frame);
  if(!readRaw(path,spriteBank+(pose*4+frame)*144*144,144*144*2)){fail("Sprite SD absent ou invalide");return;}
 }
 ready=true;loadedPose=0;loadedFrame=0;renderBand(0,480);lastFrame=lastMinute=lastSave=millis();
 Serial.println("PonyGotchi fondation 0.10.0 - experimental, materiel non teste");
}
void loop() {
 serialInput();if(!ready){delay(10);return;}
 uint32_t now=millis();uint16_t tx,ty;bool pressed=calibrated && tft.getTouch(&tx,&ty);
 if(pressed && !wasPressed)input(tx,ty);wasPressed=pressed;
 if(elapsed(now,lastMinute,60000)) {lastMinute=now;game.minute();dirtySave=true;if(game.scene()!=loadedScene){if(!loadScene()){fail("Fond SD invalide");return;}renderBand(0,480);}else{renderBand(60,130);if(game.hud)renderBand(153,193);}}
 if(dirtySave && elapsed(now,lastSave,60000))persist();
 if(!elapsed(now,lastFrame,66))return; // nominal 15 FPS; actual panel rate needs measurement.
 int oldX=int(game.x);uint8_t oldFrame=game.frame;bool oldHud=game.hud;
 game.update(now,now-lastFrame,esp_random());lastFrame=now;
 bool newSprite=loadedPose!=int(game.pose) || loadedFrame!=game.frame;
 if(newSprite) {
  sprite=spriteBank+(int(game.pose)*4+game.frame)*144*144;
  loadedPose=int(game.pose);loadedFrame=game.frame;
 }
 if(oldHud!=game.hud)renderBand(0,480);
 else if(!game.panel && (newSprite || oldX!=int(game.x) || oldFrame!=game.frame))renderBand(game.hud?242:264,game.hud?386:408,min(oldX,int(game.x)),max(oldX,int(game.x))+144);
}
