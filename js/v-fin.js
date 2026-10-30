/* =====================================================================
   LOS · vista FINANZE (dati da Supabase: expenses + tag)
   ===================================================================== */
S.finTab = 'panoramica'; S.finMonth = null; S.finYear = null; S.txMonth = null; S.txFilter = 'tutte';
S.distMode = 'mese'; S.distWeek = null;

VIEWS.finanze = function(){
  S.finMonth ||= curMonth(); S.txMonth ||= curMonth(); S.finYear ||= today().getFullYear();
  const t = S.finTab;
  const last = DB.tx.length ? DB.tx[DB.tx.length-1].date : null;
  $('#view').innerHTML = `
  <div class="phead compact"><span class="eyebrow">Supabase · ExpensesTracker${last?' · ultimo movimento '+fmtDay(pd(last)):''}</span><h1>Finanze</h1></div>
  <div class="tabs"><div class="seg">${[['panoramica','Panoramica'],['movimenti','Movimenti'],['fisse','Spese fisse'],['conti','Conti']].map(([k,l])=>`<button class="${t===k?'on':''}" data-act="ft" data-k="${k}">${l}</button>`).join('')}</div></div>
  <div id="finBody" class="stack"></div>`;
  ({panoramica:finPanoramica,movimenti:finMovimenti,fisse:finFisse,conti:finConti})[t]();
  fab(t==='fisse'?'Spesa fissa':t==='conti'?'Conto':'Movimento','var(--fin)',t==='fisse'?'newfixed':t==='conti'?'newacc':'newtx');
};
ACT.ft = (el,D) => { S.finTab=D.k; render(); scrollTo({top:0}); };

