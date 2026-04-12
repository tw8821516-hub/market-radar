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

// 過濾 null
prices = prices.filter(p => p !== null);

// 至少要2筆資料
if(prices.length < 2){
return null;
}

const lastPrice = prices.at(-1);
const prevPrice = prices.at(-2);

// 計算漲跌幅
const changePercent = ((lastPrice - prevPrice) / prevPrice) * 100;

let signal = "NONE";

if(changePercent >= 2){
signal = "UP";
}

if(changePercent <= -2){
signal = "DOWN";
}

// Debug（你現在會看到）
console.log(symbol,{
lastPrice,
prevPrice,
changePercent: changePercent.toFixed(2)+"%",
signal
});

return {
symbol,
lastPrice,
prevPrice,
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

if(r && r.signal !== "NONE"){
results.push(r);
}

await sleep(1000);

}

if(results.length > 0){

let message="📡 Market Radar (±2%)\n\n";

for(let r of results){

if(r.signal==="UP"){
message+=`${r.symbol} 🚀 +${r.changePercent.toFixed(2)}%\n`;
}

if(r.signal==="DOWN"){
message+=`${r.symbol} 🔻 ${r.changePercent.toFixed(2)}%\n`;
}

}

await sendTelegram(message);

}else{

console.log("沒有達到 ±2%");

}

console.log("全部結果:",results);

}

run();
