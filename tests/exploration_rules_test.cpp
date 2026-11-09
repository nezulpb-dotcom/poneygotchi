// Portable host tests: g++ -std=c++11 -Wall -Wextra -Werror tests/exploration_rules_test.cpp -o /tmp/pony_explore_test && /tmp/pony_explore_test
#include "../CrowPanel/PonyGotchi_Studio_CrowPanel/exploration_rules.h"
#include <cassert>
#include <stdint.h>
#include <cstdio>

int main(){
  using namespace Exploration;
  // First visit can discover any of the eight items.
  for(uint32_t roll=0;roll<200;roll++){
    Discovery found=discover(0,roll);
    assert(found.index==roll%8);
    assert(found.isNew);
    assert(found.xp==20&&found.stars==10);
  }
  // Every possible collection mask must pick missing items, until complete.
  for(unsigned mask=0;mask<256;mask++){
    for(uint32_t roll=0;roll<72;roll++){
      Discovery found=discover(static_cast<uint8_t>(mask),roll);
      assert(found.index<8);
      if(mask!=255){
        assert(!(mask&(1u<<found.index)));
        assert(found.isNew);
        assert(found.stars==10);
      }else{
        assert(!found.isNew);
        assert(found.stars==3&&found.xp==6);
      }
    }
  }
  // Eight walks always complete a collection, with no repeated items.
  uint8_t visited=0;
  for(uint32_t n=0;n<8;n++){
    Discovery found=discover(visited,n*31+5);
    assert(found.isNew);
    visited|=static_cast<uint8_t>(1u<<found.index);
  }
  assert(visited==fullCollection);
  // Once complete, old memories still appear and never exceed the mask.
  assert(discover(255,12345).index<8);
  std::puts("Exploration rules: all checks passed");
  return 0;
}
