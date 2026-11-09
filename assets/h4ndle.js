/* H4NDLE · shared on every page: helpers, nav tone, reveals, toast and the cart drawer on the real Shopify cart.
   Exposes window.H4 (helpers + catalog) and window.H4Cart (cart API). The home page script (h4ndle-landing.js) builds on both. */
(()=>{
'use strict';
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const RM=matchMedia('(prefers-reduced-motion: reduce)');
function esc(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}

/* ---------- catalog (snippets/h4-catalog.liquid, money in cents) ---------- */
const DEFAULTS={currency:'MXN',routes:{root:'/',cart:'/cart',cartAdd:'/cart/add',cartChange:'/cart/change',cartUpdate:'/cart/update'},bundleCode:'',bundlePercent:30,bundleMin:3,freeShipping:250000,fallbackImages:{},products:{}};
const CAT=(()=>{
  try{
    const el=document.getElementById('h4-catalog');
    const d=el?JSON.parse(el.textContent):{};
    return Object.assign({},DEFAULTS,d,{routes:Object.assign({},DEFAULTS.routes,d.routes||{}),products:d.products||{},fallbackImages:d.fallbackImages||{}});
  }catch(e){console.warn('[H4NDLE] catálogo no válido',e);return DEFAULTS}
})();
const money=new Intl.NumberFormat('es-MX',{style:'currency',currency:CAT.currency||'MXN'});
const money0=new Intl.NumberFormat('es-MX',{style:'currency',currency:CAT.currency||'MXN',minimumFractionDigits:0,maximumFractionDigits:0});
const cents=v=>money.format((+v||0)/100);
/* volume tiers: 50 to 5,000 pieces per line (Shopify variants 1-3 of every catalog product, in this order) */
const TIERS=[{min:50,max:249,label:'50 a 249'},{min:250,max:999,label:'250 a 999'},{min:1000,max:5000,label:'1,000 a 5,000'}];
const MINQ=50,MAXQ=5000,STEP=50;
const tierOf=q=>q>=1000?2:q>=250?1:0;

/* catalog slots (caja-asa…) <-> Shopify products; every slot has 3 volume variants in tier order */
const pidToSlot={};
Object.keys(CAT.products).forEach(s=>{const p=CAT.products[s];if(p&&p.productId!=null)pidToSlot[String(p.productId)]=s});
const slotOf=pid=>pidToSlot[String(pid)]||null;
function variantFor(slot,q){
  const p=CAT.products[slot];if(!p||!Array.isArray(p.variants)||!p.variants.length)return null;
  return p.variants[Math.min(tierOf(q),p.variants.length-1)].id;
}

/* ---------- cart rules (pure, tested in tools/js-tests) ---------- */
const sameCode=(a,b)=>String(a).trim().toUpperCase()===String(b).trim().toUpperCase();
function codesOf(cart){
  if(!cart)return [];
  if(Array.isArray(cart.discount_codes))return cart.discount_codes.map(d=>d&&d.code).filter(Boolean);
  const set=new Set(),take=a=>{if(a&&a.type==='discount_code'&&a.title)set.add(a.title)};
  (cart.cart_level_discount_applications||[]).forEach(take);
  (cart.items||[]).forEach(it=>(it.line_level_discount_allocations||[]).forEach(al=>take(al.discount_application)));
  return [...set];
}
/* each catalog line: 50 to 5,000 pieces, on the variant of its volume tier */
function planNormalize(cart){
  const ops=[];
  ((cart&&cart.items)||[]).forEach(it=>{
    const slot=slotOf(it.product_id);if(!slot)return;
    const p=CAT.products[slot];if(!p||!Array.isArray(p.variants)||!p.variants.length)return;
    const want=clamp(it.quantity,MINQ,MAXQ);
    const to=p.variants[Math.min(tierOf(want),p.variants.length-1)].id;
    if(String(it.variant_id)!==String(to))ops.push({type:'swap',key:it.key,to,quantity:want,properties:it.properties||{}});
    else if(want!==it.quantity)ops.push({type:'qty',key:it.key,quantity:want});
  });
  return ops;
}
const distinctOf=cart=>new Set(((cart&&cart.items)||[]).filter(it=>slotOf(it.product_id)).map(it=>String(it.product_id))).size;
/* the bundle code rides on the cart only while it holds enough distinct catalog products; other codes are kept */
function planBundle(cart){
  const code=String(CAT.bundleCode||'').trim();if(!code)return null;
  const codes=codesOf(cart),has=codes.some(c=>sameCode(c,code)),enough=distinctOf(cart)>=(CAT.bundleMin||3);
  if(enough&&!has)return {apply:true,discount:codes.concat(code).join(',')};
  if(!enough&&has)return {apply:false,discount:codes.filter(c=>!sameCode(c,code)).join(',')};
  return null;
}

/* ---------- Shopify Cart AJAX API, one request at a time ---------- */
async function call(route,body){
  const opts={credentials:'same-origin',headers:{'Accept':'application/json'}};
  if(body===undefined){opts.method='GET';opts.cache='no-store'}
  else if(body instanceof FormData){opts.method='POST';opts.body=body}
  else{opts.method='POST';opts.headers['Content-Type']='application/json';opts.body=JSON.stringify(body)}
  const res=await fetch(CAT.routes[route]+'.js',opts);
  let data=null;try{data=await res.json()}catch(e){}
  if(!res.ok){const err=new Error((data&&(data.description||data.message))||('HTTP '+res.status));err.status=res.status;err.data=data;throw err}
  return data;
}
let chain=Promise.resolve();
const queue=fn=>{const run=chain.then(fn);chain=run.catch(()=>{});return run};

let bundleBlocked=false;
async function settle(cart){
  let ops=planNormalize(cart);
  if(ops.length){
    for(const op of ops){
      if(op.type==='qty')await call('cartChange',{id:op.key,quantity:op.quantity});
      else{
        await call('cartChange',{id:op.key,quantity:0});
        await call('cartAdd',{items:[{id:op.to,quantity:op.quantity,properties:op.properties}]});
      }
    }
    cart=await call('cart');
    ops=planNormalize(cart).filter(o=>o.type==='qty'); /* lines merged by a swap can pass 5,000 */
    for(const op of ops)await call('cartChange',{id:op.key,quantity:op.quantity});
    if(ops.length)cart=await call('cart');
  }
  const b=bundleBlocked?null:planBundle(cart);
  if(b){
    try{
      const next=await call('cartUpdate',{discount:b.discount});
      cart=next&&Array.isArray(next.items)?next:await call('cart');
      if(b.apply&&!codesOf(cart).some(c=>sameCode(c,CAT.bundleCode)))bundleBlocked=true; /* code missing or expired: stop retrying on this page */
    }catch(e){console.warn('[H4NDLE] no se pudo actualizar el código del paquete',e);bundleBlocked=true}
  }
  return cart;
}

/* ---------- drawer ---------- */
const state={cart:null};
const isUrl=v=>/^(https?:)?\/\//i.test(String(v));
const fileName=v=>{try{return decodeURIComponent(String(v).split('?')[0].split('/').pop())}catch(e){return String(v)}};
const sized=(u,w)=>u&&/cdn\.shopify\.com|\/cdn\/shop\//.test(u)?u+(u.includes('?')?'&':'?')+'width='+w:u;
const setText=(s,t)=>{const el=$(s);if(el)el.textContent=t};
const HIDDEN_PROPS=['Marca','Color','Estilo','Logo','Color HEX'];
function metaHTML(props){
  if(!props)return '';
  const val=k=>isUrl(props[k])?fileName(props[k]):props[k];
  let out='';
  if(props['Marca']!=null&&props['Marca']!==''){
    out+=`Marca: ${esc(val('Marca'))}${props['Color']?` · ${esc(val('Color'))}`:''}${props['Estilo']?` · ${esc(val('Estilo'))}`:''}`;
    if(props['Logo']&&props['Logo']!=='Sin logo')out+=`<br>Logo: ${esc(val('Logo'))}`;
    out+='<br>';
  }
  Object.keys(props).filter(k=>k&&k[0]!=='_'&&!HIDDEN_PROPS.includes(k)&&props[k]!==''&&props[k]!=null).forEach(k=>{out+=`${esc(k)}: ${esc(val(k))}<br>`});
  return out;
}
function lineHTML(it,i){
  const slot=slotOf(it.product_id),tiered=!!slot;
  const name=esc(it.product_title||it.title||'');
  const src=sized(it.image||(slot&&(CAT.products[slot].image||CAT.fallbackImages[slot]))||'',128);
  const unit=it.original_price!=null?it.original_price:it.price;
  const line=it.original_line_price!=null?it.original_line_price:unit*it.quantity;
  const qty=tiered?`${it.quantity.toLocaleString('es-MX')} pzas`:String(it.quantity);
  const step=tiered?'50 piezas':'1';
  return `<li class="line">${src?`<img src="${esc(src)}" alt="" width="64" height="64">`:'<img alt="" width="64" height="64">'}<div><h3>${name}</h3><p class="meta">${metaHTML(it.properties)}${cents(unit)} c/u</p><div class="q"><button type="button" data-dec="${i}" aria-label="Quitar ${step} de ${name}">−</button><span>${qty}</span><button type="button" data-inc="${i}" aria-label="Agregar ${step} de ${name}">+</button></div></div><div class="amt">${cents(line)}<button type="button" class="rm" data-rm="${i}">Quitar</button></div></li>`;
}
function render(cart){
  state.cart=cart||null;
  const items=(cart&&cart.items)||[];
  const list=$('#cartLines');
  if(list)list.innerHTML=items.length?items.map(lineHTML).join(''):'<li class="empty">Tu carrito está vacío. Elige un empaque y aquí verás el precio total.</li>';
  const sub=cart?(cart.original_total_price!=null?cart.original_total_price:cart.total_price)||0:0;
  const tot=cart?cart.total_price||0:0;
  const disc=Math.max(0,sub-tot);
  const code=String(CAT.bundleCode||'').trim();
  const bundleOn=!!code&&codesOf(cart).some(c=>sameCode(c,code));
  setText('#cSub',cents(sub));
  const dr=$('#cDiscRow');if(dr)dr.hidden=!disc;
  setText('#cDisc','−'+cents(disc));
  setText('#cDiscLbl',bundleOn?`Paquete de ${CAT.bundleMin||3} (−${CAT.bundlePercent||30}%)`:'Descuento');
  setText('#cTot',cents(tot));
  const fs=+CAT.freeShipping||0;
  setText('#cShip',!items.length?`Envío gratis en compras de más de ${money0.format(fs/100)}.`:tot>=fs?'Tu envío es gratis.':`Te faltan ${cents(fs-tot)} para el envío gratis.`);
  const n=items.length,cnt=$('#cartCount');
  if(cnt){cnt.textContent=n;cnt.classList.toggle('on',n>0)}
  const ob=$('#cartOpen');if(ob)ob.setAttribute('aria-label',`Abrir carrito, ${n} ${n===1?'producto':'productos'}`);
  const co=$('#checkout');if(co)co.disabled=!n;
  document.dispatchEvent(new CustomEvent('h4:cart',{detail:{cart:state.cart,distinct:distinctOf(cart)}}));
  return cart;
}

let toastT=null;
function toast(msg){const t=$('#toast'),m=$('#toastMsg');if(!t||!m)return;m.textContent=msg;t.classList.add('on');clearTimeout(toastT);toastT=setTimeout(()=>t.classList.remove('on'),3600)}
function bump(){const b=$('#cartOpen');if(!b)return;b.classList.remove('bump');void b.offsetWidth;b.classList.add('bump')}

function refresh(){return queue(async()=>render(await settle(await call('cart'))))}
function add(payload,opts){
  opts=opts||{};
  const body=Array.isArray(payload)?{items:payload}:payload;
  const qty=body instanceof FormData?(+body.get('quantity')||1):body.items?body.items.reduce((s,i)=>s+(+i.quantity||1),0):(+body.quantity||1);
  const run=queue(async()=>{
    const added=await call('cartAdd',body);
    const cart=render(await settle(await call('cart')));
    const first=added&&(Array.isArray(added.items)?added.items[0]:added);
    toast(opts.toast||`Agregado: ${first&&first.product_title?first.product_title:'producto'}, ${qty.toLocaleString('es-MX')} ${qty===1?'pieza':'piezas'}`);
    bump();
    return cart;
  });
  run.catch(err=>{console.warn('[H4NDLE] no se pudo agregar al carrito',err);if(!opts.quiet)toast('No pudimos agregar el producto. Intenta de nuevo.')});
  return run;
}
function change(key,quantity){
  $$('#cartLines button').forEach(b=>{b.disabled=true});
  const run=queue(async()=>render(await settle(await call('cartChange',{id:key,quantity}))));
  run.catch(err=>{console.warn('[H4NDLE] no se pudo actualizar el carrito',err);toast('No pudimos actualizar tu carrito. Intenta de nuevo.');$$('#cartLines button').forEach(b=>{b.disabled=false})});
  return run;
}

const drawer=$('#cart'),cScrim=$('#cartScrim');let lastFocus=null;
function openCart(){if(!drawer)return;lastFocus=document.activeElement;drawer.inert=false;drawer.classList.add('on');if(cScrim)cScrim.classList.add('on');setTimeout(()=>{const x=$('#cartClose');if(x)x.focus()},60)}
function closeCart(){if(!drawer)return;drawer.classList.remove('on');if(cScrim)cScrim.classList.remove('on');drawer.inert=true;if(lastFocus&&lastFocus.focus)lastFocus.focus()}
const openBtn=$('#cartOpen');if(openBtn)openBtn.addEventListener('click',openCart);
const closeBtn=$('#cartClose');if(closeBtn)closeBtn.addEventListener('click',closeCart);
if(cScrim)cScrim.addEventListener('click',closeCart);
addEventListener('keydown',e=>{if(e.key==='Escape'&&drawer&&drawer.classList.contains('on'))closeCart()});
const toastBtn=$('#toastBtn');if(toastBtn)toastBtn.addEventListener('click',()=>{$('#toast').classList.remove('on');openCart()});
const linesEl=$('#cartLines');
if(linesEl)linesEl.addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b||!state.cart)return;
  const d=b.dataset,idx=+(d.inc!==undefined?d.inc:d.dec!==undefined?d.dec:d.rm);
  const it=state.cart.items[idx];if(!it)return;
  const tiered=!!slotOf(it.product_id),step=tiered?STEP:1;
  if(d.inc!==undefined)change(it.key,tiered?Math.min(MAXQ,it.quantity+step):it.quantity+step).catch(()=>{});
  else if(d.dec!==undefined){let q=it.quantity-step;if(tiered&&q<MINQ)q=0;change(it.key,Math.max(0,q)).catch(()=>{})}
  else if(d.rm!==undefined)change(it.key,0).catch(()=>{});
});
const checkoutBtn=$('#checkout');
if(checkoutBtn)checkoutBtn.addEventListener('click',()=>{
  checkoutBtn.disabled=true;
  const go=()=>{location.href=String(CAT.routes.root||'/').replace(/\/?$/,'/')+'checkout'};
  refresh().then(go,go); /* volume variants and the bundle code are settled before paying */
});

