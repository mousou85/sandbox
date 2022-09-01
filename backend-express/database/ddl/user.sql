CREATE TABLE `users` (
  `user_idx` INT(10) UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'idx',
  `id` VARCHAR(100) NOT NULL COMMENT 'user id' COLLATE 'utf8mb4_general_ci',
  `password` VARCHAR(255) NOT NULL COMMENT 'password' COLLATE 'utf8mb4_general_ci',
  `name` VARCHAR(50) NOT NULL COMMENT 'name' COLLATE 'utf8mb4_general_ci',
  `created_at` TIMESTAMP NOT NULL DEFAULT current_timestamp() COMMENT 'create time',
  `last_login_at` TIMESTAMP NULL DEFAULT NULL COMMENT 'last login time',
  `login_fail_count` TINYINT(3) UNSIGNED NOT NULL DEFAULT '0' COMMENT 'login fail count',
  `use_otp` ENUM('y','n') NOT NULL DEFAULT 'n' COMMENT 'otp flag' COLLATE 'utf8mb4_general_ci',
  PRIMARY KEY (`user_idx`) USING BTREE,
  INDEX `IDX_USER_ID` (`id`) USING BTREE,
  INDEX `IDX_CREATED_AT` (`created_at`) USING BTREE,
  INDEX `IDX_LAST_LOGIN_AT` (`last_login_at`) USING BTREE
)
  COLLATE='utf8mb4_general_ci'
  ENGINE=InnoDB
;
CREATE TABLE `users_password_salt` (
  `user_idx` INT(10) UNSIGNED NOT NULL COMMENT 'user idx',
  `salt` VARCHAR(255) NOT NULL COMMENT 'password salt' COLLATE 'utf8mb4_general_ci',
  PRIMARY KEY (`user_idx`) USING BTREE,
  CONSTRAINT `users_password_salt_fk_1` FOREIGN KEY (`user_idx`) REFERENCES `users` (`user_idx`) ON UPDATE CASCADE ON DELETE CASCADE
)
  COLLATE='utf8mb4_general_ci'
  ENGINE=InnoDB
;
CREATE TABLE `users_otp` (
  `user_idx` INT(10) UNSIGNED NOT NULL COMMENT 'user idx',
  `secret` VARCHAR(52) NOT NULL COMMENT 'otp secret' COLLATE 'utf8mb4_general_ci',
  PRIMARY KEY (`user_idx`) USING BTREE,
  CONSTRAINT `users_otp_fk_1` FOREIGN KEY (`user_idx`) REFERENCES `users` (`user_idx`) ON UPDATE CASCADE ON DELETE CASCADE
)
  COLLATE='utf8mb4_general_ci'
  ENGINE=InnoDB
;
CREATE TABLE `users_login_log` (
  `log_idx` INT(10) UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'idx',
  `user_idx` INT(10) UNSIGNED NULL DEFAULT NULL COMMENT 'user idx',
  `log_type` ENUM('badRequest','login','attempt','passwordMismatch','loginFailExceed') NOT NULL DEFAULT 'badRequest' COMMENT 'log type' COLLATE 'utf8mb4_general_ci',
  `ip` INT(10) UNSIGNED NOT NULL COMMENT 'ip address',
  `user_agent` TEXT NULL DEFAULT NULL COMMENT 'user agent' COLLATE 'utf8mb4_general_ci',
  `created_at` TIMESTAMP NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`log_idx`) USING BTREE,
  INDEX `IDX_CREATED_AT` (`created_at`) USING BTREE,
  INDEX `IDX_USER` (`user_idx`, `log_type`) USING BTREE,
  CONSTRAINT `users_login_log_fk_1` FOREIGN KEY (`user_idx`) REFERENCES `users` (`user_idx`) ON UPDATE CASCADE ON DELETE SET NULL
)
  COLLATE='utf8mb4_general_ci'
  ENGINE=InnoDB
;
