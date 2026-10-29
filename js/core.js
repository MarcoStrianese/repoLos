/* =====================================================================
   LOS · core: utilità, icone, grafici, guscio dell'interfaccia
   ===================================================================== */
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const eur = (n,d=2) => '€ ' + Number(n||0).toLocaleString('it-IT',{minimumFractionDigits:d,maximumFractionDigits:d});
const eur0 = n => eur(Math.round(n||0),0);
const num = (n,d=1) => Number(n||0).toLocaleString('it-IT',{minimumFractionDigits:d,maximumFractionDigits:d});
const pnum = s => { if(s==null||s==='') return NaN; s=String(s).trim().replace(/\s/g,''); if(s.includes(',')) s=s.replace(/\./g,'').replace(',','.'); return parseFloat(s); };
const DOW = ['Dom','Lun','Mar','Mer','Gio','Ven','Sab'];
const DOWL = ['Domenica','Lunedì','Martedì','Mercoledì','Giovedì','Venerdì','Sabato'];
const MON = ['gen','feb','mar','apr','mag','giu','lug','ago','set','ott','nov','dic'];
const MONL = ['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno','Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre'];
const iso = d => d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
const pd = s => { const [y,m,d] = String(s).slice(0,10).split('-').map(Number); return new Date(y,m-1,d||1); };
const addDays = (d,n) => { const x = new Date(d); x.setDate(x.getDate()+n); return x; };
const daysBetween = (a,b) => Math.round((pd(iso(b)) - pd(iso(a)))/864e5);
const monday = d => { const x = new Date(d.getFullYear(),d.getMonth(),d.getDate()); return addDays(x, -((x.getDay()+6)%7)); };
const sameDay = (a,b) => iso(a)===iso(b);
const fmtDay = d => d.getDate()+' '+MON[d.getMonth()];
const ym = d => iso(d).slice(0,7);
const ymAdd = (m,n) => { const [y,mo]=m.split('-').map(Number); return ym(new Date(y,mo-1+n,1)); };
const ymLabel = (m,short) => { const [y,mo]=m.split('-').map(Number); return short ? MON[mo-1]+' '+String(y).slice(2) : MONL[mo-1]+' '+y; };
const today = () => { const n=new Date(); return new Date(n.getFullYear(),n.getMonth(),n.getDate()); };
const avg = a => a.length ? a.reduce((s,x)=>s+x,0)/a.length : 0;
const isDesktop = () => matchMedia('(min-width:900px)').matches;
const IS_ELECTRON = /Electron/i.test(navigator.userAgent);