/* ---------- nav tone follows the section under it ---------- */
const nav=$('#nav'),toned=$$('[data-tone]');let navTone='';
const heroPage=!!$('.scrub, .scrub-static');
/* split in a read (layout only) and a write (styles only): the home page's frame loop (h4ndle-landing.js) calls them in its own read and write phases */
function readNav(){
  if(!nav)return null;
  const nr=nav.getBoundingClientRect(),y=nr.top+nr.height/2,bar=nav.closest('.topbar'),th=Math.round(bar?bar.offsetHeight:nr.bottom); /* the tone line is the nav's own vertical center (the announcement bar sits above it) */
  let tone=heroPage?'hero':'light';
  for(const s of toned){const r=s.getBoundingClientRect();if(r.top<=y&&r.bottom>y){tone=s.classList.contains('scrub')||s.classList.contains('scrub-static')?'hero':s.dataset.tone;break}}
  return {th,tone};
}
function writeNav(s){
  if(!s)return;
  if(s.th&&s.th!==paintNav.th){paintNav.th=s.th;document.documentElement.style.setProperty('--top-h',s.th+'px')}
  if(s.tone!==navTone){navTone=s.tone;nav.classList.toggle('light',s.tone==='light');nav.classList.toggle('solid',s.tone==='dark')}
}
function paintNav(){writeNav(readNav())}
let navRaf=null;
const queueNav=()=>{if(window.H4&&window.H4.navDriven)return;if(navRaf===null)navRaf=requestAnimationFrame(()=>{navRaf=null;paintNav()})}; /* navDriven: the home page's frame loop paints it */
addEventListener('scroll',queueNav,{passive:true});
addEventListener('resize',queueNav);

