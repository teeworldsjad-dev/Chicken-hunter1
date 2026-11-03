window.Game = window.Game || {};

Game.Level2 = {
  name:"Курятник", width:5600, height:1400,
  platforms:[], spawn:{x:60,y:0},
  finish:{x:5350,y:360,w:80,h:100},
  eggs:[], eggsGot:0, eggsNeed:3,
  bounce:[], hazards:[], hintCd:0,

  init(){
    this.eggsGot=0; this.hintCd=0;
    this.platforms=[
      // полы с провалами
      {x:0,y:1330,w:800,h:70,type:'ground'},        // 0
      {x:1100,y:1330,w:650,h:70,type:'ground'},     // 1
      {x:2100,y:1330,w:700,h:70,type:'ground'},     // 2
      {x:3200,y:1330,w:800,h:70,type:'ground'},     // 3
      {x:4400,y:1330,w:1200,h:70,type:'ground'},    // 4
      // насесты (подъём)
      {x:250,y:1200,w:150,h:16,type:'wood'},        // 5
      {x:500,y:1090,w:150,h:16,type:'wood'},        // 6
      {x:760,y:980,w:160,h:16,type:'wood'},         // 7
      {x:1040,y:880,w:170,h:16,type:'wood'},        // 8
      // лифт-зона
      {x:1500,y:820,w:180,h:16,type:'wood'},        // 9
      // лифт вертикальный
      {x:1750,y:1200,w:110,h:16,type:'moving',axis:'y',min:760,max:1200,speed:.02}, // 10
      {x:2000,y:760,w:180,h:16,type:'wood'},        // 11
      // спуск
      {x:2280,y:880,w:160,h:16,type:'wood'},        // 12
      {x:2540,y:1010,w:160,h:16,type:'wood'},       // 13
      {x:2800,y:1150,w:160,h:16,type:'wood'},       // 14
      // телега горизонтальная
      {x:3050,y:1250,w:120,h:16,type:'moving',axis:'x',min:3050,max:3450,speed:.025}, // 15
      // подъём на чердак
      {x:3600,y:1180,w:160,h:16,type:'wood'},       // 16
      {x:3860,y:1060,w:160,h:16,type:'wood'},       // 17
      {x:4120,y:940,w:160,h:16,type:'wood'},        // 18
      {x:4380,y:820,w:160,h:16,type:'wood'},        // 19
      {x:4640,y:700,w:160,h:16,type:'wood'},        // 20
      {x:4900,y:580,w:160,h:16,type:'wood'},        // 21
      // второй лифт
      {x:5150,y:700,w:110,h:16,type:'moving',axis:'y',min:420,max:700,speed:.02}, // 22
      // финал
      {x:5300,y:460,w:300,h:16,type:'wood'}         // 23
    ];
    this.spawn={x:60,y:this.platforms[0].y-Game.Config.PLAYER_H};
    this.finish={x:5400,y:460,w:80,h:100};

    this.eggs=[
      {x:1110,y:840,got:false},
      {x:2620,y:970,got:false},
      {x:4720,y:660,got:false}
    ];
    this.bounce=[
      {x:880,y:1310,w:90,h:20,pw:17},
      {x:3250,y:1310,w:100,h:20,pw:17},
      {x:4500,y:1310,w:100,h:20,pw:18}
    ];
    this.hazards=[
      {x:980,y:1312,w:90,h:18},
      {x:1900,y:1312,w:120,h:18},
      {x:4150,y:1312,w:130,h:18}
    ];

    Game.Enemies.spawn([
      {type:'chicken',x:300,plat:0},{type:'chicken',x:560,plat:0},
      {type:'goose',x:1200,plat:1},{type:'chicken',x:1550,plat:9},
      {type:'chicken',x:2050,plat:11},{type:'goose',x:2330,plat:12},
      {type:'chicken',x:2590,plat:13},{type:'goose',x:2850,plat:14},
      {type:'chicken',x:3650,plat:16},{type:'goose',x:3910,plat:17},
      {type:'chicken',x:4170,plat:18},{type:'goose',x:4430,plat:19},
      {type:'chicken',x:4690,plat:20},{type:'goose',x:4950,plat:21},
      {type:'goose',x:5380,plat:23},{type:'chicken',x:2200,plat:2},
      {type:'goose',x:3400,plat:3},{type:'chicken',x:4600,plat:4}
    ], this.platforms);
  },

  update(p){
    if(this.hintCd>0)this.hintCd--;
    // яйца
    for(const e of this.eggs){
      if(e.got)continue;
      const dx=(p.x+p.w/2)-e.x, dy=(p.y+p.h/2)-e.y;
      if(Math.sqrt(dx*dx+dy*dy)<42){
        e.got=true; this.eggsGot++; p.score+=100;
        Game.Audio.combo(3); Game.Camera.addShake(5); Game.haptic('success');
        Game.UI.replica(`Золотое яйцо! ${this.eggsGot}/${this.eggsNeed}`);
      }
    }
    // батуты
    for(const b of this.bounce){
      const feet=p.y+p.h;
      if(p.x+p.w>b.x&&p.x<b.x+b.w&&feet>=b.y&&feet<=b.y+b.h+12&&p.vy>=0){
        p.y=b.y-p.h; p.vy=-b.pw; p.onGround=false;
        Game.Audio.jump(); Game.Camera.addShake(4);
        Game.Particles.dust(p.x+p.w/2,b.y,10);
      }
    }
    // опасности
    for(const z of this.hazards){
      if(p.x+p.w>z.x&&p.x<z.x+z.w&&p.y+p.h>z.y&&p.y<z.y+z.h){
        if(p.invuln<=0){ p.hurt(1,z.x+z.w/2); Game.UI.replica('Ай! Щепки!'); }
      }
    }
    // подсказка у двери
    const near=p.x>this.finish.x-120&&p.x<this.finish.x+160&&Math.abs(p.y-(this.finish.y-p.h))<120;
    if(near&&this.eggsGot<this.eggsNeed&&this.hintCd<=0){
      Game.UI.replica(`Дверь закрыта: яйца ${this.eggsGot}/${this.eggsNeed}`);
      this.hintCd=180;
    }
  },

  checkWin(p){
    if(this.eggsGot<this.eggsNeed)return false;
    return p.x>this.finish.x-20&&p.x<this.finish.x+this.finish.w&&
           p.y>this.finish.y-this.finish.h&&p.y<this.finish.y+20;
  },

  drawSky(ctx,W,H){
    const g=ctx.createLinearGradient(0,0,0,H);
    g.addColorStop(0,'#2b170c');g.addColorStop(.5,'#4a2a14');g.addColorStop(1,'#241208');
    ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
  },

  drawParallax(ctx,W,H){
    const z=Game.Camera.zoom,cam=Game.Camera;
    // доски задника
    ctx.fillStyle='rgba(0,0,0,.18)';
    const ph=82*z;
    for(let y=-ph;y<H+ph;y+=ph){
      const wy=y - (cam.y*.3)%ph;
      ctx.fillRect(0,wy,W,2);
    }
    // балки
    Game._eachTile(.4,420,W,cam.x,(sx)=>{
      ctx.fillStyle='rgba(0,0,0,.28)';ctx.fillRect(sx,0,30*z,H);
    });
    // ворота
    Game._eachTile(.55,1400,W,cam.x,(sx,i)=>{
      const gw=220*z,gh=260*z,gy=H-40*z;
      ctx.fillStyle='#2a1409';ctx.fillRect(sx,gy-gh,gw,gh);
      ctx.fillStyle='#6b3d1e';ctx.fillRect(sx+12*z,gy-gh+12*z,gw-24*z,gh-24*z);
      ctx.strokeStyle='#2a1409';ctx.lineWidth=6*z;
      ctx.beginPath();ctx.moveTo(sx+gw/2,gy-gh+12*z);ctx.lineTo(sx+gw/2,gy-12*z);
      ctx.moveTo(sx+16*z,gy-gh+20*z);ctx.lineTo(sx+gw-16*z,gy-20*z);
      ctx.moveTo(sx+gw-16*z,gy-gh+20*z);ctx.lineTo(sx+16*z,gy-20*z);ctx.stroke();
      ctx.fillStyle='#d4af37';
      ctx.beginPath();ctx.arc(sx+gw/2-12*z,gy-gh/2,5*z,0,Math.PI*2);ctx.arc(sx+gw/2+12*z,gy-gh/2,5*z,0,Math.PI*2);ctx.fill();
    });
  },

  drawWorld(ctx){
    for(const p of this.platforms){
      if(p.type==='ground'){
        ctx.fillStyle='#5c3a1e';ctx.fillRect(p.x,p.y,p.w,p.h);
        ctx.fillStyle='#8b5a2b';ctx.fillRect(p.x,p.y,p.w,8);
        ctx.strokeStyle='#d4af37';ctx.lineWidth=1.5;
        for(let gx=p.x;gx<p.x+p.w;gx+=24){
          ctx.beginPath();ctx.moveTo(gx,p.y);ctx.lineTo(gx+8,p.y-6);ctx.stroke();}
      } else {
        ctx.fillStyle=p.type==='moving'?'#a0522d':'#8b5a2b';
        ctx.fillRect(p.x,p.y,p.w,p.h);
        ctx.fillStyle='#d4af37';ctx.fillRect(p.x,p.y,p.w,3);
        ctx.fillStyle='#5c3a1e';ctx.fillRect(p.x,p.y+p.h-3,p.w,3);
        if(p.type==='moving'){
          ctx.fillStyle='#fff3b0';ctx.font='bold 16px sans-serif';ctx.textAlign='center';
          ctx.fillText(p.axis==='x'?'↔':'↕',p.x+p.w/2,p.y+15);ctx.textAlign='left';
        }
      }
    }
    // батуты
    for(const b of this.bounce){
      ctx.fillStyle='#d4af37';ctx.beginPath();ctx.ellipse(b.x+b.w/2,b.y+12,b.w/2,16,0,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle='#f5d76e';ctx.lineWidth=2;
      for(let i=0;i<8;i++){ctx.beginPath();ctx.moveTo(b.x+10+i*10,b.y+12);ctx.lineTo(b.x+18+i*10,b.y-4);ctx.stroke();}
    }
    // опасности
    for(const z of this.hazards){
      ctx.fillStyle='#d9d9d9';
      for(let i=0;i<z.w;i+=16){
        ctx.beginPath();ctx.moveTo(z.x+i,z.y+16);ctx.lineTo(z.x+i+8,z.y);ctx.lineTo(z.x+i+16,z.y+16);ctx.closePath();ctx.fill();}
    }
    // яйца
    for(const e of this.eggs){
      if(e.got)continue;
      const y=e.y+Math.sin(Date.now()/180)*5;
      const g=ctx.createRadialGradient(e.x-4,y-8,2,e.x,y,22);
      g.addColorStop(0,'#fff8b0');g.addColorStop(.4,'#ffd700');g.addColorStop(1,'#b8860b');
      ctx.fillStyle=g;ctx.beginPath();ctx.ellipse(e.x,y,13,18,0,0,Math.PI*2);ctx.fill();
    }
    // дверь-финиш
    const f=this.finish, open=this.eggsGot>=this.eggsNeed;
    ctx.fillStyle=open?'#4b7c2e':'#5c1f1f';ctx.fillRect(f.x,f.y-f.h,f.w,f.h);
    ctx.fillStyle=open?'#2e5c1a':'#2a0e0e';ctx.fillRect(f.x+7,f.y-f.h+7,f.w-14,f.h-14);
    ctx.fillStyle='#fff';ctx.font='bold 13px sans-serif';ctx.textAlign='center';
    ctx.fillText(open?'ВЫХОД':`🥚${this.eggsGot}/${this.eggsNeed}`,f.x+f.w/2,f.y-f.h-10);
    ctx.textAlign='left';
  }
};