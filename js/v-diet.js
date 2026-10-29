/* =====================================================================
   LOS · vista DIETA (oggi, settimana tipo, piatti, misure)
   ===================================================================== */
S.dietTab = 'oggi'; S.bodyMetric = 'fat_pct';
VIEWS.dieta = function(){
  const t=S.dietTab;
  $('#view').innerHTML = `
  <div class="phead compact"><span class="eyebrow">Piano alimentare · misure TANITA</span><h1>Dieta</h1></div>
  <div class="tabs"><div class="seg">${[['oggi','Oggi'],['settimana','Settimana'],['piatti','Piatti'],['misure','Misure']].map(([k,l])=>`<button class="${t===k?'on':''}" data-act="dt" data-k="${k}">${l}</button>`).join('')}</div></div>
  <div id="dietBody" class="stack"></div>`;
  ({oggi:dOggi,settimana:dSettimana,piatti:dPiatti,misure:dMisure})[t]();
  fab(t==='misure'?'Controllo':t==='piatti'?'Piatto':null,'var(--diet)',t==='misure'?'newbody':'newdish');
};
ACT.dt = (el,D) => { S.dietTab=D.k; render(); scrollTo({top:0}); };

function dOggi(){
  const d=S.day;
  $('#dietBody').innerHTML = `
    <div class="row" style="justify-content:space-between"><button class="iconbtn solid" data-act="dd" data-n="-1" aria-label="Giorno precedente">${ic('left')}</button><button data-act="ddtoday" style="min-height:44px"><b>${DOWL[d.getDay()]} ${fmtDay(d)}</b>${sameDay(d,today())?'':'<div class="link small" style="min-height:0;justify-content:center">torna a oggi</div>'}</button><button class="iconbtn solid" data-act="dd" data-n="1" aria-label="Giorno successivo">${ic('right')}</button></div>
    ${trainingOn(d)?'<div class="hint">Giorno di allenamento: spuntino del pomeriggio pre-workout.</div>':''}
    <div class="grid-auto">${MEALS.map(m=>{const dish=mealFor(d,m.k); return dish?`<button class="catcard tap" data-act="meal" data-meal="${m.k}" style="${dish.free?'background:var(--fin-soft)':''}"><div class="row"><div class="ico" style="--c:var(--diet);--s:var(--diet-soft)">${ic(m.icon)}</div><div class="grow"><div class="eyebrow">${m.label} · ${m.time}</div><b>${esc(dish.name)}</b></div>${ic('right','style="width:18px;height:18px;color:var(--faint)"')}</div>${(dish.items||[]).slice(0,4).map(it=>`<div class="food"><span>${esc(it[0])}</span><span class="g">${esc(it[1])}</span></div>`).join('')}</button>`
      :`<button class="catcard" data-act="meal" data-meal="${m.k}" style="box-shadow:none;border:1.5px dashed var(--line);background:transparent"><div class="row"><div class="ico">${ic(m.icon)}</div><div class="grow"><div class="eyebrow">${m.label}</div><span class="muted">Non previsto oggi</span></div></div></button>`}).join('')}</div>
    <div class="card flat"><div class="row"><div class="ico" style="--c:var(--accent);--s:var(--accent-soft)">${ic('bolt')}</div><div class="grow"><b>Acqua: almeno 2,5 L</b><div class="muted small">esclusa quella bevuta ai pasti</div></div></div></div>`;
}
ACT.dd = (el,D) => { S.day=addDays(S.day,+D.n); render(); };
ACT.ddtoday = () => { S.day=today(); render(); };

