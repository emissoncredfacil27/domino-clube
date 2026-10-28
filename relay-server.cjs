'use strict';
// Transporte HTTPS: não usa WebRTC, portas especiais nem conexão direta entre celulares.
// A lógica e as mãos permanecem no jogo; o servidor entrega cada mensagem só ao destinatário.
const http = require('node:http');
const crypto = require('node:crypto');
const MAX_BODY = 256 * 1024, MAX_QUEUE = 120;
const peers = new Map(), sessions = new Map(), channels = new Map();
const ALLOWED_ORIGIN = process.env.GAME_ORIGIN || 'https://emissoncredfacil27.github.io';
const hash = key => crypto.createHash('sha256').update(key).digest('hex').slice(0,24);
const token = () => crypto.randomBytes(24).toString('hex');
function reply(res, status, body) { if (res.writableEnded) return;res.writeHead(status, {'Content-Type':'application/json','Cache-Control':'no-store','Access-Control-Allow-Origin':ALLOWED_ORIGIN,'Vary':'Origin'});res.end(JSON.stringify(body)); }
function flush(p) { if (p.poll && p.queue.length) {const res=p.poll;p.poll=null;clearTimeout(p.pollTimer);reply(res,200,{events:p.queue.splice(0)});} }
function push(p,event) { if(!p||p.closed)return;if(p.queue.length>=MAX_QUEUE){drop(p);return;}p.queue.push(event);flush(p); }
function closeChannel(id) { const ch=channels.get(id);if(!ch)return;channels.delete(id);for(const p of [ch.a,ch.b]){p.channels.delete(id);push(p,{kind:'close',channel:id});} }
function drop(p) { if(p.closed)return;p.closed=true;for(const id of [...p.channels])closeChannel(id);if(peers.get(p.id)===p)peers.delete(p.id);sessions.delete(p.session);clearTimeout(p.pollTimer);if(p.poll)reply(p.poll,410,{error:'session-expired'});p.poll=null; }
async function body(req) {let data='',size=0;for await(const chunk of req){size+=chunk.length;if(size>MAX_BODY)throw Error('payload-too-large');data+=chunk;}return JSON.parse(data||'{}');}
const server=http.createServer(async(req,res)=>{
 const origin=req.headers.origin;
 if(origin&&origin!==ALLOWED_ORIGIN){reply(res,403,{error:'origin'});return;}
 if(req.method==='OPTIONS'){res.writeHead(204,{'Access-Control-Allow-Origin':ALLOWED_ORIGIN,'Access-Control-Allow-Methods':'POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type, Authorization','Access-Control-Max-Age':'600','Vary':'Origin'});res.end();return;}
 if(req.url==='/health'&&req.method==='GET'){reply(res,200,{ok:true,transport:'https-relay-v1'});return;}
 if(req.method!=='POST'){reply(res,404,{error:'not-found'});return;}
 try{
  const m=await body(req);
  if(req.url==='/relay/register'){
   if(!/^domino-(?:[a-f0-9]{24}|guest-[a-f0-9]{32})$/.test(m.id||'')){reply(res,400,{error:'invalid-id'});return;}
   const owner=m.id.startsWith('domino-guest-')?false:true;
   if(owner&&(!/^[a-f0-9]{64}$/.test(m.key||'')||m.id!=='domino-'+hash(m.key))){reply(res,403,{error:'owner-key-required'});return;}
   const previous=peers.get(m.id);
   if(previous&&!owner&&m.resume!==previous.session){reply(res,409,{error:'unavailable-id'});return;}
   if(previous)drop(previous); // Só a chave do dono permite recuperar este mesmo endereço.
   if(peers.size>=500){reply(res,503,{error:'busy'});return;}
   const p={id:m.id,owner,session:token(),queue:[],channels:new Set(),last:Date.now(),poll:null,closed:false};
   peers.set(p.id,p);sessions.set(p.session,p);reply(res,200,{session:p.session,id:p.id});return;
  }
  const auth=(req.headers.authorization||'').replace(/^Bearer /,'');const p=sessions.get(auth);
  if(!p||p.closed){reply(res,401,{error:'session-expired'});return;}p.last=Date.now();
  if(req.url==='/relay/poll'){
   if(p.poll)reply(p.poll,200,{events:[]});clearTimeout(p.pollTimer);
   p.poll=res;res.on('close',()=>{if(res.destroyed&&p.poll===res){p.poll=null;clearTimeout(p.pollTimer);}});
   p.pollTimer=setTimeout(()=>{if(p.poll===res){p.poll=null;reply(res,200,{events:[]});}},20000);flush(p);return;
  }
  if(req.url==='/relay/close'){reply(res,200,{ok:true});drop(p);return;}
  if(req.url!=='/relay/send'){reply(res,404,{error:'not-found'});return;}
  if(m.kind==='connect'){
   const target=peers.get(m.target);
   if(!target||!target.owner){push(p,{kind:'error',type:'peer-unavailable',channel:m.channel});reply(res,200,{ok:true});return;}
   if(p.owner||target===p||!/^c[a-f0-9]{32}$/.test(m.channel||'')||channels.has(m.channel)||p.channels.size>=2||target.channels.size>=12){reply(res,400,{error:'invalid-channel'});return;}
   const ch={a:p,b:target};channels.set(m.channel,ch);p.channels.add(m.channel);target.channels.add(m.channel);
   push(target,{kind:'incoming',channel:m.channel,peer:p.id});push(p,{kind:'open',channel:m.channel});
  }else if(m.kind==='data'||m.kind==='close'){
   const ch=channels.get(m.channel);
   if(!ch||(ch.a!==p&&ch.b!==p)){reply(res,404,{error:'channel-closed'});return;}
   if(m.kind==='close')closeChannel(m.channel);else push(ch.a===p?ch.b:ch.a,{kind:'data',channel:m.channel,data:m.data});
  }else{reply(res,400,{error:'invalid-message'});return;}
  reply(res,200,{ok:true});
 }catch(e){reply(res,e.message==='payload-too-large'?413:400,{error:'invalid-request'});}
});
const cleanup=setInterval(()=>{for(const p of peers.values())if(Date.now()-p.last>65000)drop(p);},10000);cleanup.unref();
function shutdown(){for(const p of [...peers.values()])drop(p);clearInterval(cleanup);server.close();}
if(require.main===module){server.listen(Number(process.env.PORT)||10000,'0.0.0.0',()=>console.log('Domino HTTPS relay ready'));process.on('SIGTERM',shutdown);process.on('SIGINT',shutdown);}
module.exports={server,shutdown,hash};