/* ---------------- PANORAMICA ---------------- */
function finPanoramica(){
  const adv = advisor(); const m = S.finMonth; const isCur = m===curMonth();
  const months = allMonths();
  const wcards = DB.watch.map(w=>{
    const f = forecast(w,m); const mx = Math.max(f.fc,f.avg,f.spent)*1.15||1;
    const delta = f.avg? (f.fc-f.avg)/f.avg : 0;
    const st = delta>0.15?['bad','sopra media']:delta<-0.15?['good','sotto media']:['neutral','in linea'];
    const col = tagColor(w.tag_ids[0]);
    return `<button class="catcard tap" data-act="cat" data-id="${w.id}" style="--c:${col}">
      <div class="row"><span class="dot" style="color:${col}"></span><b class="grow" style="font-size:15px">${esc(w.label)}</b><span class="pill ${st[0]}">${st[1]}</span></div>
      <div class="row" style="align-items:baseline"><span class="amt grow">${eur(f.spent)}</span><span class="muted" style="font-size:13px">${isCur?'prev. ':''}<b class="mono" style="color:var(--ink)">${eur0(f.fc)}</b></span></div>
      <div class="gauge"><span class="fc" style="width:${f.fc/mx*100}%"></span><span class="sp" style="width:${f.spent/mx*100}%"></span><span class="avg" style="left:${f.avg/mx*100}%" title="media"></span></div>
      <div class="muted" style="font-size:13px">media ${eur0(f.avg)}/mese${isCur&&f.next?` · prossimo ${fmtDay(f.next)}`:''}</div>
    </button>`; }).join('');
  const closed = months.filter(mm=>mm<curMonth());
  const avgIn = avg(closed.slice(-12).map(monthIn)), avgOut = avg(closed.slice(-12).map(monthOut));
  const years = [...new Set(months.map(mm=>+mm.slice(0,4)))];
  const yearRows = months.filter(mm=>mm.startsWith(S.finYear)).map(mm=>[MON[+mm.slice(5)-1],monthIn(mm),monthOut(mm)]);
  // medie per categoria (anno selezionato): totale ÷ mesi con almeno un movimento
  const yTx = DB.tx.filter(t=>t.date.startsWith(S.finYear) && t.amt<0);
  const byTag = {}; yTx.forEach(t=>{ const o=byTag[t.tag]=byTag[t.tag]||{s:0,ms:new Set()}; o.s-=t.amt; o.ms.add(t.date.slice(0,7)); });
  const avgsCat = Object.entries(byTag).map(([tag,o])=>({tag,v:o.s/o.ms.size,n:o.ms.size})).sort((a,b)=>b.v-a.v);
  const mxCat = avgsCat[0]?.v||1;
  $('#finBody').innerHTML = `
  <div class="cols">
    <div class="stack">${advisorCard(adv,false)}</div>
    <div class="stack">
      <div class="grid2">
        <div class="card"><div class="eyebrow">Entrate medie</div><div class="big mono" style="font-size:24px;margin-top:6px;color:var(--good)">${eur0(avgIn)}</div><div class="faint" style="font-size:12px">al mese, ultimi ${Math.min(12,closed.length)} mesi</div></div>
        <div class="card"><div class="eyebrow">Uscite medie</div><div class="big mono" style="font-size:24px;margin-top:6px;color:var(--fin)">${eur0(avgOut)}</div><div class="faint" style="font-size:12px">${avgIn?`tasso di risparmio ${Math.round((1-avgOut/avgIn)*100)}%`:''}</div></div>
      </div>
      <div class="card"><div class="eyebrow">${ymLabel(curMonth())} in corso</div><div class="row" style="gap:18px;margin-top:8px;flex-wrap:wrap"><div><div class="faint" style="font-size:12px">entrate</div><div class="mono pos" style="font-weight:600">${eur(adv.income)}</div></div><div><div class="faint" style="font-size:12px">uscite</div><div class="mono" style="font-weight:600">${eur(adv.spent)}</div></div><div><div class="faint" style="font-size:12px">saldo</div><div class="mono ${adv.income-adv.spent>=0?'pos':'neg'}" style="font-weight:600">${eur(adv.income-adv.spent)}</div></div></div></div>
    </div>
  </div>
  <div class="section-h"><h2>Specchietto categorie</h2><button class="link" data-act="watchcfg">Personalizza</button></div>
  ${monthNav('fm', m, months[0], curMonth())}
  <div class="legend"><span><i class="sw" style="background:var(--fin)"></i>speso</span><span><i class="sw" style="background:repeating-linear-gradient(-45deg,var(--fin) 0 3px,transparent 3px 6px)"></i>previsione fine mese</span><span><i class="sw" style="width:2px;height:12px;background:var(--ink)"></i>media mensile</span></div>
  <div class="grid-auto">${wcards||'<div class="empty">Nessuna voce: tocca «Personalizza».</div>'}</div>
  <div class="cols">
    ${distCard()}
    <div class="card"><div class="row"><div class="eyebrow grow">Storico annuale</div><div class="seg" style="min-width:140px">${years.map(yy=>`<button class="${S.finYear===yy?'on':''}" data-act="fy" data-k="${yy}">${yy}</button>`).join('')}</div></div>
      <div style="margin-top:10px">${barsInOut(yearRows)}</div>
      <div class="legend" style="margin-top:6px"><span><i class="sw" style="background:var(--good)"></i>entrate</span><span><i class="sw" style="background:var(--fin)"></i>uscite</span></div></div>
  </div>
  <div class="cols">
    <div class="card"><div class="eyebrow">Bilancio mese per mese</div><div class="table-wrap" style="margin-top:6px"><table class="t"><thead><tr><th>Mese</th><th class="r">Entrate</th><th class="r">Uscite</th><th class="r">Bilancio</th></tr></thead><tbody>
      ${months.slice().reverse().map(mm=>{const i=monthIn(mm),o=monthOut(mm),b=i-o; return `<tr class="tap" data-act="gotx" data-m="${mm}"><td>${ymLabel(mm,true)}${mm===curMonth()?' <span class="pill neutral">in corso</span>':''}</td><td class="r">${eur(i)}</td><td class="r">${eur(o)}</td><td class="r ${b>=0?'pos':'neg'}">${b>=0?'+':'−'}${eur(Math.abs(b))}</td></tr>`}).join('')}
    </tbody></table></div></div>
    <div class="card"><div class="eyebrow">Medie mensili per categoria · ${S.finYear}</div><div class="faint" style="font-size:12px;margin:2px 0 8px">totale ÷ mesi con almeno un movimento</div>
      ${avgsCat.map(x=>`<div style="padding:6px 0"><div class="row" style="font-size:14px"><span class="grow">${esc(tagName(x.tag))}</span><span class="mono">${eur0(x.v)}</span></div><div class="bar" style="margin-top:4px;--c:${tagColor(x.tag)}"><span style="width:${x.v/mxCat*100}%"></span></div></div>`).join('')||'<div class="muted small">Nessun dato</div>'}
    </div>
  </div>`;
}
function monthNav(act, m, min, max){
  return `<div class="monthnav"><button class="iconbtn" data-act="${act}" data-n="-1" aria-label="Mese precedente" ${m<=min?'disabled style="opacity:.3"':''}>${ic('left')}</button>
    <b>${ymLabel(m)}<input type="month" value="${m}" min="${min}" max="${max}" data-pick="${act}" aria-label="Scegli il mese"></b>
    <button class="iconbtn" data-act="${act}" data-n="1" aria-label="Mese successivo" ${m>=max?'disabled style="opacity:.3"':''}>${ic('right')}</button></div>`;
}
document.addEventListener('change', e=>{
  const el=e.target; if(!el.dataset.pick || !el.value) return;
  if(el.dataset.pick==='fm') S.finMonth=el.value; if(el.dataset.pick==='tm') S.txMonth=el.value;
  render();
});
ACT.fm = (el,D) => { const k=ymAdd(S.finMonth,+D.n); if(k>curMonth()||k<allMonths()[0]) return; S.finMonth=k; render(); };
ACT.fy = (el,D) => { S.finYear=+D.k; render(); };
ACT.gotx = (el,D) => { S.finTab='movimenti'; S.txMonth=D.m; S.txFilter='tutte'; render(); scrollTo({top:0}); };

