const symbols = [
"SPY","QQQ","EEM","TLT","HYG",
"GLD","SLV","USO","UUP","FXE"
];

// 🔥 模式切換（這行最重要）
const MODE = "DEBUG"; // DEBUG / LIVE

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
return null;
}

const lastPrice = prices.at(-1);
const prevPrice = prices.at(-2);

const changePercent = ((lastPrice - prevPrice) / prevPrice) * 100;

let signal = "NONE";

if(changePercent >= 2){
signal = "UP";
}

if(changePercent <= -2){
signal = "DOWN";
}

// Debug log
console.log(symbol,{
lastPrice,
prevPrice,
changePercent: changePercent.toFixed(2)+"%",
signal
});

return {
symbol,
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

if(r){
results.push(r);
}

await sleep(1000);

}

let message = "📡 Market Radar\n\n";

// 🔥 DEBUG模式：全部顯示
if(MODE === "DEBUG"){

for(let r of results){

message += `${r.symbol} ${r.changePercent.toFixed(2)}%\n`;

}

message += "\n🧪 DEBUG MODE";

await sendTelegram(message);

}

// 🔥 LIVE模式：只發訊號
if(MODE === "LIVE"){

let signals = results.filter(r => r.signal !== "NONE");

if(signals.length > 0){

for(let r of signals){

if(r.signal === "UP"){
message += `${r.symbol} 🚀 +${r.changePercent.toFixed(2)}%\n`;
}

if(r.signal === "DOWN"){
message += `${r.symbol} 🔻 ${r.changePercent.toFixed(2)}%\n`;
}

}

await sendTelegram(message);

}else{

console.log("沒有達到條件");

}

}

console.log("完成");

}

run();
