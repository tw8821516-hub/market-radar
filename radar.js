const symbols = [
"SPY","QQQ","EEM","TLT","HYG",
"GLD","SLV","USO","UUP","FXE"
];

const TOKEN = "你的BOT_TOKEN";
const CHAT_ID = "你的CHAT_ID";

async function sendTelegram(message){

const url =
`https://api.telegram.org/bot${TOKEN}/sendMessage`;

await fetch(url,{
method:"POST",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify({
chat_id:CHAT_ID,
text:message
})
});

}

async function getData(symbol){

const url =
`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1h&range=60d`;

const res = await fetch(url);
const data = await res.json();

let prices =
data.chart.result[0].indicators.quote[0].close;

prices = prices.filter(p => p);

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

const last = ma240.at(-1);
const prev = ma240.at(-2);

let signal="NONE";

if(prev && last){

if(prev<=last && last>prev){
signal="MA240_UP";
}

if(prev>=last && last<prev){
signal="MA240_DOWN";
}

}

return {
symbol,
ma240:last,
signal
};

}

async function run(){

let results=[];

for(let s of symbols){

let r=await getData(s);

if(r.signal!=="NONE"){
results.push(r);
}

}

if(results.length>0){

let message="📡 Market Radar\n\n";

for(let r of results){

if(r.signal==="MA240_UP"){
message+=`${r.symbol} ▲ MA240 UP\n`;
}

if(r.signal==="MA240_DOWN"){
message+=`${r.symbol} ▼ MA240 DOWN\n`;
}

}

await sendTelegram(message);

}

console.log(results);

}

run();
