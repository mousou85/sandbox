CREATE TABLE `invest_group` (
  `group_idx` INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_idx` INT(10) UNSIGNED NOT NULL COMMENT 'user idx',
  `group_name` VARCHAR(50) NOT NULL COMMENT '그룹명' COLLATE 'utf8mb4_general_ci',
  `created_at` TIMESTAMP NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`group_idx`) USING BTREE,
  INDEX `IDX_USER` (`user_idx`) USING BTREE,
  CONSTRAINT `invest_group_fk_1` FOREIGN KEY (`user_idx`) REFERENCES `users` (`user_idx`) ON UPDATE CASCADE ON DELETE CASCADE
)
  COMMENT='재테크 기록 - 상품 그룹'
  COLLATE='utf8mb4_general_ci'
  ENGINE=InnoDB
;
CREATE TABLE `invest_unit` (
  `unit_idx` INT(10) UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '단위 IDX',
  `user_idx` INT(10) UNSIGNED NOT NULL COMMENT 'user idx',
  `unit` VARCHAR(10) NOT NULL COMMENT '단위' COLLATE 'utf8mb4_general_ci',
  `unit_type` VARCHAR(5) NOT NULL COMMENT '단위 타입(int, float)' COLLATE 'utf8mb4_general_ci',
  PRIMARY KEY (`unit_idx`) USING BTREE,
  INDEX `IDX_UNIT` (`unit`) USING BTREE,
  INDEX `IDX_USER` (`user_idx`) USING BTREE,
  CONSTRAINT `invest_unit_fk_1` FOREIGN KEY (`user_idx`) REFERENCES `users` (`user_idx`) ON UPDATE CASCADE ON DELETE CASCADE
)
  COMMENT='재테크기록 - 단위'
  COLLATE='utf8mb4_general_ci'
  ENGINE=InnoDB
;
CREATE TABLE `invest_item` (
  `item_idx` INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_idx` INT(10) UNSIGNED NOT NULL COMMENT 'user idx',
  `item_type` VARCHAR(10) NOT NULL COMMENT '상품 종류' COLLATE 'utf8mb4_general_ci',
  `item_name` VARCHAR(50) NOT NULL COMMENT '상품명' COLLATE 'utf8mb4_general_ci',
  `summary_unit_idx` INT(10) UNSIGNED NULL DEFAULT NULL COMMENT '요약 생성 대상 단위 IDX',
  `created_at` TIMESTAMP NOT NULL DEFAULT current_timestamp(),
  `is_close` ENUM('y','n') NOT NULL DEFAULT 'n' COLLATE 'utf8mb4_general_ci',
  `closed_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`item_idx`) USING BTREE,
  INDEX `IDX_COMPANY` (`is_close`) USING BTREE,
  INDEX `IDX_ITEM_TYPE` (`item_type`, `is_close`) USING BTREE,
  INDEX `IDX_SUMMARY_UNIT` (`summary_unit_idx`) USING BTREE,
  INDEX `IDX_USER` (`user_idx`) USING BTREE,
  CONSTRAINT `invest_item_fk_1` FOREIGN KEY (`user_idx`) REFERENCES `users` (`user_idx`) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT `invest_item_fk_2` FOREIGN KEY (`summary_unit_idx`) REFERENCES `invest_unit` (`unit_idx`) ON UPDATE CASCADE ON DELETE SET NULL
)
  COMMENT='재테크기록 - 상품'
  COLLATE='utf8mb4_general_ci'
  ENGINE=InnoDB
;
CREATE TABLE `invest_group_item` (
  `group_idx` INT(10) UNSIGNED NOT NULL,
  `item_idx` INT(10) UNSIGNED NOT NULL,
  PRIMARY KEY (`group_idx`, `item_idx`) USING BTREE,
  INDEX `invest_group_item_fk_2` (`item_idx`) USING BTREE,
  CONSTRAINT `invest_group_item_fk_1` FOREIGN KEY (`group_idx`) REFERENCES `invest_group` (`group_idx`) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT `invest_group_item_fk_2` FOREIGN KEY (`item_idx`) REFERENCES `invest_item` (`item_idx`) ON UPDATE CASCADE ON DELETE CASCADE
)
  COMMENT='재테크 기록 - 그룹 상품'
  COLLATE='utf8mb4_general_ci'
  ENGINE=InnoDB
;
CREATE TABLE `invest_unit_set` (
  `unit_set_idx` INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `item_idx` INT(10) UNSIGNED NOT NULL COMMENT '상품 IDX',
  `unit_idx` INT(10) UNSIGNED NOT NULL COMMENT '단위 IDX',
  PRIMARY KEY (`unit_set_idx`) USING BTREE,
  INDEX `IDX_ITEM` (`item_idx`) USING BTREE,
  INDEX `IDX_UNIT` (`unit_idx`) USING BTREE,
  CONSTRAINT `invest_unit_set_fk_1` FOREIGN KEY (`item_idx`) REFERENCES `invest_item` (`item_idx`) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT `invest_unit_set_fk_2` FOREIGN KEY (`unit_idx`) REFERENCES `invest_unit` (`unit_idx`) ON UPDATE CASCADE ON DELETE CASCADE
)
  COMMENT='재테크 기록 - 단위 세트'
  COLLATE='utf8mb4_general_ci'
  ENGINE=InnoDB
;
CREATE TABLE `invest_history` (
  `history_idx` INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `item_idx` INT(10) UNSIGNED NOT NULL COMMENT '상품 IDX',
  `unit_idx` INT(10) UNSIGNED NOT NULL COMMENT '단위 IDX',
  `history_date` DATE NULL DEFAULT NULL COMMENT '기록 일자',
  `history_type` ENUM('revenue','inout') NOT NULL COMMENT '기록 타입' COLLATE 'utf8mb4_general_ci',
  `inout_type` ENUM('principal','proceeds') NULL DEFAULT NULL COMMENT '유입/유출 타입' COLLATE 'utf8mb4_general_ci',
  `revenue_type` ENUM('interest','eval') NULL DEFAULT NULL COMMENT '평가수익 타입' COLLATE 'utf8mb4_general_ci',
  `val` DOUBLE NOT NULL DEFAULT '0' COMMENT '값',
  `memo` TEXT NULL DEFAULT NULL COMMENT '메모' COLLATE 'utf8mb4_general_ci',
  `created_at` TIMESTAMP NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`history_idx`) USING BTREE,
  INDEX `IDX_ITEM` (`item_idx`) USING BTREE,
  INDEX `IDX_INOUT` (`history_type`, `inout_type`) USING BTREE,
  INDEX `IDX_REVENUE` (`history_type`, `revenue_type`) USING BTREE,
  INDEX `IDX_UNIT` (`unit_idx`) USING BTREE,
  INDEX `IDX_HISTORY_DATE` (`history_date`) USING BTREE,
  INDEX `IDX_CREATED_AT` (`created_at`) USING BTREE,
  CONSTRAINT `invest_history_fk_1` FOREIGN KEY (`item_idx`) REFERENCES `invest_item` (`item_idx`) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT `invest_history_fk_2` FOREIGN KEY (`unit_idx`) REFERENCES `invest_unit` (`unit_idx`) ON UPDATE CASCADE ON DELETE CASCADE
)
  COMMENT='재테크기록 - 기록'
  COLLATE='utf8mb4_general_ci'
  ENGINE=InnoDB
;
CREATE TABLE `invest_summary` (
  `item_idx` INT(10) UNSIGNED NOT NULL COMMENT '상품 IDX',
  `unit_idx` INT(10) UNSIGNED NOT NULL COMMENT '단위 IDX',
  `inout_total` DOUBLE NOT NULL DEFAULT '0' COMMENT '유입/유출 - 총합',
  `inout_principal` DOUBLE NOT NULL DEFAULT '0' COMMENT '유입/유출 - 원금(총합)',
  `inout_proceeds` DOUBLE NOT NULL DEFAULT '0' COMMENT '유입/유출 - 수익재투자(총합)',
  `revenue_total` DOUBLE NOT NULL DEFAULT '0' COMMENT '평가 - 총합',
  `revenue_interest` DOUBLE NOT NULL DEFAULT '0' COMMENT '평가 - 이자(총합)',
  `revenue_eval` DOUBLE NOT NULL DEFAULT '0' COMMENT '평가 - 평가금액',
  `earn` DOUBLE NOT NULL DEFAULT '0' COMMENT '수익 - 수익금(현재)',
  `earn_rate` DOUBLE NOT NULL DEFAULT '0' COMMENT '수익 - 수익률(현재)',
  `earn_inc_proceeds` DOUBLE NOT NULL DEFAULT '0' COMMENT '수익(재투자포함) - 수익금(현재)',
  `earn_rate_inc_proceeds` DOUBLE NOT NULL DEFAULT '0' COMMENT '수익(재투자포함) - 수익률(현재)',
  `created_at` TIMESTAMP NOT NULL DEFAULT current_timestamp(),
  `updated_at` TIMESTAMP NULL DEFAULT NULL ON UPDATE current_timestamp(),
  PRIMARY KEY (`item_idx`, `unit_idx`) USING BTREE,
  INDEX `IDX_CREATED_AT` (`created_at`) USING BTREE,
  INDEX `IDX_ITEM` (`item_idx`) USING BTREE,
  INDEX `IDX_UNIT` (`unit_idx`) USING BTREE,
  CONSTRAINT `invest_summary_fk_1` FOREIGN KEY (`item_idx`) REFERENCES `invest_item` (`item_idx`) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT `invest_summary_fk_2` FOREIGN KEY (`unit_idx`) REFERENCES `invest_unit` (`unit_idx`) ON UPDATE CASCADE ON DELETE CASCADE
)
  COMMENT='재테크기록 - 전체 요약'
  COLLATE='utf8mb4_general_ci'
  ENGINE=InnoDB
  ROW_FORMAT=DYNAMIC
;
CREATE TABLE `invest_summary_date` (
  `summary_idx` INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `summary_type` ENUM('month','year') NOT NULL COMMENT '요약타입' COLLATE 'utf8mb4_general_ci',
  `summary_date` DATE NOT NULL COMMENT '요약일자(월)',
  `item_idx` INT(10) UNSIGNED NOT NULL COMMENT '상품 IDX',
  `unit_idx` INT(10) UNSIGNED NOT NULL COMMENT '단위 IDX',
  `inout_total` DOUBLE NOT NULL DEFAULT '0' COMMENT '유입/유출 - 총합',
  `inout_principal_prev` DOUBLE NOT NULL DEFAULT '0' COMMENT '유입/유출 - 원금(이전)',
  `inout_principal_current` DOUBLE NOT NULL DEFAULT '0' COMMENT '유입/유출 - 원금(이번)',
  `inout_principal_total` DOUBLE NOT NULL DEFAULT '0' COMMENT '유입/유출 - 원금(총합)',
  `inout_proceeds_prev` DOUBLE NOT NULL DEFAULT '0' COMMENT '유입/유출 - 수익재투자(이전)',
  `inout_proceeds_current` DOUBLE NOT NULL DEFAULT '0' COMMENT '유입/유출 - 수익재투자(이번)',
  `inout_proceeds_total` DOUBLE NOT NULL DEFAULT '0' COMMENT '유입/유출 - 수익재투자(총합)',
  `revenue_total` DOUBLE NOT NULL DEFAULT '0' COMMENT '평가 - 총합',
  `revenue_interest_prev` DOUBLE NOT NULL DEFAULT '0' COMMENT '평가 - 이자(이전)',
  `revenue_interest_current` DOUBLE NOT NULL DEFAULT '0' COMMENT '평가 - 이자(이번)',
  `revenue_interest_total` DOUBLE NOT NULL DEFAULT '0' COMMENT '평가 - 이자(총합)',
  `revenue_eval` DOUBLE NOT NULL DEFAULT '0' COMMENT '평가 - 평가금액(현재)',
  `revenue_eval_prev` DOUBLE NOT NULL DEFAULT '0' COMMENT '평가 - 평가금액(이전)',
  `earn` DOUBLE NOT NULL DEFAULT '0' COMMENT '수익 - 수익금(현재)',
  `earn_prev_diff` DOUBLE NOT NULL DEFAULT '0' COMMENT '수익 - 수익금(이전대비)',
  `earn_rate` DOUBLE NOT NULL DEFAULT '0' COMMENT '수익 - 수익률(현재)',
  `earn_rate_prev_diff` DOUBLE NOT NULL DEFAULT '0' COMMENT '수익 - 수익률(이전대비)',
  `earn_inc_proceeds` DOUBLE NOT NULL DEFAULT '0' COMMENT '수익(재투자포함) - 수익금(현재)',
  `earn_inc_proceeds_prev_diff` DOUBLE NOT NULL DEFAULT '0' COMMENT '수익(재투자포함) - 수익금(이전대비)',
  `earn_rate_inc_proceeds` DOUBLE NOT NULL DEFAULT '0' COMMENT '수익(재투자포함) - 수익률(현재)',
  `earn_rate_inc_proceeds_prev_diff` DOUBLE NOT NULL DEFAULT '0' COMMENT '수익(재투자포함) - 수익률(이전대비)',
  `created_at` TIMESTAMP NOT NULL DEFAULT current_timestamp(),
  `updated_at` TIMESTAMP NULL DEFAULT NULL ON UPDATE current_timestamp(),
  PRIMARY KEY (`summary_idx`) USING BTREE,
  INDEX `IDX_CREATED_AT` (`created_at`) USING BTREE,
  INDEX `IDX_ITEM` (`item_idx`) USING BTREE,
  INDEX `IDX_UNIT` (`unit_idx`) USING BTREE,
  INDEX `IDX_SUMMARY_TYPE` (`summary_type`, `summary_date`, `item_idx`, `unit_idx`) USING BTREE,
  CONSTRAINT `invest_summary_date_fk_1` FOREIGN KEY (`item_idx`) REFERENCES `invest_item` (`item_idx`) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT `invest_summary_date_fk_2` FOREIGN KEY (`unit_idx`) REFERENCES `invest_unit` (`unit_idx`) ON UPDATE CASCADE ON DELETE CASCADE
)
  COMMENT='재테크기록 - 기간 요약'
  COLLATE='utf8mb4_general_ci'
  ENGINE=InnoDB
  ROW_FORMAT=DYNAMIC
;
CREATE TABLE `invest_group_summary` (
  `group_idx` INT(10) UNSIGNED NOT NULL COMMENT '그룹 IDX',
  `inout_total` DOUBLE NOT NULL DEFAULT '0' COMMENT '유입/유출 - 총합',
  `inout_principal` DOUBLE NOT NULL DEFAULT '0' COMMENT '유입/유출 - 원금(총합)',
  `inout_proceeds` DOUBLE NOT NULL DEFAULT '0' COMMENT '유입/유출 - 수익재투자(총합)',
  `revenue_total` DOUBLE NOT NULL DEFAULT '0' COMMENT '평가 - 총합',
  `revenue_interest` DOUBLE NOT NULL DEFAULT '0' COMMENT '평가 - 이자(총합)',
  `revenue_eval` DOUBLE NOT NULL DEFAULT '0' COMMENT '평가 - 평가금액',
  `earn` DOUBLE NOT NULL DEFAULT '0' COMMENT '수익 - 수익금(현재)',
  `earn_rate` DOUBLE NOT NULL DEFAULT '0' COMMENT '수익 - 수익률(현재)',
  `earn_inc_proceeds` DOUBLE NOT NULL DEFAULT '0' COMMENT '수익(재투자포함) - 수익금(현재)',
  `earn_rate_inc_proceeds` DOUBLE NOT NULL DEFAULT '0' COMMENT '수익(재투자포함) - 수익률(현재)',
  `created_at` TIMESTAMP NOT NULL DEFAULT current_timestamp(),
  `updated_at` TIMESTAMP NULL DEFAULT NULL ON UPDATE current_timestamp(),
  PRIMARY KEY (`group_idx`) USING BTREE,
  INDEX `IDX_CREATED_AT` (`created_at`) USING BTREE,
  CONSTRAINT `invest_group_summary_fk_1` FOREIGN KEY (`group_idx`) REFERENCES `invest_group` (`group_idx`) ON UPDATE CASCADE ON DELETE CASCADE
)
  COMMENT='재테크 기록 - 상품 그룹 전체 요약'
  COLLATE='utf8mb4_general_ci'
  ENGINE=InnoDB
  ROW_FORMAT=DYNAMIC
;
CREATE TABLE `invest_group_summary_date` (
  `summary_idx` INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `summary_type` ENUM('month','year') NOT NULL COMMENT '요약타입' COLLATE 'utf8mb4_general_ci',
  `summary_date` DATE NOT NULL COMMENT '요약일자(월)',
  `group_idx` INT(10) UNSIGNED NOT NULL COMMENT '그룹 IDX',
  `inout_total` DOUBLE NOT NULL DEFAULT '0' COMMENT '유입/유출 - 총합',
  `inout_principal_prev` DOUBLE NOT NULL DEFAULT '0' COMMENT '유입/유출 - 원금(이전)',
  `inout_principal_current` DOUBLE NOT NULL DEFAULT '0' COMMENT '유입/유출 - 원금(이번)',
  `inout_principal_total` DOUBLE NOT NULL DEFAULT '0' COMMENT '유입/유출 - 원금(총합)',
  `inout_proceeds_prev` DOUBLE NOT NULL DEFAULT '0' COMMENT '유입/유출 - 수익재투자(이전)',
  `inout_proceeds_current` DOUBLE NOT NULL DEFAULT '0' COMMENT '유입/유출 - 수익재투자(이번)',
  `inout_proceeds_total` DOUBLE NOT NULL DEFAULT '0' COMMENT '유입/유출 - 수익재투자(총합)',
  `revenue_total` DOUBLE NOT NULL DEFAULT '0' COMMENT '평가 - 총합',
  `revenue_interest_prev` DOUBLE NOT NULL DEFAULT '0' COMMENT '평가 - 이자(이전)',
  `revenue_interest_current` DOUBLE NOT NULL DEFAULT '0' COMMENT '평가 - 이자(이번)',
  `revenue_interest_total` DOUBLE NOT NULL DEFAULT '0' COMMENT '평가 - 이자(총합)',
  `revenue_eval` DOUBLE NOT NULL DEFAULT '0' COMMENT '평가 - 평가금액(현재)',
  `revenue_eval_prev` DOUBLE NOT NULL DEFAULT '0' COMMENT '평가 - 평가금액(이전)',
  `earn` DOUBLE NOT NULL DEFAULT '0' COMMENT '수익 - 수익금(현재)',
  `earn_prev_diff` DOUBLE NOT NULL DEFAULT '0' COMMENT '수익 - 수익금(이전대비)',
  `earn_rate` DOUBLE NOT NULL DEFAULT '0' COMMENT '수익 - 수익률(현재)',
  `earn_rate_prev_diff` DOUBLE NOT NULL DEFAULT '0' COMMENT '수익 - 수익률(이전대비)',
  `earn_inc_proceeds` DOUBLE NOT NULL DEFAULT '0' COMMENT '수익(재투자포함) - 수익금(현재)',
  `earn_inc_proceeds_prev_diff` DOUBLE NOT NULL DEFAULT '0' COMMENT '수익(재투자포함) - 수익금(이전대비)',
  `earn_rate_inc_proceeds` DOUBLE NOT NULL DEFAULT '0' COMMENT '수익(재투자포함) - 수익률(현재)',
  `earn_rate_inc_proceeds_prev_diff` DOUBLE NOT NULL DEFAULT '0' COMMENT '수익(재투자포함) - 수익률(이전대비)',
  `created_at` TIMESTAMP NOT NULL DEFAULT current_timestamp(),
  `updated_at` TIMESTAMP NULL DEFAULT NULL ON UPDATE current_timestamp(),
  PRIMARY KEY (`summary_idx`) USING BTREE,
  INDEX `IDX_CREATED_AT` (`created_at`) USING BTREE,
  INDEX `IDX_SUMMARY_TYPE` (`summary_type`, `summary_date`, `group_idx`) USING BTREE,
  INDEX `IDX_GROUP` (`group_idx`) USING BTREE,
  CONSTRAINT `invest_group_summary_date_fk_1` FOREIGN KEY (`group_idx`) REFERENCES `invest_group` (`group_idx`) ON UPDATE CASCADE ON DELETE CASCADE
)
  COMMENT='재테크 기록 - 상품 그룹 기간 요약'
  COLLATE='utf8mb4_general_ci'
  ENGINE=InnoDB
  ROW_FORMAT=DYNAMIC
;

