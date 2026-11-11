const fs = require('fs');
const txt = fs.readFileSync('d:/baobao_game/server/logs/crash.log', 'utf8');
const lines = txt.trim().split('\n');
console.log(lines.slice(-40).join('\n'));
