-- MySQL dump 10.13  Distrib 8.0.18, for Win64 (x86_64)
--
-- Host: localhost    Database: db_babykylin
-- ------------------------------------------------------
-- Server version	8.0.18

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `t_game_config`
--

DROP TABLE IF EXISTS `t_game_config`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `t_game_config` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `type` varchar(16) NOT NULL COMMENT '玩法类型 zp/zj',
  `name` varchar(32) NOT NULL COMMENT '玩法名称',
  `difen_options` varchar(64) NOT NULL DEFAULT '[1,2,5]' COMMENT '底分选项JSON数组',
  `jushu_options` varchar(64) NOT NULL DEFAULT '[4,8]' COMMENT '局数选项JSON数组',
  `cost_options` varchar(64) NOT NULL DEFAULT '[2,3]' COMMENT '对应局数的房卡消耗JSON数组',
  `chips_options` varchar(64) NOT NULL DEFAULT '[1000,2000,5000]' COMMENT '德州扑克起始筹码选项JSON数组',
  `max_players` int(11) NOT NULL DEFAULT '2' COMMENT '最大玩家数',
  `max_tai` int(11) NOT NULL DEFAULT '10' COMMENT '封顶台数',
  `enabled` tinyint(1) NOT NULL DEFAULT '1' COMMENT '是否启用',
  `sort` int(11) NOT NULL DEFAULT '0' COMMENT '排序',
  `caishen_cpg` tinyint(1) NOT NULL DEFAULT '1',
  `cai_chi` decimal(20,8) NOT NULL DEFAULT '1.00000000',
  `cai_peng` decimal(20,8) NOT NULL DEFAULT '1.00000000',
  `cai_gang` decimal(20,8) NOT NULL DEFAULT '1.00000000',
  `dianpao_hu` decimal(20,8) NOT NULL DEFAULT '1.00000000',
  `tai_rules` text COMMENT '台数规则JSON(后台可调)',
  `auto_dissolve_seconds` int(11) NOT NULL DEFAULT '300',
  `remove_tiao` decimal(20,8) NOT NULL DEFAULT '0.00000000',
  `laozhuang_multiplier` int(11) NOT NULL DEFAULT '2',
  `cai7` decimal(20,8) NOT NULL DEFAULT '0.00000000',
  `tianhu_di` tinyint(4) DEFAULT '1',
  `cai_diao` tinyint(4) DEFAULT '1',
  `bao_tai_score` int(11) NOT NULL DEFAULT '1' COMMENT '每台包台分数(包财神玩法)',
  `hu_tai_rate` int(11) NOT NULL DEFAULT '2',
  `bao_tai_rate` int(11) NOT NULL DEFAULT '4',
  `hu_base_score` int(11) DEFAULT '1',
  `bao_base_score` int(11) DEFAULT '1',
  `gp_four_two` tinyint(1) NOT NULL DEFAULT '1',
  `gp_four_three` tinyint(1) NOT NULL DEFAULT '1',
  `gp_three_one` tinyint(1) NOT NULL DEFAULT '1',
  `gp_last_three_one` tinyint(1) NOT NULL DEFAULT '0',
  `gp_last_four_two_three` tinyint(1) NOT NULL DEFAULT '0',
  `gp_bomb` tinyint(1) NOT NULL DEFAULT '1',
  `gp_bomb_four` tinyint(1) NOT NULL DEFAULT '1',
  `gp_card_history` tinyint(1) DEFAULT '0',
  `gp_straight_a2` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `type` (`type`)
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `t_game_config`
--

