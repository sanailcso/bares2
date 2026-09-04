/*__CONFIG_START__*/
  const USERS = {
    "demo":   { pass: "demo", nombre: "Bar Demo", bar: "Bar Demo" },
  };
  /*__CONFIG_END__*/
  var BUILTIN_USERS = JSON.parse(JSON.stringify(USERS));
  function applyCfgUsers(cfg){
    Object.keys(USERS).forEach(function(k){ if(!(k in BUILTIN_USERS)) delete USERS[k]; });
    Object.keys(BUILTIN_USERS).forEach(function(k){ USERS[k]=JSON.parse(JSON.stringify(BUILTIN_USERS[k])); });
    if(cfg && cfg.users){ cfg.users.forEach(function(u){ if(u && u.u){ USERS[String(u.u).toLowerCase().trim()]={ pass:String(u.pass==null?"":u.pass), nombre:String(u.nombre||u.u), bar:String(u.bar||u.nombre||u.u) }; } }); }
  }

  var DEFAULT_SYM = { jackpot:"🍒", prize:"💎", fillers:["⚽","👟","🥅","���"] };
  function graphemes(str){ str=(str==null?"":String(str)).trim(); if(!str) return []; var arr=null; try{ if(typeof Intl!=="undefined"&&Intl.Segmenter){ arr=Array.from(new Intl.Segmenter(undefined,{granularity:"grapheme"}).segment(str),function(s){ return s.segment; }); } }catch(e){} if(!arr) arr=Array.from(str); return arr.filter(function(x){ return x&&x.trim(); }); }
  function oneSym(v, fb){ var g=graphemes(v); return g.length?g[0]:(fb||""); }
  function normalizeCfg(cfg){ if(!cfg||!cfg.themes) return cfg; var bm={}; try{ (BUILTIN.themes||[]).forEach(function(t){ bm[t.id]=t; }); }catch(e){} cfg.themes.forEach(function(t){ var b=bm[t.id]; var d=(b&&b.sym)?b.sym:DEFAULT_SYM; t.sym=t.sym||{}; if(b){ if(b.img && typeof t.img==="string" && t.img.indexOf("data:")===0) t.img=b.img; if(b.sym && b.sym.imageJackpot && typeof t.sym.imageJackpot==="string" && t.sym.imageJackpot.indexOf("data:")===0){ t.sym.imageJackpot=b.sym.imageJackpot; t.sym.imagePrize=b.sym.imagePrize; t.sym.imageFillers=(b.sym.imageFillers||[]).slice(); } } if(!t.sym.jackpot) t.sym.jackpot=(d.jackpot||DEFAULT_SYM.jackpot); if(!t.sym.prize) t.sym.prize=(d.prize||DEFAULT_SYM.prize); if(!t.sym.fillers||!t.sym.fillers.length) t.sym.fillers=((d.fillers&&d.fillers.length)?d.fillers:DEFAULT_SYM.fillers).slice(); t.pointsHud=t.pointsHud||{}; if(!t.pointsHud.color) t.pointsHud.color="#18052f"; }); return cfg; }
  var SUGGEST=[
    {label:"Halloween",kw:["halloween","terror","miedo","calabaza","fantasma","spooky","noche","muerto","bruja","zombie","calavera"],sym:{jackpot:"🎃",prize:"👻",fillers:["🦇","🕷️","🍬","🕯️"]}},
    {label:"Navidad",kw:["navidad","christmas","xmas","noel","papa noel","reyes","belen","nochebuena","adviento","turron"],sym:{jackpot:"🎄",prize:"🎁",fillers:["🎅","🔔","⛄","🍬"]}},
    {label:"Año Nuevo",kw:["año nuevo","ano nuevo","nochevieja","new year","uvas","campanadas","fin de año","2026","2027"],sym:{jackpot:"🎆",prize:"🍾",fillers:["🥂","🎇","⏰","🍇"]}},
    {label:"Fútbol",kw:["futbol","football","soccer","liga","mundial","champions","gol","balon","partido","estadio","copa","deporte"],sym:{jackpot:"⚽",prize:"🏆",fillers:["👟","🥅","🎯","📣"]}},
    {label:"España",kw:["españa","espana","spain","roja","seleccion","furia","hispania","madrid","barcelona"],sym:{jackpot:"🇪🇸",prize:"🏆",fillers:["⚽","🥅","📣","🎉"]}},
    {label:"Verano / Playa",kw:["verano","playa","beach","sol","mar","summer","vacaciones","piscina","calor","chiringuito"],sym:{jackpot:"☀️",prize:"🏖️",fillers:["🌊","🍹","🏄","🐚"]}},
    {label:"Primavera",kw:["primavera","spring","flores","flor","feria","abril"],sym:{jackpot:"🌸",prize:"🌷",fillers:["🌼","🐝","🦋","🌱"]}},
    {label:"Otoño",kw:["otoño","otono","autumn","hojas","castañas","vendimia","seta"],sym:{jackpot:"🍂",prize:"🌰",fillers:["🍁","🍄","🦔","🌾"]}},
    {label:"Invierno / Nieve",kw:["invierno","nieve","snow","winter","frio","esqui","montaña","hielo"],sym:{jackpot:"❄️",prize:"⛄",fillers:["🎿","🧣","🏔️","🌨️"]}},
    {label:"Fiesta",kw:["fiesta","party","cumple","cumpleaños","aniversario","celebracion","gala","disco"],sym:{jackpot:"🎉",prize:"🎂",fillers:["🥳","🎈","🍾","🎊"]}},
    {label:"Amor / San Valentín",kw:["amor","valentin","san valentin","love","corazon","pareja","cita","boda"],sym:{jackpot:"❤️",prize:"💘",fillers:["💖","🌹","💕","😍"]}},
    {label:"Carnaval",kw:["carnaval","disfraz","mascara","antifaz","comparsa"],sym:{jackpot:"🎭",prize:"🤡",fillers:["🎉","🥳","🎊","🃏"]}},
    {label:"Cervecería / Bar",kw:["cerveza","beer","bar","oktoberfest","birra","tercio","caña","tapas","pinchos","vino"],sym:{jackpot:"🍺",prize:"🍻",fillers:["🥨","🌭","🍟","🥜"]}},
    {label:"Casino / Suerte",kw:["casino","vegas","jackpot","suerte","luck","fortuna","apuesta","tragaperras","premio"],sym:{jackpot:"🎰",prize:"💰",fillers:["🍒","💎","🃏","🎲"]}},
    {label:"San Juan / Hoguera",kw:["san juan","hoguera","fuego","verbena"],sym:{jackpot:"🔥",prize:"🎆",fillers:["🌊","🎇","🪵","⭐"]}},
    {label:"Tropical",kw:["tropical","tiki","palmera","coco","caribe","isla","exotico","cóctel"],sym:{jackpot:"🍍",prize:"🥥",fillers:["🍒","🌺","🏄","🍹"]}},
    {label:"Espacio",kw:["espacio","space","galaxia","cosmos","planeta","astronauta","nasa","luna"],sym:{jackpot:"🚀",prize:"🌌",fillers:["🪐","👽","🌙","⭐"]}},
    {label:"Música",kw:["musica","música","rock","concierto","festival","dj","disco","baile"],sym:{jackpot:"🎸",prize:"🎤",fillers:["🎧","🥁","🎹","🎵"]}},
    {label:"Cine",kw:["cine","pelicula","película","hollywood","serie","film","palomitas","director"],sym:{jackpot:"🎬",prize:"🏆",fillers:["🍿","📽️","🎭","⭐"]}},
    {label:"Gaming",kw:["gaming","gamer","videojuego","video juego","arcade","consola","pixel","retro"],sym:{jackpot:"🕹️",prize:"👾",fillers:["🎮","🏎️","🧩","⭐"]}},
    {label:"Safari",kw:["safari","animal","selva","jungla","africa","leon","león","zoo"],sym:{jackpot:"🦁",prize:"🐘",fillers:["🦒","🐆","🌿","🦜"]}},
    {label:"Piratas",kw:["pirata","barco","tesoro","marinero","corsario","isla","nautico","náutico"],sym:{jackpot:"🏴‍☠️",prize:"💰",fillers:["⚓","🗺️","🦜","🛶"]}},
    {label:"Lujo",kw:["lujo","premium","oro","diamante","glamour","elegante","joya"],sym:{jackpot:"💎",prize:"👑",fillers:["💰","🥂","⌚","✨"]}},
    {label:"Comida",kw:["comida","restaurante","pizza","burger","hamburguesa","cocina","gastronomia","gastronomía"],sym:{jackpot:"🍔",prize:"🍕",fillers:["🍟","🌭","🍩","🥤"]}},
    {label:"Viajes",kw:["viaje","travel","turismo","aventura","hotel","maleta","avion","avión"],sym:{jackpot:"✈️",prize:"🗺️",fillers:["🧳","🏨","📸","🚗"]}},
    {label:"Boda",kw:["boda","novios","matrimonio","anillos","celebracion","celebración"],sym:{jackpot:"💍",prize:"💐",fillers:["👰","🤵","🥂","🎂"]}},
    {label:"Neón",kw:["neon","neón","cyber","futurista","synthwave","laser","luz"],sym:{jackpot:"⚡",prize:"💠",fillers:["🔮","🌈","🛸","✨"]}}
  ];
  function fnameToName(fn){ var s=String(fn||"").replace(/\.[a-z0-9]+$/i,"").replace(/[._\-]+/g," ").replace(/\s+/g," ").trim(); if(!s) return ""; return s.charAt(0).toUpperCase()+s.slice(1); }
  function _noAcc(s){ return String(s||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,""); }
  function suggestEmojis(text){ var t=" "+_noAcc(text)+" "; var scored=[]; SUGGEST.forEach(function(s,idx){ var hits=0; s.kw.forEach(function(k){ if(t.indexOf(_noAcc(k))>=0) hits++; }); scored.push({s:s,hits:hits,idx:idx}); }); scored.sort(function(a,b){ return (b.hits-a.hits)||(a.idx-b.idx); }); var chosen=scored.slice(0,8).map(function(x){ return x.s; }); return chosen; }
  var CUR_SYM = DEFAULT_SYM;
  var CHERRY = CUR_SYM.jackpot;
  var GEM = CUR_SYM.prize;
  var SYMBOLS = CUR_SYM.fillers.concat([CUR_SYM.jackpot]);
  var WIN30 = CUR_SYM.prize;
  var WIN50 = CUR_SYM.jackpot;
  var ALL_SYMBOLS = CUR_SYM.fillers.concat([CUR_SYM.jackpot, CUR_SYM.prize]);
  function refreshSymbols(){
    var s = (typeof activeSymConfig==="function") ? activeSymConfig() : null;
    if(!s || !s.jackpot) s = DEFAULT_SYM;
    var useImages = s.mode==="images" && s.imageJackpot && s.imagePrize && s.imageFillers && s.imageFillers.length;
    var fillers = useImages ? s.imageFillers : ((s.fillers && s.fillers.length) ? s.fillers : DEFAULT_SYM.fillers);
    CUR_SYM = useImages ? { jackpot:s.imageJackpot, prize:s.imagePrize, fillers:fillers } : { jackpot:s.jackpot, prize:(s.prize||DEFAULT_SYM.prize), fillers:fillers };
    CHERRY = CUR_SYM.jackpot; GEM = CUR_SYM.prize;
    SYMBOLS = fillers.concat([CUR_SYM.jackpot]);
    WIN30 = CUR_SYM.prize; WIN50 = CUR_SYM.jackpot;
    ALL_SYMBOLS = fillers.concat([CUR_SYM.jackpot, CUR_SYM.prize]);
  }
  const PAL_RED  = ["#E11D3B","#FF3651","#9d0c23","#FFFFFF","#FFC9D0"];
  const PAL_BLUE = ["#3AA0FF","#7FD4FF","#1E6FCB","#FFFFFF","#CDEEFF"];
  const PAL_GOLD = ["#FBEBB8","#E8C77A","#A9791F","#FFFFFF","#FFE9A8"];
  const STREAK_STEP_BONUS = 35;   // cada 3 dias (reescalado con la tirada)
  const STREAK_CYCLE = 7;         // a los 7 dias: caja sorpresa y reinicio
  const BOX_VALUES = [70, 90, 110];
  const CYCLE_MILESTONES = [
    { day:3, bonus:STREAK_STEP_BONUS, box:false, name:"⚡ Bonus de impulso" },
    { day:6, bonus:STREAK_STEP_BONUS, box:false, name:"🔥 Bonus de constancia" },
    { day:7, bonus:0, box:true, name:"🎁 Caja final" },
  ];

  const CATALOG = [
    { name:"Llavero premium",            emoji:"🔑", cost:2500,   tier:"Regalos" },
    { name:"Gorra Tiki Taka",            emoji:"🧢", cost:3500,   tier:"Regalos" },
    { name:"Set de copas de bar",        emoji:"🥃", cost:5500,   tier:"Regalos" },
    { name:"Mochila de viaje",           emoji:"🎒", cost:8000,   tier:"Regalos" },
    { name:"Auriculares inalámbricos",    emoji:"🎧", cost:16000,  tier:"Electrónica" },
    { name:"Altavoz Bluetooth",          emoji:"🔊", cost:24000,  tier:"Electrónica" },
    { name:"Tablet de 10 pulgadas",      emoji:"📱", cost:38000,  tier:"Electrónica" },
    { name:"Smart TV de 50 pulgadas",    emoji:"📺", cost:55000,  tier:"Electrónica" },
    { name:"Escapada rural (2 noches)",  emoji:"🏞️", cost:65000,  tier:"Viajes" },
    { name:"Fin de semana en la nieve",  emoji:"🎿", cost:90000,  tier:"Viajes" },
    { name:"Crucero por el Mediterráneo",emoji:"🛳️", cost:140000, tier:"Viajes" },
  ];
  const TIER_ORDER = ["Regalos", "Electrónica", "Viajes"];
  const TIER_TAG = { "Regalos":"Nivel 1", "Electrónica":"Nivel 2", "Viajes":"Nivel estrella" };
  function catalogItems(){ var cfg=(typeof PREVIEW_CFG!=="undefined"&&PREVIEW_CFG)?PREVIEW_CFG:((typeof ACTIVE_CFG!=="undefined"&&ACTIVE_CFG)?ACTIVE_CFG:null); var list=(cfg&&Array.isArray(cfg.rewards)&&cfg.rewards.length)?cfg.rewards:CATALOG; return list.filter(function(x){ return x && x.enabled!==false; }); }

  let currentUser = "", state = null, spinning = false;

  function stateKey(u){ return "tikitaka_" + u; }
  function defaultState(){ return { points:0, streak:0, lastSpin:null, lastSymbols:null, lastWin:0, history:[], dayOffset:0, appliedCredits:{}, pendingBox:false, bets:null, betSpins:0, goldenRound:false }; }
  function loadState(u){
    try { const raw = localStorage.getItem(stateKey(u)); if (raw){ return Object.assign(defaultState(), JSON.parse(raw)); } } catch(e){}
    return defaultState();
  }
  function saveState(){ try { localStorage.setItem(stateKey(currentUser), JSON.stringify(state)); } catch(e){} try{ sbSaveState(); sbSyncEvents(); }catch(e){} }

  /* ===== SUPABASE · registro central en la nube ===== */
  var SB_URL="https://bxyjassnjcyegqnimdsq.supabase.co";
  var SB_KEY="sb_publishable_28tZIevxR3lrkUZsfn9e8g_jHDyqFPy";
  var VAPID_PUBLIC="BBoLOiWoweBkdJhEVRz6jrczOQpDtH3fHQOtTkWIo8T6q5ewJi6mH8VW5Z1Wh1ufVlIuvBWeKTqQyzxW6MyPf98";
  var PUSH_FN_URL=SB_URL+"/functions/v1/push";
  var SB_ON=!!(SB_URL && SB_KEY);
  var _sbLoggedLen={};
  function sbHeaders(extra){ var h={ "apikey":SB_KEY, "Authorization":"Bearer "+SB_KEY, "Content-Type":"application/json" }; if(extra){ for(var k in extra){ h[k]=extra[k]; } } return h; }
  /* [SEGURIDAD] Acceso REST directo eliminado: todo pasa por RPC con RLS estricto. */
  /* ===== Seguridad en servidor (RPC) con modo compatibilidad ===== */
  var SB_SECURE = false;      // true si las funciones RPC de Supabase existen
  var _admPin = null;         // PIN validado durante la sesion admin
  var _serverSpin = null;     // resultado autoritativo de la tirada
  var _CRED = { u:null, t:null }; // sesion: usuario + token (solo en memoria)
  /* PIN de admin validado SOLO en el servidor (app_admin_check); sin hash en el cliente. */
  function sbRpc(fn, args){
    if(!SB_ON) return Promise.reject(new Error("nosb"));
    return fetch(SB_URL+"/rest/v1/rpc/"+fn, { method:"POST", headers:sbHeaders(), body:JSON.stringify(args||{}) })
      .then(function(r){ if(!r.ok) throw new Error("rpc "+r.status); return r.json(); });
  }
  function secureAuthLogin(u,p){
    return sbRpc("app_login",{ p_username:u, p_password:p }).then(function(res){
      if(res && res.ok && res.token){ SB_SECURE=true; _CRED.u=u; _CRED.t=res.token; return { nombre:res.nombre||u, bar:res.bar||"", state:res.state||{}, token:res.token }; }
      return null;
    });
  }
  function secureSpin(){
    if(currentUser==="demo") return Promise.resolve(null); /* demo: tirada local */
    if(!SB_SECURE || !_CRED.t) return Promise.resolve({ ok:false, error:"offline" });
    return sbRpc("app_spin",{ p_token:_CRED.t }).then(function(res){ return res; }).catch(function(){ return { ok:false, error:"offline" }; });
  }
  function secureRedeem(item){
    if(!SB_SECURE || !_CRED.t) return Promise.resolve({ ok:false, error:"offline" });
    return sbRpc("app_redeem",{ p_token:_CRED.t, p_prize:item.name }).then(function(res){ return res; }).catch(function(){ return { ok:false, error:"offline" }; });
  }
  function secureCancelRedeem(row){
    if(!SB_SECURE || !_CRED.t) return Promise.resolve({ ok:false, error:"offline" });
    return sbRpc("app_cancel_redeem",{ p_token:_CRED.t, p_prize:row.premio, p_id:row.id }).then(function(res){ return res; }).catch(function(){ return { ok:false, error:"offline" }; });
  }
  function sha256Hex(str){
    try{ var enc=new TextEncoder().encode(str);
      return crypto.subtle.digest("SHA-256",enc).then(function(buf){
        return Array.prototype.map.call(new Uint8Array(buf),function(b){return ("0"+b.toString(16)).slice(-2);}).join(""); }); }
    catch(e){ return Promise.resolve(""); }
  }
  function checkAdminPin(pin){
    return sbRpc("app_admin_check",{ p_pin:pin }).then(function(ok){ if(ok===true){ _admPin=pin; SB_SECURE=true; return true; } return false; })
      .catch(function(){ return false; });
  }
  function sbSaveStateFor(u,st){ if(!SB_ON||!u||!st) return;
    if(SB_SECURE && _CRED.u===u && _CRED.t){ sbRpc("app_save_state",{ p_token:_CRED.t, p_state:st }).catch(function(){}); return; }
    /* [SEGURIDAD] sin escritura REST directa */ }
  function sbSaveState(){ if(currentUser && state) sbSaveStateFor(currentUser,state); }
  function sbLoadState(u){ /* [SEGURIDAD] Sin lectura REST: el estado llega via app_login/app_resume; aqui solo local (demo). */ return Promise.resolve(loadState(u)); }
  function sbSyncEvents(){ if(!SB_ON||!currentUser||!state) return; /* [SEGURIDAD] Los eventos los registra el servidor en cada RPC; el cliente ya no inserta directo. */ _sbLoggedLen[currentUser]=(state.history||[]).length; }

  /* ===== Avisos / Notificaciones ===== */
  function notifSupported(){ return (typeof window!=="undefined" && "Notification" in window); }
  function showNotif(title, body, tag){
    try{
      if(!notifSupported() || Notification.permission!=="granted") return;
      var opts={ body:body||"", tag:tag||"tikitaka", renotify:true };
      /* Icono SIEMPRE (antes solo se ponia si DEFAULT_LOGO era http, y es una ruta relativa, asi que nunca se ponia) */
      try{ opts.icon=new URL("./icons/icon-192.png", location.href).href; }catch(e){ opts.icon="./icons/icon-192.png"; }
      try{ opts.badge=new URL("./icons/badge-96.png", location.href).href; }catch(e){ opts.badge="./icons/badge-96.png"; }
      try{ if(typeof DEFAULT_LOGO!=="undefined" && /^https?:\/\//.test(DEFAULT_LOGO)){ opts.icon=DEFAULT_LOGO; } }catch(e){}
      if(navigator.serviceWorker && navigator.serviceWorker.ready){ navigator.serviceWorker.ready.then(function(reg){ try{ reg.showNotification(title, opts); }catch(e){ try{ new Notification(title, opts); }catch(_e){} } }).catch(function(){ try{ new Notification(title, opts); }catch(_e){} }); }
      else { try{ new Notification(title, opts); }catch(e){} }
    }catch(e){}
  }
  function notifyOnceToday(kind, title, body, tag){
    try{ if(!state||!notifSupported()||Notification.permission!=="granted") return false; var k="tikitaka_useful_notif_"+currentUser+"_"+kind+"_"+todayStr(); if(localStorage.getItem(k)) return false; localStorage.setItem(k,"1"); showNotif(title,body,tag||kind); return true; }catch(e){ return false; }
  }
  function maybePrizeReady(){
    try{ if(!state) return; var items=catalogItems().filter(function(x){ return x&&x.enabled!==false&&(+x.cost||0)>0&&(state.points||0)>=(+x.cost||0); }); if(!items.length) return; var item=items.sort(function(a,b){return (+a.cost||0)-(+b.cost||0);})[0]; notifyOnceToday("prize","🎁 ¡Ya puedes canjear un premio!","Ya tienes puntos suficientes para "+item.name+". Entra al catálogo para verlo.","prize-ready"); }catch(e){}
  }
  function notifyGoldenRound(){ notifyOnceToday("golden","⭐ Ronda dorada desbloqueada","Tu racha semanal ha desbloqueado una ronda especial de ruleta.","golden-round"); }

  function requestNotif(){
    if(!notifSupported()){ try{ toast("Tu navegador no admite avisos"); }catch(e){} return Promise.resolve("unsupported"); }
    if(Notification.permission==="granted") return Promise.resolve("granted");
    if(Notification.permission==="denied"){ try{ toast("Avisos bloqueados. Actívalos en los ajustes del navegador."); }catch(e){} return Promise.resolve("denied"); }
    try{ return Notification.requestPermission().then(function(pm){ if(pm==="granted"){ try{ toast("🔔 Avisos activados"); }catch(e){} showNotif("Tiki Taka","¡Avisos activados! Te avisaremos de tus premios y tu racha."); } else { try{ toast("Avisos no activados"); }catch(e){} } return pm; }); }catch(e){ return Promise.resolve("default"); }
  }
  function ensureNotifBtn(){
    /* No interrumpir los primeros accesos: se pide solo tras el primer giro y se aplaza 30 días si se rechaza. */
    try{ if(!notifSupported()||Notification.permission!=="default"||!currentUser||!state||!state.lastSpin) return; var k="tikitaka_notif_later_"+currentUser, until=+(localStorage.getItem(k)||0); if(until>Date.now()||document.getElementById("notifPrompt")) return; var d=document.createElement("div"); d.id="notifPrompt"; d.innerHTML='<div class="np-card"><b>🔔 Activa tus avisos cuando quieras</b><span>Te avisaremos de la tirada diaria, la racha y premios disponibles.</span><button id="notifAllow">Activar avisos</button><button id="notifLater">Ahora no</button></div>'; d.style.cssText='position:fixed;inset:0;z-index:99999;display:grid;place-items:center;background:rgba(0,0,0,.58);padding:20px'; d.querySelector('.np-card').style.cssText='max-width:340px;padding:22px;border-radius:18px;background:#241040;color:#fff;text-align:center;display:grid;gap:12px;box-shadow:0 18px 50px #000'; var bs=d.querySelectorAll('button');bs[0].style.cssText='min-height:46px;border:0;border-radius:10px;background:#ff3651;color:#fff;font-weight:900';bs[1].style.cssText='min-height:42px;border:0;background:transparent;color:#d8d3ee;font-weight:800';d.querySelector('#notifAllow').onclick=function(){requestNotif().then(function(){subscribeClientPush();d.remove();});};d.querySelector('#notifLater').onclick=function(){localStorage.setItem(k,String(Date.now()+30*86400000));d.remove();};document.body.appendChild(d); }catch(e){}
  }
  function maybeStreakReminder(){
    try{
      if(!state || !notifSupported() || Notification.permission!=="granted") return;
      if(currentUser==="demo") return;
      var t=todayStr(); var key="tikitaka_notif_"+currentUser+"_"+t;
      if(localStorage.getItem(key)) return;
      if(state.lastSpin===t) return;
      localStorage.setItem(key,"1");
      if((state.streak||0)>0){ showNotif("🔥 Protege tu racha de "+state.streak+" día"+((state.streak||0)>1?"s":""),"Haz tu giro de hoy: el próximo hito de la racha está cada vez más cerca.","streak"); }
      else { showNotif("🎰 Tu tirada diaria está disponible","Haz girar los rodillos para ganar puntos y desbloquear tiradas de ruleta.","daily"); }
    }catch(e){}
  }
  /* ===== Notificaciones push (Web Push + Supabase Edge Function) ===== */
  function _vapidReady(){ return !!(VAPID_PUBLIC && VAPID_PUBLIC.indexOf("REEMPLAZA")<0); }
  function pushSupported(){ return (typeof navigator!=="undefined" && "serviceWorker" in navigator && "PushManager" in window); }
  function urlB64ToUint8(base64){ try{ var pad="=".repeat((4-base64.length%4)%4); var b64=(base64+pad).replace(/-/g,"+").replace(/_/g,"/"); var raw=atob(b64); var arr=new Uint8Array(raw.length); for(var i=0;i<raw.length;i++){ arr[i]=raw.charCodeAt(i); } return arr; }catch(e){ return new Uint8Array(); } }
  function _samePushKey(current, wanted){
    try{
      var a=new Uint8Array(current||[]), b=new Uint8Array(wanted||[]);
      if(!a.length || a.length!==b.length) return false;
      for(var i=0;i<a.length;i++){ if(a[i]!==b[i]) return false; }
      return true;
    }catch(e){ return false; }
  }
  function _getPushSub(){
    if(!pushSupported() || !_vapidReady() || !notifSupported() || Notification.permission!=="granted") return Promise.resolve(null);
    return navigator.serviceWorker.ready.then(function(reg){
      var wanted=urlB64ToUint8(VAPID_PUBLIC);
      function create(){ return reg.pushManager.subscribe({ userVisibleOnly:true, applicationServerKey:wanted }); }
      return reg.pushManager.getSubscription().then(function(sub){
        if(!sub) return create();
        var current=null;
        try{ current=sub.options && sub.options.applicationServerKey; }catch(e){}
        if(!current || _samePushKey(current,wanted)) return sub;
        return sub.unsubscribe().catch(function(){ return false; }).then(create);
      });
    }).catch(function(){ return null; });
  }
  function subscribeClientPush(){
    try{
      if(!SB_ON || !SB_SECURE || !_CRED.t) return;
      _getPushSub().then(function(sub){ if(!sub) return; try{ sbRpc("app_push_subscribe",{ p_token:_CRED.t, p_sub:sub.toJSON() }).catch(function(){}); }catch(e){} });
    }catch(e){}
  }
  function subscribeAdminPush(){
    try{
      if(!SB_ON || !_admPin) return;
      _getPushSub().then(function(sub){ if(!sub) return; try{ sbRpc("app_admin_push_subscribe",{ p_pin:_admPin, p_sub:sub.toJSON() }).catch(function(){}); }catch(e){} });
    }catch(e){}
  }
  /* ===== Canjes de premios (panel backoffice + control de entregado) ===== */
  var _redemptions = [];
  var _canjeFilter = "pending";
  var _canjeSeen = null;
  var _canjePoll = null;
  var LS_REDEEM = "tikitaka_redemptions";
  function localRedemptions(){ try{ return JSON.parse(localStorage.getItem(LS_REDEEM)||"[]"); }catch(e){ return []; } }
  function saveLocalRedemptions(a){ try{ localStorage.setItem(LS_REDEEM, JSON.stringify((a||[]).slice(0,400))); }catch(e){} }
  function upsertLocalRedemption(row){ var a=localRedemptions(); var f=false; for(var i=0;i<a.length;i++){ if(a[i].id===row.id){ a[i]=Object.assign({},a[i],row); f=true; break; } } if(!f) a.unshift(row); saveLocalRedemptions(a); }
  function recordRedemption(item, today, serverOk, serverId){ try{ var info=(typeof USERS!=="undefined" && USERS[currentUser])?USERS[currentUser]:{}; var rid=serverId||currentUser+"-"+Date.now().toString(36)+Math.random().toString(36).slice(2,5); var row={ id:rid, username:currentUser, bar:(info.bar||info.nombre||currentUser), premio:item.name, puntos:item.cost, created_at:new Date().toISOString(), delivered:false, delivered_at:null, cancelled:false, cancelled_at:null }; upsertLocalRedemption(row); return rid; }catch(e){ return null; } }
  function sbLoadRedemptions(){ if(SB_SECURE && _admPin){ return sbRpc("app_admin_redemptions",{ p_pin:_admPin }).catch(function(){ return null; }); } return Promise.resolve(null); /* [SEGURIDAD] sin via legacy */ }
  function sbSetDelivered(id, delivered){ if(!SB_ON) return Promise.resolve(false); if(SB_SECURE && _admPin){ return sbRpc("app_admin_set_delivered",{ p_pin:_admPin, p_id:id, p_delivered:delivered }).then(function(){ return true; }).catch(function(){ return false; }); } return Promise.resolve(false); /* [SEGURIDAD] sin PATCH directo */ }
  function sbCancelRemote(id){ /* [SEGURIDAD] La cancelacion remota la hace app_cancel_redeem; sin PATCH directo. */ return Promise.resolve(false); }
  function mergeRedemptions(remote){ var map={}; (remote||[]).forEach(function(r){ map[r.id]=r; }); localRedemptions().forEach(function(l){ if(!map[l.id]) map[l.id]=l; }); var arr=Object.keys(map).map(function(k){ return map[k]; }); arr.sort(function(a,b){ return String(b.created_at||"").localeCompare(String(a.created_at||"")); }); return arr; }
  function pendingCount(){ return (_redemptions||[]).filter(function(r){ return !r.delivered && !r.cancelled; }).length; }
  function renderCanjeList(){ var wrap=document.getElementById("canjeList"); if(!wrap) return; var list=_redemptions||[]; var filt=list.filter(function(r){ if(r.cancelled) return _canjeFilter==="all"; if(_canjeFilter==="pending") return !r.delivered; if(_canjeFilter==="delivered") return !!r.delivered; return true; }); var pend=pendingCount(); var badge=document.getElementById("canjeBadge"); if(badge){ badge.textContent=pend?String(pend):""; badge.style.display=pend?"inline-flex":"none"; } if(!filt.length){ wrap.innerHTML='<div class="adm-canje-empty">'+(_canjeFilter==="pending"?"🎉 No hay canjes pendientes":"No hay canjes que mostrar todav\u00eda.")+'</div>'; return; } var h=""; filt.forEach(function(r){ var when=""; if(r.created_at){ try{ when=new Date(r.created_at).toLocaleString("es-ES",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"}); }catch(e){} } h+='<div class="adm-canje-item'+(r.delivered||r.cancelled?" done":"")+'">'; h+='<div class="adm-canje-info"><div class="adm-canje-prize">🎁 '+esc(r.premio||"Premio")+'</div>'; h+='<div class="adm-canje-meta"><b>'+esc(r.bar||r.username||"")+'</b> \u00b7 '+esc(when)+' \u00b7 '+fmt(r.puntos||0)+' pts</div></div>'; if(r.cancelled){ h+='<span style="font-size:12px;padding:6px 12px;border-radius:999px;background:rgba(120,120,120,.25);color:#c9c9c9;font-weight:700;white-space:nowrap">↩️ Cancelado</span>'; } else { h+='<button type="button" class="adm-canje-toggle'+(r.delivered?" done":"")+'" data-id="'+esc(r.id)+'">'+(r.delivered?"\u2713 Entregado":"Marcar entregado")+'</button>'; } h+='</div>'; }); wrap.innerHTML=h; Array.prototype.forEach.call(wrap.querySelectorAll(".adm-canje-toggle"), function(b){ b.onclick=function(){ toggleDelivered(b.getAttribute("data-id")); }; }); }
  function toggleDelivered(id){ var r=null; for(var i=0;i<_redemptions.length;i++){ if(_redemptions[i].id===id){ r=_redemptions[i]; break; } } if(!r) return; var nv=!r.delivered; r.delivered=nv; r.delivered_at=(nv?new Date().toISOString():null); upsertLocalRedemption(r); try{ sbSetDelivered(id, nv); }catch(e){} renderCanjeList(); toast(nv?"Marcado como entregado \u2713":"Marcado como pendiente"); }
  function notifyNewCanjes(newOnes){ if(!newOnes||!newOnes.length) return; try{ ensureAudio(); chime(); }catch(e){} var n=newOnes.length; var f=newOnes[0]; var msg=(n===1)?((f.bar||f.username||"Un cliente")+" ha canjeado: "+f.premio):(n+" nuevos canjes de premios"); try{ toast("🎁 "+msg); }catch(e){} try{ showNotif("Tiki Taka \u00b7 Nuevo canje", msg, "canje"); }catch(e){} }
  function historialCardHtml(){ return '<div class="adm-card" id="sec-historial"><div class="adm-sec">📜 Historial por cliente</div><div class="adm-hint">Registro de todos los premios que ha canjeado cada cliente.</div><button type="button" class="adm-canje-refresh" id="admHistRefresh" style="margin-bottom:10px">↻ Actualizar historial</button><div id="admHistList"><div class="adm-canje-empty">Pulsa «Actualizar historial» para cargar los datos.</div></div></div>'; }
  function renderHistList(){ var wrap=document.getElementById("admHistList"); if(!wrap) return; var list=(_redemptions||[]).slice(); if(!list.length){ wrap.innerHTML='<div class="adm-canje-empty">Todavía no hay premios canjeados.</div>'; return; } var groups={}; list.forEach(function(r){ var key=r.username||r.bar||"?"; if(!groups[key]){ groups[key]={ name:(r.bar||r.username||key), items:[], total:0, count:0, last:0 }; } var gg=groups[key]; gg.items.push(r); gg.count++; gg.total+=(+r.puntos||0); var tt=r.created_at?(Date.parse(r.created_at)||0):0; if(tt>gg.last) gg.last=tt; }); var keys=Object.keys(groups).sort(function(a,b){ return groups[b].last-groups[a].last; }); var h=''; keys.forEach(function(k){ var gg=groups[k]; gg.items.sort(function(a,b){ return (Date.parse(b.created_at||0)||0)-(Date.parse(a.created_at||0)||0); }); var rows=''; gg.items.forEach(function(r){ var when=''; if(r.created_at){ try{ when=new Date(r.created_at).toLocaleString("es-ES",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"}); }catch(e){} } var st=r.cancelled?'rgba(120,120,120,.25);color:#c9c9c9':(r.delivered?'rgba(47,133,90,.25);color:#7fe0a8':'rgba(183,121,31,.25);color:#f0c674'); rows+='<div style="display:flex;flex-wrap:wrap;gap:4px 12px;align-items:center;padding:7px 0;border-bottom:1px solid rgba(255,255,255,.07)"><span style="flex:1;min-width:150px">🎁 '+esc(r.premio||"Premio")+'</span><span style="opacity:.7;font-size:13px">'+esc(when)+'</span><span style="font-weight:700">'+fmt(r.puntos||0)+' pts</span><span style="font-size:12px;padding:2px 9px;border-radius:999px;background:'+st+'">'+(r.cancelled?"↩️ Cancelado":(r.delivered?"✓ Entregado":"⏳ Pendiente"))+'</span></div>'; }); h+='<details style="margin-bottom:8px;background:rgba(255,255,255,.04);border-radius:10px;padding:8px 12px"><summary style="cursor:pointer;font-size:14px;font-weight:600">'+esc(gg.name)+' · '+gg.count+' canje'+(gg.count===1?"":"s")+' · '+fmt(gg.total)+' pts</summary><div style="margin-top:6px">'+rows+'</div></details>'; }); wrap.innerHTML=h; }
  function loadCanjes(isPoll){ if(!isPoll){ _redemptions=mergeRedemptions([]); renderCanjeList(); try{ renderHistList(); }catch(e){} } if(!SB_ON){ if(_canjeSeen===null){ _canjeSeen={}; (_redemptions||[]).forEach(function(r){ _canjeSeen[r.id]=true; }); } return; } sbLoadRedemptions().then(function(rows){ if(rows==null) return; _redemptions=mergeRedemptions(rows); saveLocalRedemptions(_redemptions); if(_canjeSeen===null){ _canjeSeen={}; _redemptions.forEach(function(r){ _canjeSeen[r.id]=true; }); } else { var news=_redemptions.filter(function(r){ return !r.delivered && !r.cancelled && !_canjeSeen[r.id]; }); _redemptions.forEach(function(r){ _canjeSeen[r.id]=true; }); if(news.length) notifyNewCanjes(news); } renderCanjeList(); try{ renderHistList(); }catch(e){} }).catch(function(){}); }
  function startCanjePoll(){ stopCanjePoll(); _canjePoll=setInterval(function(){ var scr=document.getElementById("adminScreen"); if(scr && !scr.hidden){ loadCanjes(true); } else { stopCanjePoll(); } }, 40000); }
  function stopCanjePoll(){ if(_canjePoll){ clearInterval(_canjePoll); _canjePoll=null; } }

  function sbLoadConfig(){ return sbRpc("app_public_config",{}).then(function(d){ if(d){ SB_SECURE=true; return d; } return null; }).catch(function(){ return null; /* [SEGURIDAD] sin via legacy */ }); }
  var _sbCfgTimer=null, _sbCfgVersion=0;
  function configWithoutSecrets(cfg){
    var clean=clone(cfg||{});
    (clean.users||[]).forEach(function(u){ if(u && Object.prototype.hasOwnProperty.call(u,"pass")) delete u.pass; });
    return clean;
  }
  function setAdminSaveState(msg, bad){
    var el=document.getElementById("admSaveState");
    if(el){ el.textContent=msg||""; el.style.color=bad?"#ff9aac":"#9de7cf"; }
  }
  function sbSaveConfigNow(cfg){
    if(!(SB_ON && SB_SECURE && _admPin)) return Promise.reject(new Error("admin_session_required"));
    return sbRpc("app_admin_save_config",{ p_pin:_admPin, p_data:configWithoutSecrets(cfg) }).then(function(r){
      if(!(r && r.ok)) throw new Error((r&&r.error)||"save_failed");
      return r;
    });
  }
  function sbSaveConfig(cfg){
    if(!cfg) return;
    var snapshot=configWithoutSecrets(cfg), version=++_sbCfgVersion;
    if(_sbCfgTimer) clearTimeout(_sbCfgTimer);
    setAdminSaveState("Cambios pendientes…",false);
    _sbCfgTimer=setTimeout(function(){
      _sbCfgTimer=null;
      setAdminSaveState("Guardando…",false);
      sbSaveConfigNow(snapshot).then(function(){ if(version===_sbCfgVersion) setAdminSaveState("✓ Guardado en Supabase",false); })
        .catch(function(){ if(version===_sbCfgVersion) setAdminSaveState("⚠ No se pudo sincronizar",true); });
    },800);
  }
  function checkForceRefresh(cfg){
    try{
      if(!cfg || cfg.rev==null) return;
      var seen=localStorage.getItem("tikitaka_cfg_rev");
      if(seen===null){ localStorage.setItem("tikitaka_cfg_rev", String(cfg.rev)); return; }
      if(String(cfg.rev)!==seen){
        localStorage.setItem("tikitaka_cfg_rev", String(cfg.rev));
        var done=function(){ location.reload(); };
        if(window.caches && caches.keys){ caches.keys().then(function(ks){ return Promise.all(ks.map(function(k){ return caches.delete(k); })); }).then(done).catch(done); }
        else { done(); }
      }
    }catch(e){}
  }
  /* ===== Puntos por recaudacion de maquina =====
     Dos tramos:
       base         3 pts por euro (300 por cada 100 EUR), sobre todo lo recaudado
       crecimiento  pts extra solo por lo que supere la media historica del bar
     La comparacion se hace en euros POR DIA, nunca en euros absolutos, porque
     las visitas de cobro cubren periodos muy distintos (de 5 a 48 dias).
     El tope rentable del bonus lo marca vuestra cuota en cada bar: por encima
     de unos 17 pts/EUR deja de compensar en los bares de cuota baja. */
  var GROWTH_DEFAULT = 15;
  function baseHistorica(u, credits){
    var lista = (credits || []).filter(function(c){
      return c && String(c.u) === String(u) && (+c.dias) > 0 && (+c.eur) > 0;
    });
    if(!lista.length) return null;
    var lim = shiftStr(todayStr(), -90);
    var sel = lista.filter(function(c){ return String(c.date || "") >= lim; });
    if(!sel.length) sel = lista.slice(-3);
    var eur = 0, dias = 0;
    sel.forEach(function(c){ eur += (+c.eur); dias += (+c.dias); });
    return dias > 0 ? (eur / dias) : null;
  }
  function growthRate(u, cfg){
    var porBar = cfg && cfg.growthByBar && cfg.growthByBar[u];
    if(porBar === 0 || porBar) return (+porBar) || 0;
    return (cfg && typeof cfg.growthPerEur === "number") ? cfg.growthPerEur : GROWTH_DEFAULT;
  }
  function calcCreditPoints(u, eur, dias, credits, cfg, per100){
    var base = Math.round(eur / 100 * per100);
    var ref = baseHistorica(u, credits);
    var media = (dias > 0) ? (eur / dias) : null;
    var exceso = 0, bonus = 0;
    if(ref !== null && media !== null && media > ref){
      exceso = (media - ref) * dias;
      bonus = Math.round(exceso * growthRate(u, cfg));
    }
    return { base:base, bonus:bonus, pts:base + bonus, ref:ref, media:media, exceso:exceso };
  }
  function applyRevenueCredits(){
    if(!state || !currentUser) return 0;
    var cfg = (typeof PREVIEW_CFG!=="undefined" && PREVIEW_CFG) ? PREVIEW_CFG : ((typeof ACTIVE_CFG!=="undefined" && ACTIVE_CFG) ? ACTIVE_CFG : null);
    var list = (cfg && cfg.credits) ? cfg.credits : [];
    if(!state.appliedCredits) state.appliedCredits = {};
    var added = 0, changed = false;
    list.forEach(function(c){
      if(!c || !c.id) return;
      if(String(c.u) !== String(currentUser)) return;
      if(state.appliedCredits[c.id]) return;
      var pts = Math.round(+c.pts || 0);
      state.appliedCredits[c.id] = true; changed = true;
      if(pts > 0){
        state.points += pts; added += pts;
        state.history.unshift({ type:"revenue", date:(c.date || todayStr()), label:"Recaudación de máquinas" + (c.concept ? (" · " + c.concept) : ""), delta:pts });
      }
    });
    if(changed) saveState();
    return added;
  }
  function claimRevenueCredits(){
    if(SB_SECURE && _CRED && _CRED.t && currentUser!=="demo"){
      return sbRpc("app_claim_credits",{ p_token:_CRED.t }).then(function(r){
        if(r && r.ok){
          if(typeof r.points==="number"){ state.points=r.points; }
          var added=+r.added||0;
          if(added>0 && Array.isArray(r.claimed)){
            if(!state.appliedCredits) state.appliedCredits={};
            r.claimed.forEach(function(c){
              if(!c || !c.id) return;
              state.appliedCredits[c.id]=true;
              state.history.unshift({ type:"revenue", date:(c.date||todayStr()), label:"Recaudación de máquinas"+(c.concept?(" · "+c.concept):""), delta:(+c.pts||0) });
            });
            try{ saveState(); }catch(e){}
          }
          return added;
        }
        return 0;
      }).catch(function(){ return 0; });
    }
    return Promise.resolve(currentUser==="demo" ? applyRevenueCredits() : 0); /* [SEGURIDAD] creditos locales solo en demo */
  }

  function pad(n){ return String(n).padStart(2, "0"); }
  function ymd(ts){ const d = new Date(ts); return d.getFullYear() + "-" + pad(d.getMonth()+1) + "-" + pad(d.getDate()); }
  function baseNow(){ return Date.now() + (state ? state.dayOffset : 0) * 86400000; }
  /* El servidor decide el dia con (now() at time zone 'Europe/Madrid')::date,
     asi que el cliente debe usar el mismo huso o no coincidiran. Si el
     navegador no soporta Intl con zona, se cae a la hora del dispositivo. */
  var _fmtMadridYmd = null;
  try{ _fmtMadridYmd = new Intl.DateTimeFormat("en-CA", { timeZone:"Europe/Madrid", year:"numeric", month:"2-digit", day:"2-digit" }); }catch(e){ _fmtMadridYmd = null; }
  function ymdMadrid(ts){
    if(!_fmtMadridYmd) return ymd(ts);
    try{ return _fmtMadridYmd.format(new Date(ts)).replace(/\//g, "-"); }catch(e){ return ymd(ts); }
  }
  function todayStr(){ return ymdMadrid(baseNow()); }
  function shiftStr(str, delta){ const p = str.split("-").map(Number); const d = new Date(p[0], p[1]-1, p[2]+delta); return ymd(d.getTime()); }
  function fmt(n){ return Number(n).toLocaleString("es-ES"); }
  function fechaLarga(str){ const p = str.split("-").map(Number); const d = new Date(p[0], p[1]-1, p[2]);
    return d.toLocaleDateString("es-ES", { weekday:"short", day:"2-digit", month:"short" }); }
  function rand(arr){ return arr[Math.floor(Math.random()*arr.length)]; }

  const loginCard = document.getElementById("loginCard");
  const appCard = document.getElementById("appCard");
  const userInput = document.getElementById("userInput");
  const passInput = document.getElementById("passInput");
  const loginMsg = document.getElementById("loginMsg");
  const balance = document.getElementById("balance");
  const spinBtn = document.getElementById("spinBtn");
  const spinNote = document.getElementById("spinNote");
  const winBanner = document.getElementById("winBanner");
  const reels = Array.prototype.slice.call(document.querySelectorAll(".reel"));

  (function makeBulbs(){
    ["bulbsTop","bulbsBot"].forEach(function(id){
      const c = document.getElementById(id); let h = "";
      for (let i=0;i<11;i++){ h += '<span class="bulb" style="animation-delay:' + (i%2?0.5:0) + 's"></span>'; }
      c.innerHTML = h;
    });
  })();

  function loginError(msg){ loginMsg.textContent = msg; loginMsg.className = "login-msg err";
    loginCard.classList.remove("shake"); void loginCard.offsetWidth; loginCard.classList.add("shake"); }

  function tryLogin(){
    const u = (userInput.value || "").trim().toLowerCase();
    const p = passInput.value || "";
    if (!u || !p){ loginError("Introduce usuario y contraseña."); return; }
    loginMsg.textContent = "";
    try{ document.getElementById("loginBtn").disabled = true; }catch(e){}
    secureAuthLogin(u,p).catch(function(){ return "offline"; }).then(function(res){
      try{ document.getElementById("loginBtn").disabled = false; }catch(e){}
      var info=null, serverState=null;
      if(res && res!=="offline"){ info={nombre:res.nombre,bar:res.bar}; serverState=res.state; }
      else if(SB_ON){
        if(res==="offline"){ loginError("⚠️ Sin conexión. Necesitas internet para iniciar sesión."); return; }
        try{ localStorage.removeItem("tikitaka_session"); }catch(e){} loginError("❌ Usuario o contraseña incorrectos."); return;
      }
      else { var li=USERS[u]; if(li && li.pass===p){ info={nombre:li.nombre,bar:li.bar}; } }
      if(!info){ try{ localStorage.removeItem("tikitaka_session"); }catch(e){} loginError("❌ Usuario o contraseña incorrectos."); return; }
      finishLogin(u, info, serverState, ((res && res!=="offline" && res.token) ? res.token : null));
    });
  }

  function finishLogin(u, info, serverState, token){
      currentUser = u; passInput.value = ""; try{ if(token){ localStorage.setItem("tikitaka_session", JSON.stringify({v:2,u:u,t:token,nombre:info.nombre,bar:info.bar})); } else { localStorage.removeItem("tikitaka_session"); } }catch(e){}
      loginCard.style.display = "none"; appCard.style.display = "block"; document.body.classList.remove("login-mode");
      var hello=document.getElementById("hello");
      hello.textContent="Hola, ";
      var who=document.createElement("b"); who.textContent=info.nombre||u;
      hello.appendChild(who);
      hello.appendChild(document.createTextNode(" 👋 · "+(info.bar||info.nombre||u)));
      ensureAudio();
      try{ spinBtn.disabled = true; spinNote.textContent = "Cargando tus datos…"; }catch(e){}
      var applyLoaded=function(st){
        var localState = loadState(u);
        state = st;
        /* El progreso de bienvenida no puede desaparecer al renovar sesión o cambiar contraseña. */
        if(localState && localState.onboardingRoulette) state.onboardingRoulette=true;
        _sbLoggedLen[u] = (state.history || []).length;
        render(true);
        try{ var _db=document.getElementById("demoBar"); if(_db){ _db.style.display = (currentUser==="demo") ? "" : "none"; } }catch(e){}
        claimRevenueCredits().then(function(_rev){
          if(_rev > 0){ renderHistory(); celebrateRevenue(_rev); }
          try{ if(SB_SECURE) refreshPlayer(); }catch(e){}
        });
        try{ ensureNotifBtn(); }catch(e){}
        try{ subscribeClientPush(); }catch(e){}
      };
      if(serverState && typeof serverState==="object" && Object.keys(serverState).length){ applyLoaded(Object.assign(defaultState(), serverState)); }
      else { sbLoadState(u).then(applyLoaded); }
      window.scrollTo(0, 0);
  }

  function resumeSession(){ /* [SEGURIDAD] reanudar con token; la contraseña ya no se guarda en el dispositivo */
    var _sess=null; try{ _sess=JSON.parse(localStorage.getItem("tikitaka_session")||"null"); }catch(e){}
    if(!_sess || !_sess.u || currentUser) return;
    if(_sess.t){
      sbRpc("app_resume",{ p_token:_sess.t }).then(function(res){
        if(res && res.ok){ SB_SECURE=true; _CRED.u=_sess.u; _CRED.t=_sess.t; finishLogin(_sess.u, { nombre:(res.nombre||_sess.u), bar:(res.bar||"") }, (res.state||{})); }
        else if(res && (res.error==="auth" || res.error==="expired")){ try{ localStorage.removeItem("tikitaka_session"); }catch(e){} }
      }).catch(function(){ try{ finishLogin(_sess.u,{nombre:_sess.nombre||_sess.u,bar:_sess.bar||""},null); }catch(e){} });
    }
    else if(_sess.p){ userInput.value=_sess.u; passInput.value=_sess.p||""; tryLogin(); } /* migración desde formato antiguo: un solo uso para obtener token */
  }

  function logout(){ var _oldToken=_CRED&&_CRED.t; if(_oldToken){ try{ sbRpc("app_logout",{p_token:_oldToken}).catch(function(){}); }catch(e){} } try{ localStorage.removeItem("tikitaka_session"); }catch(e){} try{ _CRED.u=null; _CRED.t=null; }catch(e){} currentUser = ""; state = null; appCard.style.display = "none"; loginCard.style.display = "block"; document.body.classList.add("login-mode"); userInput.value = ""; passInput.value = ""; }
  function forceLogout(){ /* [SEGURIDAD] token caducado o invalido: cerrar sesion */ try{ toast("Tu sesión ha caducado. Vuelve a iniciar sesión."); }catch(e){} logout(); }

  /* ===== RANKING de bares (anonimo, por periodo) ===== */
  var _rankPeriod="month";
  window.tkRankPeriod=function(p){ _rankPeriod=p; loadRanking(); };
  function rankPeriodLabel(){ return _rankPeriod==="month"?"este mes":(_rankPeriod==="year"?"este año":"histórico"); }
  function rankPillsHtml(){
    function pill(p,l){ return '<button type="button" class="rk-pill'+(_rankPeriod===p?" on":"")+'" data-rp="'+p+'">'+l+'</button>'; }
    return '<div class="rk-pills">'+pill("month","📅 Mes")+pill("year","🗓️ Año")+pill("all","🏅 Histórico")+'</div>';
  }
  function tkRankBadge(rank){ return rank===1?"🥇":(rank===2?"🥈":(rank===3?"🥉":("#"+rank))); }
  function loadRanking(){
    var wrap=document.getElementById("rankingWrap"); if(!wrap) return;
    if(!(SB_ON && SB_SECURE && _CRED.t) || currentUser==="demo"){ wrap.innerHTML='<div class="rk-empty">El ranking estará disponible cuando inicies sesión con tu bar y empieces a jugar. 🎰</div>'; return; }
    wrap.innerHTML=rankPillsHtml()+'<div class="rk-empty">Cargando ranking…</div>';
    sbRpc("app_leaderboard",{ p_token:_CRED.t, p_top:20, p_period:_rankPeriod }).then(function(res){
      if(!res || !res.ok){ wrap.innerHTML=rankPillsHtml()+'<div class="rk-empty">No se pudo cargar el ranking ahora mismo.</div>'; return; }
      renderRanking(res);
    }).catch(function(){ wrap.innerHTML=rankPillsHtml()+'<div class="rk-empty">No se pudo cargar el ranking. Si es la primera vez, ejecuta <b>app_leaderboard.sql</b> en Supabase.</div>'; });
  }
  function renderRanking(res){
    var wrap=document.getElementById("rankingWrap"); if(!wrap) return;
    var me=res.me||null, top=res.top||[], total=res.total||top.length;
    var info=(typeof USERS!=="undefined" && USERS[currentUser])?USERS[currentUser]:{}; var myName=esc(info.bar||info.nombre||currentUser);
    var plab=rankPeriodLabel();
    var h=rankPillsHtml();
    if(me){
      h+='<div class="rk-hero"><div class="rk-hero-lab">Tu posición · '+plab+'</div><div class="rk-hero-rank">'+tkRankBadge(me.rank)+'<span class="rk-hero-of"> de '+total+' bares</span></div>';
      if(me.rank>1 && me.gap_to_next>0){ h+='<div class="rk-hero-gap">🔥 Te faltan <b>'+fmt(me.gap_to_next)+' pts</b> para adelantar al puesto #'+(me.rank-1)+'</div>'; }
      else if(me.rank===1){ h+='<div class="rk-hero-gap">👑 ¡Eres el número 1 '+plab+'! No dejes que te alcancen.</div>'; }
      h+='</div>';
    }
    h+='<div class="rk-list">';
    var meInTop=false;
    for(var i=0;i<top.length;i++){ var r=top[i]; if(r.me) meInTop=true;
      var cls="rk-row"+(r.me?" me":"")+(r.rank<=3?" podium":"");
      var name=r.me?('🍺 '+myName+' <span class="rk-you">TÚ</span>'):'Bar anónimo';
      h+='<div class="'+cls+'"><span class="rk-pos">'+tkRankBadge(r.rank)+'</span><span class="rk-name">'+name+'</span><span class="rk-pts">'+fmt(r.points)+'<small> pts</small></span></div>';
    }
    h+='</div>';
    if(me && !meInTop){ h+='<div class="rk-sep">•  •  •</div><div class="rk-list"><div class="rk-row me"><span class="rk-pos">#'+me.rank+'</span><span class="rk-name">🍺 '+myName+' <span class="rk-you">TÚ</span></span><span class="rk-pts">'+fmt(me.points)+'<small> pts</small></span></div></div>'; }
    if(!top.length){ h+='<div class="rk-empty">Aún no hay puntuaciones '+plab+'. ¡Sé de los primeros! 🎰</div>'; }
    h+='<div class="rk-foot">🔒 Ranking anónimo: solo tú ves el nombre de tu bar. Puntos <b>ganados</b> ('+plab+'), sin descontar los premios que canjees.</div>';
    wrap.innerHTML=h;
  }
  window.tkLoadRanking=loadRanking;
  try{ document.addEventListener("click",function(ev){ var t=ev.target; while(t && t!==document){ if(t.classList && t.classList.contains("rk-pill")){ var p=t.getAttribute("data-rp"); if(p) window.tkRankPeriod(p); break; } t=t.parentNode; } }); }catch(e){}

  function spunToday(){ return state.lastSpin === todayStr(); }

  function render(initial){
    if (initial){ balance.textContent = fmt(state.points); }
    renderStreak();
    renderMilestones();
    renderOnboarding();
    renderSpinState();
    renderCatalog();
    maybePrizeReady();
    renderBet();
    renderHistory();
    renderMyCanjes();
    if (state && state.pendingBox){ setTimeout(function(){ openBoxPicker(); }, 600); }
  }

  /* ===== Vigencia de la racha =====
     El valor guardado solo vale si la ultima tirada fue hoy o ayer. Si se
     salto un dia la racha esta muerta y debe mostrarse como cero, aunque el
     numero antiguo siga almacenado hasta la proxima tirada. */
  function rachaViva(){
    if(!state) return 0;
    var s = state.streak || 0;
    if(s <= 0) return 0;
    var hoy = todayStr();
    if(state.lastSpin === hoy || state.lastSpin === shiftStr(hoy, -1)) return s;
    return 0;
  }
  function rachaPerdida(){ return !!(state && (state.streak || 0) > 0 && rachaViva() === 0); }

  function renderOnboarding(){ var e=document.getElementById("onboarding"); if(!e||!state)return; var a=[['🎰','Primer giro',!!state.lastSpin],['🎡','Probar ruleta',!!state.onboardingRoulette || !!(state.bets&&state.bets.count)],['🎁','Abrir premios',!!state.onboardingCatalog],['🔥','Día 3',rachaViva()>=3]],n=a.filter(function(x){return x[2]}).length;if(n===4){e.innerHTML='';return}e.innerHTML='<div style="margin:14px 0;padding:13px;border:1px solid rgba(93,238,255,.4);border-radius:14px;background:rgba(53,172,230,.12);color:#fff"><b>🚀 Tus primeros pasos · '+n+'/4</b><div style="display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:10px">'+a.map(function(x){return '<span style="padding:7px;border-radius:8px;background:'+(x[2]?'rgba(53,173,104,.25)':'rgba(0,0,0,.2)')+'">'+(x[2]?'✓ ':x[0]+' ')+x[1]+'</span>'}).join('')+'</div></div>'; }

  function renderStreak(){
    const el = document.getElementById("streak");
    const s = rachaViva();
    if (s <= 0){ el.innerHTML = rachaPerdida() ? "💔 Racha perdida · empieza otra hoy" : "🔥 Empieza tu racha hoy"; }
    else { el.innerHTML = "🔥 Racha de <b style='margin:0 3px'>" + s + "</b> día" + (s===1?"":"s") + " seguido" + (s===1?"":"s"); }
  }

  function renderMilestones(){
    renderStreakHero();
    const wrap = document.getElementById("siMilestones");
    if (!wrap) return;
    const s = rachaViva();
    let html = "";
    CYCLE_MILESTONES.forEach(function(m){
      const done = s >= m.day;
      const val = m.box ? ("🎁 " + Math.min.apply(null,BOX_VALUES) + "-" + Math.max.apply(null,BOX_VALUES)) : ("+" + m.bonus + " pts");
      html += `<div class="si-chip ${done ? "done" : ""}"><span class="si-days">${done ? "✓ " : ""}Día ${m.day}</span><span class="si-bonus">${m.name}<br>${val}</span></div>`;
    });
    wrap.innerHTML = html;
  }
  function nextStreakGoal(s){
    for(var i=0;i<CYCLE_MILESTONES.length;i++){ if(CYCLE_MILESTONES[i].day > s){ var m=CYCLE_MILESTONES[i]; return { day:m.day, left:(m.day - s), box:!!m.box, bonus:m.bonus }; } }
    return null;
  }
  function renderStreakHero(){
    var el=document.getElementById("streakHero"); if(!el||typeof state==="undefined"||!state) return;
    var s=rachaViva(); var goal=nextStreakGoal(s); var head="", sub="";
    if(state.pendingBox){ head="🎁 ¡Tienes una caja sorpresa esperando!"; sub="Elígela abajo y gana hasta <b>"+Math.max.apply(null,BOX_VALUES)+" puntos</b>."; }
    else if(rachaPerdida()){ head="💔 Has perdido tu racha"; sub="Faltaste un día y la cuenta vuelve a empezar. Gira hoy para arrancar una racha nueva. 🎁"; }
    else if(s<=0){ head="🔥 ¡Empieza tu racha y gana premios!"; sub="Entra a jugar cada día: al <b>3er</b> y <b>6º</b> día ganas <b>+"+STREAK_STEP_BONUS+" pts</b>, y al <b>7º</b> eliges una <b>caja sorpresa</b> de hasta "+Math.max.apply(null,BOX_VALUES)+" pts. 🎁"; }
    else if(s>=7){ head="🎁 ¡Hoy eliges tu caja sorpresa!"; sub="Elige 1 de 3 cajas y llévate <b>"+BOX_VALUES.join(", ")+" puntos</b>. Después empieza una racha nueva."; }
    else if(goal && goal.box){ head=(goal.left===1)?"🎁 ¡Mañana eliges tu caja sorpresa!":("🎁 Te faltan "+goal.left+" días para tu caja sorpresa"); sub="Vuelve "+(goal.left===1?"mañana":("y juega "+goal.left+" días seguidos"))+", elige 1 de 3 cajas y gana <b>"+BOX_VALUES.join(", ")+" puntos</b>."; }
    else if(goal){ head=(goal.left===1)?"🔥 ¡Solo te falta 1 día para tu premio!":("🔥 Te faltan "+goal.left+" días para tu premio"); sub="Entra cada día y al llegar al <b>día "+goal.day+"</b> ganas <b>+"+goal.bonus+" pts</b>. ¡Y al 7º día, caja sorpresa de hasta "+Math.max.apply(null,BOX_VALUES)+" pts! 🎁"; }
    else { head="🔥 ¡Sigue jugando cada día!"; sub="Mantén tu racha para seguir ganando premios."; }
    var track="";
    for(var d=1; d<=7; d++){ var cls="sh-day"; if(d<=s) cls+=" done"; else if(d===s+1) cls+=" next"; var badge="·"; if(d===3||d===6){ cls+=" mile"; badge="+"+STREAK_STEP_BONUS; } else if(d===7){ cls+=" box"; badge="🎁"; } track+='<div class="'+cls+'"><span class="sh-badge">'+badge+'</span><span class="sh-dot"></span><span class="sh-num">'+d+'</span></div>'; }
    el.innerHTML='<div class="sh-headline">'+head+'</div><div class="sh-sub">'+sub+'</div><div class="sh-track">'+track+'</div>';
  }
  function isImageSymbol(v){ return typeof v==="string" && ((/^(data:image\/|blob:|https?:\/\/|\.{0,2}\/)/i).test(v) || (/\.(png|jpe?g|webp|gif|svg)(\?|$)/i).test(v)); }
  function symbolMarkup(v){ if(isImageSymbol(v)){ var safe=String(v).replace(/&/g,"&amp;").replace(/"/g,"&quot;"); return '<img class="symbol-img" src="'+safe+'" alt="">'; } return '<span class="symbol-emoji">'+String(v==null?"":v).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")+'</span>'; }
  function symFromCode(code){
    if(code==="J"||code==="j") return CUR_SYM.jackpot;
    if(code==="P"||code==="p") return CUR_SYM.prize;
    var f=(CUR_SYM.fillers&&CUR_SYM.fillers.length)?CUR_SYM.fillers:DEFAULT_SYM.fillers;
    var n=(typeof code==="number")?code:parseInt(code,10); if(isNaN(n)) n=0;
    return f[((n%f.length)+f.length)%f.length] || f[0] || "\u26bd";
  }
  function symsFromCodes(codes){
    if(!codes||!codes.length) return null;
    var out=[]; for(var i=0;i<5;i++){ out.push(symFromCode(codes[i])); } return out;
  }
  function setReelsStatic(symbols){
    for (let i=0;i<5;i++){
      const strip = reels[i].querySelector(".strip");
      const mid = (symbols && symbols[i]) ? symbols[i] : "⚽";
      const top = rand(ALL_SYMBOLS), bot = rand(ALL_SYMBOLS);
      strip.style.transition = "none";
      strip.innerHTML = '<div class="cell">' + symbolMarkup(top) + '</div><div class="cell">' + symbolMarkup(mid) + '</div><div class="cell">' + symbolMarkup(bot) + '</div>';
      strip.style.transform = "translateY(0)";
    }
  }

  /* ===== Cuenta atras hasta la proxima tirada ===== */
  var _cdTimer = null;
  /* Milisegundos hasta la medianoche local, respetando el dayOffset del modo demo. */
  var _fmtMadridHms = null;
  try{ _fmtMadridHms = new Intl.DateTimeFormat("en-GB", { timeZone:"Europe/Madrid", hour:"2-digit", minute:"2-digit", second:"2-digit", hour12:false }); }catch(e){ _fmtMadridHms = null; }
  /* Tiempo hasta la medianoche de Madrid. Se resta la hora actual en vez de
     construir una fecha, para no pelearse con el cambio de hora. */
  function msHastaProximaTirada(){
    var n = baseNow();
    if(_fmtMadridHms){
      try{
        var p = _fmtMadridHms.format(new Date(n)).split(":");
        var h = +p[0], m = +p[1], s = +p[2];
        if(h === 24) h = 0;
        return ((23 - h) * 3600 + (59 - m) * 60 + (60 - s)) * 1000;
      }catch(e){}
    }
    var d = new Date(n);
    var next = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1, 0, 0, 0, 0).getTime();
    return Math.max(0, next - n);
  }
  function fmtCuenta(ms){
    var s = Math.floor(ms / 1000);
    return pad(Math.floor(s / 3600)) + ":" + pad(Math.floor((s % 3600) / 60)) + ":" + pad(s % 60);
  }
  function pararCuenta(){ if(_cdTimer){ clearInterval(_cdTimer); _cdTimer = null; } }
  function ticCuenta(){
    /* Al pasar la medianoche, todayStr() cambia y spunToday() pasa a false solo. */
    if(!state || !spunToday()){
      pararCuenta();
      renderSpinState();
      try{ toast("🎰 ¡Ya tienes una nueva tirada disponible!"); }catch(e){}
      return;
    }
    var el = document.getElementById("cdTime");
    if(!el){ pararCuenta(); return; }
    el.textContent = fmtCuenta(msHastaProximaTirada());
  }
  function arrancarCuenta(){ pararCuenta(); ticCuenta(); _cdTimer = setInterval(ticCuenta, 1000); }
  /* Apaga los rodillos en gris y superpone el cartel con la cuenta atras. */
  function bloquearRodillos(on){
    var box = document.querySelector(".reels");
    if(box) box.classList.toggle("locked", !!on);
  }

  function renderSpinState(){
    refreshSymbols();
    if (spunToday()){
      spinBtn.disabled = true;
      spinBtn.textContent = "✓ YA JUGADO";
      spinNote.textContent = "Vuelve mañana para tu próxima tirada 🔥";
      bloquearRodillos(true);
      arrancarCuenta();
      setReelsStatic(state.lastSymbols || [CUR_SYM.fillers[0], CUR_SYM.prize, CUR_SYM.jackpot, CUR_SYM.prize, CUR_SYM.fillers[1]||CUR_SYM.fillers[0]]);
      if (state.lastWin){ showBanner(state.lastWin, true); }
    } else {
      pararCuenta();
      bloquearRodillos(false);
      spinBtn.disabled = false;
      spinBtn.textContent = "GIRAR";
      spinNote.textContent = "Tienes 1 tirada gratis hoy · ¡mucha suerte!";
      setReelsStatic([CUR_SYM.jackpot, CUR_SYM.fillers[0], CUR_SYM.prize, CUR_SYM.fillers[1]||CUR_SYM.jackpot, CUR_SYM.jackpot]);
      winBanner.classList.remove("show");
    }
  }

  /* ===== Premios de la tirada diaria =====
     Media de 22,2 pts (antes 110). El peso de los puntos debe venir de la
     recaudacion de la maquina, no del juego gratis.
     OJO: la misma tabla vive en app_spin (servidor) y esa manda sobre esta.
     No se reutiliza el 100 como tope porque era el premio base del baremo
     viejo y sigue guardado en los historiales. */
  const TIER_TOP = 120, TIER_MID = 60, TIER_LOW = 20;
  /* Traduce los valores de baremos anteriores (500/300/100 y 50/30/10). */
  function normTier(t){
    if(t === 1200 || t === 500 || t === 50 || t === 120) return TIER_TOP;
    if(t === 600 || t === 300 || t === 30 || t === 60) return TIER_MID;
    if(t === 200 || t === 100 || t === 10 || t === 20) return TIER_LOW;
    return t;
  }
  function rollTier(){ const r = Math.random()*100; if (r < 1) return TIER_TOP; if (r < 4) return TIER_MID; return TIER_LOW; }
  function targetFor(tier){
    tier = normTier(tier);
    if (tier === TIER_TOP) return [WIN50, WIN50, WIN50, WIN50, WIN50];
    if (tier === TIER_MID) return [WIN30, WIN30, WIN30, WIN30, WIN30];
    let out; do { out=[rand(SYMBOLS),rand(SYMBOLS),rand(SYMBOLS),rand(SYMBOLS),rand(SYMBOLS)]; } while (out.every(function(x){ return x===out[0]; }));
    return out;
  }
  function buildStrip(strip, target){
    const n = 30; let html = "";
    for (let i=0;i<n;i++){
      const sym = (i === n-2) ? target : rand(ALL_SYMBOLS);
      html += '<div class="cell">' + symbolMarkup(sym) + '</div>';
    }
    strip.innerHTML = html;
    return n;
  }

  function spin(){
    if (!state || spinning || spunToday()) return;
    spinning = true; ensureAudio(); refreshSymbols();
    spinBtn.disabled = true; winBanner.classList.remove("show");
    document.getElementById("lever").classList.add("pulled");
    setTimeout(function(){ document.getElementById("lever").classList.remove("pulled"); }, 480);
    whir();
    secureSpin().then(function(_sr){
    if(_sr && _sr.ok===false){ spinning=false; if(_sr.error==="already"){ state.lastSpin=todayStr(); } else if(_sr.error==="auth"){ forceLogout(); } else if(_sr.error==="offline"){ try{ toast("⚠️ Sin conexión con el servidor. Inténtalo de nuevo."); }catch(e){} } _serverSpin=null; renderSpinState(); return; }
    _serverSpin = (_sr && _sr.ok) ? _sr : null;
    const tier = _serverSpin ? _serverSpin.tier : rollTier();
    const target = (_serverSpin && _serverSpin.symbols) ? (symsFromCodes(_serverSpin.symbols) || targetFor(tier)) : targetFor(tier);
    const durs = [1750, 2050, 2350, 2650, 3000];
    let done = 0;
    for (let i=0;i<5;i++){
      const reel = reels[i];
      const strip = reel.querySelector(".strip");
      const n = buildStrip(strip, target[i]);
      strip.style.transition = "none"; strip.style.transform = "translateY(0)";
      void strip.offsetHeight;
      const h = strip.children[0].getBoundingClientRect().height;
      reel.classList.add("spinning");
      strip.style.transition = "transform " + durs[i] + "ms cubic-bezier(.12,.62,.2,1)";
      strip.style.transform = "translateY(" + (-(n-3)*h) + "px)";
      (function(idx, reelEl){
        setTimeout(function(){
          reelEl.classList.remove("spinning"); tick(); done++;
          if (done === 5){ settle(tier, target); }
        }, durs[idx] + 60);
      })(i, reel);
    }
    });
  }

  function settle(tier, target){
    spinning = false;
    const today = todayStr();
    const yest = shiftStr(today, -1);
    var prevStreak = state.streak || 0;
    state.streak = (state.lastSpin === yest && prevStreak > 0 && prevStreak < 7) ? (prevStreak + 1) : 1;
    state.lastSpin = today; state.lastSymbols = target; state.lastWin = tier;
    const prev = state.points; state.points += tier;
    const label = tier===TIER_TOP ? "¡JACKPOT! Tirada diaria" : (tier===TIER_MID ? "¡Triple! Tirada diaria" : "Tirada diaria");
    state.history.unshift({ type:"spin", date:today, label:label, delta:tier });
    var stepBonus = 0;
    if (state.streak === 3 || state.streak === 6){ stepBonus = STREAK_STEP_BONUS; state.points += stepBonus; state.history.unshift({ type:"spin", date:today, label:"🔥 Bonus de racha (" + state.streak + " días seguidos)", delta:stepBonus }); }
    var boxDay = (state.streak === 7);
    if (boxDay){ state.pendingBox = true; }
    if(_serverSpin){ state.points=_serverSpin.points; state.streak=_serverSpin.streak; state.pendingBox=!!_serverSpin.pendingBox; }
    var _bsAward;
    if(_serverSpin && typeof _serverSpin.betSpins==="number"){ _bsAward=(typeof _serverSpin.betSpinsAward==="number")?_serverSpin.betSpinsAward:0; state.betSpins=_serverSpin.betSpins; _serverSpins=_serverSpin.betSpins; }
    else { _bsAward=1+Math.floor(Math.random()*3); state.betSpins=((state.betSpins||0)+_bsAward); }
    if(_bsAward>0){ state.history.unshift({ type:"bet", date:today, label:"\uD83C\uDFA1 +"+_bsAward+" tirada"+(_bsAward>1?"s":"")+" de ruleta", delta:0 }); }
    saveState();
    renderStreak(); renderMilestones(); renderOnboarding(); renderSpinState(); renderCatalog(); renderHistory(); try{ renderBet(); }catch(e){}
    countUp(balance, prev, state.points, 900);
    celebrate(tier);
    if(_bsAward>0){ setTimeout(function(){ try{ showPop("\uD83C\uDFA1", "+"+_bsAward, "tirada"+(_bsAward>1?"s":"")+" de ruleta", "pop-30"); }catch(e){} try{ renderBet(); }catch(e){} }, 1500); }
    /* Deja que el usuario vea la combinación final y su premio antes de cambiar de juego. */
    setTimeout(function(){ if(isBetEnabled() && betSpinsLeft()>0){ setGame("bet"); } }, 5200);
    if (stepBonus){ setTimeout(function(){ showPop("🔥", "+" + stepBonus + " pts", "¡Bonus de racha! " + state.streak + " días seguidos", "pop-30"); launchConfetti(120, PAL_RED); }, 2700); }
    if (boxDay){ setTimeout(function(){ openBoxPicker(); }, 2700); }
  }

  function celebrate(tier){
    tier = (tier===50?500:(tier===30?300:(tier===10?100:tier)));
    const rect = document.querySelector(".reels").getBoundingClientRect();
    const cx = rect.left + rect.width/2, cy = rect.top + rect.height/2;
    const slotEl = document.querySelector(".slot");
    if (tier === TIER_TOP){
      jackpotFanfare(); flashScreen();
      if (!reducedMotion()){ slotEl.classList.remove("jackpot-shake"); void slotEl.offsetWidth; slotEl.classList.add("jackpot-shake"); setTimeout(function(){ slotEl.classList.remove("jackpot-shake"); }, 900); }
      launchConfetti(150, PAL_GOLD);
      setTimeout(function(){ launchConfetti(120, PAL_GOLD); }, 420);
      setTimeout(function(){ launchConfetti(120, PAL_RED); }, 840);
      spawnCoins(cx, cy);
      spawnCherries(); setTimeout(spawnCherries, 500); setTimeout(spawnCherries, 1000);
      showPop(CUR_SYM.jackpot, "+"+tier+" pts", "¡JACKPOT!", "pop-50");
    } else if (tier === TIER_MID){
      chimeWin(); launchConfetti(160, PAL_BLUE); spawnCoins(cx, cy);
      showPop(CUR_SYM.prize, "+"+tier+" pts", "¡Premio especial!", "pop-30");
    } else {
      chimeSmall(); launchConfetti(70, PAL_RED);
      showPop(CUR_SYM.fillers[0]||"⚽", "+"+tier+" pts", "¡Tirada de hoy!", "pop-10");
    }
    showBanner(tier, false);
  }

  function showBanner(tier, silent){
    tier = normTier(tier);
    var sym = tier===TIER_TOP ? WIN50 : (tier===TIER_MID ? WIN30 : (CUR_SYM.fillers[0]||"⚽"));
    var label = tier===TIER_TOP ? "JACKPOT" : (tier===TIER_MID ? "PREMIO ESPECIAL" : "PREMIO");
    winBanner.innerHTML = '<span class="win-symbol">'+symbolMarkup(sym)+'</span><span class="win-copy"><b>'+label+'</b><span>Has ganado <strong>+'+tier+' puntos</strong></span></span>';
    winBanner.classList.add("show");
  }

  /* ===== Ruleta de apuestas (multiplicadores) · logica en servidor (app_bet) con fallback ===== */
  var BET_DEFAULT = { enabled:true, min:100, max:1000, perDay:3, segments:[{mult:0,w:15},{mult:0.5,w:45},{mult:1,w:110},{mult:1.5,w:18},{mult:2,w:8},{mult:3,w:3},{mult:5,w:1}] };
  var BET_COLORS = ["#7a1f3d","#2b6cb0","#2f855a","#b7791f","#c05621","#9b2c2c","#553c9a","#0f766e"];
  var BET_MULT_COLORS = { "0.5":"#9b2c2c", "1":"#2b6cb0", "1.5":"#2f855a", "2":"#b7791f", "3":"#c05621", "5":"#553c9a" };
  function betColor(m,i){ return BET_MULT_COLORS[String(m)] || BET_COLORS[i%BET_COLORS.length]; }
  function assignBetColors(layout, custom){ var used={}, map={}, pi=0; custom=custom||{}; (layout||[]).forEach(function(m){ var k=String(m); if(!(k in map)){ var cc=custom[k]; if(cc && /^#[0-9a-fA-F]{3,8}$/.test(cc)){ map[k]=cc; used[String(cc).toLowerCase()]=1; } } }); (layout||[]).forEach(function(m){ var k=String(m); if(k in map) return; var fc=BET_MULT_COLORS[k]; if(fc && !used[fc.toLowerCase()]){ map[k]=fc; used[fc.toLowerCase()]=1; } }); (layout||[]).forEach(function(m){ var k=String(m); if(k in map) return; var c=null; for(var t=0;t<BET_COLORS.length;t++){ var cand=BET_COLORS[(pi+t)%BET_COLORS.length]; if(!used[cand.toLowerCase()]){ c=cand; pi=(pi+t+1)%BET_COLORS.length; break; } } if(!c){ c=BET_COLORS[pi%BET_COLORS.length]; pi++; } map[k]=c; used[c.toLowerCase()]=1; }); return (layout||[]).map(function(m){ return map[String(m)]; }); }
  /* Reparto VISUAL de la rueda: mismas probabilidades, pero x1 y x0.5 repartidas y nunca juntas (un premio entre medias) */
  function segRowHtml(seg, color){ var m=(seg&&seg.mult!=null)?seg.mult:1; var w=(seg&&seg.w!=null)?seg.w:1; var col=(color&&/^#[0-9a-fA-F]{3,8}$/.test(color))?color:(BET_MULT_COLORS[String(m)]||"#2b6cb0"); return '<div class="adm-seg-row" style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:8px;background:rgba(255,255,255,.05);padding:10px;border-radius:10px">'+'<span style="display:flex;align-items:center;gap:4px;font-weight:700">x<input type="number" class="adm-seg-mult adm-num" step="0.1" min="0" value="'+esc(String(m))+'" style="width:72px"></span>'+'<span style="display:flex;align-items:center;gap:4px;font-size:14px">peso <input type="number" class="adm-seg-w adm-num" step="1" min="0" value="'+esc(String(w))+'" style="width:72px"></span>'+'<span class="adm-seg-pct" style="min-width:56px;opacity:.85;font-size:13px;font-weight:700">–</span>'+'<input type="color" class="adm-seg-color" value="'+esc(col)+'" title="Color en la ruleta" style="width:44px;height:30px;border:none;background:none;cursor:pointer;padding:0">'+'<button type="button" class="adm-seg-del" title="Eliminar" style="margin-left:auto;background:rgba(155,44,44,.35);border:none;color:#ffc0c0;border-radius:8px;padding:6px 11px;cursor:pointer;font-weight:700">✕</button>'+'</div>'; }
  function recalcSegPct(){ var rows=document.querySelectorAll(".adm-seg-row"); var tot=0, er=0, arr=[]; Array.prototype.forEach.call(rows,function(row){ var mi=row.querySelector(".adm-seg-mult"), wi=row.querySelector(".adm-seg-w"); var m=parseFloat(mi&&mi.value); var w=parseFloat(wi&&wi.value); if(isNaN(w)||w<0) w=0; if(isNaN(m)) m=0; tot+=w; er+=w*m; arr.push([row,w]); }); arr.forEach(function(d){ var sp=d[0].querySelector(".adm-seg-pct"); if(sp){ var pc=tot>0?(d[1]/tot*100):0; sp.textContent=(Math.round(pc*10)/10)+"%"; } }); var ret=document.getElementById("admSegRet"); if(ret){ var avg=tot>0?(er/tot):0; ret.textContent="Retorno medio: x"+(Math.round(avg*100)/100); ret.style.color=(avg>1)?"#ff8a8a":"#7fe0a8"; } }
  function wheelLayout(segs){ var mults=(segs||[]).map(function(s){ return s.mult; }); var has=function(m){ return mults.indexOf(m)>=0; }; var pref=[1,1.5,1,2,1,3,1,5]; var ok=mults.length && pref.every(function(m){ return has(m); }) && mults.every(function(m){ return pref.indexOf(m)>=0; }); return ok?pref.slice():mults.slice(); }
  var _betBusy = false, _betRot = 0, _serverBets = null, _serverSpins = null;
  function activeBetCfg(){
    var cfg=(typeof PREVIEW_CFG!=="undefined"&&PREVIEW_CFG)?PREVIEW_CFG:((typeof ACTIVE_CFG!=="undefined"&&ACTIVE_CFG)?ACTIVE_CFG:null);
    var b=(cfg&&cfg.bet)?cfg.bet:{};
    var segs=(Array.isArray(b.segments)&&b.segments.length)?b.segments:BET_DEFAULT.segments;
    return { enabled:(b.enabled!==false), min:Math.max(1,parseInt(b.min,10)||BET_DEFAULT.min),
      max:Math.max(1,parseInt(b.max,10)||BET_DEFAULT.max), perDay:Math.max(1,parseInt(b.perDay,10)||BET_DEFAULT.perDay),
      segments:segs.map(function(x){ return { mult:parseFloat(x.mult)||0, w:Math.max(0,parseFloat(x.w)||0) }; }), colors:(b.colors && typeof b.colors==="object")?b.colors:{} };
  }
  function betHouseEdge(segs){ var t=0,e=0; segs.forEach(function(x){ t+=x.w; e+=x.w*x.mult; }); return t>0?(e/t):0; }
  function betsUsedToday(){ var t=todayStr(); if(SB_SECURE && _serverBets && _serverBets.date===t && currentUser!=="demo"){ return _serverBets.count||0; } if(!state) return 0; if(!state.bets||state.bets.date!==t){ return 0; } return state.bets.count||0; }
  function betsBumpLocal(){ var t=todayStr(); if(!state.bets||state.bets.date!==t){ state.bets={date:t,count:0}; } state.bets.count=(state.bets.count||0)+1; }
  function betSpinsLeft(){ if(SB_SECURE && _serverSpins!=null && currentUser!=="demo") return _serverSpins; return (state&&typeof state.betSpins==="number")?state.betSpins:0; }
  function localBetPick(segs){ var total=0; segs.forEach(function(x){ total+=x.w; }); if(total<=0) return segs[0]?segs[0].mult:0; var r=Math.random()*total, acc=0, m=0; for(var i=0;i<segs.length;i++){ acc+=segs[i].w; if(r<acc){ m=segs[i].mult; break; } } return m; }
  function secureBet(stake){ if(SB_SECURE && _CRED.t && currentUser!=="demo"){ return sbRpc("app_bet",{ p_token:_CRED.t, p_stake:stake }).catch(function(){ return { ok:false, error:"offline" }; }); } return Promise.resolve(null); }
  function renderBet(){
    var host=document.getElementById("betPanel"); if(!host) return;
    var bc=activeBetCfg();
    if(!bc.enabled){ host.innerHTML=""; try{ applyGameVisibility(); }catch(e){} return; }
    try{ applyGameVisibility(); }catch(e){}
    var layout=wheelLayout(bc.segments), n=layout.length, step=360/n, grad=[], labels="", _bcolors=assignBetColors(layout, (bc&&bc.colors)||{});
    for(var i=0;i<n;i++){
      var c=_bcolors[i];
      grad.push(c+" "+(i*step)+"deg "+((i+1)*step)+"deg");
      var ang=i*step+step/2;
      labels+='<div class="bet-seg-label" style="transform:rotate('+ang+'deg)"><span style="transform:translate(-50%,-84px) rotate('+(-ang)+'deg)">x'+layout[i]+'</span></div>';
    }
    var left=betSpinsLeft();
    var pts=state?state.points:0;
    var golden=!!(state&&state.goldenRound);
    host.innerHTML =
      '<div class="bet-card game-cabinet '+(golden?'golden-cabinet':'')+'">'+
        '<div class="bet-marquee">'+(golden?'⭐ RULETA DORADA':'\uD83C\uDFA1 RULETA DE LA SUERTE')+'</div>'+
        '<button type="button" class="game-switch-btn" id="betBack"><span>\uD83C\uDFB0</span> Cambiar a Rodillos</button>'+
        (golden?'<div class="golden-round"><span class="gr-crown">♛</span><span><b>RONDA DORADA</b><small>Tu giro semanal exclusivo</small></span><span class="gr-stars">✦ ✦</span></div>':'')+
        '<div class="bet-sub">Elige un nivel de juego: cuanto mayor sea, mayor puede ser el premio. Tus puntos nunca disminuyen. Tienes <b>'+left+'</b> tirada'+(left===1?'':'s')+' disponible'+(left===1?'':'s')+'.</div>'+
        '<div class="bet-wheel-wrap">'+
          '<div class="bet-pointer"></div>'+
          '<div class="bet-wheel" id="betWheel" style="background:conic-gradient('+grad.join(",")+')">'+labels+'</div>'+
          '<div class="bet-hub">\uD83C\uDFAF</div>'+
        '</div>'+
        '<div class="bet-result" id="betResult">Elige el nivel de premio \uD83D\uDC47</div>'+
        '<div class="bet-controls">'+
          '<button type="button" class="bet-step" id="betMinus">\u2212</button>'+
          '<input type="number" id="betStake" class="bet-stake" min="'+bc.min+'" max="'+bc.max+'" step="'+bc.min+'" value="'+bc.min+'">'+
          '<button type="button" class="bet-step" id="betPlus">\uFF0B</button>'+
        '</div>'+
        '<button type="button" class="bet-go" id="betGo">JUGAR Y SUMAR</button>'+
        '<div class="bet-foot">Nivel '+bc.min+'\u2013'+bc.max+' \u00b7 tiradas de ruleta: <b id="betLeft">'+left+'</b> \u00b7 saldo <b>'+fmt(pts)+'</b> pts</div>'+
        '<div class="bet-big" id="betBig"></div>'+
      '</div>';
    var stakeInp=document.getElementById("betStake");
    var clamp=function(){ var v=parseInt(stakeInp.value,10)||bc.min; v=Math.max(bc.min,Math.min(bc.max,v)); stakeInp.value=v; return v; };
    document.getElementById("betMinus").onclick=function(){ stakeInp.value=(parseInt(stakeInp.value,10)||bc.min)-bc.min; clamp(); };
    document.getElementById("betPlus").onclick=function(){ stakeInp.value=(parseInt(stakeInp.value,10)||bc.min)+bc.min; clamp(); };
    stakeInp.onchange=clamp;
    document.getElementById("betGo").onclick=function(){ placeBet(clamp()); };
    (function(){ var _bb=document.getElementById("betBack"); if(_bb) _bb.onclick=function(){ setGame("slot"); }; })();
    if(left<=0){ document.getElementById("betGo").disabled=true; document.getElementById("betResult").textContent="No tienes tiradas de ruleta. \u00a1Gana m\u00e1s girando los rodillos! \uD83C\uDFB0"; }
  }
  function placeBet(stake){
    if(_betBusy) return;
    var bc=activeBetCfg();
    var resEl=document.getElementById("betResult"), goEl=document.getElementById("betGo");
    if(!state){ return; }
    if(betSpinsLeft()<=0){ if(resEl) resEl.textContent="No tienes tiradas de ruleta. Gira los rodillos para ganar m\u00e1s \uD83C\uDFB0"; return; }
    var goldenPlay=!!(state&&state.goldenRound);
    state.onboardingRoulette=true; saveState(); renderOnboarding();
    /* En iPhone/Android hay que esperar a que el contexto de audio se reanude desde este toque. */
    playRouletteAudio();
    _betBusy=true; goEl.disabled=true; resEl.textContent=goldenPlay?"Ronda dorada en juego… ⭐":"Girando\u2026 \uD83C\uDF40";
    var wheel=document.getElementById("betWheel");
    var segs=bc.segments, layout=wheelLayout(bc.segments), n=layout.length, step=360/n;
    var finish=function(mult, newPts, left){
      var _mm=[]; for(var i=0;i<n;i++){ if(layout[i]===mult){ _mm.push(i); } }
      var idx=_mm.length?_mm[Math.floor(Math.random()*_mm.length)]:0;
      var target=360*6 + (360 - (idx*step + step/2));
      _betRot += (target - (_betRot % 360));
      wheel.style.transition="transform 3.4s cubic-bezier(.15,.85,.2,1)";
      wheel.style.transform="rotate("+_betRot+"deg)";
      setTimeout(function(){
        var prev=state.points;
        if(typeof newPts==="number"){ state.points=newPts; } else { state.points = prev + Math.max(1,Math.floor(stake*mult)); }
        if(typeof left!=="number"){ state.betSpins=Math.max(0,((state.betSpins||0)-1)); }
        var delta=state.points-prev;
        var lbl = "\uD83C\uDFA1 Ruleta x"+mult+" (+"+delta+")";
        state.history.unshift({ type:"bet", date:todayStr(), label:lbl, delta:delta });
        saveState();
        renderCatalog(); renderHistory();
        countUp(balance, prev, state.points, 800);
        if(mult>=2){ launchConfetti(140, (typeof PAL_GOLD!=="undefined"?PAL_GOLD:undefined)); try{ chime(); }catch(e){} }
        if(goldenPlay){ state.goldenRound=false; saveState(); launchConfetti(90, (typeof PAL_GOLD!=="undefined"?PAL_GOLD:undefined)); }
        resEl.innerHTML='<span class="bet-win">\uD83C\uDF89 x'+mult+' \u00b7 +'+delta+' pts</span>';
        var _big=document.getElementById("betBig");
        if(_big){ var _bc2="bb-win", _bm="¡Sumas +"+delta+" pts!"; _big.innerHTML='<div class="bb-mult '+_bc2+'">x'+mult+'</div><div class="bb-msg '+_bc2+'">'+_bm+'</div>'; _big.classList.add("show"); setTimeout(function(){ _big.classList.remove("show"); }, 850); }
        var usedLeft = (typeof left==="number") ? left : betSpinsLeft();
        var lEl=document.getElementById("betLeft"); if(lEl) lEl.textContent=usedLeft;
        if(typeof left==="number"){ _serverSpins=left; state.betSpins=left; }
        _betBusy=false; goEl.disabled=(usedLeft<=0);
        if(usedLeft<=0) setGame("slot");
      }, 3500);
    };
    secureBet(stake).then(function(sr){
      if(sr && sr.ok){ finish(parseFloat(sr.mult)||0, sr.points, (typeof sr.betSpins==="number"?sr.betSpins:undefined)); }
      else if(sr===null){ finish(localBetPick(segs)); } /* demo: tirada local */
      else if(sr && sr.error==="limit"){ _betBusy=false; goEl.disabled=true; resEl.textContent="No tienes tiradas de ruleta. Gira los rodillos para ganar m\u00e1s \uD83C\uDFB0"; }
      else if(sr && sr.error==="disabled"){ _betBusy=false; renderBet(); }
      else if(sr && sr.error==="auth"){ _betBusy=false; forceLogout(); }
      else { _betBusy=false; goEl.disabled=false; resEl.textContent="⚠️ Sin conexión con el servidor. Inténtalo de nuevo."; }
    }).catch(function(){ _betBusy=false; goEl.disabled=false; resEl.textContent="⚠️ Sin conexión con el servidor. Inténtalo de nuevo."; });
  }
  function refreshPlayer(){
    if(!SB_SECURE || !_CRED.t || !state || _betBusy || currentUser==="demo") return;
    sbRpc("app_state",{ p_token:_CRED.t }).then(function(r){
      if(!r || r.ok!==true) return;
      var prev=state.points, changed=false;
      if(typeof r.points==="number" && r.points!==state.points){ state.points=r.points; changed=true; }
      if(typeof r.betsToday==="number"){ _serverBets={date:todayStr(), count:r.betsToday}; }
      if(typeof r.betSpins==="number"){ _serverSpins=r.betSpins; state.betSpins=r.betSpins; }
      if(typeof r.streak==="number") state.streak=r.streak;
      if(r.lastSpin!==undefined) state.lastSpin=r.lastSpin;
      try{ renderCatalog(); }catch(e){}
      try{ renderBet(); }catch(e){}
      try{ if(typeof renderSpinState==="function") renderSpinState(); if(typeof renderStreak==="function") renderStreak(); }catch(e){}
      if(changed){ try{ countUp(balance, prev, state.points, 500); }catch(e){} try{ localStorage.setItem(stateKey(currentUser), JSON.stringify(state)); }catch(e){} }
    }).catch(function(){});
  }
  var _playerPoll=null;
  function startPlayerSync(){ try{ document.addEventListener("visibilitychange", function(){ if(!document.hidden){ refreshPlayer(); try{ if(_cdTimer) ticCuenta(); }catch(e){} } else { try{ maybeStreakReminder(); }catch(e){} } }); }catch(e){} if(_playerPoll) clearInterval(_playerPoll); _playerPoll=setInterval(function(){ if(!document.hidden) refreshPlayer(); }, 25000); }
  try{ startPlayerSync(); }catch(e){}
  function renderCatalog(){
    const wrap = document.getElementById("catalog");
    const catalog=catalogItems();
    const pts = state.points || 0;
    function progColor(p){ if(p < 40) return "linear-gradient(90deg,#FF3651,#C8102E)"; if(p < 75) return "linear-gradient(90deg,#FFD24B,#FF9D2E)"; return "linear-gradient(90deg,#9df0b8,#2f9d5a)"; }
    function emj(it){ return (it && it.image) ? '<img class="r-img" src="'+it.image+'" alt="">' : (it ? (it.emoji||"") : ""); }
    var TIER_CLASS = { "Regalos":"t1", "Electrónica":"t2", "Viajes":"t3" };
    var heroHtml = "";
    var locked = catalog.filter(function(x){ return x.cost > pts; });
    if (locked.length){
      var nx = locked.slice().sort(function(a,b){ return (a.cost-pts)-(b.cost-pts); })[0];
      var gidxN = catalog.indexOf(nx);
      var pctN = nx.cost ? Math.max(0, Math.min(100, Math.round(pts/nx.cost*100))) : 0;
      heroHtml = '<div class="next-prize" data-idx="' + gidxN + '"><div class="np-badge">🎯 Tu próximo premio</div><div class="np-body">' +
                   '<div class="np-emoji">' + emj(nx) + '</div>' +
                   '<div class="np-info"><div class="np-name">' + nx.name + '</div>' +
                     '<div class="np-bar"><div class="np-fill" style="width:' + pctN + '%;background:' + progColor(pctN) + '"></div></div>' +
                     '<div class="np-meta"><span>' + fmt(pts) + ' / ' + fmt(nx.cost) + ' pts</span><b>Te faltan ' + fmt(nx.cost - pts) + '</b></div>' +
                   '</div></div></div>';
    } else if (catalog.length){
      var best = catalog.slice().sort(function(a,b){ return b.cost-a.cost; })[0];
      var gidxB = catalog.indexOf(best);
      heroHtml = '<div class="next-prize ready" data-idx="' + gidxB + '"><div class="np-badge">✨ ¡Puedes canjear cualquier premio!</div><div class="np-body">' +
                   '<div class="np-emoji">' + emj(best) + '</div>' +
                   '<div class="np-info"><div class="np-name">' + best.name + '</div>' +
                     '<div class="np-meta"><span>Tienes ' + fmt(pts) + ' pts</span></div>' +
                     '<button class="r-btn ok np-btn" data-idx="' + gidxB + '">Canjear ahora</button>' +
                   '</div></div></div>';
    }
    let html = heroHtml;
    TIER_ORDER.forEach(function(tier){
      const items = catalog.filter(function(x){ return x.tier === tier; });
      if (!items.length) return;
      var tc = TIER_CLASS[tier] || "t1";
      html += '<div class="tier"><div class="tier-name">' + tier + ' <span class="tier-badge">' + (TIER_TAG[tier]||"") + '</span></div><div class="rewards">';
      items.forEach(function(item){
        const gidx = catalog.indexOf(item);
        const can = pts >= item.cost;
        var pct = item.cost ? Math.max(0, Math.min(100, Math.round(pts/item.cost*100))) : 100;
        html += '<div class="reward ' + tc + (can ? " can" : " locked") + '" data-idx="' + gidx + '">' +
                  '<div class="r-shine"></div>' +
                  '<div class="r-emoji">' + emj(item) + '</div>' +
                  '<div class="r-name">' + item.name + '</div>' +
                  '<div class="r-cost">' + fmt(item.cost) + ' pts</div>' +
                  (can ? '<button class="r-btn ok" data-idx="' + gidx + '">Canjear</button>'
                       : '<div class="r-prog"><div class="r-prog-fill" style="width:' + pct + '%;background:' + progColor(pct) + '"></div></div><div class="r-need">' + pct + '% · faltan ' + fmt(item.cost - pts) + '</div>') +
                '</div>';
      });
      html += '</div></div>';
    });
    wrap.innerHTML = html;
    Array.prototype.forEach.call(wrap.querySelectorAll(".r-btn.ok"), function(b){
      b.addEventListener("click", function(e){ e.stopPropagation(); redeem(parseInt(b.getAttribute("data-idx"), 10)); });
    });
    Array.prototype.forEach.call(wrap.querySelectorAll(".reward[data-idx], .next-prize[data-idx]"), function(c){
      c.style.cursor = "pointer";
      c.addEventListener("click", function(){ openPrizeModal(parseInt(c.getAttribute("data-idx"), 10)); });
    });
  }

  function openPrizeModal(idx){
    var it = catalogItems()[idx];
    if(!it) return;
    var pts = (state && state.points) || 0;
    var can = pts >= it.cost;
    var pct = it.cost ? Math.max(0, Math.min(100, Math.round(pts/it.cost*100))) : 100;
    var tag = (typeof TIER_TAG!=="undefined" && TIER_TAG[it.tier]) ? TIER_TAG[it.tier] : (it.tier||"");
    function pcolor(p){ if(p<40) return "linear-gradient(90deg,#FF3651,#C8102E)"; if(p<75) return "linear-gradient(90deg,#FFD24B,#FF9D2E)"; return "linear-gradient(90deg,#9df0b8,#2f9d5a)"; }
    var icon = it.image ? '<img src="' + it.image + '" alt="">' : '<span class="pm-emoji">' + (it.emoji || "🎁") + '</span>';
    var foot = can
      ? '<button class="pm-btn ok" id="pmRedeem">Canjear premio</button>'
      : '<div class="pm-prog"><div class="pm-prog-fill" style="width:' + pct + '%;background:' + pcolor(pct) + '"></div></div>'
        + '<div class="pm-need">' + pct + '% · te faltan ' + fmt(it.cost - pts) + ' pts</div>'
        + '<button class="pm-btn no" disabled>Sigue jugando para conseguirlo</button>';
    var ov = document.getElementById("prizeModal");
    if(!ov) return;
    ov.innerHTML = '<div class="pm-card" onclick="event.stopPropagation()">'
      + '<button class="pm-x" id="pmClose" aria-label="Cerrar">×</button>'
      + (tag ? '<div class="pm-badge">' + esc(tag) + '</div>' : '')
      + '<div class="pm-icon">' + icon + '</div>'
      + '<div class="pm-name">' + esc(it.name) + '</div>'
      + (it.desc ? '<div class="pm-desc">' + esc(it.desc) + '</div>' : '')
      + '<div class="pm-cost">' + fmt(it.cost) + ' pts</div>'
      + foot
      + '</div>';
    ov.classList.add("show");
    ov.setAttribute("aria-hidden", "false");
    var close = function(){ ov.classList.remove("show"); ov.setAttribute("aria-hidden", "true"); ov.innerHTML = ""; };
    ov.onclick = close;
    var xb = document.getElementById("pmClose"); if(xb) xb.onclick = close;
    var rb = document.getElementById("pmRedeem"); if(rb) rb.onclick = function(){ close(); redeem(idx); };
  }

  function redeem(idx){
    const item = catalogItems()[idx];
    if (!item || state.points < item.cost) return;
    const today = todayStr();
    var _finish=function(newPoints, serverOk, serverId){
      const prev = state.points;
      state.points = (typeof newPoints==="number") ? newPoints : (prev - item.cost);
      var _cid = recordRedemption(item, today, serverOk, serverId);
      state.history.unshift({ type:"redeem", date:today, label:"Canje: " + item.name, delta:-item.cost, canjeId:_cid });
      saveState();
      renderCatalog(); renderHistory(); renderMyCanjes();
      countUp(balance, prev, state.points, 800);
      postCanje(item, today);
      launchConfetti(140); chime();
      showPop(item.emoji, "¡Canjeado!", item.name);
    };
    if(currentUser==="demo"){ _finish(undefined, false); return; } /* demo: canje local */
    if(!(SB_SECURE && _CRED.t)){ toast("⚠️ Necesitas conexión para canjear premios."); return; } /* [SEGURIDAD] fallo cerrado */
    secureRedeem(item).then(function(sr){
        if(sr && sr.ok){ _finish(sr.points, true, sr.id); }
        else if(sr && sr.error==="funds"){ toast("No tienes puntos suficientes"); }
        else if(sr && sr.error==="noprize"){ toast("Ese premio ya no está disponible"); }
        else if(sr && sr.error==="auth"){ forceLogout(); }
        else { toast("⚠️ No se pudo completar el canje. Inténtalo de nuevo."); }
      }).catch(function(){ toast("⚠️ No se pudo completar el canje. Inténtalo de nuevo."); });
  }

  function renderMyCanjes(){
    var title=document.getElementById("myCanjesTitle");
    var wrap=document.getElementById("myCanjes");
    if(!wrap) return;
    var mine=localRedemptions().filter(function(r){ return r && r.username===currentUser && !r.delivered && !r.cancelled; });
    if(!mine.length){ if(title) title.style.display="none"; wrap.innerHTML=""; return; }
    if(title) title.style.display="";
    mine.sort(function(a,b){ return String(b.created_at||"").localeCompare(String(a.created_at||"")); });
    var h="";
    mine.forEach(function(r){
      var when=""; if(r.created_at){ try{ when=new Date(r.created_at).toLocaleString("es-ES",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"}); }catch(e){} }
      h+='<div style="display:flex;align-items:center;gap:10px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.14);border-radius:14px;padding:11px 13px;margin-bottom:8px">';
      h+='<div style="flex:1;min-width:0"><div style="font-weight:800;font-size:14.5px">🎁 '+esc(r.premio||"Premio")+'</div><div style="font-size:12.5px;opacity:.75;margin-top:2px">'+esc(when)+' · '+fmt(r.puntos||0)+' pts · ⏳ Pendiente de entrega</div></div>';
      h+='<button type="button" class="mycanje-cancel" data-id="'+esc(r.id)+'" style="white-space:nowrap;background:rgba(255,255,255,.06);border:1px solid rgba(255,120,120,.45);color:#ff9d9d;border-radius:10px;padding:9px 13px;font-family:inherit;font-size:13px;font-weight:800;cursor:pointer">↩️ Cancelar</button>';
      h+='</div>';
    });
    wrap.innerHTML=h;
    Array.prototype.forEach.call(wrap.querySelectorAll(".mycanje-cancel"), function(b){ b.onclick=function(){ cancelRedeem(b.getAttribute("data-id")); }; });
  }
  function cancelRedeem(id){
    if(!state) return;
    var arr=localRedemptions(); var row=null;
    for(var i=0;i<arr.length;i++){ if(arr[i].id===id){ row=arr[i]; break; } }
    if(!row){ toast("No se encontró ese canje"); return; }
    if(row.delivered){ toast("Este premio ya fue entregado, no se puede cancelar"); renderMyCanjes(); return; }
    if(row.cancelled){ renderMyCanjes(); return; }
    if(!confirm("¿Cancelar el canje de \""+row.premio+"\" y recuperar "+fmt(row.puntos||0)+" puntos?")) return;
    var _apply=function(newPoints, serverOk){
      var prev=state.points;
      state.points=(typeof newPoints==="number") ? newPoints : (prev + (+row.puntos||0));
      row.cancelled=true; row.cancelled_at=new Date().toISOString();
      upsertLocalRedemption(row);
      state.history.unshift({ type:"cancel", date:todayStr(), label:"Canje cancelado: "+row.premio, delta:(+row.puntos||0) });
      saveState();
      if(!serverOk){ try{ sbCancelRemote(row.id); }catch(e){} }
      renderCatalog(); renderHistory(); renderMyCanjes();
      countUp(balance, prev, state.points, 800);
      try{ launchConfetti(70, PAL_GOLD); }catch(e){}
      toast("Canje cancelado · +"+fmt(row.puntos||0)+" pts recuperados");
    };
    if(currentUser==="demo"){ _apply(undefined, false); return; } /* demo: cancelacion local */
    if(!(SB_SECURE && _CRED.t)){ toast("⚠️ Necesitas conexión para cancelar un canje."); return; } /* [SEGURIDAD] fallo cerrado */
    secureCancelRedeem(row).then(function(sr){
        if(sr && sr.ok){ _apply(sr.points, true); }
        else if(sr && sr.error==="delivered"){ row.delivered=true; upsertLocalRedemption(row); toast("Este premio ya fue entregado, no se puede cancelar"); renderMyCanjes(); }
        else if(sr && sr.error==="auth"){ forceLogout(); }
        else { toast("⚠️ No se pudo cancelar el canje. Inténtalo de nuevo."); }
      }).catch(function(){ toast("⚠️ No se pudo cancelar el canje. Inténtalo de nuevo."); });
  }
  function renderHistory(){
    const wrap = document.getElementById("history");
    if (!state.history.length){ wrap.innerHTML = '<div class="h-empty">Aún no hay actividad. ¡Haz tu primera tirada! 🎰</div>'; return; }
    let html = "";
    state.history.slice(0, 10).forEach(function(h){
      const pos = h.delta >= 0;
      html += '<div class="h-item">' +
                '<div class="h-ic ' + h.type + '">' + (h.type==="spin" ? "🎰" : (h.type==="revenue" ? "💰" : (h.type==="cancel" ? "↩️" : "🎁"))) + '</div>' +
                '<div class="h-body"><div class="h-label">' + h.label + '</div><div class="h-date">' + fechaLarga(h.date) + '</div></div>' +
                '<div class="h-delta ' + (pos?"pos":"neg") + '">' + (pos?"+":"") + fmt(h.delta) + '</div>' +
              '</div>';
    });
    wrap.innerHTML = html;
  }

  function countUp(el, from, to, dur){
    const start = performance.now();
    function step(now){
      const t = Math.min(1, (now - start) / dur);
      const val = Math.round(from + (to - from) * (1 - Math.pow(1 - t, 3)));
      el.textContent = fmt(val);
      if (t < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  function celebrateRevenue(added){
    if(!(added > 0) || !state) return;
    var _before = state.points - added;
    if(typeof balance !== "undefined" && balance) balance.textContent = fmt(_before);
    setTimeout(function(){ showPop("💰", "+" + fmt(added) + " pts", "Puntos por la recaudación de tu bar", "pop-30"); launchConfetti(80, PAL_GOLD); }, 600);
    setTimeout(function(){ if(typeof balance !== "undefined" && balance) countUp(balance, _before, state.points, 3500); }, 1700);
  }
  function _delay(ms){ return new Promise(function(r){ setTimeout(r, ms); }); }
  function _post(body, attempt){
    attempt = attempt || 1;
    return fetch("/", { method:"POST", headers:{ "Content-Type":"application/x-www-form-urlencoded" }, body: body.toString() })
      .then(function(res){ if (res && res.ok) return true; if (attempt < 5) return _delay(800).then(function(){ return _post(body, attempt+1); }); return false; })
      .catch(function(){ if (attempt < 5) return _delay(800).then(function(){ return _post(body, attempt+1); }); return false; });
  }
  function postCanje(){ /* El canje ya queda registrado de forma atómica en Supabase. */ }

  let actx = null;
  function ensureAudio(){ if(!actx){ try{ actx = new (window.AudioContext||window.webkitAudioContext)(); }catch(e){} } if(actx && actx.state==="suspended") actx.resume(); }
  function chime(){
    if(!actx) return; const t = actx.currentTime;
    [523.25, 659.25, 783.99, 1046.5].forEach(function(f,i){
      const o = actx.createOscillator(), g = actx.createGain(); o.type="triangle"; o.frequency.value=f;
      const st = t + i*0.08; g.gain.setValueAtTime(0.0001, st); g.gain.exponentialRampToValueAtTime(0.10, st+0.02); g.gain.exponentialRampToValueAtTime(0.0004, st+0.4);
      o.connect(g); g.connect(actx.destination); o.start(st); o.stop(st+0.45);
    });
  }
  var _noiseBuf=null;
  function noiseBuffer(dur){ if(!actx) return null; var n=Math.max(1,Math.floor(actx.sampleRate*dur)); var buf=actx.createBuffer(1,n,actx.sampleRate); var d=buf.getChannelData(0); for(var i=0;i<n;i++){ d[i]=Math.random()*2-1; } return buf; }
  function whir(){ if(!actx) return; var t=actx.currentTime; var dur=3.0;
    /* whoosh mecanico suave a partir de ruido filtrado (sustituye al zumbido) */
    try{ var src=actx.createBufferSource(); src.buffer=noiseBuffer(dur);
      var bp=actx.createBiquadFilter(); bp.type="bandpass"; bp.Q.value=0.7; bp.frequency.setValueAtTime(430,t); bp.frequency.linearRampToValueAtTime(230,t+dur);
      var lp=actx.createBiquadFilter(); lp.type="lowpass"; lp.frequency.value=1200;
      var g=actx.createGain(); g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(0.05,t+0.18); g.gain.setValueAtTime(0.05,t+dur-0.7); g.gain.exponentialRampToValueAtTime(0.0004,t+dur);
      src.connect(bp); bp.connect(lp); lp.connect(g); g.connect(actx.destination); src.start(t); src.stop(t+dur); }catch(e){}
    /* ticks de trinquete que desaceleran, como un rodillo real */
    var time=0, step=0.05;
    while(time<dur-0.25){ var tt=t+time;
      var o=actx.createOscillator(), og=actx.createGain(); o.type="triangle"; o.frequency.setValueAtTime(1050,tt);
      og.gain.setValueAtTime(0.028,tt); og.gain.exponentialRampToValueAtTime(0.0004,tt+0.02);
      o.connect(og); og.connect(actx.destination); o.start(tt); o.stop(tt+0.03);
      time+=step; step*=1.055; }
  }
  function playRouletteAudio(){
    ensureAudio();
    if(!actx) return;
    var play=function(){
      /* Señal inequívoca al arrancar: confirma que el dispositivo tiene sonido activo. */
      try{ var t=actx.currentTime, o=actx.createOscillator(), g=actx.createGain(); o.type="sine"; o.frequency.setValueAtTime(440,t); o.frequency.linearRampToValueAtTime(880,t+.12); g.gain.setValueAtTime(.0001,t); g.gain.exponentialRampToValueAtTime(.22,t+.02); g.gain.exponentialRampToValueAtTime(.0005,t+.20); o.connect(g); g.connect(actx.destination); o.start(t); o.stop(t+.22); }catch(e){}
      rouletteWhir();
    };
    try{ if(actx.state==="suspended"){ actx.resume().then(play).catch(function(){}); } else { play(); } }catch(e){ try{ play(); }catch(_e){} }
  }
  function rouletteWhir(){ if(!actx) return; var t=actx.currentTime, dur=3.35;
    try{ var src=actx.createBufferSource(); src.buffer=noiseBuffer(dur); var bp=actx.createBiquadFilter(); bp.type="bandpass"; bp.Q.value=1.1; bp.frequency.setValueAtTime(900,t); bp.frequency.exponentialRampToValueAtTime(230,t+dur); var g=actx.createGain(); g.gain.setValueAtTime(.0001,t); g.gain.exponentialRampToValueAtTime(.08,t+.12); g.gain.exponentialRampToValueAtTime(.0004,t+dur); src.connect(bp); bp.connect(g); g.connect(actx.destination); src.start(t); src.stop(t+dur); }catch(e){}
    var time=.02, step=.055; while(time<dur-.15){ var tt=t+time, o=actx.createOscillator(), og=actx.createGain(); o.type="square"; o.frequency.value=1250; og.gain.setValueAtTime(.06,tt); og.gain.exponentialRampToValueAtTime(.0003,tt+.012); o.connect(og); og.connect(actx.destination); o.start(tt); o.stop(tt+.018); time+=step; step*=1.06; }
  }
  function tick(){ if(!actx) return; var t=actx.currentTime;
    /* golpe grave de bloqueo del rodillo */
    var o=actx.createOscillator(), g=actx.createGain(); o.type="sine"; o.frequency.setValueAtTime(240,t); o.frequency.exponentialRampToValueAtTime(90,t+0.12);
    g.gain.setValueAtTime(0.13,t); g.gain.exponentialRampToValueAtTime(0.0005,t+0.15); o.connect(g); g.connect(actx.destination); o.start(t); o.stop(t+0.16);
    /* clic corto encima */
    try{ var src=actx.createBufferSource(); src.buffer=noiseBuffer(0.05); var hp=actx.createBiquadFilter(); hp.type="highpass"; hp.frequency.value=1600;
      var ng=actx.createGain(); ng.gain.setValueAtTime(0.05,t); ng.gain.exponentialRampToValueAtTime(0.0004,t+0.05); src.connect(hp); hp.connect(ng); ng.connect(actx.destination); src.start(t); src.stop(t+0.06); }catch(e){} }

  function chimeSmall(){ if(!actx) return; const t=actx.currentTime;
    [659.25, 987.77].forEach(function(f,i){ const o=actx.createOscillator(),g=actx.createGain(); o.type="triangle"; o.frequency.value=f;
      const st=t+i*0.09; g.gain.setValueAtTime(0.0001,st); g.gain.exponentialRampToValueAtTime(0.09,st+0.02); g.gain.exponentialRampToValueAtTime(0.0004,st+0.3);
      o.connect(g); g.connect(actx.destination); o.start(st); o.stop(st+0.34); }); }
  function chimeWin(){ if(!actx) return; const t=actx.currentTime;
    [523.25,659.25,783.99,1046.5].forEach(function(f,i){ const o=actx.createOscillator(),g=actx.createGain(); o.type="triangle"; o.frequency.value=f;
      const st=t+i*0.1; g.gain.setValueAtTime(0.0001,st); g.gain.exponentialRampToValueAtTime(0.11,st+0.02); g.gain.exponentialRampToValueAtTime(0.0004,st+0.45);
      o.connect(g); g.connect(actx.destination); o.start(st); o.stop(st+0.5); }); }
  function jackpotFanfare(){ if(!actx) return; const t=actx.currentTime;
    const mel=[523.25,659.25,783.99,1046.5,1318.5,1046.5,1318.5,1568];
    mel.forEach(function(f,i){ const o=actx.createOscillator(),g=actx.createGain(); o.type="sawtooth"; o.frequency.value=f;
      const st=t+i*0.12; g.gain.setValueAtTime(0.0001,st); g.gain.exponentialRampToValueAtTime(0.10,st+0.02); g.gain.exponentialRampToValueAtTime(0.0005,st+0.34);
      o.connect(g); g.connect(actx.destination); o.start(st); o.stop(st+0.38); });
    [523.25,659.25,783.99].forEach(function(f){ const o=actx.createOscillator(),g=actx.createGain(); o.type="triangle"; o.frequency.value=f;
      const st=t+mel.length*0.12; g.gain.setValueAtTime(0.0001,st); g.gain.exponentialRampToValueAtTime(0.08,st+0.03); g.gain.exponentialRampToValueAtTime(0.0004,st+1.0);
      o.connect(g); g.connect(actx.destination); o.start(st); o.stop(st+1.1); }); }
  const pop = document.getElementById("prizePop");
  function showPop(emoji, name, sub, cls){
    var pe=document.getElementById("popEmoji");
    pe.replaceChildren();
    if(isImageSymbol(emoji)){ var im=document.createElement("img"); im.className="prize-symbol-img"; im.src=emoji; im.alt=""; pe.appendChild(im); }
    else { pe.textContent=emoji; }
    document.getElementById("popName").textContent = name;
    document.getElementById("popSub").textContent = sub || "";
    pop.className = "prize-pop" + (cls ? " " + cls : "");
    void pop.offsetWidth; pop.classList.add("show");
    pop.onanimationend = function(){ pop.className = "prize-pop"; };
  }
  var _boxVals = null, _boxDone = false;
  function _boxShuffle(a){ for (var i=a.length-1;i>0;i--){ var j=Math.floor(Math.random()*(i+1)); var t=a[i]; a[i]=a[j]; a[j]=t; } return a; }
  function openBoxPicker(){
    var bp = document.getElementById("boxPop"); if (!bp) return;
    if (bp.classList.contains("show")) return;
    _boxDone = false;
    _boxVals = _boxShuffle(BOX_VALUES.slice());
    document.getElementById("boxTitle").textContent = "🎉 ¡7 días de racha!";
    document.getElementById("boxSub").textContent = "Elige una caja para descubrir tu premio sorpresa";
    var row = document.getElementById("boxRow"); var h = "";
    for (var i=0;i<_boxVals.length;i++){ h += '<div class="box-item" data-i="'+i+'">🎁</div>'; }
    row.innerHTML = h;
    bp.classList.remove("locked");
    Array.prototype.forEach.call(row.querySelectorAll(".box-item"), function(el){ el.onclick = function(){ claimBox(parseInt(el.getAttribute("data-i"),10)); }; });
    bp.classList.add("show");
  }
  function claimBox(i){
    if (_boxDone) return; _boxDone = true;
    var bp = document.getElementById("boxPop"); bp.classList.add("locked");
    var row = document.getElementById("boxRow");
    var _reveal=function(val, serverPts){
      Array.prototype.forEach.call(row.querySelectorAll(".box-item"), function(b){
        var bi = parseInt(b.getAttribute("data-i"),10);
        var showv = (bi===i) ? val : _boxVals[bi];
        b.innerHTML = '<span class="box-val">+'+showv+'</span>';
        if (bi === i){ b.classList.add("opened"); } else { b.classList.add("dim"); }
      });
      document.getElementById("boxTitle").textContent = "🎁 +" + val + " puntos";
      document.getElementById("boxSub").textContent = "¡Enhorabuena! Tu racha se reinicia y empieza un nuevo ciclo.";
      var prev = state.points;
      if(typeof serverPts==="number"){ state.points = serverPts; state.streak = 0; } else { state.points = prev + val; }
      state.pendingBox = false;
      state.goldenRound = true;
      state.history.unshift({ type:"spin", date:todayStr(), label:"🎁 Caja sorpresa (7 días de racha)", delta:val });
      state.history.unshift({ type:"bet", date:todayStr(), label:"⭐ Ronda dorada desbloqueada", delta:0 });
      saveState();
      notifyGoldenRound();
      countUp(balance, prev, state.points, 900);
      launchConfetti(160, PAL_GOLD);
      renderCatalog(); renderHistory();
      setTimeout(function(){ bp.classList.remove("show"); try{ if(betSpinsLeft()>0) setGame("bet"); }catch(e){} }, 2800);
    };
    if(currentUser==="demo"){ _reveal(_boxVals[i]); return; } /* demo: caja local */
    if(!(SB_SECURE && _CRED.t)){ toast("⚠️ Necesitas conexión para abrir la caja."); try{ bp.classList.remove("show"); }catch(e){} return; } /* [SEGURIDAD] fallo cerrado */
    sbRpc("app_pick_box",{ p_token:_CRED.t }).then(function(res){
        if(res && res.ok){ _reveal(res.value, res.points); }
        else if(res && res.ok===false && res.error==="auth"){ forceLogout(); }
        else { toast("⚠️ Sin conexión con el servidor. Prueba de nuevo."); try{ bp.classList.remove("show"); }catch(e){} }
      }).catch(function(){ toast("⚠️ Sin conexión con el servidor. Prueba de nuevo."); try{ bp.classList.remove("show"); }catch(e){} });
  }
  function flashScreen(){ const f = document.getElementById("flash"); f.classList.remove("go"); void f.offsetWidth; f.classList.add("go"); }

  const cc = document.getElementById("confetti");
  const cctx = cc.getContext("2d");
  let confetti = [], coins = [], emojis = [], fxRunning = false;
  function resizeCC(){ cc.width = window.innerWidth; cc.height = window.innerHeight; }
  window.addEventListener("resize", resizeCC); resizeCC();
  function reducedMotion(){ return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches; }
  const TAU = Math.PI * 2;
  const cColors = ["#C8102E","#1A1A1A","#E8C77A","#FFFFFF","#FF3651","#E8C77A"];
  function fxEnsure(){ if(!fxRunning){ fxRunning = true; requestAnimationFrame(fxFrame); } }
  function launchConfetti(count, palette){
    if (reducedMotion()) return; count = count || 120; const pal = palette || cColors;
    for (let i=0;i<count;i++){
      confetti.push({ x: cc.width/2 + (Math.random()-0.5)*260, y: cc.height*0.4,
        vx:(Math.random()-0.5)*12, vy: Math.random()*-13-4, g:0.30+Math.random()*0.12,
        size:6+Math.random()*7, color:pal[Math.floor(Math.random()*pal.length)],
        rot:Math.random()*Math.PI, vr:(Math.random()-0.5)*0.34, life:0 });
    }
    fxEnsure();
  }
  function spawnCoins(cx, cy){
    if (reducedMotion()) return;
    for (let i=0;i<26;i++){
      const ang = -Math.PI/2 + (Math.random()-0.5)*1.7; const sp = 6 + Math.random()*10;
      coins.push({ x:cx+(Math.random()-0.5)*46, y:cy, vx:Math.cos(ang)*sp, vy:Math.sin(ang)*sp,
        g:0.34+Math.random()*0.12, r:7+Math.random()*6, rot:Math.random()*TAU, vr:(Math.random()-0.5)*0.5, life:0, max:80+Math.random()*50 });
    }
    fxEnsure();
  }
  function spawnCherries(){
    if (reducedMotion()) return;
    for (let i=0;i<16;i++){
      emojis.push({ ch:(isImageSymbol(CUR_SYM.jackpot)?"🍒":(CUR_SYM.jackpot||"🍒")), x: Math.random()*cc.width, y:-40 - Math.random()*cc.height*0.3,
        vx:(Math.random()-0.5)*3, vy:2+Math.random()*3.5, g:0.05+Math.random()*0.05,
        size:26+Math.random()*22, rot:Math.random()*TAU, vr:(Math.random()-0.5)*0.12, life:0, max:170+Math.random()*80 });
    }
    fxEnsure();
  }
  function fxFrame(){
    cctx.clearRect(0,0,cc.width,cc.height);
    confetti.forEach(function(p){ p.vy+=p.g; p.x+=p.vx; p.y+=p.vy; p.rot+=p.vr; p.life++;
      cctx.save(); cctx.translate(p.x,p.y); cctx.rotate(p.rot); cctx.fillStyle=p.color; cctx.fillRect(-p.size/2,-p.size/2,p.size,p.size*0.6); cctx.restore(); });
    confetti = confetti.filter(function(p){ return p.y < cc.height+40 && p.life < 300; });
    coins.forEach(function(c){ c.vy+=c.g; c.x+=c.vx; c.y+=c.vy; c.rot+=c.vr; c.life++;
      const sx = Math.max(0.16, Math.abs(Math.cos(c.rot)));
      cctx.save(); cctx.translate(c.x,c.y); cctx.scale(sx,1);
      const rg = cctx.createRadialGradient(-c.r*0.3,-c.r*0.3,1,0,0,c.r); rg.addColorStop(0,"#FDECB6"); rg.addColorStop(0.6,"#E8C77A"); rg.addColorStop(1,"#A9791F");
      cctx.fillStyle=rg; cctx.beginPath(); cctx.arc(0,0,c.r,0,TAU); cctx.fill(); cctx.lineWidth=1.6; cctx.strokeStyle="rgba(120,85,20,.75)"; cctx.stroke(); cctx.restore(); });
    coins = coins.filter(function(c){ return c.y < cc.height+44 && c.life < c.max; });
    emojis.forEach(function(e){ e.vy+=e.g; e.x+=e.vx; e.y+=e.vy; e.rot+=e.vr; e.life++;
      cctx.save(); cctx.translate(e.x,e.y); cctx.rotate(e.rot);
      cctx.font = e.size + "px sans-serif"; cctx.textAlign="center"; cctx.textBaseline="middle";
      cctx.fillText(e.ch,0,0); cctx.restore(); });
    emojis = emojis.filter(function(e){ return e.y < cc.height+50 && e.life < e.max; });
    if (confetti.length || coins.length || emojis.length){ requestAnimationFrame(fxFrame); } else { fxRunning=false; cctx.clearRect(0,0,cc.width,cc.height); }
  }

  function previewSpin(tier){
    if (!state || spinning) return;
    spinning = true;
    document.getElementById("lever").classList.add("pulled");
    setTimeout(function(){ document.getElementById("lever").classList.remove("pulled"); }, 460);
    whir();
    const target = targetFor(tier);
    const durs = [1400, 1650, 1900, 2150, 2400];
    let done = 0;
    for (let i=0;i<5;i++){
      const reel = reels[i]; const strip = reel.querySelector(".strip");
      const n = buildStrip(strip, target[i]);
      strip.style.transition = "none"; strip.style.transform = "translateY(0)"; void strip.offsetHeight;
      const h = strip.children[0].getBoundingClientRect().height;
      reel.classList.add("spinning");
      strip.style.transition = "transform " + durs[i] + "ms cubic-bezier(.12,.62,.2,1)";
      strip.style.transform = "translateY(" + (-(n-3)*h) + "px)";
      (function(idx, reelEl){ setTimeout(function(){ reelEl.classList.remove("spinning"); tick(); done++;
        if (done === 5){ spinning = false; celebrate(tier); setTimeout(renderSpinState, 2800); } }, durs[idx] + 60); })(i, reel);
    }
  }
  document.getElementById("loginBtn").addEventListener("click", tryLogin);
  passInput.addEventListener("keydown", function(e){ if(e.key==="Enter") tryLogin(); });
  userInput.addEventListener("keydown", function(e){ if(e.key==="Enter") passInput.focus(); });
  document.getElementById("logoutBtn").addEventListener("click", logout);
  (function(){ var _pb=document.getElementById("pwdBtn"); if(_pb) _pb.addEventListener("click", function(){ openPwdModal(); }); })();
  var _game = "slot";
  function isBetEnabled(){ try{ var bc=activeBetCfg(); return !!(bc && bc.enabled); }catch(e){ return false; } }
  function applyGameVisibility(){
    var betOn = isBetEnabled();
    if(!betOn || (state && betSpinsLeft()<=0)) _game = "slot";
    var slot = document.querySelector(".slot");
    if(slot) slot.classList.toggle("game-bet", !!(betOn && _game === "bet"));
    try{ renderRuletaCta(); }catch(e){}
  }
  function renderRuletaCta(){
    var el = document.getElementById("ruletaCta"); if(!el) return;
    var betOn = isBetEnabled();
    var left = (typeof betSpinsLeft === "function") ? betSpinsLeft() : (state ? (state.betSpins||0) : 0);
    var slotEl = document.querySelector(".slot");
    var show = !!(betOn && state && left > 0 && _game === "slot");
    if(slotEl) slotEl.classList.toggle("show-rc", show);
    if(!show){ el.innerHTML = ""; return; }
    el.innerHTML = '<div class="rc-inner">'
      + '<div class="rc-emoji">\uD83C\uDFA1</div>'
      + '<div class="rc-txt"><div class="rc-title">\u00a1Tienes ' + left + ' tirada' + (left===1?'':'s') + ' de ruleta!</div>'
      + '<div class="rc-sub">Pulsa para quitar los rodillos y jugar a la ruleta</div></div>'
      + '<button type="button" class="rc-btn" id="rcGo">Cambiar a Ruleta \u2192</button>'
      + '</div>';
    var b = document.getElementById("rcGo"); if(b) b.onclick = function(){ setGame("bet"); };
  }
  function setGame(g){
    if(g === "bet" && !isBetEnabled()) return;
    if(g === _game){ applyGameVisibility(); return; }
    var slotEl = document.querySelector(".slot");
    var reels = slotEl ? slotEl.querySelector(".reels-wrap") : null;
    var betEl = document.getElementById("betPanel");
    var outEl = (_game === "bet") ? betEl : reels;
    var inEl = (g === "bet") ? betEl : reels;
    function finishSwap(){
      if(outEl) outEl.classList.remove("game-leave");
      _game = g;
      applyGameVisibility();
      if(inEl){ inEl.classList.remove("game-anim"); void inEl.offsetWidth; inEl.classList.add("game-anim"); }
    }
    var noMotion = false; try{ noMotion = (typeof reducedMotion==="function") && reducedMotion(); }catch(e){}
    if(outEl && !noMotion){
      outEl.classList.remove("game-anim");
      void outEl.offsetWidth;
      outEl.classList.add("game-leave");
      setTimeout(finishSwap, 220);
    } else {
      finishSwap();
    }
  }
  (function(){ var b1=document.getElementById("gsSlot"), b2=document.getElementById("gsBet"); if(b1) b1.onclick=function(){ setGame("slot"); }; if(b2) b2.onclick=function(){ setGame("bet"); }; try{ applyGameVisibility(); }catch(e){} })();
  document.addEventListener("click",function(e){var b=e.target.closest&&e.target.closest('[data-nav="premios"]');if(b&&state){state.onboardingCatalog=true;saveState();renderOnboarding();}});
  spinBtn.addEventListener("click", spin);
  document.getElementById("lever").addEventListener("click", spin);

  document.getElementById("demoDay").addEventListener("click", function(){ state.dayOffset += 1; saveState(); render(true); });
  document.getElementById("demoPts").addEventListener("click", function(){
    var prev=state.points;
    var applyPts=function(np){ state.points=np; saveState(); renderCatalog(); countUp(balance, prev, state.points, 700); };
    if(SB_SECURE && _CRED.u){
      sbRpc("app_demo_credit",{ p_amount:20000 }).then(function(r){ applyPts((r && r.ok && typeof r.points==="number") ? r.points : (prev+20000)); }).catch(function(){ applyPts(prev+20000); });
    } else { applyPts(prev+2000); }
  });
  document.getElementById("demoStreak").addEventListener("click", function(){ demoAddStreak(); });
  document.getElementById("demoBox").addEventListener("click", function(){ if(currentUser!=="demo") return; state.pendingBox=true; saveState(); openBoxPicker(); });
  document.getElementById("demoGolden").addEventListener("click", function(){ if(currentUser!=="demo") return; state.goldenRound=true; state.betSpins=(state.betSpins||0)+1; state.history.unshift({type:"bet",date:todayStr(),label:"⭐ Ronda dorada de prueba",delta:0}); saveState(); renderBet(); toast("Ronda Dorada activada · entra a la ruleta ⭐"); setGame("bet"); });
  document.getElementById("demoRuleta").addEventListener("click", function(){ if(currentUser!=="demo") return; state.betSpins=(state.betSpins||0)+3; state.history.unshift({type:"bet",date:todayStr(),label:"🎡 +3 tiradas de ruleta de prueba",delta:0}); saveState(); renderBet(); toast("+3 tiradas añadidas"); setGame("bet"); });
  function demoAddStreak(){
    var prevStreak = state.streak || 0;
    state.streak = (prevStreak > 0 && prevStreak < 7) ? (prevStreak + 1) : 1;
    var prev = state.points; var stepBonus = 0;
    if (state.streak === 3 || state.streak === 6){ stepBonus = STREAK_STEP_BONUS; state.points += stepBonus; state.history.unshift({ type:"spin", date:todayStr(), label:"🔥 Bonus de racha (" + state.streak + " días seguidos)", delta:stepBonus }); }
    var boxDay = (state.streak === 7);
    if (boxDay){ state.pendingBox = true; }
    saveState();
    renderStreak(); renderMilestones(); renderOnboarding(); renderCatalog(); renderHistory(); try{ renderBet(); }catch(e){}
    if (stepBonus){ countUp(balance, prev, state.points, 700); showPop("🔥", "+" + stepBonus + " pts", "¡Bonus de racha! " + state.streak + " días seguidos", "pop-30"); launchConfetti(120, PAL_RED); }
    else if (boxDay){ openBoxPicker(); }
    else { toast("Racha demo: día " + state.streak); }
  }
  document.getElementById("demoReset").addEventListener("click", function(){ state = defaultState(); saveState(); render(true); });
  document.getElementById("demoJackpot").addEventListener("click", function(){ previewSpin(50); });
  document.getElementById("demoSpecial").addEventListener("click", function(){ previewSpin(30); });

  /* ===== FONDOS POR TEMPORADA ===== */
  var BG_THEMES = { "default": "./img/bg-default.png", "halloween": "./img/bg-halloween.png", "navidad": "./img/bg-navidad.png" };
  var FORCE_THEME = null;
  /* PIN de admin: validado SOLO en el servidor (app_admin_check) */
  function clone(o){ return JSON.parse(JSON.stringify(o)); }
  var DEFAULT_LOGO = './img/logo.png';
  var BUILTIN = { logo:DEFAULT_LOGO, themes:[ {id:"default",name:"Cl\u00e1sico",img:BG_THEMES["default"], sym:{jackpot:"🍒",prize:"💎",fillers:["⚽","👟","🥅","🎯"]}}, {id:"halloween",name:"Halloween",img:BG_THEMES["halloween"], sym:{jackpot:"🎃",prize:"👻",fillers:["🦇","🕷️","🍬","🕯️"]}}, {id:"navidad",name:"Navidad",img:BG_THEMES["navidad"], sym:{jackpot:"🎄",prize:"���",fillers:["🎅","🔔","⛄","��"]}} ], schedule:[ {themeId:"halloween",from:{m:10,d:15},to:{m:10,d:31}}, {themeId:"navidad",from:{m:12,d:1},to:{m:1,d:6}} ], fallback:"default", override:null, pointsPer100:300, growthPerEur:15, growthByBar:{}, bet:{enabled:true,min:100,max:1000,perDay:3,segments:[{mult:1,w:180},{mult:1.5,w:12},{mult:2,w:5},{mult:3,w:2},{mult:5,w:1}]}, credits:[] };
  var TROPICAL_IMAGE_SYMBOLS = {mode:"images",imageJackpot:"./img/sym-jackpot.webp",imagePrize:"./img/sym-prize.webp",imageFillers:["./img/sym-filler-1.webp","./img/sym-filler-2.webp","./img/sym-filler-3.webp","./img/sym-filler-4.webp","./img/sym-filler-5.webp"]};
  (BUILTIN.themes||[]).forEach(function(t){ if(t.id==="default"){ t.sym=t.sym||{}; t.sym.mode="images"; t.sym.imageJackpot=TROPICAL_IMAGE_SYMBOLS.imageJackpot; t.sym.imagePrize=TROPICAL_IMAGE_SYMBOLS.imagePrize; t.sym.imageFillers=TROPICAL_IMAGE_SYMBOLS.imageFillers.slice(); } });
  var ACTIVE_CFG = clone(BUILTIN);
  function themeMap(cfg){ var m={}; (cfg.themes||[]).forEach(function(t){ m[t.id]=t; }); return m; }
  function inRange(from,to){ var n=new Date(); var md=(n.getMonth()+1)*100+n.getDate(); var a=from.m*100+from.d, b=to.m*100+to.d; return a<=b ? (md>=a&&md<=b) : (md>=a||md<=b); }
  function resolveTheme(cfg){ var map=themeMap(cfg); if(cfg.override && map[cfg.override]) return cfg.override; var s=cfg.schedule||[]; for(var i=0;i<s.length;i++){ if(map[s[i].themeId] && inRange(s[i].from,s[i].to)) return s[i].themeId; } if(cfg.fallback && map[cfg.fallback]) return cfg.fallback; return cfg.themes[0] ? cfg.themes[0].id : null; }
  function paintTheme(cfg,id){ var map=themeMap(cfg); var t=map[id]; if(!t){ t=map[resolveTheme(cfg)]; } if(!t) return; var game=document.querySelector(".slot"), hud=document.querySelector(".balance-wrap"); if(game && t.img){ game.style.setProperty("--game-bg", "url(\""+String(t.img).replace(/\"/g,"%22")+"\")"); } if(hud){ var ph=t.pointsHud||{}; hud.style.setProperty("--hud-color",ph.color||"#18052f"); hud.style.setProperty("--hud-image",ph.image?"url(\""+String(ph.image).replace(/\"/g,"%22")+"\")":"none"); } }
  var PREVIEW_CFG=null;
  function activeSymConfig(){ var cfg=(typeof PREVIEW_CFG!=="undefined"&&PREVIEW_CFG)?PREVIEW_CFG:ACTIVE_CFG; if(!cfg) return null; var map=themeMap(cfg); var t=map[resolveTheme(cfg)]; return (t&&t.sym&&t.sym.jackpot)?t.sym:null; }
  function applyActive(){ var cfg=PREVIEW_CFG||ACTIVE_CFG; applyCfgUsers(cfg); paintTheme(cfg, resolveTheme(cfg)); applyLogo(cfg); refreshSymbols(); try{ if(currentUser) renderBet(); }catch(e){} }
  function applyLogo(cfg){ var img=document.getElementById("brandLogo"); if(!img) return; var src=(cfg&&cfg.logo)||DEFAULT_LOGO; var bm=img.parentNode; if(src){ img.src=src; img.style.display="block"; if(bm&&bm.classList) bm.classList.add("has-logo"); } else { img.removeAttribute("src"); img.style.display="none"; if(bm&&bm.classList) bm.classList.remove("has-logo"); } }
  try{ applyLogo(ACTIVE_CFG); }catch(e){}
  applyActive();
  try { sbLoadConfig().then(function(cfg){ if(cfg){ checkForceRefresh(cfg); } if(cfg && cfg.themes && cfg.themes.length){ ACTIVE_CFG=cfg; applyActive(); if(currentUser){ claimRevenueCredits().then(function(_r){ if(_r>0){ renderHistory(); celebrateRevenue(_r); } }); } } }).catch(function(){}); } catch(e){}

  /* ===== BACKOFFICE (solo administrador) ===== */
  var DRAFT=null;
  var MESES=["","Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
  /* Restaura la sesion guardada para no tener que iniciar sesion tras recargar */
  try{ resumeSession(); }catch(e){}
  function loadDraft(){
    try{
      var s=localStorage.getItem("tikitaka_admin_cfg");
      if(s){ var clean=normalizeCfg(configWithoutSecrets(JSON.parse(s))); localStorage.setItem("tikitaka_admin_cfg",JSON.stringify(clean)); return clean; }
    }catch(e){}
    return normalizeCfg(configWithoutSecrets(ACTIVE_CFG));
  }
  function saveDraft(){
    DRAFT=normalizeCfg(configWithoutSecrets(DRAFT));
    try{ localStorage.setItem("tikitaka_admin_cfg", JSON.stringify(DRAFT)); }catch(e){ return false; }
    try{ sbSaveConfig(DRAFT); }catch(e){}
    return true;
  }
  function publishDraft(){
    DRAFT=normalizeCfg(configWithoutSecrets(DRAFT));
    try{ localStorage.setItem("tikitaka_admin_cfg",JSON.stringify(DRAFT)); }catch(e){}
    if(_sbCfgTimer){ clearTimeout(_sbCfgTimer); _sbCfgTimer=null; }
    ++_sbCfgVersion;
    setAdminSaveState("Guardando…",false);
    return sbSaveConfigNow(DRAFT).then(function(r){ setAdminSaveState("✓ Guardado en Supabase",false); return r; })
      .catch(function(e){ setAdminSaveState("⚠ No se pudo sincronizar",true); throw e; });
  }
  function slug(s){ s=(s||"fondo").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+/,"").replace(/-+$/,""); return s||"fondo"; }
  function uid(base){ var m=themeMap(DRAFT); var id=slug(base), i=2; while(m[id]){ id=slug(base)+"-"+i; i++; } return id; }
  function esc(s){ return String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/\"/g,"&quot;"); }
  var _PWD_INP='width:100%;box-sizing:border-box;margin-bottom:9px;padding:11px 12px;border-radius:10px;border:1px solid #7540af;background:#120522;color:#fff;font-family:inherit;font-size:14px';
  var _PWD_BTN='flex:1;padding:11px;border-radius:10px;border:none;font-family:inherit;font-weight:800;font-size:14px;cursor:pointer';
  function _pwdOverlay(){ var ov=document.createElement("div"); ov.id="pwdOverlay"; ov.setAttribute("style","position:fixed;inset:0;z-index:100000;background:rgba(0,0,0,.62);display:flex;align-items:center;justify-content:center;padding:16px"); document.body.appendChild(ov); ov.addEventListener("click",function(e){ if(e.target===ov){ if(ov.parentNode) ov.parentNode.removeChild(ov); } }); return ov; }
  function openPwdModal(){
    if(!currentUser) return;
    if(document.getElementById("pwdOverlay")) return;
    if(!SB_ON){ toast("El cambio de contrase\u00f1a necesita conexi\u00f3n con el servidor."); return; }
    var ov=_pwdOverlay();
    ov.innerHTML='<div style="background:#1a0a2e;border:1px solid #7540af;border-radius:16px;max-width:340px;width:100%;padding:20px;box-shadow:0 12px 40px rgba(0,0,0,.6)">'+
      '<div style="font-weight:900;font-size:17px;color:#ffe277;margin-bottom:4px">\uD83D\uDD11 Cambiar contrase\u00f1a</div>'+
      '<div style="font-size:12.5px;color:#cbb8e6;margin-bottom:14px">Introduce tu contrase\u00f1a actual y la nueva (m\u00ednimo 4 caracteres).</div>'+
      '<input id="pwdOld" type="password" placeholder="Contrase\u00f1a actual" autocomplete="current-password" style="'+_PWD_INP+'">'+
      '<input id="pwdNew" type="password" placeholder="Nueva contrase\u00f1a" autocomplete="new-password" style="'+_PWD_INP+'">'+
      '<input id="pwdNew2" type="password" placeholder="Repite la nueva" autocomplete="new-password" style="'+_PWD_INP+'">'+
      '<div id="pwdErr" style="color:#ff8a9c;font-size:12px;min-height:16px;margin:0 0 10px"></div>'+
      '<div style="display:flex;gap:8px"><button id="pwdCancel" style="'+_PWD_BTN+';background:rgba(255,255,255,.08);color:#cbb8e6">Cancelar</button>'+
      '<button id="pwdSave" style="'+_PWD_BTN+';background:linear-gradient(135deg,#b7791f,#c05621);color:#fff">Guardar</button></div></div>';
    var close=function(){ if(ov.parentNode) ov.parentNode.removeChild(ov); };
    document.getElementById("pwdCancel").onclick=close;
    document.getElementById("pwdSave").onclick=function(){
      var er=document.getElementById("pwdErr");
      var o=document.getElementById("pwdOld").value, n=document.getElementById("pwdNew").value, n2=document.getElementById("pwdNew2").value;
      if(!o){ er.textContent="Escribe tu contrase\u00f1a actual."; return; }
      if((n||"").length<8){ er.textContent="La nueva debe tener al menos 8 caracteres."; return; }
      if(n!==n2){ er.textContent="Las contrase\u00f1as nuevas no coinciden."; return; }
      er.style.color="#cbb8e6"; er.textContent="Guardando\u2026";
      sbRpc("app_change_password",{ p_username:currentUser, p_old_password:o, p_new_password:n }).then(function(r){
        if(r && r.ok){ close(); toast("\u2705 Contrase\u00f1a actualizada correctamente."); }
        else if(r && r.error==="password"){ er.style.color="#ff8a9c"; er.textContent="La contrase\u00f1a actual no es correcta."; }
        else if(r && r.error==="weak"){ er.style.color="#ff8a9c"; er.textContent="La nueva es demasiado corta."; }
        else { er.style.color="#ff8a9c"; er.textContent="No se pudo cambiar. Int\u00e9ntalo de nuevo."; }
      }).catch(function(){ er.style.color="#ff8a9c"; er.textContent="Sin conexi\u00f3n con el servidor."; });
    };
  }
  function loadAdminPoints(){
    if(!(SB_ON && _admPin)) return;
    var els=document.querySelectorAll(".adm-upts"); if(!els.length) return;
    fetch(SB_URL+"/rest/v1/rpc/app_admin_players",{ method:"POST", headers:sbHeaders(), body:JSON.stringify({ p_pin:_admPin }) })
      .then(function(r){ return r.ok?r.json():null; })
      .then(function(list){
        var map={}; if(list && list.forEach){ list.forEach(function(x){ map[String(x.username).toLowerCase().trim()]=x; }); }
        Array.prototype.forEach.call(els,function(el){ var u=String(el.getAttribute("data-u")||"").toLowerCase().trim(); var rec=map[u]; el.textContent="puntos: "+fmt(rec?rec.points:0); });
      }).catch(function(){});
  }

  function loadAdminUsers(){
    if(!(SB_ON && _admPin)) return;
    fetch(SB_URL+"/rest/v1/rpc/app_admin_users",{ method:"POST", headers:sbHeaders(), body:JSON.stringify({ p_pin:_admPin }) })
      .then(function(r){ return r.ok?r.json():null; })
      .then(function(list){
        if(!(list && list.forEach)){ loadAdminPoints(); return; }
        DRAFT.users=DRAFT.users||[];
        var have={}; DRAFT.users.forEach(function(x){ have[String(x.u).toLowerCase().trim()]=x; });
        var bk={}; try{ Object.keys(BUILTIN_USERS).forEach(function(k){ bk[String(k).toLowerCase()]=1; }); }catch(e){}
        var changed=false;
        list.forEach(function(su){
          var un=String(su.username||"").toLowerCase().trim();
          if(!un || bk[un] || su.is_builtin) return;
          if(have[un]) return;
          DRAFT.users.push({ u:un, pass:"", nombre:su.nombre||un, bar:su.bar||su.nombre||un, _srv:true });
          changed=true;
        });
        if(changed){ renderAdmin(); } else { loadAdminPoints(); }
      }).catch(function(){ try{ loadAdminPoints(); }catch(e){} });
  }

  function openAdminPwdModal2(username){
    if(!username) return;
    if(document.getElementById("pwdOverlay")) return;
    if(!(SB_ON && _admPin)){ toast("El reseteo necesita conexi\u00f3n y sesi\u00f3n de administrador (PIN)."); return; }
    var _uu=String(username).toLowerCase().trim();
    var cur=null; try{ (DRAFT.users||[]).forEach(function(x){ if(x.u===username||x.u===_uu) cur=x; }); }catch(e){}
    var _nom=(cur&&cur.nombre)||username, _bar=(cur&&cur.bar)||_nom;
    var ov=_pwdOverlay();
    ov.innerHTML='<div style="background:#1a0a2e;border:1px solid #7540af;border-radius:16px;max-width:340px;width:100%;padding:20px;box-shadow:0 12px 40px rgba(0,0,0,.6)">'+
      '<div style="font-weight:900;font-size:17px;color:#ffe277;margin-bottom:4px">\uD83D\uDD11 Restablecer contrase\u00f1a</div>'+
      '<div style="font-size:12.5px;color:#cbb8e6;margin-bottom:14px">Cliente: <b style="color:#8ff7ff">'+esc(username)+'</b>. Escribe la nueva contrase\u00f1a (m\u00ednimo 4).</div>'+
      '<input id="pwdNew" type="password" placeholder="Nueva contrase\u00f1a" autocomplete="new-password" style="'+_PWD_INP+'">'+
      '<input id="pwdNew2" type="password" placeholder="Repite la nueva" autocomplete="new-password" style="'+_PWD_INP+'">'+
      '<div id="pwdErr" style="color:#ff8a9c;font-size:12px;min-height:16px;margin:0 0 10px"></div>'+
      '<div style="display:flex;gap:8px"><button id="pwdCancel" style="'+_PWD_BTN+';background:rgba(255,255,255,.08);color:#cbb8e6">Cancelar</button>'+
      '<button id="pwdSave" style="'+_PWD_BTN+';background:linear-gradient(135deg,#b7791f,#c05621);color:#fff">Restablecer</button></div></div>';
    var close=function(){ if(ov.parentNode) ov.parentNode.removeChild(ov); };
    document.getElementById("pwdCancel").onclick=close;
    document.getElementById("pwdSave").onclick=function(){
      var er=document.getElementById("pwdErr");
      var n=document.getElementById("pwdNew").value, n2=document.getElementById("pwdNew2").value;
      if((n||"").length<8){ er.style.color="#ff8a9c"; er.textContent="Debe tener al menos 8 caracteres."; return; }
      if(n!==n2){ er.style.color="#ff8a9c"; er.textContent="Las contrase\u00f1as no coinciden."; return; }
      er.style.color="#cbb8e6"; er.textContent="Guardando\u2026";
      fetch(SB_URL+"/rest/v1/rpc/app_admin_upsert_user",{ method:"POST", headers:sbHeaders(), body:JSON.stringify({ p_pin:_admPin, p_username:_uu, p_password:n, p_nombre:_nom, p_bar:_bar }) })
        .then(function(res){ return res.text().then(function(t){ return { ok:res.ok, status:res.status, text:t }; }); })
        .then(function(res){
          var body=null; try{ body=JSON.parse(res.text); }catch(e){}
          if(res.ok && body && body.ok){ close(); toast("\u2705 Contrase\u00f1a de "+username+" restablecida."); return; }
          er.style.color="#ff8a9c";
          if(body && body.error==="pin"){ er.textContent="PIN de administrador no v\u00e1lido."; }
          else if(!res.ok){ var m=""; try{ var j=JSON.parse(res.text); m=j.message||j.hint||j.details||""; }catch(e){} var miss=(res.status===404||/PGRST202|does not exist|no existe|schema cache|Could not find/i.test(res.text)); er.textContent=(miss?"Falta crear la funci\u00f3n en el servidor: ejecuta secure-setup.sql una vez.":"No se pudo restablecer.")+" (HTTP "+res.status+(m?" \u00b7 "+m:"")+")"; }
          else { er.textContent="No se pudo restablecer. Int\u00e9ntalo de nuevo."; }
        }).catch(function(){ er.style.color="#ff8a9c"; er.textContent="Sin conexi\u00f3n con el servidor."; });
    };
  }

  function openAdminEditModal(username){
    if(!username) return;
    if(document.getElementById("pwdOverlay")) return;
    if(!(SB_ON && _admPin)){ toast("Editar clientes necesita conexi\u00f3n y sesi\u00f3n de administrador (PIN)."); return; }
    var _uu=String(username).toLowerCase().trim();
    var cur=null; try{ (DRAFT.users||[]).forEach(function(x){ if(x.u===username||x.u===_uu) cur=x; }); }catch(e){}
    if(!cur){ cur={ u:_uu, pass:"", nombre:username, bar:username }; }
    var _curPts=0;
    var ov=_pwdOverlay();
    ov.innerHTML='<div style="background:#1a0a2e;border:1px solid #7540af;border-radius:16px;max-width:360px;width:100%;padding:20px;box-shadow:0 12px 40px rgba(0,0,0,.6)">'+
      '<div style="font-weight:900;font-size:17px;color:#ffe277;margin-bottom:4px">\u270F\uFE0F Editar cliente</div>'+
      '<div style="font-size:12.5px;color:#cbb8e6;margin-bottom:14px">Usuario: <b style="color:#8ff7ff">'+esc(username)+'</b> <span style="color:#9a86bd">(no se puede cambiar)</span></div>'+
      '<label style="font-size:12px;color:#cbb8e6;display:block;margin:0 0 3px">Nombre de contacto</label>'+
      '<input id="edNombre" type="text" placeholder="Nombre" value="'+esc(cur.nombre||"")+'" style="'+_PWD_INP+'">'+
      '<label style="font-size:12px;color:#cbb8e6;display:block;margin:0 0 3px">Bar / Local</label>'+
      '<input id="edBar" type="text" placeholder="Bar o local" value="'+esc(cur.bar||"")+'" style="'+_PWD_INP+'">'+
      '<label style="font-size:12px;color:#cbb8e6;display:block;margin:0 0 3px">Puntos <span id="edPtsCur" style="color:#9a86bd">(cargando\u2026)</span></label>'+
      '<input id="edPoints" type="number" min="0" step="1" placeholder="Puntos" style="'+_PWD_INP+'">'+
      '<div style="display:flex;gap:6px;margin:-4px 0 10px"><button id="edPm100" type="button" style="'+_PWD_BTN+';padding:7px;background:rgba(255,255,255,.06);color:#cbb8e6">\u2212100</button><button id="edPp100" type="button" style="'+_PWD_BTN+';padding:7px;background:rgba(255,255,255,.06);color:#cbb8e6">+100</button><button id="edPp500" type="button" style="'+_PWD_BTN+';padding:7px;background:rgba(255,255,255,.06);color:#cbb8e6">+500</button></div>'+
      '<label style="font-size:12px;color:#cbb8e6;display:block;margin:0 0 3px">Nueva contrase\u00f1a <span style="color:#9a86bd">(opcional)</span></label>'+
      '<input id="edPass" type="password" placeholder="Dejar vac\u00edo para no cambiarla" autocomplete="new-password" style="'+_PWD_INP+'">'+
      '<div id="pwdErr" style="color:#ff8a9c;font-size:12px;min-height:16px;margin:0 0 10px"></div>'+
      '<div style="display:flex;gap:8px"><button id="pwdCancel" style="'+_PWD_BTN+';background:rgba(255,255,255,.08);color:#cbb8e6">Cancelar</button>'+
      '<button id="pwdSave" style="'+_PWD_BTN+';background:linear-gradient(135deg,#1f8a6d,#0f766e);color:#fff">Guardar cambios</button></div></div>';
    var close=function(){ if(ov.parentNode) ov.parentNode.removeChild(ov); };
    document.getElementById("pwdCancel").onclick=close;
    function adj(d){ var pe=document.getElementById("edPoints"); var v=parseInt(pe.value,10); if(isNaN(v)) v=_curPts; v=Math.max(0,Math.min(1000000,v+d)); pe.value=v; }
    document.getElementById("edPm100").onclick=function(){ adj(-100); };
    document.getElementById("edPp100").onclick=function(){ adj(100); };
    document.getElementById("edPp500").onclick=function(){ adj(500); };
    fetch(SB_URL+"/rest/v1/rpc/app_admin_players",{ method:"POST", headers:sbHeaders(), body:JSON.stringify({ p_pin:_admPin }) })
      .then(function(r){ return r.ok?r.json():null; })
      .then(function(list){ var rec=null; if(list && list.forEach){ list.forEach(function(x){ if(String(x.username).toLowerCase().trim()===_uu) rec=x; }); } _curPts=rec?(rec.points||0):0; var pe=document.getElementById("edPoints"); if(pe && !pe.value) pe.value=_curPts; var lb=document.getElementById("edPtsCur"); if(lb) lb.textContent="(actual: "+fmt(_curPts)+")"; })
      .catch(function(){ var lb=document.getElementById("edPtsCur"); if(lb) lb.textContent=""; });
    document.getElementById("pwdSave").onclick=function(){
      var er=document.getElementById("pwdErr");
      var nom=(document.getElementById("edNombre").value||"").trim();
      var bar=(document.getElementById("edBar").value||"").trim();
      var np=(document.getElementById("edPass").value||"");
      if(np && np.length<8){ er.style.color="#ff8a9c"; er.textContent="La nueva contrase\u00f1a debe tener al menos 8 caracteres."; return; }
      if(!nom){ nom=username; } if(!bar){ bar=nom; }
      var newp=parseInt(document.getElementById("edPoints").value,10); if(isNaN(newp)) newp=_curPts; newp=Math.max(0,Math.min(1000000,newp));
      er.style.color="#cbb8e6"; er.textContent="Guardando\u2026";
      function fail(res,verb){ er.style.color="#ff8a9c"; var m=""; try{ var j=JSON.parse(res.text); m=j.message||j.hint||j.details||""; }catch(e){} var miss=(res.status===404||/PGRST202|does not exist|no existe|schema cache|Could not find/i.test(res.text||"")); er.textContent=(miss?"Falta crear la funci\u00f3n en el servidor: ejecuta puntos.sql una vez.":("No se pudo "+verb+"."))+" (HTTP "+res.status+(m?" \u00b7 "+m:"")+")"; }
      function done(){ try{ (DRAFT.users||[]).forEach(function(x){ if(x.u===username||x.u===_uu){ x.nombre=nom; x.bar=bar; } }); saveDraft(); applyCfgUsers(DRAFT); renderAdmin(); }catch(e){} close(); toast("\u2705 Cliente "+username+" actualizado."); }
      fetch(SB_URL+"/rest/v1/rpc/app_admin_upsert_user",{ method:"POST", headers:sbHeaders(), body:JSON.stringify({ p_pin:_admPin, p_username:_uu, p_password:(np||""), p_nombre:nom, p_bar:bar }) })
        .then(function(res){ return res.text().then(function(t){ return { ok:res.ok, status:res.status, text:t }; }); })
        .then(function(res){
          var body=null; try{ body=JSON.parse(res.text); }catch(e){}
          if(!(res.ok && body && body.ok)){ if(body && body.error==="pin"){ er.style.color="#ff8a9c"; er.textContent="PIN de administrador no v\u00e1lido."; } else { fail(res,"guardar"); } return; }
          if(newp===_curPts){ done(); return; }
          fetch(SB_URL+"/rest/v1/rpc/app_admin_set_points",{ method:"POST", headers:sbHeaders(), body:JSON.stringify({ p_pin:_admPin, p_username:_uu, p_points:newp }) })
            .then(function(res2){ return res2.text().then(function(t){ return { ok:res2.ok, status:res2.status, text:t }; }); })
            .then(function(res2){ var b2=null; try{ b2=JSON.parse(res2.text); }catch(e){} if(res2.ok && b2 && b2.ok){ done(); } else if(b2 && b2.error==="pin"){ er.style.color="#ff8a9c"; er.textContent="PIN de administrador no v\u00e1lido."; } else { fail(res2,"ajustar los puntos"); } })
            .catch(function(){ er.style.color="#ff8a9c"; er.textContent="Sin conexi\u00f3n con el servidor (puntos)."; });
        }).catch(function(){ er.style.color="#ff8a9c"; er.textContent="Sin conexi\u00f3n con el servidor."; });
    };
  }

  function openAdminResetModal(username){
    if(!username) return;
    if(document.getElementById("pwdOverlay")) return;
    if(!(SB_ON && _admPin)){ toast("El reseteo necesita conexi\u00f3n y sesi\u00f3n de administrador (PIN)."); return; }
    var ov=_pwdOverlay();
    ov.innerHTML='<div style="background:#1a0a2e;border:1px solid #7540af;border-radius:16px;max-width:340px;width:100%;padding:20px;box-shadow:0 12px 40px rgba(0,0,0,.6)">'+
      '<div style="font-weight:900;font-size:17px;color:#ffe277;margin-bottom:4px">\uD83D\uDD11 Restablecer contrase\u00f1a</div>'+
      '<div style="font-size:12.5px;color:#cbb8e6;margin-bottom:14px">Cliente: <b style="color:#8ff7ff">'+esc(username)+'</b>. Escribe la nueva contrase\u00f1a (m\u00ednimo 8).</div>'+
      '<input id="pwdNew" type="password" placeholder="Nueva contrase\u00f1a" autocomplete="new-password" style="'+_PWD_INP+'">'+
      '<input id="pwdNew2" type="password" placeholder="Repite la nueva" autocomplete="new-password" style="'+_PWD_INP+'">'+
      '<div id="pwdErr" style="color:#ff8a9c;font-size:12px;min-height:16px;margin:0 0 10px"></div>'+
      '<div style="display:flex;gap:8px"><button id="pwdCancel" style="'+_PWD_BTN+';background:rgba(255,255,255,.08);color:#cbb8e6">Cancelar</button>'+
      '<button id="pwdSave" style="'+_PWD_BTN+';background:linear-gradient(135deg,#b7791f,#c05621);color:#fff">Restablecer</button></div></div>';
    var close=function(){ if(ov.parentNode) ov.parentNode.removeChild(ov); };
    document.getElementById("pwdCancel").onclick=close;
    document.getElementById("pwdSave").onclick=function(){
      var er=document.getElementById("pwdErr");
      var n=document.getElementById("pwdNew").value, n2=document.getElementById("pwdNew2").value;
      if((n||"").length<8){ er.textContent="Debe tener al menos 8 caracteres."; return; }
      if(n!==n2){ er.textContent="Las contrase\u00f1as no coinciden."; return; }
      er.style.color="#cbb8e6"; er.textContent="Guardando\u2026";
      sbRpc("app_admin_reset_password",{ p_pin:_admPin, p_username:username, p_new_password:n }).then(function(r){
        if(r && r.ok){ close(); toast("\u2705 Contrase\u00f1a de "+username+" restablecida."); }
        else if(r && r.error==="nouser"){ er.style.color="#ff8a9c"; er.textContent="Ese cliente no existe en el servidor."; }
        else if(r && r.error==="pin"){ er.style.color="#ff8a9c"; er.textContent="PIN de administrador no v\u00e1lido."; }
        else { er.style.color="#ff8a9c"; er.textContent="No se pudo restablecer. Int\u00e9ntalo de nuevo."; }
      }).catch(function(){ er.style.color="#ff8a9c"; er.textContent="Sin conexi\u00f3n con el servidor."; });
    };
  }

  function monthOpts(sel){ var h=""; for(var m=1;m<=12;m++){ h+='<option value="'+m+'"'+(sel===m?" selected":"")+'>'+MESES[m]+'</option>'; } return h; }
  function themeOptions(sel, includeAuto){ var h=""; if(includeAuto){ h+='<option value=""'+(sel?"":" selected")+'>Autom\u00e1tico (calendario)</option>'; } (DRAFT.themes||[]).forEach(function(t){ h+='<option value="'+esc(t.id)+'"'+(sel===t.id?" selected":"")+'>'+esc(t.name)+'</option>'; }); return h; }
  function readImg(input, cb){ var f=input.files && input.files[0]; if(!f) return; var r=new FileReader(); r.onload=function(){ cb(r.result); }; r.readAsDataURL(f); }
  function readImgs(input, cb){ var fs=Array.prototype.slice.call(input.files||[]), out=[]; if(!fs.length) return; var left=fs.length; fs.forEach(function(f,i){ var r=new FileReader(); r.onload=function(){ out[i]=r.result; left--; if(!left) cb(out); }; r.readAsDataURL(f); }); }
  function readRewardImg(input, cb){ var f=input.files&&input.files[0]; if(!f) return; var r=new FileReader(); r.onload=function(){ var img=new Image(); img.onload=function(){ try{ var max=256; var w=img.width||max, h=img.height||max; var s=Math.min(1,max/Math.max(w,h)); var cw=Math.max(1,Math.round(w*s)), ch=Math.max(1,Math.round(h*s)); var c=document.createElement("canvas"); c.width=cw; c.height=ch; var ctx=c.getContext("2d"); ctx.drawImage(img,0,0,cw,ch); var out=c.toDataURL("image/webp",0.85); if(!out||out.indexOf("data:image/webp")!==0) out=c.toDataURL("image/jpeg",0.85); cb(out); }catch(e){ cb(r.result); } }; img.onerror=function(){ cb(r.result); }; img.src=r.result; }; r.readAsDataURL(f); }
  function clampD(d){ if(isNaN(d)||d<1) return 1; if(d>31) return 31; return d; }
  function toast(msg){ var t=document.getElementById("admToast"); if(!t){ t=document.createElement("div"); t.id="admToast"; t.className="adm-toast"; document.body.appendChild(t); } t.textContent=msg; t.classList.add("show"); setTimeout(function(){ t.classList.remove("show"); },2200); }

  function collect(){
    Array.prototype.forEach.call(document.querySelectorAll(".adm-name[data-id]"), function(inp){ var id=inp.getAttribute("data-id"); DRAFT.themes.forEach(function(t){ if(t.id===id) t.name=inp.value; }); });
    Array.prototype.forEach.call(document.querySelectorAll(".adm-rule"), function(row){ var i=+row.getAttribute("data-i"); var r=DRAFT.schedule[i]; if(!r) return; r.themeId=row.querySelector(".adm-rtheme").value; r.from={m:+row.querySelector(".adm-fm").value, d:clampD(+row.querySelector(".adm-fd").value)}; r.to={m:+row.querySelector(".adm-tm").value, d:clampD(+row.querySelector(".adm-td").value)}; });
    Array.prototype.forEach.call(document.querySelectorAll(".adm-sj[data-id]"), function(inp){ var id=inp.getAttribute("data-id"); DRAFT.themes.forEach(function(t){ if(t.id===id){ t.sym=t.sym||{}; t.sym.jackpot=oneSym(inp.value,""); } }); });
    Array.prototype.forEach.call(document.querySelectorAll(".adm-sp[data-id]"), function(inp){ var id=inp.getAttribute("data-id"); DRAFT.themes.forEach(function(t){ if(t.id===id){ t.sym=t.sym||{}; t.sym.prize=oneSym(inp.value,""); } }); });
    Array.prototype.forEach.call(document.querySelectorAll(".adm-sf[data-id]"), function(inp){ var id=inp.getAttribute("data-id"); DRAFT.themes.forEach(function(t){ if(t.id===id){ t.sym=t.sym||{}; t.sym.fillers=graphemes(inp.value); } }); });
    Array.prototype.forEach.call(document.querySelectorAll(".adm-smode[data-id]"), function(inp){ var id=inp.getAttribute("data-id"); DRAFT.themes.forEach(function(t){ if(t.id===id){ t.sym=t.sym||{}; t.sym.mode=inp.value; } }); });
    Array.prototype.forEach.call(document.querySelectorAll(".adm-hudcolor[data-id]"), function(inp){ var id=inp.getAttribute("data-id"); DRAFT.themes.forEach(function(t){ if(t.id===id){ t.pointsHud=t.pointsHud||{}; t.pointsHud.color=inp.value||"#18052f"; } }); });
    var fb=document.getElementById("admFallback"); if(fb) DRAFT.fallback=fb.value;
    var ov=document.getElementById("admOverride"); if(ov) DRAFT.override=ov.value||null;
    Array.prototype.forEach.call(document.querySelectorAll(".adm-reward-row"),function(row){ var i=+row.getAttribute("data-i"), r=DRAFT.rewards&&DRAFT.rewards[i]; if(!r)return; r.name=(row.querySelector(".adm-rw-name").value||"Premio").trim(); r.emoji=oneSym(row.querySelector(".adm-rw-icon").value,"🎁"); r.cost=Math.max(1,Math.round(+row.querySelector(".adm-rw-cost").value||1)); r.tier=row.querySelector(".adm-rw-tier").value; var _on=row.querySelector(".adm-rw-on"); if(_on) r.enabled=_on.checked; var _d=row.querySelector(".adm-rw-desc"); if(_d) r.desc=(_d.value||"").trim(); });
    var rt=document.getElementById("admRate"); if(rt) DRAFT.pointsPer100=parseFloat(rt.value)||300;
    var gr=document.getElementById("admGrowth"); if(gr){ var _g=parseFloat(gr.value); DRAFT.growthPerEur=isNaN(_g)?15:_g; }
    var _bo=document.getElementById("admBetOn"); if(_bo){ DRAFT.bet=DRAFT.bet||{}; DRAFT.bet.enabled=(_bo.value==="1"); var _bmn=document.getElementById("admBetMin"), _bmx=document.getElementById("admBetMax"), _bd=document.getElementById("admBetDay"); DRAFT.bet.min=Math.max(1,parseInt(_bmn&&_bmn.value,10)||100); DRAFT.bet.max=Math.max(DRAFT.bet.min,parseInt(_bmx&&_bmx.value,10)||1000); DRAFT.bet.perDay=Math.max(1,parseInt(_bd&&_bd.value,10)||3); DRAFT.bet.segments=(function(){ var out=[]; Array.prototype.forEach.call(document.querySelectorAll(".adm-seg-row"),function(row){ var mi=row.querySelector(".adm-seg-mult"), wi=row.querySelector(".adm-seg-w"); if(!mi||!wi) return; var mult=parseFloat(mi.value), w=parseFloat(wi.value); if(isNaN(mult)||mult<0) return; if(isNaN(w)||w<0) w=0; out.push({ mult:mult, w:w }); }); return out.length?out:BET_DEFAULT.segments.map(function(x){ return { mult:x.mult, w:x.w }; }); })(); DRAFT.bet.colors=(function(){ var c={}; Array.prototype.forEach.call(document.querySelectorAll(".adm-seg-row"),function(row){ var mi=row.querySelector(".adm-seg-mult"), ci=row.querySelector(".adm-seg-color"); if(mi&&ci&&/^#[0-9a-fA-F]{3,8}$/.test(ci.value)){ c[String(parseFloat(mi.value))]=ci.value; } }); return c; })(); }
  }

  function rewardEditorHtml(){
    if(!Array.isArray(DRAFT.rewards)||!DRAFT.rewards.length) DRAFT.rewards=CATALOG.map(function(x){return Object.assign({},x);});
    var h='<div class="adm-card adm-rewards-card" id="sec-premios"><div class="adm-sec">🎁 Catálogo de premios</div><div class="adm-hint">Añade, edita o elimina premios. Se aplican al catálogo inmediatamente.</div><div class="adm-reward-list">';
    DRAFT.rewards.forEach(function(r,i){ h+='<div class="adm-reward-row'+(r.enabled===false?' off':'')+'" data-i="'+i+'"><input class="adm-rw-name" value="'+esc(r.name)+'" placeholder="Nombre"><input class="adm-rw-icon" value="'+esc(r.emoji||"🎁")+'" maxlength="8" aria-label="Icono"><input class="adm-rw-cost" type="number" min="1" value="'+Math.max(1,+r.cost||1)+'" aria-label="Puntos"><select class="adm-rw-tier">'+TIER_ORDER.map(function(t){return '<option'+(r.tier===t?' selected':'')+'>'+t+'</option>';}).join('')+'</select><button type="button" class="adm-rw-del" data-i="'+i+'">Eliminar</button><div class="adm-rw-extra"><div class="adm-rw-imgbox">'+(r.image?'<img src="'+r.image+'" alt=""><button type="button" class="adm-rw-imgdel" data-i="'+i+'" title="Quitar imagen">×</button>':'<span class="adm-rw-imgph">Sin<br>imagen</span>')+'</div><label class="adm-file adm-rw-imgbtn">🖼️ '+(r.image?'Cambiar':'Subir imagen')+'<input type="file" accept="image/png,image/jpeg,image/webp" class="adm-rw-img" data-i="'+i+'"></label><label class="adm-rw-toggle"><input type="checkbox" class="adm-rw-on" data-i="'+i+'"'+(r.enabled===false?'':' checked')+'> '+(r.enabled===false?'Oculto':'Activo')+'</label><textarea class="adm-rw-desc" data-i="'+i+'" rows="2" placeholder="Detalles opcionales: modelo, color, talla, condiciones...">'+esc(r.desc||"")+'</textarea></div></div>'; });
    h+='</div><button type="button" class="adm-btn primary adm-rw-add">＋ Añadir premio</button></div>'; return h;
  }

  function _statFmt(n){ try{ return Number(n||0).toLocaleString("es-ES"); }catch(e){ return String(n||0); } }
  function renderStatsHtml(st){
    if(!st || !st.ok){ return '<div class="adm-canje-empty">'+((st&&st.error==="pin")?"PIN no v\u00e1lido para anal\u00edticas.":"No se pudieron cargar las anal\u00edticas (\u00bfsin conexi\u00f3n o servidor sin actualizar?).")+'</div>'; }
    var f=_statFmt;
    var kpi=function(lab,val,extra){ return '<div style="background:rgba(255,255,255,.05);border:1px solid var(--border);border-radius:14px;padding:12px 10px;text-align:center"><div style="font-size:22px;font-weight:900;color:#8ff7ff;line-height:1.1">'+val+'</div><div style="font-size:11.5px;color:#cbb8e6;margin-top:3px;font-weight:700">'+lab+'</div>'+(extra?'<div style="font-size:10.5px;color:#8a7aa8;margin-top:2px">'+extra+'</div>':'')+'</div>'; };
    var h='<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px">';
    h+=kpi("Clientes", f(st.players_total), f(st.players_active7)+" activos (7d)");
    h+=kpi("Puntos en circulaci\u00f3n", f(st.points_held));
    h+=kpi("Puntos canjeados", f(st.points_redeemed));
    h+=kpi("Tiradas totales", f(st.spins_total), f(st.spins_today)+" hoy");
    h+=kpi("Jugadas ruleta", f(st.bets_count), ((st.bets_delta>=0)?"+":"")+f(st.bets_delta)+" pts netos");
    h+=kpi("Canjes", f(st.redeem_total), f(st.redeem_pending)+" pendientes");
    h+=kpi("Recaudación registrada", f(st.revenue_total)+" €", f(st.revenue_30)+" € últimos 30d");
    h+=kpi("Puntos generados (30d)", f(st.points_earned30));
    h+=kpi("Avisos activos", f(st.push_users), "clientes suscritos");
    h+='</div>';
    var daily=st.daily||[]; var mx=1; daily.forEach(function(d){ if((d.spins||0)>mx) mx=d.spins; });
    if(daily.length){
      h+='<div style="margin:16px 0 8px;font-weight:900;color:#ffe277;font-size:13px">Tiradas \u00b7 \u00faltimos 14 d\u00edas</div>';
      h+='<div style="display:flex;align-items:flex-end;gap:4px;height:96px;padding:6px;background:rgba(0,0,0,.2);border-radius:12px;border:1px solid var(--border)">';
      daily.forEach(function(d){ var pct=Math.round((d.spins||0)/mx*100); var dd=String(d.d||"").slice(5); h+='<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:3px;height:100%;justify-content:flex-end" title="'+dd+": "+(d.spins||0)+' tiradas"><div style="width:100%;border-radius:4px 4px 0 0;background:linear-gradient(180deg,#5deeff,#6c22c7);height:'+Math.max(3,pct)+'%"></div><div style="font-size:8.5px;color:#8a7aa8;white-space:nowrap">'+dd+'</div></div>'; });
      h+='</div>';
    }
    var tp=st.top_prizes||[];
    if(tp.length){ h+='<div style="margin:16px 0 8px;font-weight:900;color:#ffe277;font-size:13px">Premios m\u00e1s canjeados</div>'; tp.forEach(function(x){ h+='<div style="display:flex;justify-content:space-between;padding:7px 10px;border-bottom:1px solid rgba(255,255,255,.07)"><span>'+esc(x.name||"\u2014")+'</span><b style="color:#8ff7ff">'+f(x.n)+'</b></div>'; }); }
    var tpl=st.top_players||[];
    if(tpl.length){ h+='<div style="margin:16px 0 8px;font-weight:900;color:#ffe277;font-size:13px">Clientes con m\u00e1s puntos</div>'; tpl.forEach(function(x){ h+='<div style="display:flex;justify-content:space-between;padding:7px 10px;border-bottom:1px solid rgba(255,255,255,.07)"><span>'+esc(x.bar||x.username||"\u2014")+'</span><b style="color:#8ff7ff">'+f(x.points)+' pts</b></div>'; }); }
    var rb=st.revenue_by_bar||[];
    if(rb.length){ h+='<div style="margin:16px 0 8px;font-weight:900;color:#ffe277;font-size:13px">Recaudación por bar</div>'; rb.forEach(function(x){ h+='<div style="display:flex;justify-content:space-between;padding:7px 10px;border-bottom:1px solid rgba(255,255,255,.07)"><span>'+esc(x.bar||x.username||"\u2014")+'</span><b style="color:#8ff7ff">'+f(x.eur)+' € · '+f(x.points)+' pts</b></div>'; }); }
    h+='<div style="margin-top:12px;font-size:10.5px;color:#8a7aa8">Actualizado: '+(st.ts?new Date(st.ts).toLocaleString("es-ES"):"\u2014")+'</div>';
    return h;
  }
  function jugadasCardHtml(){
    var opts=Object.keys(USERS).map(function(k){ return '<option value="'+esc(k)+'">'+esc(USERS[k].bar||USERS[k].nombre||k)+'</option>'; }).join("");
    return '<div class="adm-card" id="sec-jugadas"><div class="adm-sec">🎲 Registro de jugadas</div>'
     +'<div class="adm-hint">Resultado exacto de cada tirada de rodillos y giro de ruleta: fecha y hora, folio único y saldo antes/después. Útil ante cualquier reclamación de un cliente.</div>'
     +'<div class="adm-crform" style="margin-bottom:10px"><select id="admJugCliente"><option value="">Todos los clientes</option>'+opts+'</select>'
     +'<button type="button" class="adm-add2" id="admJugRefresh">↻ Cargar jugadas</button></div>'
     +'<div id="admJugList"><div class="adm-canje-empty">Elige un cliente (o «Todos») y pulsa «Cargar jugadas».</div></div></div>';
  }
  function jugadaReelHtml(codes){
    if(!codes||!codes.length) return '';
    function _cell(v){ if(isImageSymbol(v)){ var s=String(v).replace(/&/g,"&amp;").replace(/"/g,"&quot;"); return '<img src="'+s+'" alt="" style="width:100%;height:100%;object-fit:contain;display:block">'; } return String(v==null?"":v).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }
    var cells='';
    for(var i=0;i<codes.length;i++){ cells+='<span style="width:30px;height:30px;display:inline-flex;align-items:center;justify-content:center;font-size:19px;line-height:1;border:1px solid rgba(93,238,255,.25);border-radius:7px;background:rgba(0,0,0,.32);overflow:hidden">'+_cell(symFromCode(codes[i]))+'</span>'; }
    return '<div style="display:flex;gap:5px;margin-top:8px;align-items:center;flex-wrap:wrap"><span style="font-size:11px;opacity:.7;margin-right:3px">🎰 Rodillos:</span>'+cells+'</div>';
  }
  function renderJugadasHtml(list){
    if(!list||!list.length) return '<div class="adm-canje-empty">No hay jugadas registradas todavía.</div>';
    var h='<div class="adm-reward-list">';
    list.forEach(function(e){
      var m=e.meta||{};
      var when=''; if(e.created_at){ try{ when=new Date(e.created_at).toLocaleString("es-ES",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"}); }catch(_e){} }
      var game=m.game||""; var ic='🎰'; var desc='';
      if(game==="ruleta"||e.type==="bet"){ ic='🎡'; desc='Ruleta · apuesta '+fmt(m.stake||0)+' pts → x'+(m.mult!=null?m.mult:"?")+' · devuelve '+fmt(m.ret||0)+' pts'; }
      else if(game==="caja"||/caja/i.test(e.label||"")){ ic='🎁'; desc='Caja sorpresa · +'+fmt(m.result!=null?m.result:(e.delta||0))+' pts'; }
      else if(game==="rodillos"||e.type==="spin"){ ic='🎰'; desc='Rodillos · +'+fmt(m.result!=null?m.result:(e.delta||0))+' pts'+((m.bonus&&m.bonus>0)?(' · bonus +'+fmt(m.bonus)):'')+(m.box?' · 🎉 caja día 7':''); }
      else if(e.type==="redeem"){ ic='🛍️'; desc=esc(e.label||'Canje'); }
      else { desc=esc(e.label||e.type||'—'); }
      var d=(+e.delta||0);
      var dcol=d>0?'#7fe0a8':(d<0?'#ff9a9a':'#cbb8e6');
      var dtxt=(d<0?'-':(d>0?'+':''))+fmt(Math.abs(d))+' pts';
      var saldo=''; if(m.before!=null&&m.after!=null){ saldo='Saldo: '+fmt(m.before)+' → '+fmt(m.after)+' pts'; }
      var folio=m.folio?('Folio '+esc(m.folio)):('#'+e.id);
      var reelHtml=(game==="rodillos"||e.type==="spin")?jugadaReelHtml(m.symbols):'';
      h+='<div style="padding:10px;border:1px solid rgba(93,238,255,.22);border-radius:10px;background:rgba(0,0,0,.22)">'
        +'<div style="display:flex;flex-wrap:wrap;gap:6px 12px;align-items:center">'
        +'<span style="font-size:18px">'+ic+'</span>'
        +'<span style="flex:1;min-width:170px;font-weight:700">'+desc+'</span>'
        +'<span style="font-weight:800;color:'+dcol+'">'+dtxt+'</span></div>'
        +'<div style="display:flex;flex-wrap:wrap;gap:4px 12px;margin-top:5px;font-size:12px;opacity:.82">'
        +'<span>👤 '+esc(e.bar||e.username||'—')+'</span>'
        +'<span>🕒 '+esc(when)+'</span>'
        +(saldo?('<span>'+esc(saldo)+'</span>'):'')
        +'<span style="opacity:.7">'+esc(folio)+'</span></div>'+reelHtml+'</div>';
    });
    h+='</div>';
    return h;
  }
  function loadAdminJugadas(){
    var box=document.getElementById("admJugList"); if(!box) return;
    var selEl=document.getElementById("admJugCliente"); var uname=selEl?(selEl.value||""):"";
    if(!(SB_ON && _admPin)){ box.innerHTML='<div class="adm-canje-empty">El registro necesita conexión con el servidor y sesión de administrador (PIN).</div>'; return; }
    box.innerHTML='<div class="adm-canje-empty">Cargando…</div>';
    fetch(SB_URL+"/rest/v1/rpc/app_admin_events",{ method:"POST", headers:sbHeaders(), body:JSON.stringify({ p_pin:_admPin, p_username:(uname||null), p_limit:400 }) })
      .then(function(r){ return r.text().then(function(t){ return { ok:r.ok, status:r.status, text:t }; }); })
      .then(function(res){
        if(!res.ok){ var mm=""; try{ var j=JSON.parse(res.text); mm=j.message||j.hint||j.details||""; }catch(e){} var miss=(res.status===404 || /PGRST202/.test(res.text) || /Could not find|does not exist|no existe|schema cache/i.test(mm)); var tip=miss?("El servidor aún no reconoce la función. En Supabase → SQL Editor ejecuta app_result_log.sql (incluye la recarga del esquema) y espera ~30s."):("El servidor respondió con un error."); box.innerHTML='<div class="adm-canje-empty">No se pudo cargar el registro.<br><span style="font-size:12px;opacity:.85;display:block;margin-top:6px">'+tip+'</span><span style="font-size:11px;opacity:.6;display:block;margin-top:6px">HTTP '+res.status+(mm?(" · "+esc(mm)):"")+'</span></div>'; return; }
        var data=null; try{ data=JSON.parse(res.text); }catch(e){}
        var list=(data&&data.events)?data.events:[];
        box.innerHTML=renderJugadasHtml(list);
      }).catch(function(){ box.innerHTML='<div class="adm-canje-empty">Sin conexión con el servidor. Inténtalo de nuevo.</div>'; });
  }
  function loadAdminStats(){
    var box=document.getElementById("admStats"); if(!box) return;
    if(!(SB_ON && _admPin)){ box.innerHTML='<div class="adm-canje-empty">Las anal\u00edticas necesitan conexi\u00f3n con el servidor y sesi\u00f3n de administrador (PIN).</div>'; return; }
    box.innerHTML='<div class="adm-canje-empty">Cargando anal\u00edticas\u2026</div>';
    fetch(SB_URL+"/rest/v1/rpc/app_admin_stats",{ method:"POST", headers:sbHeaders(), body:JSON.stringify({ p_pin:_admPin }) }).then(function(r){ return r.text().then(function(t){ return { ok:r.ok, status:r.status, text:t }; }); }).then(function(res){ if(!res.ok){ var m=""; try{ var j=JSON.parse(res.text); m=j.message||j.hint||j.details||""; }catch(e){} var miss=(res.status===404 || /PGRST202/.test(res.text) || /Could not find|does not exist|no existe|schema cache/i.test(m)); var tip=miss?("Puede que el servidor a\u00fan no haya recargado el esquema (ocurre aunque el SQL se haya ejecutado bien). En Supabase \u2192 SQL Editor ejecuta analiticas.sql otra vez (ya incluye la recarga) y espera ~30s. Si persiste, revisa que se ejecut\u00f3 sin errores y en el proyecto correcto."):("El servidor respondi\u00f3 con un error."); var detail="Detalle t\u00e9cnico: HTTP "+res.status+(m?(" \u00b7 "+esc(m)):""); box.innerHTML='<div class="adm-canje-empty">No se pudieron cargar las anal\u00edticas.<br><span style="font-size:12px;opacity:.85;display:block;margin-top:6px">'+tip+'</span><span style="font-size:11px;opacity:.6;display:block;margin-top:6px">'+detail+'</span></div>'; return; } var st=null; try{ st=JSON.parse(res.text); }catch(e){} box.innerHTML=renderStatsHtml(st); }).catch(function(){ box.innerHTML='<div class="adm-canje-empty">No se pudieron cargar las anal\u00edticas.<br><span style="font-size:12px;opacity:.85;display:block;margin-top:6px">Sin conexi\u00f3n con el servidor. Revisa tu conexi\u00f3n e int\u00e9ntalo de nuevo.</span></div>'; });
  }
  function pushTargetsHtml(){
    var keys=Object.keys(USERS||{});
    if(!keys.length) return '<div class="adm-canje-empty">No hay clientes configurados.</div>';
    var h='';
    keys.forEach(function(k){ var u=USERS[k]; var name=(u&&(u.bar||u.nombre))||k; h+='<label class="push-tgt-row" style="display:block;padding:5px 2px;font-size:14px"><input type="checkbox" class="push-tgt" value="'+esc(k)+'"> '+esc(name)+' <span style="color:#999;font-size:12px">('+esc(k)+')</span></label>'; });
    return h;
  }
  function adminSendPush(){
    var t=document.getElementById("pushTitle"), m=document.getElementById("pushMsg");
    var title=(t&&t.value||"").trim(), msg=(m&&m.value||"").trim();
    if(!msg){ toast("Escribe un mensaje"); return; }
    var allEl=document.getElementById("pushAll"); var all=allEl&&allEl.checked;
    var usernames=[];
    if(!all){ Array.prototype.forEach.call(document.querySelectorAll(".push-tgt:checked"),function(c){ usernames.push(c.value); }); if(!usernames.length){ toast("Elige al menos un destinatario"); return; } }
    if(!_admPin){ toast("Reabre el backoffice con tu PIN"); return; }
    var payload={ action:"admin_send", pin:_admPin, title:title||"Tiki Taka", body:msg }; if(!all) payload.usernames=usernames;
    var btn=document.getElementById("pushSendBtn"); if(btn){ btn.disabled=true; btn.textContent="Enviando…"; }
    fetch(PUSH_FN_URL+"?action=admin_send",{ method:"POST", headers:{ "Content-Type":"application/json" }, body:JSON.stringify(payload) })
      .then(function(r){ return r.json().catch(function(){ return { ok:false, error:"respuesta no válida" }; }); })
      .then(function(res){ if(res&&res.ok){ toast("✅ Enviado a "+res.sent+" de "+res.targets+" dispositivo(s)"); if(m) m.value=""; if(t) t.value=""; } else { toast("Error: "+((res&&res.error)||"desconocido")); } })
      .catch(function(){ toast("Error de red al enviar"); })
      .then(function(){ if(btn){ btn.disabled=false; btn.textContent="📨 Enviar aviso"; } });
  }
  function renderAdmin(){
    var scr=document.getElementById("adminScreen"); if(!scr) return;
    var tm=themeMap(DRAFT); var todayId=resolveTheme(DRAFT); var todayName=tm[todayId]?tm[todayId].name:"\u2014";
    var h="";
    h+='<div class="adm-wrap">';
    h+='<div class="adm-top"><div class="adm-h">Backoffice \u00b7 Tiki Taka</div><button class="adm-x" id="admClose">Cerrar</button></div>';
    h+='<div class="adm-today">Hoy se mostrar\u00eda: <b>'+esc(todayName)+'</b></div>';
    h+='<nav class="adm-menu"><div class="adm-menu-t">Menú · todas las funciones</div><div class="adm-menu-row">';
    h+='<button type="button" class="adm-menu-i" data-t="sec-update">🔄 Publicar</button>';
    h+='<button type="button" class="adm-menu-i" data-t="sec-analiticas">📊 Analíticas</button>';
    h+='<button type="button" class="adm-menu-i" data-t="sec-canjes">🎁 Canjes</button>';
    h+='<button type="button" class="adm-menu-i" data-t="sec-logo">🖼️ Logo</button>';
    h+='<button type="button" class="adm-menu-i" data-t="sec-fondos">🎨 Fondos</button>';
    h+='<button type="button" class="adm-menu-i" data-t="sec-premios">🏆 Premios</button>';
    h+='<button type="button" class="adm-menu-i" data-t="sec-calendario">📅 Calendario</button>';
    h+='<button type="button" class="adm-menu-i" data-t="sec-ajustes">⚙️ Ajustes</button>';
    h+='<button type="button" class="adm-menu-i" data-t="sec-apuesta">🎡 Apuestas</button>';
    h+='<button type="button" class="adm-menu-i" data-t="sec-historial">📜 Historial</button>'; h+='<button type="button" class="adm-menu-i" data-t="sec-clientes">👥 Clientes</button>';
    h+='<button type="button" class="adm-menu-i" data-t="sec-jugadas">🎲 Jugadas</button>';
    h+='<button type="button" class="adm-menu-i" data-t="sec-recaudacion">💰 Recaudación</button>';
    h+='<button type="button" class="adm-menu-i" data-t="sec-avisos">📨 Avisos push</button>';
    h+='</div></nav>';
    h+='<div class="adm-card" id="sec-update"><div class="adm-sec">🔄 Publicar actualización</div>';
    h+='<div class="adm-hint">Cuando cambies el tema (Halloween, Navidad, logo, fondos, premios...) pulsa este botón para <b>publicar los cambios y forzar</b> que todos los clientes vean la versión nueva la próxima vez que abran la app.</div>';
    h+='<button type="button" class="adm-btn primary" id="admForceUpdate" style="margin-top:10px">🔄 Publicar y forzar actualización</button>';
    h+='<div class="adm-upload-note" id="admForceNote">Se guardan tus cambios y se marca una versi��n nueva para todos.</div></div>';
    h+='<div class="adm-card" id="sec-analiticas"><div class="adm-sec">📊 Analíticas</div>';
    h+='<div class="adm-hint">Resumen de actividad en tiempo real (clientes, puntos, tiradas, ruleta y canjes). Necesita conexión con el servidor.</div>';
    h+='<button type="button" class="adm-canje-refresh" id="admStatsRefresh" style="margin-bottom:10px">↻ Actualizar analíticas</button>';
    h+='<div id="admStats"><div class="adm-canje-empty">Pulsa «Actualizar analíticas» para cargar los datos.</div></div></div>';
    h+='<div class="adm-card adm-canjes" id="sec-canjes"><div class="adm-sec">🎁 Canjes de premios <span class="adm-badge" id="canjeBadge" style="display:none"></span></div>';
    h+='<div class="adm-hint">Con el backoffice abierto recibir\u00e1s un aviso cuando un cliente canjee un premio. <button type="button" id="admNotifBtn" style="margin-left:8px;background:linear-gradient(135deg,#b7791f,#c05621);color:#fff;border:none;border-radius:999px;padding:5px 12px;font-weight:700;cursor:pointer;font-size:12px">🔔 Activar avisos</button></div>';
    h+='<div class="adm-hint">Aquí ves los premios que reclaman tus clientes. Márcalos como <b>entregados</b> cuando se los des, para llevar el control.</div>';
    h+='<div class="adm-canje-tabs"><button type="button" class="adm-ct active" data-f="pending">Pendientes</button><button type="button" class="adm-ct" data-f="delivered">Entregados</button><button type="button" class="adm-ct" data-f="all">Todos</button><button type="button" class="adm-canje-refresh" id="canjeRefresh">↻ Actualizar</button></div>';
    h+='<div class="adm-canje-list" id="canjeList"><div class="adm-canje-empty">Cargando canjes…</div></div></div>';
    h+='<div class="adm-card" id="sec-avisos"><div class="adm-sec">📨 Enviar aviso push</div>';
    h+='<div class="adm-hint">Envía una notificación a los clientes que hayan activado los avisos. Elige a quién, escribe el mensaje y pulsa enviar.</div>';
    h+='<label style="display:block;margin:6px 0;font-weight:700"><input type="checkbox" id="pushAll" checked> Todos los clientes</label>';
    h+='<div class="push-tgts" id="pushTgts" style="max-height:190px;overflow:auto;border:1px solid #eee;border-radius:10px;padding:8px">'+pushTargetsHtml()+'</div>';
    h+='<input type="text" id="pushTitle" class="adm-name" placeholder="Título (ej. 🎁 Promo de hoy)" maxlength="80" style="margin-top:10px">';
    h+='<textarea id="pushMsg" class="adm-name" placeholder="Escribe aquí el mensaje…" maxlength="300" style="margin-top:8px;min-height:72px;resize:vertical"></textarea>';
    h+='<button type="button" class="adm-btn primary" id="pushSendBtn" style="margin-top:10px">📨 Enviar aviso</button>';
    h+='<div class="adm-upload-note">Solo lo reciben quienes hayan pulsado «Activar avisos» y aceptado. En iPhone requiere la app instalada en la pantalla de inicio.</div></div>';
    h+='<div class="adm-card" id="sec-logo"><div class="adm-sec">\ud83c\udfa8 Logo de la cabecera</div><div class="adm-hint">Este logo aparece en la parte de arriba de la app de los clientes. Puedes cambiarlo por una versi\u00f3n tem\u00e1tica (Halloween, Navidad, etc.) y se aplica al instante.</div>';
    h+='<div class="adm-logo-row"><div class="adm-logo-prev"><img src="'+((DRAFT.logo||DEFAULT_LOGO))+'" alt="logo"></div>';
    h+='<div class="adm-trow"><label class="adm-file">\u2b06 Subir nuevo logo<input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" id="admLogo"></label><button type="button" class="adm-logo-reset" id="admLogoReset">Restablecer logo original</button></div></div>';
    h+='<div class="adm-upload-note">Recomendado: PNG con fondo transparente, en horizontal. Se ajusta autom\u00e1ticamente al alto de la cabecera.</div></div>';
    h+='<div class="adm-card" id="sec-fondos"><div class="adm-sec">Fondos</div><div id="admThemes">';
    (DRAFT.themes||[]).forEach(function(t){
      h+='<div class="adm-theme'+(DRAFT.override===t.id?" sel":"")+'" data-id="'+esc(t.id)+'">';
      h+='<div class="adm-thumb'+(DRAFT.override===t.id?" sel":"")+'" data-id="'+esc(t.id)+'" title="Usar este fondo" style="background-image:url('+(t.img||"")+')"><span class="adm-use">'+(DRAFT.override===t.id?"✓ Usando":"Usar")+'</span></div>';
      h+='<div class="adm-tmeta"><input class="adm-name" data-id="'+esc(t.id)+'" value="'+esc(t.name)+'"/>';
      h+='<div class="adm-syms"><span class="adm-slab">Símbolos del rodillo</span>';
      h+='<label class="adm-sym">Jackpot (50)<input class="adm-sj" data-id="'+esc(t.id)+'" maxlength="6" value="'+esc((t.sym&&t.sym.jackpot)||"")+'"></label>';
      h+='<label class="adm-sym">Premio (30)<input class="adm-sp" data-id="'+esc(t.id)+'" maxlength="6" value="'+esc((t.sym&&t.sym.prize)||"")+'"></label>';
      h+='<label class="adm-sym adm-symf">Otros (separa con espacios)<input class="adm-sf" data-id="'+esc(t.id)+'" value="'+esc(((t.sym&&t.sym.fillers)||[]).join(" "))+'"></label>';
      h+='</div>';
      var sm=t.sym||{}; var mode=sm.mode||"emoji";
      h+='<div class="adm-symbol-mode"><div class="adm-upload-title">🖼️ Personaliza los símbolos del rodillo</div><p class="adm-upload-help">Elige <b>Imágenes</b> para subir tus propios símbolos o <b>Emojis</b> para usar los campos superiores. Los cambios se guardan y se aplican al instante.</p><label>Formato <select class="adm-smode" data-id="'+esc(t.id)+'"><option value="images"'+(mode==="images"?" selected":"")+'>Imágenes personalizadas</option><option value="emoji"'+(mode!=="images"?" selected":"")+'>Emojis</option></select></label>';
      h+='<div class="adm-symbol-gallery">';
      if(sm.imageJackpot) h+='<span><small>Jackpot</small><img src="'+sm.imageJackpot+'"></span>';
      if(sm.imagePrize) h+='<span><small>Premio</small><img src="'+sm.imagePrize+'"></span>';
      (sm.imageFillers||[]).forEach(function(im,ii){ h+='<span><small>Símbolo</small><img src="'+im+'"><button type="button" class="adm-simg-del" data-id="'+esc(t.id)+'" data-i="'+ii+'">×</button></span>'; });
      h+='</div><div class="adm-trow adm-upload-actions"><label class="adm-file">⬆ Subir imagen JACKPOT<input type="file" accept="image/png,image/jpeg,image/webp" class="adm-sjimg" data-id="'+esc(t.id)+'"></label><label class="adm-file">⬆ Subir imagen PREMIO<input type="file" accept="image/png,image/jpeg,image/webp" class="adm-spimg" data-id="'+esc(t.id)+'"></label><label class="adm-file">＋ Añadir símbolos nuevos<input type="file" accept="image/png,image/jpeg,image/webp" multiple class="adm-sfimg" data-id="'+esc(t.id)+'"></label></div><div class="adm-upload-note">Formatos admitidos: PNG, JPG y WebP. Haz clic en cada botón para seleccionar el archivo.</div></div>';
      var hud=t.pointsHud||{};
      h+='<div class="adm-hud-editor"><div class="adm-upload-title">💳 Panel de puntos</div><p class="adm-upload-help">Este fondo afecta solo a <b>Tus puntos</b>. El texto se mantiene en alto contraste para que siempre se lea bien.</p><div class="adm-hud-preview" style="--prev-hud:'+(hud.image?'url('+hud.image+')':'none')+';--prev-color:'+esc(hud.color||"#18052f")+'"><span>TUS PUNTOS</span><b>1.250</b><small>puntos acumulados</small></div><div class="adm-trow adm-hud-actions"><label class="adm-color-label">Color base <input type="color" class="adm-hudcolor" data-id="'+esc(t.id)+'" value="'+esc(hud.color||"#18052f")+'"></label><label class="adm-file">⬆ Subir fondo del panel<input type="file" accept="image/png,image/jpeg,image/webp" class="adm-hudimg" data-id="'+esc(t.id)+'"></label><button type="button" class="adm-hud-reset" data-id="'+esc(t.id)+'">Restablecer fondo</button></div></div>';
      h+='<div class="adm-sugg-row"><button type="button" class="adm-sugg-btn" data-id="'+esc(t.id)+'">✨ Ver 8 sugerencias</button><span class="adm-sugg-hint">según el nombre del fondo; al elegir una se activa el modo emojis</span></div>';
      h+='<div class="adm-sugg" data-id="'+esc(t.id)+'"></div>';
      h+='<div class="adm-imgdim">📐 Imagen recomendada: vertical <b>1080 × 1920 px</b> (9:16) · JPG o PNG · ocupa toda la pantalla, centra lo importante.</div>';
      h+='<div class="adm-trow"><label class="adm-file">Reemplazar imagen<input type="file" accept="image/*" class="adm-img" data-id="'+esc(t.id)+'"></label>';
      h+='<button class="adm-del" data-id="'+esc(t.id)+'">Eliminar</button></div></div></div>';
    });
    h+='</div><div class="adm-imgdim" style="margin:6px 2px 10px">📐 Sube imágenes verticales de <b>1080 × 1920 px</b> (9:16) para que se vean nítidas a pantalla completa.</div><label class="adm-file adm-add">+ A\u00f1adir fondo<input type="file" accept="image/*" id="admAdd"></label></div>';
    h+=rewardEditorHtml();
    h+='<div class="adm-card" id="sec-calendario"><div class="adm-sec">Calendario</div><div class="adm-hint">Se repite cada a\u00f1o. La primera regla que coincide con la fecha de hoy es la que manda.</div><div id="admRules">';
    (DRAFT.schedule||[]).forEach(function(r,idx){
      h+='<div class="adm-rule" data-i="'+idx+'">';
      h+='<select class="adm-rtheme" data-i="'+idx+'">'+themeOptions(r.themeId,false)+'</select>';
      h+='<span class="adm-dt">Del <input type="number" min="1" max="31" class="adm-fd" value="'+r.from.d+'"> <select class="adm-fm">'+monthOpts(r.from.m)+'</select></span>';
      h+='<span class="adm-dt">al <input type="number" min="1" max="31" class="adm-td" value="'+r.to.d+'"> <select class="adm-tm">'+monthOpts(r.to.m)+'</select></span>';
      h+='<span class="adm-ord"><button class="adm-up" data-i="'+idx+'">\u2191</button><button class="adm-dn" data-i="'+idx+'">\u2193</button><button class="adm-rx" data-i="'+idx+'">\u2715</button></span>';
      h+='</div>';
    });
    h+='</div><button class="adm-add2" id="admAddRule">+ A\u00f1adir regla</button></div>';
    h+='<div class="adm-card" id="sec-ajustes"><div class="adm-sec">Ajustes</div>';
    h+='<div class="adm-frow"><label>Fondo por defecto</label><select id="admFallback">'+themeOptions(DRAFT.fallback,false)+'</select></div>';
    h+='<div class="adm-frow"><label>Forzar fondo ahora</label><select id="admOverride">'+themeOptions(DRAFT.override||"",true)+'</select></div>';
    h+='</div>';
    var _bet=(DRAFT.bet)?DRAFT.bet:{}; var _bEnabled=(_bet.enabled!==false); var _bMin=parseInt(_bet.min,10)||100; var _bMax=parseInt(_bet.max,10)||1000; var _bDay=parseInt(_bet.perDay,10)||3;
    h+='<div class="adm-card" id="sec-apuesta"><div class="adm-sec">\uD83C\uDFA1 Ruleta de apuestas</div>';
    h+='<div class="adm-hint">Permite a tus clientes apostar puntos para multiplicarlos. Ya no pueden perder puntos: como m\u00ednimo conservan lo apostado.</div>';
    h+='<div class="adm-frow"><label>Activar la ruleta de apuestas</label><select id="admBetOn"><option value="1"'+(_bEnabled?' selected':'')+'>Activada</option><option value="0"'+(!_bEnabled?' selected':'')+'>Desactivada</option></select></div>';
    h+='<div class="adm-frow"><label>Apuesta m\u00ednima (pts)</label><input type="number" min="1" id="admBetMin" class="adm-num" value="'+_bMin+'"></div>';
    h+='<div class="adm-frow"><label>Apuesta m\u00e1xima (pts)</label><input type="number" min="1" id="admBetMax" class="adm-num" value="'+_bMax+'"></div>';
    h+='<div class="adm-hint" style="margin-top:6px">\uD83C\uDFB0 Las tiradas de ruleta ya no son diarias: cada cliente gana <b>1, 2 o 3 tiradas al azar</b> cada vez que juega a los rodillos.</div>';
    h+='<div class="adm-hint" style="margin-top:6px">Ajusta abajo las probabilidades de cada casilla. El servidor bloquea configuraciones cuyo retorno medio supere x1 para evitar crear puntos sin control.</div>';    h+='<div class="adm-sec" style="margin-top:16px;font-size:15px">🎡 Probabilidades y colores de la ruleta</div>';
    h+='<div class="adm-hint">Cada fila es una casilla de la ruleta. Ajusta el <b>multiplicador</b>, su <b>peso</b> (a más peso, más probable) y su <b>color</b>. El porcentaje se calcula solo. Los cambios se aplican al Publicar.</div>';
    h+='<div id="admSegList" style="margin-top:10px">';
    (function(){ var _bsegs=(DRAFT.bet&&Array.isArray(DRAFT.bet.segments)&&DRAFT.bet.segments.length)?DRAFT.bet.segments:BET_DEFAULT.segments; var _bcm=(DRAFT.bet&&DRAFT.bet.colors&&typeof DRAFT.bet.colors==="object")?DRAFT.bet.colors:{}; var _mults=_bsegs.map(function(sg){ return sg.mult; }); var _cols=assignBetColors(_mults, _bcm); _bsegs.forEach(function(sg,ix){ h+=segRowHtml(sg, _cols[ix]); }); })();
    h+='</div>';
    h+='<div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-top:4px"><button type="button" class="adm-btn" id="admSegAdd">➕ Añadir casilla</button><button type="button" class="adm-btn" id="admSegReset">↺ Restaurar por defecto</button><span id="admSegRet" style="font-weight:700"></span></div>';
    h+='<div class="adm-hint" style="margin-top:6px">💡 El <b>retorno medio</b> indica cuánto recupera de media el cliente por cada punto apostado. Si es mayor que x1 (rojo) los clientes ganan puntos a la larga; si es x1 o menos (verde) la casa mantiene el margen.</div>';
    h+='</div>';
    h+=historialCardHtml();
    h+=jugadasCardHtml();
    var barOpts=Object.keys(USERS).map(function(k){ return '<option value="'+esc(k)+'">'+esc(USERS[k].bar||USERS[k].nombre||k)+'</option>'; }).join("");
    h+='<div class="adm-card" id="sec-clientes"><div class="adm-sec">Clientes / Usuarios</div>';
    h+='<div class="adm-hint">Da de alta a los dueños de bares que usarán la app. Los usuarios son en minúsculas y sin espacios. Los usuarios <b>demo</b> y <b>manolo</b> son de prueba y siempre existen.</div>';
    h+='<div class="adm-uform"><input id="admUUser" placeholder="Usuario (para login)" autocomplete="off"><input id="admUPass" placeholder="Contraseña" autocomplete="off"><input id="admUNombre" placeholder="Nombre visible" autocomplete="off"><input id="admUBar" placeholder="Nombre del bar" autocomplete="off"></div>';
    h+='<button class="adm-add2" id="admAddUser" style="margin-top:10px">+ Añadir cliente</button>';
    var _cu=(DRAFT.users||[]);
    var _bk=Object.keys(BUILTIN_USERS);
    h+='<div class="adm-crlist">';
    _bk.forEach(function(k){ h+='<div class="adm-crrow"><div class="adm-crinfo"><b>'+esc(BUILTIN_USERS[k].bar||BUILTIN_USERS[k].nombre||k)+'</b> · '+esc(k)+'<span class="adm-ubuiltin">de prueba</span><span class="adm-crmeta">contraseña: '+'•••••'+'</span></div></div>'; });
    if(_cu.length){ _cu.slice().reverse().forEach(function(u){ h+='<div class="adm-crrow"><div class="adm-crinfo"><b>'+esc(u.bar||u.nombre||u.u)+'</b> · '+esc(u.u)+'<span class="adm-crmeta">'+(u.pass?('contraseña: '+esc(u.pass)):'🔒 gestionada en el servidor')+(u.nombre&&u.nombre!==u.u?(' · '+esc(u.nombre)):'')+' · <span class="adm-upts" data-u="'+esc(u.u)+'" style="color:#ffe277;font-weight:800">puntos: …</span></span></div><button class="adm-uedit" data-u="'+esc(u.u)+'" style="background:#12312a;border:1px solid #1f8a6d;color:#9ef7dd;border-radius:9px;padding:8px 10px;font-weight:800;cursor:pointer">✏️ Editar</button><button class="adm-upwd" data-u="'+esc(u.u)+'" style="background:#2a1440;border:1px solid #7540af;color:#d9c6ff;border-radius:9px;padding:8px 10px;font-weight:800;cursor:pointer">🔑 Contraseña</button><button class="adm-crdel adm-udel" data-u="'+esc(u.u)+'">Eliminar</button></div>'; }); }
    else { h+='<div class="adm-hint" style="margin-top:10px">Aún no has añadido ningún cliente propio.</div>'; }
    h+='</div></div>';
    h+='<div class="adm-card" id="sec-recaudacion"><div class="adm-sec">Recaudación de máquinas → puntos</div>';
    h+='<div class="adm-hint">Registra la recaudación de cada bar. Los puntos se calculan con la tasa de abajo y se abonan solos en la app del bar al abrirla.</div>';
    var _p100=parseFloat(DRAFT.pointsPer100)||300;
    var _grw=(typeof DRAFT.growthPerEur==="number")?DRAFT.growthPerEur:15;
    h+='<div class="adm-frow"><label>Puntos por cada 100 € recaudados</label><input type="number" min="0" step="1" id="admRate" class="adm-num" value="'+esc(String(_p100))+'"></div>';
    h+='<div class="adm-hint" style="margin-top:-4px">Equivale a '+esc(String((_p100/100)))+' pts por € · ej. 100 € → +'+fmt(_p100)+' pts, 250 € → +'+fmt(Math.round(250/100*_p100))+' pts.</div>';
    h+='<div class="adm-frow"><label>Bonus de crecimiento (pts por € de mejora)</label><input type="number" min="0" step="1" id="admGrowth" class="adm-num" value="'+esc(String(_grw))+'"></div>';
    h+='<div class="adm-hint" style="margin-top:-4px">Se paga solo por los euros que superen la media diaria de los últimos 90 días de ese bar. Por encima de <b>17 pts</b> deja de ser rentable en bares con reparto bajo.</div>';
    h+='<div class="adm-crform">';
    h+='<select id="admCrBar"><option value="">Elige un bar…</option>'+barOpts+'</select>';
    h+='<input type="number" min="0" step="0.01" id="admCrEur" class="adm-num" placeholder="Recaudación €">';
    h+='<input type="number" min="1" step="1" id="admCrDias" class="adm-num" placeholder="Días del periodo">';
    h+='<input type="text" id="admCrConcept" class="adm-name" placeholder="Concepto (ej. Junio 2026)">';
    h+='<button class="adm-add2" id="admAddCredit">+ Registrar recaudación</button>';
    h+='</div>';
    var _cr=(DRAFT.credits||[]);
    if(_cr.length){ h+='<div class="adm-crlist">'; _cr.slice().reverse().forEach(function(c){ var bn=(USERS[c.u]&&USERS[c.u].bar)||c.u; h+='<div class="adm-crrow"><div class="adm-crinfo"><b>'+esc(bn)+'</b> · '+esc(c.concept||"—")+'<span class="adm-crmeta">'+fmt(c.eur)+' €'+((+c.dias>0)?(' en '+fmt(c.dias)+' días'):'')+' → +'+fmt(c.pts)+' pts'+((+c.bonus>0)?(' <span style="color:#8ff7ff">(base '+fmt(c.base)+' + crecimiento '+fmt(c.bonus)+')</span>'):'')+' · '+esc(c.date||"")+'</span></div><button class="adm-crdel" data-id="'+esc(c.id)+'">Eliminar</button></div>'; }); h+='</div>'; }
    else { h+='<div class="adm-hint" style="margin-top:10px">Aún no has registrado ninguna recaudación.</div>'; }
    h+='</div>';
    h+='<div class="adm-actions">';
    h+='<button class="adm-btn ghost" id="admPreview">Previsualizar</button>';
    h+='<button class="adm-btn ghost" id="admSave">Guardar borrador</button>';
    h+='<button class="adm-btn ghost" id="admDiscard">Descartar cambios</button>';
    h+='<button class="adm-btn primary" id="admView">Ver web principal</button>';
    h+='<span id="admSaveState" class="adm-hint" role="status" aria-live="polite"></span>';
    h+='</div>';
    h+='</div>';
    scr.innerHTML=h;
    wireAdmin();
  }

  function wireAdmin(){
    var g=function(id){ return document.getElementById(id); };
    g("admClose").onclick=closeAdmin;
    var _menu=document.querySelector(".adm-menu"); if(_menu){ _menu.addEventListener("click", function(e){ var b=e.target.closest?e.target.closest(".adm-menu-i"):null; if(!b) return; var t=document.getElementById(b.getAttribute("data-t")); if(t){ t.scrollIntoView({behavior:"smooth",block:"start"}); t.classList.add("adm-flash"); setTimeout(function(){ t.classList.remove("adm-flash"); },1300); } if(b.getAttribute("data-t")==="sec-analiticas"){ try{ loadAdminStats(); }catch(e){} } if(b.getAttribute("data-t")==="sec-historial"){ try{ loadCanjes(false); }catch(e){} } if(b.getAttribute("data-t")==="sec-jugadas"){ try{ loadAdminJugadas(); }catch(e){} } }); }
    var _segList=document.getElementById("admSegList"); if(_segList){ _segList.addEventListener("input", function(e){ var t=e.target; if(t&&t.classList&&(t.classList.contains("adm-seg-mult")||t.classList.contains("adm-seg-w"))) recalcSegPct(); }); _segList.addEventListener("click", function(e){ var db=(e.target&&e.target.closest)?e.target.closest(".adm-seg-del"):null; if(db){ var row=db.closest(".adm-seg-row"); if(row&&row.parentNode){ row.parentNode.removeChild(row); recalcSegPct(); } } }); var _sa=document.getElementById("admSegAdd"); if(_sa) _sa.onclick=function(){ _segList.insertAdjacentHTML("beforeend", segRowHtml({mult:2,w:5}, null)); recalcSegPct(); }; var _srb=document.getElementById("admSegReset"); if(_srb) _srb.onclick=function(){ var mm=BET_DEFAULT.segments.map(function(sg){ return sg.mult; }); var cc=assignBetColors(mm,{}); var html=""; BET_DEFAULT.segments.forEach(function(sg,ix){ html+=segRowHtml(sg, cc[ix]); }); _segList.innerHTML=html; recalcSegPct(); toast("Ruleta restaurada"); }; recalcSegPct(); }
    var _hrf=document.getElementById("admHistRefresh"); if(_hrf){ _hrf.onclick=function(){ _hrf.disabled=true; loadCanjes(false); setTimeout(function(){ _hrf.disabled=false; },1200); }; }
    var _jrf=document.getElementById("admJugRefresh"); if(_jrf){ _jrf.onclick=function(){ _jrf.disabled=true; loadAdminJugadas(); setTimeout(function(){ _jrf.disabled=false; },1000); }; }
    var _jcl=document.getElementById("admJugCliente"); if(_jcl){ _jcl.onchange=function(){ loadAdminJugadas(); }; }
    g("admPreview").onclick=function(){ collect(); paintTheme(DRAFT, resolveTheme(DRAFT)); toast("Vista previa aplicada"); };
    g("admSave").onclick=function(){ var b=g("admSave"); collect(); b.disabled=true; publishDraft().then(function(){ toast("Borrador guardado en Supabase"); }).catch(function(){ toast("No se pudo guardar en Supabase. Revisa la conexión y vuelve a intentarlo."); }).then(function(){ b.disabled=false; }); };
    g("admDiscard").onclick=function(){ localStorage.removeItem("tikitaka_admin_cfg"); DRAFT=clone(ACTIVE_CFG); renderAdmin(); toast("Cambios descartados"); };
    var _lg=g("admLogo"); if(_lg) _lg.onchange=function(){ readImg(_lg,function(d){ collect(); DRAFT.logo=d; saveDraft(); PREVIEW_CFG=clone(DRAFT); applyActive(); renderAdmin(); toast("Logo actualizado"); }); };
    var _lr=g("admLogoReset"); if(_lr) _lr.onclick=function(){ collect(); DRAFT.logo=null; saveDraft(); PREVIEW_CFG=clone(DRAFT); applyActive(); renderAdmin(); toast("Logo restablecido"); };
    g("admView").onclick=function(){ collect(); saveDraft(); previewSite(); };
    var _fu=g("admForceUpdate"); if(_fu) _fu.onclick=function(){ collect(); DRAFT.rev=Date.now(); saveDraft(); try{ localStorage.setItem("tikitaka_cfg_rev", String(DRAFT.rev)); }catch(e){} var nn=g("admForceNote"); if(nn){ nn.textContent="✓ Publicado. Los clientes verán la actualización al abrir la app."; } toast("Actualización publicada y forzada ✓"); };
    g("admAddRule").onclick=function(){ collect(); var t=(DRAFT.themes[0]||{}).id; DRAFT.schedule.push({themeId:t,from:{m:1,d:1},to:{m:1,d:31}}); renderAdmin(); };
    g("admFallback").onchange=function(){ collect(); };
    g("admOverride").onchange=function(){ collect(); paintTheme(DRAFT, resolveTheme(DRAFT)); };
    g("admAdd").onchange=function(e){ var fn=(e.target.files[0]&&e.target.files[0].name)||""; readImg(e.target, function(d){ collect(); var id=uid("fondo"); var nm=fnameToName(fn); var sg=suggestEmojis(nm+" "+fn); DRAFT.themes.push({id:id,name:nm||"Nuevo fondo",img:d,_fname:fn,sym:clone(sg[0].sym)}); renderAdmin(); toast("Fondo añadido · emojis sugeridos: "+sg[0].label+". Cámbialos con ✨ Sugerir emojis."); }); };
    var each=function(sel,fn){ Array.prototype.forEach.call(document.querySelectorAll(sel), fn); };
    function renderSugg(id){ var cont=document.querySelector('.adm-sugg[data-id="'+id+'"]'); if(!cont) return; var t=null; (DRAFT.themes||[]).forEach(function(x){ if(x.id===id) t=x; }); var nameInp=document.querySelector('.adm-name[data-id="'+id+'"]'); var nm=nameInp?nameInp.value:(t?t.name:""); var list=suggestEmojis(nm+" "+((t&&t._fname)||"")); var hh=""; list.forEach(function(s,i){ hh+='<button type="button" class="adm-sugg-chip" data-id="'+esc(id)+'" data-i="'+i+'"><span class="adm-sugg-emos">'+esc(s.sym.jackpot+s.sym.prize+s.sym.fillers.join(""))+'</span><span class="adm-sugg-lab">'+esc(s.label)+'</span></button>'; }); cont.innerHTML=hh; Array.prototype.forEach.call(cont.querySelectorAll(".adm-sugg-chip"), function(chip){ chip.onclick=function(){ collect(); var i=+chip.getAttribute("data-i"); var sym=list[i].sym; (DRAFT.themes||[]).forEach(function(x){ if(x.id===id){ x.sym={ mode:"emoji", jackpot:sym.jackpot, prize:sym.prize, fillers:sym.fillers.slice(), imageJackpot:(x.sym&&x.sym.imageJackpot), imagePrize:(x.sym&&x.sym.imagePrize), imageFillers:(x.sym&&x.sym.imageFillers)||[] }; } }); saveDraft(); PREVIEW_CFG=clone(DRAFT); applyActive(); if(currentUser) renderSpinState(); renderAdmin(); toast("Emojis aplicados: "+list[i].label); }; }); }
    each(".adm-smode", function(inp){ inp.onchange=function(){ collect(); saveDraft(); applyActive(); if(currentUser) renderSpinState(); renderAdmin(); toast(inp.value==="images"?"Modo imágenes activado":"Modo emojis activado"); }; });
    each(".adm-sjimg", function(inp){ inp.onchange=function(){ var id=inp.getAttribute("data-id"); readImg(inp,function(d){ collect(); DRAFT.themes.forEach(function(t){if(t.id===id){t.sym=t.sym||{};t.sym.imageJackpot=d;t.sym.mode="images";}}); saveDraft(); renderAdmin(); }); }; });
    each(".adm-spimg", function(inp){ inp.onchange=function(){ var id=inp.getAttribute("data-id"); readImg(inp,function(d){ collect(); DRAFT.themes.forEach(function(t){if(t.id===id){t.sym=t.sym||{};t.sym.imagePrize=d;t.sym.mode="images";}}); saveDraft(); renderAdmin(); }); }; });
    each(".adm-sfimg", function(inp){ inp.onchange=function(){ var id=inp.getAttribute("data-id"); readImgs(inp,function(ds){ collect(); DRAFT.themes.forEach(function(t){if(t.id===id){t.sym=t.sym||{};t.sym.imageFillers=(t.sym.imageFillers||[]).concat(ds);t.sym.mode="images";}}); saveDraft(); renderAdmin(); }); }; });
    each(".adm-simg-del", function(b){ b.onclick=function(){ collect(); var id=b.getAttribute("data-id"),i=+b.getAttribute("data-i"); DRAFT.themes.forEach(function(t){if(t.id===id&&t.sym&&t.sym.imageFillers)t.sym.imageFillers.splice(i,1);}); saveDraft(); renderAdmin(); }; });
    each(".adm-hudcolor", function(inp){ inp.oninput=function(){ collect(); saveDraft(); PREVIEW_CFG=clone(DRAFT); applyActive(); }; inp.onchange=function(){ collect(); saveDraft(); renderAdmin(); }; });
    each(".adm-hudimg", function(inp){ inp.onchange=function(){ var id=inp.getAttribute("data-id"); readImg(inp,function(d){ collect(); DRAFT.themes.forEach(function(t){if(t.id===id){t.pointsHud=t.pointsHud||{};t.pointsHud.image=d;}}); saveDraft(); PREVIEW_CFG=clone(DRAFT); applyActive(); renderAdmin(); toast("Fondo del panel actualizado"); }); }; });
    each(".adm-hud-reset", function(b){ b.onclick=function(){ collect(); var id=b.getAttribute("data-id"); DRAFT.themes.forEach(function(t){if(t.id===id){t.pointsHud=t.pointsHud||{};delete t.pointsHud.image;t.pointsHud.color="#18052f";}}); saveDraft(); PREVIEW_CFG=clone(DRAFT); applyActive(); renderAdmin(); toast("Panel de puntos restablecido"); }; });
    each(".adm-sugg-btn", function(b){ b.onclick=function(){ collect(); renderSugg(b.getAttribute("data-id")); }; });
    each(".adm-del", function(b){ b.onclick=function(){ collect(); var id=b.getAttribute("data-id"); DRAFT.themes=DRAFT.themes.filter(function(t){ return t.id!==id; }); DRAFT.schedule=DRAFT.schedule.filter(function(r){ return r.themeId!==id; }); if(DRAFT.fallback===id) DRAFT.fallback=(DRAFT.themes[0]||{}).id||""; if(DRAFT.override===id) DRAFT.override=null; renderAdmin(); }; });
    each(".adm-img", function(inp){ inp.onchange=function(){ var id=inp.getAttribute("data-id"); var fn=(inp.files[0]&&inp.files[0].name)||""; readImg(inp, function(d){ collect(); DRAFT.themes.forEach(function(t){ if(t.id===id){ t.img=d; t._fname=fn; } }); renderAdmin(); toast("Imagen actualizada · pulsa ✨ Sugerir emojis para adaptar los símbolos"); }); }; });
    each(".adm-up", function(b){ b.onclick=function(){ collect(); var i=+b.getAttribute("data-i"); if(i>0){ var s=DRAFT.schedule, t=s[i-1]; s[i-1]=s[i]; s[i]=t; } renderAdmin(); }; });
    each(".adm-dn", function(b){ b.onclick=function(){ collect(); var i=+b.getAttribute("data-i"); var s=DRAFT.schedule; if(i<s.length-1){ var t=s[i+1]; s[i+1]=s[i]; s[i]=t; } renderAdmin(); }; });
    each(".adm-rx", function(b){ b.onclick=function(){ collect(); var i=+b.getAttribute("data-i"); DRAFT.schedule.splice(i,1); renderAdmin(); }; });
    each(".adm-thumb", function(th){ th.onclick=function(){ collect(); var id=th.getAttribute("data-id"); DRAFT.override=(DRAFT.override===id?null:id); var ok=saveDraft(); renderAdmin(); if(!ok) toast("Fondo aplicado. Aviso: hay demasiadas imágenes para guardar el borrador en este dispositivo."); }; });
    var _rt=g("admRate"); if(_rt) _rt.onchange=function(){ collect(); };
    var _bon=g("admBetOn"); if(_bon) _bon.onchange=function(){ collect(); saveDraft(); if(currentUser){ try{ renderBet(); }catch(e){} } };
    ["admBetMin","admBetMax","admBetDay"].forEach(function(id){ var el=g(id); if(el) el.onchange=function(){ collect(); saveDraft(); if(currentUser){ try{ renderBet(); }catch(e){} } }; });
    (function(){ var _nb=g("admNotifBtn"); if(_nb) _nb.onclick=function(){ requestNotif().then(function(){ ensureNotifBtn(); subscribeAdminPush(); }); }; try{ ensureNotifBtn(); }catch(e){} try{ subscribeAdminPush(); }catch(e){} })();
    (function(){ var _pa=g("pushAll"), _pl=g("pushTgts"); function _sp(){ if(!_pl) return; var on=_pa&&_pa.checked; Array.prototype.forEach.call(_pl.querySelectorAll(".push-tgt"),function(c){ c.disabled=on; }); _pl.style.opacity=on?"0.45":"1"; } if(_pa) _pa.onchange=_sp; _sp(); var _ps=g("pushSendBtn"); if(_ps) _ps.onclick=adminSendPush; })();
    (function(){ var _sr=g("admStatsRefresh"); if(_sr) _sr.onclick=function(){ loadAdminStats(); }; })();
    var _ac=g("admAddCredit"); if(_ac) _ac.onclick=function(){ collect(); var u=g("admCrBar").value; var eur=parseFloat(g("admCrEur").value)||0; var concept=(g("admCrConcept").value||"").trim(); if(!u){ toast("Elige un bar"); return; } if(eur<=0){ toast("Introduce una recaudación válida"); return; } var dias=parseInt(g("admCrDias")&&g("admCrDias").value,10)||0; if(dias<=0){ toast("Indica los días del periodo"); return; } var per100=parseFloat(g("admRate")&&g("admRate").value)||300; var _r=calcCreditPoints(u,eur,dias,DRAFT.credits||[],DRAFT,per100); var credit={ id:"rev-"+Date.now().toString(36)+Math.random().toString(36).slice(2,6), u:u, eur:eur, dias:dias, pts:_r.pts, base:_r.base, bonus:_r.bonus, ref:_r.ref, concept:concept, date:todayStr() }; _ac.disabled=true; toast("Registrando recaudación en Supabase…"); sbRpc("app_admin_add_revenue",{p_pin:_admPin,p_id:credit.id,p_username:u,p_eur:eur,p_days:dias,p_points:credit.pts,p_base_points:credit.base,p_bonus_points:credit.bonus,p_reference_daily:credit.ref,p_concept:concept,p_credit_date:credit.date}).then(function(res){ if(!(res&&res.ok)) throw new Error((res&&res.error)||"server"); DRAFT.credits=DRAFT.credits||[]; DRAFT.credits.push(credit); saveDraft(); renderAdmin(); toast("Recaudación registrada: +"+_r.pts+" pts"+(_r.bonus>0?(" (incluye +"+_r.bonus+" de crecimiento)"):(_r.ref===null?" (primera, sin referencia aún)":" (sin mejora sobre su media)"))+" para "+((USERS[u]&&USERS[u].bar)||u)); }).catch(function(){ _ac.disabled=false; toast("No se pudo registrar la recaudación; no se ha aplicado ningún punto."); }); };
    var _au=g("admAddUser"); if(_au) _au.onclick=function(){ collect(); var u=(g("admUUser").value||"").toLowerCase().trim().replace(/[^a-z0-9_.\-]/g,""); var pass=(g("admUPass").value||"").trim(); var nombre=(g("admUNombre").value||"").trim(); var bar=(g("admUBar").value||"").trim(); if(!u){ toast("Escribe un nombre de usuario"); return; } if(pass.length<8){ toast("La contraseña debe tener al menos 8 caracteres"); return; } DRAFT.users=DRAFT.users||[]; if(DRAFT.users.some(function(x){return x.u===u;})||(u in BUILTIN_USERS)){ toast("Ese usuario ya existe"); return; } if(!(SB_SECURE && _admPin)){ toast("Necesitas una sesión de administrador conectada para crear clientes"); return; } var _lbl=(bar||nombre||u); _au.disabled=true; toast("Guardando "+_lbl+" en el servidor…"); sbRpc("app_admin_upsert_user",{ p_pin:_admPin, p_username:u, p_password:pass, p_nombre:nombre||u, p_bar:bar||nombre||u }).then(function(res){ if(!(res&&res.ok)) throw new Error((res&&res.error)||"server"); DRAFT.users.push({ u:u, nombre:nombre||u, bar:bar||nombre||u, _srv:true }); saveDraft(); applyCfgUsers(DRAFT); g("admUUser").value=""; g("admUPass").value=""; g("admUNombre").value=""; g("admUBar").value=""; renderAdmin(); toast("✔ Cliente añadido y activado: "+_lbl); }).catch(function(){ _au.disabled=false; toast("No se pudo crear el cliente; no se ha guardado ninguna contraseña en este dispositivo."); }); };
    each(".adm-upwd", function(b){ b.onclick=function(){ openAdminPwdModal2(b.getAttribute("data-u")); }; });
    each(".adm-uedit", function(b){ b.onclick=function(){ openAdminEditModal(b.getAttribute("data-u")); }; });
    try{ loadAdminUsers(); }catch(e){}
    each(".adm-udel", function(b){ b.onclick=function(){ collect(); var u=b.getAttribute("data-u"); if(!confirm("¿Eliminar al cliente \""+u+"\"? Sus recaudaciones registradas seguirán apareciendo pero ese usuario ya no podrá iniciar sesión.")) return; var uname=String(u).toLowerCase().trim(); function _delLocal(){ DRAFT.users=(DRAFT.users||[]).filter(function(x){ return x.u!==u; }); saveDraft(); applyCfgUsers(DRAFT); renderAdmin(); } if(SB_ON && _admPin){ b.disabled=true; var _ot=b.textContent; b.textContent="Eliminando\u2026"; sbRpc("app_admin_delete_user",{ p_pin:_admPin, p_username:uname }).then(function(res){ if(res && res.ok){ _delLocal(); toast("Cliente eliminado del servidor: "+u); } else { b.disabled=false; b.textContent=_ot; var er=(res&&res.error)||""; toast(er==="builtin"?"No se puede eliminar un usuario integrado (demo).":(er==="pin"?"PIN de administrador no v\u00e1lido.":"No se pudo eliminar en el servidor.")); } }).catch(function(){ b.disabled=false; b.textContent=_ot; toast("No se pudo eliminar: ejecuta app_delete_user.sql en Supabase y vuelve a intentarlo."); }); } else { _delLocal(); toast("Cliente eliminado: "+u); } }; });
    each(".adm-crdel:not(.adm-udel):not(.adm-upwd):not(.adm-uedit)", function(b){ b.onclick=function(){ collect(); var id=b.getAttribute("data-id"); b.disabled=true; sbRpc("app_admin_delete_revenue",{p_pin:_admPin,p_id:id}).then(function(res){ if(!(res&&res.ok)) throw new Error((res&&res.error)||"claimed"); DRAFT.credits=(DRAFT.credits||[]).filter(function(c){ return c.id!==id; }); saveDraft(); renderAdmin(); toast("Recaudación eliminada"); }).catch(function(){ b.disabled=false; toast("No se puede eliminar: puede que el cliente ya haya recibido esos puntos."); }); }; });
    each(".adm-rw-add",function(b){ b.onclick=function(){ collect(); DRAFT.rewards.push({name:"Nuevo premio",emoji:"🎁",cost:1000,tier:"Regalos"}); saveDraft(); PREVIEW_CFG=clone(DRAFT); if(currentUser){applyActive();renderCatalog();} renderAdmin(); toast("Nuevo premio añadido"); }; });
    each(".adm-rw-del",function(b){ b.onclick=function(){ collect(); DRAFT.rewards.splice(+b.getAttribute("data-i"),1); saveDraft(); PREVIEW_CFG=clone(DRAFT); if(currentUser){applyActive();renderCatalog();} renderAdmin(); toast("Premio eliminado"); }; });
    each(".adm-rw-name,.adm-rw-icon,.adm-rw-cost,.adm-rw-tier",function(inp){ inp.onchange=function(){ collect(); saveDraft(); PREVIEW_CFG=clone(DRAFT); if(currentUser){applyActive();renderCatalog();} toast("Premio actualizado"); }; });
    each(".adm-rw-on",function(inp){ inp.onchange=function(){ collect(); saveDraft(); PREVIEW_CFG=clone(DRAFT); if(currentUser){applyActive();renderCatalog();} renderAdmin(); toast(inp.checked?"Premio visible en el catálogo":"Premio oculto (agotado)"); }; });
    each(".adm-rw-desc",function(inp){ inp.onchange=function(){ collect(); saveDraft(); PREVIEW_CFG=clone(DRAFT); if(currentUser){applyActive();renderCatalog();} toast("Detalles del premio actualizados"); }; });
    each(".adm-rw-img",function(inp){ inp.onchange=function(){ var i=+inp.getAttribute("data-i"); readRewardImg(inp,function(d){ collect(); if(DRAFT.rewards[i]){ DRAFT.rewards[i].image=d; } saveDraft(); PREVIEW_CFG=clone(DRAFT); if(currentUser){applyActive();renderCatalog();} renderAdmin(); toast("Imagen del premio actualizada"); }); }; });
    each(".adm-rw-imgdel",function(b){ b.onclick=function(){ collect(); var i=+b.getAttribute("data-i"); if(DRAFT.rewards[i]){ DRAFT.rewards[i].image=null; } saveDraft(); PREVIEW_CFG=clone(DRAFT); if(currentUser){applyActive();renderCatalog();} renderAdmin(); toast("Imagen quitada"); }; });
    /* Los avisos se solicitan solo tras una acción explícita del usuario. */
    if(!_canjeFilter) _canjeFilter="pending";
    each(".adm-ct", function(b){ b.classList.toggle("active", b.getAttribute("data-f")===_canjeFilter); b.onclick=function(){ _canjeFilter=b.getAttribute("data-f"); each(".adm-ct",function(x){ x.classList.toggle("active", x.getAttribute("data-f")===_canjeFilter); }); renderCanjeList(); }; });
    var _crf=g("canjeRefresh"); if(_crf) _crf.onclick=function(){ loadCanjes(true); toast("Actualizando canjes…"); };
    loadCanjes(false); startCanjePoll();
  }

  
  function openAdmin(){ removeFab(); DRAFT=loadDraft(); applyCfgUsers(DRAFT); var scr=document.getElementById("adminScreen"); scr.hidden=false; renderAdmin(); }
  function removeFab(){ var f=document.getElementById("admFab"); if(f) f.remove(); }
  function showFab(){ removeFab(); var f=document.createElement("button"); f.id="admFab"; f.className="adm-fab"; f.textContent="◀ Volver al backoffice"; f.onclick=function(){ openAdmin(); }; document.body.appendChild(f); }
  function previewSite(){ PREVIEW_CFG=clone(DRAFT); var scr=document.getElementById("adminScreen"); scr.hidden=true; scr.innerHTML=""; applyActive(); if(currentUser){ var _pr=applyRevenueCredits(); if(_pr>0){ renderHistory(); celebrateRevenue(_pr); } } showFab(); }
  function closeAdmin(){ PREVIEW_CFG=null; removeFab(); var scr=document.getElementById("adminScreen"); scr.hidden=true; scr.innerHTML=""; if((location.hash||"").toLowerCase()==="#admin"){ history.replaceState(null,"",location.pathname+location.search); } applyActive(); }
  function pinGate(){ var scr=document.getElementById("adminScreen"); if(!scr) return; scr.hidden=false; scr.innerHTML='<div class="adm-wrap"><div class="adm-card adm-pin"><div class="adm-sec">Backoffice</div><div class="adm-hint">Introduce el PIN de administrador.</div><input type="password" id="admPin" class="adm-name" placeholder="PIN"/><div class="adm-actions" style="margin-top:12px"><button class="adm-btn ghost" id="admPinCancel">Cancelar</button><button class="adm-btn primary" id="admPinOk">Entrar</button></div></div></div>'; document.getElementById("admPinOk").onclick=function(){ var _pv=document.getElementById("admPin").value||""; checkAdminPin(_pv).then(function(ok){ if(ok){ openAdmin(); } else { toast("PIN incorrecto"); } }); }; document.getElementById("admPinCancel").onclick=closeAdmin; var pi=document.getElementById("admPin"); pi.focus(); pi.addEventListener("keydown", function(e){ if(e.key==="Enter"){ document.getElementById("admPinOk").click(); } }); }
  function checkAdminHash(){ if((location.hash||"").toLowerCase()==="#admin"){ pinGate(); } }
  window.addEventListener("hashchange", checkAdminHash);
  /* ===== Boton ATRAS del movil: navegar dentro de la app, no recargar/salir ===== */
  (function(){
    function closeTopModal(){ var pm=document.getElementById("prizeModal"); if(pm && pm.classList.contains("show")){ pm.classList.remove("show"); pm.setAttribute("aria-hidden","true"); pm.innerHTML=""; return true; } return false; }
    function isAdminOpen(){ var s=document.getElementById("adminScreen"); return !!(s && !s.hidden); }
    function seed(){ try{ history.pushState({tk:"tk-root"},""); }catch(e){} }
    window.addEventListener("popstate", function(ev){
      if(closeTopModal()){ seed(); return; }
      if(isAdminOpen()){ try{ closeAdmin(); }catch(e){} seed(); return; }
      var st=ev && ev.state; var nav=window.__tkNav;
      if(st && st.tk==="tk-tab" && st.name){ if(nav) nav.apply(st.name); return; }
      if(nav && nav.current && nav.current()!=="jugar"){ nav.apply("jugar"); seed(); return; }
      seed();
    });
    try{ history.replaceState({tk:"tk-root"},""); }catch(e){}
    window.addEventListener("load", function(){ seed(); });
  })();
  checkAdminHash();

(function(){var current="jugar";function apply(name){var panels=document.querySelectorAll(".tab-panel");for(var i=0;i<panels.length;i++){panels[i].hidden=(panels[i].getAttribute("data-panel")!==name);}var btns=document.querySelectorAll(".unav-i");for(var j=0;j<btns.length;j++){btns[j].classList.toggle("active",btns[j].getAttribute("data-nav")===name);}current=name;try{window.scrollTo({top:0,behavior:"smooth"});}catch(e){window.scrollTo(0,0);}try{if(name==="ranking"&&window.tkLoadRanking)window.tkLoadRanking();}catch(e){}}function go(name){if(name===current)return;apply(name);try{history.pushState({tk:"tk-tab",name:name},"");}catch(e){}}window.__tkNav={go:go,apply:apply,current:function(){return current;}};function initUserNav(){var btns=document.querySelectorAll(".unav-i");if(!btns.length)return;for(var k=0;k<btns.length;k++){(function(b){b.addEventListener("click",function(){go(b.getAttribute("data-nav"));});})(btns[k]);}}if(document.readyState!=="loading")initUserNav();else document.addEventListener("DOMContentLoaded",initUserNav);})();

document.addEventListener("DOMContentLoaded",function(){document.body.classList.add("login-mode");var s=document.querySelector(".slot"),b=document.querySelector(".balance-wrap");if(s&&b)s.insertBefore(b,s.firstChild);});

(function(){
  if("serviceWorker" in navigator){ window.addEventListener("load", function(){ navigator.serviceWorker.register("sw.js").catch(function(){}); }); }
  var deferred=null;
  function isStandalone(){ return (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) || window.navigator.standalone===true; }
  function showInstall(){
    if(document.getElementById("pwaInstallBtn")||isStandalone()) return;
    var b=document.createElement("button");
    b.id="pwaInstallBtn"; b.type="button"; b.textContent="📲 Instalar app";
    b.style.cssText="position:fixed;right:14px;bottom:14px;z-index:100000;font-family:inherit;font-weight:800;font-size:14px;color:#fff;border:1px solid rgba(244,221,151,.55);background:linear-gradient(180deg,#FF3651,#E11D3B 55%,#9d0c23);padding:12px 16px;border-radius:999px;box-shadow:0 8px 24px rgba(0,0,0,.5);cursor:pointer";
    b.onclick=function(){ if(deferred){ deferred.prompt(); deferred.userChoice.then(function(){ deferred=null; b.remove(); }); } };
    document.body.appendChild(b);
  }
  window.addEventListener("beforeinstallprompt", function(e){ e.preventDefault(); deferred=e; showInstall(); });
  window.addEventListener("appinstalled", function(){ var b=document.getElementById("pwaInstallBtn"); if(b) b.remove(); deferred=null; });
  try{
    var ua=navigator.userAgent||"";
    var isIOS=/iphone|ipad|ipod/i.test(ua);
    var isSafari=isIOS && /safari/i.test(ua) && !/crios|fxios/i.test(ua);
    if(isIOS && isSafari && !isStandalone() && !localStorage.getItem("tikitaka_ios_hint")){
      window.addEventListener("load", function(){
        setTimeout(function(){
          if(isStandalone()) return;
          var d=document.createElement("div");
          d.style.cssText="position:fixed;left:12px;right:12px;bottom:12px;z-index:100000;background:#16090f;color:#fff;border:1px solid rgba(244,221,151,.4);border-radius:14px;padding:14px 16px;box-shadow:0 10px 30px rgba(0,0,0,.6);font-family:inherit;font-size:14px;line-height:1.4";
          d.innerHTML='<b>Instala Tiki Taka en tu iPhone</b><br>Pulsa <b>Compartir</b> ↑ y luego <b>“Añadir a pantalla de inicio”</b>.<div style="text-align:right;margin-top:8px"><button id="iosHintOk" style="background:#E11D3B;color:#fff;border:none;border-radius:8px;padding:8px 14px;font-weight:800;cursor:pointer">Entendido</button></div>';
          document.body.appendChild(d);
          document.getElementById("iosHintOk").onclick=function(){ d.remove(); localStorage.setItem("tikitaka_ios_hint","1"); };
        }, 2500);
      });
    }
  }catch(e){}
})();
