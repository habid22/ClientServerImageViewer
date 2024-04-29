// Purpose: Handle client connections, manage data, and send responses to clients.

// Import required modules
const ResponseHandler = require('./ITPResponse'); // Import ResponseHandler module
const UniqueInstance = require('./Singleton'); // Import UniqueInstance module
const pathResolver = require('path'); // Import pathResolver module
const fileOps = require('fs'); // Import fileOps module

// Function: manageClient
// Purpose: Manages client connection, logging client details and handling data
// Parameters:
//   - sock: Socket object representing client connection
function manageClient(sock) {
    // Get the sequence number for the client connection
    const sequenceNumber = UniqueInstance.getSequenceNumber();
    console.log('\n');
    // Log client connection details including sequence number and timestamp
    console.log(`Client-${sequenceNumber} is connected at timestamp: ${UniqueInstance.getTimestamp()}`);

    // Store the sequence number for later use
    const originalSequenceNumber = sequenceNumber;

    // Event listener for incoming data from the client
    sock.on('data', (incomingData) => {
        // Log the binary packet header received from the client
        logBinaryPacketHeader(incomingData);
        // Handle the incoming data from the client
        handleData(sock, incomingData, originalSequenceNumber); // Pass originalSequenceNumber to handleData
    });

    // Event listener for client disconnection
    sock.on('close', () => {
        // Log the closure of the client connection
        console.log('\n');
        console.log(`Client-${originalSequenceNumber} closed the connection`);
    });
}

// Function: logBinaryPacketHeader
// Purpose: Logs the binary representation of the ITP packet header
// Parameters:
//   - packet: Buffer containing the ITP packet header
function logBinaryPacketHeader(packet) {
    console.log('\n');
    console.log("ITP packet received:");
    // Iterate over the entire packet
    for (let i = 0; i < packet.length; i += 4) {
        // Iterate over each byte in the packet
        for (let j = 0; j < 4; j++) {
            // If the current byte is within the packet length, convert it to binary and log
            if (i + j < packet.length) {
                let binaryString = packet[i + j].toString(2).padStart(8, '0');
                process.stdout.write(binaryString + " ");
            }
        }
        process.stdout.write("\n");
    }
}

// Function: handleData
// Purpose: Handles the incoming data from the client, extracting details and responding accordingly
// Parameters:
//   - sock: Socket object representing client connection
//   - incomingData: Buffer containing the incoming data from the client
//   - originalSequenceNumber: The original sequence number for the client connection
function handleData(sock, incomingData, originalSequenceNumber) { // Add originalSequenceNumber parameter
    // Extract details from the incoming data
    const details = extractDetails(incomingData);
    // Log packet details extracted from the incoming data
    logPacketDetails(sock, details, originalSequenceNumber); // Pass originalSequenceNumber to logPacketDetails

    // Construct file path based on extracted details
    let filePath = constructFilePath(details.fileName, details.imageType);
    // Check if the file exists
    if (fileOps.existsSync(filePath)) {
        // If file exists, send image response to client
        sendImageResponse(sock, filePath, details);
    } else {
        // If file does not exist, send error response to client
        sendErrorResponse(sock, details);
    }

    // Close the socket connection
    sock.end();
}

// Function: extractDetails
// Purpose: Extracts details from the incoming ITP packet
// Parameters:
//   - data: Buffer containing the incoming ITP packet
// Returns:
//   - Object containing extracted details (version, timestamp, imageType, fileName)
function extractDetails(data) {
    return {
        version: extractDataBits(data, 0, 4),
        timestamp: extractDataBits(data, 32, 32),
        imageType: extractDataBits(data, 64, 4),
        fileName: getFileName(data),
    };
}

// Function: logPacketDetails
// Purpose: Logs the details extracted from the ITP packet
// Parameters:
//   - sock: Socket object representing client connection
//   - { version, timestamp, imageType, fileName }: Object containing extracted details
//   - originalSequenceNumber: The original sequence number for the client connection
function logPacketDetails(sock, { version, timestamp, imageType, fileName }, originalSequenceNumber) { // Add originalSequenceNumber parameter
    console.log('\n');
    console.log(`Client-${originalSequenceNumber} requests:`); // Use originalSequenceNumber here
    console.log(` --ITP version: ${version}`);
    console.log(` --Timestamp: ${timestamp}`);
    console.log(` --Request type: Query`);
    console.log(` --Image file extension(s): ${mapTypeToExtension(imageType)}`);
    console.log(` --Image file name: ${fileName}`);
}

