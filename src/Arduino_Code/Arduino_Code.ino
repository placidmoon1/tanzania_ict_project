#include <LiquidCrystal.h>
#include <Keypad.h>
const byte DATA_MAX_SIZE = 32;
char data[DATA_MAX_SIZE];   // an array to store the received data
const byte ROWS = 4; //four rows
const byte COLS = 4; //four columns
const byte rowPins[ROWS] = {47,49,51,53};   // R1, R2, R3, R4 단자가 연결된 아두이노 핀 번호 - 초 노 주 빨
const byte colPins[COLS] = {39,41,43,45};   // C1, C2, C3, C4 단자가 연결된 아두이노 핀 번호 - 흰 회 보 파
const char keys[ROWS][COLS] = {
     {'1','2','3','A'},
     {'4','5','6','B'},
     {'7','8','9','C'},
     {'*','0','#','D'}
};

Keypad kpd = Keypad(makeKeymap(keys), rowPins, colPins, ROWS, COLS);
LiquidCrystal lcd(8, 9, 4, 5, 6, 7);
String input;
String disp_code;

String getNumber()
{
       char key = kpd.getKey();//변수key에 입력값 저장

       switch (key)
       {
           case NO_KEY:
           break;

           case 'C': //누른 모든 문자 초기화
            input = "";
           break;

           case 'D': // 엔터
           Serial.println(input); 
           return "D" ;
           break;
           
           case '0': case '1': case '2': case '3': case '4':
           case '5': case '6': case '7': case '8': case '9':
           case '#': case '*':
           if(input.length()>15){ // if length exceeed
            lcd.clear();
            lcd.print("CHECK THE LENGTH!");
            delay(1000);
            lcd.clear();
            lcd.print(input);
           } else{
            input += key;//num에 누른 문자가 차례대로 저장
            return key;
           }
           break;

           case 'B': //뒤에서 한문자씩 지우기
           int len=input.length();
           input = input.substring(0, len-1);
           break;
       }
       key = kpd.getKey();//code를 계속해서 받는다
       return input;//D를 누르면 while문을 빠져나와 GetNumber()함수에 num값이 반환
}

void setup(){
  lcd.begin(16,2);
  pinMode(10,OUTPUT);
  digitalWrite(10, 1);
  lcd.clear();
  lcd.setCursor(0,0);
  Serial.begin(115200);
  lcd.print("Turning on ... ");
  delay(2000);
  lcd.clear();
}

void loop(){
  String code;
  code = getNumber();//code로 num값을 받음
  if(code!=disp_code){ //work only if changed
    lcd.clear();
    lcd.print(code);
    disp_code=code;
  }
  String stringEnter = "D";
  char received;
  if (stringEnter.equals(code)) {
    lcd.clear();
    lcd.print("Getting input ...");
    for (int forloopind = 0; forloopind < 10; forloopind++){
      if (Serial.available()){
        lcd.clear();
        received = receiveData();
        break;
      } 
      if (forloopind == 9){
        received = '8';
      }
      delay(500);
    }
    switch (received) {
      case '0': 
        lcd.print("success");
        break;
      case '1':
        lcd.print("Invalid voucher!");
        break;
      case '2':
        lcd.print("Voucher used");
        break;
      case '3':
        lcd.print("Invalid channel");
        lcd.setCursor(0,1);
        lcd.print("or building #");
        break;
      case '8':
        lcd.print("No connection");
        break;
      default: 
        lcd.print("unknown error");
        break;
    }
    input="";
    delay(5000);
    lcd.clear();
  }
}

char receiveData() {
  static char endMarker = '\n'; // message separator
  char receivedChar;     // read char from serial port
  int ndx = 0;          // current index of data buffer
  char firstChar;
  // clean data buffer
  memset(data, 32, sizeof(data));
  // read while we have data available and we are
  // still receiving the same message.
  while(Serial.available() > 0) {
    receivedChar = Serial.read();
    if (ndx == 0) firstChar = receivedChar;
    if (receivedChar == endMarker) {
      data[ndx] = '\0'; // end current message
      return firstChar;
    }
    // looks like a valid message char, so append it and
    // increment our index
    data[ndx] = receivedChar;
    ndx++;
  }
}
