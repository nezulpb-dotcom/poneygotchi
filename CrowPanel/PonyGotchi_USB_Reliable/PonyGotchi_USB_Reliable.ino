#include <Arduino.h>
#include <SD.h>
#include <SPI.h>

constexpr size_t BLOCK = 512;
constexpr unsigned MAX_SIZE = 2 * 1024 * 1024;
SPIClass sdBus(HSPI);
bool sdReady;
File output;
char name[32], line[2 * BLOCK + 80];
size_t used, total, written, lastOffset, lastLength;
uint32_t expectedCrc, lastCrc;
bool overflow, committedBlock;
uint8_t bytes[BLOCK];

bool allowed(const char* value) {
  const char* files[] = {"day.raw","dusk.raw","night.raw","rosy.raw","room_eat.raw",
    "room_play.raw","room_wash.raw","room_sleep.raw","room_pet.raw","ui_full.raw","ui_care.raw"};
  for (const char* file : files) if (!strcmp(value, file)) return true;
  return false;
}

uint32_t updateCrc(uint32_t crc, const uint8_t* data, size_t count) {
  while (count--) {
    crc ^= *data++;
    for (int bit = 0; bit < 8; ++bit) crc = (crc >> 1) ^ (0xEDB88320UL & (0U - (crc & 1)));
  }
  return crc;
}

String target(const char* file) { return String("/") + file; }
String staging(const char* file) { return String("/.pg-") + file + ".tmp"; }
String backup(const char* file) { return String("/.pg-") + file + ".bak"; }

bool inspect(const String& path, size_t& size, uint32_t& checksum) {
  File file = SD.open(path, FILE_READ);
  if (!file || file.isDirectory()) return false;
  size = file.size();
  uint32_t crc = 0xFFFFFFFFU;
  for (size_t offset = 0; offset < size;) {
    size_t count = min(BLOCK, size - offset);
    if (file.read(bytes, count) != count) return false;
    crc = updateCrc(crc, bytes, count);
    offset += count;
  }
  checksum = crc ^ 0xFFFFFFFFU;
  return true;
}

void resetTransfer() {
  output.close();
  if (name[0]) SD.remove(staging(name));
  name[0] = 0;
}

int nibble(char value) {
  if (value >= '0' && value <= '9') return value - '0';
  if (value >= 'a' && value <= 'f') return value - 'a' + 10;
  return -1;
}

void receiveBlock(char* command) {
  unsigned offset, length, checksum;
  int dataStart = 0;
  if (!output) { Serial.println("ERR NO_FILE"); return; }
  if (sscanf(command, "DATA %u %u %x %n", &offset, &length, &checksum, &dataStart) != 3 ||
      !dataStart || !length || length > BLOCK || offset > total || length > total - offset ||
      strlen(command + dataStart) != length * 2) {
    Serial.printf("RETRY %u FRAME\n", (unsigned)written); return;
  }
  for (unsigned i = 0; i < length; ++i) {
    int high = nibble(command[dataStart + i * 2]);
    int low = nibble(command[dataStart + i * 2 + 1]);
    if (high < 0 || low < 0) { Serial.printf("RETRY %u HEX\n", offset); return; }
    bytes[i] = (high << 4) | low;
  }
  if ((updateCrc(0xFFFFFFFFU, bytes, length) ^ 0xFFFFFFFFU) != checksum) {
    Serial.printf("RETRY %u CRC\n", offset); return;
  }
  if (committedBlock && offset == lastOffset && length == lastLength && checksum == lastCrc) {
    Serial.printf("ACK %u\n", (unsigned)written); return;
  }
  if (offset != written) { Serial.printf("ERR OFFSET %u %u\n", offset, (unsigned)written); return; }
  if (output.write(bytes, length) != length) {
    Serial.printf("ERR SD_WRITE %s %u\n", name, offset); resetTransfer(); return;
  }
  lastOffset = offset; lastLength = length; lastCrc = checksum; committedBlock = true;
  written += length;
  Serial.printf("ACK %u\n", (unsigned)written);
}

