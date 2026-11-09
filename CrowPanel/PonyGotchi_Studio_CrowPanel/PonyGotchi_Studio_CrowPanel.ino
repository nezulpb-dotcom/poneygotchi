/*
  PonyGotchi Studio - version experimentee pour CrowPanel DIS05035H v2.2.
  320x480, ILI9488, ESP32 WROVER-B, XPT2046 resistif, microSD via HSPI.
  TFT_eSPI User_Setup.h configure pour CE CrowPanel (voir README).
  Aucun Wi-Fi. Heure/date manuelles. Actifs fournis dans ../sd_files/.
  UI Cozy et illustrations du depot fournis par l'utilisateur.

  Le rendu anime compose une region de 176 x 144 en RAM puis la pousse
  en une operation pour eviter le scintillement des sprites et menus.
*/
#include <Arduino.h>
#include <TFT_eSPI.h>
#include <SPI.h>
#include <SD.h>
#include <Preferences.h>
#include <time.h>
#include <sys/time.h>
#include <esp_heap_caps.h>
#include "heure_manuelle.h"
#include "fireflies_rules.h"
#include "exploration_rules.h"
#include "care_layout.h"

constexpr int W=320,H=480,PW=144,PH=144,ROOM_TOP=192,ROOM_END=429;
constexpr uint16_t KEY=0xF81F;
constexpr int SD_CS=5, SD_SCK=18, SD_MISO=19, SD_MOSI=23, BL=27;
constexpr int COM_W=180;
enum Page {HOME=0,CARE=1,QUEST=2,SHOP=3,EXPLORE=4,SETTINGS=5,ARCADE=6,GAMES=8,LANTERNS=9,MEMORY=10,GARDEN=11,MENU=12};
constexpr int CARE_TOP=429, ROOM_BYTES=(ROOM_END-ROOM_TOP)*W*2;
uint32_t careTouchedAt=0;
const char* const worldNames[]={"day","dusk","night"};
const char* const rooms[]={"eat","play","wash","sleep","pet"};
const int sprForAction[]={4,3,7,5,3};
const char* const goodNames[]={"Manger","Jouer","Laver","Dormir","Calin"};
const char* const traitNames[]={"Faim","Joie","Proprete","Energie"};
const char* const shopNames[]={"Naturel","Noeud","Fleur","Couronne","Etoile","Pendentif","Chapeau"};
const int shopCosts[]={0,18,24,42,32,38,48};
constexpr int shopCount=sizeof(shopCosts)/sizeof(shopCosts[0]);
const char* const questNames[]={"Boire de l'eau","Noter un repas","Petite pause","Prendre l'air"};
const int questTargets[]={3,3,1,1};
const int questRewards[]={5,6,8,9};
const char* const treasureNames[]={"Petale rare","Clochette","Aile de fee","Trefle","Cristal","Champignon","Plume doree","Goutte de rosee"};
TFT_eSPI tft;
SPIClass sdBus(HSPI);
Preferences prefs;
uint16_t calibration[5]={0};
uint16_t* bgCache=nullptr;
uint16_t* comp=nullptr;
uint16_t* arcadeBuffer=nullptr;
uint16_t sprite[PW*PH];
uint16_t* rosyCache=nullptr;
constexpr size_t rosyBytes=32*sizeof(sprite);
uint16_t rowbuf[W];
uint16_t patchbuf[W];
int compWidth=COM_W;
uint16_t bgInk=0, lightInk=0, pinkInk=0, lineInk=0, accentInk=0, greenInk=0, goldInk=0;
int page=HOME, world=0, worldOverride=0, actionId=-1, petFrame=0, petState=0;
int hungry=82,joy=84,clean=86,energy=83,xp=0,stars=35,level=1,bond=0;
int petX=90,petY=265,lastPetX=90,lastPetY=265;
int owned=1, equipped=0, visits=0, discoveries=0;
int lastExploreIndex=-1;
bool lastExploreNew=false;
uint32_t exploreToastUntil=0;
int quests[4]={0,0,0,0};
int savedDay=0, brightness=255, arcadeScore=0, targetX=140,targetY=300;
uint8_t lanternSequence[Fireflies::maxLength];
int lanternLength=0, lanternCursor=0, lanternRounds=0, lanternBest=0;
int lanternDrawnPhase=-4;
uint32_t lanternStart=0;
bool lanternDone=false;
uint8_t memoryDeck[12];
uint16_t memoryMatched=0;
int memoryFirst=-1,memorySecond=-1,memoryMoves=0,memoryBest=0;
uint32_t memoryHideAt=0;
constexpr int gardenGrowSeconds=60;
struct GardenSave {
 uint64_t plots[3];
 uint32_t harvests;
};
GardenSave garden={};
int gardenDrawn[3]={-3,-3,-3};



bool softMode=true,sdReady=false,touched=false,clockValid=false;
unsigned long actionUntil=0, actionStart=0, exploreUntil=0, arcadeUntil=0;
unsigned long lastFrame=0,lastTouch=0,lastTick=0,lastSave=0,lastMinuteCheck=0,lastArcadeDraw=0;
String serialLine="";

int clampStat(int v){return constrain(v,0,100);}
uint16_t cc(int r,int g,int b){return tft.color565(r,g,b);}
void persist(bool storeTime=true){
 prefs.putInt("hun",hungry);prefs.putInt("joy",joy);prefs.putInt("clean",clean);prefs.putInt("energy",energy);
 prefs.putInt("xp",xp);prefs.putInt("stars",stars);prefs.putInt("level",level);prefs.putInt("bond",bond);
 prefs.putInt("owned",owned);prefs.putInt("wear",equipped);prefs.putInt("visits",visits);prefs.putInt("finds",discoveries);
 prefs.putInt("day",savedDay);prefs.putInt("bright",brightness);prefs.putInt("world",worldOverride);
 prefs.putBool("soft",softMode);
 for(int i=0;i<4;i++){char key[10];snprintf(key,sizeof(key),"q%d",i);prefs.putInt(key,quests[i]);}
 if(storeTime){time_t ts=time(nullptr);if(ts>1700000000)prefs.putULong64("epoch",(uint64_t)ts);}
 lastSave=millis();
}
void loadSave(){
 hungry=clampStat(prefs.getInt("hun",82));joy=clampStat(prefs.getInt("joy",prefs.getInt("hap",84)));
 clean=clampStat(prefs.getInt("clean",prefs.getInt("hyg",86)));energy=clampStat(prefs.getInt("energy",prefs.getInt("ene",83)));
 xp=max(0,prefs.getInt("xp",0));stars=max(0,prefs.getInt("stars",prefs.getInt("star",35)));
 level=max(1,prefs.getInt("level",1));bond=max(0,prefs.getInt("bond",0));
 owned=prefs.getInt("owned",1)|1; equipped=constrain(prefs.getInt("wear",0),0,shopCount-1);
 visits=max(0,prefs.getInt("visits",0));discoveries=prefs.getInt("finds",0)&Exploration::fullCollection;
 savedDay=prefs.getInt("day",0);brightness=constrain(prefs.getInt("bright",255),45,255);
 worldOverride=constrain(prefs.getInt("world",0),0,3);softMode=prefs.getBool("soft",true);
 for(int i=0;i<4;i++){char key[10];snprintf(key,sizeof(key),"q%d",i);quests[i]=max(0,prefs.getInt(key,0));}
}
void setEpoch(time_t stamp){
 struct timeval tv={};tv.tv_sec=stamp;settimeofday(&tv,nullptr);
}
void startClock(){
 setenv("TZ","CET-1CEST,M3.5.0/2,M10.5.0/3",1);tzset();
 uint64_t saved=prefs.getULong64("epoch",0);
 if(saved>1700000000ULL){setEpoch((time_t)saved);clockValid=true;return;}
 struct tm t={};t.tm_year=MANUAL_YEAR-1900;t.tm_mon=MANUAL_MONTH-1;
 t.tm_mday=MANUAL_DAY;t.tm_hour=MANUAL_HOUR;t.tm_min=MANUAL_MINUTE;
 t.tm_sec=MANUAL_SECOND;t.tm_isdst=-1;
 time_t ts=mktime(&t);if(ts!=(time_t)-1){setEpoch(ts);clockValid=true;}
}
int worldNow(){if(worldOverride>0)return worldOverride-1;struct tm d={};
 if(!getLocalTime(&d,15))return 0;return d.tm_hour>=21||d.tm_hour<6?2:(d.tm_hour>=18?1:0);
}
void resetDailyIfNeeded(){struct tm d={};if(!getLocalTime(&d,15))return;
 int today=(d.tm_year+1900)*10000+(d.tm_mon+1)*100+d.tm_mday;
 if(today!=savedDay){for(int &q:quests)q=0;savedDay=today;persist();}
}
void award(int amount,int coin){xp+=amount;stars+=coin;while(xp>=level*42){xp-=level*42;level++;stars+=12;}persist(false);}
void backlight(){analogWrite(BL,brightness);}

