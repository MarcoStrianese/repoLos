/* =====================================================================
   LOS · motori di logica (finanze, lavoro, dieta, sport)
   ===================================================================== */

/* ------------------------- FINANZE ------------------------- */
const monthTx = m => DB.tx.filter(t=>t.date.startsWith(m));
const spentIn = (tags, m) => -monthTx(m).filter(t=>tags.includes(t.tag) && t.amt<0).reduce((s,t)=>s+t.amt,0);
const monthIn = m => monthTx(m).filter(t=>t.amt>0).reduce((s,t)=>s+t.amt,0);
const monthOut = m => -monthTx(m).filter(t=>t.amt<0).reduce((s,t)=>s+t.amt,0);
const curMonth = () => ym(today());
function allMonths(){ // dal primo movimento al mese corrente
  const first = DB.tx.length ? DB.tx[0].date.slice(0,7) : curMonth();
  const out=[]; for(let m=first; m<=curMonth(); m=ymAdd(m,1)) out.push(m); return out;
}
function closedMonths(n=12){ const all = allMonths().filter(m=>m<curMonth()); return all.slice(-n); }
function groupAvg(tags){ const ms = closedMonths(12); return ms.length ? avg(ms.map(m=>spentIn(tags,m))) : 0; }

// ritmo d'acquisto di una categoria negli ultimi 180 giorni
function rhythm(tag){
  const t0 = addDays(today(), -180);
  const rows = DB.tx.filter(t=>t.tag==tag && t.amt<0 && pd(t.date)>=t0 && pd(t.date)<=today());
  const days = [...new Set(rows.map(t=>t.date))].sort();
  if(days.length<2) return null;
  const interval = daysBetween(pd(days[0]), pd(days[days.length-1]))/(days.length-1);
  const ticket = -rows.reduce((s,t)=>s+t.amt,0)/days.length;
  return { interval:Math.max(1,interval), ticket, last:pd(days[days.length-1]), n:days.length };
}
// previsione di fine mese per un gruppo dello specchietto
function forecast(w, m){
  const tags = w.tag_ids.map(Number);
  const a = groupAvg(tags), spent = spentIn(tags,m);
  if(m !== curMonth()) return {spent, avg:a, fc:spent, next:null, why:'mese chiuso'};
  const T0 = today(), mo = T0.getMonth(), y = T0.getFullYear();
  let extra = 0; const nexts=[], why=[];
  tags.forEach(tag=>{
    const name = tagName(tag).toLowerCase();
    const r = rhythm(tag);
    if(!r){ why.push(`${name}: storico insufficiente`); return; }
    if(r.interval >= 24){ // spesa mensile o più rara (bollette…)
      const paid = monthTx(m).some(t=>t.tag==tag && t.amt<0);
      const ms = closedMonths(6); const freq = ms.length ? ms.filter(mm=>spentIn([tag],mm)>0).length/ms.length : 0;
      if(paid) why.push(`${name}: già pagata questo mese`);
      else if(freq>=.5){ extra += r.ticket; why.push(`${name}: attesa entro fine mese (~${eur0(r.ticket)})`); }
      else why.push(`${name}: di solito non tutti i mesi`);
      return;
    }
    let next = addDays(r.last, Math.round(r.interval));
    if(next < T0) next = new Date(T0);
    nexts.push(new Date(next));
    let n = 0, d = new Date(next);
    while(d.getMonth()===mo && d.getFullYear()===y){ n++; d = addDays(d, Math.max(1,Math.round(r.interval))); }
    extra += n * r.ticket;
    why.push(n ? `${name}: ${n} acquist${n>1?'i':'o'} attes${n>1?'i':'o'} (ogni ~${Math.round(r.interval)} gg, ~${eur0(r.ticket)} l'uno)` : `${name}: prossimo acquisto il ${fmtDay(next)}, già nel mese dopo`);
  });
  const next = nexts.length ? nexts.sort((a,b)=>a-b)[0] : null;
  return {spent, avg:a, fc:spent+extra, extra, next, why:why.join(' · ')};
}
// spese fisse
const fixedInMonth = (f, mo) => f.rule==='monthly' || (f.months||[]).includes(mo+1);
function fixedPaid(f, m){
  return monthTx(m).some(t=>t.amt<0 && (f.tag_id==null || t.tag==f.tag_id) && Math.abs(Math.abs(t.amt)-f.amount) <= Math.max(1, f.amount*.03));
}
function fixedDueRemaining(){
  const T0=today(), y=T0.getFullYear(), mo=T0.getMonth(), m=curMonth(); const out=[];
  DB.fixed.filter(f=>f.active).forEach(f=>{
    if(!fixedInMonth(f,mo)) return;
    const due = new Date(y,mo,Math.min(f.day,new Date(y,mo+1,0).getDate()));
    if(due>=T0 && !fixedPaid(f,m)) out.push({...f,due});
  });
  return out.sort((a,b)=>a.due-b.due);
}
function nextFixedDate(f){
  const T0=today(); let d = new Date(T0.getFullYear(),T0.getMonth(),1);
  for(let i=0;i<14;i++){
    const dd = new Date(d.getFullYear(),d.getMonth(),Math.min(f.day,new Date(d.getFullYear(),d.getMonth()+1,0).getDate()));
    if(fixedInMonth(f,d.getMonth()) && dd>=T0) return dd;
    d = new Date(d.getFullYear(),d.getMonth()+1,1);
  }
  return null;
}
const fixedMonthlyEq = () => DB.fixed.filter(f=>f.active).reduce((s,f)=>s+(f.rule==='monthly'?f.amount:f.amount*(f.months||[]).length/12),0);
const isInvestTag = id => tagById(id)?.name==='investimenti';

