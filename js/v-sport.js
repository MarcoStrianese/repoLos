/* =====================================================================
   LOS · vista SPORT (settimana, scheda del PT, gare Hyrox, Strava)
   ===================================================================== */
S.sportTab = 'settimana'; S.sportWeek = monday(today());
const STRAVA = { connected:null, athlete:null, syncing:false, lastSync:null };

VIEWS.sport = function(){
  const t=S.sportTab;
  $('#view').innerHTML = `
  <div class="phead compact"><span class="eyebrow">Allenamenti · Hyrox</span><h1>Sport</h1></div>
  <div class="tabs"><div class="seg">${[['settimana','Settimana'],['scheda','Scheda'],['gare','Gare Hyrox']].map(([k,l])=>`<button class="${t===k?'on':''}" data-act="st" data-k="${k}">${l}</button>`).join('')}</div></div>
  <div id="sportBody" class="stack"></div>`;
  ({settimana:spWeek,scheda:spScheda,gare:spGare})[t]();
  fab(t==='gare'?'Gara':t==='scheda'?null:'Allenamento','var(--sport)',t==='gare'?'newrace':'addwo');
};
ACT.st = (el,D) => { S.sportTab=D.k; render(); scrollTo({top:0}); };

function spWeek(){
  const mon=S.sportWeek, days=Array.from({length:7},(_,i)=>addDays(mon,i));
  const all=days.flatMap(d=>workoutsOn(iso(d))); const dn=all.filter(s=>s.done).length;
  const plan = activePlan();
  const canFill = plan && !all.some(w=>w.src==='scheda') && addDays(mon,6) >= today();
  const dd = defaultDays();
  $('#sportBody').innerHTML = `
    <div class="cols"><div class="stack">
    <div class="card"><div class="row" style="justify-content:space-between"><button class="iconbtn" data-act="sw" data-n="-7" aria-label="Settimana precedente">${ic('left')}</button><button style="text-align:center;min-height:44px" data-act="swtoday"><b>${fmtDay(mon)} – ${fmtDay(addDays(mon,6))}</b><div class="muted small">${dn} di ${all.length} completati</div></button><button class="iconbtn" data-act="sw" data-n="7" aria-label="Settimana successiva">${ic('right')}</button></div>
      <div class="bar" style="margin-top:12px;--c:var(--sport)"><span style="width:${all.length?dn/all.length*100:0}%"></span></div></div>
    ${canFill?`<button class="card tap" data-act="fillweek" style="background:var(--sport-soft);box-shadow:none;text-align:left"><div class="row"><div class="ico" style="--c:var(--sport);--s:var(--surface)">${ic('bolt')}</div><div class="grow"><b>Compila la settimana dalla scheda</b><div class="muted small">${dd.length} sessioni (${[1,2,3,4,5,6,0].filter(x=>dd.includes(x)).map(x=>DOW[x]).join(', ')}) da «${esc(plan.name)}», a partire dal Giorno ${nextPlanDay(iso(mon))}</div></div>${ic('right','style="width:20px;height:20px;color:var(--sport)"')}</div></button>`:''}
    <div class="card" style="padding-top:6px;padding-bottom:6px">${days.map(d=>{const p=workoutsOn(iso(d)); return `<div class="day ${sameDay(d,today())?'today':''}"><div class="dn"><span>${DOW[d.getDay()]}</span><b>${d.getDate()}</b></div><div class="stack" style="gap:8px">${p.map(s=>`<div class="wo tap ${s.done?'done':''}" data-act="wo" data-id="${s.id}"><div class="grow"><b>${esc(s.title)}</b><span>${esc(s.time||'')}${s.src==='strava'?' · da Strava':s.src==='scheda'?' · scheda':''}</span></div><button class="check ${s.done?'on':''}" style="--c:var(--sport)" data-act="wodone" data-id="${s.id}" aria-label="Fatto">${ic('check')}</button></div>`).join('')}${p.length?'':`<div class="row rest"><span class="grow">Riposo</span><button class="link" data-act="addwo" data-day="${iso(d)}">+ Aggiungi</button></div>`}</div></div>`}).join('')}</div>
    </div><div class="stack">
    <div class="card"><div class="eyebrow">Giorni di allenamento predefiniti</div><div class="muted small" style="margin:4px 0 10px">Usati da «Compila la settimana»: i giorni della scheda vengono assegnati in sequenza. Puoi cambiarli e spostare le singole sessioni settimana per settimana.</div>
      <div class="row" style="gap:6px">${[1,2,3,4,5,6,0].map(d=>`<button class="chip ${dd.includes(d)?'on':''}" style="flex:1;justify-content:center;padding:0" data-act="defday" data-k="${d}">${DOW[d][0]}</button>`).join('')}</div></div>
    ${stravaCard()}
    </div></div>`;
  if(STRAVA.connected && !STRAVA.syncing && (!STRAVA.lastSync || Date.now()-STRAVA.lastSync>10*60e3)) stravaSync(true);
}
ACT.sw = (el,D) => { S.sportWeek=addDays(S.sportWeek,+D.n); render(); };
ACT.swtoday = () => { S.sportWeek=monday(today()); render(); };
ACT.defday = async (el,D) => { const k=+D.k, cur=defaultDays(); await saveSettings({default_days: cur.includes(k)?cur.filter(x=>x!==k):cur.concat(k)}); render(); };
ACT.fillweek = async () => {
  const plan = activePlan(); const mon = S.sportWeek; const dd = defaultDays(); const n = plan.days.length;
  let g = nextPlanDay(iso(mon)); let c = 0;
  for(let i=0;i<7;i++){
    const d = addDays(mon,i); if(!dd.includes(d.getDay()) || d < today()) continue;
    const day = plan.days.find(x=>x.g===g) || plan.days[(g-1)%n];
    await ins('workouts',{date:iso(d), time:d.getDay()===6||d.getDay()===0?'08:00':'18:30', title:`Giorno ${day.g} · ${day.title}`, body:day.body, src:'scheda', plan_day:day.g});
    g = (g % n) + 1; c++;
  }
  render(); toast(c?`${c} sessioni pianificate`:'Nessun giorno rimasto in questa settimana');
};