function distCard(){
  const mode = S.distMode;
  let rows, label;
  if(mode==='mese'){ rows = monthTx(S.finMonth); label = ymLabel(S.finMonth); }
  else { S.distWeek ||= monday(today()); const a=S.distWeek, b=addDays(a,6); rows = DB.tx.filter(t=>t.date>=iso(a)&&t.date<=iso(b)); label = `${fmtDay(a)} – ${fmtDay(b)}`; }
  const out={}; rows.filter(t=>t.amt<0).forEach(t=>out[t.tag]=(out[t.tag]||0)-t.amt);
  const parts = Object.entries(out).map(([tag,v])=>({c:tagColor(tag),l:tagName(tag),v})).sort((a,b)=>b.v-a.v);
  const tot = parts.reduce((s,p)=>s+p.v,0);
  return `<div class="card"><div class="row"><div class="eyebrow grow">Distribuzione</div><div class="seg" style="min-width:170px"><button class="${mode==='mese'?'on':''}" data-act="dist" data-k="mese">Mese</button><button class="${mode==='settimana'?'on':''}" data-act="dist" data-k="settimana">Settimana</button></div></div>
    ${mode==='settimana'?`<div class="row" style="justify-content:space-between;margin-top:8px"><button class="iconbtn" data-act="dw" data-n="-7" aria-label="Settimana precedente">${ic('left')}</button><b class="small">${label}</b><button class="iconbtn" data-act="dw" data-n="7" aria-label="Settimana successiva">${ic('right')}</button></div>`:`<div class="muted small" style="margin-top:6px">${label}</div>`}
    <div class="row wrap" style="gap:18px;margin-top:10px;align-items:center;justify-content:center">${donut(parts,tot,eur0(tot))}
    <div class="grow list" style="min-width:200px">${parts.slice(0,8).map(p=>`<div class="row" style="padding:5px 0;font-size:14px"><span class="dot" style="color:${p.c}"></span><span class="grow">${esc(p.l)}</span><span class="mono">${eur0(p.v)}</span><span class="faint mono" style="width:40px;text-align:right">${Math.round(p.v/tot*100)}%</span></div>`).join('')}</div></div></div>`;
}
ACT.dist = (el,D) => { S.distMode=D.k; render(); };
ACT.dw = (el,D) => { S.distWeek=addDays(S.distWeek,+D.n); render(); };

/* dettaglio di una voce dello specchietto: tutti i mesi dell'istogramma con importi e movimenti */
ACT.cat = (el,D) => sheetCat(+D.id);
function sheetCat(id){
  const w = DB.watch.find(x=>x.id==id); if(!w) return;
  const tags = w.tag_ids.map(Number); const m = S.finMonth;
  const f = forecast(w, m);
  const ms = allMonths().slice(-13);
  const vals = ms.map(mm=>spentIn(tags,mm));
  const labels = ms.map(mm=>MON[+mm.slice(5)-1].slice(0,3));
  const col = tagColor(tags[0]); const mx = Math.max(...vals,1);
  openSheet(sheetHead(esc(w.label), `${tags.map(tagName).join(' + ')} · ultimi ${ms.length} mesi`,'fin','var(--fin)','var(--fin-soft)'),`
    <div class="stack">
      <div class="grid3"><div class="kpi" style="box-shadow:none;background:var(--surface)"><span class="s">speso ${MON[+m.slice(5)-1]}</span><b class="mono">${eur0(f.spent)}</b></div><div class="kpi" style="box-shadow:none;background:var(--surface)"><span class="s">media</span><b class="mono">${eur0(f.avg)}</b></div><div class="kpi" style="box-shadow:none;background:var(--surface)"><span class="s">previsione</span><b class="mono">${eur0(f.fc)}</b></div></div>
      <div class="card">${miniBars(vals,labels,col,{allLabels:true,avgLine:f.avg,hi:ms.indexOf(m)})}<div class="legend" style="margin-top:4px"><span><i class="sw" style="width:14px;height:0;border-top:1.5px dashed var(--ink)"></i>media 12 mesi</span></div></div>
      <div class="muted small"><b style="color:var(--ink)">Come stimo:</b> ${esc(f.why)}.</div>
      <div class="card"><div class="eyebrow" style="margin-bottom:4px">Spese mese per mese</div>
        ${ms.slice().reverse().map((mm,ri)=>{ const i=ms.length-1-ri; const tx=monthTx(mm).filter(t=>tags.includes(t.tag)).sort((a,b)=>b.date.localeCompare(a.date));
          return `<div class="monthrow ${mm===m?'open':''}"><button data-act="mrow"><span style="width:62px;font-weight:700">${ymLabel(mm,true)}</span><span class="mbar" style="--c:${col}"><span style="width:${vals[i]/mx*100}%"></span></span><span class="grow"></span><span class="mono" style="font-weight:600">${eur(vals[i])}</span><span class="faint small" style="width:44px;text-align:right">${tx.length} mov.</span><span class="chev">${ic('chev','style="width:18px;height:18px"')}</span></button>
          <div class="in">${tx.map(t=>`<div class="row small" style="padding:6px 0;border-top:1px dashed var(--line)"><span class="faint mono" style="width:52px">${fmtDay(pd(t.date))}</span><span class="grow">${esc(t.note)||esc(tagName(t.tag))}</span><span class="mono">${eur(-t.amt)}</span></div>`).join('')||'<div class="faint small">Nessun movimento</div>'}</div></div>`; }).join('')}
      </div>
    </div>`);
}
ACT.mrow = (el) => el.parentNode.classList.toggle('open');

