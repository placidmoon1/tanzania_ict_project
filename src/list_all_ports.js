const SerialPort = require('serialport');
const fs = require("fs");

SerialPort.list((err, ports) => {
  if (err)
      console.error(err);
  if (ports.length == 0)
      console.error("No Serial ports found");

  // Iterate over all the serial ports, and look for an Arduino
  ports.some((port) => {
    if (port.pnpId) { // Arduino Mega
      /*
      if (port.pnpId.match(/USB\\VID_2341\&PID_804E\&MI_00\\6\&56FCEDF\&0\&0000/)){
        console.log("found Arduino MKR Channel 1");
      } else if ( port.pnpId.match(/USB\\VID_2341\&PID_0042\\55834323933351403140/)) {
        console.log("found Arduino Keypad");
      }
      */
      console.log('\t' + port.comName);
      console.log('\t\t' + port.pnpId);
      console.log('\t\t' + port.manufacturer);
      let data = "" + port.comName + "\n\t" + port.pnpId + "\n\t" + port.manufacturer;
      fs.writeFile("port_list.txt", data, (err) => {
        if (err) console.log(err);
      })
    }
      return false;
     
  });


});