window.Game = window.Game || {};

Game.Level3 = {
  name:"Ночной курятник", width:8000, height:1800,
  platforms:[], spawn:{x:60,y:0},
  finish:{x:7050,y:400,w:80,h:100},
  eggs:[], eggsGot:0, eggsNeed:5,
  bounce:[], hazards:[], hintCd:0,

  init(){
    this.eggsGot=0; this.hintCd=0;
    
    // ============================================================
    // ПЛАТФОРМЫ (27 штук, все переходы проходимы)
    // ============================================================
    this.platforms=[
      // === СЕКЦИЯ 1: СТАРТ (0-800) ===
      {x:0,y:1730,w:800,h:70,type:'ground'},        // [0] пол старта
      
      // === СЕКЦИЯ 2: НАСЕСТЫ (800-2000) ===
      {x:900,y:1730,w:600,h:70,type:'ground'},      // [1] пол насестов
      {x:950,y:1630,w:150,h:16,type:'wood'},        // [2] насест 1
      {x:1150,y:1530,w:150,h:16,type:'wood'},       // [3] насест 2
      {x:1350,y:1430,w:150,h:16,type:'wood'},       // [4] насест 3
      {x:1550,y:1330,w:150,h:16,type:'wood'},       // [5] насест 4
      {x:1750,y:1230,w:150,h:16,type:'wood'},       // [6] насест 5
      
      // === СЕКЦИЯ 3: ЛИФТЫ (2000-3200) ===
      {x:1950,y:1230,w:200,h:16,type:'wood'},       // [7] платформа перед лифтом 1
      {x:2200,y:1230,w:110,h:16,type:'moving',axis:'y',min:800,max:1230,speed:.02},  // [8] лифт 1
      {x:2400,y:800,w:200,h:16,type:'wood'},        // [9] платформа после лифта 1
      {x:2650,y:800,w:110,h:16,type:'moving',axis:'y',min:400,max:800,speed:.02},     // [10] лифт 2
      {x:2850,y:400,w:200,h:16,type:'wood'},        // [11] платформа после лифта 2
      
      // === СЕКЦИЯ 4: БАТУТЫ (3200-4400) ===
      {x:3100,y:400,w:200,h:16,type:'wood'},        // [12] платформа перед батутами
      {x:3400,y:250,w:150,h:16,type:'wood'},        // [13] платформа после батута 1
      {x:3700,y:50,w:150,h:16,type:'wood'},         // [14] платформа после батута 2
      
      // === СЕКЦИЯ 5: ТЕЛЕГИ (4400-5600) ===
      {x:3900,y:150,w:150,h:16,type:'wood'},        // [15] спуск 1
      {x:4100,y:250,w:150,h:16,type:'wood'},        // [16] спуск 2
      {x:4300,y:350,w:150,h:16,type:'wood'},        // [17] спуск 3
      {x:4500,y:400,w:120,h:16,type:'moving',axis:'x',min:4500,max:4900,speed:.025},  // [18] телега 1
      {x:5050,y:400,w:150,h:16,type:'wood'},        // [19] платформа после телеги 1
      {x:5250,y:500,w:120,h:16,type:'moving',axis:'x',min:5250,max:5650,speed:.02},   // [20] телега 2
      {x:5800,y:500,w:150,h:16,type:'wood'},        // [21] платформа после телеги 2
      
      // === СЕКЦИЯ 6: ШИПЫ (5600-6800) ===
      {x:6000,y:600,w:150,h:16,type:'wood'},        // [22] платформа шипов 1
      {x:6200,y:700,w:150,h:16,type:'wood'},        // [23] платформа шипов 2
      {x:6400,y:800,w:150,h:16,type:'wood'},        // [24] платформа шипов 3
      
      // === СЕКЦИЯ 7: ФИНАЛ (6800-8000) ===
      {x:6600,y:800,w:200,h:16,type:'wood'},        // [25] платформа перед финальным батутом
      {x:6900,y:400,w:200,h:16,type:'wood'}         // [26] платформа высоко (после финального батута)
    ];
    
    this.spawn={x:60,y:this.platforms[0].y-Game.Config.PLAYER_H};
    this.finish={x:7000,y:400,w:80,h:100};

    // ============================================================
    // ЯЙЦА (5 штук)
    // ============================================================
    this.eggs=[
      {x:1425,y:1390,got:false},   // на насесте 3
      {x:2500,y:760,got:false},    // на платформе после лифта 1
      {x:3475,y:210,got:false},    // на платформе после батута 1
      {x:5125,y:360,got:false},    // на платформе после телеги 1
      {x:6275,y:660,got:false}     // на платформе шипов 2
    ];
    
    // ============================================================
    // БАТУТЫ (6 штук!)
    // ============================================================
    this.bounce=[
      {x:600,y:1710,w:90,h:20,pw:18},     // обучающий батут на старте
      {x:3150,y:380,w:90,h:20,pw:18},     // батут 1 (перед секцией батутов)
      {x:3450,y:230,w:90,h:20,pw:15},     // батут 2 (после платформы 13)
      {x:6650,y:780,w:100,h:20,pw:25},    // финальный батут (перед дверью)
      {x:5900,y:580,w:90,h:20,pw:20},     // батут на секции шипов
      {x:6500,y:780,w:90,h:20,pw:22}      // батут перед финальной платформой
    ];
    
    // ============================================================
    // ОПАСНЫЕ ЗОНЫ (шипы)
    // ============================================================
    this.hazards=[
      {x:5900,y:1780,w:1000,h:20},   // шипы на дне пропасти (секция 6)
      {x:6150,y:690,w:50,h:10},      // шипы на платформе шипов 2
      {x:6350,y:790,w:50,h:10}       // шипы на платформе шипов 3
    ];

    // ============================================================
    // ВРАГИ (19 штук)
    // ============================================================
    Game.Enemies.spawn([
      {type:'chicken',x:300,plat:0},
      {type:'chicken',x:600,plat:0},
      {type:'goose',x:1000,plat:1},
      {type:'chicken',x:1200,plat:2},
      {type:'goose',x:1400,plat:4},
      {type:'chicken',x:1800,plat:6},
      {type:'goose',x:2000,plat:7},
      {type:'chicken',x:2500,plat:9},
      {type:'goose',x:2900,plat:11},
      {type:'chicken',x:3150,plat:12},
      {type:'goose',x:3450,plat:13},
      {type:'chicken',x:3750,plat:14},
      {type:'goose',x:4350,plat:17},
      {type:'chicken',x:5100,plat:19},
      {type:'goose',x:5850,plat:21},
      {type:'chicken',x:6050,plat:22},
      {type:'goose',x:6250,plat:23},
      {type:'chicken',x:6450,plat:24},
      {type:'goose',x:6700,plat:25}
    ], this.platforms);
  },

  update(p){
    if(this.hintCd>0)this.hintCd--;
    
    // Яйца
    for(const e of this.eggs){
      if(e.got)continue;
      const dx=(p.x+p.w/2)-e.x, dy=(p.y+p.h/2)-e.y;
      if(Math.sqrt(dx*dx+dy*dy)<42){
        e.got=true; this.eggsGot++; p.score+=100;
        Game.Audio.combo(3); Game.Camera.addShake(5); Game.haptic('success');
        Game.UI.replica(`Золотое яйцо! ${this.eggsGot}/${this.eggsNeed}`);
      }
    }
    
    // Батуты
    for(const b of this.bounce){
      const feet=p.y+p.h;
      if(p.x+p.w>b.x&&p.x<b.x+b.w&&feet>=b.y&&feet<=b.y+b.h+12&&p.vy>=0){
        p.y=b.y-p.h; p.vy=-b.pw; p.onGround=false;
        Game.Audio.jump(); Game.Camera.addShake(4);
        Game.Particles.dust(p.x+p.w/2,b.y,10);
      }
    }
    
    // Опасности
    for(const z of this.hazards){
      if(p.x+p.w>z.x&&p.x<z.x+z.w&&p.y+p.h>z.y&&p.y<z.y+z.h){
        if(p.invuln<=0){ p.hurt(1,z.x+z.w/2); Game.UI.replica('Ай! Шипы!'); }
      }
    }
    
    // Подсказка у двери
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

  // ============================================================
  // НОЧНОЕ НЕБО (звёзды + луна)
  // ============================================================
  drawSky(ctx,W,H){
    // Градиент ночного неба
    const g=ctx.createLinearGradient(0,0,0,H);
    g.addColorStop(0,'#0a0a2a');
    g.addColorStop(0.5,'#1a1a3a');
    g.addColorStop(1,'#2a2a4a');
    ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
    
    // Звёзды (детерминированные, не мерцают)
    ctx.fillStyle='#fff';
    for(let i=0;i<100;i++){
      const x=(i*137)%W, y=(i*97)%(H*0.6);
      const r=(i%3===0)?2:1;
      ctx.globalAlpha=0.3+(i%5)*0.15;
      ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();
    }
    ctx.globalAlpha=1;
    
    // Луна
    const mx=W-150, my=100;
    // Свет луны
    const lg=ctx.createRadialGradient(mx,my,30,mx,my,150);
    lg.addColorStop(0,'rgba(245,245,220,.3)');
    lg.addColorStop(1,'rgba(245,245,220,0)');
    ctx.fillStyle=lg;
    ctx.beginPath();ctx.arc(mx,my,150,0,Math.PI*2);ctx.fill();
    // Диск луны
    ctx.fillStyle='#f5f5dc';
    ctx.beginPath();ctx.arc(mx,my,50,0,Math.PI*2);ctx.fill();
    // Кратеры
    ctx.fillStyle='#d5d5bc';
    ctx.beginPath();ctx.arc(mx-15,my-10,10,0,Math.PI*2);ctx.fill();
    ctx.beginPath();ctx.arc(mx+20,my+15,7,0,Math.PI*2);ctx.fill();
    ctx.beginPath();ctx.arc(mx+5,my+5,5,0,Math.PI*2);ctx.fill();
  },

  // ============================================================
  // ПАРАЛЛАКС: тёмные холмы и силуэты деревьев
  // ============================================================
  drawParallax(ctx,W,H){
    const z=Game.Camera.zoom,cam=Game.Camera;
    
    // Тёмные холмы (дальний план)
    ctx.fillStyle='#1a1a2a';
    Game._eachTile(.2,600,W,cam.x,(sx,i)=>{
      ctx.beginPath();ctx.ellipse(sx,H,300*z,150*z,0,Math.PI,0);ctx.fill();
    });
    
    // Силуэты деревьев (средний план)
    ctx.fillStyle='#0a0a1a';
    Game._eachTile(.4,300,W,cam.x,(sx,i)=>{
      const th=120*z+(i%3)*30*z;
      // ствол
      ctx.fillRect(sx,H-th,12*z,th);
      // крона
      ctx.beginPath();ctx.arc(sx+6*z,H-th,35*z,0,Math.PI*2);ctx.fill();
      ctx.beginPath();ctx.arc(sx-15*z,H-th+20*z,28*z,0,Math.PI*2);ctx.fill();
      ctx.beginPath();ctx.arc(sx+27*z,H-th+20*z,28*z,0,Math.PI*2);ctx.fill();
    });
    
    // Светлячки (мерцающие точки)
    const t=Date.now()/1000;
    ctx.fillStyle='rgba(255,255,150,.6)';
    for(let i=0;i<15;i++){
      const x=(i*237+cam.x*.3)%W;
      const y=H*0.3+Math.sin(t+i)*50+(i%5)*80;
      const alpha=0.3+Math.sin(t*2+i)*0.3;
      ctx.globalAlpha=Math.max(0,alpha);
      ctx.beginPath();ctx.arc(x,y,3,0,Math.PI*2);ctx.fill();
    }
    ctx.globalAlpha=1;
  },

  // ============================================================
  // МИР: платформы, батуты, шипы, яйца, дверь
  // ============================================================
  drawWorld(ctx){
    // Платформы
    for(const p of this.platforms){
      if(p.type==='ground'){
        // Ночная земля
        ctx.fillStyle='#2a2a4a';ctx.fillRect(p.x,p.y,p.w,p.h);
        ctx.fillStyle='#4a4a7a';ctx.fillRect(p.x,p.y,p.w,8);
        // Трава
        ctx.strokeStyle='#6a6aaa';ctx.lineWidth=2;
        for(let gx=p.x;gx<p.x+p.w;gx+=24){
          ctx.beginPath();ctx.moveTo(gx,p.y);ctx.lineTo(gx+8,p.y-6);ctx.stroke();
        }
      } else {
        // Ночные деревянные платформы
        ctx.fillStyle=p.type==='moving'?'#7a5a9a':'#5a4a7a';
        ctx.fillRect(p.x,p.y,p.w,p.h);
        ctx.fillStyle='#b0a0d0';ctx.fillRect(p.x,p.y,p.w,3);
        ctx.fillStyle='#3a2a5a';ctx.fillRect(p.x,p.y+p.h-3,p.w,3);
        if(p.type==='moving'){
          ctx.fillStyle='#fff3b0';ctx.font='bold 16px sans-serif';ctx.textAlign='center';
          ctx.fillText(p.axis==='x'?'↔':'↕',p.x+p.w/2,p.y+15);ctx.textAlign='left';
        }
      }
    }
    
    // Батуты (светящиеся)
    for(const b of this.bounce){
      // Ножки
      ctx.strokeStyle='#4a4a7a';ctx.lineWidth=4;
      ctx.beginPath();ctx.moveTo(b.x+10,b.y+20);ctx.lineTo(b.x+20,b.y+40);ctx.stroke();
      ctx.beginPath();ctx.moveTo(b.x+b.w-10,b.y+20);ctx.lineTo(b.x+b.w-20,b.y+40);ctx.stroke();
      // Рама
      ctx.fillStyle='#d00';ctx.beginPath();
      ctx.ellipse(b.x+b.w/2,b.y+12,b.w/2,14,0,0,Math.PI*2);ctx.fill();
      // Сетка
      ctx.fillStyle='#1a1a3a';ctx.beginPath();
      ctx.ellipse(b.x+b.w/2,b.y+12,b.w/2-8,10,0,0,Math.PI*2);ctx.fill();
      // Пружины
      ctx.strokeStyle='#f5d76e';ctx.lineWidth=2;
      for(let i=0;i<5;i++){
        const x=b.x+15+i*(b.w-30)/4;
        ctx.beginPath();ctx.moveTo(x,b.y+22);ctx.lineTo(x+5,b.y+35);ctx.stroke();
      }
    }
    
    // Опасности (шипы)
    for(const z of this.hazards){
      ctx.fillStyle='#c0c0c0';
      for(let i=0;i<z.w;i+=16){
        ctx.beginPath();
        ctx.moveTo(z.x+i,z.y+16);
        ctx.lineTo(z.x+i+8,z.y);
        ctx.lineTo(z.x+i+16,z.y+16);
        ctx.closePath();ctx.fill();
      }
    }
    
    // Яйца (светящиеся)
    for(const e of this.eggs){
      if(e.got)continue;
      const y=e.y+Math.sin(Date.now()/180)*5;
      // Свечение
      const gl=ctx.createRadialGradient(e.x,y,5,e.x,y,30);
      gl.addColorStop(0,'rgba(255,215,0,.4)');
      gl.addColorStop(1,'rgba(255,215,0,0)');
      ctx.fillStyle=gl;
      ctx.beginPath();ctx.arc(e.x,y,30,0,Math.PI*2);ctx.fill();
      // Яйцо
      const g=ctx.createRadialGradient(e.x-4,y-8,2,e.x,y,22);
      g.addColorStop(0,'#fff8b0');g.addColorStop(.4,'#ffd700');g.addColorStop(1,'#b8860b');
      ctx.fillStyle=g;ctx.beginPath();ctx.ellipse(e.x,y,13,18,0,0,Math.PI*2);ctx.fill();
    }
    
    // Дверь-финиш
    const f=this.finish, open=this.eggsGot>=this.eggsNeed;
    // Свечение вокруг двери
    const dg=ctx.createRadialGradient(f.x+f.w/2,f.y-f.h/2,10,f.x+f.w/2,f.y-f.h/2,100);
    dg.addColorStop(0,open?'rgba(75,124,46,.3)':'rgba(92,31,31,.3)');
    dg.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=dg;
    ctx.beginPath();ctx.arc(f.x+f.w/2,f.y-f.h/2,100,0,Math.PI*2);ctx.fill();
    // Дверь
    ctx.fillStyle=open?'#4b7c2e':'#5c1f1f';
    ctx.fillRect(f.x,f.y-f.h,f.w,f.h);
    ctx.fillStyle=open?'#2e5c1a':'#2a0e0e';
    ctx.fillRect(f.x+7,f.y-f.h+7,f.w-14,f.h-14);
    // Надпись
    ctx.fillStyle='#fff';ctx.font='bold 13px sans-serif';ctx.textAlign='center';
    ctx.fillText(open?'ВЫХОД':`🥚${this.eggsGot}/${this.eggsNeed}`,f.x+f.w/2,f.y-f.h-10);
    ctx.textAlign='left';
  }
};