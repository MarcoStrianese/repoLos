/* =====================================================================
   LOS · vista LAVORO
   ===================================================================== */
S.workFilter = 'tutti';
VIEWS.lavoro = function(){
  const f = S.workFilter;
  const list = DB.projects.filter(p=>f==='tutti'||p.type===f);
  const group = st => list.filter(p=>p.status===st).sort((a,b)=>b.prio-a.prio || TW[b.type]-TW[a.type]);
  const card = p => {
    const tds = projTodos(p.id); const dn = tds.filter(t=>t.done).length, tot=tds.length;
    const next = tds.find(t=>!t.done);
    return `<button class="proj tap type-${p.type}" data-act="proj" data-id="${p.id}">
      <div class="top"><div class="ico">${ic(p.type==='azienda'?'work':p.type==='interno'?'bolt':'goal')}</div>
        <div class="grow"><h3>${esc(p.name)}</h3><div class="muted small">${esc(p.client||TYPE[p.type])}</div></div>
        <span class="prio" title="Priorità">${[1,2,3].map(i=>`<i class="${i<=p.prio?'on':''}"></i>`).join('')}</span></div>
      ${p.status==='standby'?`<div class="standby-note">${ic('pause','style="width:16px;height:16px;flex:none"')}<span>In attesa di ${esc(p.waiting||'…')}${p.since?` · da ${daysBetween(pd(p.since),today())} gg`:''}</span></div>`:''}
      ${next&&p.status==='attivo'?`<div class="small"><span class="muted">Prossimo:</span> ${esc(next.text)}</div>`:''}
      <div class="row"><div class="bar grow"><span style="width:${tot?dn/tot*100:0}%"></span></div><span class="mono muted" style="font-size:12px">${dn}/${tot}</span></div>
    </button>`;
  };
  const sec = (t,st,note) => { const g=group(st); if(!g.length) return ''; return `<div class="section-h"><h2>${t} <span class="faint" style="font-size:15px">${g.length}</span></h2>${note||''}</div><div class="grid-auto">${g.map(card).join('')}</div>`; };
  const sug = suggestions(today());
  $('#view').innerHTML = `
  <div class="phead compact"><span class="eyebrow">Progetti e attività</span><h1>Lavoro</h1></div>
  <div class="stack">
    <button class="card tap" data-act="workday" style="background:var(--work-soft);box-shadow:none;text-align:left"><div class="row"><div class="ico" style="--c:var(--work);--s:var(--surface)">${ic('bolt')}</div><div class="grow"><div style="font-weight:700">Piano di oggi</div><div class="muted small">${sug.focus.length} attività focus · ${sug.follow.length} solleciti · ${sug.filler.length} per i tempi morti</div></div>${ic('right','style="width:20px;height:20px;color:var(--work)"')}</div></button>
    <div class="chips">${[['tutti','Tutti'],['azienda','Aziende'],['interno','Interni'],['personale','Personali']].map(([k,l])=>`<button class="chip ${f===k?'on':''}" data-act="wf" data-k="${k}">${l}</button>`).join('')}</div>
    ${list.length ? sec('Attivi','attivo') + sec('In stand-by','standby','<span class="faint small">fuori dal piano, non meno importanti</span>') + sec('Chiusi','chiuso')
      : `<div class="empty">${ic('work','style="width:28px;height:28px"')}<b>Nessun progetto</b><span class="small">Crea il primo progetto con il pulsante in basso: tipo, priorità e to-do. Il piano di oggi si costruisce da qui.</span></div>`}
  </div>`;
  fab('Progetto','var(--work)','newproj');
};
ACT.wf = (el,D) => { S.workFilter=D.k; render(); };
ACT.proj = (el,D) => sheetProject(+D.id);
ACT.newproj = () => sheetProjectForm(null);

