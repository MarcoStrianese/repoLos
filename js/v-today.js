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
  eventsOn(iso(d)).filter(e=>e.kind==='attivita').forEach(e=>{
    items.push({time:e.time||'—',sort:e.time||'00:00',c:'var(--accent)',html:`<button class="ev tap act ${e.done?'done':''}" style="--c:var(--accent)" data-act="ev" data-id="${e.id}"><div class="h">${ic('pin','style="width:18px;height:18px;color:var(--accent)"')}<b>${esc(e.title)}</b><span class="meta">${e.time?`<span class="pill neutral mono">${esc(e.time)}</span>`:''}${ic('right','style="width:18px;height:18px;color:var(--faint)"')}</span></div>${e.note?`<div class="sub">${esc(e.note)}</div>`:''}</button>`});
  });
  items.sort((a,b)=>(a.sort||a.time).localeCompare(b.sort||b.time));
  const rems = remindersFor(d);
  const goals = DB.goals.slice(0,4);

  $('#view').innerHTML = `
  <div class="phead"><span class="eyebrow">${DOWL[d.getDay()]} ${d.getDate()} ${MONL[d.getMonth()].toLowerCase()} ${d.getFullYear()}</span><h1>${isToday?hello+', Marco':DOWL[d.getDay()]+' '+fmtDay(d)}</h1></div>
  <div class="stack">
    ${installBanner()}
    <div class="row" style="justify-content:space-between"><button class="iconbtn solid" data-act="wk" data-n="-7" aria-label="Settimana precedente">${ic('left')}</button><button class="muted grow" style="font-weight:700;font-size:14px;min-height:44px" data-act="todayjump">${isToday?'Settimana '+fmtDay(mon)+' – '+fmtDay(addDays(mon,6)):'Torna a oggi'}</button><button class="iconbtn solid" data-act="month" aria-label="Calendario del mese">${ic('cal')}</button><button class="iconbtn solid" data-act="wk" data-n="7" aria-label="Settimana successiva">${ic('right')}</button></div>
    <div class="week">${Array.from({length:7},(_,i)=>{const dd=addDays(mon,i); const p=workoutsOn(iso(dd)); const mk=[]; if(p.length) mk.push(p.every(x=>x.done)?'var(--sport)':'color-mix(in srgb,var(--sport) 40%,transparent)'); if(dd.getDay()>0&&dd.getDay()<6) mk.push('var(--work)'); if(mealFor(dd,'cena')?.free) mk.push('var(--fin)'); if(eventsOn(iso(dd)).some(e=>e.kind==='attivita')) mk.push('var(--accent)');
      return `<button class="wd ${sameDay(dd,d)?'on':''} ${sameDay(dd,T0)?'today':''} ${dayHasReminder(dd)?'rem':''}" data-act="day" data-d="${iso(dd)}">${dayHasReminder(dd)?`<span class="bell">${ic('bell')}</span>`:''}<span class="l">${DOW[dd.getDay()]}</span><span class="n">${dd.getDate()}</span><span class="marks">${mk.map(c=>`<i style="background:${c}"></i>`).join('')}</span></button>`}).join('')}</div>
    ${remCard(rems,d)}
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
  fab('Aggiungi','var(--accent)','newev');
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

/* =====================================================================
   CALENDARIO · promemoria (da spuntare, restano in evidenza finché non li fai)
               e attività con orario (es. «Parrucchiere ore 18»)
   Tutto in los_events: rec = regola di ripetizione (null = singolo),
   notice = giorni di avviso in anticipo, done_dates = ricorrenze già spuntate
   ===================================================================== */
const SINGLE = () => DB.events.filter(e=>!e.rec);
const eventsOn = date => SINGLE().filter(e=>e.date===date).sort((a,b)=>(a.time||'').localeCompare(b.time||''));
// promemoria ricorrenti come «regole»: {id,title,note,time,start,freq,interval,dows,dates,count,until,notice,done}
const evRule = e => ({ id:e.id, title:e.title, note:e.note, time:e.time, start:e.date, ...(e.rec||{}), notice:+e.notice||0, done:e.done_dates||[] });
const RR = () => DB.events.filter(e=>e.kind==='reminder' && e.rec).map(evRule);
const evNotice = id => +(DB.events.find(e=>e.id==id)?.notice || 0);
const FREQ = {once:'Una volta', weekly:'Ogni settimana', monthly:'Ogni mese', yearly:'Ogni anno', days:'Ogni N giorni', dates:'In date precise'};
const FUNIT = {weekly:['settimana','settimane'], monthly:['mese','mesi'], yearly:['anno','anni'], days:['giorno','giorni']};

// date (iso) in cui cade la regola r tra from e to compresi; rispetta inizio, «n volte» e «fino al»
function rrOccur(r, from, to){
  if(r.freq==='dates') return [...new Set(r.dates||[])].filter(di=>di>=from && di<=to).sort();
  const st = pd(r.start), n = Math.max(1, +r.interval||1), max = +r.count || Infinity, out = [];
  let k = 0;
  const push = d => { const di = iso(d); if(di>to || (r.until && di>r.until) || k>=max) return false; k++; if(di>=from) out.push(di); return true; };
  if(r.freq==='days'){ for(let d=st, g=0; g<20000; d=addDays(d,n), g++) if(!push(d)) break; }
  else if(r.freq==='weekly'){
    const dows = r.dows?.length ? r.dows.map(Number) : [st.getDay()];
    outer: for(let w=monday(st), g=0; g<5000; w=addDays(w,7*n), g++)
      for(let i=0;i<7;i++){ const d = addDays(w,i); if(d<st || !dows.includes(d.getDay())) continue; if(!push(d)) break outer; }
  }
  else if(r.freq==='monthly' || r.freq==='yearly'){
    const step = r.freq==='monthly' ? n : 12*n;
    for(let i=0; i<3000; i+=step){ const y=st.getFullYear(), mo=st.getMonth()+i; const d=new Date(y,mo,Math.min(st.getDate(),new Date(y,mo+1,0).getDate())); if(!push(d)) break; }
  }
  return out;
}
const rrNext = (r, fromIso=iso(today())) => rrOccur(r, fromIso, iso(addDays(pd(fromIso),800))).find(d=>!(r.done||[]).includes(d)) || null;
function describeRule(r){
  const st = r.start ? pd(r.start) : today(), n = Math.max(1,+r.interval||1);
  const every = f => n===1 ? (f==='weekly'?'Ogni settimana':f==='monthly'?'Ogni mese':f==='yearly'?'Ogni anno':'Ogni giorno') : `Ogni ${n} ${FUNIT[f][1]}`;
  let t;
  if(r.freq==='once') t = 'Una volta';
  else if(r.freq==='dates'){ const ds=[...new Set(r.dates||[])].sort(); t = ds.length ? `${ds.length} ${ds.length>1?'date':'data'}: ${ds.slice(0,4).map(d=>fmtDay(pd(d))).join(', ')}${ds.length>4?'…':''}` : 'Nessuna data scelta'; }
  else if(r.freq==='weekly'){ const dw=(r.dows?.length?r.dows.map(Number):[st.getDay()]).sort((a,b)=>((a+6)%7)-((b+6)%7)); t = `${every('weekly')} · ${dw.map(x=>DOW[x].toLowerCase()).join(', ')}`; }
  else if(r.freq==='monthly') t = `${every('monthly')} il giorno ${st.getDate()}`;
  else if(r.freq==='yearly') t = `${every('yearly')} il ${fmtDay(st)}`;
  else t = every('days');
  if(r.freq!=='once' && r.freq!=='dates'){ if(+r.count) t += ` · ${r.count} volte`; else if(r.until) t += ` · fino al ${fmtDay(pd(r.until))} ${r.until.slice(0,4)}`; }
  if(+r.notice) t += ` · avviso ${r.notice===1?'1 giorno':r.notice+' giorni'} prima`;
  return t;
}

// promemoria del giorno di (singoli + ricorrenze) in forma unica
const remEv = (e,x={}) => ({src:'ev', id:e.id, date:e.date, title:e.title, note:e.note, time:e.time, done:!!e.done, ...x});
const remRr = (r,d,x={}) => ({src:'rr', id:r.id, date:d, title:r.title, note:r.note, time:r.time, done:(r.done||[]).includes(d), rule:r, ...x});
function remOn(di){
  const a = SINGLE().filter(e=>e.kind==='reminder' && e.date===di).map(e=>remEv(e));
  RR().forEach(r=>rrOccur(r,di,di).forEach(d=>a.push(remRr(r,d))));
  return a;
}
// promemoria da mostrare nel giorno d: quelli del giorno; se d è oggi anche quelli passati non fatti
// e quelli in arrivo per cui è stato chiesto l'avviso in anticipo
function remindersFor(d){
  const di = iso(d), a = remOn(di);
  if(sameDay(d,today())){
    const y = iso(addDays(d,-1)), from = iso(addDays(d,-60));
    SINGLE().filter(e=>e.kind==='reminder' && e.date<di && !e.done).forEach(e=>a.push(remEv(e,{late:true})));
    RR().forEach(r=>rrOccur(r,from,y).filter(x=>!(r.done||[]).includes(x)).forEach(x=>a.push(remRr(r,x,{late:true}))));
    SINGLE().filter(e=>e.kind==='reminder' && e.date>di && !e.done && evNotice(e.id)>0 && e.date<=iso(addDays(d,evNotice(e.id)))).forEach(e=>a.push(remEv(e,{soon:true})));
    RR().forEach(r=>{ if(!(+r.notice>0)) return; rrOccur(r,iso(addDays(d,1)),iso(addDays(d,+r.notice))).filter(x=>!(r.done||[]).includes(x)).forEach(x=>a.push(remRr(r,x,{soon:true}))); });
  }
  const rank = x => x.done?3 : x.late?0 : x.soon?2 : 1;
  return a.sort((p,q)=>rank(p)-rank(q) || p.date.localeCompare(q.date) || (p.time||'').localeCompare(q.time||''));
}
const dayHasReminder = d => remOn(iso(d)).some(x=>!x.done);
const remWhen = r => { const n = daysBetween(today(), pd(r.date)); return n===1?'domani':`tra ${n} giorni · ${fmtDay(pd(r.date))}`; };
function remRow(r){
  return `<div class="li rem ${r.done?'done':''}"><button class="check ${r.done?'on':''}" style="--c:var(--rem)" data-act="evdone" data-src="${r.src}" data-id="${r.id}" data-d="${r.date}" aria-label="Fatto">${ic('check')}</button><button class="grow" style="text-align:left;min-height:44px" data-act="ev" data-src="${r.src}" data-id="${r.id}"><div style="font-weight:700">${esc(r.title)}${r.src==='rr'?` ${ic('refresh','style="width:14px;height:14px;vertical-align:-2px;color:var(--faint)" aria-label="ricorrente"')}`:''}</div><div class="muted small">${[r.late?`<span class="pill bad">dal ${fmtDay(pd(r.date))}</span>`:'', r.soon?`<span class="pill warn">${remWhen(r)}</span>`:'', r.time?'ore '+esc(r.time):'', esc(r.note||'')].filter(Boolean).join(' · ')}</div></button></div>`;
}
function remCard(rems,d){
  const open = rems.filter(r=>!r.done && !r.soon).length, soon = rems.filter(r=>r.soon && !r.done).length;
  return `<div class="remcard ${open?'lit':''}"><div class="row" style="gap:10px"><div class="ico" style="--c:var(--rem);--s:var(--rem-soft)">${ic('bell')}</div><div class="grow"><b style="font-family:var(--f-display);font-size:17px">Promemoria</b><div class="muted small">${rems.length?(open?`${open} da fare`:'tutti fatti')+(soon?` · ${soon} in arrivo`:''):'niente per questo giorno'}${sameDay(d,today())?'':' · '+fmtDay(d)}</div></div><button class="link" data-act="remall">Tutti</button><button class="link" data-act="newev" data-kind="reminder">+ Aggiungi</button></div>
    ${rems.length?`<div class="list" style="margin-top:6px">${rems.map(remRow).join('')}</div>`:''}</div>`;
}
ACT.newev = (el,D) => sheetEvent(null, D.kind||'attivita', D.day || iso(S.day));
ACT.ev = (el,D) => sheetEvent(+D.id);
ACT.evdone = async (el,D) => {
  if(D.src==='rr'){
    const e = DB.events.find(x=>x.id==D.id); if(!e) return;
    const set = new Set(e.done_dates||[]); const was = set.has(D.d); was ? set.delete(D.d) : set.add(D.d);
    const keep = iso(addDays(today(),-550)); // tengo solo le spunte dell'ultimo anno e mezzo
    const pr = upd('events', e.id, {done_dates:[...set].filter(x=>x>=keep).sort()}); refresh(); await pr;
    if(!was) toast('Fatto: '+e.title,{undo:async()=>{ const x=DB.events.find(z=>z.id==e.id); if(x){ await upd('events',x.id,{done_dates:(x.done_dates||[]).filter(d=>d!==D.d)}); refresh(); } }});
    return;
  }
  const e=DB.events.find(x=>x.id==D.id); await upd('events',e.id,{done:!e.done}); refresh(); if(e.done) toast('Fatto: '+e.title,{undo:async()=>{ await upd('events',e.id,{done:false}); refresh(); }});
};

/* --- scheda nuovo / modifica (attività, promemoria singolo o ricorrente) --- */
function sheetEvent(id, kind='attivita', day, ruleId){
  let e;
  if(id){ const x = DB.events.find(z=>z.id==id); if(!x) return;
    if(x.rec){ ruleId = x.id; e = {...evRule(x), kind:'reminder', date:x.date}; } else e = {...x, freq:'once', notice:+x.notice||0}; }
  else e = {kind, date:day, time:'', title:'', note:'', freq:'once', notice:0};
  const st = pd(e.date||iso(today()));
  const isRem = e.kind==='reminder', editing = !!(id||ruleId);
  const next = ruleId ? rrNext(e) : null;
  const dates = [...new Set(e.dates||[])].sort();
  openSheet(sheetHead(editing?'Modifica':'Nuovo nel calendario', editing?(ruleId?'Promemoria ricorrente'+(next?' · prossimo '+fmtDay(pd(next)):''):isRem?'Promemoria':'Attività'):'', isRem?'bell':'pin', isRem?'var(--rem)':'var(--accent)', isRem?'var(--rem-soft)':'var(--accent-soft)'),`
  <form class="stack" id="fEv" data-id="${id||''}">
    <div class="chips wrapped">
      <label class="chip"><input type="radio" name="evKind" value="attivita" ${!isRem?'checked':''}>${ic('pin','style="width:16px;height:16px"')}Attività</label>
      <label class="chip"><input type="radio" name="evKind" value="reminder" ${isRem?'checked':''}>${ic('bell','style="width:16px;height:16px"')}Promemoria</label>
    </div>
    <div class="faint small" style="margin-top:-4px">Attività: un impegno a un'ora precisa, compare nella giornata. Promemoria: una cosa da fare quel giorno (es. scadenza dell'assicurazione), resta evidenziata finché non la spunti; può ripetersi.</div>
    <div class="field"><label for="evTitle">Cosa</label><input class="input" id="evTitle" value="${esc(e.title)}" required placeholder="Es. Scadenza assicurazione nonno"></div>
    <div id="evRepBox" class="stack" ${isRem?'':'hidden'} style="gap:12px">
      <div class="field"><label for="evFreq">Ripetizione</label><select class="input" id="evFreq">${Object.entries(FREQ).map(([k,l])=>`<option value="${k}" ${e.freq===k?'selected':''}>${l}</option>`).join('')}</select></div>
      <div class="field" id="evIntBox" hidden><label for="evInt">Ogni quanto</label><div class="row" style="gap:10px"><span class="muted">ogni</span><input class="input mono" id="evInt" type="number" inputmode="numeric" min="1" max="365" value="${Math.max(1,+e.interval||1)}" style="width:90px"><span class="muted" id="evIntUnit"></span></div></div>
      <div class="field" id="evDowBox" hidden><span class="flabel">Nei giorni</span><div class="chips wrapped">${[1,2,3,4,5,6,0].map(k=>`<label class="chip"><input type="checkbox" name="evDow" value="${k}" ${(e.dows?.length?e.dows.map(Number):[st.getDay()]).includes(k)?'checked':''}>${DOW[k]}</label>`).join('')}</div></div>
      <div class="field" id="evDatesBox" hidden><span class="flabel">Date</span>
        <div class="chips wrapped" id="evDatesList">${dates.map(d=>evDateChip(d)).join('')}</div>
        <div class="row" style="gap:8px;margin-top:8px"><input class="input grow" id="evDateNew" type="date" value="${iso(st)}"><button type="button" class="btn small" style="min-height:50px" data-act="evdateadd">${ic('plus')}Aggiungi data</button></div></div>
    </div>
    <div class="grid2">
      <div class="field" id="evDateBox"><label for="evDate" id="evDateLbl">Giorno</label><input class="input" id="evDate" type="date" value="${e.date||iso(today())}"></div>
      <div class="field"><label for="evTime">Ora <span class="faint">(facoltativa)</span></label><input class="input" id="evTime" type="time" value="${esc(e.time||'')}"></div>
    </div>
    <div id="evEndBox" class="grid2" hidden>
      <div class="field"><label for="evEnd">Fine</label><select class="input" id="evEnd"><option value="never" ${!+e.count&&!e.until?'selected':''}>Mai</option><option value="count" ${+e.count?'selected':''}>Dopo n volte</option><option value="until" ${!+e.count&&e.until?'selected':''}>Fino a una data</option></select></div>
      <div class="field" id="evCountBox" hidden><label for="evCount">Quante volte</label><input class="input mono" id="evCount" type="number" inputmode="numeric" min="1" max="999" value="${+e.count||12}"></div>
      <div class="field" id="evUntilBox" hidden><label for="evUntil">Fino al</label><input class="input" id="evUntil" type="date" value="${e.until||iso(addDays(st,365))}"></div>
    </div>
    <div class="field" id="evNoticeBox" ${isRem?'':'hidden'}><label for="evNotice">Avvisami in anticipo</label><select class="input" id="evNotice">${[[0,'No, solo il giorno stesso'],[1,'1 giorno prima'],[2,'2 giorni prima'],[3,'3 giorni prima'],[7,'1 settimana prima'],[14,'2 settimane prima'],[30,'1 mese prima']].map(([k,l])=>`<option value="${k}" ${+e.notice===k?'selected':''}>${l}</option>`).join('')}</select></div>
    <div class="card flat small" id="evSum" style="padding:10px 12px" hidden></div>
    <div class="field"><label for="evNote">Note</label><input class="input" id="evNote" value="${esc(e.note||'')}" placeholder="facoltative"></div>
    <button class="btn accent block" type="submit">Salva</button>
    ${editing?`<button class="btn danger block" type="button" data-act="evdel" data-id="${id}">${ic('trash')}Elimina${ruleId?' (tutte le ripetizioni)':''}</button>`:''}
  </form>`);
  evFormSync();
}
const evDateChip = d => `<span class="chip on" data-date="${d}">${DOW[pd(d).getDay()]} ${fmtDay(pd(d))} ${d.slice(0,4)}<button type="button" class="iconbtn sm" style="width:26px;height:26px;min-height:0" data-act="evdaterm" data-d="${d}" aria-label="Togli data">${ic('close')}</button></span>`;
ACT.evdateadd = () => {
  const v = $('#evDateNew').value; if(!v) return;
  const list = $('#evDatesList'); if(list.querySelector(`[data-date="${v}"]`)){ toast('Data già presente'); return; }
  const all = [...list.querySelectorAll('[data-date]')].map(x=>x.dataset.date).concat(v).sort();
  list.innerHTML = all.map(evDateChip).join(''); $('#evDateNew').value = iso(addDays(pd(v),1)); evFormSync();
};
ACT.evdaterm = (el,D) => { el.closest('[data-date]')?.remove(); evFormSync(); };
// legge il modulo e restituisce la regola
function evCollect(){
  const f = $('#fEv'); const val = id => f.querySelector('#'+id)?.value?.trim() ?? '';
  const kind = f.querySelector('input[name=evKind]:checked')?.value || 'attivita';
  const freq = kind==='reminder' ? (val('evFreq')||'once') : 'once';
  const end = val('evEnd');
  return { kind, freq, title:val('evTitle'), note:val('evNote'), time:val('evTime')||null, start:val('evDate'),
    interval: Math.max(1, Math.min(365, +val('evInt')||1)),
    dows: [...f.querySelectorAll('input[name=evDow]:checked')].map(x=>+x.value),
    dates: [...f.querySelectorAll('#evDatesList [data-date]')].map(x=>x.dataset.date).sort(),
    count: freq!=='once'&&freq!=='dates'&&end==='count' ? Math.max(1,+val('evCount')||1) : null,
    until: freq!=='once'&&freq!=='dates'&&end==='until' ? (val('evUntil')||null) : null,
    notice: kind==='reminder' ? (+val('evNotice')||0) : 0 };
}
function evFormSync(){
  const f = $('#fEv'); if(!f) return;
  const r = evCollect(), rec = r.freq!=='once';
  const show = (id,on) => { const el=f.querySelector('#'+id); if(el) el.hidden = !on; };
  show('evRepBox', r.kind==='reminder'); show('evNoticeBox', r.kind==='reminder');
  show('evIntBox', ['weekly','monthly','yearly','days'].includes(r.freq));
  show('evDowBox', r.freq==='weekly'); show('evDatesBox', r.freq==='dates'); show('evDateBox', r.freq!=='dates');
  show('evEndBox', rec && r.freq!=='dates');
  show('evCountBox', $('#evEnd').value==='count'); show('evUntilBox', $('#evEnd').value==='until');
  if(FUNIT[r.freq]) $('#evIntUnit').textContent = r.interval===1 ? FUNIT[r.freq][0] : FUNIT[r.freq][1];
  $('#evDateLbl').textContent = rec ? 'A partire dal' : 'Giorno';
  const sum = $('#evSum'); sum.hidden = !rec;
  if(rec){
    const rr = {...r, start: r.freq==='dates' ? r.dates[0] : r.start};
    const nx = rr.start ? rrOccur(rr, iso(today()), iso(addDays(today(),800))).slice(0,3) : [];
    sum.innerHTML = `<b>${esc(describeRule(rr))}</b>${nx.length?`<div class="muted" style="margin-top:2px">Prossime: ${nx.map(d=>DOW[pd(d).getDay()].toLowerCase()+' '+fmtDay(pd(d))+(d.slice(0,4)!=String(today().getFullYear())?' '+d.slice(0,4):'')).join(', ')}</div>`:'<div class="muted" style="margin-top:2px">Nessuna data futura</div>'}`;
  }
}
document.addEventListener('change', e => { if(e.target.closest?.('#fEv')) evFormSync(); });
document.addEventListener('input', e => { if(e.target.closest?.('#fEv') && e.target.type==='number') evFormSync(); });

FORM.fEv = async (f) => {
  const r = evCollect(), id = f.dataset.id ? +f.dataset.id : null;
  if(!r.title){ toast('Scrivi cosa'); return; }
  const rec = r.freq!=='once';
  if(rec){
    if(r.freq==='dates' && !r.dates.length){ toast('Aggiungi almeno una data'); return; }
    if(r.freq==='weekly' && !r.dows.length){ toast('Scegli almeno un giorno della settimana'); return; }
    if(r.until && r.until < r.start){ toast('La data di fine è prima dell\'inizio'); return; }
  }
  const start = r.freq==='dates' ? r.dates[0] : r.start;
  if(!start){ toast(rec?'Scegli da quale giorno parte':'Scegli il giorno'); return; }
  const prev = id ? DB.events.find(x=>x.id==id) : null;
  const row = { kind:r.kind, title:r.title, date:start, time:r.time, note:r.note, notice:r.notice,
    rec: rec ? { freq:r.freq, interval:r.interval, dows:r.freq==='weekly'?r.dows:[], dates:r.freq==='dates'?r.dates:[], count:r.count, until:r.until } : null };
  if(rec && !prev?.rec) row.done_dates = [];   // da singolo a ricorrente: si riparte pulito
  const ev = id ? await upd('events',id,row) : await ins('events',row);
  DB.events.sort((a,b)=>a.date.localeCompare(b.date));
  const when0 = rec ? (rrNext(evRule(ev)) || start) : start;
  closeSheet(); S.day = pd(when0); render();
  const when = sameDay(pd(when0),today()) ? 'oggi' : DOWL[pd(when0).getDay()].toLowerCase()+' '+fmtDay(pd(when0));
  toast(rec ? 'Promemoria ricorrente salvato · prossimo '+when : (r.kind==='reminder'?'Promemoria':'Attività')+' salvato per '+when);
};
ACT.evdel = async (el,D) => {
  const e = DB.events.find(x=>x.id==D.id); if(!e) return;
  if(!await ask(e.rec?'Eliminare il promemoria ricorrente?':'Eliminare?', e.rec?`«${e.title}» · tutte le ripetizioni`:`«${e.title}» del ${fmtDay(pd(e.date))}`)) return;
  await del('events',e.id); closeSheet(); render(); toast('Eliminato');
};

/* --- elenco di tutti i promemoria --- */
ACT.remall = () => sheetRemAll();
function sheetRemAll(){
  const draw = () => {
    const T0 = iso(today()), to = iso(addDays(today(),90));
    const late = remindersFor(today()).filter(r=>r.late);
    const up = [];
    SINGLE().filter(e=>e.kind==='reminder' && e.date>=T0 && e.date<=to).forEach(e=>up.push(remEv(e)));
    RR().forEach(r=>rrOccur(r,T0,to).forEach(d=>up.push(remRr(r,d))));
    up.sort((a,b)=>a.date.localeCompare(b.date)||(a.time||'').localeCompare(b.time||''));
    const byDay = {}; up.forEach(r=>(byDay[r.date]=byDay[r.date]||[]).push(r));
    const later = SINGLE().filter(e=>e.kind==='reminder' && e.date>to && !e.done).length;
    openSheet(sheetHead('Promemoria','Ricorrenti, arretrati e prossimi 90 giorni','bell','var(--rem)','var(--rem-soft)'),`
    <div class="stack">
      <button class="btn block" style="background:var(--rem);color:#1a1300" data-act="newev" data-kind="reminder">${ic('plus')}Nuovo promemoria</button>
      ${late.length?`<div class="card flat"><div class="eyebrow" style="color:var(--bad)">Arretrati da fare</div><div class="list">${late.map(remRow).join('')}</div></div>`:''}
      <div class="card flat"><div class="eyebrow" style="color:var(--rem)">Ricorrenti</div><div class="list">${RR().map(r=>{ const nx=rrNext(r); return `<button class="li" style="text-align:left;width:100%" data-act="ev" data-src="rr" data-id="${r.id}"><div class="ico" style="--c:var(--rem);--s:var(--rem-soft)">${ic('refresh')}</div><div class="grow"><div style="font-weight:600">${esc(r.title)}</div><div class="muted small">${esc(describeRule(r))}</div><div class="small" style="margin-top:2px">${nx?`prossimo <b>${DOW[pd(nx).getDay()].toLowerCase()} ${fmtDay(pd(nx))}</b>`:'<span class="faint">concluso</span>'}</div></div>${ic('right','style="width:18px;height:18px;color:var(--faint)"')}</button>`; }).join('')||'<div class="muted small" style="padding:8px 0">Nessun promemoria ricorrente. Crea un promemoria e scegli «Ripetizione».</div>'}</div></div>
      <div class="card flat"><div class="eyebrow">Prossimi 90 giorni</div>${Object.entries(byDay).map(([d,rs])=>`<div class="faint small" style="margin:10px 0 0;font-weight:700">${d===T0?'Oggi':DOWL[pd(d).getDay()]+' '+fmtDay(pd(d))}</div><div class="list">${rs.map(remRow).join('')}</div>`).join('')||'<div class="muted small" style="padding:8px 0">Niente in programma</div>'}
        ${later?`<div class="faint small" style="margin-top:8px">+ ${later} promemoria più avanti (li trovi nel calendario)</div>`:''}</div>
    </div>`, draw);
  };
  draw();
}

/* --- vista mese --- */
ACT.month = () => { S.calMonth = ym(S.day); sheetMonth(); };
ACT.calm = (el,D) => { S.calMonth = ymAdd(S.calMonth,+D.n); sheetMonth(); };
ACT.calday = (el,D) => { S.day = pd(D.d); closeSheet(); render(); scrollTo({top:0}); };
function sheetMonth(){
  const draw = () => {
    const m = S.calMonth, first = pd(m+'-01'), T0 = today();
    const start = monday(first); const cells = [];
    for(let dd=start; ; dd=addDays(dd,1)){ if(dd>first && ym(dd)!==m && dd.getDay()===1) break; cells.push(dd); if(cells.length>42) break; }
    const last = iso(new Date(first.getFullYear(), first.getMonth()+1, 0));
    // voci del mese: eventi + ricorrenze dei promemoria
    const evs = SINGLE().filter(e=>e.date.startsWith(m)).map(e=>({src:'ev',id:e.id,kind:e.kind,date:e.date,time:e.time,title:e.title,done:!!e.done}));
    RR().forEach(r=>rrOccur(r,iso(first),last).forEach(d=>evs.push({src:'rr',id:r.id,kind:'reminder',date:d,time:r.time,title:r.title,done:(r.done||[]).includes(d)})));
    evs.sort((a,b)=>a.date.localeCompare(b.date)||(a.time||'').localeCompare(b.time||''));
    openSheet(sheetHead(ymLabel(m),'Tocca un giorno per aprirlo','cal','var(--accent)','var(--accent-soft)'),`
    <div class="stack">
      <div class="row" style="justify-content:space-between"><button class="iconbtn solid" data-act="calm" data-n="-1" aria-label="Mese precedente">${ic('left')}</button><b style="font-family:var(--f-display);font-size:18px">${ymLabel(m)}</b><button class="iconbtn solid" data-act="calm" data-n="1" aria-label="Mese successivo">${ic('right')}</button></div>
      <div class="mgrid">${['Lun','Mar','Mer','Gio','Ven','Sab','Dom'].map(x=>`<span class="mh">${x}</span>`).join('')}
        ${cells.map(dd=>{ const di=iso(dd), es=eventsOn(di), r=dayHasReminder(dd), a=es.some(e=>e.kind==='attivita'), w=workoutsOn(di).length;
          return `<button class="md ${ym(dd)!==m?'out':''} ${sameDay(dd,T0)?'today':''} ${sameDay(dd,S.day)?'on':''} ${r?'rem':''}" data-act="calday" data-d="${di}"><span class="n">${dd.getDate()}</span><span class="marks">${r?'<i style="background:var(--rem)"></i>':''}${a?'<i style="background:var(--accent)"></i>':''}${w?'<i style="background:var(--sport)"></i>':''}</span></button>`; }).join('')}
      </div>
      <div class="row wrap faint small" style="gap:14px"><span><i class="lg" style="background:var(--rem)"></i>promemoria</span><span><i class="lg" style="background:var(--accent)"></i>attività</span><span><i class="lg" style="background:var(--sport)"></i>allenamento</span></div>
      <div class="card flat"><div class="section-h" style="margin:0"><h2 style="font-size:17px">Nel mese</h2><button class="link" data-act="newev" data-day="${sameDay(first,T0)||ym(T0)!==m?iso(first):iso(T0)}">+ Aggiungi</button></div>
        <div class="list">${evs.map(e=>`<button class="li" style="text-align:left;width:100%" data-act="ev" data-src="${e.src}" data-id="${e.id}"><div class="ico" style="--c:${e.kind==='reminder'?'var(--rem)':'var(--accent)'};--s:${e.kind==='reminder'?'var(--rem-soft)':'var(--accent-soft)'}">${ic(e.src==='rr'?'refresh':e.kind==='reminder'?'bell':'pin')}</div><div class="grow"><div style="font-weight:600;${e.done?'text-decoration:line-through;opacity:.6':''}">${esc(e.title)}</div><div class="muted small">${DOW[pd(e.date).getDay()]} ${fmtDay(pd(e.date))}${e.time?' · '+esc(e.time):''}${e.src==='rr'?' · si ripete':''}</div></div></button>`).join('')||'<div class="muted small" style="padding:8px 0">Niente in calendario questo mese</div>'}</div></div>
    </div>`, draw);
  };
  draw();
}

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
