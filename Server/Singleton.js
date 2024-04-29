// Purpose: Singleton module to generate unique sequence numbers and timestamps

// Immediately invoked function expression to initialize variables and functions
(function initialize() {
    // Declare private variables and assign initial random values
    let sequenceNum = Math.floor(Math.random() * 999) + 1; // Ensure 1-999
    let timeMark = sequenceNum; // Use sequenceNum as initial timestamp for uniqueness
    let updateInterval;

    // Function: incrementSequence
    // Purpose: Increment the sequence number and ensure it stays within the range of 1-999
    // Returns: The updated sequence number
    function incrementSequence() {
        sequenceNum = (sequenceNum % 999) + 1; // Ensure sequence number stays within range
        return sequenceNum;
    }

    // Function: incrementTimestamp
    // Purpose: Increment the timestamp with bitwise operation for 32-bit wrapping
    function incrementTimestamp() {
        timeMark = (timeMark + 1) & ((1 << 32) - 1); // Bitwise operation for 32-bit wrapping
    }

    // Function: startUpdating
    // Purpose: Start updating the timestamp at intervals of 10 milliseconds
    function startUpdating() {
        updateInterval = setInterval(incrementTimestamp, 10);
    }

    // Function: stopUpdating
    // Purpose: Stop updating the timestamp
    function stopUpdating() {
        clearInterval(updateInterval);
    }

    // Attach functions to exports directly
    exports.init = startUpdating; // Initialize timestamp updating
    exports.getSequenceNumber = () => incrementSequence(); // Get the next sequence number
    exports.getTimestamp = () => timeMark; // Get the current timestamp
    exports.cleanup = stopUpdating; // Stop updating the timestamp
})();
