CREATE DATABASE IF NOT EXISTS `NG_Arduino_Data`
  DEFAULT CHARACTER SET = utf8mb4
  DEFAULT COLLATE = utf8mb4_general_ci;

USE `NG_Arduino_Data`;

/**/
CREATE TABLE IF NOT EXISTS `UserData` (
  `id` int(11) ZEROFILL AUTO_INCREMENT NOT NULL,
  PRIMARY KEY (`id`),
  `channel` int(1) ZEROFILL NOT NULL,
  `building` int(2) ZEROFILL NOT NULL,
  `credit` int(10) ZEROFILL NOT NULL DEFAULT 0,
  `usage` int(10) ZEROFILL NOT NULL DEFAULT 0
) ENGINE = InnoDB 
  DEFAULT CHARSET = utf8mb4
  DEFAULT COLLATE = utf8mb4_general_ci;

/**/
CREATE TABLE IF NOT EXISTS `RawHistoryData` (
  `id` int(11) ZEROFILL AUTO_INCREMENT NOT NULL,
  PRIMARY KEY (`id`),
  `time_purchased` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `channel` int(1) ZEROFILL NOT NULL,
  `building` int(2) ZEROFILL NOT NULL,
  `voucherNum` bigint(10) ZEROFILL NOT NULL,
  `voucherValue` int(6) ZEROFILL NOT NULL,
  `creditVal` int(6) ZEROFILL NOT NULL
) ENGINE = InnoDB 
  DEFAULT CHARSET = utf8mb4
  DEFAULT COLLATE = utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `Voucher` (
  `id` int(11) ZEROFILL AUTO_INCREMENT NOT NULL,
  PRIMARY KEY (`id`),
  `voucherNum`  bigint(10) ZEROFILL NOT NULL,
  `voucherValue` int(6) ZEROFILL NOT NULL, 
  `isUsed` int(1) NOT NULL
) ENGINE = InnoDB 
  DEFAULT CHARSET = utf8mb4
  DEFAULT COLLATE = utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `MoneyToKw` (
  `id` int(11) ZEROFILL AUTO_INCREMENT NOT NULL,
  PRIMARY KEY (`id`),
  `money` int(5) ZEROFILL,
  `credit` int(4) ZEROFILL
) ENGINE = InnoDB 
  DEFAULT CHARSET = utf8mb4
  DEFAULT COLLATE = utf8mb4_general_ci;

INSERT INTO `moneytokw` (`money`, `credit`) VALUES (1000, 10);
INSERT INTO `moneytokw` (`money`, `credit`) VALUES (2000, 20);
INSERT INTO `moneytokw` (`money`, `credit`) VALUES (5000, 50);

DROP PROCEDURE IF EXISTS create_user_data; 
DELIMITER $$
CREATE PROCEDURE create_user_data()
BEGIN
    DECLARE i INT;
    SET i = 1;
    WHILE i <= 22 DO
        INSERT INTO `UserData` (`channel`, `building`,`credit`,`usage`) VALUES (1, i, 0, 0);
        INSERT INTO `UserData` (`channel`, `building`,`credit`,`usage`) VALUES (2, i, 0, 0);
        SET i = i + 1;
    END WHILE;
END $$
DELIMITER $$

DROP PROCEDURE IF EXISTS create_voucher; 
DELIMITER $$
CREATE PROCEDURE `create_voucher`(IN `userDesiredVValue` INT(5), IN `quantity` INT(3))
    MODIFIES SQL DATA
BEGIN
	DECLARE i INT;
    SET i = 1;
    WHILE i <= `quantity` DO
      INSERT INTO `Voucher` (`voucherNum`, `voucherValue`, `isUsed`) VALUES	(FLOOR(RAND()*10000000000), `userDesiredVValue`, 0 );
      SET i = i + 1;
    END WHILE;
 END$$
DELIMITER ;


CALL create_user_data();