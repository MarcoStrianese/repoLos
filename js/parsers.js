/* =====================================================================
   LOS · lettura file nel browser (nessun dato esce dal dispositivo)
   - scheda del PT: .docx (mammoth) o .pdf (pdf.js) → giorni "GIORNO n"
   - referto nutrizionista "Elenco andamenti" (.pdf) → controlli
   ===================================================================== */
const loaded = {};
function loadScript(src){
  if(!loaded[src]) loaded[src] = new Promise((ok,ko)=>{ const s=document.createElement('script'); s.src=src; s.onload=ok; s.onerror=()=>ko(new Error('Impossibile caricare '+src)); document.head.appendChild(s); });
  return loaded[src];
}
async function pdfjs(){
  await loadScript('vendor/pdf.min.js');
  window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'vendor/pdf.worker.min.js';
  return window.pdfjsLib;
}
async function pdfPages(file){
  const lib = await pdfjs();
  const doc = await lib.getDocument({data:new Uint8Array(await file.arrayBuffer())}).promise;
  const pages = [];
  for(let p=1;p<=doc.numPages;p++){
    const tc = await (await doc.getPage(p)).getTextContent();
    pages.push(tc.items.filter(i=>i.str && i.str.trim()).map(i=>({s:i.str.trim(), x:i.transform[4], y:i.transform[5], w:i.width||0})));
  }
  return pages;
}
// ricostruisce le righe di testo di un PDF (raggruppa per coordinata y)
function pdfLines(items){
  const rows = [];
  items.slice().sort((a,b)=>b.y-a.y||a.x-b.x).forEach(it=>{
    const r = rows.find(r=>Math.abs(r.y-it.y)<3);
    if(r) r.items.push(it); else rows.push({y:it.y, items:[it]});
  });
  return rows.map(r=>r.items.sort((a,b)=>a.x-b.x).map(i=>i.s).join(' '));
}
async function fileText(file){
  const name = file.name.toLowerCase();
  if(name.endsWith('.docx')){
    await loadScript('vendor/mammoth.browser.min.js');
    const r = await window.mammoth.extractRawText({arrayBuffer: await file.arrayBuffer()});
    return r.value;
  }
  if(name.endsWith('.pdf')){
    const pages = await pdfPages(file);
    return pages.map(pdfLines).flat().join('\n');
  }
  return await file.text();
}

/* --- scheda PT: divide sui marcatori "GIORNO n" (tollera "Giorno 4", "———GIORNO 7", "GIORNO 1 - titolo") --- */
function parsePlanText(text){
  const days = []; let cur = null;
  String(text).replace(/\r/g,'').split('\n').forEach(line=>{
    const m = line.match(/^[^\p{L}\d]*giorno\s*(\d{1,2})\b[\s:.\-–—]*(.*)$/iu);
    if(m){ cur = {g:+m[1], lines:[]}; days.push(cur); if(m[2].trim()) cur.lines.push(m[2].trim()); return; }
    const s = line.trim();
    if(cur && s && !/^[—\-_=*.\s]+$/.test(s)) cur.lines.push(s);
  });
  return days.map(d=>{
    const first = d.lines[0] || '';
    const title = first.length > 48 ? first.slice(0,46)+'…' : first;
    return { g:d.g, title: title ? title.charAt(0)+title.slice(1).toLowerCase() : 'Giorno '+d.g, body:d.lines.join('\n') };
  });
}

/* --- referto "Elenco andamenti": una pagina per grandezza, valori come etichette del grafico --- */
const BODY_PAGES = [
  {re:/^peso$/i, k:'weight'},
  {re:/massa grassa\s*%/i, k:'fat_pct'},
  {re:/massa grassa(?!\s*%)/i, k:'fat_kg'},
  {re:/massa magra/i, k:'lean_kg'},
  {re:/massa muscolare/i, k:'muscle_kg'},
];
async function parseBodyPdf(file){
  const pages = await pdfPages(file);
  const byDate = {};
  pages.forEach(items=>{
    const def = BODY_PAGES.find(d=>items.some(i=>d.re.test(i.s)));
    if(!def) return;
    const dates = items.filter(i=>/^\d{2}\/\d{2}\/\d{4}$/.test(i.s)).sort((a,b)=>a.x-b.x);
    if(!dates.length) return;
    const dy = Math.max(...dates.map(d=>d.y)), minX = Math.min(...dates.map(d=>d.x)) - 20;
    // etichette dei valori: numeri sopra l'asse delle date e a destra dell'asse y (deduplicate per posizione)
    const seen = new Set();
    const vals = items.filter(i=>/^\d+([.,]\d+)?$/.test(i.s) && i.y > dy+5 && i.x > minX)
      .filter(i=>{ const k=Math.round(i.x)+':'+Math.round(i.y); if(seen.has(k)) return false; seen.add(k); return true; })
      .sort((a,b)=>a.x-b.x);
    // gli assi hanno valori con il punto; le etichette dei dati usano la virgola o sono interi allineati alle date
    const pitch = dates.length>1 ? (dates[dates.length-1].x-dates[0].x)/(dates.length-1) : 100;
    const offs = vals.map(v=>{ let best=null,bd=1e9; dates.forEach((d,i)=>{ const dd=Math.abs((v.x)-(d.x+pitch*0.33)); if(dd<bd){bd=dd;best=i;} }); return {v,i:best,bd}; })
      .filter(o=>o.bd < pitch*0.45);
    offs.forEach(o=>{
      const [dd,mm,yy] = dates[o.i].s.split('/');
      const k = `${yy}-${mm}-${dd}`;
      (byDate[k] = byDate[k] || {date:k})[def.k] = pnum(o.v.s);
    });
  });
  return Object.values(byDate).sort((a,b)=>a.date.localeCompare(b.date));
}
