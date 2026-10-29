/* =====================================================================
   LOS · OBIETTIVI, LIBRI, RISTORANTI, NOTE, IMPOSTAZIONI
   ===================================================================== */

/* ---------------- OBIETTIVI ---------------- */
const isTime = s => /^\d{1,2}:\d{2}(:\d{2})?$/.test(String(s||'').trim());
const gval = s => isTime(s) ? toMin(s) : pnum(s);
// errore = misura − target, solo se entrambi i valori sono numeri (o tempi)
function goalErr(g){
  if(!g.target || !g.current) return null;
  const t = gval(g.target), c = gval(g.current); if(isNaN(t)||isNaN(c)) return null;
  const e = c - t; const ok = g.lower_better ? e<=0 : e>=0;
  const p = g.lower_better ? Math.min(1, t/Math.max(c,1e-9)) : Math.min(1, c/Math.max(t,1e-9));
  let txt;
  if(isTime(g.target)){ const s=Math.round(Math.abs(e)*60); txt=(e>0?'+':'−')+Math.floor(s/60)+':'+String(s%60).padStart(2,'0'); }
  else txt = (e>0?'+':e<0?'−':'')+num(Math.abs(e), Math.abs(e)%1?1:0)+(g.unit?' '+g.unit:'');
  return {txt, ok, p};
}
const goalLine = g => {
  const u = g.unit && !isTime(g.target) ? ' '+esc(g.unit) : '';
  if(g.current && g.target) return `${esc(g.current)}${u} → ${esc(g.target)}${u}`;
  if(g.target) return `target ${esc(g.target)}${u}`;
  if(g.current) return `attuale ${esc(g.current)}${u}`;
  return 'in definizione';
};
VIEWS.obiettivi = function(){
  $('#view').innerHTML = `
  <div class="phead"><span class="eyebrow">Retroazione</span><h1>Obiettivi</h1><span class="muted small" style="max-width:60ch">Ogni obiettivo è un anello di controllo: imposti il target, aggiorni la misura, l'errore ti dice dove correggere. Target e valore attuale sono facoltativi.</span></div>
  <div class="grid-auto">${DB.goals.map(g=>{const e=goalErr(g); const hist=(g.history||[]).map(h=>gval(h.v)).filter(x=>!isNaN(x));
    return `<button class="card tap stack" style="gap:12px;text-align:left" data-act="goal" data-id="${g.id}">
    <div class="row">${g.area?`<span class="pill neutral">${esc(g.area)}</span>`:''}<span class="grow"></span>${ic('edit','style="width:18px;height:18px;color:var(--faint)"')}</div>
    <h3 style="font-size:19px">${esc(g.name)}</h3>
    ${g.target||g.current?`<div class="loop"><div><small>Target</small><b>${esc(g.target||'—')}</b></div><div><small>Misura</small><b>${esc(g.current||'—')}</b></div><div><small>Errore</small><b style="color:${e?(e.ok?'var(--good)':'var(--warn)'):'var(--faint)'}">${e?e.txt:'—'}</b></div></div>`:''}
    ${hist.length>1?`<div style="margin:0 -4px">${lineChart(hist,(g.history||[]).map(h=>fmtDay(pd(h.d))),{color:'var(--accent)',h:110,dec:hist.some(x=>x%1)?1:0})}</div>`:''}
    ${g.notes?`<div class="muted small" style="white-space:pre-wrap">${esc(g.notes)}</div>`:''}
  </button>`}).join('')}
  <button class="card tap empty" data-act="newgoal" style="min-height:160px;box-shadow:none;background:transparent">${ic('plus','style="width:26px;height:26px"')}<b>Nuovo obiettivo</b></button></div>`;
  fab('Obiettivo','var(--accent)','newgoal');
};
ACT.newgoal = () => sheetGoal(null);
ACT.goal = (el,D) => sheetGoal(+D.id);
function sheetGoal(id){
  const g = id ? DB.goals.find(x=>x.id==id) : {area:'',name:'',unit:'',target:'',current:'',lower_better:false,notes:''};
  const areas = ['Dieta','Sport','Finanze','Lavoro','Libri','Personale'];
  openSheet(sheetHead(id?esc(g.name):'Nuovo obiettivo', id?'Aggiorna la misura o modifica':'Solo il nome è obbligatorio','goal'),`
  <form class="stack" id="fGoal" data-id="${id||''}">
    <div class="field"><label for="gName">Nome</label><input class="input" id="gName" required value="${esc(g.name)}" placeholder="Es. Massa grassa, Hyrox sotto 1:10, Risparmio annuo"></div>
    <div class="field"><span class="flabel">Area</span><div class="chips wrapped">${areas.map(a=>`<label class="chip"><input type="radio" name="gArea" value="${a}" ${g.area===a?'checked':''}>${a}</label>`).join('')}</div></div>
    <div class="grid2"><div class="field"><label for="gTarget">Target (facoltativo)</label><input class="input mono" id="gTarget" value="${esc(g.target||'')}" placeholder="Es. 12 o 1:10:00"></div>
      <div class="field"><label for="gCur">Valore attuale (facoltativo)</label><input class="input mono" id="gCur" value="${esc(g.current||'')}" placeholder="—"></div></div>
    <div class="grid2"><div class="field"><label for="gUnit">Unità</label><input class="input" id="gUnit" value="${esc(g.unit||'')}" placeholder="%, kg, €, libri…"></div>
      <div class="field"><span class="flabel">Direzione</span><div class="seg"><button type="button" class="${!g.lower_better?'on':''}" data-act="gdir" data-k="0">↑ di più</button><button type="button" class="${g.lower_better?'on':''}" data-act="gdir" data-k="1">↓ di meno</button></div><input type="hidden" id="gLower" value="${g.lower_better?1:0}"></div></div>
    <div class="field"><label for="gNotes">Note</label><textarea class="input" id="gNotes" placeholder="Perché, come, scadenze, idee…">${esc(g.notes||'')}</textarea></div>
    <button class="btn accent block" type="submit">${id?'Salva':'Crea obiettivo'}</button>
    ${id?`<button class="btn danger block" type="button" data-act="goaldel" data-id="${id}">${ic('trash')}Elimina obiettivo</button>`:''}
  </form>`);
}
ACT.gdir = (el,D) => { $('#gLower').value=D.k; el.parentNode.querySelectorAll('button').forEach(b=>b.classList.toggle('on',b===el)); };
FORM.fGoal = async (f,v) => {
  const area = f.querySelector('input[name=gArea]:checked')?.value || '';
  const row = {name:v('gName'), area, target:v('gTarget'), current:v('gCur'), unit:v('gUnit'), lower_better:v('gLower')==='1', notes:v('gNotes')};
  const id = +f.dataset.id; const old = id ? DB.goals.find(x=>x.id==id) : null;
  const hist = (old?.history||[]).slice();
  if(row.current && row.current !== old?.current){ const d=iso(today()); const i=hist.findIndex(h=>h.d===d); if(i>=0) hist[i].v=row.current; else hist.push({d,v:row.current}); }
  row.history = hist;
  if(id) await upd('goals',id,row); else await ins('goals',row);
  closeSheet(); render(); toast('Obiettivo salvato');
};
ACT.goaldel = async (el,D) => { const g=DB.goals.find(x=>x.id==D.id); if(!await ask('Eliminare l\'obiettivo?',`«${g.name}»`)) return; await del('goals',g.id); closeSheet(); render(); toast('Obiettivo eliminato'); };

