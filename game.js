'use strict';
const G = window.Game = window.Game || {};

/* ============ TELEGRAM ============ */
G.tg = window.Telegram ? window.Telegram.WebApp : null;
if (G.tg) { try { G.tg.ready(); G.tg.expand(); } catch(e){} }
G.haptic = function(type){
  try{
    if(!G.tg || !G.tg.HapticFeedback) return;
    if(type==='light'||type==='medium'||type==='heavy') G.tg.HapticFeedback.impactOccurred(type);
    else G.tg.HapticFeedback.notificationOccurred(type);
  }catch(e){}
};

/* ============ КОНФИГ ============ */
G.Config = {
  VISIBLE_H: 420,
  GRAVITY: 0.55,
  MOVE: 4,
  JUMP: 16,
  PLAYER_W: 34,
  PLAYER_H: 60,
  MAX_HP: 4,
  INVULN: 90,
  WEAPONS: {
    rifle:  {pellets:5, spread:.14, speed:9,  life:26, dmg:1, cd:32, recoil:6, shake:6},
    pistol: {pellets:1, spread:.02, speed:11, life:50, dmg:1, cd:12, recoil:2, shake:1.5}
  },
  ENEMY: {
    chicken:{w:40,h:38,hp:1,speed:.9,points:10,stranglePoints:30,fleeR:150,fleeSpd:2.2},
    goose:  {w:54,h:56,hp:2,speed:1.1,points:25,dmg:1,chaseR:220,chaseSpd:1.9,atkCd:70}
  },
  STRANGLE:{radius:52,duration:180,comboWindow:180,rageAt:5,rageTime:300,rageSpeed:1.4,phase1:40,phase2:150,killAt:15},
  CHARACTERS: {
    misha:{ name:"МИША", shirt:"#2E8B57", pants:"#1a4d2e", weapon:"rifle",
      replicas:["Курица, ты обречена!","За всех мужиков, которые боятся кур!",
        "Мама говорила не стрелять в кур... мама была не права","Я не маньяк. Я — профессионал",
        "Это не охота. Это — зачистка","В городе я менеджер. Здесь я — легенда",
        "Курицы, сдавайтесь!","Ещё одна, и я стану богом","Деревня, я тебя спас!","Тюх-тюх!"]},
    alena:{ name:"АЛЁНА", shirt:"#8B4513", pants:"#3d2817", weapon:"pistol",
      replicas:["Ой, какая милая...","Иди ко мне, маленькая...","Это не жестокость. Это — искусство",
        "Руки не для маникюра. Руки — для кур","В деревне все меня боятся. И правильно делают",
        "Миша, учись","Курицы, не убегайте. Будет быстро","Следующая!","Я в форме!","Тихо, тихо... всё"],
      strangleReplicas:["Кайф. Никогда не надоест","Опять? Ну ладно, ещё одну","Тихо, тихо... всё, готово",
        "Следующая!","Кто тут у нас красивый? Ты красивый. Мёртвый красивый","Мама, я опять в деревне!",
        "Миша, учись","Одна вниз. Девять впереди","Прости, курочка. Не прости. Кайф","Я в форме!"]}
  }
};

G.Stats = { chickens:0, geese:0, strangled:0, shots:0, maxCombo:0 };
G.Stats.reset = function(){ this.chickens=0;this.geese=0;this.strangled=0;this.shots=0;this.maxCombo=0; };

/* ============ ЗВУК ============ */
G.Audio = {
  ctx:null, on:true,
  init(){ try{ const A=window.AudioContext||window.webkitAudioContext; this.ctx=new A(); }catch(e){ this.on=false; } },
  resume(){ if(this.ctx&&this.ctx.state==='suspended') this.ctx.resume(); },
  _t(type,f0,f1,dur,vol,delay){
    if(!this.on||!this.ctx)return; delay=delay||0;
    const t=this.ctx.currentTime+delay, o=this.ctx.createOscillator(), g=this.ctx.createGain();
    o.type=type; o.frequency.setValueAtTime(f0,t);
    o.frequency.exponentialRampToValueAtTime(Math.max(20,f1),t+dur);
    g.gain.setValueAtTime(vol,t); g.gain.exponentialRampToValueAtTime(0.001,t+dur);
    o.connect(g).connect(this.ctx.destination); o.start(t); o.stop(t+dur);
  },
  _n(dur,vol,freq,delay){
    if(!this.on||!this.ctx)return; delay=delay||0;
    const t=this.ctx.currentTime+delay, len=Math.floor(this.ctx.sampleRate*dur);
    const buf=this.ctx.createBuffer(1,len,this.ctx.sampleRate), d=buf.getChannelData(0);
    for(let i=0;i<len;i++) d[i]=(Math.random()*2-1)*(1-i/len);
    const s=this.ctx.createBufferSource(); s.buffer=buf;
    const f=this.ctx.createBiquadFilter(); f.type='lowpass'; f.frequency.setValueAtTime(freq,t);
    const g=this.ctx.createGain(); g.gain.setValueAtTime(vol,t);
    g.gain.exponentialRampToValueAtTime(0.001,t+dur);
    s.connect(f).connect(g).connect(this.ctx.destination); s.start(t);
  },
  shoot(w){ if(w==='rifle'){ this._n(.22,.35,1800); this._t('sawtooth',180,40,.18,.25);} 
            else{ this._t('square',900,150,.08,.14); this._n(.05,.1,3000);} },
  jump(){ this._t('sine',300,600,.1,.09); },
  chickenDeath(){ this._t('sawtooth',620,320,.06,.11,0); this._t('sawtooth',540,260,.06,.11,.08); this._t('sawtooth',460,180,.1,.11,.16); this._n(.12,.1,1200,.2); },
  gooseDeath(){ this._t('sawtooth',320,180,.14,.18,0); this._t('sawtooth',240,70,.35,.18,.13); this._n(.2,.12,900,.1); },
  honk(){ this._t('sawtooth',380,300,.16,.14); this._t('sawtooth',300,240,.14,.12,.14); },
  strangle(){ this._n(.09,.22,2600); this._t('square',260,90,.07,.12,.02); this._t('sawtooth',700,200,.05,.08,.1); },
  blood(){ this._n(.18,.22,700); },
  hurt(){ this._t('sawtooth',160,50,.3,.24); this._n(.15,.15,500); },
  combo(l){ this._t('triangle',500+Math.min(l,8)*90,(500+Math.min(l,8)*90)*1.5,.12,.14); },
  beep(){ this._t('triangle',800,700,.09,.06); },
  win(){ [523,659,784,1047].forEach((f,i)=>this._t('triangle',f,f,.28,.18,i*.14)); },
  gameover(){ [400,330,260,180].forEach((f,i)=>this._t('sawtooth',f,f*.8,.3,.18,i*.18)); }
};