/* ---------- icone ---------- */
const I = {
  today:'<path d="M4 7h16M4 7v12a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V7M4 7a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1M8 3v4M16 3v4"/><circle cx="12" cy="14" r="2.5" fill="currentColor"/>',
  work:'<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 13h18"/>',
  fin:'<path d="M3 17l6-6 4 4 8-8"/><path d="M14 7h7v7"/>',
  sport:'<path d="M6.5 6.5v11M17.5 6.5v11M3 9.5v5M21 9.5v5M6.5 12h11"/>',
  diet:'<path d="M12 21c-5 0-8-4-8-9 0-3 2-5 4.5-5 1.5 0 2.5.7 3.5.7S14 7 15.5 7C18 7 20 9 20 12c0 5-3 9-8 9z"/><path d="M12 7c0-2 1-4 3-4"/>',
  goal:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/>',
  book:'<path d="M4 4.5A1.5 1.5 0 0 1 5.5 3H20v15H5.5A1.5 1.5 0 0 0 4 19.5v-15z"/><path d="M4 19.5A1.5 1.5 0 0 0 5.5 21H20"/>',
  food:'<path d="M7 3v8M5 3v5a2 2 0 0 0 4 0V3M7 11v10M17 3c-2 0-3 3-3 6s1 4 3 4v8"/>',
  note:'<path d="M5 3h10l4 4v14H5z"/><path d="M15 3v4h4M8 12h8M8 16h6"/>',
  gear:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 1 1-4 0v-.1A1.6 1.6 0 0 0 7.4 19.6l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.6 1.6 0 0 0 3.5 14H3a2 2 0 1 1 0-4h.1A1.6 1.6 0 0 0 4.4 7.4l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.6 1.6 0 0 0 9.9 3.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 2.7 1.1l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1A1.6 1.6 0 0 0 20.5 10H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  check:'<path d="M5 12.5l4.5 4.5L19 7.5" stroke-width="3"/>',
  chev:'<path d="M6 9l6 6 6-6"/>',
  left:'<path d="M15 6l-6 6 6 6"/>', right:'<path d="M9 6l6 6-6 6"/>',
  back:'<path d="M19 12H5M11 18l-6-6 6-6"/>',
  close:'<path d="M6 6l12 12M18 6L6 18"/>',
  menu:'<path d="M4 7h16M4 12h16M4 17h10"/>',
  upload:'<path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3"/>',
  coffee:'<path d="M4 8h13v5a6 6 0 0 1-6 6h-1a6 6 0 0 1-6-6V8zM17 9h1.5a2.5 2.5 0 0 1 0 5H17"/><path d="M8 3v2M12 3v2"/>',
  apple:'<path d="M12 7c-1-1-2.5-1.5-4-1-3 1-3.5 5-2 8.5S9 20 10.5 20c1 0 1-.5 1.5-.5s.5.5 1.5.5c1.5 0 3-2 4.5-5.5S18 7 15 6c-1.5-.5-2 0-3 1z"/><path d="M12 7c0-2 1-3.5 3-4"/>',
  plate:'<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/>',
  moon:'<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
  bolt:'<path d="M13 3L5 13h6l-1 8 8-10h-6l1-8z"/>',
  pause:'<rect x="7" y="5" width="3.5" height="14" rx="1"/><rect x="13.5" y="5" width="3.5" height="14" rx="1"/>',
  shuffle:'<path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/>',
  trash:'<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
  wallet:'<path d="M3 7a2 2 0 0 1 2-2h13v4"/><rect x="3" y="7" width="18" height="13" rx="2"/><circle cx="16" cy="13.5" r="1.5" fill="currentColor"/>',
  link:'<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
  trophy:'<path d="M8 4h8v5a4 4 0 0 1-8 0V4zM8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M8 21h8M9 17h6"/>',
  pin:'<path d="M12 21s-7-6.5-7-12a7 7 0 0 1 14 0c0 5.5-7 12-7 12z"/><circle cx="12" cy="9" r="2.5"/>',
  logout:'<path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 17l5-5-5-5M15 12H3"/>',
  edit:'<path d="M4 20h4L19 9l-4-4L4 16v4zM14 6l4 4"/>',
  refresh:'<path d="M20 12a8 8 0 1 1-2.3-5.7M20 4v5h-5"/>',
  sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  download:'<path d="M12 4v12M7 11l5 5 5-5"/><path d="M4 20h16"/>',
  share:'<path d="M12 3v12M7 8l5-5 5 5"/><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/>',
  heart:'<path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10z"/>',
};
const ic = (n,extra='') => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ${extra}>${I[n]||''}</svg>`;
const LOGO = '<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round"><path d="M52 32a20 20 0 1 1-6-14.3"/><path d="M47 9v9h-9"/><circle cx="32" cy="32" r="6" fill="currentColor" stroke="none"/></svg>';
const delBtn = (act, attrs='', label='Elimina') => `<button class="iconbtn sm del" data-act="${act}" ${attrs} aria-label="${label}">${ic('trash')}</button>`;

/* ---------- grafici SVG ---------- */
// larghezza logica del grafico ≈ larghezza reale, così i testi restano leggibili sul telefono
const CW = () => Math.round(isDesktop() ? 600 : Math.min(600, Math.max(300, innerWidth - 56)));
function lineChart(vals, labels, {color='var(--accent)', h=170, unit='', target=null, dec=1}={}){
  if(!vals.length) return '<div class="empty">Nessun dato</div>';
  const W=CW(),H=h,pl=44,pr=16,pt=16,pb=28;
  let lo=Math.min(...vals,target??Infinity), hi=Math.max(...vals,target??-Infinity); const pad=(hi-lo)*.18||1; lo-=pad; hi+=pad;
  const x=i=>pl+(W-pl-pr)*(vals.length===1?.5:i/(vals.length-1)), y=v=>pt+(H-pt-pb)*(1-(v-lo)/(hi-lo));
  let g=''; for(let i=0;i<=4;i++){ const v=lo+(hi-lo)*i/4; g+=`<line x1="${pl}" x2="${W-pr}" y1="${y(v)}" y2="${y(v)}" stroke="var(--line)"/><text x="${pl-6}" y="${y(v)+4}" text-anchor="end" font-size="11" fill="var(--faint)">${num(v,dec)}</text>`; }
  const pts=vals.map((v,i)=>`${x(i)},${y(v)}`).join(' ');
  const area=`M${x(0)},${H-pb} L${vals.map((v,i)=>`${x(i)},${y(v)}`).join(' L')} L${x(vals.length-1)},${H-pb}Z`;
  const gid='g'+Math.random().toString(36).slice(2,7);
  const step = Math.ceil(labels.length/8);
  const lab=labels.map((l,i)=>(i%step===0||i===labels.length-1)?`<text x="${x(i)}" y="${H-8}" text-anchor="middle" font-size="11" fill="var(--muted)">${esc(l)}</text>`:'').join('');
  const tl = target!=null?`<line x1="${pl}" x2="${W-pr}" y1="${y(target)}" y2="${y(target)}" stroke="var(--good)" stroke-dasharray="5 5" stroke-width="1.5"/><text x="${W-pr}" y="${y(target)-6}" text-anchor="end" font-size="11" fill="var(--good)" font-weight="600">target ${num(target,dec)}${unit}</text>`:'';
  const dots=vals.map((v,i)=>`<circle cx="${x(i)}" cy="${y(v)}" r="${i===vals.length-1?5:3}" fill="${i===vals.length-1?color:'var(--surface)'}" stroke="${color}" stroke-width="2"><title>${esc(labels[i])}: ${num(v,dec)}${unit}</title></circle>`).join('');
  return `<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" style="display:block;overflow:visible"><defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${color}" stop-opacity=".22"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></linearGradient></defs>${g}${tl}<path d="${area}" fill="url(#${gid})"/><polyline points="${pts}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linejoin="round"/>${dots}${lab}</svg>`;
}
function barsInOut(rows){ // [label,in,out]
  if(!rows.length) return '<div class="empty">Nessun dato</div>';
  const W=CW(),H=210,pl=44,pr=8,pt=10,pb=26; const mx=Math.max(...rows.flatMap(r=>[r[1],r[2]]))*1.08||1;
  const step=(W-pl-pr)/rows.length, bw=Math.min(16,step*.34);
  let g=''; for(let i=0;i<=4;i++){ const v=mx*i/4, yy=pt+(H-pt-pb)*(1-i/4); g+=`<line x1="${pl}" x2="${W-pr}" y1="${yy}" y2="${yy}" stroke="var(--line)"/><text x="${pl-6}" y="${yy+4}" text-anchor="end" font-size="11" fill="var(--faint)">${Math.round(v/100)/10}k</text>`; }
  const b=rows.map((r,i)=>{ const cx=pl+step*i+step/2; const hi=(H-pt-pb)*r[1]/mx, ho=(H-pt-pb)*r[2]/mx;
    return `<rect x="${cx-bw-1}" y="${H-pb-hi}" width="${bw}" height="${hi}" rx="3" fill="var(--good)"><title>${r[0]} entrate ${eur(r[1])}</title></rect><rect x="${cx+1}" y="${H-pb-ho}" width="${bw}" height="${ho}" rx="3" fill="var(--fin)"><title>${r[0]} uscite ${eur(r[2])}</title></rect><text x="${cx}" y="${H-8}" text-anchor="middle" font-size="11" fill="var(--muted)">${r[0]}</text>`; }).join('');
  return `<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" style="display:block">${g}${b}</svg>`;
}
function miniBars(vals,labels,color,{allLabels=false, avgLine=null, hi=-1}={}){
  const W=CW(),H=allLabels?190:150,pl=8,pr=8,pt=allLabels?26:18,pb=24; const mx=Math.max(...vals,avgLine||0,1); const step=(W-pl-pr)/vals.length, bw=step*.64;
  const yv=v=>H-pb-(H-pt-pb)*v/mx;
  const al = avgLine!=null?`<line x1="${pl}" x2="${W-pr}" y1="${yv(avgLine)}" y2="${yv(avgLine)}" stroke="var(--ink)" stroke-dasharray="4 4" stroke-width="1.2" opacity=".6"/>`:'';
  return `<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" style="display:block">${vals.map((v,i)=>{const h=(H-pt-pb)*v/mx, x=pl+step*i+(step-bw)/2; const strong=i===vals.length-1||i===hi;
    const lbl = allLabels||strong ? `<text x="${x+bw/2}" y="${H-pb-h-6}" text-anchor="middle" font-size="${allLabels?10.5:12}" font-weight="600" fill="var(--ink)" ${allLabels&&!strong?'opacity=".75"':''}>${Math.round(v)}</text>`:'';
    return `<rect x="${x}" y="${H-pb-h}" width="${bw}" height="${Math.max(h,1)}" rx="4" fill="${color}" opacity="${strong?1:.55}"><title>${esc(labels[i])}: ${eur(v)}</title></rect>${lbl}<text x="${x+bw/2}" y="${H-7}" text-anchor="middle" font-size="11" fill="var(--muted)">${esc(labels[i])}</text>`}).join('')}${al}</svg>`;
}
function donut(parts,total,center,sub='uscite'){
  const R=70,r=48,C=2*Math.PI; let a=-Math.PI/2; let paths='';
  if(!total) return `<svg viewBox="0 0 180 180" width="170" height="170"><circle cx="90" cy="90" r="59" fill="none" stroke="var(--surface-3)" stroke-width="22"/><text x="90" y="96" text-anchor="middle" font-size="13" fill="var(--muted)">nessuna spesa</text></svg>`;
  parts.forEach(p=>{ const ang=C*p.v/total; if(ang<=0) return; const a2=a+Math.max(ang-0.012,0.001); const large=ang>Math.PI?1:0;
    const P=(rad,an)=>[90+rad*Math.cos(an),90+rad*Math.sin(an)];
    const [x1,y1]=P(R,a),[x2,y2]=P(R,a2),[x3,y3]=P(r,a2),[x4,y4]=P(r,a);
    paths+=`<path d="M${x1},${y1} A${R},${R} 0 ${large} 1 ${x2},${y2} L${x3},${y3} A${r},${r} 0 ${large} 0 ${x4},${y4}Z" fill="${p.c}"><title>${esc(p.l)}: ${eur(p.v)}</title></path>`; a+=ang; });
  return `<svg viewBox="0 0 180 180" width="170" height="170" role="img" style="flex:none">${paths}<text x="90" y="86" text-anchor="middle" font-size="11" fill="var(--muted)">${sub}</text><text x="90" y="106" text-anchor="middle" font-size="17" font-weight="600" fill="var(--ink)">${center}</text></svg>`;
}
function ring(p,color){ const R=17,C=2*Math.PI*R; return `<svg class="ring" viewBox="0 0 42 42"><circle cx="21" cy="21" r="${R}" fill="none" stroke="var(--surface-3)" stroke-width="5"/><circle cx="21" cy="21" r="${R}" fill="none" stroke="${color}" stroke-width="5" stroke-linecap="round" stroke-dasharray="${C*Math.max(0,Math.min(p,1))} ${C}" transform="rotate(-90 21 21)"/></svg>`; }

