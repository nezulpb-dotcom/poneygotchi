const PALETTES={
 day:{paper:'#fff4db',edge:'#ac805e',ink:'#503831',light:'#fffbe9',accent:'#65866e',shade:'#2e4b39'},
 dusk:{paper:'#fbe8d9',edge:'#aa7182',ink:'#5c3647',light:'#fff5e9',accent:'#99596b',shade:'#533a56'},
 night:{paper:'#f0e7ed',edge:'#84749d',ink:'#41374f',light:'#fff3ef',accent:'#69648e',shade:'#252340'}
};
const PIXELS={
 eat:['..++...','...+...','.RR.RR.','RRRRRRR','RRRRRRR','.RRRRR.','..R.R..'],
 play:['..BBB..','.BYYBB.','BYBYYBB','BYYYYBB','BBYYBYB','.BBYYB.','..BBB..'],
 wash:['..BBB..','.B...B.','B.W...B','B.W...B','B.....B','.B...B.','..BBB..'],
 sleep:['...YY..','..YY...','.YY....','.YY....','.YY...Y','..YYYY.','...YY..'],
 pet:['.RR.RR.','RRRRRRR','RRRRRRR','.RRRRR.','..RRR..','...R...','.......'],
 quests:['.YYYYY.','BYWWYWY','BYWWYWY','BYWWYWY','BYWWYWY','.YYYYY.','...B...'],
 shop:['..YYY..','.Y...Y.','YYYYYYY','YRRRRRY','YRRWRRY','YRRRRRY','YYYYYYY'],
 explore:['...B...','..BBB..','.BYYBB.','BBYRYBB','.BBYYB.','..BBB..','...B...'],
 games:['...Y...','...Y...','.YYYYY.','YYYYYYY','.YYYYY.','...Y...','...Y...'],
 settings:['..BBB..','.BBBBB.','BB...BB','BB...BB','BB...BB','.BBBBB.','..BBB..'],
 flower:['..R.R..','.RRRRR.','..RYR..','.RRRRR.','..R.R..','...G...','..GGG..'],
 bow:['RR...RR','RRR.RRR','.RRRRR.','..RYR..','.RR.RR.','RR...RR','.......'],
 crown:['Y..Y..Y','YY.Y.YY','YYYYYYY','.YRYRY.','.YYYYY.','.......','.......'],
 necklace:['Y.....Y','Y.....Y','.Y...Y.','..YYY..','...R...','..RRR..','...R...'],
 hat:['..BBB..','..BBB..','.BBBBB.','.YYYYY.','BBBBBBB','.......','.......']
};
const PIXEL_COLORS={R:'#bc4a70',Y:'#b78628',B:'#526999',W:'#fff8dc',G:'#587958','+':'#53704f'};
function pixelIcon(key,x,y,scale=3){
 const rows=PIXELS[key];
 if(!rows)return;
 rows.forEach((row,iy)=>Array.from(row).forEach((color,ix)=>{
  if(color!=='.')rect(Math.round(x-3.5*scale)+ix*scale,Math.round(y-3.5*scale)+iy*scale,scale,scale,PIXEL_COLORS[color]);
 }));
}