// L'analizzatore: quanto posso spendere nei weekend rimasti del mese
function advisor(){
  const T0 = today(), m = curMonth();
  const income = monthIn(m);
  const avgIncome = avg(closedMonths(6).map(monthIn));
  const expectedIncome = income < avgIncome*0.5 ? avgIncome - income : 0;
  const spent = monthOut(m);
  const due = fixedDueRemaining();
  const dueTot = due.reduce((s,f)=>s+f.amount,0);
  const variable = DB.watch.reduce((s,w)=>{ const f=forecast(w,m); return s+Math.max(0,f.fc-f.spent); },0);
  const margin = income + expectedIncome - spent - dueTot - variable;
  let we=0; for(let d=new Date(T0); d.getMonth()===T0.getMonth(); d=addDays(d,1)) if(d.getDay()===6) we++;
  if(T0.getDay()===0) we++;
  we = Math.max(we,1);
  const allowance = Math.max(0,margin)/we;
  const svagoTags = ['ristorante','aperitivi'].map(n=>tagByName(n)?.id).filter(x=>x!=null);
  const avgSvago = groupAvg(svagoTags)/4.3;
  const level = margin<0?'bad':allowance<avgSvago?'warn':'good';
  const verdict = level==='good'?'Hai margine: goditi il weekend.':level==='warn'?'Margine ridotto: scegli un\'uscita sola.':'Weekend a costo quasi zero.';
  // prossimo weekend
  let sat = new Date(T0); while(sat.getDay()!==6 && sat.getDay()!==0) sat = addDays(sat,1);
  if(sat.getDay()===0) sat = addDays(sat,-1);
  return {income,expectedIncome,avgIncome,spent,due,dueTot,variable,margin,we,allowance,avgSvago,level,verdict,sat};
}

