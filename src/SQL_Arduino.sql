CREATE DATABASE IF NOT EXISTS `NG_Arduino_Data`
  DEFAULT CHARACTER SET = utf8mb4
  DEFAULT COLLATE = utf8mb4_general_ci;

USE `NG_Arduino_Data`;

CREATE TABLE IF NOT EXISTS `NG_deviceTable` (
  `id` int (11) ZEROFILL AUTO_INCREMENT NOT NULL,
  PRIMARY KEY (`id`),
  `deviceName` varchar(20) NOT NULL,
  `pnpId` varchar(100) NOT NULL
) ENGINE = InnoDB 
  DEFAULT CHARSET = utf8mb4
  DEFAULT COLLATE = utf8mb4_general_ci; 

CREATE TABLE IF NOT EXISTS `NG_CommandTable` (
  `id` int (11) ZEROFILL AUTO_INCREMENT NOT NULL,
  PRIMARY KEY (`id`),
  `date_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `channel` int(1) UNSIGNED ZEROFILL NOT NULL,
  `houseNum` int(2) UNSIGNED ZEROFILL NOT NULL,
  `onOff` int(1) UNSIGNED ZEROFILL NOT NULL,
  `command` varchar(6) NOT NULL,
  `sent` int(1) NOT NULL
) ENGINE = InnoDB 
  DEFAULT CHARSET = utf8mb4
  DEFAULT COLLATE = utf8mb4_general_ci; 

/**/
CREATE TABLE IF NOT EXISTS `NG_UserData` (
  `id` int(11) ZEROFILL AUTO_INCREMENT NOT NULL,
  PRIMARY KEY (`id`),
  `channel` int(1) ZEROFILL NOT NULL,
  `houseNum` int(2) NOT NULL,
  `credit` int(8)  NOT NULL DEFAULT 0,
  `usage` int(8)  NOT NULL DEFAULT 0,
  `balance` int(8) NOT NULL 
) ENGINE = InnoDB 
  DEFAULT CHARSET = utf8mb4
  DEFAULT COLLATE = utf8mb4_general_ci;

/**/
CREATE TABLE IF NOT EXISTS `NG_RawHistoryData` (
  `id` int(11) ZEROFILL AUTO_INCREMENT NOT NULL,
  PRIMARY KEY (`id`),
  `time_purchased` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `channel` int(1) ZEROFILL,
  `houseNum` int(2) UNSIGNED ZEROFILL,
  `voucherNum` bigint(10) UNSIGNED ZEROFILL,
  `voucherValue` int(6) UNSIGNED ZEROFILL,
  `creditVal` int(6) ZEROFILL,
  `processCode` char(1) NOT NULL
) ENGINE = InnoDB 
  DEFAULT CHARSET = utf8mb4
  DEFAULT COLLATE = utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `NG_Voucher` (
  `id` int(11) ZEROFILL AUTO_INCREMENT NOT NULL,
  PRIMARY KEY (`id`),
  `voucherNum` bigint(10) UNSIGNED ZEROFILL NOT NULL,
  `voucherValue` int(6) UNSIGNED ZEROFILL NOT NULL, 
  `isUsed` int(1) UNSIGNED NOT NULL
) ENGINE = InnoDB 
  DEFAULT CHARSET = utf8mb4
  DEFAULT COLLATE = utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `NG_ValueToKw` (
  `id` int(11) ZEROFILL AUTO_INCREMENT NOT NULL,
  PRIMARY KEY (`id`),
  `value` int(6) ZEROFILL,
  `credit` int(4) ZEROFILL
) ENGINE = InnoDB 
  DEFAULT CHARSET = utf8mb4
  DEFAULT COLLATE = utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `NG_RawCurrentData` (
  `id` int (11) ZEROFILL AUTO_INCREMENT NOT NULL,
  PRIMARY KEY (`id`),
  `date_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `channel` int(1) NOT NULL,
  `raw_current_data` varchar(155) NOT NULL
) ENGINE = InnoDB 
  DEFAULT CHARSET = utf8mb4
  DEFAULT COLLATE = utf8mb4_general_ci;

INSERT INTO `NG_valuetokw` (`value`, `credit`) VALUES (1000, 10);
INSERT INTO `NG_valuetokw` (`value`, `credit`) VALUES (2000, 20);
INSERT INTO `NG_valuetokw` (`value`, `credit`) VALUES (5000, 50);

INSERT INTO `NG_DeviceTable` (`deviceName`, `pnpId`) VALUES ("Arduino_Keypad", "1");
INSERT INTO `NG_DeviceTable` (`deviceName`, `pnpId`) VALUES ("Arduino_Channel1", "1");
INSERT INTO `NG_DeviceTable` (`deviceName`, `pnpId`) VALUES ("Arduino_Channel2", "1");

DROP PROCEDURE IF EXISTS create_user_data; 
DELIMITER $$
CREATE PROCEDURE create_user_data()
    MODIFIES SQL DATA
BEGIN
    DECLARE i INT;
    SET i = 1;
    WHILE i <= 22 DO
        INSERT INTO `NG_UserData` (`channel`, `houseNum`,`credit`,`usage`, `balance`) VALUES (1, i, 0, 0, 0);
        INSERT INTO `NG_UserData` (`channel`, `houseNum`,`credit`,`usage`, `balance`) VALUES (2, i, 0, 0, 0);
        SET i = i + 1;
    END WHILE;
END $$
DELIMITER ;

DROP PROCEDURE IF EXISTS create_voucher; 
DELIMITER $$
CREATE PROCEDURE `create_voucher`(IN `voucherValue` INT(6), IN `quantity` INT(3))
    MODIFIES SQL DATA
BEGIN
	DECLARE i INT;
    SET i = 1;
    WHILE i <= `quantity` DO
      INSERT INTO `NG_Voucher` (`voucherNum`, `voucherValue`, `isUsed`) VALUES	(FLOOR(RAND()*10000000000), `voucherValue`, 0 );
      SET i = i + 1;
    END WHILE;
 END$$
DELIMITER ;

DROP PROCEDURE IF EXISTS update_voucher_credit_value; 
DELIMITER $$
CREATE PROCEDURE `update_voucher_credit_value`(IN `voucherValue` INT(6), IN `voucherCredit` INT(4))
    MODIFIES SQL DATA
UPDATE `NG_valuetokw` SET `credit` = `voucherCredit` WHERE `value` = `voucherValue`$$
DELIMITER ;


CALL create_user_data();