LOCK TABLES `t_game_config` WRITE;
/*!40000 ALTER TABLE `t_game_config` DISABLE KEYS */;
INSERT INTO `t_game_config` (`id`, `type`, `name`, `difen_options`, `jushu_options`, `cost_options`, `chips_options`, `max_players`, `max_tai`, `enabled`, `sort`, `caishen_cpg`, `cai_chi`, `cai_peng`, `cai_gang`, `dianpao_hu`, `tai_rules`, `auto_dissolve_seconds`, `remove_tiao`, `laozhuang_multiplier`, `cai7`, `tianhu_di`, `cai_diao`, `bao_tai_score`, `hu_tai_rate`, `bao_tai_rate`, `hu_base_score`, `bao_base_score`, `gp_four_two`, `gp_four_three`, `gp_three_one`, `gp_last_three_one`, `gp_last_four_two_three`, `gp_bomb`, `gp_bomb_four`, `gp_card_history`, `gp_straight_a2`) VALUES (2,'zj','翻财神','[1,2,5]','[4,8,16]','[4,8,16]','[1000,2000,5000]',2,7,1,2,1,1.00000000,1.00000000,1.00000000,1.00000000,'{\"min_tai\":1,\"dong_ke\":2,\"zfb_ke\":1,\"ping_hu\":1,\"duidui_hu\":1,\"hun_yise\":1,\"qing_yise\":3,\"gang_kai\":1,\"qiang_gang\":1,\"wu_cai\":1,\"san_caishen_fengding\":1,\"chupai_timeout\":60}',600,1.00000000,2,1.00000000,1,0,1,2,4,1,1,1,1,1,0,0,1,1,0,1),(4,'zj_bt','包麻将','[1,2,5]','[4,8,16]','[4,8,16]','[1000,2000,5000]',2,7,1,3,1,1.00000000,1.00000000,1.00000000,1.00000000,'{\"min_tai\":1,\"dong_ke\":2,\"zfb_ke\":1,\"ping_hu\":1,\"duidui_hu\":1,\"hun_yise\":1,\"qing_yise\":3,\"gang_kai\":1,\"qiang_gang\":1,\"wu_cai\":1,\"chupai_timeout\":60}',300,1.00000000,2,0.00000000,1,0,2,2,4,1,1,1,1,1,0,0,1,1,0,1),(5,'dzpk','德州扑克','[5,10,20]','[5,10,20]','[2,3,4]','[1000,2000,5000]',9,10,0,4,1,1.00000000,1.00000000,1.00000000,1.00000000,'{\"min_tai\":1,\"dong_ke\":2,\"zfb_ke\":1,\"ping_hu\":1,\"duidui_hu\":1,\"hun_yise\":1,\"qing_yise\":3,\"gang_kai\":1,\"qiang_gang\":1,\"wu_cai\":1,\"san_caishen_fengding\":1,\"chupai_timeout\":15}',300,0.00000000,2,0.00000000,1,1,1,2,4,1,1,1,1,1,0,0,1,1,0,1),(6,'xlch','血战麻将','[1,2,5]','[4,8]','[2,3]','[1000,2000,5000]',4,10,0,0,1,1.00000000,1.00000000,1.00000000,1.00000000,NULL,300,0.00000000,2,0.00000000,1,1,1,2,4,1,1,1,1,1,0,0,1,1,0,1),(7,'zj4','翻财神(4人)','[1,2,5]','[4,8]','[2,3]','[1000,2000,5000]',4,10,0,2,1,1.00000000,1.00000000,1.00000000,1.00000000,'{\"min_tai\":1,\"dong_ke\":2,\"zfb_ke\":1,\"ping_hu\":1,\"duidui_hu\":1,\"hun_yise\":1,\"qing_yise\":3,\"gang_kai\":1,\"qiang_gang\":1,\"wu_cai\":1,\"san_caishen_fengding\":0,\"chupai_timeout\":15}',300,0.00000000,2,0.00000000,1,1,1,2,4,1,1,1,1,1,0,0,1,1,0,1),(9,'zj4_bt','包麻将(4人)','[1,2,5]','[4,8]','[2,3]','[1000,2000,5000]',4,7,0,3,1,1.00000000,1.00000000,1.00000000,1.00000000,'{\"min_tai\":1,\"dong_ke\":2,\"zfb_ke\":1,\"ping_hu\":1,\"duidui_hu\":1,\"hun_yise\":1,\"qing_yise\":3,\"gang_kai\":1,\"qiang_gang\":1,\"wu_cai\":1,\"san_caishen_fengding\":0,\"chupai_timeout\":15}',300,0.00000000,2,0.00000000,1,1,1,2,4,1,1,1,1,1,0,0,1,1,0,1),(10,'zp','漳浦麻将(2人)','[1,2,5]','[4,8]','[2,3]','[1000,2000,5000]',2,10,0,5,1,1.00000000,1.00000000,1.00000000,1.00000000,'{\"hua_tai\":1,\"jin_tai\":1,\"ming_gang\":1,\"an_gang\":2,\"san_jin_dao\":2,\"qiang_jin\":2,\"qi_dui\":3,\"hun_yise\":1,\"qing_yise\":3,\"gang_kai\":1,\"qiang_gang\":1,\"ping_hu\":0,\"you_jin_multi\":2,\"you_jin_max\":3,\"fenbing\":0,\"chupai_timeout\":15}',300,0.00000000,2,0.00000000,1,1,1,2,4,1,1,1,1,1,0,0,1,1,0,1),(11,'zp4','漳浦麻将(4人)','[1,2,5]','[4,8]','[2,3]','[1000,2000,5000]',4,10,0,6,1,1.00000000,1.00000000,1.00000000,1.00000000,'{\"hua_tai\":1,\"jin_tai\":1,\"ming_gang\":1,\"an_gang\":2,\"san_jin_dao\":2,\"qiang_jin\":2,\"qi_dui\":3,\"hun_yise\":1,\"qing_yise\":3,\"gang_kai\":1,\"qiang_gang\":1,\"ping_hu\":0,\"you_jin_multi\":2,\"you_jin_max\":3,\"fenbing\":0,\"chupai_timeout\":15}',300,0.00000000,2,0.00000000,1,1,1,2,4,1,1,1,1,1,0,0,1,1,0,1),(12,'wujin','漳浦无金麻将','[1,2,5]','[4,8]','[2,3]','[1000,2000,5000]',4,10,0,7,0,1.00000000,1.00000000,1.00000000,1.00000000,'{\"ping_hu\":1,\"zi_mo\":1,\"men_qing\":1,\"peng_peng\":2,\"cou_yise\":2,\"qing_yise\":4,\"qi_dui\":3,\"da_sanyuan\":8,\"da_sixi\":8,\"ming_gang\":1,\"an_gang\":2,\"gang_kai\":1,\"qiang_gang\":1,\"hai_di\":1,\"tian_hu\":8,\"di_hu\":8,\"can_chi\":1,\"yi_pao_duo_xiang\":1,\"dian_pao_bao\":0,\"chupai_timeout\":15}',300,0.00000000,2,0.00000000,1,1,1,2,4,1,1,1,1,1,0,0,1,1,0,1),(13,'zj_lao','诸暨赖倒胡','[1,2,5]','[4,8,16]','[4,8,16]','[1000,2000,5000]',2,7,1,3,1,1.00000000,1.00000000,1.00000000,1.00000000,'{\"min_tai\":1,\"dong_ke\":2,\"zfb_ke\":1,\"ping_hu\":1,\"duidui_hu\":1,\"hun_yise\":1,\"qing_yise\":3,\"gang_kai\":1,\"qiang_gang\":1,\"wu_cai\":1,\"chupai_timeout\":60}',300,1.00000000,2,1.00000000,1,1,1,2,4,1,1,1,1,1,0,0,1,1,0,1),(14,'zj_zx','自选麻将(2人)','[1,2,5]','[4,8,16]','[4,8,16]','[1000,2000,5000]',2,7,1,7,0,0.00000000,0.00000000,0.00000000,1.00000000,'{\"min_tai\":3,\"dong_ke\":2,\"zfb_ke\":1,\"ping_hu\":1,\"duidui_hu\":1,\"hun_yise\":1,\"qing_yise\":3,\"gang_kai\":1,\"qiang_gang\":1,\"wu_cai\":7,\"chupai_timeout\":60}',600,1.00000000,2,0.00000000,1,0,1,2,4,1,1,1,1,1,0,0,1,1,0,1),(15,'zj4_zx','自选麻将(4人)','[1,2,5]','[4,8]','[2,3]','[1000,2000,5000]',4,7,0,8,0,0.00000000,0.00000000,0.00000000,1.00000000,'{\"wu_cai\":1,\"zfb_ke\":1,\"dong_ke\":2,\"min_tai\":3,\"ping_hu\":1,\"gang_kai\":1,\"hun_yise\":1,\"duidui_hu\":1,\"qing_yise\":3,\"qiang_gang\":1,\"chupai_timeout\":60}',300,0.00000000,2,0.00000000,1,0,1,2,4,1,1,1,1,1,0,0,1,1,0,1),(17,'guanpai3','关牌(3人)','[1,2,5]','[4,8]','[2,3]','[1000,2000,5000]',3,10,0,10,1,1.00000000,1.00000000,1.00000000,1.00000000,'{\"min_tai\":1,\"dong_ke\":2,\"zfb_ke\":1,\"ping_hu\":1,\"duidui_hu\":1,\"hun_yise\":1,\"qing_yise\":3,\"gang_kai\":1,\"qiang_gang\":1,\"wu_cai\":1,\"san_caishen_fengding\":1,\"chupai_timeout\":15}',300,0.00000000,2,0.00000000,1,1,1,2,4,1,1,1,1,1,0,0,1,1,0,1),(20,'guanpai2','关牌(2人)','[1,2,5]','[4,8,16]','[4,7,12]','[1000,2000,5000]',2,10,1,9,1,1.00000000,1.00000000,1.00000000,1.00000000,'{\"min_tai\":1,\"dong_ke\":2,\"zfb_ke\":1,\"ping_hu\":1,\"duidui_hu\":1,\"hun_yise\":1,\"qing_yise\":3,\"gang_kai\":1,\"qiang_gang\":1,\"wu_cai\":1,\"chupai_timeout\":60}',300,0.00000000,2,0.00000000,1,1,1,2,4,1,1,1,1,1,1,1,1,1,1,0);
/*!40000 ALTER TABLE `t_game_config` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-10-30  0:59:50