void finishTransfer() {
  if (!output) { Serial.println("ERR NO_FILE"); return; }
  if (written != total) { Serial.printf("ERR INCOMPLETE %u %u\n", (unsigned)written, (unsigned)total); return; }
  output.flush();
  output.close();
  size_t size = 0;
  uint32_t crc = 0;
  if (!inspect(staging(name), size, crc)) {
    Serial.printf("ERR SD_READ %s\n", name); resetTransfer(); return;
  }
  if (size != total || crc != expectedCrc) {
    Serial.printf("ERR FILE_VERIFY %s %u %08lx\n", name, (unsigned)size, (unsigned long)crc);
    resetTransfer(); return;
  }
  String finalPath = target(name), oldPath = backup(name);
  if (SD.exists(finalPath)) {
    if ((SD.exists(oldPath) && !SD.remove(oldPath)) || !SD.rename(finalPath, oldPath)) {
      Serial.printf("ERR SD_BACKUP %s\n", name); resetTransfer(); return;
    }
  }
  if (!SD.rename(staging(name), finalPath)) {
    if (SD.exists(oldPath)) SD.rename(oldPath, finalPath);
    Serial.printf("ERR SD_RENAME %s\n", name); resetTransfer(); return;
  }
  if (SD.exists(oldPath)) SD.remove(oldPath);
  Serial.printf("OK %s %u %08lx\n", name, (unsigned)size, (unsigned long)crc);
  name[0] = 0;
}

void handle(char* command) {
  if (!strcmp(command, "PING")) { Serial.println("PONG"); return; }
  if (!strcmp(command, "HELLO")) {
    Serial.println(sdReady ? "PONYUSB 2" : "ERR SD_MOUNT"); return;
  }
  if (!sdReady) { Serial.println("ERR SD_MOUNT"); return; }
  if (!strcmp(command, "ABORT")) { resetTransfer(); Serial.println("ABORTED"); return; }
  if (!strcmp(command, "END")) { finishTransfer(); return; }
  if (!strncmp(command, "DATA ", 5)) { receiveBlock(command); return; }
  char file[32], extra;
  unsigned size, crc;
  if (sscanf(command, "STAT %31s %c", file, &extra) == 1 && allowed(file)) {
    String path = target(file);
    if (!SD.exists(path) && SD.exists(backup(file)) && !SD.rename(backup(file), path)) {
      Serial.printf("ERR SD_RESTORE %s\n", file); return;
    }
    if (!SD.exists(path)) { Serial.printf("MISSING %s\n", file); return; }
    size_t actual;
    uint32_t checksum;
    if (!inspect(path, actual, checksum)) { Serial.printf("ERR SD_READ %s\n", file); return; }
    Serial.printf("FILE %s %u %08lx\n", file, (unsigned)actual, (unsigned long)checksum);
    return;
  }
  if (sscanf(command, "BEGIN %31s %u %x %c", file, &size, &crc, &extra) == 3 &&
      allowed(file) && size && size <= MAX_SIZE) {
    resetTransfer();
    strcpy(name, file);
    String path = staging(name);
    if (SD.exists(path) && !SD.remove(path)) { Serial.printf("ERR SD_REMOVE %s\n", name); return; }
    output = SD.open(path, FILE_WRITE);
    if (!output) { Serial.printf("ERR SD_OPEN %s\n", name); return; }
    total = size; expectedCrc = crc; written = 0; committedBlock = false;
    Serial.println("READY 512");
    return;
  }
  Serial.println("ERR COMMAND");
}

void setup() {
  Serial.setRxBufferSize(2048);
  Serial.begin(115200);
  sdBus.begin(18, 19, 23, 5);
  sdReady = SD.begin(5, sdBus, 4000000);
}

void loop() {
  while (Serial.available()) {
    char next = Serial.read();
    if (next == '\n') {
      if (overflow) Serial.printf("RETRY %u LINE\n", (unsigned)written);
      else {
        line[used] = 0;
        if (used) handle(line);
      }
      used = 0; overflow = false;
    } else if (next != '\r') {
      if (used < sizeof(line) - 1) line[used++] = next;
      else overflow = true;
    }
  }
  delay(1);
}
