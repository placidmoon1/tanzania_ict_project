# tanzania_ict_project
## Project description
Hello, world 

## Environment Setup

### Arduino Hardware 
- Required Materials:
  - Arduino Mega 
  - USB cable (Arduino to USB)
  - Keypad
  - LCD Shield 
  - 
### Folder
Create a folder in your drive to store the project. 

### Arduino Software
- Download and install `Arduino` from the [official arduino site](arduino.cc). Use version 1.8 or higher
- Install the `<keypad.h>` library by Mark Stanley, Alexander Brevig (Version 3.1.1) using the **Arduino Library Manager**. Search for **Keypad** in the Library Manager and scroll down for the Keypad library. 

### Node.js Server
- Download and install `node.js` version 10.16.0 or higher fron the [official node.js site](https://nodejs.org/en/)
- For this project, the server requires two modules:
  - First, open `cmd` (in Windows environment) and `cd` to the folder that you created
  - Install the `MySQL` module through the `npm i mysql` command
  - Install the `serialport` module through the `npm i serialport` command
- Also, depending on the MySQL server location, the following codeblock in the `NodeJS_data_logger.js` file in lines 5-12 needs to be changed

```javascript tomorrow
const con = MySQL.createConnection({
    host: "localhost", //hostname
    port: "3306", //port to connect 
    user: "root", //ID of server
    password: "", //PW of server 
    database: "ng_arduino_data", // name has to be same as the database to connect 
    charset: "utf8mb4_general_ci"
});
```

### PHP Server
- Download and install WAMP server version 3.1.9 or higher from [sourceforge](https://sourceforge.net/projects/wampserver/)

## Using the system
On start: 
1. Turn on the `WAMP` server. 
2. Connect the `Arduino` with the computer usb port
3. Open the `cmd` and `cd` to the folder that you created
4. Use the command `node NodeJS_data_logger` to turn on the `NodeJS` server

Continuously: 
1. User inputs via Arduino keypad
2. The input would be parsed, and queried appropriately
3. The return value would be a **process code**, which would be displayed in the Arduino LCD screen.



  