/* ---------------- LIBRI ---------------- */
const BST = {in_corso:'In corso', letto:'Letti', sospeso:'Sospesi', wishlist:'Wishlist'};
const BST1 = {in_corso:'In corso', letto:'Letto', sospeso:'Sospeso', wishlist:'Wishlist'};
S.bookTab = 'in_corso';
VIEWS.libri = function(){
  const t = S.bookTab; const list = DB.books.filter(b=>b.status===t);
  const cnt = k => DB.books.filter(b=>b.status===k).length;
  $('#view').innerHTML = `
  <div class="phead compact"><span class="eyebrow">Letture</span><h1>Libri</h1></div>
  <div class="tabs"><div class="seg">${Object.entries(BST).map(([k,l])=>`<button class="${t===k?'on':''}" data-act="bt" data-k="${k}">${l}${cnt(k)?` <span class="faint">${cnt(k)}</span>`:''}</button>`).join('')}</div></div>
  <div class="stack" style="margin-top:6px">${list.length?`<div class="card" style="padding-top:4px;padding-bottom:4px"><div class="list">${list.map(b=>`<div class="li"><button class="row grow" style="gap:12px;text-align:left;min-height:52px" data-act="book" data-id="${b.id}"><div class="ico" style="--c:var(--books);--s:var(--books-soft)">${ic(t==='wishlist'?'heart':'book')}</div><div class="grow"><b>${esc(b.title)}</b>${b.author?`<div class="muted small">${esc(b.author)}</div>`:''}</div></button>${delBtn('bookdel',`data-id="${b.id}"`)}</div>`).join('')}</div></div>`
    :`<div class="empty">${ic(t==='wishlist'?'heart':'book','style="width:28px;height:28px"')}<span class="small">${t==='wishlist'?'Annota qui i libri che vorresti leggere.':'Nessun libro in questa lista.'}</span></div>`}</div>`;
  fab(t==='wishlist'?'Desiderio':'Libro','var(--books)','newbook');
};
ACT.bt = (el,D) => { S.bookTab=D.k; render(); scrollTo({top:0}); };
ACT.newbook = () => sheetBook(null);
ACT.book = (el,D) => sheetBook(+D.id);
function sheetBook(id){
  const b = id ? DB.books.find(x=>x.id==id) : {title:'',author:'',status:S.bookTab};
  openSheet(sheetHead(id?esc(b.title):'Nuovo libro','','book','var(--books)','var(--books-soft)'),`
  <form class="stack" id="fBook" data-id="${id||''}">
    <div class="field"><label for="bkT">Titolo</label><input class="input" id="bkT" required value="${esc(b.title)}"></div>
    <div class="field"><label for="bkA">Autore (facoltativo)</label><input class="input" id="bkA" value="${esc(b.author||'')}"></div>
    <div class="field"><span class="flabel">Stato</span><div class="seg">${Object.entries(BST1).map(([k,l])=>`<button type="button" class="${b.status===k?'on':''}" data-act="bkst" data-k="${k}">${l}</button>`).join('')}</div><input type="hidden" id="bkS" value="${b.status}"></div>
    <button class="btn block" style="background:var(--books);color:#fff" type="submit">Salva</button>
    ${id?`<button class="btn danger block" type="button" data-act="bookdel" data-id="${id}">${ic('trash')}Elimina libro</button>`:''}
  </form>`);
}
ACT.bkst = (el,D) => { $('#bkS').value=D.k; el.parentNode.querySelectorAll('button').forEach(b=>b.classList.toggle('on',b===el)); };
FORM.fBook = async (f,v) => {
  const row = {title:v('bkT'), author:v('bkA'), status:v('bkS')};
  if(f.dataset.id) await upd('books',+f.dataset.id,row); else await ins('books',row);
  S.bookTab = row.status; closeSheet(); render(); toast('Libro salvato');
};
ACT.bookdel = async (el,D) => { const b=DB.books.find(x=>x.id==D.id); if(!await ask('Eliminare il libro?',`«${b.title}»`)) return; await del('books',b.id); if(sheetOpen) closeSheet(); render(); };

