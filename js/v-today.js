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
    ${rems.length?remCard(rems,d):''}
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
   CALENDARIO · reminder (da spuntare, restano in evidenza finché non li fai)
               e attività con orario (es. «Parrucchiere ore 18»)
   ===================================================================== */
const eventsOn = date => DB.events.filter(e=>e.date===date).sort((a,b)=>(a.time||'').localeCompare(b.time||''));
// reminder da mostrare nel giorno d: quelli del giorno + (se d è oggi) quelli passati non ancora fatti
function remindersFor(d){
  const di = iso(d), isT = sameDay(d,today());
  return DB.events.filter(e=>e.kind==='reminder' && (e.date===di || (isT && e.date<di && !e.done)))
    .sort((a,b)=>a.done-b.done || a.date.localeCompare(b.date) || (a.time||'').localeCompare(b.time||''));
}
const dayHasReminder = d => DB.events.some(e=>e.kind==='reminder' && e.date===iso(d) && !e.done);
function remCard(rems,d){
  const open = rems.filter(r=>!r.done).length;
  return `<div class="remcard ${open?'lit':''}"><div class="row" style="gap:10px"><div class="ico" style="--c:var(--rem);--s:var(--rem-soft)">${ic('bell')}</div><div class="grow"><b style="font-family:var(--f-display);font-size:17px">Promemoria</b><div class="muted small">${open?`${open} da fare`:'tutti fatti'}${sameDay(d,today())?'':' · '+fmtDay(d)}</div></div><button class="link" data-act="newev" data-kind="reminder">+ Aggiungi</button></div>
    <div class="list" style="margin-top:6px">${rems.map(r=>{ const late = !r.done && r.date<iso(today());
      return `<div class="li rem ${r.done?'done':''}"><button class="check ${r.done?'on':''}" style="--c:var(--rem)" data-act="evdone" data-id="${r.id}" aria-label="Fatto">${ic('check')}</button><button class="grow" style="text-align:left;min-height:44px" data-act="ev" data-id="${r.id}"><div style="font-weight:700">${esc(r.title)}</div><div class="muted small">${[r.time?'ore '+esc(r.time):'',late?`<span class="pill bad">dal ${fmtDay(pd(r.date))}</span>`:'',esc(r.note||'')].filter(Boolean).join(' · ')}</div></button></div>`; }).join('')}</div></div>`;
}
ACT.newev = (el,D) => sheetEvent(null, D.kind||'attivita', D.day || iso(S.day));
ACT.ev = (el,D) => sheetEvent(+D.id);
ACT.evdone = async (el,D) => { const e=DB.events.find(x=>x.id==D.id); await upd('events',e.id,{done:!e.done}); refresh(); if(e.done) toast('Fatto: '+e.title,{undo:async()=>{ await upd('events',e.id,{done:false}); refresh(); }}); };
function sheetEvent(id, kind='attivita', day){
  const e = id ? DB.events.find(x=>x.id==id) : {kind, date:day, time:'', title:'', note:''};
  if(!e) return;
  openSheet(sheetHead(id?'Modifica':'Nuovo nel calendario', id?(e.kind==='reminder'?'Promemoria':'Attività'):'', e.kind==='reminder'?'bell':'pin', e.kind==='reminder'?'var(--rem)':'var(--accent)', e.kind==='reminder'?'var(--rem-soft)':'var(--accent-soft)'),`
  <form class="stack" id="fEv" data-id="${id||''}">
    <div class="chips wrapped">
      <label class="chip"><input type="radio" name="evKind" value="attivita" ${e.kind==='attivita'?'checked':''}>${ic('pin','style="width:16px;height:16px"')}Attività</label>
      <label class="chip"><input type="radio" name="evKind" value="reminder" ${e.kind==='reminder'?'checked':''}>${ic('bell','style="width:16px;height:16px"')}Promemoria</label>
    </div>
    <div class="faint small" style="margin-top:-4px">Attività: un impegno a un'ora precisa, compare nella giornata. Promemoria: una cosa da fare quel giorno, resta evidenziata finché non la spunti.</div>
    <div class="field"><label for="evTitle">Cosa</label><input class="input" id="evTitle" value="${esc(e.title)}" required placeholder="Es. Parrucchiere" ${id?'':'autofocus'}></div>
    <div class="grid2">
      <div class="field"><label for="evDate">Giorno</label><input class="input" id="evDate" type="date" value="${e.date}" required></div>
      <div class="field"><label for="evTime">Ora <span class="faint">(facoltativa)</span></label><input class="input" id="evTime" type="time" value="${esc(e.time||'')}"></div>
    </div>
    <div class="field"><label for="evNote">Note</label><input class="input" id="evNote" value="${esc(e.note||'')}" placeholder="facoltative"></div>
    <button class="btn accent block" type="submit">Salva</button>
    ${id?`<button class="btn danger block" type="button" data-act="evdel" data-id="${id}">${ic('trash')}Elimina</button>`:''}
  </form>`);
}
FORM.fEv = async (f,v) => {
  const row = { kind: f.querySelector('input[name=evKind]:checked')?.value || 'attivita', title:v('evTitle'), date:v('evDate'), time:v('evTime')||null, note:v('evNote') };
  if(!row.title || !row.date){ toast('Inserisci cosa e il giorno'); return; }
  if(f.dataset.id) await upd('events',+f.dataset.id,row); else await ins('events',row);
  DB.events.sort((a,b)=>a.date.localeCompare(b.date));
  closeSheet(); S.day = pd(row.date); render();
  toast((row.kind==='reminder'?'Promemoria':'Attività')+' salvato per '+(sameDay(pd(row.date),today())?'oggi':DOWL[pd(row.date).getDay()].toLowerCase()+' '+fmtDay(pd(row.date))));
};
ACT.evdel = async (el,D) => { const e=DB.events.find(x=>x.id==D.id); if(!await ask('Eliminare?',`«${e.title}» del ${fmtDay(pd(e.date))}`)) return; await del('events',e.id); closeSheet(); render(); toast('Eliminato'); };

