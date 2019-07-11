// ------------ Serial ------------ //

const SerialPort = require('serialport');

const baudRate = 115200;

let port_channel = null;

SerialPort.list((err, ports) => {
    if (err)
        console.error(err);
    if (ports.length == 0)
        console.error("No Serial ports found");

    // Iterate over all the serial ports, and look for an Arduino
    let comName_channel = null;
    ports.some((port) => {
      if (port.pnpId
        && port.pnpId.match(/USB\\VID_2341\&PID_804E\&MI_00\\8\&56FCEDF\&0\&0000/)) { // Arduino MKR Channel 1 "hard coding"
          comName_channel = port.comName;
          console.log('Found Arduino Channel 1');
          console.log('\t' + port.comName);
          console.log('\t\t' + port.pnpId);
          console.log('\t\t' + port.manufacturer);
          return true;
        }
        return false;
    });

    port_channel = new SerialPort(comName_channel, { baudRate: baudRate },
      (err) => {
        if (err) {
          console.error(err);
        } else {
          console.log("connected to channel");
        }
      });
    port_channel.on('data', receiveChannelSerial);

});

// ------------ Server ------------ //



// A class for reading lines of text
class TextParser {
    constructor() {
        this.string = '';
        this.clear = false;
    }
    static isEndMarker(char) {
        return char == '~' || char == 'a'; // New line characters (NL & CR)
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

const parserChannel = new TextParser;

// ----------  Channel   ------------ //

function receiveChannelSerial(dataBuf) {
  let str = dataBuf;
  console.log("channel buffer");
  console.log(str.length);
  console.log(str);
  str = str.toString('utf8');
  console.log(str);
  // Loop over all characters
  for (let i = 0; i < str.length; i++) {
      // Parse the character
      if (parserChannel.parse(str[i])) {
          // If a complete line has been received,
          // insert it into the database
          console.log("full iteration");
          console.log("message is: " + parserChannel.message);
      }
  }
}