ACT.watchcfg = () => sheetWatchCfg();
function sheetWatchCfg(){
  const draw = () => {
    const all = DB.tags.filter(t=>!['stipendio','dummy'].includes(t.name));
    openSheet(sheetHead('Personalizza specchietto','Scegli le categorie e raggruppale','fin','var(--fin)','var(--fin-soft)'),`
    <div class="stack">
      <div class="card"><div class="list">${DB.watch.map(w=>`<div class="li"><span class="dot" style="color:${tagColor(w.tag_ids[0])}"></span><span class="grow"><b>${esc(w.label)}</b><div class="muted small">${w.tag_ids.map(tagName).join(' + ')}</div></span>${delBtn('unwatch',`data-id="${w.id}"`,'Rimuovi dallo specchietto')}</div>`).join('')||'<div class="muted small">Nessuna voce</div>'}</div></div>
      <form class="stack card" id="fWatch"><div class="eyebrow">Nuova voce · selezionane più di una per aggregarle</div>
        <div class="chips wrapped">${all.map(t=>`<label class="chip"><input type="checkbox" name="wc" value="${t.id}"><span class="dot" style="color:${tagColor(t.id)}"></span>${esc(tagName(t.id))}</label>`).join('')}</div>
        <input class="input" id="wName" placeholder="Nome voce (facoltativo, es. Casa)"><button class="btn block" style="background:var(--fin);color:#fff" type="submit">Aggiungi allo specchietto</button></form>
    </div>`, draw);
  };
  draw();
}
ACT.unwatch = async (el,D) => { await del('watch',+D.id); refresh(); };
FORM.fWatch = async (f,v) => {
  const ids=[...f.querySelectorAll('input[name=wc]:checked')].map(x=>+x.value); if(!ids.length){ toast('Seleziona almeno una categoria'); return; }
  await ins('watch',{label:v('wName')||ids.map(tagName).join(' + '),tag_ids:ids,position:DB.watch.length}); refresh(); toast('Voce aggiunta');
};