/* ============ ВВОД ============ */
G.Input = {
  keys:{}, touch:{left:false,right:false,jump:false,shoot:false,strangle:false},
  jumpPress:false, stranglePress:false,
  init(){
    window.addEventListener('keydown',e=>{
      if(!this.keys[e.code]){
        if(e.code==='ArrowUp'||e.code==='KeyW'||e.code==='Space') this.jumpPress=true;
        if(e.code==='KeyE') this.stranglePress=true;
      }
      this.keys[e.code]=true;
      if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code)) e.preventDefault();
    });
    window.addEventListener('keyup',e=>this.keys[e.code]=false);
    window.addEventListener('blur',()=>this.reset());
    this._bind('bLeft','left'); this._bind('bRight','right'); this._bind('bJump','jump');
    this._bind('bShoot','shoot'); this._bind('bStrangle','strangle');
  },
  _bind(id,act){
    const el=document.getElementById(id); if(!el)return;
    const down=e=>{e.preventDefault();
      if(act==='jump'&&!this.touch.jump) this.jumpPress=true;
      if(act==='strangle'&&!this.touch.strangle) this.stranglePress=true;
      this.touch[act]=true; el.classList.add('on');};
    const up=e=>{if(e)e.preventDefault(); this.touch[act]=false; el.classList.remove('on');};
    el.addEventListener('pointerdown',down);
    el.addEventListener('pointerup',up);
    el.addEventListener('pointercancel',up);
    el.addEventListener('pointerleave',up);
  },
  left(){return !!(this.keys.ArrowLeft||this.keys.KeyA||this.touch.left);},
  right(){return !!(this.keys.ArrowRight||this.keys.KeyD||this.touch.right);},
  reset(){ this.keys={}; for(const k in this.touch) this.touch[k]=false; this.jumpPress=false; this.stranglePress=false; },
  endFrame(){ this.jumpPress=false; this.stranglePress=false; }
};

/* ============ КАМЕРА ============ */
G.Camera = {
  x:0,y:0,zoom:1,shake:0,W:0,H:0,lw:0,lh:0,
  viewport(W,H){ this.W=W; this.H=H; this.zoom=H/G.Config.VISIBLE_H; },
  setBounds(w,h){ this.lw=w; this.lh=h; },
  follow(p){
    const vw=this.W/this.zoom, vh=this.H/this.zoom;
    let tx=p.x+p.w/2-vw/2, ty=p.y+p.h/2-vh/2-10;
    tx=this.lw<=vw?(this.lw-vw)/2:Math.max(0,Math.min(tx,this.lw-vw));
    ty=this.lh<=vh?(this.lh-vh)/2:Math.max(0,Math.min(ty,this.lh-vh));
    this.x+=(tx-this.x)*0.12; this.y+=(ty-this.y)*0.12;
  },
  addShake(a){ this.shake=Math.max(this.shake,a); },
  shakeOffset(){
    if(this.shake>0.5){ this.shake*=0.85;
      return [(Math.random()-.5)*this.shake,(Math.random()-.5)*this.shake]; }
    return [0,0];
  },
  reset(){ this.x=0;this.y=0;this.shake=0; }
};

/* ============ ЧАСТИЦЫ ============ */
G.Particles = {
  list:[], decals:[], MAX:400, MAXD:70,
  reset(){ this.list.length=0; this.decals.length=0; },
  _add(p){ if(this.list.length>=this.MAX) this.list.shift(); this.list.push(p); },
  blood(x,y,pw){
    pw=pw||1; const cols=['#c1121f','#8b0000','#e63946','#a4161a'];
    for(let i=0;i<Math.floor(18*pw);i++){
      const a=Math.random()*Math.PI*2,s=2+Math.random()*7*pw;
      this._add({t:'blood',x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-2,sz:2+Math.random()*3,
        c:cols[(Math.random()*cols.length)|0],life:90+Math.random()*90,g:.42,b:.25,r:0,vr:0});
    }
    for(let i=0;i<Math.floor(5*pw);i++){
      const a=-Math.PI/2+(Math.random()-.5)*2.4,s=3+Math.random()*6;
      this._add({t:'gib',x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,sz:4+Math.random()*4,
        c:['#8b0000','#6b1010','#fff'][(Math.random()*3)|0],life:150,g:.5,b:.35,r:Math.random()*6,vr:(Math.random()-.5)*.5});
    }
  },
  feathers(x,y,c,n){
    n=n||12; c=c||'#fff';
    for(let i=0;i<n;i++){ const a=Math.random()*Math.PI*2,s=1+Math.random()*4;
      this._add({t:'feather',x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-2,sz:3+Math.random()*4,
        c,life:110+Math.random()*70,g:.12,b:0,r:Math.random()*6,vr:(Math.random()-.5)*.3}); }
  },
  dust(x,y,n){
    n=n||5; for(let i=0;i<n;i++) this._add({t:'dust',x,y,vx:(Math.random()-.5)*2.5,vy:-Math.random()*1.6,
      sz:2+Math.random()*3,c:'#c8b48a',life:25+Math.random()*15,g:.04,b:0,r:0,vr:0});
  },
  update(groundY){
    for(let i=this.list.length-1;i>=0;i--){
      const p=this.list[i]; p.vy+=p.g; if(p.t==='feather')p.vx*=.97;
      p.x+=p.vx;p.y+=p.vy;p.r+=p.vr;p.life--;
      if(p.y>=groundY){ p.y=groundY;
        if(p.b>0&&Math.abs(p.vy)>1){p.vy=-p.vy*p.b;p.vx*=.6;}
        else{ if((p.t==='blood'||p.t==='gib')&&Math.random()<.25)this._splat(p.x,groundY);
          p.vy=0;p.vx*=.8;p.life=Math.min(p.life,25);} }
      if(p.life<=0) this.list.splice(i,1);
    }
    for(let i=this.decals.length-1;i>=0;i--){ if(--this.decals[i].life<=0) this.decals.splice(i,1); }
  },
  _splat(x,y){ if(this.decals.length>=this.MAXD)this.decals.shift();
    this.decals.push({x:x+(Math.random()-.5)*30,y:y+2+Math.random()*6,r:5+Math.random()*12,life:900}); },
  draw(ctx){
    for(const d of this.decals){ ctx.globalAlpha=Math.min(1,d.life/300)*.55; ctx.fillStyle='#7a0d0d';
      ctx.beginPath(); ctx.ellipse(d.x,d.y,d.r,d.r*.35,0,0,Math.PI*2); ctx.fill(); }
    ctx.globalAlpha=1;
    for(const p of this.list){ ctx.save(); ctx.globalAlpha=Math.min(1,p.life/40);
      ctx.translate(p.x,p.y); ctx.rotate(p.r); ctx.fillStyle=p.c;
      if(p.t==='feather'){ctx.beginPath();ctx.ellipse(0,0,p.sz,p.sz*.45,0,0,Math.PI*2);ctx.fill();}
      else if(p.t==='gib'){ctx.fillRect(-p.sz/2,-p.sz/2,p.sz,p.sz*.8);}
      else ctx.fillRect(-p.sz/2,-p.sz/2,p.sz,p.sz);
      ctx.restore(); }
    ctx.globalAlpha=1;
  }
};

/* ============ ПУЛИ ============ */
G.Bullets = {
  list:[],
  reset(){ this.list.length=0; },
  spawn(x,y,ang,spd,dmg,life,owner,weapon){
    this.list.push({x,y,px:x,py:y,vx:Math.cos(ang)*spd,vy:Math.sin(ang)*spd,dmg,life,owner,weapon});
  },
  update(level){
    for(let i=this.list.length-1;i>=0;i--){
      const b=this.list[i]; b.px=b.x;b.py=b.y; b.x+=b.vx;b.y+=b.vy;b.life--;
      if(b.y>level.height||b.life<=0||b.x<-100||b.x>level.width+100) this.list.splice(i,1);
    }
  },
  draw(ctx){
    for(const b of this.list){
      if(b.weapon==='rifle'){
        ctx.strokeStyle='rgba(255,190,80,.75)'; ctx.lineWidth=2;
        ctx.beginPath(); ctx.moveTo(b.px,b.py); ctx.lineTo(b.x,b.y); ctx.stroke();
        ctx.fillStyle='#ffd166'; ctx.beginPath(); ctx.arc(b.x,b.y,2.2,0,Math.PI*2); ctx.fill();
      } else {
        ctx.fillStyle='rgba(255,255,120,.5)'; ctx.beginPath(); ctx.arc(b.x,b.y,5,0,Math.PI*2); ctx.fill();
        ctx.fillStyle='#ffeb3b'; ctx.fillRect(b.x-5,b.y-1.6,10,3.2);
      }
    }
  }
};

