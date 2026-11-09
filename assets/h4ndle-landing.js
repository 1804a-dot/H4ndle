/* H4NDLE · home page: scroll story, scenes, shop cards (groups, tabs + search), brand kit and the "Crear mi empaque" configurator
   (since 10-oct a panel/dialog opened from "Personalizar" and any #crear link; see sections/h4-crear.liquid).
   Generated from index.html by tools/gen_from_index.py. Needs assets/h4ndle.js (window.H4 and window.H4Cart).
   Performance: every scroll-driven piece (scrub videos, pinned scenes) runs in ONE requestAnimationFrame per frame that first
   reads all layout values and then writes all styles, so a frame never forces a second layout. */
(()=>{
'use strict';
if(!window.H4){console.warn('[H4NDLE] falta assets/h4ndle.js');return}
const {$,$$,clamp,esc,money,RM}=window.H4;
const Cart=window.H4Cart||{add:()=>Promise.reject(new Error('sin carrito')),variantFor:()=>null,slotOf:()=>null,state:null};
const smoothstep=(p,e0,e1)=>{const t=clamp((p-e0)/(e1-e0),0,1);return t*t*(3-2*t)};
const rng=seed=>{let s=seed>>>0;return()=>(s=(s*1664525+1013904223)>>>0)/4294967296};

/* ---------- text splitting (seeded, done once) ---------- */
$$('[data-split]').forEach((el,n)=>{
  const mode=el.dataset.split,text=el.textContent.trim(),r=rng(1234+n*97);
  const em=(el.dataset.em||'').split(',').filter(Boolean);
  const sr=document.createElement('span');sr.className='sr-only';sr.textContent=text;
  const vis=document.createElement('span');vis.className='split';vis.setAttribute('aria-hidden','true');
  const words=text.split(/\s+/);
  words.forEach((w,wi)=>{
    const ws=document.createElement('span');ws.className='w'+(em.includes(w)?' em':'');
    ws.style.setProperty('--th',(wi/words.length*(mode==='words'?.5:.2)).toFixed(3));
    if(mode==='chars'){
      for(const ch of w){
        const c=document.createElement('span');c.className='c';c.textContent=ch;
        c.style.setProperty('--th',(r()*.5).toFixed(3));
        c.style.setProperty('--jx',((r()-.5)*140).toFixed(1)+'px');
        c.style.setProperty('--jy',((r()-.5)*90).toFixed(1)+'px');
        c.style.setProperty('--jr',((r()-.5)*70).toFixed(1)+'deg');
        ws.appendChild(c);
      }
    } else ws.textContent=w;
    vis.appendChild(ws);
    if(wi<words.length-1)vis.appendChild(document.createTextNode(' '));
  });
  el.textContent='';el.append(sr,vis);
});

/* ---------- the scrub engine ---------- */
const GATES=[
  '(max-width: 720px)',
  '(orientation: portrait) and (max-width: 1024px)',
  '(orientation: portrait) and (pointer: coarse)',
  '(orientation: landscape) and (pointer: coarse) and (max-height: 560px)',
  '(prefers-reduced-motion: reduce)'
];
const MQLS=GATES.map(q=>matchMedia(q));

/* frames per second of an mp4 (its video track: sample count / duration); 0 if it cannot tell */
function mp4Fps(u8){
  try{
    const dv=new DataView(u8.buffer,u8.byteOffset,u8.byteLength),T=o=>String.fromCharCode(u8[o+4],u8[o+5],u8[o+6],u8[o+7]);
    let fps=0;
    const walk=(s,e,tr)=>{
      for(let o=s;o<=e-8;){
        let size=dv.getUint32(o),h=8;const t=T(o);
        if(size===1){size=Number(dv.getBigUint64(o+8));h=16}else if(size===0)size=e-o;
        if(size<8||o+size>e)return;
        if(t==='trak'){const k={};walk(o+h,o+size,k);if(k.vide&&k.n&&k.d)fps=k.n/k.d}
        else if(t==='moov'||t==='mdia'||t==='minf'||t==='stbl')walk(o+h,o+size,tr);
        else if(tr&&t==='hdlr')tr.vide=T(o+12)==='vide';
        else if(tr&&t==='mdhd'){const v1=u8[o+8]===1,ts=dv.getUint32(o+(v1?28:20)),du=v1?Number(dv.getBigUint64(o+32)):dv.getUint32(o+24);tr.d=ts?du/ts:0}
        else if(tr&&t==='stsz')tr.n=dv.getUint32(o+16);
        o+=size;
      }
    };
    walk(0,u8.length,null);
    return fps>1&&fps<121?fps:0;
  }catch(e){return 0}
}

/* the page's single frame loop (frame() is defined below, once the scrubs and scenes exist) */
let frameId=null;
function kick(){if(frameId===null)frameId=requestAnimationFrame(frame)}

class Scrub{
  constructor(sec){
    this.sec=sec;this.stage=$('.stage',sec);this.video=$('video',sec);this.posterEl=$('.poster',sec);this.ring=$('.ring',sec);this.cue=$('.cue',sec);
    this.src=sec.dataset.video;this.bytes=+sec.dataset.bytes||0;this.posterSrc=sec.dataset.poster;this.fmax=+sec.dataset.f||.035;
    const els=$$('.band',sec);
    this.bands=els.map((el,i)=>({el,a:+el.dataset.a,b:+el.dataset.b,ramp:+el.dataset.ramp||0,first:i===0,last:i===els.length-1,op:-1,k:-1,live:null,links:$$('a,button',el)}));
    this.target=0;this.shown=0;this.lastTick=0;this.seekBusy=false;this.pending=null;this.frameReq=-1;this.fps=+sec.dataset.fps||24;
    this.onScreen=false;this.dirty=true;this.near=false;this.inited=false;this.on=false;this.failed=false;this.cueGone=null;
    this.loadK=sec.hasAttribute('data-loadramp')?0:1;
    const v=this.video;
    v.addEventListener('seeked',()=>{this.seekBusy=false;if(this.pending!==null){const t=this.pending;this.pending=null;this.requestSeek(t)}});
    v.addEventListener('error',()=>{this.seekBusy=false;this.pending=null;this.fail()});
    /* entering or leaving the screen: measure once more on the next frame (leaving snaps it to its start or end, so coming back never rewinds) */
    new IntersectionObserver(([e])=>{this.onScreen=e.isIntersecting;this.dirty=true;kick()}).observe(sec);
    new IntersectionObserver(([e])=>{if(e.isIntersecting){this.near=true;if(this.on)this.init()}},{rootMargin:'150% 0px 150% 0px'}).observe(sec);
  }
  progress(){const r=this.sec.getBoundingClientRect(),range=r.height-innerHeight;return range>0?clamp(-r.top/range,0,1):0}
  init(){
    if(this.inited)return;this.inited=true;
    this.posterEl.style.backgroundImage=`url('${this.posterSrc}')`;
    let started=false;const start=()=>{if(started)return;started=true;this.load().catch(()=>this.loadDirect())};
    const img=new Image();img.onload=start;img.onerror=start;img.src=this.posterSrc;setTimeout(start,4000);
  }
  async load(){
    if(location.protocol==='file:'){
      /* opened by double click: fetch is blocked on file://, but the video element can read the local file directly */
      this.ring.style.setProperty('--ld',0);
      this.video.preload='auto';this.video.src=this.src;this.video.load();
      this.video.addEventListener('canplay',()=>this.ready(),{once:true});
      return;
    }
    const ctrl=new AbortController();let wd=setTimeout(()=>ctrl.abort(),20000);
    const res=await fetch(this.src,{priority:'low',signal:ctrl.signal});
    if(!res.ok||!res.body)throw new Error('http');
    const total=Number(res.headers.get('Content-Length'))||this.bytes;
    const reader=res.body.getReader(),chunks=[];let got=0,last=0;
    for(;;){
      const {done,value}=await reader.read();if(done)break;
      clearTimeout(wd);wd=setTimeout(()=>ctrl.abort(),20000);
      chunks.push(value);got+=value.length;
      const frac=Math.min(1,got/total),now=performance.now();
      if(now-last>100||frac===1){last=now;this.ring.style.setProperty('--ld',Math.round(126*(1-frac)))}
    }
    clearTimeout(wd);this.ring.style.setProperty('--ld',0);
    const bytes=new Uint8Array(got);let at=0;for(const c of chunks){bytes.set(c,at);at+=c.length}
    this.fps=mp4Fps(bytes)||this.fps; /* seeks snap to whole frames of this video */
    this.video.src=URL.createObjectURL(new Blob([bytes],{type:'video/mp4'}));this.video.load();
    this.video.addEventListener('canplay',()=>this.ready(),{once:true});
  }
  loadDirect(){
    /* fetch failed (network, blocked, stalled): let the video element stream the same file by itself */
    if(this.failed)return;
    this.ring.style.setProperty('--ld',0);
    this.video.preload='auto';this.video.src=this.src;this.video.load();
    this.video.addEventListener('canplay',()=>this.ready(),{once:true});
  }
  ready(){this.stage.classList.add('video-ready');this.frameReq=-1;this.requestSeek(this.shown*this.video.duration)}
  fail(){
    if(this.failed)return;this.failed=true;this.stage.classList.add('video-failed');
    const end=this.sec.dataset.ending;
    if(end){const d=document.createElement('div');d.className='poster';d.setAttribute('aria-hidden','true');d.style.backgroundImage=`url('${end}')`;d.style.opacity='0';this.posterEl.after(d);this.endEl=d;this.endOp=0;this.updateBands(this.shown)}
  }
  /* one seek in flight at a time, snapped to whole video frames: while easing, many animation frames land inside the same video frame,
     and each seek makes the decoder start again from the previous keyframe, so a seek is only sent when the video frame changes */
  requestSeek(t){
    const v=this.video;if(!v.duration||this.failed)return;
    const end=v.duration-.05,fi=Math.floor(clamp(t,0,end)*this.fps);
    if(this.seekBusy){this.pending=fi===this.frameReq?null:t;return}
    if(fi===this.frameReq)return;
    this.frameReq=fi;this.seekBusy=true;v.currentTime=Math.min((fi+.5)/this.fps,end);
  }
  enable(){
    if(this.on)return;this.on=true;if(this.near)this.init();
    this.bands.forEach(b=>{b.op=-1;b.k=-1;b.live=null});this.cueGone=null;
    this.target=this.shown=this.progress();this.updateBands(this.shown);this.requestSeek(this.shown*(this.video.duration||0));
  }
  disable(){if(!this.on)return;this.on=false;this.lastTick=0}
  /* read phase: only while on screen (or once right after entering/leaving it) */
  measure(){if(!this.on||!(this.onScreen||this.dirty))return;this.dirty=false;this.target=this.progress()}
  /* write phase: eases what is shown toward the scroll position; true while it still needs frames */
  step(now){
    if(!this.on||this.shown===this.target){this.lastTick=0;return false}
    const dt=this.lastTick?Math.min(100,now-this.lastTick):16.667;this.lastTick=now;
    const k=.16;this.shown+=(this.target-this.shown)*(1-Math.pow(1-k,dt/16.667));
    let more=true;
    if(Math.abs(this.target-this.shown)<.0005){this.shown=this.target;this.lastTick=0;more=false}
    this.requestSeek(this.shown*(this.video.duration||0));
    this.updateBands(this.shown);
    return more;
  }
  updateBands(p){
    for(const b of this.bands){
      const len=b.b-b.a,f=Math.min(this.fmax,len/3);
      const inE=b.first?1:smoothstep(p,b.a,b.a+f);
      const outE=b.last?1:1-smoothstep(p,b.b-f,b.b);
      const op=inE*outE;
      const ramp=b.ramp||Math.min(.03,len*.35);
      let k=clamp((p-b.a)/ramp,0,1);if(b.first)k=Math.max(k,this.loadK);
      if(Math.abs(op-b.op)>.004||(op===0&&b.op!==0)||(op===1&&b.op!==1)){b.op=op;b.el.style.opacity=op.toFixed(3)}
      if(Math.abs(k-b.k)>.008||(k===1&&b.k!==1)||(k===0&&b.k!==0)){b.k=k;b.el.style.setProperty('--k',k.toFixed(3))}
      const live=op>.6;
      if(live!==b.live){b.live=live;b.el.classList.toggle('live',live);b.links.forEach(l=>live?l.removeAttribute('tabindex'):l.setAttribute('tabindex','-1'))}
    }
    if(this.cue){const g=p>.04;if(g!==this.cueGone){this.cueGone=g;this.cue.classList.toggle('gone',g)}}
    if(this.endEl){const o=smoothstep(p,.42,.6);if(Math.abs(o-this.endOp)>.004||(o===1&&this.endOp!==1)||(o===0&&this.endOp!==0)){this.endOp=o;this.endEl.style.opacity=o.toFixed(3)}}
  }
}
const scrubs=$$('.scrub').map(s=>new Scrub(s));
const hero=scrubs[0];

function applyHeroMode(){
  const stat=MQLS.some(m=>m.matches);
  scrubs.forEach(s=>stat?s.disable():s.enable());
}
MQLS.forEach(m=>m.addEventListener('change',applyHeroMode));

/* band one opens settled: a one-time load ramp that hands over to scroll */
let rampT0=null; /* runs inside frame() (write phase) */
function loadRamp(){
  if(!hero||!hero.on){if(hero)hero.loadK=1;return}
  rampT0=performance.now();kick();
}

/* ---------- scroll scenes: each one has read() (layout only) and write(value) (styles only) ---------- */
const pinP=el=>{const r=el.getBoundingClientRect(),range=r.height-innerHeight;return range>0?clamp(-r.top/range,0,1):(r.top<0?1:0)};
const setVar=(el,cache,key,v,eps=.004)=>{if(cache[key]===undefined||Math.abs(cache[key]-v)>eps||(v===1&&cache[key]!==1)||(v===0&&cache[key]!==0)){cache[key]=v;el.style.setProperty(key,v.toFixed(3))}};
const scenes=[];

/* manifesto */
(()=>{
  const el=$('#manifiesto');if(!el)return;
  const rows=$$('.m-row',el),count=$('#manCount'),cache=rows.map(()=>({}));let lastN='';
  scenes.push({el,read(){return pinP(el)},write(p){
    let n=1;
    rows.forEach((r,i)=>{
      const s=clamp((p-i*.18-.04)/.14,0,1),y=clamp((s-.4)/.6,0,1);
      setVar(r,cache[i],'--s',s);setVar(r,cache[i],'--y',y);if(s>.5)n=i+1;
    });
    const txt=String(n).padStart(2,'0');if(count&&txt!==lastN){lastN=txt;count.textContent=txt}
  },final(){rows.forEach((r,i)=>{setVar(r,cache[i],'--s',1);setVar(r,cache[i],'--y',1)})}});
})();

/* value chain */
(()=>{
  const el=$('#chain');if(!el)return;
  const svg=$('svg.line',el),dots=$$('circle',svg),items=$$('li',el),list=$('ol',el),cache={},lcache={};let lit=-1;
  const paint=p=>{
    setVar(svg,cache,'--p',p);setVar(list,lcache,'--p',p);
    const n=Math.floor(p*4.02+.001);if(n!==lit){lit=n;dots.forEach((d,i)=>d.classList.toggle('on',i<=n&&p>0));items.forEach((d,i)=>d.classList.toggle('on',i<=n&&p>0))}
  };
  /* measured on the drawn line itself (the list on phones), so it starts only once the line is well inside the screen */
  scenes.push({el,read(){
    const sr=svg.getBoundingClientRect(),r=sr.height?sr:list.getBoundingClientRect(),vh=innerHeight;
    return clamp((vh*.78-(r.top+r.height/2))/(vh*.36),0,1);
  },write:paint,final(){paint(1)}});
})();

/* sistema */
(()=>{
  const el=$('#sistema');if(!el)return;
  const rail=$$('.rail li',el);let step=-1;
  const set=s=>{if(s===step)return;step=s;el.dataset.step=s;rail.forEach((l,i)=>l.classList.toggle('on',i<=s))};
  scenes.push({el,read(){return pinP(el)},write(p){set(Math.min(4,Math.floor(p*5.0001)))},final(){set(4)}});
})();

/* kitchens: horizontal track pinned to vertical scroll */
const NATIVE=matchMedia('(max-width:720px), (prefers-reduced-motion: reduce)');
(()=>{
  const el=$('#cocinas'),track=$('#track'),bar=$('#kitBar');if(!el||!track)return;
  let max=0,x=null,lastH='';const cache={};
  const measure=()=>{
    if(NATIVE.matches){if(lastH){el.style.height='';track.style.transform='';x=null;lastH=''}return}
    max=Math.max(0,track.scrollWidth-innerWidth);
    const h=`calc(100vh + ${Math.round(max*.85)}px)`;if(h!==lastH){lastH=h;el.style.height=h}
    kick();
  };
  addEventListener('resize',measure);NATIVE.addEventListener('change',measure);
  addEventListener('load',measure);measure();
  scenes.push({el,read(){return NATIVE.matches?null:pinP(el)},write(p){
    if(p===null)return;
    const nx=-Math.round(p*max);
    if(nx!==x){x=nx;track.style.transform=`translate3d(${nx}px,0,0)`}
    if(bar)setVar(bar,cache,'--p',p,.01);
  },final(){}});
})();

/* guarantee: the 4 fills up, day by day */
(()=>{
  const el=$('#guarPin');if(!el)return;
  const four=$('.four',el),days=$$('.days li',el),cache={};let lit=-2;
  const paint=f=>{
    setVar(four,cache,'--f',f,.003);
    const n=f>=.999?3:Math.floor(f*4-.02);
    if(n!==lit){lit=n;days.forEach((d,i)=>d.classList.toggle('on',i<=n))}
  };
  scenes.push({el,read(){return pinP(el)},write(p){paint(clamp((p-.05)/.72,0,1))},final(){paint(1)}});
})();

/* a scene that enters or leaves the screen gets one more update (leaving snaps it to its start or end state) */
scenes.forEach(sc=>{sc.vis=false;sc.dirty=false;new IntersectionObserver(([e])=>{sc.vis=e.isIntersecting;sc.dirty=true;kick()},{rootMargin:'10% 0px 10% 0px'}).observe(sc.el)});

/* the frame: 1) read every layout value, 2) write every style. Nothing reads after a write, so there is one layout per frame. */
const liveScenes=[],sceneVals=[];
/* the nav tone (assets/h4ndle.js) joins this loop on the home page, so its reads also come before every write */
const NAV=typeof window.H4.readNav==='function'&&typeof window.H4.writeNav==='function';
if(NAV)window.H4.navDriven=true;
function frame(now){
  frameId=null;
  const navS=NAV?window.H4.readNav():null;
  for(const s of scrubs)s.measure();
  liveScenes.length=0;sceneVals.length=0;
  if(!RM.matches)for(const sc of scenes)if(sc.vis||sc.dirty){sc.dirty=false;liveScenes.push(sc);sceneVals.push(sc.read())}
  if(NAV)window.H4.writeNav(navS);
  for(let i=0;i<liveScenes.length;i++)liveScenes[i].write(sceneVals[i]);
  let more=false;
  if(rampT0!==null){
    const t=clamp((now-rampT0)/1100,0,1);hero.loadK=1-Math.pow(1-t,3);if(hero.on)hero.updateBands(hero.shown);
    if(t<1)more=true;else rampT0=null;
  }
  for(const s of scrubs)if(s.step(now))more=true;
  if(more)kick();
}
addEventListener('scroll',kick,{passive:true});
addEventListener('resize',()=>{scrubs.forEach(s=>{s.dirty=true});scenes.forEach(sc=>{sc.dirty=true});kick()});

function pinToFinalStates(){scenes.forEach(sc=>sc.final());}
RM.addEventListener('change',e=>{
  if(e.matches)pinToFinalStates();
  else{scenes.forEach(sc=>{sc.dirty=true});applyHeroMode();kick()}
});

/* ---------- home-only reveals (the shared .rv / [data-stagger] / .ul reveals live in h4ndle.js) ---------- */
const sysStage=$('#sistema .stage');
if(sysStage)new IntersectionObserver(([e])=>{if(e.isIntersecting)$('#sistema').classList.add('in')},{threshold:.25}).observe(sysStage);
const liveIO=new IntersectionObserver(es=>es.forEach(e=>e.target.classList.toggle('live-on',e.isIntersecting)));
$$('.manifesto').forEach(el=>liveIO.observe(el));

/* marquee */
(()=>{
  const m=$('#marquee');if(!m)return;const mq=$('.mq',m);
  const items=['Menos inventario','Menos capital detenido','Menos riesgo de comprar de más','Menos tiempo con proveedores','Mejor presentación','Más clientes que regresan'];
  const one=items.map(t=>`<span>${t}<svg viewBox="0 0 264.45 279.85"><use href="#four"/></svg></span>`).join('');
  mq.innerHTML=one.repeat(4)+one.repeat(4);
  new IntersectionObserver(([e])=>m.classList.toggle('run',e.isIntersecting)).observe(m);
})();

/* ---------- before / after ---------- */
(()=>{
  const c=$('#compare');if(!c)return;const input=$('input',c);
  /* the divider follows the pointer (no click or drag), eased so it glides */
  let cur=50,tgt=50,raf=null,last=0,lastShown=-1;
  const paint=v=>{if(Math.abs(v-lastShown)<.05)return;lastShown=v;c.style.setProperty('--pos',v.toFixed(2));input.value=Math.round(v)};
  const tick=now=>{
    const dt=Math.min(100,now-(last||now));last=now;
    cur+=(tgt-cur)*(1-Math.pow(1-.2,dt/16.667));
    if(Math.abs(tgt-cur)<.05){cur=tgt;raf=null;last=0}else raf=requestAnimationFrame(tick);
    paint(cur);
  };
  const go=(v,instant)=>{tgt=clamp(v,0,100);if(instant||RM.matches){cur=tgt;paint(cur);return}if(raf===null)raf=requestAnimationFrame(tick)};
  const fromEvent=e=>{const r=c.getBoundingClientRect();return (e.clientX-r.left)/r.width*100};
  c.addEventListener('pointermove',e=>{c.classList.add('touched');go(fromEvent(e))});
  c.addEventListener('pointerdown',e=>{c.classList.add('touched');go(fromEvent(e))});
  input.addEventListener('input',()=>go(+input.value,true));
  let played=false;
  new IntersectionObserver(([e])=>{
    if(!e.isIntersecting||played||RM.matches)return;played=true;
    cur=90;paint(cur);setTimeout(()=>{if(!c.classList.contains('touched'))go(50)},350);
  },{threshold:.5}).observe(c);
})();

/* ---------- the box (drawn, shared by the system scene and the configurator) ---------- */
function boxSVG(uid){
  const edges='M70 150L208.6 230L208.6 380L70 300Z M208.6 230L303.9 175L303.9 325L208.6 380 M70 150L117.65 62.5L256.25 142.5L208.6 230 M256.25 142.5L303.9 175 M145.37 78.5L145.37 32.5L228.53 80.5L228.53 126.5 M166.16 76.5L207.74 100.5L207.74 84.5L166.16 60.5Z';
  const pd=`<path d="M6 14c5-7 11 5 16-2"/><path d="M34 8c4 6 10 6 14 0"/><path d="M56 22c-6 3-6 10 0 13"/><path d="M8 40c6 4 12-4 18 0s10 4 14-2"/><circle cx="48" cy="52" r="4.5"/><path d="M22 58q5 5 10 0"/>`;
  const pw=`<path d="M0 9C5 3 10 3 15 9S25 15 30 9"/><path d="M0 25C5 19 10 19 15 25S25 31 30 25"/>`;
  const faces=(pat)=>`<g transform="matrix(.866 .5 0 1 70 150)"><rect width="160" height="150" fill="url(#${pat}-${uid})"/></g><g transform="matrix(.866 -.5 0 1 208.6 230)"><rect width="110" height="150" fill="url(#${pat}-${uid})"/></g><g transform="matrix(.866 .5 .4784 -.8785 70 150)"><rect width="160" height="99.6" fill="url(#${pat}-${uid})"/></g>`;
  return `<svg class="box-svg" viewBox="0 0 380 420" aria-hidden="true" data-pattern="doodle">
  <defs>
    <pattern id="pd-${uid}" width="66" height="66" patternUnits="userSpaceOnUse"><g class="pat">${pd}</g></pattern>
    <pattern id="pw-${uid}" width="30" height="32" patternUnits="userSpaceOnUse"><g class="pat">${pw}</g></pattern>
  </defs>
  <ellipse class="shadow" cx="196" cy="382" rx="138" ry="18"/>
  <g class="paint">
    <path class="f" d="M70 150L208.6 230L208.6 380L70 300Z"/>
    <path class="f" d="M208.6 230L303.9 175L303.9 325L208.6 380Z"/>
    <path class="f" d="M70 150L208.6 230L256.25 142.5L117.65 62.5Z"/>
    <path class="f" d="M208.6 230L303.9 175L256.25 142.5Z"/>
    <path class="f" fill-rule="evenodd" d="M145.37 78.5L228.53 126.5L228.53 80.5L145.37 32.5Z M166.16 76.5L207.74 100.5L207.74 84.5L166.16 60.5Z"/>
  </g>
  <g class="pat-all"><g class="pat-d">${faces('pd')}</g><g class="pat-w" style="display:none">${faces('pw')}</g></g>
  <g class="paint">
    <path class="sh-d" d="M208.6 230L303.9 175L303.9 325L208.6 380Z"/>
    <path class="sh-dd" d="M208.6 230L303.9 175L256.25 142.5Z"/>
    <path class="sh-l" d="M70 150L208.6 230L256.25 142.5L117.65 62.5Z"/>
  </g>
  <g class="brand-g" transform="matrix(.866 .5 0 1 70 150)">
    <rect class="plate" x="14" y="60" width="132" height="44" rx="8"/>
    <text class="name" x="80" y="90" text-anchor="middle" font-size="18">TU MARCA</text>
  </g>
  <path class="outline" pathLength="1" d="${edges}"/>
</svg>`;
}
function setPattern(svg,p){
  svg.dataset.pattern=p;
  $('.pat-d',svg).style.display=p==='doodle'?'':'none';
  $('.pat-w',svg).style.display=p==='wave'?'':'none';
}
function setName(svg,name){
  const t=$('.name',svg),txt=(name||'TU MARCA').toUpperCase().slice(0,18);
  t.textContent=txt;t.setAttribute('font-size',Math.max(8,Math.min(24,118/(txt.length*.84))).toFixed(1));
}
if($('#sysBox'))$('#sysBox').innerHTML=boxSVG('sys');

/* ---------- catalog: the page's product data, merged with the live Shopify products (snippets/h4-catalog.liquid) ---------- */
/* Names, images, per-piece prices and variant ids come from Shopify; categories and short specs are the page's. */
/* volume tiers and the 50 to 5,000 pieces range come from assets/h4ndle.js (one source for cart, cards and configurator) */
const TIERS=window.H4.TIERS||[{min:50,max:249,label:'50 a 249'},{min:250,max:999,label:'250 a 999'},{min:1000,max:5000,label:'1,000 a 5,000'}];
const MINQ=window.H4.MINQ||50,MAXQ=window.H4.MAXQ||5000;
/* "Pizza" is no longer its own tab (client request, 10-oct): the pizza box shows under Fast Food.
   Nothing was deleted: SPLIT_PIZZA=true brings back the Pizza tab (the script unhides it in sections/h4-tienda.liquid) and the pizza category. */
const SPLIT_PIZZA=false;
const META=[
  {id:'caja-asa',name:'Caja con asa',cats:['fastfood','bakery'],catLabel:'Fast Food',spec:'Para combos y pedidos grandes.',p:[14.9,11.5,8.9]},
  {id:'caja-hamburguesa',name:'Caja para hamburguesa',cats:['fastfood'],catLabel:'Fast Food',spec:'Para hamburguesas sencillas o dobles.',p:[9.9,7.4,5.6]},
  {id:'charola-hotdog',name:'Charola para hot dog',cats:['fastfood'],catLabel:'Fast Food',spec:'Para hot dogs, baguettes y snacks.',p:[6.9,5.2,3.9]},
  {id:'caja-pizza',name:'Caja para pizza',cats:['pizza'],catLabel:'Pizza',spec:'Para pizzas enteras, con tu marca en la tapa.',p:[18.9,14.5,11.2]},
  {id:'caja-sushi',name:'Caja para sushi',cats:['sushi'],catLabel:'Asian & Sushi',spec:'Para rollos, nigiri y combos.',p:[12.9,9.8,7.5]},
  {id:'caja-postres',name:'Caja para postres',cats:['bakery'],catLabel:'Bakery & Desserts',spec:'Con ventana para que se antoje desde afuera.',p:[13.9,10.6,8.2]},
  {id:'cono-helado',name:'Cono para helado',cats:['bakery'],catLabel:'Bakery & Desserts',spec:'Para helado suave y postres fríos.',p:[4.9,3.6,2.7]},
  {id:'bolsa-asa',name:'Bolsa con asa',cats:['fastfood','pizza','sushi','bakery'],catLabel:'Para todo',spec:'Para llevar el pedido completo en una sola mano.',p:[11.9,9.1,6.9]}
];
const CAT=window.H4.CAT||{};
const unPizza=m=>SPLIT_PIZZA?m:Object.assign({},m,{cats:[...new Set(m.cats.map(c=>c==='pizza'?'fastfood':c))],catLabel:m.catLabel==='Pizza'?'Fast Food':m.catLabel});
const CAT_ALIAS=SPLIT_PIZZA?{}:{pizza:'fastfood'}; /* old links with data-filter="pizza" (footer, kitchens) open Fast Food */
const PRODUCTS=META.map(unPizza).map(m=>{
  const s=(CAT.products&&CAT.products[m.id])||null;
  const vs=s&&Array.isArray(s.variants)&&s.variants.length?s.variants:null;
  return Object.assign({},m,{
    name:s&&s.title?s.title:m.name,
    img:(s&&s.image)||(CAT.fallbackImages&&CAT.fallbackImages[m.id])||'',
    p:vs?[0,1,2].map(i=>vs[Math.min(i,vs.length-1)].price/100):m.p,
    shop:s
  });
});
const byId=Object.fromEntries(PRODUCTS.map(p=>[p.id,p]));
const tierOf=q=>q>=1000?2:q>=250?1:0;
const unitPrice=(p,q)=>p.p[tierOf(q)];
const COLORS=[['#134BA5','Azul H4NDLE'],['#D62839','Rojo chile'],['#1B8A5A','Verde'],['#16181D','Negro'],['#E4611B','Naranja'],['#7B3FA0','Morado'],['#D63F7A','Rosa']];
const NOT_READY='Este producto aún no está disponible en la tienda.';
const pzas=q=>`${q.toLocaleString('es-MX')} piezas`;

/* quick add from the shop cards: 50 pieces at the right volume price */
function quickAdd(id){
  const p=byId[id],vid=Cart.variantFor(id,50);
  if(!p||!vid){window.H4.toast(NOT_READY);return}
  Cart.add([{id:vid,quantity:50}],{toast:`Agregado: ${p.name}, ${pzas(50)}`}).catch(()=>{});
}
/* "Crear mi empaque" (sections/h4-crear.liquid): a <dialog> panel by default; a normal section when its setting
   "Mostrar como sección en la página" is on (the way it was before 10-oct) */
const crEl=$('#crear');
const OVERLAY=!!(crEl&&crEl.tagName==='DIALOG');
let cfgWant=null;
let selectProduct=id=>{if(byId[id])cfgWant=id}; /* until the configurator is built it only remembers the product */
/* a catalog slot (caja-pizza) or a Shopify handle (caja-para-pizza) -> slot id */
const resolveId=w=>{w=String(w||'');if(!w)return '';if(byId[w])return w;const p=PRODUCTS.find(x=>x.shop&&x.shop.handle===w);return p?p.id:''};

/* ---------- shop: display order and search words (PRODUCTS keeps its own order: the configurator uses it) ---------- */
const GROUPS=[
  {id:'populares',label:'Los más pedidos',sub:'Los que tu cliente ubica al instante.',ids:['caja-hamburguesa','caja-pizza','caja-sushi','caja-postres']},
  {id:'innovadores',label:'Innovadores',sub:'Formatos nuevos para que tu marca se note.',ids:['caja-asa','charola-hotdog','cono-helado','bolsa-asa']}
];
const groupOf={};GROUPS.forEach(g=>g.ids.forEach(id=>{groupOf[id]=g.id}));
const CAT_WORDS={fastfood:'fast food comida rapida',pizza:'pizza pizzeria',sushi:'asian sushi comida asiatica japonesa',bakery:'bakery desserts postres panaderia reposteria pan dulce'};
const KW={'caja-asa':'combos pedidos grandes para llevar','caja-hamburguesa':'hamburguesas burger','charola-hotdog':'hotdog salchicha baguette snacks','caja-pizza':'pizzas pizzeria','caja-sushi':'rollos nigiri','caja-postres':'pastel pasteles galletas','cono-helado':'helados nieve paletas','bolsa-asa':'bolsas delivery para llevar'};
/* no accents, no case, no punctuation: "Hamburguésa" finds "hamburguesa" */
const MARKS=new RegExp('['+String.fromCharCode(0x300)+'-'+String.fromCharCode(0x36f)+']','g'); /* the accents NFD splits off (U+0300 to U+036F) */
const norm=s=>String(s||'').normalize('NFD').replace(MARKS,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const STOP=new Set(['de','del','la','las','el','los','para','con','en','al','un','una','unos','unas','por','mi','mis','tu','tus','su','sus','que']);
const HAY=Object.fromEntries(PRODUCTS.map(p=>{
  const m=META.find(x=>x.id===p.id)||{},g=GROUPS.find(x=>x.id===groupOf[p.id])||{}; /* p.cats: categories after the pizza merge */
  return [p.id,norm([p.name,m.name,p.spec,p.catLabel,p.cats.map(c=>CAT_WORDS[c]||c).join(' '),g.label,KW[p.id]].join(' '))];
}));
const terms=q=>norm(q).split(' ').filter(t=>t.length>1&&!STOP.has(t));
/* "postres" also finds "postre", "hamburguesas" finds "hamburguesa" */
const hit=(hay,t)=>[t,t.length>3&&t.endsWith('s')?t.slice(0,-1):'',t.length>4&&t.endsWith('es')?t.slice(0,-2):''].some(v=>v&&hay.includes(v));

/* ---------- shop cards: fixed order, not random. First row: one per industry (hamburguesa, pizza, sushi, postres); second row: the most innovative ---------- */
const cardsEl=$('#cards')||document.createElement('div');
const tabsEl=$('#tabs')||document.createElement('div');
const FOUR='<svg viewBox="0 0 264.45 279.85" aria-hidden="true"><use href="#four"/></svg>';
const total=v=>(Math.round(v*100)%100===0?(window.H4.money0||money):money).format(v); /* 50 pieces at the first tier: whole pesos without decimals ($495), otherwise with them */
const cardHTML=(p,i)=>`<article class="card" style="--i:${i}" data-id="${p.id}" data-cats="${p.cats.join(' ')}">
  <div class="ph"><img src="${p.img}" width="900" height="900" loading="lazy" alt="${esc(p.name)} azul cobalto con dibujos blancos"><span class="tn-badge"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 8.5l3 3 6-7"/></svg>En tu kit</span></div>
  <div class="body"><p class="cat mono">${p.catLabel.replace('&','&amp;')}</p><h3>${esc(p.name)}</h3><p class="spec">${p.spec}</p>
  <div class="price"><b>${money.format(p.p[0])}</b><span>c/u · 50 piezas = ${total(p.p[0]*50)}</span></div>
  <p class="vol">${money.format(p.p[2])} c/u desde 1,000</p>
  <p class="eta">Llega en 4 días*</p>
  <div class="acts"><button class="btn sm" type="button" data-add="${p.id}">Agregar 50 pzas</button><a href="#crear" data-custom="${p.id}"${OVERLAY?' aria-haspopup="dialog"':''} aria-label="Personalizar ${esc(p.name)} con tu marca">Personalizar</a></div></div></article>`;
let gi=0;
cardsEl.innerHTML=GROUPS.map(g=>`<h3 class="tn-group" style="--i:${gi++}">${FOUR}<b>${esc(g.label)}</b><span>${esc(g.sub)}</span></h3>`+g.ids.filter(id=>byId[id]).map(id=>cardHTML(byId[id],gi++)).join('')).join('')
  +PRODUCTS.filter(p=>!groupOf[p.id]).map(p=>cardHTML(p,gi++)).join('');
cardsEl.addEventListener('click',e=>{
  const a=e.target.closest('[data-add]');if(a){quickAdd(a.dataset.add);return}
  /* "Personalizar": in panel mode the #crear click handler below opens the panel with this product; inline, it preselects and scrolls */
  const c=e.target.closest('[data-custom]');if(c&&!OVERLAY)selectProduct(c.dataset.custom);
});

/* ---------- filters: category tabs + text search, combined ---------- */
const shop={cat:'all',q:''};
const qEl=$('#shopQ'),countEl=$('#shopCount'),emptyEl=$('#shopEmpty'),emptyMsg=$('#shopEmptyMsg');
if(SPLIT_PIZZA){const pt=$('.tab[data-cat="pizza"]',tabsEl);if(pt)pt.hidden=false}
const tabList=()=>$$('.tab',tabsEl).filter(t=>!t.hidden);
let countT=null;
function applyFilter(lazy){
  const ts=terms(shop.q),grouped=shop.cat==='all'&&!ts.length,byGroup=GROUPS.some(g=>g.id===shop.cat);let n=0;
  $$('.card',cardsEl).forEach(c=>{
    const id=c.dataset.id;
    const inCat=shop.cat==='all'||(byGroup?groupOf[id]===shop.cat:c.dataset.cats.split(' ').includes(shop.cat));
    const ok=inCat&&ts.every(t=>hit(HAY[id]||'',t));
    c.classList.toggle('hide',!ok);if(ok)n++;
  });
  $$('.tn-group',cardsEl).forEach(g=>g.classList.toggle('hide',!grouped));
  const q=ts.length?shop.q.trim().slice(0,40):'',tab=tabList().find(t=>t.dataset.cat===shop.cat);
  const what=q?` para “${q}”`:'',where=shop.cat!=='all'&&tab?` en ${tab.textContent.trim()}`:'';
  if(emptyEl)emptyEl.hidden=n>0;
  if(emptyMsg&&!n)emptyMsg.textContent=`No encontramos empaques${what}${where}.`;
  const txt=n?`${n} ${n===1?'empaque':'empaques'}${what}${where}`:`Sin resultados${what}${where}`;
  const put=()=>{if(countEl&&countEl.textContent!==txt)countEl.textContent=txt};
  clearTimeout(countT);if(lazy)countT=setTimeout(put,400);else put(); /* while typing, the live count waits for a pause */
}
function setFilter(cat,q){
  cat=CAT_ALIAS[cat]||cat;
  const tabs=tabList();
  if(tabs.length&&!tabs.some(t=>t.dataset.cat===cat))cat='all';
  shop.cat=cat;
  if(typeof q==='string'){shop.q=q;if(qEl&&qEl.value!==q)qEl.value=q}
  tabs.forEach(t=>{const on=t.dataset.cat===cat;t.setAttribute('aria-selected',String(on));t.tabIndex=on?0:-1});
  applyFilter();
}
tabsEl.addEventListener('click',e=>{const t=e.target.closest('.tab');if(t)setFilter(t.dataset.cat)});
tabsEl.addEventListener('keydown',e=>{
  if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;
  const tabs=tabList(),i=tabs.indexOf(document.activeElement);if(i<0)return;
  e.preventDefault();
  const j=e.key==='Home'?0:e.key==='End'?tabs.length-1:(i+(e.key==='ArrowRight'?1:tabs.length-1))%tabs.length;
  tabs[j].focus();setFilter(tabs[j].dataset.cat);
});
if(qEl){
  qEl.addEventListener('input',()=>{shop.q=qEl.value;applyFilter(true)});
  qEl.addEventListener('keydown',e=>{if(e.key==='Escape'&&qEl.value){e.preventDefault();setFilter(shop.cat,'')}});
}
const clearBtn=$('#shopClear');
if(clearBtn)clearBtn.addEventListener('click',()=>{setFilter('all','');if(qEl)qEl.focus()});
/* links elsewhere (footer, kitchens) open one category with a clean search */
$$('[data-filter]').forEach(a=>a.addEventListener('click',()=>setFilter(a.dataset.filter,'')));
setFilter('all');

/* ---------- brand kit: follows the real cart (h4:cart events from h4ndle.js); the discount itself is the bundle code in h4ndle.js ---------- */
const kitEl=$('#kit'),kitSlots=$('#kitSlots'),kitMsg=$('#kitMsg');
const slotHTML=(i,p)=>p
  ?`<li class="tn-slot full"><span class="tn-slot-ph">${p.img?`<img src="${esc(p.img)}" alt="" width="120" height="120" decoding="async">`:FOUR}<i aria-hidden="true">${i+1}</i></span><span class="tn-slot-name">${esc(p.name)}</span></li>`
  :`<li class="tn-slot"><span class="tn-slot-ph">${FOUR}<i aria-hidden="true">${i+1}</i></span><span class="tn-slot-name">Empaque ${i+1}<span class="sr-only">, por elegir</span></span></li>`;
function renderKit(cart,distinct){
  const items=(cart&&cart.items)||[];
  const ids=[...new Set(items.map(it=>Cart.slotOf(it.product_id)).filter(id=>id&&byId[id]))];
  $$('.card',cardsEl).forEach(c=>c.classList.toggle('in-kit',ids.includes(c.dataset.id)));
  if(!kitEl)return;
  const need=CAT.bundleMin||3,n=typeof distinct==='number'?distinct:ids.length,left=Math.max(0,need-n);
  const key=ids.slice(0,need).join(',');
  if(kitSlots&&kitSlots.dataset.key!==key){kitSlots.dataset.key=key;kitSlots.innerHTML=Array.from({length:need},(_,i)=>slotHTML(i,byId[ids[i]])).join('')}
  const txt=left?`Te ${left===1?'falta 1':`faltan ${left}`} para tu regalo.`:'¡Listo! Tu regalo ya va en tu pedido.';
  if(kitMsg&&kitMsg.textContent!==txt)kitMsg.textContent=txt;
  kitEl.style.setProperty('--kp',Math.min(1,n/need).toFixed(3));
  kitEl.classList.toggle('done',!left);
}
document.addEventListener('h4:cart',e=>{const d=e.detail||{};renderKit(d.cart,d.distinct)});

/* ---------- configurator (the one interactive moment) ---------- */
/* Styles come from assets/patterns.js and product drawings from assets/shapes-a.js and shapes-b.js.
   If one of those files is missing, this falls back to the drawn gable box and three built-in styles.
   In panel mode it is built the first time the panel opens (nothing of it runs while the home page loads). */
function arrival(){
  const now=new Date(),biz=d=>d.getDay()!==0&&d.getDay()!==6;
  const d=new Date(now);
  if(!biz(d)||d.getHours()>=14){do{d.setDate(d.getDate()+1)}while(!biz(d))}
  const approve=new Date(d);let n=0;
  while(n<4){d.setDate(d.getDate()+1);if(biz(d))n++}
  const f=new Intl.DateTimeFormat('es-MX',{weekday:'long',day:'numeric',month:'long'});
  const sameDay=approve.toDateString()===now.toDateString();
  return `Si apruebas tu diseño ${sameDay?'hoy antes de las 2:00 p.m.':'el '+f.format(approve)}, llega el <b>${f.format(d)}</b>.`;
}
let cfgReady=false,cfgDone=null;
function initCfg(){
if(cfgReady||!$('#cfg')||!$('#cfgBox'))return;
cfgReady=true;
const FALLBACK_PATS=[
  {id:'doodle',name:'Doodles',def:u=>`<pattern id="pat-${u}" width="66" height="66" patternUnits="userSpaceOnUse"><g fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 14c5-7 11 5 16-2"/><path d="M34 8c4 6 10 6 14 0"/><path d="M56 22c-6 3-6 10 0 13"/><path d="M8 40c6 4 12-4 18 0s10 4 14-2"/><circle cx="48" cy="52" r="4.5"/><path d="M22 58q5 5 10 0"/></g></pattern>`},
  {id:'wave',name:'Ondas',def:u=>`<pattern id="pat-${u}" width="30" height="32" patternUnits="userSpaceOnUse"><g fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round"><path d="M0 9C5 3 10 3 15 9S25 15 30 9"/><path d="M0 25C5 19 10 19 15 25S25 31 30 25"/></g></pattern>`},
  {id:'plain',name:'Liso',def:u=>`<pattern id="pat-${u}" width="10" height="10" patternUnits="userSpaceOnUse"></pattern>`}
];
const PATS=(Array.isArray(window.H4Patterns)&&window.H4Patterns.length)?window.H4Patterns:FALLBACK_PATS;
const SHAPES=window.H4Shapes||{};
const cfg={id:byId[cfgWant]?cfgWant:'caja-asa',name:'',color:COLORS[0],pat:PATS[0],qty:250,logo:null,logoName:'',logoFile:null,logoWhite:true};
const cfgHost=$('#cfgBox');let cfgSvg=null;
const WHITE_F=u=>`<filter id="wht-${u}" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 1 0"/></filter>`;
const brandName=()=>(cfg.name||'Tu marca').toUpperCase().slice(0,18);
const msgEl=$('#cfgMsg');
const say=t=>{if(!msgEl)return;msgEl.textContent=t||'';msgEl.hidden=!t};
function drawShape(){
  const s=SHAPES[cfg.id];let inner=null;
  try{if(s)inner=s.draw({uid:'cfg',patFill:'url(#pat-cfg)'})}catch(e){inner=null}
  if(inner){cfgHost.innerHTML=`<svg class="box-svg" viewBox="0 0 380 420" aria-hidden="true"><defs></defs><g>${inner}</g></svg>`}
  else{
    cfgHost.innerHTML=boxSVG('cfg');
    const sv=$('svg',cfgHost);$('.pat-w',sv).remove();$('.pat-d',sv).style.display='';
    $$('.pat-all rect',sv).forEach(r=>r.setAttribute('fill','url(#pat-cfg)'));
    Object.assign($('.brand-g',sv).dataset,{x:14,y:56,w:132,h:50});
  }
  cfgSvg=$('svg',cfgHost);
  cfgSvg.style.setProperty('--bx',cfg.color[0]);
  paintPattern();fillBrand();
}
function paintPattern(){
  if(!cfgSvg)return;
  const defs=$('defs',cfgSvg),old=cfgSvg.querySelector('#pat-cfg');if(old)old.remove();
  let def='';try{def=cfg.pat.def('cfg',{name:brandName()})}catch(e){def=FALLBACK_PATS[2].def('cfg')}
  defs.insertAdjacentHTML('beforeend',def);
  if(!cfgSvg.querySelector('#wht-cfg'))defs.insertAdjacentHTML('beforeend',WHITE_F('cfg'));
}
function fillBrand(){
  const g=cfgSvg&&$('.brand-g',cfgSvg);if(!g)return;
  const x=+g.dataset.x||0,y=+g.dataset.y||0,w=+g.dataset.w||120,h=+g.dataset.h||44;
  const name=brandName(),n=Math.max(4,name.length);
  const txt=(cx,cy,maxW,maxH)=>{const fs=Math.max(5,Math.min(maxH,maxW/(n*.98)));return `<text class="name" x="${cx.toFixed(1)}" y="${(cy+fs*.36).toFixed(1)}" text-anchor="middle" font-size="${fs.toFixed(1)}">${esc(name)}</text>`};
  const img=(ix,iy,s)=>`<image class="logo" href="${cfg.logo}" x="${ix.toFixed(1)}" y="${iy.toFixed(1)}" width="${s.toFixed(1)}" height="${s.toFixed(1)}" preserveAspectRatio="xMidYMid meet"${cfg.logoWhite?' filter="url(#wht-cfg)"':''}/>`;
  let out=`<rect class="plate" x="${x}" y="${y}" width="${w}" height="${h}" rx="${Math.min(8,h/5).toFixed(1)}"/>`;
  if(cfg.logo&&!cfg.name){const s=Math.min(w*.8,h*.84);out+=img(x+w/2-s/2,y+h/2-s/2,s)}
  else if(cfg.logo&&w/h>=2.4){const pad=h*.12,s=h-pad*2,tx=x+pad*2+s,tw=w-(tx-x)-pad;out+=img(x+pad,y+pad,s)+txt(tx+tw/2,y+h/2,tw,h*.42)}
  else if(cfg.logo){const pad=h*.08,s=h*.58;out+=img(x+w/2-s/2,y+pad,s)+txt(x+w/2,y+pad+s+(h-pad-s)/2,w*.9,(h-s-pad*2)*.8)}
  else out+=txt(x+w/2,y+h/2,w*.9,h*.5);
  g.innerHTML=out;
}
function applyColor(){if(cfgSvg)cfgSvg.style.setProperty('--bx',cfg.color[0]);$('#cfgPatterns').style.setProperty('--bx',cfg.color[0])}
$('#cfgProducts').innerHTML=PRODUCTS.map(p=>`<label class="opt"><input type="radio" name="prod" value="${p.id}" ${p.id===cfg.id?'checked':''}><span>${esc(p.name)}</span></label>`).join('');
$('#cfgColors').innerHTML=COLORS.map(([c,n],i)=>`<label class="sw" title="${n}"><input type="radio" name="color" value="${i}" ${i===0?'checked':''} aria-label="${n}"><span style="--c:${c}"></span></label>`).join('');
$('#cfgPatterns').innerHTML=PATS.map((p,i)=>{
  let d='';try{d=p.def('sw'+i,{name:'H4'})}catch(e){}
  return `<label class="opt"><input type="radio" name="pat" value="${i}" ${i===0?'checked':''}><span><svg class="psw" viewBox="0 0 40 40" aria-hidden="true"><defs>${d}</defs><g transform="scale(.55)"><rect width="74" height="74" style="fill:var(--bx)"/><rect width="74" height="74" fill="url(#pat-sw${i})"/></g></svg>${esc(p.name)}</span></label>`;
}).join('');
/* logo upload: previewed in the browser; on "Agregar al carrito" the file travels as a line item property and Shopify stores it with the order */
function setLogo(file){
  const err=$('#logoErr');err.hidden=true;if(!file)return;
  if(!/^image\/(png|jpeg|webp|svg\+xml)$/.test(file.type)){err.textContent='Ese archivo no es una imagen compatible. Usa PNG, JPG, WEBP o SVG.';err.hidden=false;return}
  if(file.size>5*1024*1024){err.textContent='Tu logo pesa más de 5 MB. Prueba con una versión más ligera.';err.hidden=false;return}
  if(cfg.logo)URL.revokeObjectURL(cfg.logo);
  cfg.logo=URL.createObjectURL(file);cfg.logoName=file.name;cfg.logoFile=file;
  $('#logoThumb').src=cfg.logo;$('#logoName').textContent=file.name;$('#logoRow').hidden=false;
  fillBrand();
}
function clearLogo(){if(cfg.logo)URL.revokeObjectURL(cfg.logo);cfg.logo=null;cfg.logoName='';cfg.logoFile=null;$('#cfgLogo').value='';$('#logoRow').hidden=true;$('#logoThumb').removeAttribute('src');fillBrand()}
$('#cfgLogo').addEventListener('change',e=>setLogo(e.target.files[0]));
$('#logoRemove').addEventListener('click',clearLogo);
$('#logoWhite').addEventListener('change',e=>{cfg.logoWhite=e.target.checked;fillBrand()});
const drop=$('#logoDrop');
['dragenter','dragover'].forEach(t=>drop.addEventListener(t,e=>{e.preventDefault();drop.classList.add('over')}));
['dragleave','drop'].forEach(t=>drop.addEventListener(t,()=>drop.classList.remove('over')));
drop.addEventListener('drop',e=>{e.preventDefault();setLogo(e.dataTransfer.files&&e.dataTransfer.files[0])});
function renderCfg(){
  const p=byId[cfg.id],u=unitPrice(p,cfg.qty),tot=u*cfg.qty,ti=tierOf(cfg.qty);
  $('#cfgQtyOut').textContent=cfg.qty.toLocaleString('es-MX')+' pzas';
  $('#cfgQty').value=cfg.qty;
  $('#cfgTiers').innerHTML=TIERS.map((t,i)=>`<div class="${i===ti?'on':''}"><b>${money.format(p.p[i])}</b>${t.label} pzas</div>`).join('');
  $('#cfgUnit').textContent=money.format(u);
  $('#cfgTotal').textContent=money.format(tot);
  $('#cfgAdd').textContent='Agregar al carrito · '+money.format(tot);
  $('#cfgThumb').src=p.img;$('#cfgProdName').textContent=p.name;
}
selectProduct=function(id){if(!byId[id])return;say('');if(id===cfg.id&&cfgSvg)return;cfg.id=id;const r=$(`#cfgProducts input[value="${id}"]`);if(r)r.checked=true;drawShape();renderCfg()};
$('#cfg').addEventListener('change',e=>{
  const t=e.target;
  if(t.name==='prod'){cfg.id=t.value;say('');drawShape();renderCfg()}
  else if(t.name==='color'){cfg.color=COLORS[+t.value];applyColor()}
  else if(t.name==='pat'){cfg.pat=PATS[+t.value];paintPattern()}
});
$('#cfgName').addEventListener('input',e=>{cfg.name=e.target.value.trim();fillBrand();if(cfg.pat.id==='mono')paintPattern()});
const qtyEl=$('#cfgQty');qtyEl.min=MINQ;qtyEl.max=MAXQ; /* 50 to 5,000 pieces, same range as the cart */
qtyEl.addEventListener('input',e=>{cfg.qty=clamp(+e.target.value,MINQ,MAXQ);renderCfg()});
$('#qMinus').addEventListener('click',()=>{cfg.qty=Math.max(MINQ,cfg.qty-50);renderCfg()});
$('#qPlus').addEventListener('click',()=>{cfg.qty=Math.min(MAXQ,cfg.qty+50);renderCfg()});
$('#cfg').addEventListener('submit',e=>{
  e.preventDefault();say('');
  const p=byId[cfg.id],vid=Cart.variantFor(cfg.id,cfg.qty);
  if(!p||!vid){say(NOT_READY);window.H4.toast(NOT_READY);return}
  /* the brand choices travel with the line (visible in the cart, checkout and order); the logo file is uploaded by Shopify */
  const props={'Marca':cfg.name||'Tu marca','Color':cfg.color[1],'Color HEX':cfg.color[0],'Estilo':cfg.pat.name};
  const msg=`Agregado: ${p.name}, ${pzas(cfg.qty)}`,btn=$('#cfgAdd'),qty=cfg.qty;
  btn.disabled=true;
  let run;
  if(cfg.logoFile){
    const fd=new FormData();
    fd.append('id',vid);fd.append('quantity',qty);
    Object.entries(props).forEach(([k,v])=>fd.append(`properties[${k}]`,v));
    fd.append('properties[Logo]',cfg.logoFile,cfg.logoFile.name);
    const name=cfg.logoName;
    run=Cart.add(fd,{toast:msg,quiet:true}).catch(()=>Cart.add([{id:vid,quantity:qty,properties:Object.assign({},props,{'Logo':`${name} (pendiente)`})}],{toast:msg}));
  }else{
    run=Cart.add([{id:vid,quantity:qty,properties:Object.assign({},props,{'Logo':'Sin logo'})}],{toast:msg});
  }
  /* in the panel: once it is in the cart the panel closes and the "Agregado" toast (with "Ver carrito") is in view */
  run.then(()=>{if(cfgDone)cfgDone()},()=>say('No pudimos agregar el producto a tu carrito. Intenta de nuevo.')).finally(()=>{btn.disabled=false});
});
$('#cfgEta').innerHTML=arrival();
drawShape();applyColor();renderCfg();
}

/* ---------- the panel: a native modal <dialog> (focus stays inside, Esc closes, the page behind is inert and does not scroll) ---------- */
const FOCUSABLE='a[href],button:not([disabled]),input:not([disabled]):not([type="hidden"]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
const Crear=OVERLAY?(()=>{
  const dlg=crEl,panel=$('.cr-panel',dlg),body=$('.cr-body',dlg),root=document.documentElement;
  let back=null,shutT=null,clean=true;
  const shown=el=>el.getClientRects().length>0;
  const isOpen=()=>dlg.hasAttribute('open');
  /* after closing (by us, or by the browser on Esc): unlock the page, tidy the URL and give focus back to what opened it */
  function finish(){
    if(clean)return;clean=true;
    clearTimeout(shutT);shutT=null;dlg.classList.remove('on');
    root.classList.remove('cr-lock');cleanUrl();
    const b=back;back=null;
    if(b&&b.isConnected&&typeof b.focus==='function')b.focus({preventScroll:true});
  }
  const shut=()=>{if(isOpen()){if(typeof dlg.close==='function')dlg.close();else dlg.removeAttribute('open')}finish()};
  /* closing drops #crear and ?personalizar from the address bar, so a reload does not reopen the panel */
  function cleanUrl(){
    try{
      const u=new URL(location.href);let ch=false;
      if(u.hash==='#crear'){u.hash='';ch=true}
      if(u.searchParams.has('personalizar')){u.searchParams.delete('personalizar');ch=true}
      if(ch)history.replaceState(history.state,'',u.pathname+u.search+u.hash);
    }catch(e){}
  }
  function open(id){
    if(id&&!cfgReady&&byId[id])cfgWant=id; /* first open: build it straight with this product */
    initCfg();
    if(id)selectProduct(id);
    const eta=$('#cfgEta');if(eta)eta.innerHTML=arrival();
    if(isOpen()&&!shutT)return; /* already open: the product just changes in place */
    clearTimeout(shutT);shutT=null;
    if(!isOpen()){
      const a=document.activeElement;back=a&&a!==document.body&&a!==root?a:null;
      /* scroll lock without a jump: the scrollbar's width goes back as padding while the page cannot scroll */
      root.style.setProperty('--cr-sbw',Math.max(0,innerWidth-root.clientWidth)+'px');
      clean=false;root.classList.add('cr-lock');
      if(typeof dlg.showModal==='function'){try{dlg.showModal()}catch(e){dlg.setAttribute('open','')}}else dlg.setAttribute('open','');
      if(body)body.scrollTop=0;
      if(!dlg.contains(document.activeElement)){const x=$('.cr-x',dlg);if(x)x.focus()}
      getComputedStyle(panel).opacity; /* paint the closed state first, so the panel animates in */
    }
    dlg.classList.add('on');
  }
  function close(){
    if(!isOpen()||shutT)return;
    dlg.classList.remove('on');
    shutT=setTimeout(()=>{shutT=null;shut()},RM.matches?0:420);
  }
  cfgDone=close;
  dlg.addEventListener('close',finish);
  dlg.addEventListener('cancel',e=>{e.preventDefault();close()});
  dlg.addEventListener('click',e=>{if(e.target.closest('[data-cr-close]'))close()});
  dlg.addEventListener('keydown',e=>{
    if(e.key==='Escape'){e.preventDefault();close();return}
    if(e.key!=='Tab')return;
    const f=$$(FOCUSABLE,dlg).filter(shown);if(!f.length)return;
    const first=f[0],last=f[f.length-1],cur=document.activeElement;
    if(e.shiftKey&&(cur===first||!dlg.contains(cur))){e.preventDefault();last.focus()}
    else if(!e.shiftKey&&(cur===last||!dlg.contains(cur))){e.preventDefault();first.focus()}
  });
  return {open,close,get isOpen(){return isOpen()}};
})():null;
/* every link to #crear on this page (hero "Crear mi empaque", closing CTA, "Personalizar" on each card) opens the panel instead of jumping */
if(Crear){
  $$('a[href*="#crear"]').forEach(a=>a.setAttribute('aria-haspopup','dialog'));
  document.addEventListener('click',e=>{
    if(e.defaultPrevented||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;
    const a=e.target.closest&&e.target.closest('a[href]');if(!a)return;
    let u;try{u=new URL(a.href,location.href)}catch(_){return}
    if(u.hash!=='#crear'||u.origin!==location.origin||u.pathname!==location.pathname)return;
    e.preventDefault();
    Crear.open(resolveId(a.dataset.custom||u.searchParams.get('personalizar')));
  });
  addEventListener('hashchange',()=>{if(location.hash==='#crear')Crear.open(resolveId(new URLSearchParams(location.search).get('personalizar')))});
  /* theme editor: selecting the "H4 · Crear mi empaque" section shows the panel */
  const inCr=e=>e.target&&e.target.querySelector&&e.target.querySelector('#crear');
  document.addEventListener('shopify:section:select',e=>{if(inCr(e))Crear.open()});
  document.addEventListener('shopify:section:deselect',e=>{if(inCr(e))Crear.close()});
}else initCfg();
window.H4.crear=Crear; /* window.H4.crear.open('caja-pizza') opens the panel from anywhere */

const sysSvg=$('#sysBox svg');if(sysSvg)setName(sysSvg,'Tu marca');
renderKit(Cart.state);

/* ---------- go ---------- */
applyHeroMode();
if(RM.matches)pinToFinalStates();
(document.fonts&&document.fonts.ready?document.fonts.ready:Promise.resolve()).then(loadRamp);
frame(performance.now());
if(window.H4.paintNav)window.H4.paintNav();

/* /#crear and /?personalizar=<slot or product handle>#crear (links from product pages and /referidos) open the panel with that product */
(()=>{
  let want='';try{want=new URLSearchParams(location.search).get('personalizar')||''}catch(e){}
  const id=resolveId(want);
  if(Crear){if(location.hash==='#crear'||want)Crear.open(id)}
  else if(id)selectProduct(id);
})();
/* links from other pages land on #tienda, #garantia…: re-align once the pinned sections have their final height */
addEventListener('load',()=>{
  let id='';try{id=decodeURIComponent(location.hash.slice(1))}catch(e){}
  const t=id&&document.getElementById(id);if(!t||id==='main'||(Crear&&id==='crear'))return;
  requestAnimationFrame(()=>scrollTo({top:t.getBoundingClientRect().top+scrollY,behavior:'instant'}));
});
})();