/* --- vista mese --- */
ACT.month = () => { S.calMonth = ym(S.day); sheetMonth(); };
ACT.calm = (el,D) => { S.calMonth = ymAdd(S.calMonth,+D.n); sheetMonth(); };
ACT.calday = (el,D) => { S.day = pd(D.d); closeSheet(); render(); scrollTo({top:0}); };
function sheetMonth(){
  const draw = () => {
    const m = S.calMonth, first = pd(m+'-01'), T0 = today();
    const start = monday(first); const cells = [];
    for(let dd=start; ; dd=addDays(dd,1)){ if(dd>first && ym(dd)!==m && dd.getDay()===1) break; cells.push(dd); if(cells.length>42) break; }
    const evs = DB.events.filter(e=>e.date.startsWith(m)).sort((a,b)=>a.date.localeCompare(b.date)||(a.time||'').localeCompare(b.time||''));
    openSheet(sheetHead(ymLabel(m),'Tocca un giorno per aprirlo','cal','var(--accent)','var(--accent-soft)'),`
    <div class="stack">
      <div class="row" style="justify-content:space-between"><button class="iconbtn solid" data-act="calm" data-n="-1" aria-label="Mese precedente">${ic('left')}</button><b style="font-family:var(--f-display);font-size:18px">${ymLabel(m)}</b><button class="iconbtn solid" data-act="calm" data-n="1" aria-label="Mese successivo">${ic('right')}</button></div>
      <div class="mgrid">${['Lun','Mar','Mer','Gio','Ven','Sab','Dom'].map(x=>`<span class="mh">${x}</span>`).join('')}
        ${cells.map(dd=>{ const di=iso(dd), es=eventsOn(di), r=dayHasReminder(dd), a=es.some(e=>e.kind==='attivita'), w=workoutsOn(di).length;
          return `<button class="md ${ym(dd)!==m?'out':''} ${sameDay(dd,T0)?'today':''} ${sameDay(dd,S.day)?'on':''} ${r?'rem':''}" data-act="calday" data-d="${di}"><span class="n">${dd.getDate()}</span><span class="marks">${r?'<i style="background:var(--rem)"></i>':''}${a?'<i style="background:var(--accent)"></i>':''}${w?'<i style="background:var(--sport)"></i>':''}</span></button>`; }).join('')}
      </div>
      <div class="row wrap faint small" style="gap:14px"><span><i class="lg" style="background:var(--rem)"></i>promemoria</span><span><i class="lg" style="background:var(--accent)"></i>attività</span><span><i class="lg" style="background:var(--sport)"></i>allenamento</span></div>
      <div class="card flat"><div class="section-h" style="margin:0"><h2 style="font-size:17px">Nel mese</h2><button class="link" data-act="newev" data-day="${sameDay(first,T0)||ym(T0)!==m?iso(first):iso(T0)}">+ Aggiungi</button></div>
        <div class="list">${evs.map(e=>`<button class="li" style="text-align:left;width:100%" data-act="ev" data-id="${e.id}"><div class="ico" style="--c:${e.kind==='reminder'?'var(--rem)':'var(--accent)'};--s:${e.kind==='reminder'?'var(--rem-soft)':'var(--accent-soft)'}">${ic(e.kind==='reminder'?'bell':'pin')}</div><div class="grow"><div style="font-weight:600;${e.done?'text-decoration:line-through;opacity:.6':''}">${esc(e.title)}</div><div class="muted small">${DOW[pd(e.date).getDay()]} ${fmtDay(pd(e.date))}${e.time?' · '+esc(e.time):''}</div></div></button>`).join('')||'<div class="muted small" style="padding:8px 0">Niente in calendario questo mese</div>'}</div></div>
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