function sheetProject(id){
  const draw = () => {
    const p = DB.projects.find(x=>x.id==id); if(!p){ closeSheet(); return; }
    const col = p.type==='azienda'?'work':p.type==='interno'?'books':'diet';
    const tds = projTodos(p.id);
    openSheet(sheetHead(esc(p.name),esc(p.client||TYPE[p.type]),p.type==='azienda'?'work':p.type==='interno'?'bolt':'goal',`var(--${col})`,`var(--${col}-soft)`,
      `<button class="iconbtn" data-act="projedit" data-id="${p.id}" aria-label="Modifica">${ic('edit')}</button>`),`
    <div class="stack">
      <div class="field"><span class="flabel">Stato</span><div class="seg">${[['attivo','Attivo'],['standby','Stand-by'],['chiuso','Chiuso']].map(([k,l])=>`<button class="${p.status===k?'on':''}" data-act="pset" data-id="${p.id}" data-f="status" data-k="${k}">${l}</button>`).join('')}</div></div>
      ${p.status==='standby'?`<div class="field"><label for="pWait">In attesa di</label><input class="input" id="pWait" value="${esc(p.waiting||'')}" data-save="waiting" data-id="${p.id}" placeholder="Es. schema elettrico dal cliente"></div>`:''}
      <div class="field"><span class="flabel">Priorità</span><div class="seg">${[1,2,3].map(i=>`<button class="${p.prio===i?'on':''}" data-act="pset" data-id="${p.id}" data-f="prio" data-k="${i}">${['','Bassa','Media','Alta'][i]}</button>`).join('')}</div></div>
      <div class="field"><span class="flabel">Tipo</span><div class="seg">${Object.entries(TYPE).map(([k,l])=>`<button class="${p.type===k?'on':''}" data-act="pset" data-id="${p.id}" data-f="type" data-k="${k}">${l}</button>`).join('')}</div></div>
      <div><div class="eyebrow" style="margin:6px 0 2px">To-do</div>
        <div class="list">${tds.map(t=>`<div class="todo ${t.done?'done':''}"><button class="check ${t.done?'on':''}" style="--c:var(--work)" data-act="todo" data-id="${t.id}" aria-label="Fatto">${ic('check')}</button><span class="t">${esc(t.text)}</span>${delBtn('tododel',`data-id="${t.id}"`,'Elimina attività')}</div>`).join('')||'<div class="muted small" style="padding:8px 0">Nessuna attività</div>'}</div>
        <form class="row" id="fTodo" data-id="${p.id}" style="margin-top:8px"><input class="input grow" id="todoIn" placeholder="Nuova attività" autocomplete="off"><button class="btn" type="submit" style="min-height:50px" aria-label="Aggiungi">${ic('plus')}</button></form></div>
      <div class="field"><label for="pNotes">Note</label><textarea class="input" id="pNotes" data-save="notes" data-id="${p.id}" placeholder="Appunti sul progetto">${esc(p.notes||'')}</textarea></div>
      <button class="btn danger block" data-act="projdel" data-id="${p.id}">${ic('trash')}Elimina progetto</button>
    </div>`, draw);
  };
  draw();
}
function sheetProjectForm(id){
  const p = id ? DB.projects.find(x=>x.id==id) : {name:'',client:'',type:'azienda',prio:2};
  openSheet(sheetHead(id?'Modifica progetto':'Nuovo progetto','','work','var(--work)','var(--work-soft)'),`
  <form class="stack" id="fProj" data-id="${id||''}">
    <div class="field"><label for="npName">Nome</label><input class="input" id="npName" required value="${esc(p.name)}" placeholder="Es. Revamping linea 2"></div>
    <div class="field"><label for="npClient">Cliente / contesto</label><input class="input" id="npClient" value="${esc(p.client||'')}" placeholder="Es. Delta Spa"></div>
    <div class="grid2"><div class="field"><label for="npType">Tipo</label><select class="input" id="npType">${Object.entries({azienda:'Azienda (fattura)',interno:'Interno (R&D)',personale:'Personale'}).map(([k,l])=>`<option value="${k}" ${p.type===k?'selected':''}>${l}</option>`).join('')}</select></div>
    <div class="field"><label for="npPrio">Priorità</label><select class="input" id="npPrio">${[[3,'Alta'],[2,'Media'],[1,'Bassa']].map(([k,l])=>`<option value="${k}" ${p.prio==k?'selected':''}>${l}</option>`).join('')}</select></div></div>
    <button class="btn block" style="background:var(--work);color:#fff" type="submit">${id?'Salva':'Crea progetto'}</button>
  </form>`);
}
ACT.projedit = (el,D) => sheetProjectForm(+D.id);
FORM.fProj = async (f,v) => {
  const row = {name:v('npName'), client:v('npClient'), type:v('npType'), prio:+v('npPrio')};
  if(f.dataset.id){ await upd('projects',+f.dataset.id,row); sheetProject(+f.dataset.id); render(); toast('Progetto aggiornato'); }
  else { const p = await ins('projects',{...row,status:'attivo'}); render(); sheetProject(p.id); toast('Progetto creato'); }
};
ACT.pset = async (el,D) => {
  const p = DB.projects.find(x=>x.id==D.id); const patch = {[D.f]: D.f==='prio'?+D.k:D.k};
  if(D.f==='status' && D.k==='standby'){ patch.since = iso(today()); if(!p.waiting) patch.waiting = ''; }
  const pr = upd('projects',p.id,patch); refresh(); await pr;
};
ACT.todo = async (el,D) => {
  const t = DB.todos.find(x=>x.id==D.id); const p = DB.projects.find(x=>x.id==t.project_id);
  const pr = upd('todos',t.id,{done:!t.done});
  if(D.from==='day'){ el.classList.add('on'); setTimeout(refresh,300); } else refresh();
  await pr; if(t.done) toast('Fatto · '+p.name);
};
ACT.tododel = async (el,D) => {
  const t = {...DB.todos.find(x=>x.id==D.id)};
  await del('todos',t.id); refresh();
  toast('Attività eliminata',{undo: async()=>{ const {id,user_id,created_at,...rest}=t; await ins('todos',rest); refresh(); }});
};
FORM.fTodo = async (f,v) => {
  const text = v('todoIn'); if(!text) return;
  const pid = +f.dataset.id; const pos = projTodos(pid).length;
  await ins('todos',{project_id:pid,text,position:pos}); refresh();
  setTimeout(()=>$('#todoIn')?.focus(),50);
};
ACT.projdel = async (el,D) => {
  const p = DB.projects.find(x=>x.id==D.id);
  if(!await ask('Eliminare il progetto?', `«${p.name}» e le sue ${projTodos(p.id).length} attività verranno cancellati.`)) return;
  await del('projects',p.id); DB.todos = DB.todos.filter(t=>t.project_id!=p.id); closeSheet(); render(); toast('Progetto eliminato');
};
// salvataggio automatico dei campi di testo nello sheet (note, in attesa di…)
let saveT;
document.addEventListener('input', e=>{
  const el = e.target; if(!el.dataset.save) return;
  clearTimeout(saveT);
  saveT = setTimeout(()=>{ const k = el.dataset.table || 'projects'; upd(k, +el.dataset.id, {[el.dataset.save]: el.value}).then(()=>render()).catch(err=>toast(err.message,{err:true})); }, 600);
});
