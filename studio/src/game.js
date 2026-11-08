/* PonyGotchi Studio -- original gameplay, own visuals with user supplied art.
   All data saved offline; no tracking, Wi-Fi or network requests. */
(() => {
'use strict';
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d', {alpha:false});
ctx.imageSmoothingEnabled = false;
const W=320,H=480;
__THEME__
let palette=PALETTES.day;
const fireflyRules=__FIREFLIES__;
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
const screens=['home','care','quests','shop','explore','settings','arcade'];
const DAYS=['dimanche','lundi','mardi','mercredi','jeudi','vendredi','samedi'];
const MONTHS=['janv.','févr.','mars','avr.','mai','juin','juil.','août','sept.','oct.','nov.','déc.'];
const Q=[{id:'water',icon:'💧',title:'Une pause pour boire',target:3,coins:5},{id:'meal',icon:'🍽️',title:'Noter un repas',target:3,coins:6},{id:'rest',icon:'🌿',title:'Prendre une pause',target:1,coins:8},{id:'air',icon:'☀️',title:'Prendre l’air',target:1,coins:9}];
const ITEMS=[{id:'none',name:'Naturel',cost:0,icon:'♡'},{id:'bow',name:'Nœud',cost:18,icon:'🎀'},{id:'flower',name:'Fleur',cost:24,icon:'🌼'},{id:'crown',name:'Couronne',cost:42,icon:'♛'},{id:'star',name:'Étoile',cost:32,icon:'✦'},{id:'necklace',name:'Pendentif',cost:38},{id:'hat',name:'Chapeau',cost:48}];
const refs=window.PONY_IMAGES || {};
const images={};
Object.entries(refs).forEach(([key,uri])=>{const im=new Image();im.src=uri;images[key]=im;});
const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
const defaultState=()=>({v:4,name:'Rosy',hunger:85,joy:84,clean:87,energy:82,level:1,xp:0,coins:35,bond:0,accessory:'none',owned:['none'],visited:0,discoveries:[],missions:{},day:'',clockOffset:0,worldOverride:'auto',brightness:100,relaxed:true,quiet:true,petX:88,updated:Date.now(),questsTotal:0});
let state=defaultState();
try{const saved=JSON.parse(localStorage.getItem('ponygotchi-studio-v4'));if(saved&&saved.v===4){state={...state,...saved};state.owned=Array.isArray(saved.owned)?saved.owned:['none'];state.discoveries=Array.isArray(saved.discoveries)?saved.discoveries:[];}}catch(e){}
let screen='home', hud=false, action='idle', actionStart=0, actionEnd=0, sceneToast='', toastUntil=0, heartParticles=[], ambientParticles=[], tapRects=[], clockEditors=null, manualWorld=null;
let minigame={active:false,ends:0,score:0,stars:[],next:0,result:0};
let exploring=0, exploredReward=0, pointerDown=null, lastDraw=0, lastSave=0, lastFrame=0, lastAffection=0, hudUntil=0;
let latestClockDay='';
let morningGiftDay='';
const DISCOVERIES=['🌸 Pétale rare','🔔 Clochette','🦋 Aile de fée','🍀 Trèfle','💎 Cristal','🍄 Champignon de lune','🪶 Plume dorée','🌙 Goutte de rosée'];
function nowDate(){return new Date(Date.now()+(Number(state.clockOffset)||0));}
function stamp(d){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
function syncDay(){let today=stamp(nowDate());if(state.day!==today){const old=state.day;state.day=today;state.missions={};if(old&&state.lastVisitDay!==today){state.coins+=3;state.lastVisitDay=today;setTimeout(()=>toast('Une surprise du matin : +3 étoiles'),500);}save();}}
function save(){state.updated=Date.now();try{localStorage.setItem('ponygotchi-studio-v4',JSON.stringify(state));}catch(e){}}
function applyOffline(){const hrs=clamp((Date.now()-(state.updated||Date.now()))/3600000,0,16);if(hrs>0.04){const m=state.relaxed?0.65:2;state.hunger=clamp(state.hunger-hrs*m,15,100);state.clean=clamp(state.clean-hrs*m*.7,20,100);state.energy=clamp(state.energy-hrs*m*.8,20,100);state.joy=clamp(state.joy-hrs*m*.45,20,100);}}
applyOffline(); syncDay();
function worldForTime(){if(action==='sleep')return 'night';if(state.worldOverride!=='auto')return state.worldOverride;let h=nowDate().getHours();return h<6||h>=21?'night':(h>=18?'dusk':'day');}
function random(a,b){return a+Math.random()*(b-a);}
for(let i=0;i<20;i++)ambientParticles.push({x:random(0,320),y:random(85,475),seed:random(0,7),size:random(1,3),s:random(.15,.8)});
function addParticles(x,y,kind='heart',count=8){for(let i=0;i<count;i++)heartParticles.push({x,y,vx:random(-1.4,1.4),vy:random(-2.5,-1.2),born:performance.now(),kind,size:random(8,14)});}
function toast(s){sceneToast=s;toastUntil=performance.now()+2400;}
function gain(amount,coins=0){state.xp+=amount;state.coins+=coins;while(state.xp>=state.level*42){state.xp-=state.level*42;state.level++;state.coins+=12;toast(`Niveau ${state.level} ! +12 ✦`);}save();}
function beginAction(a){if(screen==='arcade')return;action=a;actionStart=performance.now();actionEnd=actionStart+(a==='sleep'?3300:2400);
 if(a==='eat'){state.hunger=clamp(state.hunger+18,0,100);state.joy=clamp(state.joy+3,0,100);gain(9,2);toast('Rosy se régale ! +2 ✦');}
 if(a==='play'){state.joy=clamp(state.joy+20,0,100);state.energy=clamp(state.energy-5,0,100);gain(11,3);toast('Quelle énergie ! +3 ✦');}
 if(a==='wash'){state.clean=clamp(state.clean+25,0,100);gain(8,2);toast('Toute propre ! +2 ✦');}
 if(a==='sleep'){state.energy=clamp(state.energy+24,0,100);gain(6,1);toast('Une sieste réparatrice !');}
 if(a==='pet'){state.joy=clamp(state.joy+8,0,100);state.bond++;gain(5,1);toast('Rosy adore les câlins !');addParticles(state.petX+83,290,'heart',9);}
 save();}
function open(s){
 screen=s;
 hud=s==='care';
 hudUntil=performance.now()+12000;
}
function rect(x,y,w,h,fill){ctx.fillStyle=fill;ctx.fillRect(x,y,w,h);}
function rounded(x,y,w,h,r,fill,stroke=null,lw=1){ctx.beginPath();ctx.roundRect(x,y,w,h,r);if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=lw;ctx.stroke();}}
function text(t,x,y,size=12,color='#503e43',weight=700,align='center'){ctx.save();ctx.textAlign=align;ctx.textBaseline='middle';ctx.font=`${weight} ${size}px system-ui, -apple-system, Segoe UI, sans-serif`;ctx.fillStyle=color;ctx.fillText(String(t),x,y);ctx.restore();}
function icon(t,x,y,size=18){ctx.save();ctx.textAlign='center';ctx.textBaseline='middle';ctx.font=`${size}px 'Segoe UI Emoji','Apple Color Emoji',sans-serif`;ctx.fillText(t,x,y);ctx.restore();}
function img(key,x,y,w,h,alpha=1){const im=images[key];if(im?.complete&&im.naturalWidth){ctx.save();ctx.globalAlpha=alpha;ctx.drawImage(im,x,y,w,h);ctx.restore();return true;}return false;}
function nine(key,x,y,w,h,c=16){const im=images[key];if(!im?.complete||!im.naturalWidth)return false;const iw=im.naturalWidth,ih=im.naturalHeight,sx=Math.min(c,iw/3),sy=Math.min(c,ih/3),dx=Math.min(c,w/3),dy=Math.min(c,h/3);let xs=[0,sx,iw-sx],ys=[0,sy,ih-sy],sw=[sx,iw-2*sx,sx],sh=[sy,ih-2*sy,sy],xx=[x,x+dx,x+w-dx],yy=[y,y+dy,y+h-dy],dw=[dx,w-2*dx,dx],dh=[dy,h-2*dy,dy];for(let row=0;row<3;row++)for(let col=0;col<3;col++)if(dw[col]>0&&dh[row]>0)ctx.drawImage(im,xs[col],ys[row],sw[col],sh[row],xx[col],yy[row],dw[col],dh[row]);return true;}
function panel(x,y,w,h){
 rounded(x,y+4,w,h,18,palette.shade);
 rounded(x,y,w,h,18,palette.paper,palette.edge,2);
 rounded(x+5,y+5,w-10,h-10,13,null,palette.light,1);
 for(const xx of [x+12,x+w-12])for(const yy of [y+12,y+h-12])rect(xx-1,yy-1,3,3,palette.edge);
}
function button(x,y,w,h,label,hit,opts={}){
 rounded(x,y+3,w,h,10,palette.edge);
 rounded(x,y,w,h,10,opts.active?palette.paper:palette.light,palette.edge,1);
 if(opts.art)pixelIcon(opts.art,x+w/2,y+(opts.small?13:22),opts.small?2:3);
 else if(opts.emoji)icon(opts.emoji,x+w/2,y+(opts.small?13:23),opts.small?16:22);
 if(label)text(label,x+w/2,y+h-(opts.small?13:15),opts.small?12:11,palette.ink,800);
 if(hit)tapRects.push({x,y,w,h:Math.max(40,h),fn:hit});
}
function pill(x,y,w,h,label,hit,active=false){
 rounded(x,y,w,h,Math.min(h/2,11),active?palette.accent:palette.light,palette.edge,1.5);
 text(label,x+w/2,y+h/2,11,active?'#fff':palette.ink,800);
 if(hit)tapRects.push({x,y,w,h,fn:hit});
}
function cross(x,y,hit){rounded(x-16,y-16,32,32,16,'#fff8e7','#b18c77',1);text('×',x,y-1,23,'#754951',500);tapRects.push({x:x-22,y:y-22,w:44,h:44,fn:hit});}
function drawAmbient(t,world){ctx.save();for(const p of ambientParticles){const q=t*.00025*p.s+p.seed,x=(p.x+Math.sin(q*3)*8+W)%W,y=(p.y+(world==='night'?(-t*.005*p.s):(-t*.002*p.s))%460+460)%460+12;if(world==='night'){ctx.globalAlpha=.45+.45*Math.sin(q*10);rounded(x,y,p.size+1,p.size+1,2,'#fff3aa');}else if(world==='dusk'){ctx.globalAlpha=.48;icon('✦',x,y,4+p.size*2);}else{ctx.globalAlpha=.58;ctx.fillStyle='#fff5d7';ctx.beginPath();ctx.ellipse(x,y,p.size,p.size*1.8,q,0,Math.PI*2);ctx.fill();}}
ctx.restore();}
function drawBackground(t){
 const world=worldForTime();
 if(!img(`bg_${world}`,0,0,W,H))rect(0,0,W,H,'#35324d');
 if(action!=='idle')img('room_'+action,0,-8,W,H);
 if(!reducedMotion.matches)drawAmbient(t,world);
}
function ponyY(t){const bob=action==='sleep'||reducedMotion.matches?0:Math.sin(t/350)*2;return Math.round(185+bob);}
function drawAccessory(x,y,pose,frame){
 const id=state.accessory;
 const positions={bow:[83,29],flower:[87,28],crown:[91,21],star:[94,24],necklace:[96,77],hat:[89,22]};
 if(!positions[id])return;
 const [ax,ay]=positions[id];
 const resting=pose==='sleep', step=pose==='walk'?[0,-2,0,2][frame]:0;
 pixelIcon(id==='star'?'games':id,x+ax-(resting?7:0),y+ay+(resting?20:step),3);
}
function frameFor(t){if(action==='idle'){return Math.floor(t/230)%4;}return Math.floor((t-actionStart)/165)%4;}
function ponyState(t){if(action!=='idle'){return({eat:'eat',play:'happy',wash:'wash',sleep:'sleep',pet:'happy'})[action]||'idle';}
if(state.hunger<22||state.joy<20)return 'sad';const phase=t%18000;return phase>=15500?'sleep':phase>=7800&&phase<8250?'blink':phase<6500||phase>=9000?'walk':'idle';}
let lastPonyX=88, facingLeft=false;
function drawPony(t){
 const anim=ponyState(t);
 const pace=t%18000;
 const travel=pace<6500?-1+2*(0.5-0.5*Math.cos(pace/6500*Math.PI)):pace<9000?1:pace<15500?Math.cos((pace-9000)/6500*Math.PI):-1;
 const motion=reducedMotion.matches?0:travel*24;
 const xx=Math.round(88+motion), yy=ponyY(t);
 if(action==='idle'&&xx!==lastPonyX)facingLeft=xx<lastPonyX;
 lastPonyX=xx;
 state.petX=xx;
 const frm=anim==='sleep'||reducedMotion.matches?0:frameFor(t);ctx.save();ctx.globalAlpha=.17;ctx.fillStyle='#3a6b59';ctx.beginPath();ctx.ellipse(xx+72,yy+124,58,10,0,0,Math.PI*2);ctx.fill();ctx.restore();ctx.save();
 if(facingLeft&&action==='idle'){ctx.translate(2*xx+144,0);ctx.scale(-1,1);}
 if(!img(`${anim}_${frm}`,xx,yy,144,144))img('idle_0',xx,yy,144,144);
 drawAccessory(xx,yy,anim,frm);
 ctx.restore();
if(action==='eat'){const a=(t-actionStart)/260;icon('🍎',xx+131-a%3*3,yy+72+Math.sin(a)*5,22);}
if(action==='play'){const tt=t-actionStart;icon('🏐',xx+138,yy+105-Math.abs(Math.sin(tt/200))*46,23);}
if(action==='wash'){for(let j=0;j<10;j++){const q=(t-actionStart)/140+j*2;ctx.strokeStyle='rgba(191,244,253,.9)';ctx.lineWidth=2;ctx.beginPath();ctx.arc(xx+24+(j*29)%125,yy+112-(q*5)%106,3+(j%3)*2,0,Math.PI*2);ctx.stroke();}}
if(action==='sleep'){const rise=reducedMotion.matches?0:Math.floor((t-actionStart)/130)%12;text('z',xx+125,yy+52-rise,14,'#e9f0ff');text('Z',xx+142,yy+31-rise,19,'#eee9ff');}
if(action==='pet'){icon('💗',xx+122,yy+42+Math.sin(t/260)*5,18);}
if(exploring){const elapsed=t-exploring;icon('✨',xx+136,yy+70,21);if(elapsed<4000)text('En exploration…',160,235,12,'#fff8e8',800);}
}
function drawHearts(t){heartParticles=heartParticles.filter(p=>t-p.born<1200);if(reducedMotion.matches)return;for(const p of heartParticles){const age=(t-p.born)/1000;ctx.save();ctx.globalAlpha=1-age;icon(p.kind==='heart'?'♥':'✦',p.x+p.vx*age*42,p.y+p.vy*age*32,p.size);ctx.restore();}}
function drawClock(){
 const d=nowDate();
 const hours=String(d.getHours()).padStart(2,'0'), minutes=String(d.getMinutes()).padStart(2,'0');
 const scene=screen==='home'||screen==='care'||screen==='menu';
 if(scene){
  const veil=ctx.createLinearGradient(0,0,0,170);
  veil.addColorStop(0,'rgba(27,20,42,.27)');
  veil.addColorStop(1,'rgba(27,20,42,0)');
  ctx.fillStyle=veil;
  ctx.fillRect(0,0,W,170);
  ctx.save();
  ctx.shadowColor='rgba(29,21,40,.72)';
  ctx.shadowBlur=6;
  ctx.shadowOffsetY=2;
  text(DAYS[d.getDay()]+' '+d.getDate()+' '+MONTHS[d.getMonth()],160,43,15,'#fff6e7',700);
  text(hours+':'+minutes,160,94,63,'#fffaf0',650);
  ctx.restore();
  if(screen==='home')rounded(141,458,38,4,2,'rgba(255,250,235,.78)');
  return;
 }
 pill(14,15,120,44,'‹ Retour à Rosy',()=>open('home'));
 text(hours+':'+minutes,269,37,20,'#fffaf0',850);
}
const CARE_TOP=429;
function drawCare(){
 const needs=[['eat','Faim',state.hunger],['play','Joie',state.joy],['wash','Bain',state.clean],['sleep','Repos',state.energy]];
 rounded(8,130,304,52,12,palette.paper,palette.edge,1.5);
 needs.forEach(([,label,value],i)=>{
  const x=16+i*57;
  const level=Math.round(clamp(value,0,100));
  text(label,x+25,142,11,palette.ink,800);
  rounded(x,151,50,9,4,palette.light,palette.edge,1);
  if(level)rounded(x,151,50*level/100,9,4,palette.accent);
  text(level+'%',x+25,171,10,palette.ink,800);
 });
 pill(245,134,60,44,'Menu',()=>open('menu'));
 const labels=['Manger','Jouer','Laver','Dormir'];
 needs.forEach(([id,,value],i)=>{
  const x=8+i*77;
  rounded(x,CARE_TOP,73,47,10,palette.paper,palette.edge,1.5);
  pixelIcon(id,x+16,CARE_TOP+15,2);
  text(labels[i],x+46,CARE_TOP+15,11,palette.ink,800);
  rounded(x+7,CARE_TOP+30,59,10,4,palette.light,palette.edge,1);
  if(value>0)rounded(x+7,CARE_TOP+30,59*clamp(value,0,100)/100,10,4,palette.accent);
  tapRects.push({x,y:CARE_TOP,w:73,h:47,fn:()=>beginAction(id)});
 });
}
function fullPanel(title,subtitle){
 rect(0,77,320,403,'rgba(41,29,46,.27)');
 panel(11,89,298,382);
 rounded(22,100,276,56,10,palette.accent);
 text(title,154,119,19,'#fff',850);
 if(subtitle)text(subtitle,151,142,10,'#fff',650);
 cross(286,109,()=>open('home'));
}
function drawMenu(){
 rounded(8,348,304,125,14,palette.paper,palette.edge,1.5);
 const items=[['quests','Journal'],['explore','Explorer'],['games','Mini-jeux'],['shop','Boutique'],['settings','Réglages'],['care','Soins']];
 items.forEach(([id,label],i)=>pill(15+i%3*98,357+Math.floor(i/3)*55,94,49,label,()=>open(id)));
 tapRects.push({x:0,y:0,w:W,h:345,fn:()=>open('home')});
}
function drawQuests(){
 fullPanel('Le journal de Rosy','De petits gestes, à ton rythme');
 pill(24,165,130,40,'Bien-être',null,true);
 pill(165,165,130,40,'Aventures',()=>open('milestones'));
 let y=216;for(let i=0;i<Q.length;i++){const q=Q[i],v=state.missions[q.id]||0;rounded(24,y-6,272,48,11,v>=q.target?'#e5f1df':'#fff9f0','#dfc9b9',1);icon(q.icon,44,y+18,22);text(q.title,65,y+10,12,'#674e52',800,'left');text(`${v}/${q.target}    ·    +${q.coins} ✦`,65,y+30,10,'#a6816a',700,'left');if(v<q.target)button(246,y,42,40,'+',()=>completeQuest(q),{small:true});else{text('✓',265,y+22,22,'#709868',900);}y+=53;}
text('Aucune pénalité si tu ne fais pas une mission.',160,452,10,'#958080',550);}
const MILESTONES=[
 {id:'bond',title:'Une amie de la prairie',art:'pet',target:5,reward:12,progress:()=>state.bond},
 {id:'explorer',title:'Premiers trésors',art:'explore',target:3,reward:16,progress:()=>state.discoveries.length},
 {id:'wardrobe',title:'Une tenue pour chaque jour',art:'shop',target:3,reward:18,progress:()=>state.owned.filter(id=>id!=='none').length},
 {id:'garden',title:'Les mains dans la terre',art:'flower',target:3,reward:15,progress:()=>state.harvests||0}
];
function drawMilestones(){
 fullPanel('Le journal de Rosy','Des objectifs à retrouver à ton rythme');
 pill(24,165,130,40,'Bien-être',()=>open('quests'));
 pill(165,165,130,40,'Aventures',null,true);
 MILESTONES.forEach((quest,i)=>{
  const y=216+i*54, value=Math.min(quest.target,quest.progress());
  const claimed=state.milestones?.includes(quest.id);
  rounded(24,y,272,48,8,palette.light,palette.edge);
  pixelIcon(quest.art,45,y+24,2);
  text(quest.title,64,y+15,11,palette.ink,800,'left');
  text(value+' / '+quest.target+' · '+quest.reward+' ✦',64,y+33,10,palette.ink,650,'left');
  if(claimed)text('Reçu',260,y+24,10,palette.ink,800);
  else if(value===quest.target)pill(229,y+4,61,40,'Recevoir',()=>claimMilestone(quest),true);
 });
}
function claimMilestone(quest){
 state.milestones ||= [];
 if(state.milestones.includes(quest.id)||quest.progress()<quest.target)return;
 state.milestones.push(quest.id);
 gain(12,quest.reward);
 toast('Quête réussie · +'+quest.reward+' étoiles');
}
function completeQuest(q){syncDay();const v=state.missions[q.id]||0;if(v>=q.target)return;state.missions[q.id]=v+1;state.questsTotal++;gain(9,q.coins);addParticles(264,210,'star',8);toast(`Bravo ! +${q.coins} étoiles`);save();}
function drawShop(){
 fullPanel('La garde-robe','Collectionne et équipe les accessoires de Rosy');
 text('✦ '+state.coins+' étoiles',160,171,13,palette.ink,850);
 ITEMS.forEach((item,i)=>{
  const x=24+(i%2)*139,y=188+Math.floor(i/2)*59;
  const selected=state.accessory===item.id, owned=state.owned.includes(item.id);
  rounded(x,y,132,51,8,selected?palette.accent:palette.light,palette.edge);
  pixelIcon(({none:'pet',star:'games'})[item.id]||item.id,x+19,y+25,2);
  const ink=selected?'#fff':palette.ink;
  text(item.name,x+39,y+17,11,ink,850,'left');
  text(selected?'Équipé':owned?'Équiper':item.cost+' ✦',x+39,y+35,10,ink,650,'left');
  tapRects.push({x,y,w:132,h:51,fn:()=>buyItem(item)});
 });
 text('Les accessoires suivent Rosy dans la prairie.',160,441,10,palette.ink,650);
}
function buyItem(item){
 if(!state.owned.includes(item.id)){
  if(state.coins<item.cost){toast('Pas assez d’étoiles');return;}
  state.coins-=item.cost;
  state.owned.push(item.id);
 }
 state.accessory=item.id;
 toast(item.name+' équipé');
 save();
 open('care');
 addParticles(state.petX+72,175,'star',10);
}
const TREASURES=DISCOVERIES;
function drawExplore(){
 fullPanel('Le carnet d’aventures','Les souvenirs de la prairie aux merveilles');
 const count=TREASURES.filter(treasure=>state.discoveries.includes(treasure)).length;
 text(count===TREASURES.length?'Collection complète !':count+' / '+TREASURES.length+' souvenirs',160,174,13,'#755057',800);
 TREASURES.forEach((treasure,i)=>{
  const x=26+(i%2)*137,y=193+Math.floor(i/2)*44;
  const found=state.discoveries.includes(treasure);
  rounded(x,y,131,37,9,found?'#f5e8d6':'#f5efea','#dfc9b9',1);
  text(found?treasure:'· · ·',x+65,y+18,10,found?'#76565c':'#a89996',700);
 });
 if(exploring)pill(64,390,192,44,'Rosy explore… ✨',null,true);
 else pill(64,390,192,44,'Partir explorer  ➜',startExplore);
 text('Chaque balade rapporte 8 étoiles.',160,454,10,'#958080',550);
}
function startExplore(){if(exploring)return;exploring=performance.now();screen='home';hud=false;toast('Rosy part chercher une surprise…');}
function finishExplore(){if(!exploring)return;exploring=0;state.visited++;const found=TREASURES[(state.visited-1)%TREASURES.length];if(!state.discoveries.includes(found))state.discoveries.push(found);gain(15,8);toast(`Trouvé : ${found}  ·  +8 ✦`);addParticles(state.petX+76,278,'star',12);save();}
function drawSettings(){fullPanel('Paramètres','Sans Wi-Fi · données locales');const d=nowDate();text('Date et heure manuelles',32,177,12,'#78565b',800,'left');
rounded(25,192,270,46,10,'#fffaf2','#d5bdb3',1);text(`${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}   ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`,137,215,13,'#624b54',800);pill(240,201,45,29,'✎',()=>openClockEditor());
text('Ambiance',32,263,12,'#78565b',800,'left');const opts=[['Auto','auto'],['Jour','day'],['Soir','dusk'],['Nuit','night']];for(let i=0;i<4;i++)pill(24+i*70,279,66,31,opts[i][0],()=>{state.worldOverride=opts[i][1];save();},state.worldOverride===opts[i][1]);
text('Mode de jeu',32,337,12,'#78565b',800,'left');pill(24,351,125,34,'Doux ♡',()=>{state.relaxed=true;save();},state.relaxed);pill(160,351,135,34,'Classique',()=>{state.relaxed=false;save();},!state.relaxed);
text(`Lumière : ${state.brightness}%`,32,409,12,'#78565b',800,'left');pill(204,393,42,33,'−',()=>{state.brightness=clamp(state.brightness-10,30,100);save();});pill(252,393,42,33,'+',()=>{state.brightness=clamp(state.brightness+10,30,100);save();});
text('Le mode Doux évite les punitions sévères.',160,453,9,'#978080',500);}
function openClockEditor(){const d=nowDate();clockEditors={year:d.getFullYear(),month:d.getMonth()+1,day:d.getDate(),hour:d.getHours(),minute:d.getMinutes()};screen='clock';}
function drawClockEditor(){fullPanel('Régler l’horloge','Choisis la date et l’heure de PonyGotchi');const fld=[['Année','year',2020,2100],['Mois','month',1,12],['Jour','day',1,31],['Heure','hour',0,23],['Minute','minute',0,59]];fld.forEach((f,i)=>{const y=173+i*47;text(f[0],36,y+17,13,'#73565e',800,'left');pill(159,y,39,35,'−',()=>clockEditors[f[1]]=clamp(clockEditors[f[1]]-1,f[2],f[3]));text(String(clockEditors[f[1]]).padStart(2,'0'),225,y+18,14,'#664950',800);pill(254,y,39,35,'+',()=>clockEditors[f[1]]=clamp(clockEditors[f[1]]+1,f[2],f[3]));});pill(65,420,190,39,'Enregistrer l’heure',()=>{let c=clockEditors;let n=new Date(c.year,c.month-1,c.day,c.hour,c.minute,0);if(isNaN(n)||n.getFullYear()!==c.year||n.getMonth()!==c.month-1||n.getDate()!==c.day){toast('Date non valide');return;}state.clockOffset=n.getTime()-Date.now();save();screen='settings';toast('Heure enregistrée');});}
function startArcade(){screen='arcade';minigame={active:true,ends:performance.now()+18000,score:0,stars:[],next:0,result:0};toast('Attrape les étoiles !');}
function drawArcade(t){fullPanel('Attrape-étoiles','Touche les étoiles avant la fin !');const left=Math.max(0,Math.ceil((minigame.ends-t)/1000));text(`⏳ ${left}s`,104,172,13,'#785a55',800);text(`✦ ${minigame.score}`,219,172,13,'#ae7731',800);
rounded(30,196,260,220,12,'rgba(108,139,136,.20)','#c6b6a9',1);
if(minigame.active){if(t>minigame.ends){minigame.active=false;gain(minigame.score*3,Math.min(25,minigame.score*2));toast(`Bravo ! +${Math.min(25,minigame.score*2)} étoiles`);}else if(t>minigame.next){minigame.next=t+random(550,1100);minigame.stars.push({x:random(51,266),y:random(220,388),t,age:2100});}}
minigame.stars=minigame.stars.filter(s=>t-s.t<s.age);for(const s of minigame.stars){const scale=1+.15*Math.sin((t-s.t)/125);text('✦',s.x,s.y,26*scale,'#ffe394',900);tapRects.push({x:s.x-21,y:s.y-21,w:42,h:42,fn:()=>{if(!minigame.active)return;let j=minigame.stars.indexOf(s);if(j>=0){minigame.stars.splice(j,1);minigame.score++;addParticles(s.x,s.y,'star',4);}}});}
if(!minigame.active)pill(88,291,144,43,'Rejouer',()=>startArcade());pill(72,430,176,31,'Retour aux jeux',()=>open('games'));}
const lanterns=['✿','☾','✦','♡'];
const lanternColors=['#f2a8be','#aeb7ee','#f7d88a','#a3d2b1'];
let fireflies;
function drawGames(){
 fullPanel('La clairière des jeux','Quatre activités à partager avec Rosy');
 const games=[
  [34,175,'Attrape-étoiles','games',startArcade],
  [34,288,'Ronde des lucioles','sleep',startFireflies],
  [166,175,'Memory','quests',startMemory],
  [166,288,'Jardin enchanté','flower',()=>open('garden')]
 ];
 games.forEach(([x,y,label,art,run])=>button(x,y,120,94,label,run,{art}));
 pill(72,421,176,44,'Retour aux soins',()=>open('care'));
}
const MEMORY_ART=['bow','flower','crown','hat','necklace','games'];
let memory;
function startMemory(){
 const deck=MEMORY_ART.flatMap(art=>[art,art]);
 for(let i=deck.length-1;i>0;i--){
  const j=Math.floor(Math.random()*(i+1));
  [deck[i],deck[j]]=[deck[j],deck[i]];
 }
 memory={deck,matched:new Set(),shown:[],moves:0,hideAt:0};
 open('memory');
}
function revealCard(index){
 if(memory.matched.has(index)||memory.shown.includes(index)||memory.shown.length===2)return;
 memory.shown.push(index);
 if(memory.shown.length!==2)return;
 memory.moves++;
 const [a,b]=memory.shown;
 if(memory.deck[a]!==memory.deck[b]){
  memory.hideAt=performance.now()+750;
  return;
 }
 memory.matched.add(a);
 memory.matched.add(b);
 memory.shown=[];
 if(memory.matched.size!==memory.deck.length)return;
 state.memoryBest=Math.min(state.memoryBest||Infinity,memory.moves);
 gain(15,Math.max(6,24-memory.moves));
}
function drawMemory(t){
 fullPanel('Memory de Rosy','Retourne deux cartes et retrouve les paires');
 if(memory.hideAt&&t>=memory.hideAt){memory.shown=[];memory.hideAt=0;}
 const finished=memory.matched.size===memory.deck.length;
 text(finished?'Partie terminée · '+Math.max(6,24-memory.moves)+' ✦':memory.matched.size/2+' / 6 paires · '+memory.moves+' essais',160,174,13,palette.ink,850);
 memory.deck.forEach((art,i)=>{
  const x=39+(i%4)*62,y=192+Math.floor(i/4)*61;
  const matched=memory.matched.has(i), face=matched||memory.shown.includes(i);
  rounded(x,y,56,53,9,face?palette.light:palette.accent,palette.edge,1);
  pixelIcon(face?art:'games',x+28,y+27,face?3:2);
  tapRects.push({x,y,w:56,h:53,fn:()=>revealCard(i)});
 });
 if(finished)pill(79,379,162,42,'Rejouer · record '+state.memoryBest,startMemory);
 pill(72,425,176,43,'Retour aux jeux',()=>open('games'));
}
const GARDEN_GROW_MS=60000;
const GARDEN_FLOWERS=['flower','games','pet'];
function tendPlot(index){
 state.garden ||= [null,null,null];
 const plot=state.garden[index], now=Date.now();
 if(!plot){state.garden[index]={wateredAt:0};save();return;}
 if(!plot.wateredAt){plot.wateredAt=now;save();return;}
 if(now-plot.wateredAt<GARDEN_GROW_MS)return;
 state.garden[index]=null;
 state.harvests=(state.harvests||0)+1;
 gain(8,4);
 toast('Fleur récoltée · +4 étoiles');
}
function drawGarden(){
 fullPanel('Jardin enchanté','Plante, arrose, puis récolte une minute plus tard');
 const now=Date.now();
 for(let i=0;i<3;i++){
  const y=178+i*75,plot=state.garden?.[i];
  const seconds=plot?.wateredAt?Math.max(0,Math.ceil((GARDEN_GROW_MS-now+plot.wateredAt)/1000)):null;
  const label=!plot?'Planter':seconds===null?'Arroser':seconds>0?seconds+' s':'Récolter';
  rounded(28,y,264,65,10,palette.light,palette.edge);
  pixelIcon(seconds===0?GARDEN_FLOWERS[i]:plot?'wash':'explore',56,y+32,3);
  text('Parcelle '+(i+1),85,y+32,12,palette.ink,800,'left');
  pill(169,y+10,106,45,label,seconds>0?null:()=>tendPlot(i));
 }
 const count=state.harvests||0;
 text(count+(count===1?' fleur récoltée':' fleurs récoltées'),160,409,12,palette.ink,800);
 pill(72,425,176,43,'Retour aux jeux',()=>open('games'));
}
function startFireflies(){
 fireflies={sequence:[],cursor:0,rounds:0,started:0,done:false};
 showFireflies(fireflyRules.initialLength);
 open('fireflies');
}
function showFireflies(length){
 while(fireflies.sequence.length<length){
  fireflies.sequence.push(Math.floor(Math.random()*fireflyRules.symbols));
 }
 fireflies.cursor=0;
 fireflies.started=performance.now()+500;
}
function enterFirefly(index){
 const game=fireflies;
 if(index!==game.sequence[game.cursor]){
  finishFireflies();
  return;
 }
 game.cursor++;
 if(game.cursor<game.sequence.length)return;
 game.rounds++;
 if(game.sequence.length===fireflyRules.maxLength)finishFireflies();
 else showFireflies(game.sequence.length+1);
}
function finishFireflies(){
 fireflies.done=true;
 const rounds=fireflies.rounds;
 state.fireflyBest=Math.max(state.fireflyBest||0,rounds);
 gain(rounds*4,rounds*fireflyRules.rewardPerRound);
}
function drawFireflies(t){
 fullPanel('Ronde des lucioles','Observe les lanternes, puis répète leur ordre');
 const game=fireflies;
 const elapsed=t-game.started, period=fireflyRules.flashMs+fireflyRules.gapMs;
 const ready=elapsed>=game.sequence.length*period;
 const lit=elapsed>=0&&elapsed%period<fireflyRules.flashMs?game.sequence[Math.floor(elapsed/period)]:-1;
 const status=game.done?'Rondes réussies : '+game.rounds:ready?'À toi · '+game.cursor+'/'+game.sequence.length:'Observe les lanternes…';
 text(status,160,173,13,'#755057',800);
 for(let i=0;i<lanterns.length;i++){
  const x=53+(i%2)*113,y=198+Math.floor(i/2)*82;
  rounded(x,y,101,70,14,(!game.done&&lit===i)?lanternColors[i]:'#fff8ed','#be9c94',2);
  text(lanterns[i],x+50,y+35,32,'#79565b',800);
  if(ready&&!game.done)tapRects.push({x,y,w:101,h:70,fn:()=>enterFirefly(i)});
 }
 text('Record : '+(state.fireflyBest||0),160,373,12,'#755057',800);
 if(game.done)pill(84,388,152,31,'Rejouer',startFireflies);
 pill(72,430,176,31,'Retour aux jeux',()=>open('games'));
}
function drawProgress(){if(action==='idle'||screen!=='home')return;const p=clamp((performance.now()-actionStart)/(actionEnd-actionStart),0,1);rounded(94,414,132,8,4,'rgba(255,252,234,.77)');rounded(95,415,130*p,6,3,'#dfaab6');}
function drawToast(t){if(t>toastUntil)return;const a=clamp((toastUntil-t)/350,0,1);ctx.save();ctx.globalAlpha=a;rounded(30,5,260,26,12,'rgba(255,250,234,.96)','#d7b6a8',1);text(sceneToast,160,18,12,'#70515b',800);ctx.restore();}
function gameDraw(t){if(action!=='idle'&&t>=actionEnd)action='idle';palette=PALETTES[worldForTime()]||PALETTES.day;ctx.imageSmoothingEnabled=false;tapRects=[];drawBackground(t);drawPony(t);drawClock();
if(screen==='care')drawCare();if(screen==='menu')drawMenu();if(screen==='quests')drawQuests();if(screen==='milestones')drawMilestones();if(screen==='shop')drawShop();if(screen==='explore')drawExplore(t);if(screen==='settings')drawSettings();if(screen==='clock')drawClockEditor();if(screen==='games')drawGames();if(screen==='memory')drawMemory(t);if(screen==='garden')drawGarden();if(screen==='fireflies')drawFireflies(t);if(screen==='arcade')drawArcade(t);
drawHearts(t);if(action!=='idle')drawProgress();drawToast(t);if(exploring&&t-exploring>4700)finishExplore();if(state.brightness<100)rect(0,0,W,H,`rgba(14,17,33,${(100-state.brightness)/120})`);
}
let lastTick=Date.now();function loop(t){if(document.hidden){setTimeout(()=>requestAnimationFrame(loop),500);return;}let dt=Date.now()-lastTick;if(dt>60000){syncDay();if(state.relaxed){state.hunger=clamp(state.hunger-0.04,15,100);state.clean=clamp(state.clean-0.03,20,100);state.energy=clamp(state.energy-0.04,20,100);}lastTick=Date.now();}if(t-lastSave>10000){save();lastSave=t;}if(screen==='care'&&t>hudUntil)open('home');gameDraw(t);requestAnimationFrame(loop);}requestAnimationFrame(loop);
function pick(e){const b=canvas.getBoundingClientRect();return {x:(e.clientX-b.left)*W/b.width,y:(e.clientY-b.top)*H/b.height};}
canvas.addEventListener('pointerdown',e=>{
 if(!e.isPrimary||e.button!==0)return;
 e.preventDefault();
 pointerDown={...pick(e),id:e.pointerId};
 canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener('pointercancel',e=>{
 if(pointerDown?.id===e.pointerId)pointerDown=null;
});
canvas.addEventListener('pointerup',e=>{
 if(pointerDown?.id!==e.pointerId)return;
 e.preventDefault();
 const p=pick(e), origin=pointerDown;
 pointerDown=null;
 if(Math.hypot(p.x-origin.x,p.y-origin.y)>18||p.x<0||p.y<0||p.x>W||p.y>H)return;
 const hit=tapRects.slice().reverse().find(h=>p.x>=h.x&&p.x<=h.x+h.w&&p.y>=h.y&&p.y<=h.y+h.h);
 if(hit){hit.fn();hudUntil=performance.now()+12000;return;}
 if(screen!=='home'&&screen!=='care')return;
 const y=ponyY(performance.now());
 const petHit=p.x>=state.petX+10&&p.x<=state.petX+137&&p.y>=y+12&&p.y<=y+130;
 if(petHit){
  beginAction('pet');
  open('care');
 }else if(screen==='home')open('care');
 else if(p.y<130||(p.y>=182&&p.y<CARE_TOP))open('home');
});
canvas.addEventListener('contextmenu',e=>e.preventDefault());
document.addEventListener('keydown',e=>{if(['Escape','Backspace'].includes(e.key)){if(screen!=='home')open('home');else open('care');e.preventDefault();}if((e.key===' '||e.key==='Enter')&&document.activeElement===canvas){open(screen==='home'?'care':'home');e.preventDefault();}});
window.PonyGotchiDebug={open,world:w=>{state.worldOverride=w;save();},care:beginAction,arcade:startArcade,reset:()=>{if(confirm('Recommencer PonyGotchi ?')){state=defaultState();save();open('home');}},snapshot:()=>({...state,screen})};
for(const [id,fn] of [['quick-care',()=>open('care')],['quick-quests',()=>open('quests')],['quick-game',()=>open('games')],['quick-shop',()=>open('shop')],['quick-auto',()=>{state.worldOverride='auto';save();open('home');}],['quick-day',()=>{state.worldOverride='day';save();open('home');}],['quick-dusk',()=>{state.worldOverride='dusk';save();open('home');}],['quick-night',()=>{state.worldOverride='night';save();open('home')}]]){const el=document.getElementById(id);if(el)el.addEventListener('click',fn);}
document.getElementById('start-arcade')?.addEventListener('click',startArcade);
// Offline backup / restore. No server, no telemetry.
document.getElementById('save-export')?.addEventListener('click',()=>{
 save();const data=JSON.stringify({...state,exportedAt:new Date().toISOString()},null,2);
 const blob=new Blob([data],{type:'application/json'});const url=URL.createObjectURL(blob);
 const a=document.createElement('a');a.href=url;a.download='PonyGotchi_Rosy_sauvegarde.json';a.click();
 setTimeout(()=>URL.revokeObjectURL(url),3000);
});
document.getElementById('save-import')?.addEventListener('click',()=>document.getElementById('save-input')?.click());
document.getElementById('save-input')?.addEventListener('change',async e=>{
 const file=e.target.files?.[0];if(!file)return;
 try{const data=JSON.parse(await file.text());
  if(!data||data.v!==4||!Array.isArray(data.owned)||!Number.isFinite(data.level)||!Number.isFinite(data.coins))throw new Error('Format invalide');
  if(!confirm('Restaurer cette sauvegarde de Rosy ? La partie actuelle sera remplacée.'))return;
  const safe={...defaultState(),...data,owned:data.owned.filter(x=>ITEMS.some(it=>it.id===x)),discoveries:Array.isArray(data.discoveries)?data.discoveries:[],missions:data.missions&&typeof data.missions==='object'?data.missions:{}};
  localStorage.setItem('ponygotchi-studio-v4',JSON.stringify(safe));location.reload();
 }catch(err){toast('Sauvegarde incompatible');}
 e.target.value='';
});
})();
