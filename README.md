# tanzania_ict_project
## Project description
Hello, world 

## Environment Setup
### Arduino Software
- Download `Arduino` from the [official arduino site](arduino.cc). Use version 1.8 or higher
- Install the `<keypad.h>` library by Mark Stanley, Alexander Brevig (Version 3.1.1) using the **Arduino Library Manager**

### Node.js Server
- Download `node.js` fron the [official node.js site](https://nodejs.org/en/)
- For this project, the server requires two modules:
  - The `MySQL` module, downloadable through `npm i mysql` 
  - The `serialport` module, downlodable through `npm i serialport`
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
