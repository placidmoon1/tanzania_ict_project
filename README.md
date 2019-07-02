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

### Valid form of input
\*\[`channelNum`\]\[`buildingNum`\]\*\[`voucherNum`\]\*
where: 
- `channelNum` is a one digit integer
- `buildingNum` is a two digit integer
- `voucherNum` is a ten digit integer
### Process of the system
On start: 
1. Turn on the `WAMP` server. 
2. Type `localhost` in your main browser 
3. Go to Tools > `phpmyadmin` 
4. Login to `phpmyadmin` through the default username and password (`root`, [Nothing]) 
5. **(Only on first start)** _Copy the SQL_Arduino code and paste it in the SQL tab and click go_
6. Connect the `Arduino` with the computer usb port
7. Open the `cmd` and `cd` to the folder that you created
8. Use the command `node NodeJS_data_logger` to turn on the `NodeJS` server

Continuously: 
1. User inputs a potentially valid input via Arduino keypad
2. The input would be parsed, and queried appropriately.
3. The return value would be a `processCode`, which would be displayed in the Arduino LCD screen.

### LCD Display & `processCode`s
- On start: `Turning on ...` for 2 seconds
- In typing: Continuously show typed input; if another number, #, or * was typed, update screen
- When B is clicked: Delete the last typed character if there is 1+ characters
- When C is clicked: Delete all typed input
- When D is clicked show "Getting input ... " for either 5 seconds OR until a `processCode` is sent by the server
- After 5 seconds OR a `processCode` is received, one of the six of the following can appear in the LCD screen for 5 seconds 
  - `Success` if the entered voucher number was valid (`processCode` == 0)
  - `Invalid voucher` if the voucher number doesn't exist in the system (`processCode` == 1)
  - `Voucher used` if the voucher was already used (`processCode` == 2)
  - `Invalid channel or building #` if the entered channel and/or building # doesn't exist in the system (`processCode` == 3)
  - `No connection` if there was no `processCode` sent by server after **5 seconds**
  - `Unknown error` otherwise
   

  




