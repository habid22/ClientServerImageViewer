// Purpose: Request an image from the server and display it using the ITP protocol.

const net = require('net'); // Import the net module for TCP connections
const fs = require('fs'); // Import the fs module for file system operations
const viewer = require('open'); // Import the viewer module for opening images
const RequestPacket = require('./ITPRequest'); // Import the ITPRequest module

// Class: ImageClient
// Purpose: Represents a client to request an image from the server
class ImageClient {
  // Constructor: Initializes the ImageClient object
  // Parameters:
  //   - serverDetails: An array containing the server host and port
  //   - imageName: The name of the image to request
  //   - version: The version of the ITP protocol
  constructor(serverDetails, imageName, version) {
    this.host = serverDetails[0]; // Server host
    this.port = parseInt(serverDetails[1], 10); // Server port
    this.imageName = imageName; // Image name
    this.imageType = this.determineImageType(imageName); // Image type
    this.version = parseInt(version, 10); // ITP protocol version
    this.initRequest(); // Initialize the request
  }

  // Method: determineImageType
  // Purpose: Determines the type of the image based on its extension
  // Parameters:
  //   - name: The name of the image
  // Returns: The image type
  determineImageType(name) {
    const extension = name.split('.').pop().toLowerCase(); // Extract extension
    const mapping = { png: 1, bmp: 2, tiff: 3, jpeg: 4, jpg: 4, gif: 5, raw: 15 }; // Image type mapping
    return mapping[extension] || 0; // Return the corresponding image type or 0 if not found
  }

  // Method: initRequest
  // Purpose: Initializes the request packet
  initRequest() {
    // Initialize the request packet with version, action type, timestamp, image type, and image name
    RequestPacket.init(this.version, 0, (Date.now() & 0xFFFFFFFF), this.imageType, this.imageName.split('.')[0]);
    this.connectAndRequest(); // Connect to the server and send the request
  }

  // Method: connectAndRequest
  // Purpose: Connects to the server and sends the request packet
  connectAndRequest() {
    // Create a new TCP socket client and connect to the server
    this.client = new net.Socket();
    this.client.connect(this.port, this.host, () => {
      console.log(`Connected to server at ${this.host}:${this.port}`); // Log connection success
      console.log('\n'); // Add newline for readability
      this.client.write(RequestPacket.getBytePacket()); // Send the request packet
    });

    this.handleResponse(); // Handle the server response
  }

  // Method: handleResponse
  // Purpose: Handles the response received from the server
  handleResponse() {
    // Listen for data received from the server
    this.client.on('data', (data) => {
      this.displayHeader(data); // Display the packet header
      let header = data.slice(0, 12); // Extract the header from the data
      this.processHeader(header); // Process the header
      this.saveImage(data.slice(12)); // Save the image data
      viewer(this.imageName); // Open the saved image
      this.client.end(); // Close the connection
    });

    // Listen for the connection close event
    this.client.on('close', () => {
      console.log('\nDisconnected from server.'); // Log disconnection
      console.log('Connection closed.'); // Log connection close
      console.log('\n'); // Add newline for readability
    });
  }

  // Method: displayHeader
  // Purpose: Displays the received packet header
  // Parameters:
  //   - data: The received data containing the packet header
  displayHeader(data) {
    let header = data.slice(0, 12); // Extract the header from the data
    this.logPacketBits(header); // Log the packet bits
  }

  // Method: processHeader
  // Purpose: Processes the received packet header
  // Parameters:
  //   - header: The packet header
  processHeader(header) {
    let responseDetails = {
      version: this.extractBits(header, 0, 4), // Extract version
      type: this.extractBits(header, 4, 2), // Extract type
      sequence: this.extractBits(header, 6, 26), // Extract sequence
      timestamp: this.extractBits(header, 32, 32) // Extract timestamp
    };

    // Log the received header details
    console.log(`\nServer sent:
  --Version = ${responseDetails.version}
  --Type = ${responseDetails.type === 1 ? 'Found' : 'Not Found'}
  --Sequence = ${responseDetails.sequence}
  --Timestamp = ${responseDetails.timestamp}`);
  }

  // Method: saveImage
  // Purpose: Saves the received image data to a file
  // Parameters:
  //   - imageData: The image data to be saved
  saveImage(imageData) {
    fs.writeFileSync(this.imageName, imageData); // Write image data to file
  }

  // Method: extractBits
  // Purpose: Extracts bits from a packet at a specified offset and length
  // Parameters:
  //   - packet: The packet from which to extract bits
  //   - offset: The offset of the bits to extract
  //   - length: The length of the bits to extract
  // Returns: The extracted bits
  extractBits(packet, offset, length) {
    let value = 0;
    for (let i = 0; i < length; i++) {
      let byteIndex = Math.floor((offset + i) / 8); // Calculate byte index
      let bitIndex = 7 - ((offset + i) % 8); // Calculate bit index
      let bit = (packet[byteIndex] >> bitIndex) & 1; // Extract bit
      value = (value << 1) | bit; // Update extracted value
    }
    return value; // Return the extracted bits
  }

  // Method: logPacketBits
  // Purpose: Logs the binary representation of packet bits
  // Parameters:
  //   - packet: The packet containing the bits to log
  logPacketBits(packet) {
    console.log("ITP packet header received:");
    // Iterate through each byte of the packet
    for (let i = 0; i < packet.length; i++) {
        // Convert each byte to a binary string and pad it to 8 bits
        let binaryString = packet[i].toString(2).padStart(8, '0');
        process.stdout.write(" "+binaryString + " ");
        // After every 4 bytes, insert a newline character
        if ((i + 1) % 4 === 0) {
            process.stdout.write("\n");
        }
    }
    // Add a newline if the last line didn't end with one
    if (packet.length % 4 !== 0) {
        process.stdout.write("\n");
    }
  }
}

// Function: params
// Purpose: Parse command-line arguments and extract parameters
// Returns: Object containing extracted parameters
const params = (() => {
  let args = {};
  process.argv.slice(2).forEach((val, idx, array) => {
    if (val.startsWith('-')) args[val.substring(1)] = array[idx + 1];
  });
  return args;
})();

// Create a new ImageClient instance with parsed parameters
const client = new ImageClient(params.s.split(':'), params.q, params.v);