/* --- singola sessione --- */
ACT.wo = (el,D,e) => { if(e.target.closest('.check')) return; sheetWorkout(+D.id); };
ACT.wodone = async (el,D) => { const s=DB.workouts.find(x=>x.id==D.id); const pr=upd('workouts',s.id,{done:!s.done}); refresh(); await pr; if(s.done) toast('Allenamento completato'); };
function sheetWorkout(id){
  const draw = () => {
    const s = DB.workouts.find(x=>x.id==id); if(!s){ closeSheet(); return; }
    const d = pd(s.date);
    openSheet(sheetHead(esc(s.title),`${DOWL[d.getDay()]} ${fmtDay(d)} · ${esc(s.time||'')}`,'sport','var(--sport)','var(--sport-soft)'),`
    <div class="stack">
      ${s.body?`<div class="card">${s.body.split('\n').map(l=>`<div class="ex">${esc(l)}</div>`).join('')}</div>`:`<div class="card muted">${s.src==='strava'?'Attività importata da Strava.':'Sessione aggiunta a mano.'}</div>`}
      <button class="btn block ${s.done?'ghost':''}" style="${s.done?'':'background:var(--sport);color:#fff'}" data-act="wodone" data-id="${s.id}">${ic('check')}${s.done?'Segna come da fare':'Segna come fatto'}</button>
      <div class="grid2"><button class="btn ghost" data-act="womove" data-id="${s.id}" data-n="-1">← Giorno prima</button><button class="btn ghost" data-act="womove" data-id="${s.id}" data-n="1">Giorno dopo →</button></div>
      <div class="field"><label for="woT">Ora</label><input class="input" id="woT" type="time" value="${esc(s.time||'')}" data-save="time" data-table="workouts" data-id="${s.id}"></div>
      <button class="btn danger block" data-act="wodel" data-id="${s.id}">${ic('trash')}Elimina sessione</button>
    </div>`, draw);
  };
  draw();
}
ACT.womove = async (el,D) => { const s=DB.workouts.find(x=>x.id==D.id); const nd=iso(addDays(pd(s.date),+D.n)); await upd('workouts',s.id,{date:nd}); refresh(); toast('Spostato a '+DOWL[pd(nd).getDay()].toLowerCase()); };
ACT.wodel = async (el,D) => { const s={...DB.workouts.find(x=>x.id==D.id)}; await del('workouts',s.id); closeSheet(); render();
  toast('Sessione eliminata',{undo:async()=>{ const {id,user_id,created_at,...rest}=s; await ins('workouts',rest); render(); }}); };
