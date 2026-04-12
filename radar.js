const symbols = [
"SPY","QQQ","EEM","TLT","HYG",
"GLD","SLV","USO","UUP","FXE"
];

// GitHub Secrets
const TOKEN = process.env.TELEGRAM_TOKEN;
const CHAT_ID = process.env.CHAT_ID;

async function sendTelegram(msg){

const url = `https://api.telegram.org/bot${TOKEN}/sendMessage`;

await fetch(url,{
method:"POST",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify({
chat_id:CHAT_ID,
text:msg
})
});

}

// 延遲工具
function sleep(ms){
return new Promise(resolve => setTimeout(resolve,ms));
}

async function getData(symbol){

try{

const url =
`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1h&range=5d`;

const res = await fetch(url);

if(!res.ok){
console.log(symbol,"API ERROR",res.status);
return null;
}

const data = await res.json();

let prices =
data.chart.result?.[0]?.indicators?.quote?.[0]?.close || [];

prices = prices.filter(p => p !== null);

if(prices.length < 2){
console.log(symbol,"資料不足");
return null;
}

const lastPrice = prices.at(-1);
const prevPrice = prices.at(-2);

// 漲跌幅計算
const changePercent = ((lastPrice - prevPrice) / prevPrice) * 100;

let signal = "NONE";

if(changePercent >= 2){
signal = "UP";
}

if(changePercent <= -2){
signal = "DOWN";
}

// Debug（一定會印）
console.log(symbol,{
lastPrice,
prevPrice,
changePercent: changePercent.toFixed(2) + "%",
signal
});

return {
symbol,
price:lastPrice,
changePercent,
signal
};

}catch(e){

console.log(symbol,"ERROR",e.message);
return null;

}

}

async function run(){

let results=[];

for(let s of symbols){

let r = await getData(s);

// 👉 改這裡：全部保留（方便 debug）
if(r){
results.push(r);
}

await sleep(1000);

}

// 👉 篩選有訊號的
let signals = results.filter(r => r.signal !== "NONE");

if(signals.length>0){

let message="📡 Market Radar（2%異動）\n\n";

for(let r of signals){

if(r.signal==="UP"){
message+=`${r.symbol} 🚀 +${r.changePercent.toFixed(2)}%\n`;
}

if(r.signal==="DOWN"){
message+=`${r.symbol} 🔻 ${r.changePercent.toFixed(2)}%\n`;
}

}

await sendTelegram(message);

}else{

console.log("沒有達到2%異動");

}

console.log("全部結果:",results);

}

run();
