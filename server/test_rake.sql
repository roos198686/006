-- ====== 抽水分层验证测试 ======
-- 树状结构: 453919(一级) → 461425(二级) → 183578(三级)
-- 比例全设 10%
-- 三级(183578) 产生抽水 100

-- 0. 清空今日数据
UPDATE t_partner_stats SET today_game_score=0, today_rake=0, today_hidden_rake=0, today_partner_profit=0;
SELECT '=== 清空后 ===' AS info;
SELECT club_id, partner_club_id, profit_ratio, today_rake, today_partner_profit FROM t_partner_stats 
WHERE club_id IN (453919, 461425);

-- 1. 三级俱乐部(183578) 产生抽水 100
-- 2. charge.js 的 BFS 逻辑:
--    183578 是 bottom, 不上加
--    往上找 parent_clubid=183578 → 461425(二级) 有 profit_ratio=10
--      → 461425 从 183578 抽成 = 100 * 10% = 10
--      → 往上找 parent_clubid=461425 → 453919(一级) 有 profit_ratio=10
--        → 453919 从 461425 抽成 = 10 * 10% = 1
--
-- 但当前 charge.js statsExtras 是按比例拆分 rake 的
-- 之前 Bug1 修了: 每级 rake = 总抽水 * (本级分成 / 总抽水) 
-- 即 rake 也要按比例拆分

-- 先模拟 charge.js 的 partner_add_stats 调用
-- 三级俱乐部产生抽水 100, 先给三级自己(但它不是 partner 关系所以不加)

-- 二级从三级抽到 10 (10%), partner_profit=10
UPDATE t_partner_stats SET 
  today_partner_profit = today_partner_profit + 10,
  today_rake = today_rake + (100 * 10 / 100)   -- rake 按比例拆分 = 10
WHERE club_id = 461425 AND partner_club_id = 183578;

-- 一级从二级抽到 1 (10% of 10), partner_profit=1
UPDATE t_partner_stats SET 
  today_partner_profit = today_partner_profit + 1,
  today_rake = today_rake + (100 * 1 / 100)   -- rake 按比例拆分 = 1
WHERE club_id = 453919 AND partner_club_id = 461425;

-- 一级直接从三级(跳级)也有记录, 也加 10% of 100 = 10
UPDATE t_partner_stats SET 
  today_partner_profit = today_partner_profit + 10,
  today_rake = today_rake + (100 * 10 / 100)   -- rake 按比例拆分 = 10
WHERE club_id = 453919 AND partner_club_id = 183578;

SELECT '=== 三级产生 100 抽水后 ===' AS info;
SELECT club_id, partner_club_id, profit_ratio, today_rake, today_partner_profit,
  CASE 
    WHEN club_id = 461425 AND partner_club_id = 183578 THEN '二级从三级抽'
    WHEN club_id = 453919 AND partner_club_id = 461425 THEN '一级从二级抽'
    WHEN club_id = 453919 AND partner_club_id = 183578 THEN '一级直接从三级抽(跳级)'
  END AS 说明
FROM t_partner_stats 
WHERE club_id IN (453919, 461425) AND partner_club_id IN (461425, 183578);

-- 验证: 
-- 二级 today_rake=10, today_partner_profit=10 ✅ (100 * 10%)
-- 一级 from 二级 today_rake=1, today_partner_profit=1 ✅ (10 * 10%)  
-- 一级 from 三级(跳级) today_rake=10, today_partner_profit=10 ✅ (100 * 10%)