ACT.addwo = (el,D) => sheetAddWorkout(D.day || iso(S.view==='sport'?(sameDay(monday(today()),S.sportWeek)?today():S.sportWeek):S.day));
function sheetAddWorkout(dayIso){
  const plan = activePlan();
  openSheet(sheetHead('Aggiungi allenamento','','sport','var(--sport)','var(--sport-soft)'),`
    <form class="stack" id="fAddWo">
      <div class="grid2"><div class="field"><label for="woDate">Giorno</label><input class="input" id="woDate" type="date" value="${dayIso}" required></div><div class="field"><label for="woTime">Ora</label><input class="input" id="woTime" type="time" value="18:30"></div></div>
      ${plan?`<div class="field"><label for="woSrc">Dalla scheda «${esc(plan.name)}»</label><select class="input" id="woSrc"><option value="">Allenamento libero</option>${plan.days.map(g=>`<option value="${g.g}">Giorno ${g.g} · ${esc(g.title)}</option>`).join('')}</select></div>`:''}
      <div class="field"><label for="woTitle">Titolo (se libero)</label><input class="input" id="woTitle" placeholder="Es. Allenamento Hyrox"></div>
      <div class="field"><label for="woBody">Dettagli (facoltativi)</label><textarea class="input" id="woBody" placeholder="Esercizi, serie, note"></textarea></div>
      <button class="btn block" style="background:var(--sport);color:#fff" type="submit">Aggiungi</button>
    </form>`);
}
FORM.fAddWo = async (f,v) => {
  const plan = activePlan(); const g = v('woSrc'); const day = g&&plan ? plan.days.find(x=>x.g==g) : null;
  await ins('workouts',{date:v('woDate'), time:v('woTime')||'18:30', title: day?`Giorno ${day.g} · ${day.title}`:(v('woTitle')||'Allenamento'), body: day?day.body:v('woBody'), src: day?'scheda':'manual', plan_day: day?day.g:null});
  closeSheet(); render(); toast('Allenamento aggiunto');
};

