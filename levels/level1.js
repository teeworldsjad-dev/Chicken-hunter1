window.Game = window.Game || {};

Game.Level1 = {
  name:"Деревня", width:3200, height:420,
  platforms:[], finishX:3080, spawn:{x:60,y:0},

  init(){
    // индекс 0 — земля
    this.platforms=[
      {x:0,y:350,w:3200,h:70,type:'ground'},
      {x:420,y:270,w:120,h:16,type:'wood'},
      {x:640,y:210,w:100,h:16,type:'wood'},
      {x:880,y:160,w:130,h:16,type:'wood'},
      {x:1150,y:250,w:110,h:16,type:'wood'},
      {x:1380,y:190,w:120,h:16,type:'wood'},
      {x:1650,y:130,w:110,h:16,type:'wood'},
      {x:1900,y:240,w:130,h:16,type:'wood'},
      {x:2150,y:180,w:120,h:16,type:'wood'},
      {x:2400,y:250,w:110,h:16,type:'wood'},
      {x:2650,y:190,w:130,h:16,type:'wood'},
      {x:2900,y:130,w:120,h:16,type:'wood'}
    ];
    this.spawn={x:60,y:this.platforms[0].y-Game.Config.PLAYER_H};
    Game.Enemies.spawn([
      {type:'chicken',x:480,plat:0},{type:'chicken',x:640,plat:0},
      {type:'chicken',x:900,plat:3},{type:'goose',x:1050,plat:0},
      {type:'chicken',x:1200,plat:4},{type:'chicken',x:1420,plat:5},
      {type:'goose',x:1550,plat:0},{type:'chicken',x:1700,plat:6},
      {type:'chicken',x:1950,plat:7},{type:'goose',x:2050,plat:0},
      {type:'chicken',x:2200,plat:8},{type:'goose',x:2450,plat:9},
      {type:'chicken',x:2700,plat:10},{type:'goose',x:2950,plat:11},
      {type:'chicken',x:2880,plat:0}
    ], this.platforms);
  },

  update(p){},

  checkWin(p){ return p.x>=this.finishX; },

  drawSky(ctx,W,H){
    const g=ctx.createLinearGradient(0,0,0,H);
    g.addColorStop(0,'#87CEEB');g.addColorStop(.65,'#B8E4F0');g.addColorStop(1,'#E8F6FF');
    ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
    const sx=W-100,sy=90;
    ctx.save();ctx.translate(sx,sy);ctx.rotate(Date.now()/6000);
    ctx.fillStyle='rgba(255,240,120,.22)';
    for(let i=0;i<12;i++){ctx.rotate(Math.PI/6);
      ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(-13,-100);ctx.lineTo(13,-100);ctx.closePath();ctx.fill();}
    ctx.restore();
    const rg=ctx.createRadialGradient(sx,sy,8,sx,sy,55);
    rg.addColorStop(0,'#FFFACD');rg.addColorStop(.5,'#FFD700');rg.addColorStop(1,'rgba(255,200,0,0)');
    ctx.fillStyle=rg;ctx.beginPath();ctx.arc(sx,sy,55,0,Math.PI*2);ctx.fill();
  },

  drawParallax(ctx,W,H){
    const z=Game.Camera.zoom,cx=Game.Camera.x;
    // облака
    Game._eachTile(.1,300,W,cx,(sx,i)=>{
      const y=40+(i%3)*30;
      ctx.fillStyle='rgba(255,255,255,.85)';
      ctx.beginPath();ctx.arc(sx,y,22*z,0,Math.PI*2);ctx.arc(sx+28*z,y-8*z,26*z,0,Math.PI*2);ctx.arc(sx+56*z,y,20*z,0,Math.PI*2);ctx.fill();
    });
    // холмы
    Game._eachTile(.25,500,W,cx,(sx,i)=>{
      ctx.fillStyle='#7ea355';
      ctx.beginPath();ctx.ellipse(sx,H,240*z,110*z,0,Math.PI,0);ctx.fill();
    });
    // дома
    Game._eachTile(.55,420,W,cx,(sx,i)=>{
      const hy=H-70*z,hw=110*z,hh=80*z;
      ctx.fillStyle=['#c97b4a','#a0522d','#8b6f47'][i%3];
      ctx.fillRect(sx,hy-hh,hw,hh);
      ctx.fillStyle='#8b2020';
      ctx.beginPath();ctx.moveTo(sx-10*z,hy-hh);ctx.lineTo(sx+hw/2,hy-hh-40*z);ctx.lineTo(sx+hw+10*z,hy-hh);ctx.closePath();ctx.fill();
      ctx.fillStyle='#9fd8ef';ctx.fillRect(sx+hw*.2,hy-hh+22*z,24*z,24*z);ctx.fillRect(sx+hw*.55,hy-hh+22*z,24*z,24*z);
      ctx.fillStyle='#3d2817';ctx.fillRect(sx+hw/2-10*z,hy-34*z,20*z,34*z);
    });
  },

  drawWorld(ctx){
    // платформы
    for(const p of this.platforms){
      if(p.type==='ground'){
        ctx.fillStyle='#6b4423';ctx.fillRect(p.x,p.y,p.w,p.h);
        ctx.fillStyle='#4a7c2e';ctx.fillRect(p.x,p.y,p.w,10);
        ctx.strokeStyle='#3d6b1f';ctx.lineWidth=2;
        for(let gx=p.x;gx<p.x+p.w;gx+=20){
          ctx.beginPath();ctx.moveTo(gx,p.y);ctx.lineTo(gx+2,p.y-5);
          ctx.moveTo(gx+8,p.y);ctx.lineTo(gx+10,p.y-4);ctx.stroke();}
      } else {
        ctx.fillStyle='#8b5a2b';ctx.fillRect(p.x,p.y,p.w,p.h);
        ctx.fillStyle='#6b4423';ctx.fillRect(p.x,p.y+p.h-3,p.w,3);
        ctx.strokeStyle='#5c3a1e';ctx.lineWidth=1;
        for(let dx=0;dx<p.w;dx+=20){ctx.beginPath();ctx.moveTo(p.x+dx,p.y);ctx.lineTo(p.x+dx,p.y+p.h);ctx.stroke();}
      }
    }
    // финишный флаг
    const x=this.finishX,y=350;
    ctx.fillStyle='#8b4513';ctx.fillRect(x,y-150,6,150);
    ctx.fillStyle='#e63946';ctx.beginPath();ctx.moveTo(x+6,y-150);ctx.lineTo(x+66,y-130);ctx.lineTo(x+6,y-110);ctx.closePath();ctx.fill();
    ctx.fillStyle='#fff';ctx.font='bold 13px sans-serif';ctx.fillText('ФИНИШ',x+12,y-126);
  }
};

// помощник параллакса (тайлинг)
Game._eachTile=function(p,spacing,W,camX,cb){
  const off=camX*p, z=Game.Camera.zoom;
  const start=Math.floor((off-200)/spacing), end=Math.ceil((off+W/z+200)/spacing);
  for(let i=start;i<=end;i++) cb((i*spacing-off)*z, i);
};