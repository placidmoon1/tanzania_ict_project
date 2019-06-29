// ------------ MySQL ------------ //

const MySQL = require('mysql');

const con = MySQL.createConnection({
    host: "localhost",
    port: "3306", 
    user: "root",
    password: "",
    database: "ng_arduino_data", // name has to be same as the database to connect 
    charset: "utf8mb4_general_ci"
});

con.connect((err) => {
    if (err)
        console.error(err);
    console.log("Connected to database");
});


// ------------ Serial ------------ //

const SerialPort = require('serialport');

const baudRate = 115200;

let port = null;

SerialPort.list((err, ports) => {
    if (err)
        console.error(err);
    if (ports.length == 0)
        console.error("No Serial ports found");

    // Iterate over all the serial ports, and look for an Arduino
    let comName = null;
    ports.some((port) => {
        if (port.manufacturer
            && port.manufacturer.match(/Arduino/)) {
            comName = port.comName;
            console.log('Found Arduino');
            console.log('\t' + port.comName);
            console.log('\t\t' + port.pnpId);
            console.log('\t\t' + port.manufacturer);
            return true;
        }
        return false;
    });

    if (comName == null) {
        comName = ports[0].comName;
        console.warn('No Arduino found, selecting first COM port (' + comName + ')');
    }

    // Open the port
    port = new SerialPort(comName, { baudRate: baudRate },
        (err) => {
            if (err)
                console.error(err);
        });
    
    // Attach a callback function to handle incomming data
    port.on('data', receiveSerial);
    console.log("Connected to Arduino");
});

// A class for reading lines of text
class TextParser {
    constructor() {
        this.string = '';
        this.clear = false;
    }
    static isEndMarker(char) {
        return char == '\r' || char == '\n'; // New line characters (NL & CR)
    }

    parse(char) {
        if (this.clear) {
            this.string = '';
            this.clear = false;
        }
        if (TextParser.isEndMarker(char)) {
            if (this.string.length > 0) {
                this.clear = true;
                return true;
            }
            return false;
        } else {
            this.string += char;
        }
    }
    get message() {
        return this.string;
    }
}

const parser = new TextParser;


/**
 * Entry function of Serial Events;
 * 1) Checks for Serial input of Arduino
 * 2) Parses input String using the "parser" object of the TextParser class
 * 3) If a complete line has been received (newline char received), 
 *    then change control to splitString
 * @param {byteArray (?)} dataBuf the received Buffer, 
 */
function receiveSerial(dataBuf) {
    let str = dataBuf;
    console.log(str.length);
    console.log(str);
    str = str.toString('utf8');
    console.log(str);
    // Loop over all characters
    for (let i = 0; i < str.length; i++) {
        // Parse the character
        if (parser.parse(str[i])) {
            // If a complete line has been received,
            // insert it into the database
            splitString(parser.message);

        }
    }
}

/**
 * Splits the 16 character message into
 * channelNum (1 character, integer, index 1)
 * buildingNum (2 characters, integer, index 2 ~ 3)
 * voucherNum (10 characters, integer, index 5 ~ 14)
 * If parsed, change control to "checkVoucherValidity" function 
 * @param {String} message parsed complete userInput 
 */
function splitString(message){
  console.log("splitting string of" + message);
  channelNum = parseInt(message.substr(1, 1));
  buildingNum = parseInt(message.substr(2, 3));
  voucherNum = parseInt(message.substr(5, 14));
  console.log(channelNum);
  console.log(buildingNum);
  console.log(voucherNum);
  checkVoucherValidity([channelNum, buildingNum, voucherNum]);
}

/**
 * check the validity of the voucherNumber that the user inputted from the 
 * "Voucher" table of the MySQL server (async query)
 * If valid, change control to "changeVoucherIsUsed" function
 * If the voucher number doesn't exist OR if the voucher was already used, return false
 * 
 * @param {Array[Int, Int, Int]} userInput Array of parsed user Input
 * userInput index 0: channelNum
 * userInput index 1: buildingNum
 * userInput index 2: voucherNum
 */
function checkVoucherValidity(userInput) {
  console.log("checking voucher number of " + userInput);
  const sql = 'SELECT `isUsed` FROM `Voucher` WHERE `voucherNum` = (?) '
  con.query(sql, [userInput[2]], function (err, result, fields) {
    if (err) {
      console.log("Error occurred");
      return false;
    } 
    while (true) {
      if (typeof result !== undefined) {
        break;
      }
    }
    console.log(result);
    if (result[0].isUsed == 1) {
      console.log("Already Used");
      return false;
    } else { // if not used 
      changeVoucherIsUsed(userInput)
    }
  });
}

/**
 * Change the isUsed status of the voucher of the current user (from 0 -> 1)
 * @param {*} userInput 
 */
function changeVoucherIsUsed(userInput) {
  console.log("changing isUsed status of voucher number of " + userInput);
  const sql = 'UPDATE `Voucher` SET `isUsed` = 1 WHERE `voucherNum` = (?);';
  con.query(sql, [userInput[2]], function (err, result, fields){
    if (err) {
      console.log("Error occurred in changing isUsed field of voucher " + userInput[2]);
      return false;
    } else {
      return getVoucherValue(userInput);
    }
  });
}

/**
 * Get the voucher value assoicated with the voucher number
 * @param {*} userInput 
 */
function getVoucherValue(userInput){
  console.log("getting voucher value" + userInput);
  const sql = 'SELECT `voucherValue` FROM `voucher` WHERE `voucherNum` = (?);';
  con.query(sql, [userInput[2]], function (err, result, fields){
    if (err) {
      console.log("Error occurred in changing isUsed field of voucher " + userInput[2]);
      return false;
    } else {
      userInputWithVV = [userInput[0], userInput[1], userInput[2], result[0].voucherValue];
      return getCorrespondingCredit(userInputWithVV);
    }
  });
}

function getCorrespondingCredit(userInput){
  console.log("getting voucher value to kw credit " + userInput);
  const sql = 'SELECT `credit` FROM `moneyToKW` WHERE `money` = (?);';
  con.query(sql, [userInput[3]], function (err, result, fields){
    if (err) {
      console.log("Error occurred in changing isUsed field of voucher " + userInput[2]);
      return false;
    } else {
      console.log(result);
      userInputWithVVAndCredit = [userInput[0], userInput[1], userInput[2], userInput[3], result[0].credit];
      return insertValueIntoRawHistoryData(userInputWithVVAndCredit);
    }
  });
}


function insertValueIntoRawHistoryData(userInput) {
  console.log("inserting " + userInput + " to RawHistoryData");
  const sql = 'INSERT INTO `RawHistoryData` (`channel`, `building`, `voucherNum`, `creditVal`) VALUES (?, ?, ?, ?);';
  con.query(sql, [userInput[0], userInput[1], userInput[2], userInput[4]], function (err, result) {
      if (err) {
        console.log("Error occurred in inserting value into RawHistoryData " + err);
        return false;
      } else {
        return updateUserData(userInput);
      }
  });
}

function updateUserData(userInput) {
  console.log("updating " + userInput + " to UserData");
  const sql = 'UPDATE `UserData` SET `credit` = `credit` + (?) WHERE `channel` = (?) AND `building` = (?);';
  con.query(sql, [userInput[4], userInput[0], userInput[1]], function (err, result) {
    if (err) {
      console.log("Error occurred in updating value into UserData");
      return false;
    } else {
      return true;
    }
  });
}

//TODO: create dummy cases
function test(){

}

//TODO: create update function of moneytokw 
function updateMoneyToKw(){

}

//TODO: create write function to serail
function writeToSerial(){
  port.write
  
}