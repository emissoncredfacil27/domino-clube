'use strict';
const {test,after}=require('node:test');const assert=require('node:assert/strict');const crypto=require('node:crypto');const vm=require('node:vm');const fs=require('node:fs');const {server,shutdown,hash}=require('./relay-server.cjs');
let base;const ready=new Promise(resolve=>server.listen(0,'127.0.0.1',()=>{base='http://127.0.0.1:'+server.address().port;resolve()}));after(shutdown);
const key=crypto.randomBytes(32).toString('hex');
async function post(path,body,session){await ready;const r=await fetch(base+path,{method:'POST',headers:{'Content-Type':'application/json',...(session?{Authorization:'Bearer '+session}:{})},body:JSON.stringify(body)});return {status:r.status,...await r.json()};}
const reg=(id,key)=>post('/relay/register',{id,key});const poll=s=>post('/relay/poll',{},s);
test('HTTP channels isolate hands, authenticate host, support 3 guests and close stale channels',async()=>{
 const id='domino-'+hash(key);assert.equal((await reg(id,'wrong')).status,403);
 const h=await reg(id,key);assert.equal(h.status,200);
 const clients=[];
 for(let i=0;i<3;i++){
  const g=await reg('domino-guest-'+crypto.randomBytes(16).toString('hex'));const channel='c'+crypto.randomBytes(16).toString('hex');clients.push({...g,channel});
  assert.equal((await post('/relay/send',{kind:'connect',target:id,channel},g.session)).status,200);
  const event=(await poll(h.session)).events[0];assert.equal(event.kind,'incoming');assert.equal(event.channel,channel);
  assert.equal((await poll(g.session)).events[0].kind,'open');
  await post('/relay/send',{kind:'data',channel,data:{hand:[[i,6]]}},h.session);
  assert.deepEqual((await poll(g.session)).events[0].data.hand,[[i,6]]);
 }
 assert.equal((await post('/relay/send',{kind:'data',channel:clients[0].channel,data:{cheat:true}},clients[1].session)).status,404);
 const pending=poll(clients[0].session);await post('/relay/send',{kind:'data',channel:clients[0].channel,data:{instant:true}},h.session);assert.equal((await pending).events[0].data.instant,true);
 const recovered=await reg(id,key);assert.equal(recovered.status,200);assert.equal((await poll(h.session)).status,401);assert.equal((await poll(clients[1].session)).events[0].kind,'close');
 const missing='c'+crypto.randomBytes(16).toString('hex');await post('/relay/send',{kind:'connect',target:'domino-'+'0'.repeat(24),channel:missing},clients[2].session);
 const events=(await poll(clients[2].session)).events;assert(events.some(e=>e.type==='peer-unavailable'));
 for(const p of [recovered,...clients])await post('/relay/close',{},p.session);
});
test('existing client adapter carries join, ready, game state and reconnects over real HTTP',async()=>{
 await ready;const context=vm.createContext({fetch,crypto,AbortController,setTimeout,clearTimeout,console,RELAY_URL:base});
 const html=fs.readFileSync(__dirname+'/index.html','utf8');const client=html.slice(html.indexOf('class RelayEvents'),html.indexOf('let expiredGameId'));vm.runInContext(client+'\nthis.Adapter=RelayPeer;',context);
 const Adapter=context.Adapter;const host=new Adapter('domino-'+hash(key),{ownerKey:key});const guest=new Adapter('domino-guest-'+crypto.randomBytes(16).toString('hex'));
 const wait=(p,type)=>new Promise(resolve=>p.on(type,resolve));
 try{
  await Promise.all([wait(host,'open'),wait(guest,'open')]);
  const incoming=wait(host,'connection');const c=guest.connect(host.id);await wait(c,'open');const other=await incoming;
  const joined=wait(other,'data');c.send({type:'join',name:'Pai',token:'a'.repeat(32)});assert.equal((await joined).name,'Pai');
  const state=wait(c,'data');other.send({type:'state',hand:[[6,6]],self:1});assert.equal((await state).self,1);
  const accepted=wait(other,'data');c.send({type:'ready',version:'friends-v5-rounds'});assert.equal((await accepted).type,'ready');
  const gone=wait(c,'close');host.lost();
  const opened=wait(host,'open');host.reconnect();await Promise.all([opened,gone]);assert.equal(host.id,'domino-'+hash(key));
 }finally{host.destroy();guest.destroy();}
});