/* =====================================================================
   GUSCIO: navigazione, drawer, sheet, toast, conferme
   ===================================================================== */
const ACT = {};   // azioni click: ACT[nome] = (el, dataset, event) => {}
const FORM = {};  // submit form:  FORM[id]  = (form, v) => {}
const VIEWS = {}; // viste:        VIEWS[k]  = () => {}
const S = { view:'oggi', day:today() };

const NAV = [
  {k:'oggi',label:'Oggi',ic:'today',c:'var(--accent)'},
  {k:'lavoro',label:'Lavoro',ic:'work',c:'var(--work)'},
  {k:'finanze',label:'Finanze',ic:'fin',c:'var(--fin)'},
  {k:'sport',label:'Sport',ic:'sport',c:'var(--sport)'},
  {k:'dieta',label:'Dieta',ic:'diet',c:'var(--diet)'},
];
const MORE = [
  {k:'obiettivi',label:'Obiettivi',ic:'goal',c:'var(--accent)'},
  {k:'libri',label:'Libri',ic:'book',c:'var(--books)'},
  {k:'ristoranti',label:'Ristoranti',ic:'food',c:'var(--fin)'},
  {k:'note',label:'Note varie',ic:'note',c:'var(--muted)'},
  {k:'impostazioni',label:'Impostazioni',ic:'gear',c:'var(--muted)'},
];