/* ---------------- MOVIMENTI ---------------- */
function finMovimenti(){
  const m = S.txMonth; const f = S.txFilter;
  const mt = monthTx(m);
  const tags = [...new Set(mt.map(t=>t.tag))];
  const list = mt.filter(t=>f==='tutte'||t.tag==f).sort((a,b)=>b.date.localeCompare(a.date)||b.id-a.id);
  const byDay={}; list.forEach(t=>(byDay[t.date]=byDay[t.date]||[]).push(t));
  const inn = list.filter(t=>t.amt>0).reduce((s,t)=>s+t.amt,0), out = -list.filter(t=>t.amt<0).reduce((s,t)=>s+t.amt,0);
  $('#finBody').innerHTML = `
    ${monthNav('tm', m, allMonths()[0], curMonth())}
    <div class="row" style="gap:16px;padding:0 4px"><span class="small muted">Entrate <b class="mono pos">${eur(inn)}</b></span><span class="small muted">Uscite <b class="mono" style="color:var(--ink)">${eur(out)}</b></span><span class="small muted">${list.length} movimenti</span></div>
    <div class="chips"><button class="chip ${f==='tutte'?'on':''}" data-act="txf" data-k="tutte">Tutte</button>${tags.map(c=>`<button class="chip ${f==c?'on':''}" data-act="txf" data-k="${c}"><span class="dot" style="color:${tagColor(c)}"></span>${esc(tagName(c))}</button>`).join('')}</div>
    <div class="card" style="padding-top:6px">${Object.entries(byDay).map(([d,ts])=>`<div class="eyebrow" style="margin-top:12px">${DOWL[pd(d).getDay()]} ${fmtDay(pd(d))}</div>${ts.map(t=>`<div class="tx"><button class="row grow" style="gap:12px;text-align:left;min-height:54px" data-act="txedit" data-id="${t.id}"><div class="ico" style="--s:color-mix(in srgb,${tagColor(t.tag)} 15%,transparent);--c:${tagColor(t.tag)}">${ic(t.amt>0?'wallet':'fin')}</div><div class="grow"><div style="font-weight:600">${esc(tagName(t.tag))}</div><div class="muted small">${esc(t.note)||'—'}</div></div><span class="am ${t.amt>0?'in':''}">${t.amt>0?'+':'−'}${eur(Math.abs(t.amt))}</span></button>${delBtn('deltx',`data-id="${t.id}"`)}</div>`).join('')}`).join('')||'<div class="empty" style="margin-top:10px">Nessun movimento in questo mese</div>'}</div>`;
}
ACT.tm = (el,D) => { const k=ymAdd(S.txMonth,+D.n); if(k>curMonth()||k<allMonths()[0]) return; S.txMonth=k; S.txFilter='tutte'; render(); };
ACT.txf = (el,D) => { S.txFilter=D.k; render(); };
ACT.deltx = async (el,D) => {
  const t = DB.tx.find(x=>x.id==D.id);
  if(!await ask('Eliminare il movimento?', `${tagName(t.tag)} · ${eur(Math.abs(t.amt))} del ${fmtDay(pd(t.date))}. Viene cancellato anche da Supabase.`)) return;
  await del('tx',t.id); refresh(); toast('Movimento eliminato');
};
let TXSIGN = -1;
ACT.newtx = () => { TXSIGN=-1; sheetTx(null); };
ACT.txedit = (el,D) => { const t=DB.tx.find(x=>x.id==D.id); TXSIGN = t.amt>0?1:-1; sheetTx(t.id); };
function sheetTx(id, selTag){
  const t = id ? DB.tx.find(x=>x.id==id) : null;
  const tags = DB.tags.slice().sort((a,b)=>usage(b.id)-usage(a.id));
  const cur = selTag ?? t?.tag ?? tags[0]?.id;
  openSheet(sheetHead(id?'Modifica movimento':'Nuovo movimento','','fin','var(--fin)','var(--fin-soft)'),`
  <form class="stack" id="fTx" data-id="${id||''}">
    <div class="seg"><button type="button" class="${TXSIGN<0?'on':''}" data-act="txsign" data-k="-1">Uscita</button><button type="button" class="${TXSIGN>0?'on':''}" data-act="txsign" data-k="1">Entrata</button></div>
    <input class="input mono" id="txAmt" inputmode="decimal" placeholder="0,00" style="font-size:36px;text-align:center;padding:18px;font-weight:600;min-height:80px" required value="${t?String(Math.abs(t.amt)).replace('.',','):''}">
    <div class="field"><span class="flabel">Categoria</span><div class="chips wrapped" id="txTags">${tags.map(c=>`<label class="chip"><input type="radio" name="txc" value="${c.id}" ${c.id==cur?'checked':''}><span class="dot" style="color:${tagColor(c.id)}"></span>${esc(tagName(c.id))}</label>`).join('')}
      <button type="button" class="chip" data-act="newtag" style="border-style:dashed">${ic('plus','style="width:16px;height:16px"')}Nuova categoria</button></div>
      <div class="row" id="newTagRow" hidden><input class="input grow" id="newTagName" placeholder="Nome nuova categoria" autocomplete="off"><button type="button" class="btn small" data-act="savetag" style="min-height:50px">Crea</button></div></div>
    <div class="grid2"><div class="field"><label for="txDate">Data</label><input class="input" id="txDate" type="date" value="${t?t.date:iso(today())}" required></div><div class="field"><label for="txNote">Nota</label><input class="input" id="txNote" placeholder="facoltativa" value="${esc(t?.note||'')}"></div></div>
    <button class="btn block" style="background:var(--fin);color:#fff" type="submit">${id?'Salva modifiche':'Salva su Supabase'}</button>
    ${id?`<button class="btn danger block" type="button" data-act="deltx" data-id="${id}">${ic('trash')}Elimina movimento</button>`:''}
  </form>`);
  if(!id) setTimeout(()=>$('#txAmt')?.focus(), 350);
}
const usage = id => DB.tx.filter(t=>t.tag==id).length;
ACT.txsign = (el,D) => { TXSIGN=+D.k; el.parentNode.querySelectorAll('button').forEach(b=>b.classList.toggle('on',b===el)); };
ACT.newtag = () => { $('#newTagRow').hidden=false; $('#newTagName').focus(); };
ACT.savetag = async () => {
  const name = ($('#newTagName').value||'').trim().toLowerCase(); if(!name) return;
  if(DB.tags.some(t=>t.name===name)){ toast('Categoria già esistente'); return; }
  const r = chk(await sb.from('tag').insert({name}).select().single()); DB.tags.push(r);
  const keep = {amt:$('#txAmt').value, date:$('#txDate').value, note:$('#txNote').value, id:$('#fTx').dataset.id};
  sheetTx(keep.id?+keep.id:null, r.id); $('#txAmt').value=keep.amt; $('#txDate').value=keep.date; $('#txNote').value=keep.note;
  toast('Categoria «'+tagName(r.id)+'» creata');
};
FORM.fTx = async (f,v) => {
  const amt = pnum(v('txAmt')); if(!amt){ toast('Inserisci un importo'); return; }
  const c = f.querySelector('input[name=txc]:checked'); if(!c){ toast('Scegli una categoria'); return; }
  const row = {data:v('txDate'), importo:TXSIGN*Math.abs(amt), id_tag:+c.value, note:v('txNote')};
  if(f.dataset.id) await upd('tx',+f.dataset.id,row); else await ins('tx',row);
  closeSheet(); render(); toast((f.dataset.id?'Aggiornato: ':'Salvato: ')+eur(Math.abs(amt))+' · '+tagName(+c.value));
};

