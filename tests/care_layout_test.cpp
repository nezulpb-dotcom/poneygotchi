// Run: g++ -std=c++11 -Wall -Wextra -Werror tests/care_layout_test.cpp -o care_layout_test && ./care_layout_test
#include "../CrowPanel/PonyGotchi_Studio_CrowPanel/care_layout.h"
#include <cassert>
#include <cstdio>

int main(){
 using namespace CareLayout;
 assert(ponyTop+ponyHeight==329);
 assert(statsTop==338);
 assert(statsTop+statsHeight==422);
 assert(actionsTop==429);
 assert(gaugeWidth==124);
 for(int i=0;i<4;i++){
  const int x=tileX(i),y=tileY(i);
  assert(x>=statsLeft&&x+tileWidth<=statsLeft+statsWidth);
  assert(y>=statsTop&&y+tileHeight<=statsTop+statsHeight);
  assert(inStats(x+tileWidth/2,y+tileHeight/2));
  const int touchX=actionsLeft+i*actionPitch;
  assert(careActionAt(touchX,actionsTop)==i);
  assert(careActionAt(touchX+actionWidth-1,actionsTop+actionHeight-1)==i);
  assert(careActionAt(touchX+actionWidth,actionsTop+actionHeight/2)==-1);
 }
 for(int y=0;y<screenHeight;y++){
  for(int x=0;x<screenWidth;x++){
   const int which=careActionAt(x,y);
   assert(which>=-1&&which<actionCount);
   if(inStats(x,y))assert(which==-1);
  }
 }
 assert(!inStats(90,250)); // Tapping Rosy is never intercepted by the HUD.
 assert(!inStats(0,341));
 assert(!inStats(24,427));
 std::puts("Care HUD geometry and button hit tests: OK");
}