function renderNav(){
  const item = (n,cls) => `<button class="${cls} ${S.view===n.k?'on':''}" style="--c:${n.c}" data-go="${n.k}">${ic(n.ic)}<span>${n.label}</span></button>`;
  const html = (cls) => `<div class="brand">${LOGO}LOS</div>` + NAV.map(n=>item(n,cls)).join('') + '<hr>' + MORE.map(n=>item(n,cls)).join('');
  $('#side').innerHTML = html('snav');
  $('#drawer').innerHTML = html('dnav');
  $('#menuBtn').innerHTML = ic('menu');
  const cur = NAV.concat(MORE).find(n=>n.k===S.view);
  $('#crumb').textContent = cur ? cur.label : '';
  $('#barActions').innerHTML = `<button class="iconbtn" data-act="refresh" aria-label="Aggiorna dati">${ic('refresh')}</button>`;
}
function go(k){
  S.view=k; closeDrawer(true); if(sheetOpen) closeSheet();
  render(); window.scrollTo({top:0,behavior:'instant'}); showBar();
  try{localStorage.setItem('los-view',k)}catch(e){}
}
function render(){
  renderNav();
  const v = $('#view'); v.classList.remove('view'); void v.offsetWidth; v.classList.add('view');
  try { (VIEWS[S.view]||VIEWS.oggi)(); }
  catch(e){ console.error(e); v.innerHTML = `<div class="empty">Errore nella vista: ${esc(e.message)}</div>`; }
}
// ricostruisce la vista sotto e lo sheet aperto (dopo una modifica)
let sheetRenderer = null;
function refresh(){ render(); if(sheetOpen && sheetRenderer) sheetRenderer(); }