const char* backgroundPath(){static char name[26];snprintf(name,sizeof(name),"/%s.raw",worldNames[world]);return name;}
const char* roomPath(){static char name[32];snprintf(name,sizeof(name),"/room_%s.raw",rooms[actionId]);return name;}
File openRoom(){
 if(actionId<0||actionId>=5||millis()>=actionUntil)return File();
 File room=SD.open(roomPath(),FILE_READ);
 if(room&&room.size()!=3*ROOM_BYTES)room.close();
 return room;
}
bool readRoom(File& room,int x,int y,int width,uint16_t* dest){
 return room&&y>=ROOM_TOP&&y<ROOM_END
     &&room.seek(world*ROOM_BYTES+((y-ROOM_TOP)*W+x)*2)
     &&room.read((uint8_t*)dest,width*2)==width*2;
}
bool loadStage(){
 File f=SD.open(backgroundPath(),FILE_READ);
 if(!f||f.size()!=W*H*2)return false;
 if(!bgCache)return true;
 if(f.read((uint8_t*)bgCache,W*H*2)!=W*H*2)return false;
 File room=openRoom();
 if(room&&room.seek(world*ROOM_BYTES)){
  for(int y=ROOM_TOP;y<ROOM_END;y++){
   if(room.read((uint8_t*)patchbuf,W*2)!=W*2)break;
   memcpy(bgCache+y*W,patchbuf,W*2);
  }
 }
 return true;
}
void drawStageRows(int start,int end){
 tft.setSwapBytes(true);
 if(bgCache){tft.pushImage(0,start,W,end-start,bgCache+start*W);return;}
 File bg=SD.open(backgroundPath(),FILE_READ);
 if(!bg||!bg.seek(start*W*2))return;
 File room=openRoom();
 for(int y=start;y<end;y++){
  if(bg.read((uint8_t*)rowbuf,W*2)!=W*2)break;
  tft.pushImage(0,y,W,1,readRoom(room,0,y,W,patchbuf)?patchbuf:rowbuf);
 }
}
// Transparent UI is a prepared nine-sliced graphic from the user-provided Cozy pack.
void drawUiOverlay(const char* file){
 File f=SD.open(file,FILE_READ);if(!f)return;tft.setSwapBytes(true);
 for(int y=0;y<H;y++)if(f.read((uint8_t*)rowbuf,W*2)==W*2)tft.pushImage(0,y,W,1,rowbuf,KEY);
 f.close();
}
void drawAccessoryOnComp(int px,int py,int cw,int ch,int sx,int sy){
 if(!comp||equipped<=0)return;
 const bool resting=actionId==3;
 const int step=petState==1?(petFrame==1?-2:petFrame==3?2:0):0;
 const int cx=petX+(resting?83:90),cy=petY+(resting?46:26+step);
 auto dot=[&](int ax,int ay,int rad,uint16_t c){
   for(int dy=-rad;dy<=rad;dy++)for(int dx=-rad;dx<=rad;dx++){
    if(dx*dx+dy*dy>rad*rad)continue;int X=ax+dx-px,Y=ay+dy-py;
    if(X>=0&&X<cw&&Y>=0&&Y<ch)comp[Y*cw+X]=c;
   }
 };
 if(equipped==1){dot(cx-7,cy,5,pinkInk);dot(cx+7,cy,5,pinkInk);dot(cx,cy,3,goldInk);}
 if(equipped==2){for(int i=0;i<5;i++){double theta=i*6.283185/5;dot(cx+(int)(sin(theta)*8),cy+(int)(cos(theta)*8),4,pinkInk);}dot(cx,cy,4,goldInk);}
 if(equipped==3){for(int i=0;i<3;i++)dot(cx-9+i*9,cy-(i%2?5:0),4,goldInk);}
 if(equipped==4){dot(cx,cy,5,goldInk);dot(cx,cy-8,2,goldInk);dot(cx-8,cy,2,goldInk);dot(cx+8,cy,2,goldInk);dot(cx,cy+8,2,goldInk);}
 if(equipped==5){
  for(int x=-8;x<=8;x++)dot(cx+x,cy+40+(8-abs(x))/2,1,goldInk);
  dot(cx,cy+48,4,pinkInk);
 }
 if(equipped==6){
  uint16_t blue=cc(82,105,153);
  for(int x=-9;x<=9;x++)for(int y=-8;y<=3;y++)dot(cx+x,cy+y,0,y>=1?goldInk:blue);
  for(int x=-14;x<=14;x++)dot(cx+x,cy+4,1,blue);
 }
}
void drawEffectOnComp(int px,int py,int cw,int ch){
 if(actionId<0||millis()>actionUntil||!comp)return;
 const int cx=petX+131,cy=petY+77;
 auto pixel=[&](int X,int Y,uint16_t col){int xx=X-px,yy=Y-py;if(xx>=0&&xx<cw&&yy>=0&&yy<ch)comp[yy*cw+xx]=col;};
 auto circle=[&](int ax,int ay,int r,uint16_t c,bool hollow=false){
   for(int yy=-r;yy<=r;yy++)for(int xx=-r;xx<=r;xx++){
    int d=xx*xx+yy*yy;if(d<=r*r&&(!hollow||d>=(r-2)*(r-2)))pixel(ax+xx,ay+yy,c);
   }
 };
 unsigned long elapsed=millis()-actionStart;
 if(actionId==0){circle(cx-5,cy,7,cc(221,79,87));pixel(cx,cy-10,greenInk);}
 else if(actionId==1){int yy=cy+22-(int)(fabs(sin(elapsed/170.0))*32);circle(cx+3,yy,9,pinkInk);circle(cx+3,yy,5,goldInk);}
 else if(actionId==2){for(int i=0;i<5;i++){int yy=petY+120-(int)((elapsed/18+i*21)%110);circle(petX+19+i*26,yy,3+(i%3),cc(186,244,250),true);}}
 else if(actionId==3){for(int i=0;i<3;i++){int x=cx+i*8,y=cy-i*17-(int)((elapsed/200)%10);circle(x,y,2+i,cc(250,235,218));}}
 else if(actionId==4){circle(cx-8,cy-30,5,pinkInk);circle(cx+1,cy-30,5,pinkInk);}
}
// A missing large frame buffer must not freeze the character. When both
// PSRAM and internal allocations fail, render short strips without clearing LCD.
void reportAnimError(const char* reason){
 static uint32_t last=0;
 const uint32_t now=millis();
 if(now-last<1500)return;
 last=now;
 Serial.printf("[ANIM ERR] %s heap=%u psram=%u\n",reason,
               (unsigned)ESP.getFreeHeap(),
               (unsigned)heap_caps_get_free_size(MALLOC_CAP_SPIRAM));
}
bool drawPonyComposited(int oldX,int newX,int y,int state,int frame,bool fullBand){
 const int left=fullBand?0:max(0,min(oldX,newX));
 const int right=fullBand?W:min(W,max(oldX,newX)+PW+8);
 const int top=max(0,y),bottom=min(H,y+PH);
 const int cw=right-left,ch=bottom-top;
 if(state<0||state>=8||frame<0||frame>=4){reportAnimError("bad sprite state/frame");return false;}
 if(cw<=0||cw>W||ch<=0||ch>PH||(comp&&cw>compWidth)){
  reportAnimError("bad compositor region");return false;
 }
 const uint32_t offset=((uint32_t)state*4+(uint32_t)frame)*sizeof(sprite);
 const uint16_t* pixels=sprite;
 if(rosyCache){
  pixels=rosyCache+offset/sizeof(uint16_t);
 }else{
  File sf=SD.open("/rosy.raw",FILE_READ);
  if(!sf){reportAnimError("rosy.raw missing");return false;}
  if(sf.size()!=rosyBytes){sf.close();reportAnimError("rosy.raw has wrong length");return false;}
  const bool ok=sf.seek(offset)&&sf.read((uint8_t*)sprite,sizeof(sprite))==sizeof(sprite);
  sf.close();
  if(!ok){reportAnimError("rosy.raw read failed");return false;}
 }
 // W x 8 x RGB565, 5120 bytes. Used only when the normal buffer is unavailable.
 static uint16_t stripe[W*8];
 const int bandSize=comp?PH:8;
 File bg,room;
 if(!bgCache){
  bg=SD.open(backgroundPath(),FILE_READ);
  if(!bg){reportAnimError("background missing");return false;}
  room=openRoom();
 }
 for(int bandTop=top;bandTop<bottom;bandTop+=bandSize){
  const int rows=min(bandSize,bottom-bandTop);
  uint16_t* target=comp?comp:stripe;
  for(int row=0;row<rows;row++){
   const int screenY=bandTop+row;
   uint16_t* dest=target+row*cw;
   if(bgCache){
    memcpy(dest,bgCache+(uint32_t)screenY*W+left,cw*2);
   }else{
    const uint32_t position=((uint32_t)screenY*W+left)*2;
    if(!bg.seek(position)||bg.read((uint8_t*)dest,cw*2)!=cw*2){
     bg.close();if(room)room.close();
     reportAnimError("background strip read failed");
     return false;
    }
    if(readRoom(room,left,screenY,cw,patchbuf))memcpy(dest,patchbuf,cw*2);
   }
  }
  for(int row=0;row<rows;row++){
   const int spriteY=bandTop+row-y;
   if(spriteY<0||spriteY>=PH)continue;
   const uint16_t* line=pixels+(uint32_t)spriteY*PW;
   uint16_t* dest=target+row*cw;
   for(int sx=0;sx<PW;sx++){
    const int dx=newX+sx-left;
    if(dx>=0&&dx<cw&&line[sx]!=KEY)dest[dx]=line[sx];
   }
  }
  // Draw optional equipment and action particles in the current strip.
  uint16_t* prior=comp;
  comp=target;
  drawAccessoryOnComp(left,bandTop,cw,rows,0,0);
  drawEffectOnComp(left,bandTop,cw,rows);
  comp=prior;
  tft.setSwapBytes(true);
  tft.pushImage(left,bandTop,cw,rows,target);
 }
 if(bg)bg.close();
 if(room)room.close();
 return true;
}
void centered(const String& s,int x,int y,int font=2,uint16_t color=0,bool darkBg=false){
 tft.setTextDatum(MC_DATUM);tft.setTextColor(color);tft.drawString(s,x,y,font);
}
void label(const String& s,int x,int y,int font=2,uint16_t color=0){
 tft.setTextDatum(TL_DATUM);tft.setTextColor(color);tft.drawString(s,x,y,font);
}
void pill(int x,int y,int w,int h,const String& title,bool active=false){
 tft.fillRoundRect(x,y,w,h,9,active?pinkInk:lightInk);
 tft.drawRoundRect(x,y,w,h,9,active?accentInk:lineInk);
 centered(title,x+w/2,y+h/2,2,bgInk);
}
void topClock(){
 struct tm now={};bool ok=getLocalTime(&now,15)&&(now.tm_year+1900)>=2025;
  if(page!=HOME&&page!=CARE&&page!=MENU){
  pill(14,15,122,44,"< Retour a Rosy");
  if(ok){char stamp[6];snprintf(stamp,sizeof(stamp),"%02d:%02d",now.tm_hour,now.tm_min);pill(233,15,73,44,stamp);}
  return;
 }
 if(ok){char buf[24];snprintf(buf,sizeof(buf),"%02d:%02d",now.tm_hour,now.tm_min);
 centered(buf,161,96,6,TFT_BLACK);
 centered(buf,160,94,6,TFT_WHITE);
 const char* const days[]={"Dimanche","Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi"};
 const char* const months[]={"janv.","fevr.","mars","avr.","mai","juin","juil.","aout","sept.","oct.","nov.","dec."};
 char dateBuf[43];snprintf(dateBuf,sizeof(dateBuf),"%s %d %s",days[now.tm_wday],now.tm_mday,months[now.tm_mon]);
 centered(dateBuf,161,44,2,TFT_BLACK);
 centered(dateBuf,160,43,2,TFT_WHITE);
 }else{centered("--:--",160,94,6,TFT_WHITE);centered("Regler l'heure",160,43,2,TFT_WHITE);}

}
void topStats(){if(page==HOME)return;
 pill(13,93,137,28,String("Rosy  Nv ")+level);
 pill(252,95,58,26,String("*")+stars);
}
void bar(int x,int y,int w,int value,uint16_t c){
 tft.fillRoundRect(x,y,w,10,4,lineInk);
 int filled=(w-4)*clampStat(value)/100;
 if(filled>0)tft.fillRect(x+2,y+2,filled,6,c);
}
void headerTitle(const String& heading,const String& sub=""){
 tft.fillRoundRect(11,89,298,382,17,lightInk);
 tft.drawRoundRect(11,89,298,382,17,lineInk);
 uint16_t ribbon=world==2?cc(92,80,120):world==1?cc(146,82,100):cc(78,111,91);
 tft.fillRoundRect(22,99,276,58,11,ribbon);
 centered(heading,151,120,2,TFT_WHITE);
 if(sub.length())centered(sub,153,143,2,TFT_WHITE);
 pill(269,97,34,31,"X");
}
void drawCare(){
 // Keep Rosy's full 144-pixel animation unobstructed (y=185..329).
 // A compact header holds the menu button; four large gauges appear BELOW
 // Rosy and ABOVE the existing 73 x 47 px care action buttons.
 tft.fillRoundRect(CareLayout::headerLeft,CareLayout::headerTop,
                   CareLayout::headerWidth,CareLayout::headerHeight,12,lightInk);
 tft.drawRoundRect(CareLayout::headerLeft,CareLayout::headerTop,
                   CareLayout::headerWidth,CareLayout::headerHeight,12,lineInk);
 centered("Besoins de Rosy",115,147,2,bgInk);
 centered("Touchez Rosy pour un calin",115,170,1,accentInk);
 pill(245,134,60,44,"Menu");

 tft.fillRoundRect(CareLayout::statsLeft,CareLayout::statsTop,
                   CareLayout::statsWidth,CareLayout::statsHeight,12,lightInk);
 tft.drawRoundRect(CareLayout::statsLeft,CareLayout::statsTop,
                   CareLayout::statsWidth,CareLayout::statsHeight,12,lineInk);
 const char* needs[]={"Faim","Joie","Proprete","Energie"};
 const int values[]={hungry,joy,clean,energy};
 const uint16_t colors[]={goldInk,pinkInk,greenInk,accentInk};
 for(int i=0;i<4;i++){
  const int x=CareLayout::tileX(i),y=CareLayout::tileY(i);
  tft.fillRoundRect(x,y,CareLayout::tileWidth,CareLayout::tileHeight,8,cc(255,252,247));
  tft.drawRoundRect(x,y,CareLayout::tileWidth,CareLayout::tileHeight,8,lineInk);
  label(needs[i],x+8,y+3,2,bgInk);
  centered(String(values[i])+"%",x+CareLayout::tileWidth-29,y+12,2,accentInk);
  bar(x+8,y+23,CareLayout::gaugeWidth,values[i],colors[i]);
 }
 // Unchanged action hit targets: physical fingertip-sized 73 x 47 px.
 for(int i=0;i<CareLayout::actionCount;i++){
  const int x=CareLayout::actionsLeft+i*CareLayout::actionPitch;
  tft.fillRoundRect(x,CareLayout::actionsTop,CareLayout::actionWidth,
                    CareLayout::actionHeight,9,lightInk);
  tft.drawRoundRect(x,CareLayout::actionsTop,CareLayout::actionWidth,
                    CareLayout::actionHeight,9,lineInk);
  centered(goodNames[i],x+36,CareLayout::actionsTop+15,2,bgInk);
  bar(x+7,CareLayout::actionsTop+30,59,values[i],accentInk);
 }
}
void drawHandle(){
 tft.fillRoundRect(141,458,38,4,2,TFT_WHITE);
}
void toggleCare(bool visible){
 if(visible){
  page=CARE;
  careTouchedAt=millis();
  drawCare();
 }else{
  page=HOME;
  drawStageRows(CareLayout::headerTop,CareLayout::headerTop+CareLayout::headerHeight);
  drawStageRows(CareLayout::statsTop,CareLayout::statsTop+CareLayout::statsHeight);
  drawStageRows(CARE_TOP,H);
  drawHandle();
 }
}
void drawMenu(){
 tft.fillRoundRect(8,348,304,125,14,lightInk);
 tft.drawRoundRect(8,348,304,125,14,lineInk);
 const char* labels[]={"Journal","Explorer","Mini-jeux","Boutique","Reglages","Soins"};
 for(int i=0;i<6;i++)pill(15+i%3*98,357+i/3*55,94,49,labels[i]);
}
void drawQuest(){
 headerTitle("Petit journal","Missions facultatives, sans penalite");
 for(int i=0;i<4;i++){int y=175+i*68;
  tft.fillRoundRect(24,y,272,59,10,cc(255,250,241));tft.drawRoundRect(24,y,272,59,10,lineInk);
  label(questNames[i],37,y+9,2,bgInk);
  char b[42];snprintf(b,sizeof(b),"%d / %d    +%d etoiles",quests[i],questTargets[i],questRewards[i]);
  label(b,37,y+32,2,accentInk);
  pill(245,y+10,40,38,quests[i]>=questTargets[i]?"OK":"+");
 }
 centered("Aucun jour manque n'est puni",160,450,2,accentInk);
}
void drawShop(){
 headerTitle("La garde-robe","Les accessoires de Rosy");
 centered(String(stars)+" etoiles",160,174,2,bgInk);
 for(int i=0;i<shopCount;i++){
  int x=24+(i%2)*139,y=188+(i/2)*59;
  bool wearing=equipped==i,have=owned&(1<<i);
  tft.fillRoundRect(x,y,132,51,8,wearing?pinkInk:lightInk);
  tft.drawRoundRect(x,y,132,51,8,lineInk);
  centered(shopNames[i],x+66,y+16,2,bgInk);
  centered(wearing?"Equipe":have?"Equiper":String(shopCosts[i])+" *",x+66,y+35,2,accentInk);
 }
}
void drawExplore(){
 headerTitle("Le carnet d'aventures","Les souvenirs de la prairie");
 int count=__builtin_popcount((unsigned int)discoveries&0xff);
 centered(count==8?String("Collection complete !"):String(count)+" / 8 souvenirs",160,174,2,bgInk);
 for(int i=0;i<8;i++){
  int x=26+(i%2)*137,y=193+(i/2)*44;
  bool found=discoveries&(1<<i);
  tft.fillRoundRect(x,y,131,37,9,found?cc(245,232,214):lightInk);
  tft.drawRoundRect(x,y,131,37,9,lineInk);
  centered(found?treasureNames[i]:"...",x+65,y+18,2,bgInk);
 }
 if(lastExploreIndex>=0)
  centered(String(lastExploreNew?"Trouve : ":"Retrouve : ")+treasureNames[lastExploreIndex],160,386,2,accentInk);
 else centered("Chaque balade revele un souvenir",160,386,2,accentInk);
 pill(62,404,196,44,"Partir explorer");
 centered("Nouveau : +10 etoiles   Deja vu : +3",160,458,1,accentInk);
}
void drawSettings(){
 headerTitle("Parametres","100 % hors ligne");
 struct tm d={};getLocalTime(&d,15);
 tft.setTextDatum(TL_DATUM);label("Date et heure",30,171,2,bgInk);
 char dat[38];snprintf(dat,sizeof(dat),"%02d/%02d/%04d  %02d:%02d",d.tm_mday,d.tm_mon+1,d.tm_year+1900,d.tm_hour,d.tm_min);
 pill(24,192,225,44,dat);pill(254,194,44,40,"+");
 label("Ambiance automatique",30,258,2,bgInk);
 for(int i=0;i<4;i++){pill(23+i*72,277,66,31,i==0?"Auto":i==1?"Jour":i==2?"Soir":"Nuit",worldOverride==i);}
 label("Mode de jeu",30,324,2,bgInk);
 pill(24,344,128,34,"Doux",softMode);pill(163,344,130,34,"Classique",!softMode);
 label(String("Luminosite : ")+(brightness*100/255)+"%",30,398,2,bgInk);
 pill(207,385,42,38,"-");pill(252,385,42,38,"+");
 centered("L'heure repart du dernier enregistrement",160,456,2,accentInk);
}
void drawTimeEditor(){
 headerTitle("Regler l'horloge","Date et heure manuelles");
 struct tm d={};getLocalTime(&d,15);
 int val[]={d.tm_year+1900,d.tm_mon+1,d.tm_mday,d.tm_hour,d.tm_min};
 const char* labels[]={"Annee","Mois","Jour","Heure","Minute"};
 for(int i=0;i<5;i++){int y=177+i*46;label(labels[i],30,y+12,2,bgInk);
 pill(151,y,42,34,"-");char out[12];snprintf(out,sizeof(out),"%02d",val[i]);centered(out,225,y+17,2,bgInk);pill(255,y,42,34,"+");}
 pill(61,421,198,39,"Termine");
}
void drawArcade(bool first=false){
 if(first)headerTitle("Attrape-etoiles","Touche l'etoile le plus vite possible");
 int left=(int)(arcadeUntil>millis()?(arcadeUntil-millis()+999)/1000:0);
 tft.fillRect(35,168,252,31,lightInk);
 centered(String("Temps : ")+left+" s",100,183,2,bgInk);
 centered(String("Score : ")+arcadeScore,224,183,2,bgInk);
 const int aw=264,ah=212;uint16_t backdrop=cc(227,233,215);
 if(arcadeBuffer){
  for(int i=0;i<aw*ah;i++)arcadeBuffer[i]=backdrop;
  for(int x=0;x<aw;x++){arcadeBuffer[x]=lineInk;arcadeBuffer[(ah-1)*aw+x]=lineInk;}
  for(int y=0;y<ah;y++){arcadeBuffer[y*aw]=lineInk;arcadeBuffer[y*aw+aw-1]=lineInk;}
  if(arcadeUntil>millis()){
   int sx=targetX-28,sy=targetY-202;
   for(int dy=-24;dy<=24;dy++)for(int dx=-24;dx<=24;dx++){
    int px=sx+dx,py=sy+dy;if(px<0||px>=aw||py<0||py>=ah)continue;
    int q=dx*dx+dy*dy;
    if(q<350||abs(dx)<2||abs(dy)<2)arcadeBuffer[py*aw+px]=q<150?cc(255,249,219):goldInk;
   }
  }
  tft.setSwapBytes(true);tft.pushImage(28,202,aw,ah,arcadeBuffer);
 }else{
  tft.fillRoundRect(28,202,aw,ah,10,backdrop);
  tft.drawRoundRect(28,202,aw,ah,10,lineInk);
  if(arcadeUntil>millis()){tft.fillCircle(targetX,targetY,20,goldInk);tft.fillCircle(targetX,targetY,12,cc(255,249,211));}
 }
 if(!arcadeUntil||arcadeUntil<=millis()){
  centered(String("Bravo ! ")+arcadeScore+" etoiles attrapees",160,285,2,bgInk);
  pill(87,322,146,46,"Rejouer");
 }
 if(first)pill(73,429,174,33,"Retour");
}
void drawGames(){
 headerTitle("La clairiere des jeux","Quatre jeux avec Rosy");
 pill(34,175,120,94,"Attrape-etoiles");
 pill(34,288,120,94,"Lucioles");
 pill(166,175,120,94,"Memory");
 pill(166,288,120,94,"Jardin enchante");
 pill(72,421,176,44,"Retour aux soins");
}
int gardenStatus(int index,time_t now){
 const uint64_t plot=garden.plots[index];
 if(!plot)return -2;
 if(plot==1)return -1;
 if(now<0||(uint64_t)now<plot)return gardenGrowSeconds;
 uint64_t elapsed=(uint64_t)now-plot;
 return elapsed>=gardenGrowSeconds?0:gardenGrowSeconds-(int)elapsed;
}
void drawPlot(int i,int status){
 int y=178+i*75;
 tft.fillRoundRect(28,y,264,65,10,lightInk);
 tft.drawRoundRect(28,y,264,65,10,lineInk);
 centered(String("Parcelle ")+(i+1),94,y+32,2,bgInk);
 String label=status==-2?"Planter":status==-1?"Arroser":status==0?"Recolter":String(status)+" s";
 pill(169,y+10,106,45,label,status==0);
 gardenDrawn[i]=status;
}
void drawGarden(){
 headerTitle("Jardin enchante","Plante, arrose, puis recolte");
 const time_t now=time(nullptr);
 for(int i=0;i<3;i++)drawPlot(i,gardenStatus(i,now));
 centered(String(garden.harvests)+" fleurs recoltees",160,408,2,bgInk);
 pill(72,425,176,43,"Retour aux jeux");
}
void drawMemoryCard(int i){
 static const char* names[]={"Noeud","Fleur","Couronne","Chapeau","Collier","Etoile"};
 bool matched=memoryMatched&(1<<i);
 bool face=matched||memoryFirst==i||memorySecond==i;
 int x=39+(i%4)*62,y=192+(i/4)*61;
 tft.fillRoundRect(x,y,56,53,9,matched?cc(221,239,212):face?lightInk:cc(236,207,220));
 tft.drawRoundRect(x,y,56,53,9,lineInk);
 centered(face?names[memoryDeck[i]]:"?",x+28,y+26,1,bgInk);
}
void drawMemoryStatus(){
 tft.fillRect(31,161,258,25,lightInk);
 if(memoryMatched==0x0fff){
  centered(String("Record : ")+memoryBest+" essais",160,174,2,bgInk);
  pill(79,377,162,42,"Rejouer");
 }else{
  centered(String(__builtin_popcount((unsigned int)memoryMatched)/2)+" / 6 paires",160,174,2,bgInk);
 }
}
void drawMemory(){
 headerTitle("Memory de Rosy","Retourne les cartes et trouve les paires");
 for(int i=0;i<12;i++)drawMemoryCard(i);
 drawMemoryStatus();
 pill(72,425,176,43,"Retour aux jeux");
}
int lanternPhase(uint32_t now){
 if(lanternDone)return -3;
 uint32_t elapsed=now-lanternStart;
 if(elapsed<500)return -1;
 elapsed-=500;
 const uint32_t period=Fireflies::flashMs+Fireflies::gapMs;
 if(elapsed>=lanternLength*period)return -2;
 return elapsed%period<Fireflies::flashMs?lanternSequence[elapsed/period]:-1;
}
void drawLanterns(bool first){
 int phase=lanternPhase(millis());
 lanternDrawnPhase=phase;
 if(first){
  headerTitle("Ronde des lucioles","Observe, puis repete l'ordre");
  pill(72,429,176,33,"Retour aux jeux");
 }
 tft.fillRect(29,163,262,246,lightInk);
 String status="Observe les lanternes";
 if(phase==-2)status=String("A toi : ")+lanternCursor+"/"+lanternLength;
 if(lanternDone)status=String("Rondes : ")+lanternRounds+" / Record : "+lanternBest;
 centered(status,160,177,2,bgInk);
 const char* names[]={"Fleur","Lune","Etoile","Coeur"};
 const uint16_t colors[]={cc(242,168,190),cc(174,183,238),cc(247,216,138),cc(163,210,177)};
 for(int i=0;i<Fireflies::symbols;i++){
  int x=53+(i%2)*113,y=198+(i/2)*82;
  tft.fillRoundRect(x,y,101,70,12,i==phase?colors[i]:lightInk);
  tft.drawRoundRect(x,y,101,70,12,lineInk);
  centered(names[i],x+50,y+35,2,bgInk);
 }
 if(lanternDone)pill(84,363,152,35,"Rejouer");
}
void drawExploreToast(){
 if(page!=HOME||lastExploreIndex<0||!exploreToastUntil||
    (int32_t)(millis()-exploreToastUntil)>=0)return;
 tft.fillRoundRect(22,366,276,49,12,lightInk);
 tft.drawRoundRect(22,366,276,49,12,lineInk);
 centered(lastExploreNew?"Nouveau souvenir !":"Souvenir retrouve",160,380,2,bgInk);
 centered(String(treasureNames[lastExploreIndex])+
          String(lastExploreNew?"  +10 *":"  +3 *"),160,400,2,accentInk);
}
void drawCurrent(){
 if(!sdReady){tft.fillScreen(TFT_NAVY);return;}
 world=actionId==3&&millis()<actionUntil?2:worldNow();
 if(!loadStage()){
  tft.fillScreen(TFT_NAVY);
  centered("Decor microSD manquant",160,220,2,TFT_WHITE);
  Serial.println("ERROR STAGE");
  return;
 }
 petY=185;
 const bool showPony=page==HOME||page==CARE||page==MENU;
 if(showPony&&compWidth==W&&drawPonyComposited(petX,petX,petY,petState,petFrame,true)){
  drawStageRows(0,petY);
  drawStageRows(petY+PH,H);
 }else{
  drawStageRows(0,H);
  if(showPony)drawPonyComposited(petX,petX,petY,petState,petFrame,false);
 }
 topClock();
 if(page==HOME)drawHandle();
 if(page==CARE)drawCare();else if(page==MENU)drawMenu();else if(page==QUEST)drawQuest();else if(page==SHOP)drawShop();
 else if(page==EXPLORE)drawExplore();else if(page==SETTINGS)drawSettings();
 else if(page==GAMES)drawGames();else if(page==MEMORY)drawMemory();else if(page==GARDEN)drawGarden();else if(page==LANTERNS)drawLanterns(true);else if(page==ARCADE)drawArcade(true);else if(page==7)drawTimeEditor();
 drawExploreToast();
 lastPetX=petX;lastPetY=petY;
}
void go(int p){page=p;if(page==CARE)careTouchedAt=millis();if(actionId<0){petState=0;petFrame=0;}drawCurrent();}
void doAction(int id){if(id<0||id>4)return;
 if(id==0){hungry=clampStat(hungry+19);joy=clampStat(joy+3);}
 if(id==1){joy=clampStat(joy+20);energy=clampStat(energy-5);}
 if(id==2){clean=clampStat(clean+26);}
 if(id==3){energy=clampStat(energy+23);}
 if(id==4){joy=clampStat(joy+8);bond++;}
 award(id==1?11:8,id==1?3:2);
 actionId=id;actionStart=millis();actionUntil=millis()+(id==3?3500:2600);
 petState=sprForAction[id];petFrame=0;drawCurrent();
}
void doQuest(int i){resetDailyIfNeeded();if(i<0||i>3||quests[i]>=questTargets[i])return;
 quests[i]++;award(9,questRewards[i]);drawCurrent();
}
void buy(int i){if(i<0||i>=shopCount)return;
 if(!(owned&(1<<i))){if(stars<shopCosts[i])return;stars-=shopCosts[i];owned|=1<<i;}
 equipped=i;persist(false);go(CARE);
}
void startExplore(){
 page=HOME;
 exploreToastUntil=0;
 actionId=4;actionUntil=millis()+4800;actionStart=millis();
 petState=3;exploreUntil=millis()+4800;drawCurrent();
}
void endExplore(){
 if(!exploreUntil)return;
 exploreUntil=0;
 const Exploration::Discovery found=Exploration::discover(
    (uint8_t)discoveries,(uint32_t)random(0x7fffffff));
 visits++;
 discoveries|=(1<<found.index);
 lastExploreIndex=found.index;
 lastExploreNew=found.isNew;
 exploreToastUntil=millis()+4000;
 award(found.xp,found.stars);
}
void startArcade(){arcadeScore=0;arcadeUntil=millis()+15000;targetX=60+random(200);targetY=239+random(145);go(ARCADE);}
void setTimePart(int part,int delta){
 struct tm d={};if(!getLocalTime(&d,15))return;
 if(part==0)d.tm_year+=delta;
 else if(part==1)d.tm_mon+=delta;
 else if(part==2)d.tm_mday+=delta;
 else if(part==3)d.tm_hour+=delta;
 else if(part==4)d.tm_min+=delta;
 d.tm_isdst=-1;time_t ts=mktime(&d);
 if(ts!=(time_t)-1){setEpoch(ts);resetDailyIfNeeded();persist();drawCurrent();}
}
void nextLanternRound(int length){
 while(lanternLength<length)lanternSequence[lanternLength++]=random(Fireflies::symbols);
 lanternCursor=0;
 lanternStart=millis();
}
void startLanterns(){
 lanternDone=false;
 lanternRounds=0;
 lanternLength=0;
 nextLanternRound(Fireflies::initialLength);
 go(LANTERNS);
}
void enterLantern(int index){
 if(index==lanternSequence[lanternCursor]){
  if(++lanternCursor<lanternLength){drawLanterns(false);return;}
  lanternRounds++;
  if(lanternLength<Fireflies::maxLength){
   nextLanternRound(lanternLength+1);
   drawLanterns(false);
   return;
  }
 }
 lanternDone=true;
 if(lanternRounds>lanternBest){
  lanternBest=lanternRounds;
  prefs.putInt("lanternBest",lanternBest);
 }
 if(lanternRounds)award(lanternRounds*4,lanternRounds*Fireflies::rewardPerRound);
 drawLanterns(false);
}
void startMemory(){
 for(int i=0;i<12;i++)memoryDeck[i]=i/2;
 for(int i=11;i>0;i--){
  int j=random(i+1);
  uint8_t swap=memoryDeck[i];
  memoryDeck[i]=memoryDeck[j];
  memoryDeck[j]=swap;
 }
 memoryMatched=0;
 memoryFirst=memorySecond=-1;
 memoryMoves=0;
 memoryHideAt=0;
 go(MEMORY);
}
void revealMemory(int i){
 if(memorySecond>=0||memoryFirst==i||(memoryMatched&(1<<i)))return;
 if(memoryFirst<0){memoryFirst=i;drawMemoryCard(i);return;}
 memorySecond=i;
 memoryMoves++;
 if(memoryDeck[memoryFirst]!=memoryDeck[i]){
  memoryHideAt=millis()+750;
  drawMemoryCard(i);
  return;
 }
 int first=memoryFirst;
 memoryMatched|=(1<<first)|(1<<i);
 memoryFirst=memorySecond=-1;
 drawMemoryCard(first);
 drawMemoryCard(i);
 if(memoryMatched==0x0fff){
  if(!memoryBest||memoryMoves<memoryBest){
   memoryBest=memoryMoves;
   prefs.putInt("memoryBest",memoryBest);
  }
  award(15,max(6,24-memoryMoves));
 }
 drawMemoryStatus();
}
void tendPlot(int i){
 const time_t now=time(nullptr);
 int status=gardenStatus(i,now);
 if(status>0)return;
 if(status==-2)garden.plots[i]=1;
 else if(status==-1){
  if(now<=1)return;
  garden.plots[i]=(uint64_t)now;
 }else{
  garden.plots[i]=0;
  garden.harvests++;
 }
 prefs.putBytes("garden",&garden,sizeof(garden));
 if(status==0)award(8,4);
 else if(status==-1)persist();
 drawPlot(i,gardenStatus(i,now));
 tft.fillRect(31,397,258,23,lightInk);
 centered(status==0?"Fleur recoltee : +4 etoiles":String(garden.harvests)+" fleurs recoltees",160,408,2,bgInk);
}
void touch(int x,int y){
 if(page==HOME||page==CARE){
  const bool petHit=x>petX+10&&x<petX+137&&y>petY+12&&y<petY+130;
  if(petHit){
   if(page==HOME)page=CARE;
   careTouchedAt=millis();
   doAction(4);
   return;
  }
  if(page==HOME){toggleCare(true);return;}
  careTouchedAt=millis();
  if(x>=245&&x<305&&y>=134&&y<178){go(MENU);return;}
  const int careAction=CareLayout::careActionAt(x,y);
  if(careAction>=0)doAction(careAction);
  else if(y<130||(y>=182&&y<CARE_TOP&&!CareLayout::inStats(x,y)))
   toggleCare(false);
  return;
 }
 if((y>=15&&y<59&&x>=14&&x<136)||(y>=90&&y<137&&x>268)){go(HOME);return;}
 if(page==MENU){
  const int pages[]={QUEST,EXPLORE,GAMES,SHOP,SETTINGS,CARE};
  for(int i=0;i<6;i++){
   int left=15+i%3*98,top=357+i/3*55;
   if(x>=left&&x<left+94&&y>=top&&y<top+49){go(pages[i]);return;}
  }
  if(y<348)go(HOME);
  return;
 }
 if(page==QUEST){if(x>=234&&y>=168&&y<=440){int i=(y-175)/68;if(i>=0&&i<4)doQuest(i);}return;}
 if(page==SHOP){
  for(int i=0;i<shopCount;i++){
   int left=24+(i%2)*139,top=188+(i/2)*59;
   if(x>=left&&x<left+132&&y>=top&&y<top+51){buy(i);break;}
  }
  return;
 }
 if(page==EXPLORE){if(y>=395&&y<=459)startExplore();return;}
 if(page==SETTINGS){
  if(y>=190&&y<242&&x>243){go(7);return;}
  if(y>=273&&y<317){int n=(x-23)/72;if(n>=0&&n<4){worldOverride=n;persist(false);drawCurrent();}return;}
  if(y>=340&&y<386){softMode=x<158;persist(false);drawCurrent();return;}
  if(y>=383&&y<430&&x>200){brightness=constrain(brightness+(x<251?-18:18),45,255);backlight();persist(false);drawCurrent();return;}
  return;
 }
 if(page==7){if(y>=420){go(SETTINGS);return;}
  if(y>=177&&y<407){int i=(y-177)/46;int change=x>=250?1:(x>=148&&x<=198?-1:0);if(change)setTimePart(i,change);}return;
 }
 if(page==GAMES){
  if(y>=421)go(CARE);
  else if(y>=175&&y<=269){
   if(x>=34&&x<=154)startArcade();
   else if(x>=166&&x<=286)startMemory();
  }else if(y>=288&&y<=382){
   if(x>=34&&x<=154)startLanterns();
   else if(x>=166&&x<=286)go(GARDEN);
  }
  return;
 }
 if(page==GARDEN){
  if(y>=425){go(GAMES);return;}
  for(int i=0;i<3;i++){
   int top=188+i*75;
   if(x>=169&&x<=275&&y>=top&&y<=top+45){tendPlot(i);break;}
  }
  return;
 }
 if(page==MEMORY){
  if(y>=425){go(GAMES);return;}
  if(memoryMatched==0x0fff&&y>=377&&y<=419&&x>=79&&x<=241){startMemory();return;}
  for(int i=0;i<12;i++){
   int left=39+(i%4)*62,top=192+(i/4)*61;
   if(x>=left&&x<left+56&&y>=top&&y<top+53){revealMemory(i);break;}
  }
  return;
 }
 if(page==LANTERNS){
  if(y>=429){go(GAMES);return;}
  if(lanternDone){
   if(x>=84&&x<=236&&y>=363&&y<=398)startLanterns();
   return;
  }
  if(lanternPhase(millis())!=-2)return;
  for(int i=0;i<Fireflies::symbols;i++){
   int left=53+(i%2)*113,top=198+(i/2)*82;
   if(x>=left&&x<left+101&&y>=top&&y<top+70){enterLantern(i);break;}
  }
  return;
 }
 if(page==ARCADE){
  if(y>=426){go(GAMES);return;}
  if(arcadeUntil<=millis()){if(y>=275&&y<=394)startArcade();return;}
  if(abs(x-targetX)<27&&abs(y-targetY)<27){arcadeScore++;
   targetX=60+random(200);targetY=238+random(143);drawArcade();}
 }
}
// Transfer over the same USB-C cable; sender uses PING + PUT name size + binary bytes.
void usbService(){
 while(Serial.available()){
  char c=(char)Serial.read();if(c=='\r')continue;
  if(c!='\n'){if(serialLine.length()<100)serialLine+=c;else serialLine="";continue;}
  String cmd=serialLine;serialLine="";
  if(cmd=="PING"){Serial.println("PONG");continue;}
  if(!cmd.startsWith("PUT "))continue;
  int k=cmd.lastIndexOf(' ');if(k<=4){Serial.println("ERR HEADER");continue;}
  String name=cmd.substring(4,k);long size=cmd.substring(k+1).toInt();
  bool valid=sdReady&&size>0&&size<=2500000L&&name.length()>0&&name.length()<50;
  if(name.indexOf("..")>=0||name.startsWith("."))valid=false;
  for(size_t i=0;i<name.length();i++){char n=name[i];
   if(!((n>='a'&&n<='z')||(n>='A'&&n<='Z')||(n>='0'&&n<='9')||n=='_'||n=='-'||n=='.'))valid=false;}
  if(!valid){Serial.println("ERR FILE");continue;}
  if(name.equalsIgnoreCase("rosy.raw")&&rosyCache){
   free(rosyCache);
   rosyCache=nullptr;
  }
  SD.remove("/"+name);File o=SD.open("/"+name,FILE_WRITE);
  if(!o){Serial.println("ERR OPEN");continue;}
  Serial.println("GO");
  uint8_t chunk[1024];long remain=size;bool ok=true;unsigned long lastData=millis();
  while(remain>0){int available=Serial.available();if(available){int n=min((long)min(available,1024),remain);
     int got=Serial.readBytes(chunk,n);if(got<=0||o.write(chunk,got)!=(size_t)got){ok=false;break;}
     remain-=got;lastData=millis();}
   else if(millis()-lastData>20000){ok=false;break;}else delay(1);
  }
  o.close();if(ok&&remain==0){Serial.println("OK "+name);}else Serial.println("ERR TRANSFER");
 }
}
void calibrate(){
 tft.fillScreen(TFT_BLACK);tft.setTextDatum(MC_DATUM);tft.setTextColor(TFT_WHITE,TFT_BLACK);
 tft.drawString("Calibrage tactile",160,115,4);
 tft.drawString("Touchez les points",160,152,2);
 delay(700);tft.calibrateTouch(calibration,TFT_WHITE,TFT_BLACK,16);
 prefs.putBytes("touch",calibration,sizeof(calibration));tft.setTouch(calibration);
}
void cacheRosy(){
 File file=SD.open("/rosy.raw",FILE_READ);
 if(!file||file.size()!=rosyBytes)return;
 rosyCache=(uint16_t*)ps_malloc(rosyBytes);
 if(!rosyCache)return;
 uint8_t* bytes=(uint8_t*)rosyCache;
 for(size_t offset=0;offset<rosyBytes;offset+=4096){
  size_t count=min((size_t)4096,rosyBytes-offset);
  if(file.read(bytes+offset,count)!=count){
   free(rosyCache);
   rosyCache=nullptr;
   return;
  }
  yield();
 }
}
void setup(){
 Serial.begin(115200);pinMode(BL,OUTPUT);digitalWrite(BL,HIGH);
 tft.init();tft.setRotation(0);tft.fillScreen(TFT_BLACK);
 tft.setTextDatum(MC_DATUM);tft.setTextColor(TFT_WHITE,TFT_BLACK);
 tft.drawString("PonyGotchi Studio",160,203,4);tft.drawString("Chargement...",160,244,2);
 bgInk=cc(95,69,79);lightInk=cc(255,249,238);pinkInk=cc(222,159,177);
 lineInk=cc(212,181,161);accentInk=cc(141,98,111);greenInk=cc(137,172,140);goldInk=cc(239,199,116);
 prefs.begin("ponygotchi",false);lanternBest=prefs.getInt("lanternBest",0);memoryBest=prefs.getInt("memoryBest",0);
 if(prefs.getBytesLength("garden")==sizeof(garden))prefs.getBytes("garden",&garden,sizeof(garden));
 loadSave();backlight();startClock();resetDailyIfNeeded();
 bgCache=(uint16_t*)ps_malloc((size_t)W*H*2);
 if(!bgCache)bgCache=(uint16_t*)malloc((size_t)W*H*2);
 comp=(uint16_t*)ps_malloc((size_t)W*PH*2);
 if(comp)compWidth=W;
 if(!comp)comp=(uint16_t*)malloc((size_t)COM_W*PH*2);
 arcadeBuffer=(uint16_t*)ps_malloc((size_t)264*212*2);
 Serial.printf("[ANIM INIT] background=%s composer=%s width=%d freePSRAM=%u\n",
               bgCache?"YES":"NO",comp?"YES":"STRIP",compWidth,
               (unsigned)heap_caps_get_free_size(MALLOC_CAP_SPIRAM));
 sdBus.begin(SD_SCK,SD_MISO,SD_MOSI,SD_CS);sdReady=SD.begin(SD_CS,sdBus,4000000);
 if(!sdReady){tft.drawString("microSD introuvable",160,280,2);Serial.println("ERROR SD");return;}
 if(prefs.getBytesLength("touch")==sizeof(calibration)){
  prefs.getBytes("touch",calibration,sizeof(calibration));tft.setTouch(calibration);
 }else calibrate();
 cacheRosy();
 Serial.printf("[ANIM INIT] rosyCache=%s bytes=%u frames=32 frameBytes=%u\n",
               rosyCache?"PSRAM":"SD",(unsigned)rosyBytes,(unsigned)sizeof(sprite));
 randomSeed((uint32_t)esp_random());world=worldNow();drawCurrent();
 lastTick=lastFrame=lastSave=lastMinuteCheck=millis();
 Serial.println("PonyGotchi Studio READY");
}
void loop(){
 usbService();if(!sdReady){delay(100);return;}
 uint16_t tx=0,ty=0;bool isPressed=tft.getTouch(&tx,&ty,230);
 unsigned long now=millis();
 if(isPressed&&!touched&&now-lastTouch>190){touch(tx,ty);touched=true;lastTouch=now;}
 if(!isPressed)touched=false;
 if(now-lastMinuteCheck>=6000){lastMinuteCheck=now;
  static int oldMinute=-1;struct tm d={};if(getLocalTime(&d,15)){
   if(d.tm_min!=oldMinute){oldMinute=d.tm_min;resetDailyIfNeeded();int w=actionId==3&&now<actionUntil?2:worldNow();
    if(w!=world)drawCurrent();else if(page==HOME||page==CARE||page==MENU){drawStageRows(31,125);topClock();}}
  }
 }
 if(exploreUntil&&now>=exploreUntil){endExplore();actionId=-1;petState=0;drawCurrent();}
 if(actionId>=0&&now>=actionUntil){actionId=-1;petState=0;drawCurrent();}
 if(page==GARDEN){
  const time_t epoch=time(nullptr);
  for(int i=0;i<3;i++){
   const int status=gardenStatus(i,epoch);
   if(status!=gardenDrawn[i])drawPlot(i,status);
  }
 }
 if(page==MEMORY&&memorySecond>=0&&(int32_t)(now-memoryHideAt)>=0){
  int first=memoryFirst,second=memorySecond;
  memoryFirst=memorySecond=-1;
  drawMemoryCard(first);
  drawMemoryCard(second);
 }
 if(page==LANTERNS&&lanternPhase(now)!=lanternDrawnPhase)drawLanterns(false);
 if(page==ARCADE&&now-lastArcadeDraw>520){lastArcadeDraw=now;drawArcade();
   if(arcadeUntil&&now>=arcadeUntil){int won=arcadeScore;arcadeUntil=0;award(won*3,min(25,won*2));drawArcade();}
 }
 if(now-lastTick>=60000){lastTick=now;int delta=softMode?1:2;
   hungry=max(15,hungry-delta);clean=max(20,clean-(softMode?0:1));energy=max(20,energy-delta);
   if(hungry<25||energy<25)joy=max(20,joy-1);
   if(page==CARE)drawCare();
 }
 if(now-lastSave>120000)persist();
 if(exploreToastUntil&&(int32_t)(now-exploreToastUntil)>=0){
  exploreToastUntil=0;
  if(page==HOME)drawStageRows(366,416);
 }
 if(page==CARE&&now-careTouchedAt>=12000)toggleCare(false);
 if((page==HOME||page==CARE||page==MENU)&&now-lastFrame>=175){
  lastFrame=now;petFrame=(petFrame+1)%4;
  if(actionId>=0)petState=sprForAction[actionId];
  else if(hungry<20||joy<20)petState=6;
  else if((now/5100)%5==1)petState=1;
  else if((now/5300)%7==2)petState=2;
  else petState=0;
  // Gentle autonomous walk, while preserving at most 18-pixel dirty union.
  if(actionId<0&&petState==1){petX+=((now/5200)%2==0)?2:-2;petX=constrain(petX,48,126);}
  bool frameOk=drawPonyComposited(lastPetX,petX,petY,petState,petFrame,false);
  if(frameOk)lastPetX=petX;
  static uint32_t lastAnimDiagnostic=0;
  if(now-lastAnimDiagnostic>=1000){
   lastAnimDiagnostic=now;
   Serial.printf("[ANIM] page=%d state=%d frame=%d/4 x=%d y=%d ok=%d comp=%s rosy=%s\n",
                 page,petState,petFrame,petX,petY,frameOk?1:0,
                 comp?"RAM":"STRIP",rosyCache?"PSRAM":"SD");
  }
 }
 delay(8);
}
