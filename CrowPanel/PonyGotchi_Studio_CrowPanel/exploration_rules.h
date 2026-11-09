#pragma once
// Deterministic, no-heap rules shared by the CrowPanel exploration screen.
// A random word selects among missing souvenirs first; once all are collected
// repeat visits stay playable but grant a smaller, clearly labelled reward.
#include <stdint.h>

namespace Exploration {
constexpr uint8_t souvenirCount=8;
constexpr uint8_t fullCollection=0xff;

struct Discovery {
  uint8_t index;
  bool isNew;
  uint8_t xp;
  uint8_t stars;
};

inline uint8_t chooseSouvenir(uint8_t seen, uint32_t roll){
  uint8_t missing=0;
  for(uint8_t i=0;i<souvenirCount;i++)
    if(!(seen&(1u<<i)))missing++;
  if(!missing)return static_cast<uint8_t>(roll%souvenirCount);
  uint8_t selected=static_cast<uint8_t>(roll%missing);
  for(uint8_t i=0;i<souvenirCount;i++){
    if(seen&(1u<<i))continue;
    if(selected--==0)return i;
  }
  return 0; // Unreachable for a valid 8-bit collection.
}

inline Discovery discover(uint8_t seen, uint32_t roll){
  const uint8_t index=chooseSouvenir(seen,roll);
  const bool fresh=(seen&(1u<<index))==0;
  Discovery result={index,fresh,
                    static_cast<uint8_t>(fresh?20:6),
                    static_cast<uint8_t>(fresh?10:3)};
  return result;
}
} // namespace Exploration