/* --- scheda del PT: import da file --- */
let parsedPlan = null;
function spScheda(){
  const plan = activePlan();
  $('#sportBody').innerHTML = `
    <div class="drop" id="drop"><div>${ic('upload')}</div><b>Carica la scheda del PT</b><span class="muted small">DOCX o PDF. Riconosco i blocchi «GIORNO 1, GIORNO 2…» anche se il formato cambia. Il file viene letto sul dispositivo.</span><label class="btn small" style="background:var(--sport);color:#fff;margin-top:4px">Scegli file<input type="file" id="schedaFile" accept=".pdf,.docx,.txt" hidden></label></div>
    <div id="parseOut"></div>
    ${plan?`<div class="section-h"><h2>Scheda attiva · ${esc(plan.name)}</h2><span class="faint small">${plan.days.length} giorni</span></div>
    <div class="stack">${plan.days.map((g,i)=>`<div class="acc ${i===0?'open':''}"><button data-act="acc-t"><div class="ico" style="--c:var(--sport);--s:var(--sport-soft);font-family:var(--f-display);font-weight:800">${g.g}</div><div class="grow"><b>Giorno ${g.g}</b><div class="muted small">${esc(g.title)}</div></div><span class="chev">${ic('chev','style="width:18px;height:18px"')}</span></button><div class="in">${g.body.split('\n').map(l=>`<div class="ex">${esc(l)}</div>`).join('')}</div></div>`).join('')}</div>`:'<div class="empty">Nessuna scheda attiva: caricane una.</div>'}
    ${DB.plans.length>1||(!plan&&DB.plans.length)?`<div class="section-h"><h2>Schede precedenti</h2></div><div class="card"><div class="list">${DB.plans.filter(p=>!p.active).map(p=>`<div class="li"><div class="ico">${ic('note')}</div><div class="grow"><b>${esc(p.name)}</b><div class="muted small">${p.days.length} giorni · caricata il ${fmtDay(new Date(p.created_at))}</div></div><button class="btn small ghost" data-act="planact" data-id="${p.id}">Attiva</button>${delBtn('plandel',`data-id="${p.id}"`)}</div>`).join('')}</div></div>`:''}`;
  const drop=$('#drop'), inp=$('#schedaFile');
  const handle = async file => {
    $('#parseOut').innerHTML = `<div class="card stack" style="gap:10px"><b>Analisi di «${esc(file.name)}»…</b><div class="scan"><span></span></div></div>`;
    try{
      const days = parsePlanText(await fileText(file));
      if(!days.length) throw new Error('Non ho trovato i marcatori «GIORNO n» nel file.');
      parsedPlan = {name:file.name.replace(/\.[^.]+$/,'').replace(/^\d+_/,''), days};
      $('#parseOut').innerHTML = `<div class="card stack" style="gap:10px;border:2px solid var(--good)"><div class="row"><span class="pill good">${days.length} giorni trovati</span><b class="grow">${esc(file.name)}</b></div>
        <div class="field"><label for="planName">Nome della scheda</label><input class="input" id="planName" value="${esc(parsedPlan.name)}"></div>
        ${days.map((d,i)=>`<div class="row" style="gap:10px;align-items:flex-start"><span class="mono faint" style="width:22px;padding-top:14px">${d.g}</span><div class="grow"><input class="input" data-pt="${i}" value="${esc(d.title)}" aria-label="Titolo giorno ${d.g}" style="min-height:44px"><div class="faint small" style="margin-top:4px">${esc(d.body.split('\n').slice(1,3).join(' · '))}</div></div></div>`).join('')}
        <div class="row"><button class="btn small grow" style="background:var(--sport);color:#fff" data-act="useplan">Salva e rendi attiva</button><button class="btn small ghost" data-act="dropparse">Annulla</button></div>
        <div class="faint small">Dalla prossima «Compila la settimana» le sessioni useranno questa scheda, ripartendo dal Giorno 1.</div></div>`;
    }catch(err){ $('#parseOut').innerHTML = `<div class="card" style="border:2px solid var(--bad)"><b>Lettura non riuscita</b><div class="muted small">${esc(err.message)} Puoi sempre aggiungere gli allenamenti a mano.</div></div>`; }
  };
  inp.addEventListener('change',e=>e.target.files[0]&&handle(e.target.files[0]));
  drop.addEventListener('dragover',e=>{e.preventDefault();drop.classList.add('over')});
  drop.addEventListener('dragleave',()=>drop.classList.remove('over'));
  drop.addEventListener('drop',e=>{e.preventDefault();drop.classList.remove('over'); e.dataTransfer.files[0]&&handle(e.dataTransfer.files[0]);});
}
ACT['acc-t'] = el => el.parentNode.classList.toggle('open');
ACT.dropparse = () => { parsedPlan=null; $('#parseOut').innerHTML=''; };
ACT.useplan = async () => {
  $$('[data-pt]').forEach(i=>parsedPlan.days[+i.dataset.pt].title = i.value.trim()||('Giorno '+parsedPlan.days[+i.dataset.pt].g));
  const name = $('#planName').value.trim() || parsedPlan.name;
  for(const p of DB.plans.filter(p=>p.active)) await upd('plans',p.id,{active:false});
  await ins('plans',{name, days:parsedPlan.days, active:true}); DB.plans.sort((a,b)=>String(b.created_at).localeCompare(String(a.created_at)));
  parsedPlan=null; render(); toast('Scheda «'+name+'» attiva');
};
ACT.planact = async (el,D) => { for(const p of DB.plans.filter(p=>p.active)) await upd('plans',p.id,{active:false}); await upd('plans',+D.id,{active:true}); render(); toast('Scheda attivata'); };
ACT.plandel = async (el,D) => { const p=DB.plans.find(x=>x.id==D.id); if(!await ask('Eliminare la scheda?',`«${p.name}». Le sessioni già pianificate restano.`)) return; await del('plans',p.id); render(); };