/* ---------------- RISTORANTI ---------------- */
VIEWS.ristoranti = function(){
  const list = DB.restos.slice().sort((a,b)=>(a.status===b.status?0:a.status==='da provare'?-1:1) || b.vote-a.vote);
  $('#view').innerHTML = `
  <div class="phead compact"><span class="eyebrow">Dove mangiare</span><h1>Ristoranti</h1></div>
  ${list.length?`<div class="grid-auto">${list.map(r=>`<button class="catcard tap" data-act="resto" data-id="${r.id}"><div class="row"><div class="ico" style="--c:var(--fin);--s:var(--fin-soft)">${ic('pin')}</div><div class="grow"><b>${esc(r.name)}</b><div class="muted small">${esc(r.city)}</div></div><span class="pill ${r.status==='provato'?'good':'neutral'}">${r.status}</span></div>${r.vote?`<div style="color:var(--fin);letter-spacing:2px">${'★'.repeat(r.vote)}<span style="color:var(--line)">${'★'.repeat(5-r.vote)}</span></div>`:''}${r.note?`<div class="muted small">${esc(r.note)}</div>`:''}</button>`).join('')}</div>`
    :`<div class="empty">${ic('pin','style="width:28px;height:28px"')}<span class="small">Nessun ristorante: aggiungi quelli provati e quelli da provare.</span></div>`}`;
  fab('Ristorante','var(--fin)','newresto');
};
ACT.newresto = () => sheetResto(null);
ACT.resto = (el,D) => sheetResto(+D.id);
function sheetResto(id){
  const r = id ? DB.restos.find(x=>x.id==id) : {name:'',city:'',status:'da provare',vote:0,note:''};
  openSheet(sheetHead(id?esc(r.name):'Nuovo ristorante','','pin','var(--fin)','var(--fin-soft)'),`
  <form class="stack" id="fResto" data-id="${id||''}">
    <div class="field"><label for="rsN">Nome</label><input class="input" id="rsN" required value="${esc(r.name)}"></div>
    <div class="field"><label for="rsC">Città</label><input class="input" id="rsC" value="${esc(r.city||'')}"></div>
    <div class="field"><span class="flabel">Stato</span><div class="seg"><button type="button" class="${r.status==='da provare'?'on':''}" data-act="rsst" data-k="da provare">Da provare</button><button type="button" class="${r.status==='provato'?'on':''}" data-act="rsst" data-k="provato">Provato</button></div><input type="hidden" id="rsS" value="${r.status}"></div>
    <div class="field"><span class="flabel">Voto</span><div class="stars">${[1,2,3,4,5].map(i=>`<button type="button" class="${i<=r.vote?'on':''}" data-act="rsv" data-k="${i}" aria-label="${i} stelle">★</button>`).join('')}</div><input type="hidden" id="rsV" value="${r.vote}"></div>
    <div class="field"><label for="rsNo">Nota</label><textarea class="input" id="rsNo" placeholder="Cosa ordinare, prezzo, con chi…">${esc(r.note||'')}</textarea></div>
    <button class="btn block" style="background:var(--fin);color:#fff" type="submit">Salva</button>
    ${id?`<button class="btn danger block" type="button" data-act="restodel" data-id="${id}">${ic('trash')}Elimina ristorante</button>`:''}
  </form>`);
}
ACT.rsst = (el,D) => { $('#rsS').value=D.k; el.parentNode.querySelectorAll('button').forEach(b=>b.classList.toggle('on',b===el)); };
ACT.rsv = (el,D) => { const k = +$('#rsV').value===+D.k ? 0 : +D.k; $('#rsV').value=k; el.parentNode.querySelectorAll('button').forEach((b,i)=>b.classList.toggle('on',i<k)); };
FORM.fResto = async (f,v) => {
  const row = {name:v('rsN'), city:v('rsC'), status:v('rsS'), vote:+v('rsV')||0, note:v('rsNo')};
  if(f.dataset.id) await upd('restos',+f.dataset.id,row); else await ins('restos',row);
  closeSheet(); render(); toast('Salvato');
};
ACT.restodel = async (el,D) => { const r=DB.restos.find(x=>x.id==D.id); if(!await ask('Eliminare il ristorante?',`«${r.name}»`)) return; await del('restos',r.id); closeSheet(); render(); };

