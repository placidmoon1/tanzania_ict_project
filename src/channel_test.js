// ------------ MySQL ------------ //

const MySQL = require('mysql');

const con = MySQL.createConnection({
    multipleStatements: true,
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

let port_channel1 = null;

SerialPort.list((err, ports) => {
    if (err)
        console.error(err);
    if (ports.length == 0)
        console.error("No Serial ports found");

    // Iterate over all the serial ports, and look for an Arduino
    let comName_channel1 = null;
    ports.some((port) => {
      if (port.pnpId
          && port.pnpId.match(/USB\\VID_2341\&PID_804E\&MI_00\\8\&56FCEDF\&0\&0000/)) { // Arduino Mega "hard coding"
            comName_channel1 = port.comName;
            console.log('Found Arduino Mega: the Keypad');
            console.log('\t' + port.comName);
            console.log('\t\t' + port.pnpId);
            console.log('\t\t' + port.manufacturer);
            /*result += 1;
            if (result == 3) {
              return true;
            }
            */
           return true;
          }
       
        return false;
    });


    port_channel1 = new SerialPort(comName_channel1, { baudRate: baudRate },
      (err) => {
          if (err)
              console.error(err);
      });
    port_channel1.on('data', receiveChannel1Serial);

    
});

// A class for reading lines of text
class TextParser {
    constructor() {
        this.string = '';
        this.clear = false;
    }
    static isEndMarker(char) {
        return char == '~' || char == 'a';  // New line characters (NL & CR)
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

const parserChannel1 = new TextParser;

// ----------  Channel 1  ------------ //

function receiveChannel1Serial(dataBuf) {
  let str = dataBuf;
  console.log(str.length);
  console.log(str);
  str = str.toString('utf8');
  console.log(str);
  // Loop over all characters
  for (let i = 0; i < str.length; i++) {
      // Parse the character
      if (parserChannel1.parse(str[i])) {
          // If a complete line has been received,
          // insert it into the database
          splitChannelString([parserChannel1.message, 2]);
      }
  }
}


// --- Common Functions for Channel ------------ //

function splitChannelString(messageInfo) {
  let message = messageInfo[0];
  let channelNum = messageInfo[1];
  console.log("splitting string of channel " + message);
  /*
  let validString = message.substr(0,4);
  if (validString !== "data") {
    console.log("not a valid sequence");
  } 
  */
  let messageLen = message.length;
  if (messageLen < 150) {
    console.log("not a valid sequence");
  } else {
    console.log("valid sequence");
    splittedMessage = message.substr(1, 150); //current data, 30 sets of 'x.xx,'
    const sql = 'INSERT INTO `NG_RawCurrentData` (`channel`, raw_current_data) VALUES (?, ?)';
    con.query(sql, [channelNum, splittedMessage], function (err, result, fields){
      if (err) {
        console.log("Error occurred in inserting into NG_rawcurrentdata table" + err);
      } else {
        console.log(result);
        return updateUsage([splittedMessage, channelNum]);
      }
    });
  }
}

function updateUsage(messageInfo) {
  let message = messageInfo[0];
  let channelNum = messageInfo[1];
  console.log("dividing string of channel " + message);
  const sql = 'UPDATE `NG_UserData` SET `usage` = `usage` + (?) WHERE `channel` = (?) AND `houseNum` = (?);';
  for (let houseNum = 1; houseNum <= 22; houseNum++) {
    let currentData = Math.floor(parseFloat(message.substr((houseNum -1)* 5, 4)) * 100); //assuming data is x.xx
    console.log(currentData);
    if (currentData != 0) {
      let queryArray = [currentData, channelNum, houseNum];
      con.query(sql, queryArray, function (err, result, fields){
        if (err) {
          console.log("Error occurred in updating NG_userData table for channel 1, houseNum " + houseNum + " " + err);
        } else {
          console.log(result);
          return updateBalance([channelNum, houseNum, 1]);
        }
      });
    }
  }  
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
      selectBalance([commandInfo[0], commandInfo[1], 1]);
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
      fireToCommand(channelInfo);
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
  let queryArray = [commandInfo[0], commandInfo[1], commandInfo[2], command, 1];
  con.query(sql, [queryArray], function (err, result, fields){
    if (err) {
      console.log("Error occurred in firing to command table " + commandInfo);
    } else {
      writeToSerial([commandInfo[0], commandInfo[1], commandInfo[2]]);
      console.log("firing success " + command + " " + result);
    }
  });
}

/**
 * Write the resultCode value to Arduino via Serial communication
 * @param {*} resultCode One of the resultCodes defined in the resultCode enum
 */
function writeToSerial(resultCode){
  let resultCodeActual = "T-" + resultCode[1] + "-" + resultCode[2];
  port_channel1.write(resultCodeActual + "\n", 
    (err) => {
      if (err) {
        return console.log("Error on write : ", err.message);
      }
      console.log('message writen with resultCode: ' + resultCodeActual);
    }
  );
} 


let minutes = 1, the_interval = minutes * 60 * 1000;
setInterval(function() {
    console.log("I am doing my 1 minutes check");
  const sql = 'SELECT `channel`, `houseNum`, `id` FROM `NG_CommandTable` WHERE `sent` = 0;  ';
  con.query(sql, [], function (err, result, fields){
    if (err) {
      console.log("Error occurred in selecting all not sent from command table " + err);
    } else {
      let i = 0;
      for (; i < result.length; i++) {
        updateSent([result[i].channel, result[i].houseNum, result[i].id]);
      }
    }
  });
}, the_interval);

function updateSent(commandArray) {
  console.log("updating " + commandArray);
  const sql = 'UPDATE `NG_CommandTable` SET `sent` = 1 WHERE `id` = (?)';
  con.query(sql, [commandArray[2]], function (err, result, fields){
    if (err) {
      console.log("Error occurred in selecting all not sent from command table " + err);
    } else {
      writeToSerial([commandArray[0], commandArray[1], 0]);
    }
  });
}