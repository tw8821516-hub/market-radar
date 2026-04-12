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
`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1h&range=60d`;

const res = await fetch(url);

// API錯誤處理
if(!res.ok){
console.log(symbol,"API ERROR",res.status);
return null;
}

const data = await res.json();

// ✅ 防呆（避免 crash）
let prices =
data.chart.result?.[0]?.indicators?.quote?.[0]?.close || [];

// ✅ 正確過濾 null
prices = prices.filter(p => p !== null);

// ✅ 資料不足直接跳過
if(prices.length < 250){
console.log(symbol,"資料不足");
return null;
}

function MA(data,period){

let result=[];

for(let i=0;i<data.length;i++){

if(i<period-1){
result.push(null);
}else{

let slice=data.slice(i-period+1,i+1);
let avg=slice.reduce((a,b)=>a+b)/period;

result.push(avg);

}

}

return result;

}

const ma240 = MA(prices,240);

const lastPrice = prices.at(-1);
const prevPrice = prices.at(-2);

const lastMA = ma240.at(-1);
const prevMA = ma240.at(-2);

// ✅ 修正 bug（不能用 && 判斷）
if(
lastPrice === null ||
prevPrice === null ||
lastMA === null ||
prevMA === null
){
return null;
}

let signal="NONE";

if(prevPrice <= prevMA && lastPrice > lastMA){
signal="BREAK_UP";
}

if(prevPrice >= prevMA && lastPrice < lastMA){
signal="BREAK_DOWN";
}

// ✅ Debug（讓你看得到）
console.log(symbol,{
lastPrice,
prevPrice,
lastMA,
prevMA,
signal
});

return {
symbol,
price:lastPrice,
ma240:lastMA,
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

// ✅ 防止 null 爆錯
if(r && r.signal!=="NONE"){
results.push(r);
}

// 每次請求間隔1秒
await sleep(1000);

}

if(results.length>0){

let message="📡 Market Radar\n\n";

for(let r of results){

if(r.signal==="BREAK_UP"){
message+=`${r.symbol} ▲ Break MA240\n`;
}

if(r.signal==="BREAK_DOWN"){
message+=`${r.symbol} ▼ Break MA240\n`;
}

}

await sendTelegram(message);

}else{

console.log("沒有觸發訊號");

}

console.log("結果:",results);

}

run();