/* ------------------------- LAVORO ------------------------- */
const TYPE = {azienda:'Azienda',interno:'Interno',personale:'Personale'};
const TW = {azienda:3, interno:1.4, personale:1};
const PW = {1:1, 2:1.6, 3:2.2};
const projTodos = pid => DB.todos.filter(t=>t.project_id==pid).sort((a,b)=>a.position-b.position||a.id-b.id);
function suggestions(day){
  const out = [], follow = [];
  DB.projects.forEach(p=>{
    if(p.status==='chiuso') return;
    if(p.status==='standby'){
      const wait = p.since ? daysBetween(pd(p.since), day) : 0;
      if(wait>=5) follow.push({p, text:`Sollecita: ${p.waiting||'risposta'}`, reasons:[`in attesa da ${wait} gg`], score:TW[p.type]*PW[p.prio]});
      return;
    }
    projTodos(p.id).filter(t=>!t.done).forEach((t,ti)=>{
      const score = TW[p.type]*PW[p.prio] - ti*0.08;
      const reasons = [];
      if(p.type==='azienda') reasons.push('fattura');
      if(p.prio===3) reasons.push('priorità alta');
      if(ti===0) reasons.push('prossimo passo');
      out.push({p,t,score,reasons});
    });
  });
  out.sort((a,b)=>b.score-a.score);
  const focus = [], seen = {};
  for(const s of out){ if(s.p.type!=='azienda') continue; if((seen[s.p.id]||0)>=2) continue; seen[s.p.id]=(seen[s.p.id]||0)+1; focus.push(s); if(focus.length>=4) break; }
  const filler = out.filter(s=>s.p.type!=='azienda').slice(0,4);
  follow.sort((a,b)=>b.score-a.score);
  return {focus, filler, follow};
}

/* ------------------------- DIETA ------------------------- */
const MEALS = [
  {k:'colazione',label:'Colazione',time:'07:30',icon:'coffee'},
  {k:'spuntino1',label:'Spuntino mattina',time:'10:30',icon:'apple'},
  {k:'pranzo',label:'Pranzo',time:'13:00',icon:'plate'},
  {k:'spuntino2',label:'Spuntino pomeriggio',time:'16:30',icon:'apple'},
  {k:'cena',label:'Cena',time:'20:30',icon:'moon'},
];
const RULES = [
  {tag:'bianca',label:'Carne bianca',min:2,max:2},{tag:'rossa',label:'Carne rossa',min:1,max:1},
  {tag:'uova',label:'Uova',min:1,max:9},{tag:'affettati',label:'Affettati',min:0,max:1},{tag:'formaggi',label:'Formaggi e latticini',min:0,max:1},
];
const PROT = ['bianca','rossa','pesce','uova','legumi','formaggi','affettati','primo','libero'];
const dishById = id => DB.dishes.find(d=>d.id==id);
const dishesOf = meal => DB.dishes.filter(d=>d.meal===meal).sort((a,b)=>a.position-b.position||a.id-b.id);
const weekDish = (dow, meal) => { const r = DB.weekmenu.find(x=>x.dow==dow && x.meal===meal); return r?.dish_id ? dishById(r.dish_id) : null; };
const trainingOn = d => workoutsOn(iso(d)).length>0;
function mealFor(d, meal){
  const ov = DB.overrides.find(x=>x.date===iso(d) && x.meal===meal);
  if(ov) return ov.dish_id ? dishById(ov.dish_id) : null;
  let dish = weekDish(d.getDay(), meal);
  if(meal==='spuntino2'){ // nei giorni di allenamento lo spuntino è il pre-workout
    const pre = dishesOf('spuntino2').find(x=>x.train);
    if(trainingOn(d) && pre) dish = pre;
    else if(dish?.train) dish = dishesOf('spuntino2').find(x=>!x.train) || dish;
  }
  return dish;
}

/* ------------------------- SPORT ------------------------- */
const workoutsOn = k => DB.workouts.filter(w=>w.date===k).sort((a,b)=>(a.time||'').localeCompare(b.time||''));
const activePlan = () => DB.plans.find(p=>p.active);
const defaultDays = () => DB.settings.default_days || [1,2,4,5,6];
function nextPlanDay(beforeIso){
  const plan = activePlan(); if(!plan) return 1;
  const prev = DB.workouts.filter(w=>w.src==='scheda' && w.plan_day && w.date<beforeIso).sort((a,b)=>a.date.localeCompare(b.date)||a.id-b.id).pop();
  const n = plan.days.length || 1;
  return prev ? (prev.plan_day % n) + 1 : 1;
}
const toMin = t => String(t||'0').split(':').reduce((a,x)=>a*60+ +x,0)/60;
