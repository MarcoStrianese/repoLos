/* =====================================================================
   LOS · vista OGGI (dashboard giornaliera proattiva)
   ===================================================================== */
VIEWS.oggi = function(){
  const T0 = today(), d = S.day, mon = monday(d), isToday = sameDay(d,T0);
  const h = new Date().getHours(); const hello = h<12?'Buongiorno':h<18?'Buon pomeriggio':'Buonasera';
  const adv = advisor();
  const wk = Array.from({length:7},(_,i)=>workoutsOn(iso(addDays(monday(T0),i)))).flat();
  const done = wk.filter(s=>s.done).length;
  const B = DB.body, lastB = B[B.length-1], prevB = B[B.length-2];
  const sug = suggestions(d);
  const workday = d.getDay()>0 && d.getDay()<6;
  const items = [];
  MEALS.forEach(m=>{
    const dish = mealFor(d,m.k);
    if(!dish){ items.push({time:m.time,c:'var(--line)',html:`<div class="ev skip"><div class="h">${ic(m.icon,'style="width:18px;height:18px;color:var(--faint)"')}<b style="color:var(--faint)">${m.label}</b><span class="meta faint small">non previsto</span></div></div>`}); return; }
    items.push({time:m.time,c:'var(--diet)',html:`<button class="ev tap" style="--c:${dish.free?'var(--fin)':'var(--diet)'}" data-act="meal" data-meal="${m.k}"><div class="h">${ic(m.icon,'style="width:18px;height:18px;color:var(--diet)"')}<b>${m.label}</b><span class="meta">${dish.free?'<span class="pill warn">libero</span>':''}${ic('right','style="width:18px;height:18px;color:var(--faint)"')}</span></div><div class="sub">${esc(dish.name)}</div></button>`});
  });
  if(workday){
    const n = sug.focus.length + sug.follow.length + sug.filler.length;
    const top = sug.focus.length ? sug.focus : sug.filler;
    items.push({time:'08:30',c:'var(--work)',html:`<button class="ev tap" style="--c:var(--work)" data-act="workday"><div class="h">${ic('work','style="width:18px;height:18px;color:var(--work)"')}<b>Lavoro</b><span class="meta"><span class="pill neutral">${n} proposte</span>${ic('right','style="width:18px;height:18px;color:var(--faint)"')}</span></div>
      ${n?`<div class="sub" style="margin-top:-4px">Il sistema ti propone:</div>${top.slice(0,3).map(s=>`<div class="sug" style="--c:var(--work)"><span class="k"></span><span class="grow"><b style="font-weight:600">${esc(s.t.text)}</b> <span class="muted">· ${esc(s.p.name)}</span></span></div>`).join('')}${sug.follow.slice(0,1).map(s=>`<div class="sug" style="--c:var(--warn)"><span class="k"></span><span class="grow">${esc(s.text)} <span class="muted">· ${esc(s.p.name)}</span></span></div>`).join('')}`
      :`<div class="sub">Nessuna attività aperta: aggiungi progetti e to-do nella sezione Lavoro.</div>`}</button>`});
  }
  workoutsOn(iso(d)).forEach(s=>{
    items.push({time:s.time||'18:30',c:'var(--sport)',html:`<div class="ev tap ${s.done?'done':''}" style="--c:var(--sport)" data-act="wo" data-id="${s.id}"><div class="h">${ic('sport','style="width:18px;height:18px;color:var(--sport)"')}<b>Allenamento</b><span class="meta"><button class="check ${s.done?'on':''}" style="--c:var(--sport)" data-act="wodone" data-id="${s.id}" aria-label="Segna fatto">${ic('check')}</button></span></div><div class="sub">${esc(s.title)}</div></div>`});
  });
  if(!workoutsOn(iso(d)).length){
    let nx=null; for(let i=1;i<8;i++){ const dd=addDays(d,i); const w=workoutsOn(iso(dd)); if(w.length){ nx={dd,s:w[0]}; break; } }
    items.push({time:'18:30',c:'var(--line)',html:`<div class="ev skip"><div class="h">${ic('sport','style="width:18px;height:18px;color:var(--faint)"')}<b style="color:var(--muted)">Riposo</b><button class="meta link" data-act="addwo" data-day="${iso(d)}">+ Aggiungi</button></div>${nx?`<div class="sub">Prossimo: ${DOWL[nx.dd.getDay()]} · ${esc(nx.s.title)}</div>`:''}</div>`});
  }
  items.sort((a,b)=>a.time.localeCompare(b.time));
  const goals = DB.goals.slice(0,4);

  $('#view').innerHTML = `
  <div class="phead"><span class="eyebrow">${DOWL[d.getDay()]} ${d.getDate()} ${MONL[d.getMonth()].toLowerCase()} ${d.getFullYear()}</span><h1>${isToday?hello+', Marco':DOWL[d.getDay()]+' '+fmtDay(d)}</h1></div>
  <div class="stack">
    ${installBanner()}
    <div class="row" style="justify-content:space-between"><button class="iconbtn solid" data-act="wk" data-n="-7" aria-label="Settimana precedente">${ic('left')}</button><button class="muted" style="font-weight:700;font-size:14px;min-height:44px" data-act="todayjump">${isToday?'Settimana '+fmtDay(mon)+' – '+fmtDay(addDays(mon,6)):'Torna a oggi'}</button><button class="iconbtn solid" data-act="wk" data-n="7" aria-label="Settimana successiva">${ic('right')}</button></div>
    <div class="week">${Array.from({length:7},(_,i)=>{const dd=addDays(mon,i); const p=workoutsOn(iso(dd)); const mk=[]; if(p.length) mk.push(p.every(x=>x.done)?'var(--sport)':'color-mix(in srgb,var(--sport) 40%,transparent)'); if(dd.getDay()>0&&dd.getDay()<6) mk.push('var(--work)'); if(mealFor(dd,'cena')?.free) mk.push('var(--fin)');
      return `<button class="wd ${sameDay(dd,d)?'on':''} ${sameDay(dd,T0)?'today':''}" data-act="day" data-d="${iso(dd)}"><span class="l">${DOW[dd.getDay()]}</span><span class="n">${dd.getDate()}</span><span class="marks">${mk.map(c=>`<i style="background:${c}"></i>`).join('')}</span></button>`}).join('')}</div>
    <div class="cols">
      <div class="stack">
        <div class="kpis">
          <button class="kpi tap" data-go="finanze"><span class="eyebrow">Weekend</span><span class="v" style="color:var(--${adv.level})">${adv.margin<0?'€ 0':eur0(adv.allowance)}</span><span class="s">${adv.level==='bad'?'margine del mese esaurito':'budget svago consigliato'}</span></button>
          <button class="kpi tap" data-go="sport"><div class="row" style="gap:8px">${ring(done/Math.max(wk.length,1),'var(--sport)')}<span class="v">${done}/${wk.length}</span></div><span class="s">allenamenti fatti in settimana</span></button>
          <button class="kpi tap" data-go="dieta" data-sub="misure"><span class="eyebrow">Massa grassa</span><span class="v">${lastB?num(lastB.fat_pct)+'%':'—'}</span><span class="s">${lastB?`controllo del ${fmtDay(pd(lastB.date))}${prevB?` · ${lastB.fat_pct>prevB.fat_pct?'+':'−'}${num(Math.abs(lastB.fat_pct-prevB.fat_pct))} pt`:''}`:'nessun controllo'}</span></button>
        </div>
        <div class="timeline">${items.map(it=>`<div class="tl" style="--c:${it.c}"><div class="t">${it.time}</div><div class="body">${it.html}</div></div>`).join('')}</div>
      </div>
      <div class="stack">
        ${advisorCard(adv,true)}
        <div class="card"><div class="section-h" style="margin:0 0 4px"><h2>Obiettivi</h2><button class="link" data-go="obiettivi">Tutti</button></div>
          ${goals.length?goals.map(goalMini).join('<div class="hr"></div>'):'<div class="muted small" style="padding:6px 0">Nessun obiettivo: aggiungine uno nella sezione Obiettivi.</div>'}
        </div>
      </div>
    </div>
  </div>`;
  fab(null);
};
function advisorCard(a,compact){
  const lines = [
    ['Entrate del mese',a.income,''],
    ...(a.expectedIncome?[['Stipendio non ancora arrivato',a.expectedIncome,'stima']]:[]),
    ['Uscite finora',-a.spent,''],
    ...a.due.map(f=>[`${f.name} · ${fmtDay(f.due)}`,-f.amount,'fissa']),
    ['Variabili previste fino a fine mese',-a.variable,'stima'],
  ];
  const sun = addDays(a.sat,1);
  return `<${compact?'button':'div'} class="advisor ${compact?'tap':''}" ${compact?'data-go="finanze"':''}>
    <svg class="wave" viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="6"><path d="M85 50a35 35 0 1 1-10-24.7"/><path d="M78 12v15H63"/></svg>
    <div class="eyebrow" style="color:var(--fin)">Analizzatore · weekend ${a.sat.getDate()}${a.sat.getMonth()!==sun.getMonth()?' '+MON[a.sat.getMonth()]:''} – ${fmtDay(sun)}</div>
    <div class="row" style="align-items:flex-end;gap:12px;margin:10px 0 6px"><span class="amt">${a.margin<0?'€ 0':eur0(a.allowance)}</span><span class="pill ${a.level}" style="margin-bottom:4px">${a.level==='good'?'via libera':a.level==='warn'?'con misura':'stop svago'}</span></div>
    <div style="font-weight:700;font-size:16px">${a.verdict}</div>
    <div class="muted small" style="margin-top:4px">${a.margin<0?`Mancano ${eur0(-a.margin)} per chiudere il mese in pari. `:''}Media svago per weekend: ${eur0(a.avgSvago)}.</div>
    ${compact?'':`<div class="list" style="margin-top:12px">${lines.map(l=>`<div class="row" style="padding:8px 0;border-bottom:1px solid color-mix(in srgb,var(--fin) 22%,transparent);font-size:14px"><span class="grow">${esc(l[0])} ${l[2]?`<span class="pill neutral" style="margin-left:4px">${l[2]}</span>`:''}</span><span class="mono ${l[1]>=0?'pos':''}">${l[1]>=0?'+':'−'}${eur(Math.abs(l[1]))}</span></div>`).join('')}
      <div class="row" style="padding:10px 0 0;font-weight:700"><span class="grow">Margine del mese</span><span class="mono ${a.margin>=0?'pos':'neg'}">${a.margin>=0?'+':'−'}${eur(Math.abs(a.margin))}</span></div></div>
      <div class="faint" style="font-size:12px;margin-top:8px">Budget weekend = margine ÷ weekend rimasti (${a.we}). Le variabili sono stimate dal ritmo d'acquisto di ogni categoria dello specchietto.</div>`}
  </${compact?'button':'div'}>`;
}

/* --- azioni --- */
ACT.day = (el,D) => { S.day = pd(D.d); render(); };
ACT.wk = (el,D) => { S.day = addDays(S.day,+D.n); render(); };
ACT.todayjump = () => { S.day = today(); render(); };
ACT.workday = () => sheetWorkday();

function sheetWorkday(){
  const draw = () => {
    const sug = suggestions(S.day);
    const row = s => `<div class="todo"><button class="check" style="--c:var(--work)" data-act="todo" data-id="${s.t.id}" data-from="day" aria-label="Fatto">${ic('check')}</button><div class="grow" style="padding:6px 0"><div style="font-weight:600">${esc(s.t.text)}</div><div class="muted small">${esc(s.p.name)}</div><div class="row wrap" style="gap:6px;margin-top:6px">${s.reasons.map(r=>`<span class="pill ${r==='priorità alta'?'warn':'neutral'}">${r}</span>`).join('')}</div></div></div>`;
    openSheet(sheetHead('Giornata di lavoro',`${DOWL[S.day.getDay()]} ${fmtDay(S.day)}`,'work','var(--work)','var(--work-soft)'),`
    <div class="stack">
      <div class="faint small">Proposte calcolate da tipo di progetto (aziende prima), priorità e ordine delle attività. I progetti in stand-by non entrano nel piano ma generano un sollecito.</div>
      <div class="card flat"><div class="eyebrow" style="color:var(--work)">Focus · progetti per aziende</div><div class="list">${sug.focus.map(row).join('')||'<div class="muted small" style="padding:10px 0">Nessuna attività aperta</div>'}</div></div>
      ${sug.follow.length?`<div class="card flat"><div class="eyebrow" style="color:var(--warn)">Da sbloccare</div><div class="list">${sug.follow.map(s=>`<div class="li"><div class="ico" style="--c:var(--warn);--s:var(--fin-soft)">${ic('pause')}</div><div class="grow"><div style="font-weight:600">${esc(s.text)}</div><div class="muted small">${esc(s.p.name)} · ${s.reasons[0]}</div></div><button class="btn small ghost" data-act="unblock" data-id="${s.p.id}">Sbloccato</button></div>`).join('')}</div></div>`:''}
      <div class="card flat"><div class="eyebrow" style="color:var(--books)">Per i tempi morti · interni e personali</div><div class="list">${sug.filler.map(row).join('')||'<div class="muted small" style="padding:10px 0">Niente in coda</div>'}</div></div>
      <button class="btn ghost block" data-go="lavoro">Apri la sezione Lavoro</button>
    </div>`, draw);
  };
  draw();
}
ACT.unblock = async (el,D) => { const p = DB.projects.find(x=>x.id==D.id); await upd('projects',p.id,{status:'attivo'}); refresh(); toast(p.name+' torna attivo'); };

function goalMini(g){ const e=goalErr(g); return `<button class="li" data-act="goal" data-id="${g.id}">${e?ring(e.p,e.ok?'var(--good)':'var(--warn)'):`<div class="ico">${ic('goal')}</div>`}<div class="grow"><div style="font-weight:600;font-size:15px">${esc(g.name)}</div><div class="muted mono" style="font-size:12px">${goalLine(g)}${e?` · errore ${e.txt}`:''}</div></div>${g.area?`<span class="pill neutral">${esc(g.area)}</span>`:''}</button>`; }

/* --- banner installazione (PWA) --- */
let deferredPrompt = null;
addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferredPrompt = e; if(S.view==='oggi' && !sheetOpen) render(); });
const isStandalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent);
function installBanner(){
  if(IS_ELECTRON || isStandalone()) return '';
  try{ if(localStorage.getItem('los-install-dismiss')) return ''; }catch(e){}
  if(deferredPrompt) return `<div class="install"><div class="ico" style="--c:var(--accent);--s:var(--surface)">${ic('download')}</div><div class="grow"><b>Installa LOS</b><div class="muted small">Icona nella schermata Home, si apre a tutto schermo.</div></div><button class="btn small accent" data-act="install">Installa</button><button class="iconbtn sm" data-act="installno" aria-label="Non ora">${ic('close')}</button></div>`;
  if(isIOS()) return `<div class="install"><div class="ico" style="--c:var(--accent);--s:var(--surface)">${ic('share')}</div><div class="grow"><b>Aggiungi LOS alla Home</b><div class="muted small">In Safari tocca Condividi, poi «Aggiungi alla schermata Home».</div></div><button class="iconbtn sm" data-act="installno" aria-label="Non ora">${ic('close')}</button></div>`;
  return '';
}
ACT.install = async () => { if(!deferredPrompt) return; deferredPrompt.prompt(); await deferredPrompt.userChoice; deferredPrompt = null; render(); };
ACT.installno = () => { try{localStorage.setItem('los-install-dismiss','1')}catch(e){} render(); };
