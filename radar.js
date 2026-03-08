const TOKEN = "7341786399";
const CHAT_ID = "8522391684:AAFhKj3jLdt9Gd3qL8yAwv8PLK-OclVnjZM";

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
