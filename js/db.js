/* =====================================================================
   LOS · accesso ai dati (Supabase)
   Tutti i dati vengono caricati all'avvio in memoria (sono pochi) e
   ogni modifica viene scritta subito su Supabase.
   ===================================================================== */
const sb = window.supabase.createClient(LOS_CONFIG.SUPABASE_URL, LOS_CONFIG.SUPABASE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false, storageKey: 'los-auth' },
});

// cache in memoria: chiave → tabella
const T = {
  tags:'tag', tx:'expenses', projects:'los_projects', todos:'los_todos', fixed:'los_fixed_expenses',
  accounts:'los_accounts', watch:'los_watch_groups', goals:'los_goals', books:'los_books',
  restos:'los_restaurants', notes:'los_notes', hyrox:'los_hyrox', body:'los_body_checks',
  dishes:'los_dishes', weekmenu:'los_week_menu', overrides:'los_meal_overrides',
  plans:'los_workout_plans', workouts:'los_workouts',
  acchist:'los_account_history', events:'los_events',
};
const DB = Object.fromEntries(Object.keys(T).map(k=>[k,[]]));
DB.settings = {};
DB.user = null;

const ORDER = { tags:['name',true], projects:['created_at',false], todos:['position',true], fixed:['day',true], accounts:['id',true],
  watch:['position',true], goals:['created_at',true], books:['created_at',false], restos:['created_at',false], notes:['updated_at',false],
  hyrox:['date',true], body:['date',true], dishes:['position',true], plans:['created_at',false], workouts:['date',true],
  acchist:['date',true], events:['date',true] };

function chk({data,error}){ if(error) throw new Error(error.message); return data; }

async function loadTable(k){
  const t = T[k];
  if(k==='tx'){ // le spese possono superare il limite di 1000 righe per richiesta
    let all=[], from=0;
    for(;;){
      const rows = chk(await sb.from(t).select('id,data,importo,note,id_tag').order('data',{ascending:true}).order('id',{ascending:true}).range(from,from+999));
      all = all.concat(rows); if(rows.length<1000) break; from+=1000;
    }
    DB.tx = all.map(normTx);
    return;
  }
  let q = sb.from(t).select('*');
  const o = ORDER[k]; if(o) q = q.order(o[0],{ascending:o[1]});
  DB[k] = chk(await q);
}
const normTx = r => ({ id:r.id, date:String(r.data).slice(0,10), amt:Number(r.importo), note:r.note||'', tag:r.id_tag });

async function loadAll(){
  await Promise.all(Object.keys(T).map(loadTable));
  const st = chk(await sb.from('los_settings').select('data').maybeSingle());
  DB.settings = st?.data || {};
  DB.body.forEach(b=>{ ['weight','fat_kg','fat_pct','lean_kg','muscle_kg'].forEach(f=>b[f]=b[f]==null?null:Number(b[f])); });
  DB.fixed.forEach(f=>f.amount=Number(f.amount));
  DB.accounts.forEach(a=>a.balance=Number(a.balance));
  DB.acchist.forEach(h=>h.balance=Number(h.balance));
}

