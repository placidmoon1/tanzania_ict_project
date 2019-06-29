#include <LiquidCrystal.h>
#include <Keypad.h>

const byte ROWS = 4; //four rows
const byte COLS = 4; //three columns

char keys[ROWS][COLS] = {
     {'1','2','3','A'},
     {'4','5','6','B'},
     {'7','8','9','C'},
     {'*','0','#','D'}
};

int lcd_key     = 0;
int adc_key_in  = 0;
#define btnRIGHT  0
#define btnUP     1 
#define btnDOWN   2 
#define btnLEFT   3
#define btnSELECT 4
#define btnNONE   5   
#define btnEncodeOK  6 

int read_LCD_buttons() 
{  
adc_key_in = analogRead(0);      
// read the value from the sensor  
// my buttons when read are centered at these valies: 0, 144, 329, 504, 741  
// we add approx 50 to those values and check to see if we are close  
//if(digitalRead(11)==0) return EncodeOK;
if (adc_key_in > 1000) return btnNONE; 
// We make this the 1st option for speed reasons since it will be the most likely result  
// For V1.1 us this threshold  
if (adc_key_in < 50)   return btnLEFT;   
if (adc_key_in < 150)  return btnUP;   
if (adc_key_in < 250)  return btnRIGHT;   
if (adc_key_in < 450)  return btnSELECT;   
if (adc_key_in < 700)  return btnDOWN;     
if (adc_key_in < 850)  return btnEncodeOK;
// For V1.0 comment the other threshold and use the one below: 
/*  if (adc_key_in < 50)   return btnRIGHT;    
if (adc_key_in < 195)  return btnUP;  
if (adc_key_in < 380)  return btnDOWN;  
if (adc_key_in < 555)  return btnLEFT;   
if (adc_key_in < 790)  return btnSELECT;    
*/    
return btnNONE;  // when all others fail, return this... 
}   

byte rowPins[ROWS] = {47,49,51,53};   // R1, R2, R3, R4 단자가 연결된 아두이노 핀 번호 - 초 노 주 빨
byte colPins[COLS] = {39,41,43,45};   // C1, C2, C3, C4 단자가 연결된 아두이노 핀 번호 - 흰 회 보 파
int count=0;
Keypad kpd = Keypad(makeKeymap(keys), rowPins, colPins, ROWS, COLS);

char entryStr[12];   // This can hold up to 4 digits

void Encoder_san();

const int Encoder_A=3;
const int Encoder_B=2;
unsigned int Encoder_number=0;
  int state=0;

LiquidCrystal lcd(8, 9, 4, 5, 6, 7);

String num;

String GetNumber()
{
       char key = kpd.getKey();//변수key에 입력값 저장
       switch (key)
       {
           case NO_KEY:
           break;

           case '0': case '1': case '2': case '3': case '4':
           case '5': case '6': case '7': case '8': case '9':
           case '#': case '*':
           num += key;//num에 누른 문자가 차례대로 저장
           break;

           case 'B':
           int len=num.length();
           num = num.substring(0, len-1);//num의 0자리부터 a-1자리까지 잘라 다시 대입
           Serial.println(num);
           break;

           case 'C':
           num = "";//누른 모든 문자 초기화
           break;

           case 'A':
           Serial.println(num);
           break;
       }
       key = kpd.getKey();//code를 계속해서 받는다
       return num;//D를 누르면 while문을 빠져나와 GetNumber()함수에 num값이 반환
}

void setup() {
  // put your setup code here, to run once:
  lcd.begin(16,2);
  pinMode(10,OUTPUT);
  digitalWrite(10, 1);
  
  lcd.setCursor(0,0);
  lcd.clear();
  Serial.begin(115200);
}

String disp_code;
void loop() {
  // put your main code here, to run repeatedly:
  /*
   key = kpd.getKey();
  if(key){
    Serial.println(token);
    lcd.print(key);
  }
  
  lcd_key = read_LCD_buttons();
  if(lcd_key==4){ //buttonselect
    lcd.clear();
  }
  */
  String code;
  code = GetNumber();//code로 num값을 받음
  if(code!=disp_code){ //work only if changed
    lcd.clear();
    lcd.print(code);
    disp_code=code;
  }
}