/* ============ ВРАГИ ============ */
G.Enemies = {
  list:[],
  spawn(defs, platforms){
    this.list.length=0;
    for(const d of defs){
      const c=G.Config.ENEMY[d.type];
      const plat=platforms[d.plat];
      const e={ kind:d.type, x:d.x, y:plat.y-c.h, w:c.w,h:c.h, vx:-c.speed,vy:0,
        hp:c.hp,maxHp:c.hp, dir:-1, plat, homeX:d.x, alive:true, onGround:true,
        walk:Math.random()*6, state:'patrol', timer:60+Math.random()*120,
        hurtFlash:0, atkTimer:0, honk:0, grabbed:false, panic:0 };
      this.list.push(e);
    }
  },
  getStrangleTarget(p){
    const r=G.Config.STRANGLE.radius; let best=null,bd=1e9;
    const cx=p.x+p.w/2, cy=p.y+p.h/2;
    for(const e of this.list){
      if(!e.alive||e.kind!=='chicken'||e.grabbed) continue;
      const dx=Math.abs(e.x+e.w/2-cx), dy=Math.abs(e.y+e.h/2-cy);
      if(dx<r&&dy<55&&dx<bd){best=e;bd=dx;}
    }
    return best;
  },
  update(p){
    for(const e of this.list){
      if(!e.alive) continue;
      if(e.grabbed){ e.vx=0; continue; }
      if(e.hurtFlash>0)e.hurtFlash--;
      if(e.atkTimer>0)e.atkTimer--;
      if(e.honk>0)e.honk--;

      const c=G.Config.ENEMY[e.kind];
      e.y = e.plat.y - e.h;
      const minX=e.plat.x+2, maxX=e.plat.x+e.plat.w-e.w-2;

      if(e.kind==='chicken'){
        const dx=(p.x+p.w/2)-(e.x+e.w/2), dist=Math.abs(dx);
        const scared = p.character==='alena' && dist<c.fleeR;
        if(scared){ e.state='flee'; e.panic=30; e.dir=dx>0?-1:1; e.vx=c.fleeSpd*e.dir; }
        else{
          if(e.panic>0)e.panic--;
          if(--e.timer<=0){
            e.state = e.state==='peck' ? 'patrol' : (Math.random()<.35?'peck':'patrol');
            e.timer=40+Math.random()*100; if(Math.random()<.4)e.dir*=-1;
          }
          e.vx = e.state==='peck' ? 0 : c.speed*e.dir;
        }
        e.walk+=Math.abs(e.vx)*.22+.03;
      } else {
        const dx=(p.x+p.w/2)-(e.x+e.w/2), dist=Math.abs(dx);
        if(dist<c.chaseR){
          if(e.state!=='chase'&&e.honk<=0){ G.Audio.honk(); e.honk=90; }
          e.state='chase'; e.dir=dx>0?1:-1; e.vx=c.chaseSpd*e.dir;
        } else { e.state='patrol'; e.vx=c.speed*e.dir; }
        e.walk+=Math.abs(e.vx)*.18+.02;
      }

      e.x+=e.vx;
      if(e.x<=minX){e.x=minX;e.dir=1;e.vx=Math.abs(e.vx);}
      if(e.x>=maxX){e.x=maxX;e.dir=-1;e.vx=-Math.abs(e.vx);}
    }

    for(let j=G.Bullets.list.length-1;j>=0;j--){
      const b=G.Bullets.list[j];
      for(const e of this.list){
        if(!e.alive)continue;
        if(b.x>e.x&&b.x<e.x+e.w&&b.y>e.y&&b.y<e.y+e.h){
          e.hp-=b.dmg; e.hurtFlash=6; G.Bullets.list.splice(j,1);
          if(e.hp<=0) this.kill(e,'shot',b.weapon);
          else { G.Particles.feathers(b.x,b.y,'#fff',5); e.x+=Math.sign(b.vx)*6; }
          break;
        }
      }
    }

    for(const e of this.list){
      if(!e.alive||e.grabbed)continue;
      const hit=p.x<e.x+e.w&&p.x+p.w>e.x&&p.y<e.y+e.h&&p.y+p.h>e.y;
      if(!hit)continue;
      if(e.kind==='goose'){
        if(e.atkTimer<=0&&p.invuln<=0){ p.hurt(1,e.x); e.atkTimer=G.Config.ENEMY.goose.atkCd; }
      } else {
        const dir=(e.x+e.w/2)<(p.x+p.w/2)?-1:1; e.x+=dir*3; e.dir=dir; e.panic=30;
      }
    }

    for(let i=this.list.length-1;i>=0;i--) if(!this.list[i].alive) this.list.splice(i,1);
  },
  kill(e,method,weapon){
    if(!e.alive)return; e.alive=false; e.grabbed=false;
    const p=G.Player, c=G.Config.ENEMY[e.kind], cx=e.x+e.w/2, cy=e.y+e.h/2;
    let pts=c.points;
    if(method==='strangle'){
      p.addCombo(); pts=Math.round(c.stranglePoints*p.comboMult());
      G.Stats.strangled++; G.Particles.feathers(cx,cy,'#fff',20);
      G.Audio.strangle(); G.Camera.addShake(5); G.haptic('heavy'); p.sayStrangle();
    } else if(weapon==='rifle'){
      G.Particles.blood(cx,cy,e.kind==='goose'?1.5:1); G.Particles.feathers(cx,cy,'#fff',6);
      G.Audio.blood(); G.haptic('medium'); G.Camera.addShake(4);
      if(e.kind==='goose')G.Audio.gooseDeath(); else G.Audio.chickenDeath();
    } else {
      G.Particles.feathers(cx,cy,e.kind==='goose'?'#dee2e6':'#fff',14); G.haptic('light');
      if(e.kind==='goose')G.Audio.gooseDeath(); else G.Audio.chickenDeath();
    }
    if(e.kind==='goose')G.Stats.geese++; else G.Stats.chickens++;
    p.score+=pts;
  },
  draw(ctx){
    for(const e of this.list){
      if(!e.alive)continue;
      if(e.kind==='goose') this._goose(ctx,e); else this._chicken(ctx,e);
    }
  },
  _chicken(ctx,e){
    if(e.grabbed&&G.Player.strangleTimer>0){ this._chickenStrangled(ctx,e); return; }
    const cx=e.x+e.w/2, cy=e.y+e.h/2, bob=Math.sin(e.walk)*1.5;
    const peck=e.state==='peck'?Math.abs(Math.sin(e.walk*2))*6:0;
    ctx.save(); ctx.translate(cx,cy+bob); if(e.dir>0)ctx.scale(-1,1);
    if(e.hurtFlash>0)ctx.globalAlpha=.6;
    ctx.strokeStyle='#f0a020';ctx.lineWidth=2.5;ctx.lineCap='round';
    const leg=Math.sin(e.walk)*4;
    ctx.beginPath();ctx.moveTo(-4,10);ctx.lineTo(-4+leg,17);ctx.moveTo(5,10);ctx.lineTo(5-leg,17);ctx.stroke();
    ctx.fillStyle='#f2f2f2';ctx.beginPath();ctx.moveTo(-13,-2);ctx.lineTo(-24,-10);ctx.lineTo(-20,0);ctx.lineTo(-24,6);ctx.closePath();ctx.fill();
    ctx.fillStyle='#fff';ctx.beginPath();ctx.ellipse(0,2,16,12,0,0,Math.PI*2);ctx.fill();
    const wf=e.state==='flee'?Math.sin(e.walk*3)*5:0;
    ctx.fillStyle='#e8e8e8';ctx.beginPath();ctx.ellipse(-2,2-wf*.3,9,6,-.2-wf*.08,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#fff';ctx.beginPath();ctx.ellipse(10,-6+peck*.5,6,7,.3,0,Math.PI*2);ctx.fill();
    ctx.beginPath();ctx.arc(13,-11+peck,7,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#d62828';ctx.beginPath();ctx.arc(11,-18+peck,3.2,0,Math.PI*2);ctx.arc(15,-19+peck,3,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#f0a020';ctx.beginPath();ctx.moveTo(19,-11+peck);ctx.lineTo(26,-9+peck);ctx.lineTo(19,-7+peck);ctx.closePath();ctx.fill();
    ctx.fillStyle='#000';ctx.beginPath();ctx.arc(15,-13+peck,e.state==='flee'?2.4:1.7,0,Math.PI*2);ctx.fill();
    ctx.restore();
    if(e.state==='flee'&&!e.grabbed){ ctx.fillStyle='#ff3b30';ctx.font='bold 18px sans-serif';
      ctx.textAlign='center';ctx.fillText('!',cx,e.y-6);ctx.textAlign='left'; }
  },
  _chickenStrangled(ctx,e){
    const p=G.Player,total=G.Config.STRANGLE.duration,el=total-p.strangleTimer;
    const S=G.Config.STRANGLE;
    let phase=1; if(el>=S.phase2)phase=3; else if(el>=S.phase1)phase=2;
    const cx=e.x+e.w/2, cy=e.y+e.h/2;
    ctx.save(); ctx.translate(cx,cy); if(p.facing>0)ctx.scale(-1,1);
    if(phase===1){
      ctx.translate(Math.sin(el*1.8)*3,0);
      ctx.strokeStyle='#f0a020';ctx.lineWidth=2.5;ctx.lineCap='round';
      ctx.beginPath();ctx.moveTo(-5,10);ctx.lineTo(-10,18);ctx.moveTo(6,10);ctx.lineTo(12,18);ctx.stroke();
      ctx.fillStyle='#fff';ctx.beginPath();ctx.ellipse(0,2,16,12,0,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#e8e8e8';ctx.beginPath();ctx.ellipse(-10,-4,10,5,-.5,0,Math.PI*2);ctx.ellipse(10,-4,10,5,.5,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(0,-14,7,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(-3,-15,3.2,0,Math.PI*2);ctx.arc(4,-15,3.2,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#000';ctx.beginPath();ctx.arc(-3,-15,1.5,0,Math.PI*2);ctx.arc(4,-15,1.5,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#d62828';ctx.beginPath();ctx.arc(-2,-21,3,0,Math.PI*2);ctx.arc(2,-22,2.5,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#f0a020';ctx.beginPath();ctx.moveTo(6,-13);ctx.lineTo(12,-14);ctx.lineTo(6,-11);ctx.closePath();ctx.fill();
      ctx.fillStyle='#ff3b30';ctx.font='bold 22px sans-serif';ctx.textAlign='center';ctx.fillText('!',0,-30);ctx.textAlign='left';
    } else if(phase===2){
      const pr=(el-S.phase1)/(S.phase2-S.phase1);
      ctx.translate(Math.sin(el*2.5)*(5*(1-pr*.7)),Math.sin(el*3)*1.5);
      ctx.strokeStyle='#f0a020';ctx.lineWidth=2.5;ctx.lineCap='round';
      const k=Math.sin(el*1.5)*6*(1-pr);
      ctx.beginPath();ctx.moveTo(-5,10);ctx.lineTo(-8+k,19);ctx.moveTo(6,10);ctx.lineTo(9-k,19);ctx.stroke();
      ctx.fillStyle='#fff';ctx.beginPath();ctx.ellipse(0,2,16*(1-pr*.15),12,0,0,Math.PI*2);ctx.fill();
      const wf=Math.sin(el*2)*.4;
      ctx.fillStyle='#e8e8e8';
      ctx.save();ctx.translate(-10,-2);ctx.rotate(-.6+wf);ctx.beginPath();ctx.ellipse(0,0,10,5,0,0,Math.PI*2);ctx.fill();ctx.restore();
      ctx.save();ctx.translate(10,-2);ctx.rotate(.6-wf);ctx.beginPath();ctx.ellipse(0,0,10,5,0,0,Math.PI*2);ctx.fill();ctx.restore();
      ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(0,-12,7,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(-3,-13,2.8,0,Math.PI*2);ctx.arc(4,-13,2.8,0,Math.PI*2);ctx.fill();
      const roll=Math.min(1,pr*1.5);
      ctx.fillStyle='#000';ctx.beginPath();ctx.arc(-3,-14-roll,1,0,Math.PI*2);ctx.arc(4,-14-roll,1,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#d62828';ctx.beginPath();ctx.ellipse(7,-9+Math.sin(el*2)*.5,3,1.5,.3,0,Math.PI*2);ctx.fill();
      if(Math.random()<.3)G.Particles.feathers(cx,cy,'#fff',1);
    } else {
      const pr=(el-S.phase2)/(total-S.phase2);
      ctx.rotate(pr*.4);ctx.translate(0,pr*4);
      ctx.strokeStyle='#c08010';ctx.lineWidth=2.5;ctx.lineCap='round';
      ctx.beginPath();ctx.moveTo(-5,10);ctx.lineTo(-7,20);ctx.moveTo(6,10);ctx.lineTo(8,20);ctx.stroke();
      ctx.fillStyle='#e8e8e8';ctx.beginPath();ctx.ellipse(0,3,15,11,0,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#d8d8d8';ctx.beginPath();ctx.ellipse(-10,4,9,4,.3,0,Math.PI*2);ctx.ellipse(10,4,9,4,-.3,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#e8e8e8';ctx.beginPath();ctx.arc(2,-8,6.5,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle='#000';ctx.lineWidth=1.5;
      ctx.beginPath();ctx.moveTo(-5,-10);ctx.lineTo(-1,-6);ctx.moveTo(-1,-10);ctx.lineTo(-5,-6);
      ctx.moveTo(2,-10);ctx.lineTo(6,-6);ctx.moveTo(6,-10);ctx.lineTo(2,-6);ctx.stroke();
    }
    ctx.restore();
  },
  _goose(ctx,e){
    const cx=e.x+e.w/2, cy=e.y+e.h/2, bob=Math.sin(e.walk)*1.8;
    const angry=e.state==='chase', neck=angry?6:0;
    ctx.save();ctx.translate(cx,cy+bob);if(e.dir>0)ctx.scale(-1,1);
    if(e.hurtFlash>0)ctx.globalAlpha=.6;
    ctx.strokeStyle='#f08000';ctx.lineWidth=3;ctx.lineCap='round';
    const leg=Math.sin(e.walk)*5;
    ctx.beginPath();ctx.moveTo(-5,14);ctx.lineTo(-5+leg,25);ctx.moveTo(6,14);ctx.lineTo(6-leg,25);ctx.stroke();
    ctx.fillStyle='#e9ecef';ctx.beginPath();ctx.moveTo(-16,-2);ctx.lineTo(-28,-8);ctx.lineTo(-22,4);ctx.closePath();ctx.fill();
    ctx.fillStyle='#f8f9fa';ctx.beginPath();ctx.ellipse(0,4,21,14,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#dee2e6';ctx.save();ctx.translate(-2,0);
    ctx.rotate(angry?-.5+Math.sin(e.walk*3)*.2:-.1);
    ctx.beginPath();ctx.ellipse(0,0,14,7,0,0,Math.PI*2);ctx.fill();ctx.restore();
    ctx.strokeStyle='#f8f9fa';ctx.lineWidth=9;ctx.lineCap='round';
    ctx.beginPath();ctx.moveTo(12,-2);ctx.quadraticCurveTo(20+neck,-16,17+neck,-26);ctx.stroke();
    ctx.fillStyle='#f8f9fa';ctx.beginPath();ctx.ellipse(18+neck,-28,8,7,0,0,Math.PI*2);ctx.fill();
    const open=e.honk>60?4:(angry?2:0);
    ctx.fillStyle='#f08000';
    ctx.beginPath();ctx.moveTo(24+neck,-30);ctx.lineTo(36+neck,-29-open);ctx.lineTo(24+neck,-26);ctx.closePath();ctx.fill();
    ctx.beginPath();ctx.moveTo(24+neck,-26);ctx.lineTo(34+neck,-24+open);ctx.lineTo(24+neck,-23);ctx.closePath();ctx.fill();
    ctx.fillStyle='#000';ctx.beginPath();ctx.arc(20+neck,-30,2.2,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='#000';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(16+neck,-35);ctx.lineTo(24+neck,-32);ctx.stroke();
    ctx.restore();
    if(e.hp<e.maxHp){ const bw=40; ctx.fillStyle='rgba(0,0,0,.5)';
      ctx.fillRect(cx-bw/2,e.y-10,bw,5); ctx.fillStyle='#e63946';
      ctx.fillRect(cx-bw/2,e.y-10,bw*(e.hp/e.maxHp),5); }
  }
};

/* ============ ИГРОК ============ */
G.Player = {
  x:0,y:0,w:G.Config.PLAYER_W,h:G.Config.PLAYER_H,vx:0,vy:0,
  onGround:false,facing:1,walk:0,character:'misha',score:0,hp:3,
  invuln:0,cd:0,recoil:0,repT:0,strangleTimer:0,strangleVictim:null,strangleTarget:null,
  combo:0,comboT:0,rageT:0,headImg:{misha:null,alena:null},
  init(ch){
    this.character=ch; this.vx=0;this.vy=0; this.score=0;
    this.hp=G.Config.MAX_HP; this.invuln=0;this.cd=0;this.recoil=0;this.repT=0;
    this.facing=1;this.walk=0;this.onGround=false;
    this.strangleTimer=0;this.strangleVictim=null;this.strangleTarget=null;
    this.combo=0;this.comboT=0;this.rageT=0;
    if(!this.headImg[ch]){ const img=new Image(); img.src=`assets/${ch}_head.png`;
      img.onload=()=>this.headImg[ch]=img; }
  },
  comboMult(){ return Math.min(3,1+Math.max(0,this.combo-1)*.5); },
  addCombo(){
    const S=G.Config.STRANGLE; this.combo++; this.comboT=S.comboWindow;
    if(this.combo>G.Stats.maxCombo)G.Stats.maxCombo=this.combo;
    if(this.combo>=2){ G.UI.combo(this.combo); G.Audio.combo(this.combo); }
    if(this.combo===S.rageAt){ this.rageT=S.rageTime; G.Camera.addShake(12); G.haptic('success'); }
  },
  isStrangling(){ return this.strangleTimer>0; },
  update(){
    const C=G.Config;
    if(this.invuln>0)this.invuln--;
    if(this.cd>0)this.cd--;
    if(this.repT>0)this.repT--;
    if(this.recoil>0)this.recoil*=.75;
    if(this.rageT>0)this.rageT--;
    if(this.comboT>0){ this.comboT--; if(this.comboT===0)this.combo=0; }

    if(this.strangleTimer>0){
      this.strangleTimer--; this.vx=0;
      const S=C.STRANGLE, el=S.duration-this.strangleTimer;
      if(this.strangleVictim&&this.strangleVictim.alive){
        const t=this.strangleVictim;
        t.x=this.x+(this.facing>0?this.w+2:-t.w-2);
        t.y=this.y+10; t.vx=0;
      }
      if(this.strangleTimer===S.killAt&&this.strangleVictim&&this.strangleVictim.alive)
        G.Enemies.kill(this.strangleVictim,'strangle');
      if(this.strangleTimer===0&&this.strangleVictim){ this.strangleVictim.grabbed=false; this.strangleVictim=null; }
    } else {
      const spd=C.MOVE*(this.rageT>0?C.STRANGLE.rageSpeed:1);
      if(G.Input.left()){this.vx=-spd;this.facing=-1;}
      else if(G.Input.right()){this.vx=spd;this.facing=1;}
      else this.vx=0;
      if(G.Input.jumpPress&&this.onGround){ this.vy=-C.JUMP; this.onGround=false;
        G.Audio.jump(); G.Particles.dust(this.x+this.w/2,this.y+this.h,4); }
      if((G.Input.touch.shoot||G.Input.keys.KeyJ||G.Input.keys.KeyX)&&this.cd<=0) this.shoot();
      if(this.character==='alena'&&G.Input.stranglePress&&this.strangleTarget) this.startStrangle(this.strangleTarget);
    }
    this.vy+=C.GRAVITY; this.x+=this.vx; this.y+=this.vy;
    if(this.x<0)this.x=0;
    if(Math.abs(this.vx)>.1&&this.onGround)this.walk+=.25; else this.walk*=.8;
  },
  shoot(){
    const w=G.Config.CHARACTERS[this.character].weapon, W=G.Config.WEAPONS[w];
    const ox=this.x+(this.facing>0?this.w+6:-6), oy=this.y+24;
    const base=this.facing>0?0:Math.PI;
    for(let i=0;i<W.pellets;i++){
      const off=(i-(W.pellets-1)/2)*W.spread, jit=(Math.random()-.5)*W.spread*.5;
      G.Bullets.spawn(ox,oy,base+(off+jit)*this.facing,W.speed*(.9+Math.random()*.2),W.dmg,W.life,this.character,w);
    }
    this.cd=W.cd; this.recoil=W.recoil; G.Camera.addShake(W.shake);
    G.Audio.shoot(w); G.haptic('light'); G.Stats.shots++;
    if(Math.random()<.08&&this.repT===0) this.say();
  },
  startStrangle(t){
    if(!t||!t.alive)return;
    const cx=t.x+t.w/2;
    this.facing=cx>(this.x+this.w/2)?1:-1;
    this.x=cx-this.w/2-this.facing*18;
    this.vy=-4; this.onGround=false;
    this.strangleVictim=t; this.strangleTimer=G.Config.STRANGLE.duration;
    t.grabbed=true; t.vx=0;
    G.Camera.addShake(7); G.haptic('medium');
    G.Particles.dust(this.x+this.w/2,this.y+this.h,6);
    G.UI.replica('Ой, какая милая...');
  },
  hurt(n,fromX){
    if(this.invuln>0)return;
    this.hp-=n; this.invuln=G.Config.INVULN; this.combo=0;this.comboT=0;
    G.Camera.addShake(16); G.Audio.hurt(); G.haptic('error');
    G.Particles.blood(this.x+this.w/2,this.y+25,.4);
    const d=(this.x+this.w/2)<fromX?-1:1; this.vx=d*6; this.x+=d*10; this.vy=-6;
    if(this.hp<=0){this.hp=0; G.Game.gameOver();}
  },
  say(){
    const l=G.Config.CHARACTERS[this.character].replicas;
    G.UI.replica(l[(Math.random()*l.length)|0]); this.repT=180; G.Audio.beep();
  },
  sayStrangle(){
    const l=G.Config.CHARACTERS.alena.strangleReplicas;
    G.UI.replica(l[(Math.random()*l.length)|0]); this.repT=120;
  },
  draw(ctx){
    if(this.invuln>0&&Math.floor(this.invuln/4)%2===0)return;
    ctx.save();
    ctx.translate(this.x+this.w/2,this.y+this.h);
    if(this.rageT>0){ ctx.save();ctx.globalAlpha=.25+Math.sin(Date.now()/80)*.1;
      ctx.fillStyle='#ff2d20';ctx.beginPath();ctx.ellipse(0,-30,32,44,0,0,Math.PI*2);ctx.fill();ctx.restore(); }
    if(this.facing<0)ctx.scale(-1,1);
    ctx.translate(-this.recoil,0);
    if(this.character==='misha')this._misha(ctx); else this._alena(ctx);
    ctx.restore();
  },
  _head(ctx,hy){
    const img=this.headImg[this.character];
    if(img&&img.complete&&img.naturalWidth>0){
      ctx.save();ctx.beginPath();ctx.arc(0,hy,15,0,Math.PI*2);ctx.closePath();ctx.clip();
      ctx.drawImage(img,-15,hy-15,30,30);ctx.restore();
      ctx.strokeStyle='rgba(0,0,0,.5)';ctx.lineWidth=1.5;
      ctx.beginPath();ctx.arc(0,hy,15,0,Math.PI*2);ctx.stroke();
    } else {
      ctx.fillStyle='#FFDBAC';ctx.beginPath();ctx.arc(0,hy,13,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#000';ctx.beginPath();ctx.arc(3,hy-2,2,0,Math.PI*2);ctx.arc(9,hy-2,2,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle='#000';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(6,hy+3,3,0,Math.PI);ctx.stroke();
      ctx.fillStyle=this.character==='misha'?'#3d2817':'#8B4513';
      ctx.beginPath();ctx.arc(0,hy-5,13,Math.PI,0);ctx.fill();
    }
  },
  _misha(ctx){
    const limb=Math.sin(this.walk), bob=Math.abs(Math.sin(this.walk))*1.5;
    const leg=this.onGround?limb*8:5;
    ctx.fillStyle='#5c3a1e';ctx.fillRect(-20,-52+bob,9,24);
    ctx.fillStyle='#4a2d17';ctx.fillRect(-20,-52+bob,9,3);
    ctx.strokeStyle='#2d1810';ctx.lineWidth=7;ctx.lineCap='round';
    ctx.beginPath();ctx.moveTo(-6,-24);ctx.lineTo(-6+leg,0);ctx.moveTo(6,-24);ctx.lineTo(6-leg,0);ctx.stroke();
    ctx.fillStyle='#1a1a1a';ctx.fillRect(-11+leg,-4,11,6);ctx.fillRect(0-leg,-4,11,6);
    ctx.fillStyle='#2E8B57';ctx.beginPath();
    ctx.moveTo(-14,-50+bob);ctx.lineTo(-16,-24);ctx.lineTo(16,-24);ctx.lineTo(14,-50+bob);ctx.closePath();ctx.fill();
    ctx.fillStyle='#6b4423';ctx.fillRect(-14,-48+bob,10,22);ctx.fillRect(4,-48+bob,10,22);
    ctx.fillStyle='#5c3a1e';ctx.fillRect(-12,-42+bob,7,6);ctx.fillRect(5,-42+bob,7,6);
    ctx.fillStyle='#d4af37';ctx.fillRect(-11,-41+bob,2,4);ctx.fillRect(-8,-41+bob,2,4);
    ctx.fillRect(6,-41+bob,2,4);ctx.fillRect(9,-41+bob,2,4);
    ctx.fillStyle='#3d2817';ctx.fillRect(-15,-27+bob,30,3);
    ctx.fillStyle='#d4af37';ctx.fillRect(-2,-27+bob,4,3);
    ctx.strokeStyle='#2E8B57';ctx.lineWidth=6;ctx.lineCap='round';
    ctx.beginPath();ctx.moveTo(-12,-46+bob);ctx.lineTo(-12-limb*6,-30+bob);ctx.stroke();
    ctx.fillStyle='#5c3a1e';ctx.beginPath();ctx.arc(-12-limb*7,-28+bob,3.5,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='#2E8B57';ctx.lineWidth=6;
    ctx.beginPath();ctx.moveTo(12,-46+bob);ctx.lineTo(16,-40+bob);ctx.stroke();
    ctx.strokeStyle='#FFDBAC';ctx.lineWidth=5;
    ctx.beginPath();ctx.moveTo(16,-40+bob);ctx.lineTo(20,-38+bob);ctx.stroke();
    const gy=-42+bob;
    ctx.fillStyle='#5c3a1e';ctx.fillRect(6,gy,12,7);
    ctx.fillStyle='#3a3a3a';ctx.fillRect(18,gy+1,22,5);
    ctx.fillStyle='#1a1a1a';ctx.fillRect(38,gy+1,4,5);
    if(this.recoil>3){ ctx.fillStyle='rgba(255,220,100,.9)';
      ctx.beginPath();ctx.moveTo(42,gy+3);ctx.lineTo(56,gy-5);ctx.lineTo(52,gy+3);ctx.lineTo(56,gy+11);ctx.closePath();ctx.fill(); }
    this._head(ctx,-56+bob);
    ctx.fillStyle='#4a3020';ctx.beginPath();ctx.ellipse(0,-66+bob,18,4,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#5c3a1e';ctx.beginPath();ctx.moveTo(-12,-66+bob);
    ctx.quadraticCurveTo(-12,-78+bob,0,-78+bob);ctx.quadraticCurveTo(12,-78+bob,12,-66+bob);ctx.closePath();ctx.fill();
    ctx.fillStyle='#3d2817';ctx.fillRect(-12,-69+bob,24,3);
    ctx.strokeStyle='#d00';ctx.lineWidth=2.5;
    ctx.beginPath();ctx.moveTo(10,-69+bob);ctx.quadraticCurveTo(16+limb*2,-80+bob,14,-86+bob);ctx.stroke();
  },
  _alena(ctx){
    const limb=Math.sin(this.walk), bob=Math.abs(Math.sin(this.walk));
    const leg=this.onGround?limb*9:6, strangling=this.strangleTimer>0;
    ctx.strokeStyle='#2a2a2a';ctx.lineWidth=5;ctx.lineCap='round';
    ctx.beginPath();ctx.moveTo(-5,-27+bob);ctx.lineTo(-5+leg,0);ctx.moveTo(5,-27+bob);ctx.lineTo(5-leg,0);ctx.stroke();
    ctx.fillStyle='#fff';ctx.fillRect(-10+leg,-4,10,5);ctx.fillRect(0-leg,-4,10,5);
    ctx.fillStyle='#d00';ctx.fillRect(-10+leg,-4,10,2);ctx.fillRect(0-leg,-4,10,2);
    ctx.fillStyle='#8B4513';ctx.beginPath();
    ctx.moveTo(-10,-50+bob);ctx.lineTo(-11,-27+bob);ctx.lineTo(11,-27+bob);ctx.lineTo(10,-50+bob);ctx.closePath();ctx.fill();
    ctx.fillStyle='#FFDBAC';ctx.beginPath();ctx.moveTo(-4,-50+bob);ctx.lineTo(0,-45+bob);ctx.lineTo(4,-50+bob);ctx.closePath();ctx.fill();
    ctx.fillStyle='#a0522d';ctx.fillRect(-10,-40+bob,20,2);
    ctx.fillStyle='#3d2817';ctx.fillRect(-11,-30+bob,22,6);
    if(strangling){
      const S=G.Config.STRANGLE,el=S.duration-this.strangleTimer;
      let phase=1; if(el>=S.phase2)phase=3; else if(el>=S.phase1)phase=2;
      if(phase===1){
        const pr=el/S.phase1, reach=8+pr*18, lean=pr*6;
        ctx.save();ctx.translate(lean,0);
        ctx.strokeStyle='#FFDBAC';ctx.lineWidth=4.5;ctx.lineCap='round';
        ctx.beginPath();ctx.moveTo(-8,-46+bob);ctx.lineTo(8+reach,-42+bob);ctx.moveTo(8,-46+bob);ctx.lineTo(8+reach,-36+bob);ctx.stroke();
        ctx.fillStyle='#FFDBAC';ctx.beginPath();ctx.arc(10+reach,-42+bob,4,0,Math.PI*2);ctx.arc(10+reach,-36+bob,4,0,Math.PI*2);ctx.fill();
        ctx.restore();
      } else if(phase===2){
        const pr=(el-S.phase1)/(S.phase2-S.phase1);
        const sh=Math.sin(el*2.5)*2*(1-pr), sq=Math.sin(el*.5)*1.5;
        ctx.save();ctx.translate(sh,0);
        ctx.strokeStyle='#FFDBAC';ctx.lineWidth=5;ctx.lineCap='round';
        ctx.beginPath();ctx.moveTo(-8,-46+bob);ctx.lineTo(14+sq,-41+bob);ctx.moveTo(8,-46+bob);ctx.lineTo(14+sq,-35+bob);ctx.stroke();
        ctx.fillStyle='#1a1a1a';ctx.beginPath();ctx.arc(16+sq,-41+bob,4.5,0,Math.PI*2);ctx.arc(16+sq,-35+bob,4.5,0,Math.PI*2);ctx.fill();
        ctx.restore();
      } else {
        const pr=(el-S.phase2)/(S.duration-S.phase2), drop=pr*10;
        ctx.strokeStyle='#FFDBAC';ctx.lineWidth=4.5;ctx.lineCap='round';
        ctx.beginPath();ctx.moveTo(-8,-46+bob);ctx.lineTo(10,-38+bob+drop);ctx.moveTo(8,-46+bob);ctx.lineTo(10,-32+bob+drop);ctx.stroke();
        ctx.fillStyle='#1a1a1a';ctx.beginPath();ctx.arc(11,-37+bob+drop,3.5,0,Math.PI*2);ctx.arc(11,-31+bob+drop,3.5,0,Math.PI*2);ctx.fill();
      }
    } else {
      ctx.strokeStyle='#FFDBAC';ctx.lineWidth=4;ctx.lineCap='round';
      ctx.beginPath();ctx.moveTo(-9,-47+bob);ctx.lineTo(-10-limb*7,-32+bob);ctx.stroke();
      ctx.fillStyle='#1a1a1a';ctx.beginPath();ctx.arc(-10-limb*7,-31+bob,3.2,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle='#FFDBAC';ctx.beginPath();ctx.moveTo(9,-47+bob);ctx.lineTo(14,-41+bob);ctx.stroke();
      ctx.fillStyle='#1a1a1a';ctx.beginPath();ctx.arc(15,-40+bob,3.2,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#222';ctx.fillRect(14,-42+bob,10,4);
      ctx.fillStyle='#3a3a3a';ctx.fillRect(15,-39+bob,4,4);
      ctx.fillStyle='#1a1a1a';ctx.fillRect(23,-42+bob,2,4);
      if(this.recoil>1){ctx.fillStyle='rgba(255,230,120,.85)';ctx.beginPath();ctx.arc(27,-40+bob,5,0,Math.PI*2);ctx.fill();}
    }
    this._head(ctx,-56+bob);
    ctx.fillStyle='#6b3d1e';
    ctx.beginPath();ctx.arc(0,-58+bob,14,Math.PI*1.05,Math.PI*1.95);ctx.fill();
    ctx.fillStyle='#d00';
    ctx.fillRect(-13,-62+bob,26,4);
  }
};

/* ============ UI ============ */
G.UI = {
  repTO:null, ovCB:null,
  init(){ document.getElementById('ovBtn').addEventListener('click',()=>{ if(this.ovCB)this.ovCB(); }); },
  replica(t){ const el=document.getElementById('replica'); if(!el)return;
    el.textContent=t; el.classList.add('show'); clearTimeout(this.repTO);
    this.repTO=setTimeout(()=>el.classList.remove('show'),2000); },
  combo(c){ if(c<2)return; const el=document.getElementById('combo'); if(!el)return;
    el.textContent=c>=5?`ЯРОСТЬ x${c}!`:`КОМБО x${c}`;
    el.classList.remove('show'); void el.offsetWidth; el.classList.add('show'); },
  hud(){
    const p=G.Player,d=G.Config.CHARACTERS[p.character]; if(!d)return;
    const mx=G.Config.MAX_HP;
    document.getElementById('charName').textContent=d.name;
    document.getElementById('score').textContent=p.score;
    document.getElementById('hearts').textContent='❤️'.repeat(Math.max(0,p.hp))+'🖤'.repeat(Math.max(0,mx-p.hp));
    document.getElementById('kc').textContent=G.Stats.chickens;
    document.getElementById('kg').textContent=G.Stats.geese;
    document.getElementById('ks').textContent=G.Stats.strangled;
    document.getElementById('lvl').textContent='· Ур.'+G.Game.levelNum;
  },
  strangleBtn(v){ const b=document.getElementById('bStrangle'); if(b)b.classList.toggle('visible',!!v); },
  overlay(title,text,btn,cb){
    document.getElementById('ovTitle').textContent=title;
    document.getElementById('ovText').textContent=text;
    document.getElementById('ovBtn').textContent=btn;
    document.getElementById('overlay').classList.remove('hidden');
    this.ovCB=cb;
  },
  hideOverlay(){ document.getElementById('overlay').classList.add('hidden'); }
};

/* ============ ИГРА ============ */
G.Game = {
  canvas:null,ctx:null,W:0,H:0,dpr:1,
  state:'menu',selected:null,current:null,levelNum:1,startTime:0,
  init(){
    this.canvas=document.getElementById('game');
    this.ctx=this.canvas.getContext('2d');
    this.resize();
    window.addEventListener('resize',()=>this.resize());
    window.addEventListener('orientationchange',()=>setTimeout(()=>this.resize(),200));
    G.Audio.init(); G.Input.init(); G.UI.init();
    this.setupMenu();
    if(G.Level1){ this.current=G.Level1; this.current.init();
      G.Camera.setBounds(this.current.width,this.current.height); }
    const r=document.getElementById('rotate');
    if(r){setTimeout(()=>r.classList.add('on'),500);setTimeout(()=>r.classList.remove('on'),4000);}
    this.loop();
  },
  resize(){
    this.W=window.innerWidth; this.H=window.innerHeight;
    this.dpr=Math.min(window.devicePixelRatio||1,3);
    this.canvas.width=this.W*this.dpr; this.canvas.height=this.H*this.dpr;
    this.canvas.style.width=this.W+'px'; this.canvas.style.height=this.H+'px';
    G.Camera.viewport(this.W,this.H);
    if(this.current&&this.state!=='playing') this.current.init();
  },
  setupMenu(){
    const menu = document.getElementById('menu');
    const cards = document.querySelectorAll('.card');
    const btn = document.getElementById('startBtn');
    
    console.log('🎮 setupMenu: найдено карточек:', cards.length);
    
    if (!menu || cards.length === 0) {
      console.error('❌ Меню или карточки не найдены!');
      return;
    }
    
    const onClick = (e) => {
      console.log('🎮 Клик в меню, target:', e.target);
      
      const card = e.target.closest('[data-char]');
      if (card) {
        console.log('✅ Выбрана карточка:', card.dataset.char);
        cards.forEach(x => x.classList.remove('sel'));
        card.classList.add('sel');
        this.selected = card.dataset.char;
        if (btn) btn.disabled = false;
        G.Audio.resume();
        return;
      }
      
      if (e.target.closest('#startBtn') || e.target.closest('#start-btn')) {
        console.log('✅ Клик по кнопке СТАРТ, selected:', this.selected);
        if (!this.selected) {
          console.warn('⚠️ Персонаж не выбран!');
          return;
        }
        G.Audio.resume();
        menu.classList.add('hidden');
        this.start(this.selected, 1);
      }
    };
    
    menu.addEventListener('click', onClick);
    console.log('✅ Обработчик кликов привязан к меню');
  },
  loadLevel(n){
    this.levelNum=n;
    this.current = n===1?G.Level1:(n===2?G.Level2:G.Level3);
    if(!this.current){console.error('Нет уровня',n);return;}
    this.current.init();
    G.Camera.setBounds(this.current.width,this.current.height);
    G.Camera.reset();
    G.Player.x=this.current.spawn.x; G.Player.y=this.current.spawn.y;
  },
  start(ch,n){
    G.Audio.resume(); G.Input.reset(); G.Stats.reset();
    G.Bullets.reset(); G.Particles.reset();
    G.Player.init(ch);
    this.loadLevel(n);
    G.UI.hideOverlay(); G.UI.strangleBtn(false); G.UI.hud();
    this.startTime=Date.now(); this.state='playing';
    G.Player.say();
  },
    nextLevel(){ 
    if(this.levelNum===1) this.start(G.Player.character,2); 
    else if(this.levelNum===2) this.start(G.Player.character,3);
    else this.win(); 
  },
  gameOver(){
    if(this.state!=='playing')return; this.state='gameover';
    G.Audio.gameover(); G.UI.strangleBtn(false);
    G.UI.overlay('💀 ТЕБЯ ЗАКЛЕВАЛИ',
      `Очки: ${G.Player.score} · 🐔${G.Stats.chickens} · 🪿${G.Stats.geese}`,
      '🔄 ЗАНОВО',()=>this.start(G.Player.character,this.levelNum));
  },
  win(){
    if(this.state!=='playing')return; this.state='win';
    G.Audio.win(); G.haptic('success'); G.UI.strangleBtn(false);
    const s=Math.round((Date.now()-this.startTime)/1000);
    const ex=G.Player.character==='alena'
      ?`Задушено: ${G.Stats.strangled} · Комбо x${G.Stats.maxCombo}`
      :`Выстрелов: ${G.Stats.shots}`;
    G.UI.overlay('🏆 ПОБЕДА!',
      `Уровень ${this.levelNum} пройден! Очки: ${G.Player.score} · ${s}с · ${ex}`,
      this.levelNum===1?'▶️ СЛЕДУЮЩИЙ УРОВЕНЬ':'🔁 ИГРАТЬ СНОВА',
      ()=>{ this.levelNum===1?this.nextLevel():this.start(G.Player.character,1); });
  },
  updatePlatforms(){
    for(const p of this.current.platforms){
      if(p.type!=='moving')continue;
      const px=p.x,py=p.y;
      p.t=(p.t||0)+p.speed;
      const s=(Math.sin(p.t)+1)/2;
      if(p.axis==='x') p.x=p.min+(p.max-p.min)*s; else p.y=p.min+(p.max-p.min)*s;
      p.dx=p.x-px; p.dy=p.y-py;
    }
  },
  collidePlayer(){
    const p=G.Player; p.onGround=false;
    for(const pl of this.current.platforms){
      if(p.x<pl.x+pl.w&&p.x+p.w>pl.x){
        const feet=p.y+p.h, prev=feet-p.vy;
        if(p.vy>=0&&prev<=pl.y+1&&feet>=pl.y){
          p.y=pl.y-p.h; p.vy=0; p.onGround=true;
          if(pl.type==='moving'){ if(pl.dx)p.x+=pl.dx; if(pl.dy)p.y+=pl.dy; }
        }
      }
    }
    p.x=Math.max(0,Math.min(this.current.width-p.w,p.x));
    if(p.y>this.current.height+200){ p.hurt(1,p.x); p.x=this.current.spawn.x; p.y=this.current.spawn.y; p.vy=0; }
  },
  update(){
    if(!this.current)return;
    const p=G.Player;
    this.updatePlatforms();
    p.update();
    this.collidePlayer();
    G.Enemies.update(p);
    G.Bullets.update(this.current);
    const ground=this.current.height-10;
    G.Particles.update(ground);
    this.current.update(p);
    G.Camera.follow(p);
    let t=null;
    if(p.character==='alena'&&!p.isStrangling()&&this.state==='playing')
      t=G.Enemies.getStrangleTarget(p);
    p.strangleTarget=t; G.UI.strangleBtn(!!t); G.UI.hud();
    if(this.current.checkWin(p)) this.nextLevel();
  },
  draw(){
    const ctx=this.ctx;
    ctx.setTransform(this.dpr,0,0,this.dpr,0,0);
    ctx.clearRect(0,0,this.W,this.H);
    if(!this.current)return;
    this.current.drawSky(ctx,this.W,this.H);
    if(this.current.drawParallax) this.current.drawParallax(ctx,this.W,this.H);
    const z=G.Camera.zoom, [sx,sy]=G.Camera.shakeOffset();
    ctx.save();
    ctx.scale(z,z);
    ctx.translate(-G.Camera.x+sx,-G.Camera.y+sy);
    this.current.drawWorld(ctx);
    G.Enemies.draw(ctx);
    G.Bullets.draw(ctx);
    if(this.state!=='menu') G.Player.draw(ctx);
    G.Particles.draw(ctx);
    ctx.restore();
  },
  loop(){
    if(this.state==='playing') this.update();
    this.draw();
    G.Input.endFrame();
    requestAnimationFrame(()=>this.loop());
  }
};