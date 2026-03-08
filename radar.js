const symbols = [
"SPY","QQQ","EEM","TLT","HYG",
"GLD","SLV","USO","UUP","FXE"
];

const TOKEN = "8522391684:AAFhKj3jLdt9Gd3qL8yAwv8PLK-OclVnjZM";
const CHAT_ID = "7341786399";

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

const lastPrice = prices.at(-1);
const prevPrice = prices.at(-2);

const lastMA = ma240.at(-1);
const prevMA = ma240.at(-2);

let signal="NONE";

if(prevPrice && lastPrice && prevMA && lastMA){

// 向上突破
if(prevPrice <= prevMA && lastPrice > lastMA){
signal="BREAK_UP";
}

// 向下跌破
if(prevPrice >= prevMA && lastPrice < lastMA){
signal="BREAK_DOWN";
}

}

return {
symbol,
price:lastPrice,
ma240:lastMA,
signal
};

}

async function run(){

let results=[];

for(let s of symbols){

let r = await getData(s);

if(r.signal!=="NONE"){
results.push(r);
}

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

}

console.log(results);

}

run();