/* ---------------- SPESE FISSE ---------------- */
function finFisse(){
  const eq = fixedMonthlyEq();
  $('#finBody').innerHTML = `
    <div class="card" style="background:var(--fin-soft);box-shadow:none"><div class="eyebrow" style="color:var(--fin)">Impegno fisso equivalente</div><div class="big mono" style="font-size:30px;margin-top:4px">${eur(eq)}<span class="muted" style="font-size:14px;font-family:var(--f-body);font-weight:500"> / mese</span></div><div class="muted small">L'analizzatore sottrae dal margine le fisse non ancora pagate questo mese. Tocca una voce per modificarla.</div></div>
    <div class="card"><div class="list">${DB.fixed.map(f=>{const nx=nextFixedDate(f); return `<div class="li" style="${f.active?'':'opacity:.5'}"><button class="row grow" style="gap:12px;text-align:left;min-height:52px" data-act="fxedit" data-id="${f.id}"><div class="ico" style="--s:color-mix(in srgb,${tagColor(f.tag_id)} 15%,transparent);--c:${tagColor(f.tag_id)}">${ic('wallet')}</div><div class="grow"><div style="font-weight:600">${esc(f.name)}</div><div class="muted small">${f.rule==='monthly'?`ogni mese, il ${f.day}`:`${(f.months||[]).length} volte l'anno (${(f.months||[]).map(x=>MON[x-1]).join(', ')}), il ${f.day}`}${nx&&f.active?` · prossima ${fmtDay(nx)}`:''}${f.active?'':' · sospesa'}</div></div><span class="mono" style="font-weight:600">${eur(f.amount)}</span></button>
      <button class="check ${f.active?'on':''}" style="--c:var(--fin)" data-act="fxtoggle" data-id="${f.id}" aria-label="Attiva">${ic('check')}</button></div>`}).join('')||'<div class="empty">Nessuna spesa fissa</div>'}</div></div>`;
}
ACT.fxtoggle = async (el,D) => { const f=DB.fixed.find(x=>x.id==D.id); const pr=upd('fixed',f.id,{active:!f.active}); render(); await pr; };
ACT.newfixed = () => sheetFixed(null);
ACT.fxedit = (el,D) => sheetFixed(+D.id);
function sheetFixed(id){
  const f = id ? DB.fixed.find(x=>x.id==id) : {name:'',amount:'',day:1,rule:'monthly',months:[],tag_id:null};
  openSheet(sheetHead(id?'Modifica spesa fissa':'Nuova spesa fissa','','wallet','var(--fin)','var(--fin-soft)'),`
  <form class="stack" id="fFixed" data-id="${id||''}">
    <div class="field"><label for="fxName">Nome</label><input class="input" id="fxName" required value="${esc(f.name)}" placeholder="Es. Assicurazione auto"></div>
    <div class="grid2"><div class="field"><label for="fxAmt">Importo</label><input class="input mono" id="fxAmt" inputmode="decimal" required value="${f.amount!==''?String(f.amount).replace('.',','):''}" placeholder="0,00"></div><div class="field"><label for="fxDay">Giorno del mese</label><input class="input" id="fxDay" type="number" inputmode="numeric" min="1" max="31" value="${f.day}"></div></div>
    <div class="field"><span class="flabel">Ricorrenza</span><div class="seg" id="fxRuleSeg"><button type="button" class="${f.rule==='monthly'?'on':''}" data-act="fxrule" data-k="monthly">Ogni mese</button><button type="button" class="${f.rule==='months'?'on':''}" data-act="fxrule" data-k="months">Solo alcuni mesi</button></div><input type="hidden" id="fxRule" value="${f.rule}"></div>
    <div class="field" id="fxMonths" ${f.rule==='months'?'':'hidden'}><span class="flabel">Mesi</span><div class="chips wrapped">${MON.map((m,i)=>`<label class="chip"><input type="checkbox" name="fxm" value="${i+1}" ${(f.months||[]).includes(i+1)?'checked':''}>${m}</label>`).join('')}</div></div>
    <div class="field"><label for="fxCat">Categoria</label><select class="input" id="fxCat"><option value="">—</option>${DB.tags.map(c=>`<option value="${c.id}" ${c.id==f.tag_id?'selected':''}>${esc(tagName(c.id))}</option>`).join('')}</select></div>
    <button class="btn block" style="background:var(--fin);color:#fff" type="submit">${id?'Salva modifiche':'Aggiungi'}</button>
    ${id?`<button class="btn danger block" type="button" data-act="fxdel" data-id="${id}">${ic('trash')}Elimina spesa fissa</button>`:''}
  </form>`);
}
ACT.fxrule = (el,D) => { $('#fxRule').value=D.k; el.parentNode.querySelectorAll('button').forEach(b=>b.classList.toggle('on',b===el)); $('#fxMonths').hidden = D.k!=='months'; };
FORM.fFixed = async (f,v) => {
  const ms=[...f.querySelectorAll('input[name=fxm]:checked')].map(x=>+x.value);
  const rule = v('fxRule')==='months'&&ms.length?'months':'monthly';
  const row = {name:v('fxName'),amount:pnum(v('fxAmt')),day:Math.min(31,Math.max(1,+v('fxDay')||1)),rule,months:rule==='months'?ms:[],tag_id:v('fxCat')?+v('fxCat'):null};
  if(!(row.amount>0)){ toast('Importo non valido'); return; }
  if(f.dataset.id){ const r=await upd('fixed',+f.dataset.id,row); r.amount=Number(r.amount); } else { const r=await ins('fixed',row); r.amount=Number(r.amount); }
  closeSheet(); render(); toast(f.dataset.id?'Spesa fissa aggiornata':'Spesa fissa aggiunta');
};
ACT.fxdel = async (el,D) => { const f=DB.fixed.find(x=>x.id==D.id); if(!await ask('Eliminare la spesa fissa?',`«${f.name}» non verrà più considerata dall'analizzatore.`)) return; await del('fixed',f.id); closeSheet(); render(); toast('Spesa fissa eliminata'); };