/* ---------- reveals ---------- */
$$('[data-stagger]').forEach(g=>[...g.children].forEach((c,i)=>c.style.setProperty('--i',i)));
const rvIO=new IntersectionObserver(es=>es.forEach(e=>{
  if(!e.isIntersecting)return;const t=e.target;t.classList.add('in');rvIO.unobserve(t);
  if(t.hasAttribute('data-stagger'))setTimeout(()=>t.classList.add('settled'),900+t.children.length*90);
  $$('.ul',t).forEach(u=>u.classList.add('in'));
}),{threshold:.15});
$$('.rv,[data-stagger],.ul').forEach(el=>rvIO.observe(el));
document.addEventListener('visibilitychange',()=>document.body.classList.toggle('paused',document.hidden));

/* ---------- go ---------- */
window.H4={$,$$,clamp,esc,money,money0,cents,RM,tierOf,TIERS,CAT,MINQ,MAXQ,STEP,toast,bump,paintNav,readNav,writeNav,navDriven:false};
window.H4Cart={get:refresh,refresh,add,change,open:openCart,close:closeCart,variantFor,slotOf,get state(){return state.cart},
  _test:{planNormalize,planBundle,codesOf,distinctOf,tierOf,variantFor,slotOf}};
render(null);
paintNav();
refresh().catch(e=>console.warn('[H4NDLE] no se pudo leer el carrito',e));
addEventListener('pageshow',e=>{if(e.persisted)refresh().catch(()=>{})});
})();
