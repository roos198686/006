// 抽水分成验证脚本
// 模拟 807150(二级) 俱乐部产生 100 抽水, 80 暗水
// 链: 385127(顶级,ratio=80) → 552407(一级,ratio=80) → 807150(二级,产生收入)
// 预期:
//   总金额 = 100+80 = 180
//   顶级从一级抽: 180*(1-80%) = 36 → 但注意一级自己也是从二级拿的
//   正确算法(charge.js自顶向下):
//     rest=180, A对B ratio=80: keep=180*80/100=144, A.dec=180-144=36, rest=144
//     B对C ratio=80: keep=144*80/100=115.2, B.dec=144-115.2=28.8, rest=115.2
//     C(末级): C.dec=115.2
//   partner_profit: A=36, B=28.8
//   rake 按比例拆分(按 dec/amount):
//     A 抽 rake: 100 * 36/180 = 20
//     B 抽 rake: 100 * 28.8/180 = 16
//   hidden_rake 同理:
//     A: 80 * 36/180 = 16
//     B: 80 * 28.8/180 = 12.8

var db = require('./utils/db');
var configs = require('./configs_win.js');
db.init(configs.mysql());

// 手工实现 splitPartnerShare 的核心逻辑(charge.js 是内部函数, 不可 require)
function round2(v){ return Math.round(v * 100) / 100; }

// 取俱乐部上级链 (charge.js loadClubChain)
function loadClubChain(clubId, done){
    var chain = [{id: clubId, ownerId: 0}];
    function walk(cid){
        db.query('SELECT id,parent_clubid,owner_userid FROM t_clubs WHERE id = ' + cid, function(err, rows){
            if(err || !rows || rows.length === 0){ done(chain); return; }
            var row = rows[0];
            chain[chain.length - 1].ownerId = row.owner_userid;
            if(row.parent_clubid > 0){
                chain.unshift({id: row.parent_clubid, ownerId: 0});
                walk(row.parent_clubid);
            } else {
                done(chain);
            }
        });
    }
    walk(clubId);
}

var amount = 180;          // 总抽水+暗水
var rake = 100;            // 抽水
var hiddenRake = 80;       // 暗水
var testClub = 807150;     // 产生收入的俱乐部

console.log('========================================');
console.log('测试: 俱乐部 ' + testClub + ' 产生抽水');
console.log('rake=' + rake + ' hidden_rake=' + hiddenRake + ' total=' + amount);
console.log('========================================');

loadClubChain(testClub, function(chain){
    console.log('俱乐部链: ' + chain.map(function(c){ return c.id; }).join(' → '));

    // 1. 取比例
    var conds = [];
    for(var i = 0; i < chain.length - 1; i++){
        conds.push('(club_id = ' + chain[i].id + ' AND partner_club_id = ' + chain[i + 1].id + ')');
    }
    db.query('SELECT club_id, partner_club_id, profit_ratio FROM t_partner_stats WHERE ' + conds.join(' OR '), function(err, rows){
        var ratioMap = {};
        (rows || []).forEach(function(r){
            ratioMap[Number(r.club_id) + '_' + Number(r.partner_club_id)] = Number(r.profit_ratio) || 0;
        });
        chain.forEach(function(c, idx){
            if(idx < chain.length - 1){
                var r = ratioMap[c.id + '_' + chain[idx+1].id];
                console.log('  ' + c.id + ' → ' + chain[idx+1].id + ' ratio=' + r + '%');
            }
        });

        // 2. 自顶向下算 shares
        var shares = [];
        var rest = amount;
        for(var i = 0; i < chain.length; i++){
            if(i === chain.length - 1){
                shares.push({clubId: chain[i].id, ownerId: chain[i].ownerId, dec: round2(rest)});
                break;
            }
            var ratio = ratioMap[chain[i].id + '_' + chain[i + 1].id];
            if(!(ratio > 0) || ratio > 100){ ratio = 100; }
            var keep = rest * ratio / 100;
            shares.push({
                clubId: chain[i].id, ownerId: chain[i].ownerId, dec: round2(rest - keep),
                childId: chain[i + 1].id
            });
            rest = keep;
        }

        console.log('\n预期分成(按比例):');
        console.log('  顶级(' + shares[0].clubId + ') partner_profit=' + shares[0].dec);
        if(shares.length > 2) console.log('  一级(' + shares[1].clubId + ') partner_profit=' + shares[1].dec);
        console.log('  末级(' + shares[shares.length-1].clubId + ') 自留=' + shares[shares.length-1].dec);

        // 3. 按 dec/amount 拆分 rake/hidden_rake
        console.log('\n预期 rake 拆分(按 dec/total=' + amount + '):');
        for(var j = 0; j < shares.length - 1; j++){
            var s = shares[j];
            var shareRatio = amount > 0 ? s.dec / amount : 0;
            var expectRake = round2(rake * shareRatio);
            var expectHidden = round2(hiddenRake * shareRatio);
            console.log('  顶级(' + s.clubId + '→' + s.childId + ') partner_profit=' + s.dec + ' rake=' + expectRake + ' hidden_rake=' + expectHidden);

            // 4. 真实调用 partner_add_stats 写入
            var stats = {
                partner_profit: s.dec,
                rake: expectRake,
                hidden_rake: expectHidden
            };
            db.partner_add_stats(s.clubId, s.childId, stats, function(){
                console.log('    ✓ 已写入 t_partner_stats(' + s.clubId + ',' + s.childId + ')');
            });
        }

        // 5. 等 DB 写完后查询验证
        setTimeout(function(){
            console.log('\n========================================');
            console.log('DB 验证结果:');
            console.log('========================================');
            db.query('SELECT club_id,partner_club_id,today_rake,today_hidden_rake,today_partner_profit FROM t_partner_stats WHERE club_id IN (385127,552407) AND partner_club_id IN (552407,807150) ORDER BY club_id', function(err, verify){
                verify.forEach(function(r){
                    var ok = r.today_partner_profit > 0 ? '✓' : '✗';
                    console.log(ok + ' ' + r.clubId + '→' + r.partner_club_id + ' rake=' + r.today_rake + ' hidden_rake=' + r.today_hidden_rake + ' partner_profit=' + r.today_partner_profit);
                });

                // 最终校验: 各层 rake 之和 = 原始 rake?
                var totalRake = verify.reduce(function(a,b){ return a + Number(b.today_rake); }, 0);
                var totalHidden = verify.reduce(function(a,b){ return a + Number(b.today_hidden_rake); }, 0);
                var totalProfit = verify.reduce(function(a,b){ return a + Number(b.today_partner_profit); }, 0);
                console.log('\n合计: rake=' + totalRake + '(预期≤' + rake + ') hidden=' + totalHidden + '(预期≤' + hiddenRake + ') profit=' + totalProfit + '(预期≤' + amount + ')');
                console.log('备注: rake 按每层抽到的比例拆分, 各层之和 ≤ 原始 rake');
                process.exit(0);
            });
        }, 500);
    });
});
