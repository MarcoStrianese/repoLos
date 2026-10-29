/* =====================================================================
   LOS · avvio: login, caricamento dati, service worker
   ===================================================================== */
async function boot(){
  const { data:{ session } } = await sb.auth.getSession();
  if(!session){ showLogin(); return; }
  DB.user = session.user;
  try{
    await loadAll();
  }catch(e){
    console.error(e);
    $('#splash').innerHTML = `<div class="stack" style="max-width:340px;text-align:center;align-items:center">${LOGO.replace('<svg','<svg class="logo"')}<b>Non riesco a caricare i dati</b><span class="muted small">${esc(e.message)}</span><button class="btn accent" onclick="location.reload()">Riprova</button></div>`;
    return;
  }
  try{ const v=localStorage.getItem('los-view'); if(v && VIEWS[v]) S.view=v; }catch(e){}
  $('#app').hidden = false;
  render();
  $('#splash').classList.add('gone');
  stravaStatus().then(()=>{ if(['sport','impostazioni'].includes(S.view)) render(); });
  stravaHandleRedirect().then(()=>render());
}
function showLogin(){
  $('#splash').classList.add('gone');
  $('#login').classList.remove('gone');
  setTimeout(()=>$('#lemail').focus(), 300);
}
FORM.loginForm = async (f,v) => {
  $('#loginErr').hidden = true; $('#loginBtn').textContent = 'Accesso…';
  const { error } = await sb.auth.signInWithPassword({ email:v('lemail'), password:$('#lpwd').value });
  $('#loginBtn').textContent = 'Accedi';
  if(error){ $('#loginErr').textContent = error.message==='Invalid login credentials' ? 'Email o password non corrette.' : error.message; $('#loginErr').hidden = false; return; }
  $('#login').classList.add('gone'); $('#splash').classList.remove('gone');
  boot();
};
sb.auth.onAuthStateChange((ev) => { if(ev==='SIGNED_OUT' && DB.user){ DB.user=null; $('#app').hidden=true; showLogin(); } });

ACT.refresh = async (el) => {
  el?.classList?.add('spin');
  try{ await loadAll(); await stravaStatus(); refresh(); toast('Dati aggiornati'); }
  finally{ el?.classList?.remove('spin'); }
};
// ricarica i dati quando l'app torna in primo piano dopo un po' (es. spesa inserita da un altro dispositivo)
let hiddenAt = 0;
document.addEventListener('visibilitychange', ()=>{
  if(document.hidden){ hiddenAt = Date.now(); return; }
  if(DB.user && hiddenAt && Date.now()-hiddenAt > 5*60e3 && !sheetOpen){ S.day = today(); loadAll().then(render).catch(()=>{}); }
});

// service worker: solo su http(s), non nell'eseguibile desktop
if('serviceWorker' in navigator && location.protocol.startsWith('http')){
  addEventListener('load', ()=>navigator.serviceWorker.register('sw.js').catch(e=>console.warn('SW',e)));
}
boot();