function fab(label,color,action){
  $('#fabHost').innerHTML = label?`<button class="fab" style="--c:${color}" data-act="${action}">${ic('plus')}<span>${label}</span></button>`:'';
}

/* --- app bar che si nasconde scorrendo verso il basso --- */
let lastY = 0;
function showBar(){ $('#appbar').classList.remove('hide'); $('.fab')?.classList.remove('hide'); }
addEventListener('scroll', () => {
  const y = scrollY, d = y - lastY;
  if(Math.abs(d) < 6) return;
  const hide = d > 0 && y > 80;
  $('#appbar').classList.toggle('hide', hide);
  $('.fab')?.classList.toggle('hide', hide && !isDesktop());
  lastY = y;
}, {passive:true});

/* --- drawer --- */
function openDrawer(){ $('#drawer').classList.add('on'); $('#dscrim').classList.add('on'); history.pushState({drawer:1},''); }
function closeDrawer(silent){ if(!$('#drawer').classList.contains('on')) return; $('#drawer').classList.remove('on'); $('#dscrim').classList.remove('on'); if(!silent && history.state?.drawer) history.back(); else if(silent && history.state?.drawer) history.replaceState(null,''); }
// swipe dal bordo sinistro per aprire il menu
(()=>{ let x0=null,y0=null; addEventListener('touchstart',e=>{ const t=e.touches[0]; if(t.clientX<22 && !sheetOpen && !isDesktop()){ x0=t.clientX; y0=t.clientY; } },{passive:true});
  addEventListener('touchend',e=>{ if(x0===null) return; const t=e.changedTouches[0]; if(t.clientX-x0>60 && Math.abs(t.clientY-y0)<60) openDrawer(); x0=null; },{passive:true}); })();

