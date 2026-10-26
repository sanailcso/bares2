/* Quiet seasonal details; never intercept taps or change the light surfaces. */
(function () {
  'use strict';
  var styles = {none:'Sin decoración',halloween:'Halloween · tonos cálidos',winter:'Navidad · ramas y copos',celebration:'Celebración · estrellas'};
  var drawings = {
    winter:'<g fill="none" stroke="#355d50" stroke-width="1.5" stroke-linecap="round"><path d="M0 3Q50 5 107 59M14 7l2 22m0-21l24-1M32 16l1 25m1-24l27-2M52 28l1 25m0-23l28 2M72 42l0 24m1-22l25 5"/></g><g fill="none" stroke="#897142" stroke-width="1.3"><path d="M30 76v24m-12-12h24m-20-8l16 16m0-16l-16 16M106 91v20m-10-10h20m-17-7l14 14m0-14l-14 14"/></g><g fill="#9c4545"><circle cx="36" cy="26" r="3"/><circle cx="42" cy="31" r="3"/></g>',
    celebration:'<g fill="none" stroke="#9a7940" stroke-width="1.4"><path d="M30 18l4 11 12 1-9 8 2 12-10-6-10 6 3-12-9-8 12-1zM104 55l3 7 8 1-6 5 1 8-6-4-7 4 2-8-6-5 8-1zM49 103v12m-6-6h12"/></g><g fill="#a05d67"><circle cx="76" cy="22" r="2"/><circle cx="16" cy="81" r="2"/><circle cx="97" cy="115" r="2"/></g>'
  };
  function normalize(value) {
    value=value||{};
    return {style:Object.prototype.hasOwnProperty.call(styles,value.style)?value.style:'none',intensity:typeof value.intensity==='number'&&Number.isFinite(value.intensity)?Math.min(70,Math.max(0,value.intensity)):18};
  }
  function artwork(style) {
    if(style==='halloween')return '';
    if(!drawings[style])return '';
    var svg='<svg viewBox="0 0 160 160" aria-hidden="true" focusable="false">'+drawings[style]+'</svg>';
    return '<span class="festive-corner festive-top">'+svg+'</span><span class="festive-corner festive-bottom">'+svg+'</span>';
  }
  function paint(layer,value) {
    var v=normalize(value);
    if(layer.dataset.festive!==v.style){layer.innerHTML=artwork(v.style);layer.dataset.festive=v.style;}
    layer.style.opacity=String(v.intensity/100);
    layer.hidden=v.style==='none'||v.intensity===0;
  }
  function backgroundOpacity(theme){var n=theme&&theme.backgroundOpacity;return typeof n==='number'&&Number.isFinite(n)?Math.max(0,Math.min(100,n)):25;}
  function paintBackground(layer,theme){
    var src=theme&&theme.img;
    layer.style.backgroundImage=src?'url('+JSON.stringify(String(src))+')':'none';
    layer.style.opacity=String(backgroundOpacity(theme)/100);
    layer.hidden=!src||backgroundOpacity(theme)===0;
  }
  function apply(value,theme) {
    var host=document.getElementById('appCard');if(!host)return;
    var backdrop=document.getElementById('clubThemeBackground');
    if(!backdrop){backdrop=document.createElement('div');backdrop.id='clubThemeBackground';backdrop.className='club-theme-background';backdrop.setAttribute('aria-hidden','true');document.body.prepend(backdrop);}
    if(backdrop.parentElement!==document.body)document.body.prepend(backdrop);
    paintBackground(backdrop,theme);
    document.body.classList.toggle('has-theme-wallpaper',!backdrop.hidden);
    var layer=document.getElementById('clubFestive');
    if(!layer){layer=document.createElement('div');layer.id='clubFestive';layer.className='club-festive-layer';layer.setAttribute('aria-hidden','true');}
    if(layer.parentElement!==host)host.prepend(layer);
    paint(layer,value);
    host.dataset.festiveTheme=layer.hidden?'none':normalize(value).style;
  }
  function esc(s){return String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;');}
  function editor(theme) {
    var v=normalize(theme.decoration);
    return '<div class="adm-festive" data-id="'+esc(theme.id)+'"><h3>Fondo de toda la app</h3><p>La imagen de este tema aparece detrás de todas las pestañas y se mueve con la página. Actívalo con Usar o con el Calendario.</p><label>Intensidad del fondo <output class="adm-theme-opacity-value">'+backgroundOpacity(theme)+'%</output><input class="adm-theme-opacity" type="range" min="0" max="100" value="'+backgroundOpacity(theme)+'"></label><h3>Decoración adicional</h3><label>Motivo <select class="adm-festive-style">'+Object.keys(styles).map(function(key){return '<option value="'+key+'"'+(v.style===key?' selected':'')+'>'+styles[key]+'</option>';}).join('')+'</select></label><label>Intensidad <output class="adm-decoration-value">'+v.intensity+'%</output><input class="adm-festive-intensity" type="range" min="0" max="70" value="'+v.intensity+'"></label><div class="adm-festive-preview"><div class="theme-preview-layer" aria-hidden="true"></div><div class="festive-preview-layer" aria-hidden="true"></div><strong>Tu club, como siempre</strong><span>Un pequeño detalle para estas fechas</span></div></div>';
  }
  function read(row){return normalize({style:row.querySelector('select').value,intensity:Number(row.querySelector('.adm-festive-intensity').value)});}
  function bind(root,onSave,getTheme){
    root.querySelectorAll('.adm-festive').forEach(function(row){
      function preview(){var v=read(row);row.querySelector('.adm-decoration-value').textContent=v.intensity+'%';paint(row.querySelector('.festive-preview-layer'),v);var t=Object.assign({},getTheme(row.dataset.id),{backgroundOpacity:Number(row.querySelector('.adm-theme-opacity').value)});row.querySelector('.adm-theme-opacity-value').textContent=t.backgroundOpacity+'%';paintBackground(row.querySelector('.theme-preview-layer'),t);}
      row.querySelector('select').onchange=function(){preview();onSave();};
      row.querySelectorAll('input').forEach(function(input){input.oninput=preview;input.onchange=function(){preview();onSave();};});
      preview();
    });
  }
  window.TkFestive={normalize:normalize,apply:apply,editor:editor,read:read,bind:bind};
})();



