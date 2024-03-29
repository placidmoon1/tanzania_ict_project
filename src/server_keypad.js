// ------------ MySQL ------------ //
let available;

const MySQL = require('mysql'); //requires modules 

const con = MySQL.createConnection({
    multipleStatements: true,
    host: "localhost", //String, name of the host
    port: "3306", //String, the number of the post that the mysql server is opened 
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

let port_keypad = null;

SerialPort.list((err, ports) => {
    if (err)
        console.error(err);
    if (ports.length == 0)
        console.error("No Serial ports found");

    // Iterate over all the serial ports, and look for an Arduino
    let comName_keypad = null;
    ports.some((port) => {
      if (port.pnpId
          && port.pnpId.match(/USB\\VID_2341\&PID_0042\\55834323933351403140/)) { // Arduino Mega "hard coding"
            comName_keypad = port.comName;
            console.log('Found Arduino Mega: the Keypad');
            console.log('\t' + port.comName);
            console.log('\t\t' + port.pnpId);
            console.log('\t\t' + port.manufacturer);
            return true;
            }
        return false;
    });

    // Open the port
    port_keypad = new SerialPort(comName_keypad, { baudRate: baudRate },
        (err) => {
          if (err) {
            console.error(err);
          } else {
            console.log("connected to keypad");
          }
        });
    // Attach a callback function to handle incomming data
    port_keypad.on('data', receiveKeypadSerial);
    console.log("Connected to Keypad port");   
});

/**
 * 
 */
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

const parserKeypad = new TextParser;

const ResultCode = {
  SUCCESS: "0",
  ERR_INVALID_VOUCHER_NUM: "1", 
  ERR_USED_VOUCHER_NUM: "2",
  ERR_INVALID_CHANNEL_OR_HOUSE_NUM: "3",
  ERR_UNDEFINED: "9",
};

/**
 * Entry function of Serial Events;
 * 1) Checks for Serial input of Arduino
 * 2) Parses input String using the "parserKeypad" object of the TextParser class
 * 3) If a complete line has been received (newline char received), 
 *    then change control to splitString
 * @param {byteArray} dataBuf the received Buffer, 
 */
function receiveKeypadSerial(dataBuf) {
    let str = dataBuf;
    console.log(str.length);
    console.log(str);
    str = str.toString('utf8');
    console.log(str);
    // Loop over all characters
    for (let i = 0; i < str.length; i++) {
        // Parse the character
        if (parserKeypad.parse(str[i])) {
            // If a complete line has been received,
            // insert it into the database
            splitString(parserKeypad.message);
        }
    }
}

/**
 * Splits the 16 character message into
 * channelNum (1 character, integer, index 1)
 * houseNum (2 characters, integer, index 2 ~ 3)
 * voucherNum (10 characters, integer, index 5 ~ 14)
 * If parsed, change control to "checkVoucherValidity" function 
 * @param {String} message parsed complete userInput 
 */
function splitString(message){
  console.log("splitting string of" + message);
  channelNum = parseInt(message.substr(1, 1));
  houseNum = parseInt(message.substr(2, 2));
  voucherNum = parseInt(message.substr(5, 10));
  //if (Number.isNaN(channelNum) || Number.isNaN(houseNum) || Number.isNaN(houseNum) 
  console.log(channelNum);
  console.log(houseNum);
  console.log(voucherNum);
  checkVoucherValidity([channelNum, houseNum, voucherNum]);
}

/**
 * check the validity of the voucherNumber that the user inputted from the 
 * "Voucher" table of the MySQL server (async query)
 * If valid, change control to "changeVoucherIsUsed" function
 * If the voucher number doesn't exist OR if the voucher was already used, return false
 * 
 * @param {Array[Int, Int, Int]} userInput Array of parsed user Input
 * userInput index 0: channelNum
 * userInput index 1: houseNum
 * userInput index 2: voucherNum
 */
function checkVoucherValidity(userInput) {
  console.log("checking voucher number of " + userInput);
  const sql = 'SELECT `isUsed` FROM `NG_Voucher` WHERE `voucherNum` = (?) '
  con.query(sql, [userInput[2]], function (err, result, fields) {
    if (err) {
      console.log("SELECT `isUsed` FROM `NG_Voucher` WHERE `voucherNum` = (?) failed");
      if (isNaN(userInput[0])){
        return writeToSerial([0, 0, 0, ResultCode.ERR_INVALID_CHANNEL_OR_HOUSE_NUM]);
      } else if (isNaN(userInput[1])) {
        return writeToSerial([userInput[0], 0, 0, ResultCode.ERR_INVALID_CHANNEL_OR_HOUSE_NUM]);
      } else if (isNaN(userInput[2])) {
        return writeToSerial([userInput[0], userInput[1], 0, ResultCode.ERR_INVALID_CHANNEL_OR_HOUSE_NUM]);
      } else {
        return writeToSerial([userInput[0], userInput[1], userInput[2], ResultCode.ERR_INVALID_CHANNEL_OR_HOUSE_NUM]);
      }
     
    } 
    console.log(result);
    if (result.length == 0) {
      console.log("Voucher num doesn't exist");
      return writeToSerial([userInput[0], userInput[1], userInput[2], ResultCode.ERR_INVALID_VOUCHER_NUM]);
    }
    if (result[0].isUsed == 1) {
      console.log("Already Used");
      return writeToSerial([userInput[0], userInput[1], userInput[2], ResultCode.ERR_USED_VOUCHER_NUM]);   
     } else { // if not used 
      getVoucherValue(userInput);
    }
  });
}

/**
 * Get the voucher value assoicated with the voucher number
 * @param {Array[Int, Int, Int]} userInput Array of parsed user Input
 * userInput index 0: channelNum
 * userInput index 1: houseNum
 * userInput index 2: voucherNum
 */
function getVoucherValue(userInput){
  console.log("getting voucher value" + userInput);
  const sql = 'SELECT `voucherValue` FROM `NG_voucher` WHERE `voucherNum` = (?);';
  con.query(sql, [userInput[2]], function (err, result, fields){
    if (err) {
      console.log("Error occurred in selecting voucherValue field of voucher " + userInput[2]);
      return writeToSerial([userInput[0], userInput[1], userInput[2], ResultCode.ERR_UNDEFINED]);
    } else {
      userInputWithVV = [userInput[0], userInput[1], userInput[2], result[0].voucherValue];
      return getCorrespondingCredit(userInputWithVV);
    }
  });
}

/**
 * Get corresponding credit value associated with the voucher value
 * @param {Array[Int, Int, Int, Int]} userInput Array of parsed user Input + voucher value
 * userInput index 0: channelNum
 * userInput index 1: houseNum
 * userInput index 2: voucherNum
 * userInput index 3: voucherValue
 */
function getCorrespondingCredit(userInput){
  console.log("getting voucher value to kw credit " + userInput);
  const sql = 'SELECT `credit` FROM `NG_valueToKw` WHERE `value` = (?);';
  con.query(sql, [userInput[3]], function (err, result, fields){
    if (err) {
      console.log("error occur in selecting credit equivalent of credit in NG_valueToKw " + userInput[3]);
      return writeToSerial([userInput[0], userInput[1], userInput[2], ResultCode.ERR_UNDEFINED]);
    } else {
      console.log(result);
      userInputWithVVAndCredit = [userInput[0], userInput[1], userInput[2], userInput[3], result[0].credit];
      return updateUserData(userInputWithVVAndCredit);
    }
  });
}

/**
 * Update user data with the corresponding credit value 
 * @param {Array[Int, Int, Int, Int]} userInput Array of parsed user Input + voucher value + corresponding credit value
 * userInput index 0: channelNum
 * userInput index 1: houseNum
 * userInput index 2: voucherNum
 * userInput index 3: voucherValue 
 * userInput index 4: creditValue
 */
function updateUserData(userInput) {
  console.log("updating " + userInput + " to UserData");
  const sql = 'UPDATE `NG_UserData` SET `credit` = `credit` + (?) WHERE `channel` = (?) AND `houseNum` = (?);';
  con.query(sql, [userInput[4], userInput[0], userInput[1]], function (err, result) {
    if (err) {
      console.log("Error occurred in updating value into NG_UserData");
      return writeToSerial([userInput[0], userInput[1], userInput[2], ResultCode.ERR_UNDEFINED]);
    } else {
      console.log(result);
      if (result.affectedRows == 0) {
        console.log("Error occurred in updating value into NG_updateUserData " + userInput);
        return writeToSerial([userInput[0], userInput[1], userInput[2], ResultCode.ERR_INVALID_CHANNEL_OR_HOUSE_NUM]);
      }
      return insertValueIntoRawHistoryData(userInput);
    }
  });
}

/**
 * Insert new user input + credit value associated with the transaction
 * into RawHistoryData table
 * @param {Array[Int, Int, Int, Int]} userInput Array of parsed user Input + voucher value + corresponding credit value
 * userInput index 0: channelNum
 * userInput index 1: houseNum
 * userInput index 2: voucherNum
 * userInput index 3: voucherValue 
 * userInput index 4: creditValue
 */
function insertValueIntoRawHistoryData(userInput) {
  console.log("inserting " + userInput + " to NG_RawHistoryData");
  const sql = 'INSERT INTO `NG_RawHistoryData` (`channel`, `houseNum`, `voucherNum`, `voucherValue`, `creditVal`, `processCode`) VALUES (?);';
  let queryArray = [userInput[0], userInput[1], userInput[2], userInput[3], userInput[4], 0]
  con.query(sql, [queryArray], function (err, result) {
      if (err) {
        console.log("Error occurred in inserting into rawhistorydata " + err);
        return writeToSerial([userInput[0], userInput[1], userInput[2], ResultCode.ERR_UNDEFINED]);
      } else {
        changeVoucherIsUsed(userInput);
      }
  });
}

/**
 * Change the isUsed status of the voucher of the current user (from 0 -> 1)
 * in the Voucher table
 * @param {Array[Int, Int, Int, Int]} userInput Array of parsed user Input + voucher value + corresponding credit value
 * userInput index 0: channelNum
 * userInput index 1: houseNum
 * userInput index 2: voucherNum
 * userInput index 3: voucherValue 
 * userInput index 4: creditValue
 */
function changeVoucherIsUsed(userInput) {
  console.log("changing isUsed status of voucher number of " + userInput);
  const sql = 'UPDATE `NG_Voucher` SET `isUsed` = 1 WHERE `voucherNum` = (?);';
  con.query(sql, [userInput[2]], function (err, result, fields){
    if (err) {
      console.log("Error occurred in changing isUsed field of voucher " + userInput[2]);
      return writeToSerial([userInput[0], userInput[1], userInput[2], ResultCode.ERR_UNDEFINED]);
    } else {
      return updateBalance([userInput[0], userInput[1], 0]);
    }
  });
}

/**
 * 
 * @param {*} commandInfo [channelNum, houseNum, onOff]
 */
function updateBalance(commandInfo) {
  const sql = 'UPDATE `NG_UserData` SET `balance` = `credit` - `usage` WHERE  `channel` = (?) AND `houseNum` = (?);';
  con.query(sql, [commandInfo[0], commandInfo[1]], function (err, result, fields){
    if (err) {
      console.log("Error occurred in updating balance for channel " + commandInfo[0] + " , houseNum " + commandInfo[1] + " with error " + err);
    } else {
      console.log(result);
      if (commandInfo[2] == 0) { // turning on
        fireToCommand([commandInfo[0], commandInfo[1], 0]);
      } else if (commandInfo[2] == 1) { // turning off
        selectBalance([commandInfo[0], commandInfo[1], 1]);
      }
    }
  });
}

function selectBalance(channelInfo){
  const sql = 'SELECT `balance` FROM `NG_UserData` WHERE  `channel` = (?) AND `houseNum` = (?);';
  con.query(sql, [channelInfo[0], channelInfo[1]], function (err, result, fields){
    if (err) {
      console.log("Error occurred in updating balance for channel " + channelInfo[0] + " , houseNum " + channelInfo[1] + " with error " + err);
    } else {
      console.log(result);
      if (result[0].balance <= 0) {
        return fireToCommand(channelInfo);
      }
    }
  });
}

/**
 * 
 * @param {*} commandInfo [channelNum, houseNum, onOff]
 */
function fireToCommand(commandInfo) {
  const sql = 'INSERT INTO `NG_CommandTable` (`channel`, `houseNum`, `onOff`, `command`, `sent`) VALUES (?);';
  let command = "T-" + commandInfo[1] + "-" + commandInfo[2]; 
  console.log(command);
  let queryArray = [commandInfo[0], commandInfo[1], commandInfo[2], command, 0];
  con.query(sql, [queryArray], function (err, result, fields){
    if (err) {
      console.log("Error occurred in firing to command table " + commandInfo+ " "  + err);
    } else {
      if (commandInfo[2] == 0) {
        writeToSerial([commandInfo[0], commandInfo[1], commandInfo[2], ResultCode.SUCCESS]);
      }
      console.log("firing success " + command + " " + result);
    }
  });
}

/**
 * Write the resultCode value to Arduino via Serial communication
 * @param {ResultCode} resultCode One of the resultCodes defined in the resultCode enum
 */
function writeToSerial(resultCode){
  if (resultCode[3] != ResultCode.SUCCESS) {
    const sql = 'INSERT INTO `NG_RawHistoryData` (`channel`, `houseNum`, `voucherNum`, `voucherValue`, `creditVal`, `processCode`) VALUES (?);';
    let queryArray = [resultCode[0], resultCode[1], resultCode[2], 0, 0, resultCode[3]];
    con.query(sql, [queryArray], function (err, result, fields){
      if (err) {
        console.log("Error occurred in inserting into raw history data table " + resultCode[3] + " " + err);
      }
    });
  } 
  let resultCodeActual = resultCode[3];
  console.log(resultCodeActual);
  port_keypad.write(resultCodeActual + "\n", 
    (err) => {
      if (err) {
        return console.log("Error on write : ", err.message);
      }
      console.log('message writen with resultCode: ' + resultCodeActual);
    }
  );
} 