/* ---------------- CONTI ---------------- */
// saldo di un conto a una certa data (ultimo punto di storico ≤ data); null se non c'è ancora
function accBalanceAt(accId, date){
  let v=null; for(const h of DB.acchist){ if(h.account_id!=accId) continue; if(h.date>date) break; v=h.balance; } return v;
}
// serie della liquidità totale: un punto per ogni data in cui almeno un conto è stato aggiornato
function liquiditySeries(){
  const dates=[...new Set(DB.acchist.filter(h=>DB.accounts.some(a=>a.id==h.account_id)).map(h=>h.date))].sort();
  // se un conto non ha ancora rilevazioni a quella data si usa il suo primo saldo noto (evita salti finti)
  const first = id => DB.acchist.find(h=>h.account_id==id)?.balance ?? 0;
  return dates.map(d=>({d, v:DB.accounts.reduce((s,a)=>s+(accBalanceAt(a.id,d)??first(a.id)),0)}));
}
const histLabel = (dates) => { const multiYear = dates.length && dates[0].slice(0,4)!==dates[dates.length-1].slice(0,4); return dates.map(d=>{const x=pd(d); return fmtDay(x)+(multiYear?' '+String(x.getFullYear()).slice(2):'');}); };
function finConti(){
  const tot = DB.accounts.reduce((s,a)=>s+a.balance,0);
  const invTag = tagByName('investimenti')?.id;
  const inv = DB.tx.filter(t=>t.tag==invTag).sort((a,b)=>b.date.localeCompare(a.date));
  const invTot = -inv.reduce((s,t)=>s+t.amt,0);
  const pac = DB.fixed.filter(f=>f.active && f.tag_id==invTag);
  const ser = liquiditySeries();
  // variazione rispetto a ~30 giorni fa
  const d30 = iso(addDays(today(),-30)); const past = [...ser].reverse().find(p=>p.d<=d30);
  const delta = past ? tot - past.v : null;
  const accDelta = a => { const hs=DB.acchist.filter(h=>h.account_id==a.id); if(hs.length<2) return ''; const d=hs[hs.length-1].balance-hs[hs.length-2].balance; if(!d) return ''; return `<span class="mono small ${d>0?'pos':'neg'}" style="font-weight:700">${d>0?'+':'−'}${eur0(Math.abs(d))}</span>`; };
  $('#finBody').innerHTML = `
    <div class="card" style="background:var(--ink);color:var(--bg)"><div class="eyebrow" style="color:color-mix(in srgb,var(--bg) 70%,transparent)">Patrimonio</div><div class="big mono" style="font-size:34px;margin:4px 0">${eur(tot+invTot)}</div><div style="font-size:13px;opacity:.75">liquidità ${eur(tot)} · investito ${eur(invTot)}${delta!=null?` · ${delta>=0?'+':'−'}${eur0(Math.abs(delta))} in 30 giorni`:''}</div></div>
    <div class="card"><div class="section-h" style="margin:0 0 6px"><h2>Andamento liquidità</h2><span class="faint small">somma dei conti</span></div>
      ${ser.length>1 ? lineChart(ser.map(p=>p.v), histLabel(ser.map(p=>p.d)), {color:'var(--fin)', dec:0, unit:' €'})
        : `<div class="muted small" style="padding:6px 0 4px">Lo storico si costruisce da solo: ogni volta che aggiorni il saldo di un conto viene salvato un punto. Puoi anche inserire saldi passati (es. dagli estratti conto) scegliendo la data nella scheda del conto.</div>`}
    </div>
    <div class="section-h"><h2>Conti</h2><span class="faint small">tocca un conto per saldo e storico</span></div>
    <div class="grid-auto">${DB.accounts.map(a=>`<button class="catcard tap" data-act="acc" data-id="${a.id}"><div class="row"><div class="ico" style="--c:var(--fin);--s:var(--fin-soft)">${ic('wallet')}</div><b class="grow">${esc(a.name)}</b>${ic('edit','style="width:18px;height:18px;color:var(--faint)"')}</div><div class="row" style="align-items:baseline;gap:10px"><div class="amt">${eur(a.balance)}</div>${accDelta(a)}</div><div class="faint" style="font-size:12px">aggiornato il ${fmtDay(pd(a.updated_at))} · ${DB.acchist.filter(h=>h.account_id==a.id).length} rilevazioni</div></button>`).join('')||'<div class="empty">Nessun conto: aggiungine uno con il pulsante in basso (es. conto corrente, deposito, contanti).</div>'}</div>
    <div class="section-h"><h2>Investimenti</h2><span class="faint small">categoria «investimenti»</span></div>
    <div class="card"><div class="list">${pac.map(f=>`<div class="li"><div class="ico">${ic('bolt')}</div><div class="grow"><div style="font-weight:600">${esc(f.name)} attivo</div><div class="muted small">${eur(f.amount)} il ${f.day} · prossimo ${fmtDay(nextFixedDate(f))}</div></div></div>`).join('')}
      ${inv.map(t=>`<div class="li"><div class="ico" style="--c:#14866D;--s:color-mix(in srgb,#14866D 15%,transparent)">${ic('fin')}</div><div class="grow"><div style="font-weight:600">${esc(t.note)||'Investimento'}</div><div class="muted small">${fmtDay(pd(t.date))} ${t.date.slice(0,4)}</div></div><span class="mono" style="font-weight:600">${eur(-t.amt)}</span></div>`).join('')||'<div class="muted small" style="padding:8px 0">Nessun movimento di investimento</div>'}</div></div>`;
}
ACT.acc = (el,D) => sheetAcc(+D.id);
ACT.newacc = () => sheetAcc(null);
function sheetAcc(id){
  const draw = () => {
    const a = id?DB.accounts.find(x=>x.id==id):{name:'',balance:''};
    if(!a){ closeSheet(); return; }
    const hs = id ? DB.acchist.filter(h=>h.account_id==id) : [];
    const rows = hs.map((h,i)=>({...h, d: i? h.balance-hs[i-1].balance : null})).reverse();
    openSheet(sheetHead(id?esc(a.name):'Nuovo conto',id?`Saldo ${eur(a.balance)} · aggiornato il ${fmtDay(pd(a.updated_at))}`:'', 'wallet','var(--fin)','var(--fin-soft)'),`
    <form class="stack" id="fAcc" data-id="${id||''}">
      <div class="field"><label for="accName">Nome</label><input class="input" id="accName" value="${esc(a.name)}" required placeholder="Es. Conto corrente"></div>
      <div class="grid2">
        <div class="field"><label for="accBal">${id?'Nuovo saldo':'Saldo attuale'}</label><input class="input mono" id="accBal" inputmode="decimal" value="${a.balance!==''?String(a.balance).replace('.',','):''}" required style="font-size:22px"></div>
        <div class="field"><label for="accDate">Alla data</label><input class="input" id="accDate" type="date" value="${iso(today())}" max="${iso(today())}" required></div>
      </div>
      <div class="faint small" style="margin-top:-4px">Con una data passata aggiungi un punto allo storico (es. da un vecchio estratto conto) senza cambiare il saldo attuale.</div>
      <button class="btn block" style="background:var(--fin);color:#fff" type="submit">Salva</button>
    </form>
    ${id?`
    <div class="card flat" style="margin-top:14px"><div class="eyebrow" style="color:var(--fin)">Andamento</div>
      ${hs.length>1?lineChart(hs.map(h=>h.balance), histLabel(hs.map(h=>h.date)), {color:'var(--fin)', dec:0, unit:' €', h:160}):'<div class="muted small" style="padding:8px 0">Servono almeno due rilevazioni per il grafico.</div>'}
    </div>
    <div class="card flat" style="margin-top:12px"><div class="eyebrow">Storico saldi</div><div class="list">
      ${rows.map(h=>`<div class="li"><div class="grow"><div style="font-weight:600">${DOW[pd(h.date).getDay()]} ${fmtDay(pd(h.date))} ${h.date.slice(0,4)}</div>${h.d!=null&&h.d!==0?`<div class="mono small ${h.d>0?'pos':'neg'}">${h.d>0?'+':'−'}${eur(Math.abs(h.d))}</div>`:''}</div><span class="mono" style="font-weight:700">${eur(h.balance)}</span>${delBtn('acchdel',`data-id="${h.id}" data-acc="${id}"`,'Elimina rilevazione')}</div>`).join('')||'<div class="muted small" style="padding:8px 0">Nessuna rilevazione</div>'}
    </div></div>
    <button class="btn danger block" style="margin-top:14px" type="button" data-act="accdel" data-id="${id}">${ic('trash')}Elimina conto</button>`:''}`, draw);
  };
  draw();
}
FORM.fAcc = async (f,v) => {
  const bal = pnum(v('accBal')), date = v('accDate') || iso(today());
  if(isNaN(bal)){ toast('Saldo non valido'); return; }
  const id = f.dataset.id ? +f.dataset.id : null;
  let acc;
  if(id){
    const a = DB.accounts.find(x=>x.id==id); const patch = {name:v('accName')};
    if(date >= a.updated_at){ patch.balance = bal; patch.updated_at = date; } // è il dato più recente: diventa il saldo attuale
    acc = await upd('accounts',id,patch); acc.balance=Number(acc.balance);
  } else {
    acc = await ins('accounts',{name:v('accName'), balance:bal, updated_at:date}); acc.balance=Number(acc.balance);
  }
  await setAccHist(acc.id, date, bal);
  if(id) { refresh(); toast(date===iso(today())?'Saldo salvato':'Rilevazione del '+fmtDay(pd(date))+' salvata'); }
  else { closeSheet(); render(); toast('Conto creato'); }
};
ACT.acchdel = async (el,D) => {
  const h = DB.acchist.find(x=>x.id==D.id); if(!h) return;
  if(!await ask('Eliminare la rilevazione?',`${fmtDay(pd(h.date))} ${h.date.slice(0,4)} · ${eur(h.balance)}`)) return;
  await del('acchist',h.id);
  // se era l'ultima, il saldo attuale torna alla rilevazione precedente
  const a = DB.accounts.find(x=>x.id==D.acc); const hs = DB.acchist.filter(x=>x.account_id==a.id); const last = hs[hs.length-1];
  if(last && (last.date!==a.updated_at || last.balance!==a.balance)){ const r=await upd('accounts',a.id,{balance:last.balance, updated_at:last.date}); r.balance=Number(r.balance); }
  refresh(); toast('Rilevazione eliminata');
};
ACT.accdel = async (el,D) => { const a=DB.accounts.find(x=>x.id==D.id); if(!await ask('Eliminare il conto?',`«${a.name}» e tutto il suo storico`)) return; await del('accounts',a.id); DB.acchist = DB.acchist.filter(h=>h.account_id!=a.id); closeSheet(); render(); };