/* --- sheet: schermo intero su telefono --- */
let sheetOpen = false;
function sheetHead(title,sub='',icon='',c='var(--accent)',s='var(--surface-3)',actions=''){
  return `<div class="sh"><button class="iconbtn back-mob" data-act="close" aria-label="Indietro">${ic('back')}</button>
    ${icon?`<div class="ico" style="--c:${c};--s:${s};width:38px;height:38px">${ic(icon)}</div>`:''}
    <div class="tt"><h2>${title}</h2>${sub?`<div class="sub">${sub}</div>`:''}</div>${actions}
    <button class="iconbtn back-desk" data-act="close" aria-label="Chiudi">${ic('close')}</button></div>`;
}
// openSheet(head, body, rerender?) — rerender: funzione che ridisegna lo sheet dopo modifiche
function openSheet(head, body, rerender){
  const sh = $('#sheet'); const keep = sheetOpen ? sh.scrollTop : 0;
  sh.innerHTML = head + `<div class="sb">${body}</div>`;
  sheetRenderer = rerender || null;
  if(!sheetOpen){ sheetOpen = true; sh.classList.add('on'); $('#scrim').classList.add('on'); sh.scrollTop = 0; history.pushState({sheet:1},''); document.body.style.overflow='hidden'; }
  else sh.scrollTop = keep;
}
function closeSheet(fromPop){
  if(!sheetOpen) return;
  sheetOpen = false; sheetRenderer = null;
  $('#sheet').classList.remove('on'); $('#scrim').classList.remove('on'); document.body.style.overflow='';
  if(!fromPop && history.state?.sheet) history.back();
}
addEventListener('popstate', () => {
  if(confirmOpen){ closeConfirm(false); return; }
  if(sheetOpen) closeSheet(true);
  if($('#drawer').classList.contains('on')){ $('#drawer').classList.remove('on'); $('#dscrim').classList.remove('on'); }
});

/* --- toast --- */
let tt;
function toast(m, {err=false, undo=null}={}){
  const t=$('#toast'); t.innerHTML = esc(m) + (undo?'<button id="toastUndo">Annulla</button>':''); t.classList.toggle('err',err); t.classList.add('on');
  if(undo) $('#toastUndo').onclick = () => { t.classList.remove('on'); undo(); };
  clearTimeout(tt); tt=setTimeout(()=>t.classList.remove('on'), undo?4500:2400);
}

/* --- conferma (al posto di window.confirm) --- */
let confirmOpen = false, confirmResolve = null;
function ask(title, text='', okLabel='Elimina', danger=true){
  $('#confirmBox').innerHTML = `<h2 style="font-size:20px">${esc(title)}</h2>${text?`<p class="muted" style="margin:0">${esc(text)}</p>`:''}
    <div class="row"><button class="btn ghost grow" data-confirm="0">Annulla</button><button class="btn ${danger?'danger':'accent'} grow" data-confirm="1">${esc(okLabel)}</button></div>`;
  $('#confirm').classList.add('on'); confirmOpen = true;
  return new Promise(r => confirmResolve = r);
}
function closeConfirm(v){ $('#confirm').classList.remove('on'); confirmOpen=false; confirmResolve?.(v); confirmResolve=null; }
$('#confirm').addEventListener('click', e => { const b=e.target.closest('[data-confirm]'); if(b) closeConfirm(b.dataset.confirm==='1'); else if(e.target.id==='confirm') closeConfirm(false); });

/* --- dispatcher globale --- */
document.addEventListener('click', e=>{
  const g = e.target.closest('[data-go]'); if(g){ if(g.dataset.sub) S[g.dataset.go==='dieta'?'dietTab':g.dataset.go==='finanze'?'finTab':'sportTab']=g.dataset.sub; go(g.dataset.go); return; }
  const el = e.target.closest('[data-act]'); if(!el) return;
  const a = el.dataset.act;
  if(a==='close'){ closeSheet(); return; }
  if(a==='drawer'){ openDrawer(); return; }
  if(a==='drawer-close'){ closeDrawer(); return; }
  const fn = ACT[a]; if(!fn) return;
  e.stopPropagation();
  Promise.resolve(fn(el, el.dataset, e)).catch(err => { console.error(err); toast(err.message||String(err),{err:true}); });
});
document.addEventListener('submit', e=>{
  const f=e.target; const fn = FORM[f.id]; if(!fn) return;
  e.preventDefault();
  const v = id => f.querySelector('#'+id)?.value?.trim() ?? '';
  const btn = f.querySelector('[type=submit]'); if(btn) btn.disabled = true;
  Promise.resolve(fn(f, v)).catch(err => { console.error(err); toast(err.message||String(err),{err:true}); }).finally(()=>{ if(btn) btn.disabled=false; });
});
document.addEventListener('keydown', e=>{ if(e.key==='Escape'){ if(confirmOpen) closeConfirm(false); else if(sheetOpen) closeSheet(); else closeDrawer(); } });
