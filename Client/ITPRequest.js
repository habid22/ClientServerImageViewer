// Purpose: Generate a packet buffer with encoded packet details for an ITP request

// Object to hold packet details
let packetDetails = {
  version: null,
  actionType: null,
  timeMark: null,
  imgType: null,
  imgName: null,
  nameLength: null,
};

// Function: initialize
// Purpose: Initialize packet details
// Parameters:
//   - version: The version number
//   - actionType: The action type
//   - timeMark: The timestamp
//   - imgType: The image type
//   - imgName: The image name
function initialize(version, actionType, timeMark, imgType, imgName) {
  packetDetails.version = version;
  packetDetails.actionType = actionType;
  packetDetails.timeMark = timeMark;
  packetDetails.imgType = imgType;
  packetDetails.imgName = imgName;
  packetDetails.nameLength = calculateNameLength(imgName);
}

// Function: calculateNameLength
// Purpose: Calculate the length of the image name in bytes
// Parameters:
//   - name: The image name
// Returns: The length of the image name in bytes
function calculateNameLength(name) {
  return toByteArr(name).length;
}

// Function: getPacket
// Purpose: Generate the packet buffer with encoded packet details
// Returns: The buffer packet
function getPacket() {
  let bufferPacket = Buffer.alloc(12 + packetDetails.nameLength); // Allocate buffer for packet
  insertData(bufferPacket, packetDetails.version, 0, 4); // Insert version number
  insertData(bufferPacket, packetDetails.actionType, 30, 2); // Insert action type
  insertData(bufferPacket, packetDetails.timeMark, 32, 32); // Insert timestamp
  insertData(bufferPacket, packetDetails.imgType, 64, 4); // Insert image type
  insertData(bufferPacket, packetDetails.nameLength, 68, 28); // Insert name length
  bufferPacket.write(packetDetails.imgName, 12); // Write image name to buffer
  return bufferPacket;
}

// Function: insertData
// Purpose: Insert integer data into a buffer at a specific position with a specified size
// Parameters:
//   - buffer: The buffer to store data
//   - data: The integer data to insert
//   - position: The starting bit position in the buffer
//   - size: The size of the data in bits
function insertData(buffer, data, position, size) {
  let binaryStr = data.toString(2).padStart(size, '0'); // Convert integer data to binary string
  let binaryIndex = binaryStr.length - 1; // Initialize binary string index

  // Iterate through each bit in the binary string
  for (let i = position + size - 1; i >= position; i--) {
      let byteIdx = Math.floor(i / 8); // Calculate byte index
      let bitIdx = 7 - (i % 8); // Calculate bit index within byte
      // Update byte in buffer based on binary data
      if (binaryStr[binaryIndex--] === '1') {
          buffer[byteIdx] |= (1 << bitIdx);
      } else {
          buffer[byteIdx] &= ~(1 << bitIdx);
      }
  }
}

// Function: toByteArr
// Purpose: Convert a string to a byte array
// Parameters:
//   - str: The string to convert
// Returns: The byte array representation of the string
function toByteArr(str) {
  let result = [];
  for (let char of str) {
      let code = char.charCodeAt(0); // Get character code
      let bytes = [];
      // Decompose character code into bytes
      do {
          bytes.push(code & 0xFF);
          code >>= 8;
      } while (code);
      result = [...result, ...bytes.reverse()]; // Append bytes to result
  }
  return result;
}

// Export functions for external use
module.exports = {
  init: initialize, // Initialize packet details
  getBytePacket: getPacket, // Get the packet buffer
};
