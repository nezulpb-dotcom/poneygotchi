#pragma once
// Geometry shared by CrowPanel care-HUD rendering, touch hit-testing and
// portable tests. Kept independent of Arduino and TFT_eSPI.
namespace CareLayout {
constexpr int screenWidth=320;
constexpr int screenHeight=480;
constexpr int ponyTop=185;
constexpr int ponyHeight=144;

constexpr int headerLeft=8;
constexpr int headerTop=130;
constexpr int headerWidth=304;
constexpr int headerHeight=52;

constexpr int statsLeft=8;
constexpr int statsTop=338;
constexpr int statsWidth=304;
constexpr int statsHeight=84;

constexpr int tileLeft=16;
constexpr int tileTop=344;
constexpr int tileWidth=140;
constexpr int tileHeight=36;
constexpr int columnPitch=148;
constexpr int rowPitch=39;
constexpr int gaugeWidth=124;

constexpr int actionsLeft=8;
constexpr int actionsTop=429;
constexpr int actionWidth=73;
constexpr int actionHeight=47;
constexpr int actionPitch=77;
constexpr int actionCount=4;

inline int tileX(int index){return tileLeft+(index%2)*columnPitch;}
inline int tileY(int index){return tileTop+(index/2)*rowPitch;}
inline bool inStats(int x,int y){
 return x>=statsLeft&&x<statsLeft+statsWidth
     &&y>=statsTop&&y<statsTop+statsHeight;
}
inline int careActionAt(int x,int y){
 if(y<actionsTop||y>=actionsTop+actionHeight||x<actionsLeft)return -1;
 const int dx=x-actionsLeft;
 const int index=dx/actionPitch;
 if(index<0||index>=actionCount||dx%actionPitch>=actionWidth)return -1;
 return index;
}

static_assert(ponyTop+ponyHeight<statsTop,"Stat HUD must not cover Rosy");
static_assert(statsTop+statsHeight<actionsTop,"Stat HUD and actions overlap");
static_assert(tileLeft+tileWidth<=statsLeft+statsWidth,"Left tile outside panel");
static_assert(tileLeft+columnPitch+tileWidth<=statsLeft+statsWidth,"Right tile outside panel");
static_assert(tileTop+rowPitch+tileHeight<=statsTop+statsHeight,"Bottom tile outside panel");
static_assert(actionsLeft+(actionCount-1)*actionPitch+actionWidth<=screenWidth,
              "Care button outside display");
static_assert(actionsTop+actionHeight<=screenHeight,"Care button below display");
}
