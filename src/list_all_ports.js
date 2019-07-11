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