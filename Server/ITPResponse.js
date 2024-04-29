// Purpose: Contains functions to configure and assemble ITP response packets

// Object to hold response details
let responseDetails = {
  sequence: 0,
  versionNum: 0,
  type: 0,
  time: 0,
  size: 0,
};

// Function: configure
// Purpose: Configure response details
// Parameters:
//   - sequence: The sequence number
//   - version: The version number
//   - type: The type of response
//   - time: The timestamp
//   - size: The size of the response
function configure(sequence, version, type, time, size) {
  responseDetails.sequence = sequence;
  responseDetails.versionNum = version;
  responseDetails.type = type;
  responseDetails.time = time;
  responseDetails.size = size;
}

// Function: assemblePacket
// Purpose: Assemble the packet with encoded response details
// Returns: The assembled packet header
function assemblePacket() {
  let packetHeader = Buffer.alloc(12); // Allocate buffer for packet header
  encodeBitSection(packetHeader, responseDetails.versionNum, 0, 4); // Encode version number
  encodeBitSection(packetHeader, responseDetails.type, 4, 2); // Encode response type
  encodeBitSection(packetHeader, responseDetails.sequence, 6, 26); // Encode sequence number
  encodeBitSection(packetHeader, responseDetails.time, 32, 32); // Encode timestamp
  encodeBitSection(packetHeader, responseDetails.size, 64, 32); // Encode response size

  return packetHeader;
}

// Function: encodeBitSection
// Purpose: Encodes integer values at specific bit positions within the packet
// Parameters:
//   - buffer: The buffer to store encoded data
//   - data: The integer data to encode
//   - start: The starting bit position
//   - length: The length of the data in bits
function encodeBitSection(buffer, data, start, length) {
  let endBitPos = start + length - 1; // Calculate end bit position
  let binData = data.toString(2); // Convert integer data to binary string
  let binIndex = binData.length - 1; // Initialize binary string index

  // Iterate through each bit in the data
  for (let i = 0; i < length; i++) {
      let byteIdx = Math.floor(endBitPos / 8); // Calculate byte index
      let bitIdx = 7 - (endBitPos % 8); // Calculate bit index within byte
      // Update byte in buffer based on binary data
      buffer[byteIdx] = binData[binIndex--] === '1' ?
          buffer[byteIdx] | (1 << bitIdx) :
          buffer[byteIdx] & ~(1 << bitIdx);
      endBitPos--; // Move to the next bit position
  }
}

// Export functions for external use
module.exports = {
  init: configure, // Configure response details
  getPacket: assemblePacket, // Assemble the packet
};