/* ---------------- NOTE ---------------- */
VIEWS.note = function(){
  const list = DB.notes.slice().sort((a,b)=>String(b.updated_at).localeCompare(String(a.updated_at)));
  $('#view').innerHTML = `
  <div class="phead compact"><span class="eyebrow">Appunti</span><h1>Note varie</h1></div>
  ${list.length?`<div class="grid-auto">${list.map(n=>`<button class="card tap" style="text-align:left" data-act="note" data-id="${n.id}"><div class="row"><b class="grow">${esc(n.title)}</b><span class="faint" style="font-size:12px">${fmtDay(new Date(n.updated_at))}</span></div><p class="muted" style="margin:6px 0 0;font-size:14px;white-space:pre-wrap;display:-webkit-box;-webkit-line-clamp:5;-webkit-box-orient:vertical;overflow:hidden">${esc(n.body)}</p></button>`).join('')}</div>`
    :`<div class="empty">${ic('note','style="width:28px;height:28px"')}<span class="small">Nessuna nota.</span></div>`}`;
  fab('Nota','var(--ink)','newnote');
};
ACT.newnote = () => sheetNote(null);
ACT.note = (el,D) => sheetNote(+D.id);
function sheetNote(id){
  const n = id ? DB.notes.find(x=>x.id==id) : {title:'',body:''};
  openSheet(sheetHead(id?'Nota':'Nuova nota','','note'),`
  <form class="stack" id="fNote" data-id="${id||''}">
    <div class="field"><label for="nT">Titolo</label><input class="input" id="nT" required value="${esc(n.title)}"></div>
    <div class="field"><label for="nB">Testo</label><textarea class="input" id="nB" style="min-height:240px">${esc(n.body||'')}</textarea></div>
    <button class="btn accent block" type="submit">Salva</button>
    ${id?`<button class="btn danger block" type="button" data-act="notedel" data-id="${id}">${ic('trash')}Elimina nota</button>`:''}
  </form>`);
}
FORM.fNote = async (f,v) => {
  const row = {title:v('nT'), body:$('#nB').value, updated_at:new Date().toISOString()};
  if(f.dataset.id) await upd('notes',+f.dataset.id,row); else await ins('notes',row);
  closeSheet(); render(); toast('Nota salvata');
};
ACT.notedel = async (el,D) => { const n=DB.notes.find(x=>x.id==D.id); if(!await ask('Eliminare la nota?',`«${n.title}»`)) return; await del('notes',n.id); closeSheet(); render(); };