/* --- scritture --- */
async function ins(k, row){
  if(k==='tx'){
    const r = chk(await sb.from('expenses').insert(row).select('id,data,importo,note,id_tag').single());
    const n = normTx(r); DB.tx.push(n); DB.tx.sort((a,b)=>a.date.localeCompare(b.date)||a.id-b.id); return n;
  }
  const r = chk(await sb.from(T[k]).insert(row).select().single());
  DB[k].push(r); return r;
}
async function upd(k, id, patch, {optimistic=true}={}){
  const list = DB[k], i = list.findIndex(x=>x.id==id); const before = i>=0 ? {...list[i]} : null;
  if(optimistic && i>=0) Object.assign(list[i], k==='tx'?txPatchLocal(patch):patch);
  try{
    const r = chk(await sb.from(T[k]).update(patch).eq('id',id).select().single());
    if(i>=0) list[i] = k==='tx' ? normTx(r) : r;
    return list[i];
  }catch(e){ if(before) list[i]=before; refresh(); throw e; }
}
const txPatchLocal = p => { const o={}; if('data' in p) o.date=String(p.data).slice(0,10); if('importo' in p) o.amt=Number(p.importo); if('note' in p) o.note=p.note; if('id_tag' in p) o.tag=p.id_tag; return o; };
async function del(k, id){
  const list = DB[k], i = list.findIndex(x=>x.id==id); const before = i>=0 ? list[i] : null;
  if(i>=0) list.splice(i,1);
  try{ chk(await sb.from(T[k]).delete().eq('id',id)); }
  catch(e){ if(before) list.splice(i,0,before); refresh(); throw e; }
}
async function saveSettings(patch){
  Object.assign(DB.settings, patch);
  chk(await sb.from('los_settings').upsert({ user_id: DB.user.id, data: DB.settings }));
}
// tabelle con chiave composta
async function setWeekMenu(dow, meal, dish_id){
  const r = DB.weekmenu.find(x=>x.dow==dow && x.meal===meal);
  if(r) r.dish_id = dish_id; else DB.weekmenu.push({dow,meal,dish_id});
  chk(await sb.from('los_week_menu').upsert({ user_id: DB.user.id, dow, meal, dish_id }));
}
async function setOverride(date, meal, dish_id){
  const r = DB.overrides.find(x=>x.date===date && x.meal===meal);
  if(r) r.dish_id = dish_id; else DB.overrides.push({date,meal,dish_id});
  chk(await sb.from('los_meal_overrides').upsert({ user_id: DB.user.id, date, meal, dish_id }));
}

/* --- storico saldi: un punto per conto per giorno (upsert) --- */
async function setAccHist(account_id, date, balance){
  const r = chk(await sb.from('los_account_history').upsert({ user_id: DB.user.id, account_id, date, balance }, { onConflict:'account_id,date' }).select().single());
  r.balance = Number(r.balance);
  const i = DB.acchist.findIndex(h=>h.account_id==account_id && h.date===date);
  if(i>=0) DB.acchist[i] = r; else DB.acchist.push(r);
  DB.acchist.sort((a,b)=>a.date.localeCompare(b.date));
  return r;
}

/* --- categorie (tabella tag di ExpensesTracker) --- */
const TAG_COLORS = { spesa:'#1F8A5B', benzina:'#C77700', sport:'#D93A48', ristorante:'#7C46C2', aperitivi:'#B05FD0', luce:'#D4A400',
  gas:'#2C7FB8', mutuo:'#3046F0', abbonamenti:'#5A6B8C', vacanze:'#0FA3A3', dentista:'#E05D2E', acqua:'#4FA3D9', rifiuti:'#7A8B5C',
  libri:'#8E5BD0', 'caffè':'#8A5A3C', investimenti:'#14866D', parrucchiere:'#C2477F', nutrizionista:'#3BA776', paglie:'#9C8A6A',
  stipendio:'#1F8A5B', psico:'#6B7FD0', dummy:'#8A90A0' };
const PALETTE = ['#3046F0','#C77700','#1F8A5B','#D93A48','#7C46C2','#0FA3A3','#C2477F','#2C7FB8','#8A5A3C','#5A6B8C'];
const tagById = id => DB.tags.find(t=>t.id==id);
const tagName = id => { const t=tagById(id); if(!t) return 'Senza categoria'; if(t.name==='dummy') return 'Altro (storico)'; return t.name.charAt(0).toUpperCase()+t.name.slice(1); };
const tagColor = id => { const t=tagById(id); if(!t) return '#8A90A0'; return TAG_COLORS[t.name] || PALETTE[Math.abs([...t.name].reduce((h,c)=>h*31+c.charCodeAt(0)|0,7))%PALETTE.length]; };
const tagByName = n => DB.tags.find(t=>t.name===n);