/* --- proposta del pasto (sheet) --- */
ACT.meal = (el,D) => sheetMeal(D.meal);
function sheetMeal(meal){
  const draw = () => {
    const m = MEALS.find(x=>x.k===meal), dish = mealFor(S.day,meal);
    const opts = dishesOf(meal);
    openSheet(sheetHead(m.label,`${DOWL[S.day.getDay()]} ${fmtDay(S.day)} · ${m.time}`,m.icon,'var(--diet)','var(--diet-soft)'),`
    <div class="stack">
      ${dish?`<div class="card" style="border-left:4px solid ${dish.free?'var(--fin)':'var(--diet)'}">
        <div class="eyebrow">Proposta di oggi</div>
        <h3 style="font-size:24px;margin:4px 0 10px">${esc(dish.name)}</h3>
        ${(dish.items||[]).map(it=>`<div class="food"><span>${esc(it[0])}</span><span class="g">${esc(it[1])}</span></div>`).join('')}
      </div>`:'<div class="empty">Nessun piatto previsto per questo pasto oggi.</div>'}
      ${meal==='spuntino2'&&trainingOn(S.day)?'<div class="hint">Giorno di allenamento: spuntino pre-workout, banana 30 minuti prima.</div>':''}
      ${opts.length>1?`<button class="btn accent block" data-act="shuffle" data-meal="${meal}">${ic('shuffle')}Proponimi un'alternativa</button>`:''}
      <div class="eyebrow" style="margin-top:6px">Oppure scegli tu</div>
      <div class="card" style="padding-top:4px;padding-bottom:4px"><div class="list">${opts.map(o=>`<button class="li" data-act="pickmeal" data-meal="${meal}" data-id="${o.id}"><span class="grow" style="font-weight:${o.id===dish?.id?800:500}">${esc(o.name)}</span>${o.tag?`<span class="pill neutral">${esc(o.tag)}</span>`:''}${o.id===dish?.id?`<span class="pill good">oggi</span>`:''}</button>`).join('')}
        ${meal==='spuntino1'?`<button class="li" data-act="pickmeal" data-meal="${meal}" data-id=""><span class="grow muted">Salta questo pasto</span></button>`:''}</div></div>
    </div>`, draw);
  };
  draw();
}
ACT.shuffle = async (el,D) => {
  const cur = mealFor(S.day,D.meal);
  const pool = dishesOf(D.meal).filter(x=>x.id!==cur?.id && !x.free && !(D.meal==='spuntino2'&&x.train&&!trainingOn(S.day)));
  if(!pool.length) return;
  const pick = pool[Math.floor(Math.random()*pool.length)];
  await setOverride(iso(S.day), D.meal, pick.id); refresh(); toast('Nuova proposta: '+pick.name);
};
ACT.pickmeal = async (el,D) => { await setOverride(iso(S.day), D.meal, D.id?+D.id:null); refresh(); };

/* --- settimana tipo --- */
function dSettimana(){
  const days=[1,2,3,4,5,6,0];
  const count={}; days.forEach(d=>['pranzo','cena'].forEach(m=>{const ds=weekDish(d,m); if(ds?.tag) count[ds.tag]=(count[ds.tag]||0)+1;}));
  const cell = (d,m) => { const ds=weekDish(d,m.k); return `<button class="cell ${!ds?'no':ds.free?'free':''}" data-act="wmcell" data-d="${d}" data-meal="${m.k}">${isDesktop()?'':`<small>${m.label.replace('Spuntino ','Sp. ')}</small>`}<span>${ds?esc(ds.name):'—'}</span></button>`; };
  $('#dietBody').innerHTML = `
    <div class="muted small">La dashboard propone ogni giorno un solo piatto per pasto seguendo questa rotazione. Tocca un pasto per cambiarlo.</div>
    ${isDesktop()?`<div class="card" style="overflow-x:auto"><div class="mealgrid"><div></div>${days.map(d=>`<div class="hd">${DOW[d]}</div>`).join('')}
      ${MEALS.map(m=>`<div class="hd" style="align-self:center">${m.label.replace('Spuntino ','Sp. ')}</div>${days.map(d=>cell(d,m)).join('')}`).join('')}</div></div>`
    : days.map(d=>`<div class="acc wmday ${d===today().getDay()?'open':''}"><button data-act="acc-t"><div class="ico" style="--c:var(--diet);--s:var(--diet-soft);font-weight:800;font-size:13px">${DOW[d]}</div><div class="grow"><b>${DOWL[d]}</b><div class="muted small">${esc(weekDish(d,'pranzo')?.name||'—')} · ${esc(weekDish(d,'cena')?.name||'—')}</div></div><span class="chev">${ic('chev','style="width:18px;height:18px"')}</span></button><div class="in stack" style="gap:6px">${MEALS.map(m=>cell(d,m)).join('')}</div></div>`).join('')}
    <div class="card"><div class="eyebrow">Regole settimanali del piano (pranzi e cene)</div>
      ${RULES.map(r=>{const n=count[r.tag]||0; const ok=n>=r.min&&n<=r.max; return `<div class="rule"><span class="pill ${ok?'good':'warn'}">${ok?'ok':'da sistemare'}</span><span class="grow">${r.label}</span><span class="mono muted">${n} ${r.max<9?`/ ${r.min===r.max?r.max:'max '+r.max}`:`(min ${r.min})`}</span></div>`}).join('')}</div>`;
}
ACT.wmcell = (el,D) => {
  const d=+D.d, meal=D.meal;
  openSheet(sheetHead(`${DOWL[d]} · ${MEALS.find(m=>m.k===meal).label}`,'Piatto della settimana tipo','plate','var(--diet)','var(--diet-soft)'),
  `<div class="card" style="padding-top:4px;padding-bottom:4px"><div class="list"><button class="li" data-act="wmset" data-d="${d}" data-meal="${meal}" data-id=""><span class="grow muted">Nessuno</span></button>${dishesOf(meal).map(o=>`<button class="li" data-act="wmset" data-d="${d}" data-meal="${meal}" data-id="${o.id}"><span class="grow" style="font-weight:${weekDish(d,meal)?.id===o.id?800:500}">${esc(o.name)}</span>${o.tag?`<span class="pill neutral">${esc(o.tag)}</span>`:''}</button>`).join('')}</div></div>`);
};
ACT.wmset = async (el,D) => { await setWeekMenu(+D.d, D.meal, D.id?+D.id:null); closeSheet(); render(); };

/* --- piatti --- */
function dPiatti(){
  $('#dietBody').innerHTML = `<div class="muted small">I piatti pronti da cui pesca la dashboard. Li imposti una volta; se cambia il piano li aggiorni qui. Tocca un piatto per modificarlo.</div>
  ${MEALS.map((m,i)=>`<div class="acc ${i===4?'open':''}"><button data-act="acc-t"><div class="ico" style="--c:var(--diet);--s:var(--diet-soft)">${ic(m.icon)}</div><div class="grow"><b>${m.label}</b><div class="muted small">${dishesOf(m.k).length} piatti</div></div><span class="chev">${ic('chev','style="width:18px;height:18px"')}</span></button><div class="in stack" style="gap:10px">${dishesOf(m.k).map(ds=>`<div class="card flat" style="padding:12px 12px 8px"><div class="row"><button class="grow" style="text-align:left;min-height:40px" data-act="dishedit" data-id="${ds.id}"><b>${esc(ds.name)}</b></button>${ds.tag?`<span class="pill neutral">${esc(ds.tag)}</span>`:''}${delBtn('dishdel',`data-id="${ds.id}"`,'Elimina piatto')}</div>${(ds.items||[]).map(it=>`<div class="food"><span>${esc(it[0])}</span><span class="g">${esc(it[1])}</span></div>`).join('')}</div>`).join('')||'<div class="muted small">Nessun piatto</div>'}</div></div>`).join('')}`;
}
ACT.newdish = () => sheetDish(null);
ACT.dishedit = (el,D) => sheetDish(+D.id);
function sheetDish(id){
  const d = id ? dishById(id) : {meal:'pranzo', name:'', tag:'', items:[], free:false, train:false};
  openSheet(sheetHead(id?'Modifica piatto':'Nuovo piatto','','plate','var(--diet)','var(--diet-soft)'),`
  <form class="stack" id="fDish" data-id="${id||''}">
    <div class="field"><label for="dMeal">Pasto</label><select class="input" id="dMeal">${MEALS.map(m=>`<option value="${m.k}" ${d.meal===m.k?'selected':''}>${m.label}</option>`).join('')}</select></div>
    <div class="field"><label for="dName">Nome</label><input class="input" id="dName" required value="${esc(d.name)}" placeholder="Es. Orata al forno con patate"></div>
    <div class="field"><label for="dTag">Gruppo proteico (per le regole settimanali)</label><select class="input" id="dTag"><option value="">—</option>${PROT.map(t=>`<option ${d.tag===t?'selected':''}>${t}</option>`).join('')}</select></div>
    <div class="field"><label for="dItems">Alimenti e grammature (uno per riga: alimento ; quantità)</label><textarea class="input" id="dItems" placeholder="Orata ; 200-250 g&#10;Patate ; 400 g&#10;Olio EVO ; 16 g">${esc((d.items||[]).map(i=>i[0]+(i[1]?' ; '+i[1]:'')).join('\n'))}</textarea></div>
    <label class="chip" style="align-self:flex-start"><input type="checkbox" id="dFree" ${d.free?'checked':''}>Pasto libero</label>
    <label class="chip" style="align-self:flex-start"><input type="checkbox" id="dTrain" ${d.train?'checked':''}>Pre-allenamento (spuntino nei giorni di allenamento)</label>
    <button class="btn block" style="background:var(--diet);color:#fff" type="submit">${id?'Salva modifiche':'Aggiungi piatto'}</button>
    ${id?`<button class="btn danger block" type="button" data-act="dishdel" data-id="${id}">${ic('trash')}Elimina piatto</button>`:''}
  </form>`);
}
FORM.fDish = async (f,v) => {
  const items = v('dItems').split('\n').map(l=>l.trim()).filter(Boolean).map(l=>{ const [a,...b]=l.split(';'); return [a.trim(), b.join(';').trim()]; });
  const row = {meal:v('dMeal'), name:v('dName'), tag:v('dTag'), items: items.length?items:[[v('dName'),'']], free:$('#dFree').checked, train:$('#dTrain').checked};
  if(f.dataset.id) await upd('dishes',+f.dataset.id,row); else await ins('dishes',{...row, position:dishesOf(row.meal).length});
  closeSheet(); render(); toast(f.dataset.id?'Piatto aggiornato':'Piatto aggiunto');
};
ACT.dishdel = async (el,D) => {
  const ds = dishById(+D.id);
  const used = DB.weekmenu.filter(w=>w.dish_id==ds.id).length;
  if(!await ask('Eliminare il piatto?', `«${ds.name}»${used?` è nella settimana tipo in ${used} pasti: quei pasti resteranno vuoti finché non scegli un altro piatto.`:''}`)) return;
  await del('dishes',ds.id);
  DB.weekmenu.forEach(w=>{ if(w.dish_id==ds.id) w.dish_id=null; }); DB.overrides = DB.overrides.filter(o=>o.dish_id!=ds.id);
  if(sheetOpen) closeSheet(); render(); toast('Piatto eliminato');
};

/* --- misure --- */
const METR = {weight:['Peso','kg'],fat_pct:['Massa grassa','%'],fat_kg:['Massa grassa','kg'],lean_kg:['Massa magra','kg'],muscle_kg:['Massa muscolare','kg']};
function dMisure(){
  const B = DB.body; const k=S.bodyMetric, L=B[B.length-1], P=B[B.length-2];
  const delta=(a,b,inv)=>{ if(a==null||b==null) return ''; const x=a-b; const good=inv?x<0:x>0; return `<span class="pill ${Math.abs(x)<.05?'neutral':good?'good':'bad'}">${x>0?'+':x<0?'−':''}${num(Math.abs(x))}</span>`};
  const pts = B.filter(b=>b[k]!=null);
  const fatGoal = DB.goals.find(g=>/grass/i.test(g.name) && !isNaN(pnum(g.target)));
  $('#dietBody').innerHTML = `
    <div class="drop" id="dropB"><div>${ic('upload')}</div><b>Importa il PDF del nutrizionista</b><span class="muted small">Leggo date, peso, massa grassa, magra e muscolare dal report «Elenco andamenti». Ti mostro i controlli nuovi prima di salvarli.</span><label class="btn small" style="background:var(--diet);color:#fff;margin-top:4px">Scegli PDF<input type="file" id="bodyFile" accept=".pdf" hidden></label></div>
    <div id="bodyParse"></div>
    ${L?`<div class="grid3">
      <div class="kpi"><span class="eyebrow">Peso</span><span class="v mono" style="font-size:20px">${num(L.weight)}<small style="font-size:12px"> kg</small></span>${delta(L.weight,P?.weight,true)}</div>
      <div class="kpi"><span class="eyebrow">Grasso</span><span class="v mono" style="font-size:20px">${num(L.fat_pct)}<small style="font-size:12px">%</small></span>${delta(L.fat_pct,P?.fat_pct,true)}</div>
      <div class="kpi"><span class="eyebrow">Magra</span><span class="v mono" style="font-size:20px">${num(L.lean_kg)}<small style="font-size:12px"> kg</small></span>${delta(L.lean_kg,P?.lean_kg,false)}</div>
    </div>
    <div class="faint" style="font-size:12px">Ultimo controllo ${fmtDay(pd(L.date))} ${L.date.slice(0,4)}${P?', confronto con il precedente':''}.</div>
    <div class="card"><div class="chips">${Object.entries(METR).map(([kk,v])=>`<button class="chip ${k===kk?'on':''}" data-act="bm" data-k="${kk}">${v[0]} ${v[1]}</button>`).join('')}</div>
      <div style="margin-top:12px">${lineChart(pts.map(b=>b[k]),pts.map(b=>MON[pd(b.date).getMonth()]+' '+b.date.slice(2,4)),{color:'var(--diet)',unit:METR[k][1]==='%'?'%':' kg',target:k==='fat_pct'&&fatGoal?pnum(fatGoal.target):null})}</div></div>
    <div class="card"><div class="table-wrap"><table class="t"><thead><tr><th>Data</th><th class="r">Peso</th><th class="r">MG %</th><th class="r">MG kg</th><th class="r">Magra</th><th class="r">Musc.</th><th></th></tr></thead><tbody>${B.slice().reverse().map(b=>`<tr><td>${b.date.split('-').reverse().join('/')}</td><td class="r">${b.weight!=null?num(b.weight):'—'}</td><td class="r">${b.fat_pct!=null?num(b.fat_pct):'—'}</td><td class="r">${b.fat_kg!=null?num(b.fat_kg):'—'}</td><td class="r">${b.lean_kg!=null?num(b.lean_kg):'—'}</td><td class="r">${b.muscle_kg!=null?num(b.muscle_kg):'—'}</td><td>${delBtn('bodydel',`data-id="${b.id}"`)}</td></tr>`).join('')}</tbody></table></div></div>`
    :'<div class="empty">Nessun controllo registrato</div>'}`;
  $('#bodyFile').addEventListener('change', async e=>{ const f=e.target.files[0]; if(!f) return;
    $('#bodyParse').innerHTML=`<div class="card stack" style="gap:10px"><b>Lettura di «${esc(f.name)}»…</b><div class="scan"><span></span></div></div>`;
    try{
      const rows = await parseBodyPdf(f);
      if(!rows.length) throw new Error('Nessun valore riconosciuto: il formato del report potrebbe essere cambiato.');
      const known = new Set(DB.body.map(b=>b.date));
      const fresh = rows.filter(r=>!known.has(r.date));
      window._bodyFresh = fresh;
      $('#bodyParse').innerHTML=`<div class="card stack" style="gap:8px;border:2px solid var(--good)"><div class="row"><span class="pill good">${rows.length} controlli riconosciuti</span><span class="grow"></span></div>
        ${fresh.length?`<div class="muted small">Nuovi da salvare:</div>${fresh.map(r=>`<div class="row small mono" style="flex-wrap:wrap;gap:12px"><b style="font-family:var(--f-body)">${r.date.split('-').reverse().join('/')}</b><span>peso ${r.weight!=null?num(r.weight):'—'}</span><span>MG ${r.fat_pct!=null?num(r.fat_pct)+'%':'—'}</span><span>magra ${r.lean_kg!=null?num(r.lean_kg):'—'}</span></div>`).join('')}
          <div class="row"><button class="btn small grow" style="background:var(--diet);color:#fff" data-act="bodysave">Salva ${fresh.length} controll${fresh.length>1?'i':'o'}</button><button class="btn small ghost" data-act="clearbp">Annulla</button></div>`
        :`<div class="muted small">Tutti già presenti: nessun dato nuovo.</div><button class="btn small ghost" data-act="clearbp">Ok</button>`}</div>`;
    }catch(err){ $('#bodyParse').innerHTML=`<div class="card" style="border:2px solid var(--bad)"><b>Lettura non riuscita</b><div class="muted small">${esc(err.message)} Puoi inserire i valori a mano con il pulsante «Controllo».</div><button class="btn small ghost" style="margin-top:8px" data-act="clearbp">Ok</button></div>`; }
  });
}
ACT.bm = (el,D) => { S.bodyMetric=D.k; render(); };
ACT.clearbp = () => { $('#bodyParse').innerHTML=''; };
ACT.bodysave = async () => { for(const r of window._bodyFresh||[]){ const x = await ins('body', r); ['weight','fat_kg','fat_pct','lean_kg','muscle_kg'].forEach(f=>x[f]=x[f]==null?null:Number(x[f])); } DB.body.sort((a,b)=>a.date.localeCompare(b.date)); render(); toast('Controlli salvati'); };
ACT.bodydel = async (el,D) => { const b=DB.body.find(x=>x.id==D.id); if(!await ask('Eliminare il controllo?',`del ${b.date.split('-').reverse().join('/')}`)) return; await del('body',b.id); render(); };
ACT.newbody = () => openSheet(sheetHead('Nuovo controllo','Inserimento manuale','diet','var(--diet)','var(--diet-soft)'),`
  <form class="stack" id="fBody">
    <div class="field"><label for="bD">Data</label><input class="input" id="bD" type="date" value="${iso(today())}" required></div>
    <div class="grid2"><div class="field"><label for="bP">Peso kg</label><input class="input mono" id="bP" inputmode="decimal" required></div><div class="field"><label for="bG">Massa grassa %</label><input class="input mono" id="bG" inputmode="decimal"></div></div>
    <div class="grid2"><div class="field"><label for="bM">Massa magra kg</label><input class="input mono" id="bM" inputmode="decimal"></div><div class="field"><label for="bU">Massa muscolare kg</label><input class="input mono" id="bU" inputmode="decimal"></div></div>
    <button class="btn block" style="background:var(--diet);color:#fff" type="submit">Salva</button>
  </form>`);
FORM.fBody = async (f,v) => {
  const n = id => { const x=pnum(v(id)); return isNaN(x)?null:x; };
  const P=n('bP'), G=n('bG');
  if(DB.body.some(b=>b.date===v('bD'))){ toast('Esiste già un controllo in questa data'); return; }
  const x = await ins('body',{date:v('bD'), weight:P, fat_pct:G, fat_kg: P!=null&&G!=null?+(P*G/100).toFixed(1):null, lean_kg:n('bM'), muscle_kg:n('bU')});
  ['weight','fat_kg','fat_pct','lean_kg','muscle_kg'].forEach(f=>x[f]=x[f]==null?null:Number(x[f]));
  DB.body.sort((a,b)=>a.date.localeCompare(b.date)); closeSheet(); render(); toast('Controllo salvato');
};