/* ---------------- IMPOSTAZIONI ---------------- */
VIEWS.impostazioni = function(){
  const th = document.documentElement.dataset.theme || 'auto';
  $('#view').innerHTML = `
  <div class="phead compact"><span class="eyebrow">Sistema</span><h1>Impostazioni</h1></div>
  <div class="cols"><div class="stack">
    <div class="card"><div class="eyebrow">Account</div><div class="list">
      <div class="li"><div class="ico" style="--c:var(--accent);--s:var(--accent-soft)">${ic('goal')}</div><div class="grow"><b>${esc(DB.user?.email||'')}</b><div class="muted small">Sessione salvata su questo dispositivo</div></div><span class="pill good">connesso</span></div>
      <div class="li"><div class="ico">${ic('link')}</div><div class="grow"><b>Supabase · ExpensesTracker</b><div class="muted small">Ogni riga è leggibile solo dal tuo utente (RLS)</div></div></div>
      <div class="li"><div class="ico" style="--c:#FC4C02">${ic('link')}</div><div class="grow"><b>Strava</b><div class="muted small">${STRAVA.connected?'collegato'+(STRAVA.athlete?' · '+esc(STRAVA.athlete):''):'non collegato'}</div></div><button class="btn small ghost" data-act="${STRAVA.connected?'stravaoff':'stravaon'}">${STRAVA.connected?'Scollega':'Collega'}</button></div>
      <button class="li" data-act="logout" style="color:var(--bad)"><div class="ico" style="--c:var(--bad)">${ic('logout')}</div><b class="grow">Esci</b></button></div></div>
    <div class="card"><div class="eyebrow" style="margin-bottom:8px">Tema</div><div class="seg">${[['auto','Automatico'],['light','Chiaro'],['dark','Scuro']].map(([k,l])=>`<button class="${th===k?'on':''}" data-act="theme" data-k="${k}">${l}</button>`).join('')}</div></div>
  </div><div class="stack">
    ${!IS_ELECTRON&&!isStandalone()?`<div class="card"><div class="eyebrow">App sul telefono</div><p class="muted small" style="margin:8px 0 10px">${isIOS()?'In Safari tocca Condividi → «Aggiungi alla schermata Home».':deferredPrompt?'Installa LOS: icona nella Home e apertura a schermo intero.':'Apri questa pagina con Chrome sul telefono: comparirà «Installa app» (o menu ⋮ → «Aggiungi a schermata Home»).'}</p>${deferredPrompt?'<button class="btn small accent" data-act="install">Installa</button>':''}</div>`:''}
    <div class="card"><div class="eyebrow">Come funziona la protezione</div><p style="font-size:14px;margin:8px 0 0" class="muted">L'app è statica su GitHub Pages: il codice è pubblico, i dati no. Chi apre il link vede solo l'accesso; su Supabase ogni riga è leggibile solo dal tuo utente autenticato.</p></div>
    <div class="card"><div class="eyebrow">Dati</div><p class="muted small" style="margin:8px 0 10px">${DB.tx.length} movimenti · ${DB.projects.length} progetti · ${DB.workouts.length} allenamenti · ${DB.dishes.length} piatti. Versione ${LOS_CONFIG.VERSION}${IS_ELECTRON?' · desktop':''}.</p><button class="btn small ghost" data-act="refresh">${ic('refresh')}Ricarica da Supabase</button></div>
  </div></div>`;
  fab(null);
};
ACT.theme = (el,D) => { const r=document.documentElement; if(D.k==='auto'){ delete r.dataset.theme; try{localStorage.removeItem('los-theme')}catch(e){} } else { r.dataset.theme=D.k; try{localStorage.setItem('los-theme',D.k)}catch(e){} } render(); };
ACT.logout = async () => { if(!await ask('Uscire da LOS?','Su questo dispositivo dovrai accedere di nuovo.','Esci')) return; await sb.auth.signOut(); location.reload(); };