// Function: getFileName
// Purpose: Extracts the file name from the incoming ITP packet
// Parameters:
//   - data: Buffer containing the incoming ITP packet
// Returns:
//   - Extracted file name as a string
function getFileName(data) {
    const nameSize = extractDataBits(data, 68, 28);
    return data.slice(12, 12 + nameSize).toString();
}

// Function: constructFilePath
// Purpose: Constructs file path based on file name and image type
// Parameters:
//   - fileName: Name of the image file
//   - imageType: Type of the image file
// Returns:
//   - Constructed file path as a string
function constructFilePath(fileName, imageType) {
    const extension = mapTypeToExtension(imageType);
    return pathResolver.join(__dirname, 'images', `${fileName}.${extension}`);
}

// Function: mapTypeToExtension
// Purpose: Cases for image type to file extension
// Parameters:
//   - type: Image type
// Returns:
//   - Corresponding file extension as a string
function mapTypeToExtension(type) {
    switch (type) {
        case 1:
            return 'PNG';
        case 2:
            return 'BMP';
        case 3:
            return 'TIFF';
        case 4:
            return 'JPEG';
        case 5:
            return 'GIF';
        case 15:
            return 'RAW';
        default:
            return 'unknown';
    }
}


// Function: sendImageResponse
// Purpose: Sends image response to the client
// Parameters:
//   - sock: Socket object representing client connection
//   - filePath: File path of the image file
//   - { version, timestamp }: Object containing version and timestamp details
function sendImageResponse(sock, filePath, { version, timestamp }) {
    // Read image data from file
    const imageData = fileOps.readFileSync(filePath);
    // Prepare packet with image data, version, timestamp, and response type
    const packet = preparePacket(imageData, version, timestamp, 1);
    // Send packet to client
    sock.write(packet);
}

// Function: sendErrorResponse
// Purpose: Sends error response to the client
// Parameters:
//   - sock: Socket object representing client connection
//   - { version, timestamp }: Object containing version and timestamp details
function sendErrorResponse(sock, { version, timestamp }) {
    // Prepare packet with null image data, version, timestamp, and response type
    const packet = preparePacket(null, version, timestamp, 2);
    // Send packet to client
    sock.write(packet);
}

// Export the getSequenceNumber function
exports.getSequenceNumber = () => {
    sequenceNum = (sequenceNum % 999) + 1;
    return sequenceNum;
};

// Function: preparePacket
// Purpose: Prepares packet with image data, version, timestamp, and response type
// Parameters:
//   - imageData: Image data to be included in the packet
//   - version: ITP version
//   - timestamp: Timestamp
//   - responseType: Type of response (1 for image response, 2 for error response)
// Returns:
//   - Prepared packet as a Buffer
function preparePacket(imageData, version, timestamp, responseType) {
    const sequenceNumber = UniqueInstance.getSequenceNumber();
    // Calculate size of image data
    const size = imageData ? imageData.length : 0;
    // Initialize ResponseHandler with sequence number, version, response type, timestamp, and size
    ResponseHandler.init(sequenceNumber, version, responseType, timestamp, size);
    // Get packet from ResponseHandler
    const header = ResponseHandler.getPacket();

    // Concatenate header and image data if image data is provided, otherwise return header only
    return imageData ? Buffer.concat([header, imageData]) : header;
}

// Function: extractDataBits
// Purpose: Extracts bits from the packet buffer based on offset and length
// Parameters:
//   - packet: Buffer containing the packet data
//   - offset: Offset position from which to start extracting bits
//   - len: Length of bits to extract
// Returns:
//   - Extracted bits as an integer value
function extractDataBits(packet, offset, len) {
    let value = 0;
    // Iterate over the specified length
    for (let i = 0; i < len; i++) {
        const byteIdx = Math.floor((offset + i) / 8);
        const bitIdx = 7 - ((offset + i) % 8);
        // Extract bit from the specified position and add it to the value
        const bit = (packet[byteIdx] >> bitIdx) & 1;
        value = (value << 1) | bit;
    }
    return value;
}

// Export the manageClient function
module.exports = { handleClientJoining: manageClient };