/* --- gare Hyrox --- */
function spGare(){
  const H = DB.hyrox.slice().sort((a,b)=>a.date.localeCompare(b.date));
  const best = H.slice().sort((a,b)=>toMin(a.time)-toMin(b.time))[0];
  $('#sportBody').innerHTML = H.length ? `
    <div class="cols"><div class="card"><div class="row"><div class="eyebrow grow">Andamento tempi (min)</div><span class="pill good">PB ${esc(best.time)}</span></div>
      <div style="margin-top:8px">${lineChart(H.map(h=>toMin(h.time)),H.map(h=>MON[pd(h.date).getMonth()]+' '+h.date.slice(2,4)),{color:'var(--sport)',unit:'′'})}</div></div>
    <div class="card"><div class="list">${H.slice().reverse().map(h=>`<div class="li"><div class="ico" style="--c:var(--sport);--s:var(--sport-soft)">${ic('trophy')}</div><div class="grow"><b>${esc(h.place||'Gara')}</b><div class="muted small">${fmtDay(pd(h.date))} ${h.date.slice(0,4)} · ${esc(h.kind)}</div></div><span class="mono" style="font-weight:600;font-size:16px">${esc(h.time)}</span>${delBtn('racedel',`data-id="${h.id}"`)}</div>`).join('')}</div></div></div>`
    : `<div class="empty">${ic('trophy','style="width:28px;height:28px"')}<b>Nessuna gara registrata</b><span class="small">Aggiungi le tue gare Hyrox: data, luogo, categoria e tempo.</span></div>`;
}
ACT.newrace = () => openSheet(sheetHead('Nuova gara Hyrox','','trophy','var(--sport)','var(--sport-soft)'),`
  <form class="stack" id="fRace">
    <div class="grid2"><div class="field"><label for="rDate">Data</label><input class="input" id="rDate" type="date" value="${iso(today())}" required></div><div class="field"><label for="rPlace">Luogo</label><input class="input" id="rPlace" required placeholder="Es. Verona"></div></div>
    <div class="field"><label for="rKind">Categoria</label><select class="input" id="rKind">${['Single Open','Single Pro','Doubles Open Men','Doubles Mixed','Doubles Pro','Relay'].map(k=>`<option>${k}</option>`).join('')}</select></div>
    <div class="field"><label for="rTime">Tempo (h:mm:ss)</label><input class="input mono" id="rTime" placeholder="1:09:30" pattern="\\d{1,2}:\\d{2}:\\d{2}" required style="font-size:24px"></div>
    <button class="btn block" style="background:var(--sport);color:#fff" type="submit">Salva gara</button>
  </form>`);
FORM.fRace = async (f,v) => { await ins('hyrox',{date:v('rDate'),place:v('rPlace'),kind:v('rKind'),time:v('rTime')}); closeSheet(); render(); toast('Gara salvata'); };
ACT.racedel = async (el,D) => { const h=DB.hyrox.find(x=>x.id==D.id); if(!await ask('Eliminare la gara?',`${h.place} · ${h.time}`)) return; await del('hyrox',h.id); render(); };

/* =====================================================================
   STRAVA (Polar Flow → Strava → LOS) tramite la Edge Function "strava"
   ===================================================================== */
async function stravaCall(body){
  const { data, error } = await sb.functions.invoke('strava', { body });
  if(error){ let msg = error.message; try{ const j = await error.context?.json?.(); if(j?.error) msg = j.error; }catch(e){} throw new Error(msg); }
  if(data?.error) throw new Error(data.error);
  return data;
}
async function stravaStatus(){
  try{ const r = await stravaCall({action:'status'}); STRAVA.connected = r.connected; STRAVA.athlete = r.athlete_name; }
  catch(e){ STRAVA.connected = false; STRAVA.error = e.message; }
}
function stravaCard(){
  const c = STRAVA.connected;
  return `<div class="card"><div class="row"><div class="ico" style="--c:#FC4C02;--s:color-mix(in srgb,#FC4C02 14%,transparent)">${ic('link')}</div><div class="grow"><b>Strava · Polar Flow</b><div class="muted small">${c?`Collegato${STRAVA.athlete?' come '+esc(STRAVA.athlete):''}. Le attività registrate segnano «fatto» la sessione del giorno.`:c===null?'Verifica collegamento…':'Collega Strava (riceve i dati dal Polar) per segnare in automatico gli allenamenti fatti.'}</div></div></div>
    ${STRAVA.error&&!c?`<div class="hint" style="margin-top:8px">${esc(STRAVA.error)}</div>`:''}
    <div class="row" style="margin-top:12px">${c?`<button class="btn small grow" style="background:#FC4C02;color:#fff" data-act="stravasync" ${STRAVA.syncing?'disabled':''}>${STRAVA.syncing?'Sincronizzo…':'Sincronizza settimana'}</button><button class="btn small ghost" data-act="stravaoff">Scollega</button>`
      :`<button class="btn small" style="background:#FC4C02;color:#fff" data-act="stravaon">Collega Strava</button>`}</div></div>`;
}
ACT.stravaon = async () => {
  if(IS_ELECTRON){ toast('Collega Strava dalla versione web (telefono o browser): il collegamento vale anche qui.'); return; }
  const {client_id} = await stravaCall({action:'config'});
  const redirect = location.origin + location.pathname;
  const u = new URL('https://www.strava.com/oauth/mobile/authorize');
  u.search = new URLSearchParams({client_id, redirect_uri:redirect, response_type:'code', approval_prompt:'auto', scope:'read,activity:read_all', state:'los-strava'}).toString();
  location.href = u.toString();
};
ACT.stravaoff = async () => { if(!await ask('Scollegare Strava?','Le sessioni già segnate restano.','Scollega')) return; await stravaCall({action:'disconnect'}); STRAVA.connected=false; render(); toast('Strava scollegato'); };
ACT.stravasync = () => stravaSync(false);
// al ritorno da Strava: ?code=…&state=los-strava
async function stravaHandleRedirect(){
  const q = new URLSearchParams(location.search);
  if(q.get('state')!=='los-strava') return;
  history.replaceState(null,'',location.pathname);
  if(q.get('error')){ toast('Collegamento Strava annullato',{err:true}); return; }
  try{ const r = await stravaCall({action:'exchange', code:q.get('code')}); STRAVA.connected=true; STRAVA.athlete=r.athlete_name; S.view='sport'; S.sportTab='settimana'; toast('Strava collegato'); await stravaSync(true); }
  catch(e){ toast('Strava: '+e.message,{err:true}); }
}
// abbina le attività Strava alle sessioni della settimana visualizzata
async function stravaSync(quiet){
  if(STRAVA.syncing) return; STRAVA.syncing = true; if(!quiet && S.view==='sport') render();
  try{
    const mon = S.sportWeek, end = addDays(mon,7);
    const r = await stravaCall({action:'activities', after:Math.floor(mon.getTime()/1000), before:Math.floor(end.getTime()/1000)});
    let marked=0, added=0;
    for(const a of r.activities||[]){
      if(DB.workouts.some(w=>w.strava_activity_id==a.id)) continue;
      const day = String(a.start_date_local).slice(0,10);
      const open = workoutsOn(day).find(w=>!w.strava_activity_id);
      const mins = Math.round((a.moving_time||0)/60);
      if(open){ await upd('workouts',open.id,{done:true, strava_activity_id:a.id}); marked++; }
      else { await ins('workouts',{date:day, time:String(a.start_date_local).slice(11,16), title:`${a.name} · ${mins}'`, body:`${a.sport_type}${a.distance?` · ${num(a.distance/1000,1)} km`:''} · ${mins} min${a.average_heartrate?` · FC media ${Math.round(a.average_heartrate)}`:''}`, src:'strava', done:true, strava_activity_id:a.id}); added++; }
    }
    if(!quiet || marked || added) toast(marked||added ? `Strava: ${marked} sessioni segnate, ${added} attività aggiunte` : 'Strava: nessuna attività nuova');
  }catch(e){ if(!quiet) toast('Strava: '+e.message,{err:true}); }
  finally{ STRAVA.syncing=false; STRAVA.lastSync=Date.now(); if(S.view==='sport'||S.view==='oggi') render(); }
}
