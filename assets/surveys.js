/* Private customer surveys. Nothing is stored in public config or localStorage. */
(function () {
  'use strict';
  var player = null, pending = [], dismissed = new Set(), answered = new Set();
  var playerEpoch = 0, loading = false, sending = false, signature = '';
  var admin = null;
  var kinds = {single: 'Una respuesta', multiple: 'Varias respuestas', rating: 'Valoración de 1 a 5', text: 'Texto libre'};
  var statuses = {draft: 'Borrador', active: 'Activa', closed: 'Cerrada'};
  function esc(value) { return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) { return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
  function imageUrl(value) {
    value = String(value || '');
    return /^https:\/\/[^\s<>]+$/.test(value) || /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(value) ? value : '';
  }
  function photo(value, label, cls) { var src = imageUrl(value); return src ? '<img class="' + (cls || 'survey-image') + '" src="' + esc(src) + '" alt="' + esc(label || '') + '" loading="lazy" referrerpolicy="no-referrer">' : ''; }
  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function root() { return document.getElementById('clubSurveys'); }
  function checkedResult(result) { if (!result || !result.ok) throw new Error(result && result.error || 'server'); return result; }
  function errorText(error) {
    return ({conflict:'Otra persona ha cambiado esta encuesta. Actualiza la lista antes de editarla.',
      answered:'Esta encuesta ya tiene respuestas. Puedes cambiar sus fechas o cerrarla; crea otra para cambiar la pregunta o los destinatarios.',
      targets:'Selecciona destinatarios válidos y activos.', invalid:'Revisa la pregunta, las opciones, las imágenes y las fechas.',
      pin:'La sesión de administración no es válida. Vuelve a entrar.', auth:'Tu sesión ha caducado. Vuelve a entrar.',
      unavailable:'Esta pregunta ya no está disponible.', answer:'Revisa tu respuesta antes de enviarla.'})[error.message] ||
      'No se ha podido guardar. Conservamos lo que has escrito; revisa la conexión y vuelve a intentarlo.';
  }
  function answerFields(survey, preview) {
    var disabled = preview ? ' disabled' : '', prefix = preview ? 'preview-' : 'answer-';
    if (survey.kind === 'text') return '<label class="survey-answer-label">Tu respuesta<textarea name="answer" maxlength="2000" rows="3" placeholder="Te leemos…" required' + disabled + '></textarea></label>';
    if (survey.kind === 'rating') return '<fieldset class="survey-rating"><legend>Elige una valoración</legend>' + [1,2,3,4,5].map(function (n) {
      return '<label><input type="radio" name="' + prefix + 'rating" value="' + n + '" required' + disabled + '><span>' + n + '</span><small>' + n + ' de 5</small></label>';
    }).join('') + '</fieldset>';
    return '<fieldset class="survey-options"><legend>' + (survey.kind === 'multiple' ? 'Puedes elegir varias opciones' : 'Elige una opción') + '</legend>' + survey.options.map(function (option) {
      return '<label class="survey-option"><input type="' + (survey.kind === 'multiple' ? 'checkbox' : 'radio') + '" name="' + prefix + 'option" value="' + esc(option.id) + '"' + disabled + '>' + photo(option.image, '', 'survey-option-image') + '<span>' + esc(option.label) + '</span></label>';
    }).join('') + '</fieldset>';
  }
  function cardBody(survey, preview) {
    return '<div class="survey-eyebrow">TU OPINIÓN CUENTA</div><h2>' + esc(survey.question || 'Escribe tu pregunta') + '</h2>' + photo(survey.image) + answerFields(survey, preview);
  }
  function drawPlayer(force) {
    var el = root(); if (!el) return;
    var now = Date.now();
    var available = pending.filter(function (s) { return !dismissed.has(s.id) && !answered.has(s.id) && (!s.ends_at || Date.parse(s.ends_at) > now); });
    var survey = available[0];
    var nextSignature = JSON.stringify(survey || null);
    if (!force && signature === nextSignature) return;
    signature = nextSignature;
    el.hidden = !player || !survey;
    if (el.hidden) { el.replaceChildren(); return; }
    el.innerHTML = '<article class="survey-card"><div class="survey-card-top"><span>' + (available.length > 1 ? available.length + ' preguntas para ti' : 'Una pregunta para ti') + '</span><button type="button" class="survey-dismiss" aria-label="Ocultar esta pregunta por ahora">Ahora no</button></div><form>' + cardBody(survey, false) + '<p class="survey-privacy">Participar es opcional. El equipo de Tiki Taka podrá ver tu respuesta.</p><p class="survey-feedback" role="status" aria-live="polite"></p><button class="survey-primary" type="submit">Enviar respuesta <span aria-hidden="true">→</span></button></form></article>';
    el.querySelector('.survey-dismiss').onclick = function () { if (sending) return; dismissed.add(survey.id); drawPlayer(true); };
    el.querySelector('form').onsubmit = function (event) {
      event.preventDefault(); if (sending || !player) return;
      var form = event.currentTarget, feedback = form.querySelector('.survey-feedback'), answer;
      if (survey.kind === 'text') answer = form.elements.answer.value.trim();
      else if (survey.kind === 'rating') answer = Number(new FormData(form).get('answer-rating'));
      else answer = Array.from(form.querySelectorAll('input:checked')).map(function (input) { return input.value; });
      if (!answer || (Array.isArray(answer) && !answer.length)) { feedback.textContent = 'Escribe o elige una respuesta.'; return; }
      var context = player, epoch = playerEpoch;
      sending = true; feedback.textContent = 'Enviando…';
      el.querySelectorAll('input,textarea,button').forEach(function (input) { input.disabled = true; });
      context.rpc('app_answer_survey', {p_token:context.token,p_id:survey.id,p_answer:answer}).then(checkedResult).then(function () {
        if (epoch !== playerEpoch) return;
        answered.add(survey.id); pending = pending.filter(function (s) { return s.id !== survey.id; });
        sending = false; drawPlayer(true); context.toast('Gracias por darnos tu opinión.'); refreshPlayer();
      }).catch(function (error) {
        if (epoch !== playerEpoch) return;
        sending = false;
        if (error.message === 'unavailable') { pending = pending.filter(function (s) { return s.id !== survey.id; }); drawPlayer(true); context.toast(errorText(error)); refreshPlayer(); return; }
        feedback.textContent = errorText(error);
        el.querySelectorAll('input,textarea,button').forEach(function (input) { input.disabled = false; });
      });
    };
  }
  function resetPlayer() {
    ++playerEpoch; player = null; pending = []; dismissed.clear(); answered.clear(); loading = false; sending = false; signature = ''; drawPlayer(true);
  }
  function connectPlayer(context) {
    resetPlayer(); if (!context.token) return;
    player = context; refreshPlayer();
  }
  function refreshPlayer() {
    if (!player || loading || sending) return;
    var context = player, epoch = playerEpoch;
    loading = true;
    context.rpc('app_pending_surveys', {p_token:context.token}).then(checkedResult).then(function (result) {
      if (epoch !== playerEpoch) return;
      pending = Array.isArray(result.surveys) ? result.surveys : []; drawPlayer(false);
    }).catch(function () {
      if (epoch !== playerEpoch) return;
      // A failed refresh must not leave old, possibly revoked private questions visible.
      // Keep an in-progress answer in memory for retry; no public or local fallback.
      var el = root(); if (el && !el.contains(document.activeElement)) { pending = []; drawPlayer(true); }
    }).finally(function () { if (epoch === playerEpoch) loading = false; });
  }

  function uuid() { return crypto.randomUUID(); }
  function newSurvey() {
    return {id:uuid(),question:'',kind:'single',options:[{id:'option-1',label:'',image:''},{id:'option-2',label:'',image:''}],image:'',audience:'all',targets:[],status:'draft',starts_at:null,ends_at:null,version:0,response_count:0};
  }
  function notice(text, bad) {
    if (!admin || !admin.root.isConnected) return;
    var el = admin.root.querySelector('.survey-admin-notice'); el.textContent = text; el.classList.toggle('survey-error', !!bad);
  }
  function toLocal(value) {
    if (!value) return '';
    var date = new Date(value); if (!isFinite(date.getTime())) return '';
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0,16);
  }
  function preview() {
    var el = admin && admin.root.querySelector('.survey-preview-content'); if (el) el.innerHTML = cardBody(admin.draft, true);
  }
  function renderTargets() {
    var a = admin, s = a.draft, el = a.root.querySelector('.survey-targets');
    if (!el) return;
    el.hidden = s.audience === 'all'; if (el.hidden) return;
    var values = s.audience === 'bars' ? Array.from(new Set(a.users.map(function (u) { return u.bar; }))).sort().map(function (bar) { return {id:bar,label:bar}; }) :
      a.users.map(function (u) { return {id:u.username,label:u.nombre + ' · ' + u.bar + ' (@' + u.username + ')'}; });
    // Existing recipients remain visible when a client has been deactivated.
    s.targets.forEach(function (id) { if (!values.some(function (v) { return v.id === id; })) values.push({id:id,label:id + ' (ya no está activo)'}); });
    el.innerHTML = '<label>Buscar ' + (s.audience === 'bars' ? 'bares' : 'clientes') + '<input class="survey-search" type="search" placeholder="Escribe un nombre…"' + (s.response_count ? ' disabled' : '') + '></label><div class="survey-target-list">' + values.map(function (v) {
      return '<label class="survey-target" data-search="' + esc(v.label.toLocaleLowerCase()) + '"><input type="checkbox" value="' + esc(v.id) + '"' + (s.targets.includes(v.id) ? ' checked' : '') + (s.response_count ? ' disabled' : '') + '><span>' + esc(v.label) + '</span></label>';
    }).join('') + '</div><p class="survey-target-count"></p>';
    function count() { el.querySelector('.survey-target-count').textContent = s.targets.length + ' seleccionados'; }
    count();
    el.querySelector('.survey-search').oninput = function (event) { var q = event.target.value.toLocaleLowerCase().trim(); el.querySelectorAll('.survey-target').forEach(function (label) { label.hidden = !label.dataset.search.includes(q); }); };
    el.querySelectorAll('input[type=checkbox]').forEach(function (input) { input.onchange = function () { s.targets = Array.from(el.querySelectorAll('input[type=checkbox]:checked')).map(function (i) { return i.value; }); count(); a.dirty = true; }; });
  }
  function imageEditor(index, value, locked) {
    return '<div class="survey-image-editor" data-image-index="' + index + '">' + photo(value) + '<label class="survey-file">' + (value ? 'Cambiar imagen' : 'Añadir imagen') + '<input type="file" accept="image/png,image/jpeg,image/webp"' + (locked ? ' disabled' : '') + '></label>' + (value ? '<button type="button" class="survey-link survey-remove-image"' + (locked ? ' disabled' : '') + '>Quitar imagen</button>' : '') + '</div>';
  }
  function renderEditor() {
    var a = admin, s = a.draft, el = a.root.querySelector('.survey-editor');
    if (!s) { el.replaceChildren(); return; }
    var locked = s.response_count > 0, dis = locked ? ' disabled' : '';
    el.innerHTML = '<form class="survey-admin-form"><div class="survey-editor-heading"><h3>' + (s.version ? 'Editar encuesta' : 'Nueva encuesta') + '</h3><button type="button" class="survey-link survey-cancel">Cerrar editor</button></div>' +
      (locked ? '<p class="survey-note">Ya tiene respuestas: conservamos la pregunta y sus destinatarios. Puedes cambiar las fechas o cerrarla.</p>' : '') +
      '<label>Pregunta<textarea data-field="question" rows="2" maxlength="300" required' + dis + '>' + esc(s.question) + '</textarea></label>' +
      '<label>Tipo de respuesta<select data-field="kind"' + dis + '>' + Object.keys(kinds).map(function (k) { return '<option value="' + k + '"' + (s.kind === k ? ' selected' : '') + '>' + kinds[k] + '</option>'; }).join('') + '</select></label>' +
      imageEditor(-1,s.image,locked) +
      (s.kind === 'single' || s.kind === 'multiple' ? '<fieldset class="survey-admin-options"><legend>Opciones (entre 2 y 8)</legend>' + s.options.map(function (o,i) {
        return '<div class="survey-option-editor"><label>Opción ' + (i+1) + '<input data-option="' + i + '" maxlength="160" required value="' + esc(o.label) + '"' + dis + '></label>' + imageEditor(i,o.image,locked) + '<button type="button" class="survey-link survey-remove-option" data-index="' + i + '"' + (locked || s.options.length <= 2 ? ' disabled' : '') + '>Eliminar opción</button></div>';
      }).join('') + '<button type="button" class="survey-secondary survey-add-option"' + (locked || s.options.length >= 8 ? ' disabled' : '') + '>Añadir opción</button></fieldset>' : '') +
      '<label>¿Quién la recibe?<select data-field="audience"' + dis + '><option value="all"' + (s.audience === 'all' ? ' selected' : '') + '>Todos los clientes</option><option value="bars"' + (s.audience === 'bars' ? ' selected' : '') + '>Uno o varios bares</option><option value="clients"' + (s.audience === 'clients' ? ' selected' : '') + '>Clientes concretos</option></select></label><div class="survey-targets"></div>' +
      '<div class="survey-dates"><label>Desde (hora de este dispositivo)<input type="datetime-local" data-field="starts_at" value="' + toLocal(s.starts_at) + '"></label><label>Hasta (opcional)<input type="datetime-local" data-field="ends_at" value="' + toLocal(s.ends_at) + '"></label></div>' +
      '<label>Estado<select data-field="status">' + Object.keys(statuses).map(function (k) { return '<option value="' + k + '"' + (s.status === k ? ' selected' : '') + '>' + statuses[k] + '</option>'; }).join('') + '</select></label>' +
      '<p class="survey-note">Solo las encuestas activas y dentro de sus fechas aparecen en Inicio. Sin preguntas pendientes, no se muestra nada. No se conceden puntos por responder.</p>' +
      '<details class="survey-preview"><summary>Vista previa en la app</summary><div class="survey-card survey-preview-content"></div></details>' +
      '<button class="survey-primary survey-save" type="submit">Guardar encuesta</button></form>';
    renderTargets(); preview();
    el.querySelector('.survey-cancel').onclick = function () { if (a.uploads || a.saving) return; if (a.dirty && !confirm('¿Cerrar sin guardar los cambios de esta encuesta?')) return; a.draft = null; a.dirty = false; renderEditor(); };
    el.querySelectorAll('[data-field]').forEach(function (input) {
      input.addEventListener('input', function () {
        var field = input.dataset.field; s[field] = /_at$/.test(field) ? (input.value ? new Date(input.value).toISOString() : null) : input.value;
        a.dirty = true; if (field === 'question') preview();
      });
      input.addEventListener('change', function () {
        if (input.dataset.field === 'audience') { s.targets = []; renderTargets(); }
        if (input.dataset.field === 'kind') { if ((s.kind === 'single' || s.kind === 'multiple') && s.options.length < 2) s.options = newSurvey().options; renderEditor(); }
      });
    });
    el.querySelectorAll('[data-option]').forEach(function (input) { input.oninput = function () { s.options[+input.dataset.option].label = input.value; a.dirty = true; preview(); }; });
    var add = el.querySelector('.survey-add-option'); if (add) add.onclick = function () { s.options.push({id:uuid(),label:'',image:''}); a.dirty = true; renderEditor(); };
    el.querySelectorAll('.survey-remove-option').forEach(function (button) { button.onclick = function () { s.options.splice(+button.dataset.index,1); a.dirty = true; renderEditor(); }; });
    el.querySelectorAll('.survey-image-editor').forEach(function (editor) {
      var index = +editor.dataset.imageIndex;
      function setImage(value) { if (index < 0) s.image = value; else s.options[index].image = value; a.dirty = true; renderEditor(); }
      var remove = editor.querySelector('.survey-remove-image'); if (remove) remove.onclick = function () { setImage(''); };
      editor.querySelector('input').onchange = function (event) {
        var file = event.target.files[0]; if (!file) return;
        ++a.uploads; el.querySelectorAll('input,textarea,select,button').forEach(function (input) { input.disabled = true; }); notice('Preparando imagen…');
        compressImage(file).then(function (value) { if (admin === a && a.draft === s) { setImage(value); notice('Imagen preparada. Guarda la encuesta para aplicarla.'); } }).catch(function () { notice('No se pudo preparar la imagen. Usa JPG, PNG o WebP de menos de 15 MB.',true); }).finally(function () { --a.uploads; if (admin === a && a.draft === s) renderEditor(); });
      };
    });
    el.querySelector('form').onsubmit = function (event) { event.preventDefault(); saveSurvey(); };
    if (a.uploads || a.saving) el.querySelectorAll('input,textarea,select,button').forEach(function (input) { input.disabled = true; });
  }
  function compressImage(file) {
    return new Promise(function (resolve,reject) {
      if (!['image/png','image/jpeg','image/webp'].includes(file.type) || file.size > 15*1024*1024) { reject(); return; }
      var url = URL.createObjectURL(file), img = new Image();
      img.onerror = function () { URL.revokeObjectURL(url); reject(); };
      img.onload = function () {
        URL.revokeObjectURL(url);
        try {
          var canvas = document.createElement('canvas'), scale = Math.min(1,1000 / Math.max(img.width,img.height));
          canvas.width = Math.max(1,Math.round(img.width*scale)); canvas.height = Math.max(1,Math.round(img.height*scale));
          var ctx = canvas.getContext('2d'); ctx.fillStyle = '#f8f5ee'; ctx.fillRect(0,0,canvas.width,canvas.height); ctx.drawImage(img,0,0,canvas.width,canvas.height);
          var value = canvas.toDataURL('image/webp',0.78);
          while (value.length > 210000 && canvas.width > 150) { var copy = document.createElement('canvas'); copy.width = Math.round(canvas.width*0.8); copy.height = Math.max(1,Math.round(canvas.height*0.8)); copy.getContext('2d').drawImage(canvas,0,0,copy.width,copy.height); canvas = copy; value = canvas.toDataURL('image/webp',0.7); }
          if (value.length > 220000 || !imageUrl(value)) reject(); else resolve(value);
        } catch (error) { reject(error); }
      }; img.src = url;
    });
  }
  function saveSurvey() {
    var a = admin, s = a.draft;
    if (!s || a.saving || a.uploads) return;
    if (s.audience !== 'all' && !s.targets.length) { notice('Selecciona al menos un destinatario.',true); return; }
    if (s.starts_at && s.ends_at && s.ends_at <= s.starts_at) { notice('La fecha final debe ser posterior a la inicial.',true); return; }
    var snapshot = clone(s); if (!['single','multiple'].includes(snapshot.kind)) snapshot.options = [];
    a.saving = true; a.root.querySelectorAll('.survey-admin-form input,.survey-admin-form textarea,.survey-admin-form select,.survey-admin-form button').forEach(function (e) { e.disabled = true; });
    notice('Guardando encuesta…');
    a.rpc('app_admin_save_survey',{p_pin:a.pin,p_survey:snapshot,p_expected_version:s.version}).then(checkedResult).then(function (result) {
      if (admin !== a) return;
      a.saving = false; a.draft = Object.assign(result.survey,{response_count:s.response_count || 0}); a.dirty = false;
      a.surveys = a.surveys.filter(function (x) { return x.id !== s.id; }); a.surveys.unshift(clone(a.draft));
      renderList(); renderEditor(); notice(a.draft.status === 'active' ? 'Encuesta guardada y activada. Se mostrará a sus destinatarios dentro de las fechas elegidas.' : 'Encuesta guardada. Estado: ' + statuses[a.draft.status] + '.');
      refreshPlayer();
    }).catch(function (error) { if (admin === a) { a.saving = false; renderEditor(); notice(errorText(error),true); } }).finally(function () { a.saving = false; });
  }
  function renderList() {
    var a = admin, el = a.root.querySelector('.survey-list');
    el.innerHTML = a.surveys.length ? a.surveys.map(function (s) {
      return '<article class="survey-list-item"><div><span class="survey-status">' + statuses[s.status] + '</span><h3>' + esc(s.question) + '</h3><p>' + esc(kinds[s.kind]) + ' · ' + (s.audience === 'all' ? 'Todos los clientes' : s.targets.length + (s.audience === 'bars' ? ' bares' : ' clientes')) + ' · ' + s.response_count + ' respuestas</p></div><div class="survey-list-actions"><button type="button" class="survey-secondary" data-edit="' + s.id + '">Editar</button><button type="button" class="survey-secondary" data-results="' + s.id + '">Resultados</button></div></article>';
    }).join('') : '<p class="survey-note">Todavía no hay encuestas. Los clientes no verán ningún apartado vacío.</p>';
    el.querySelectorAll('[data-edit]').forEach(function (button) { button.onclick = function () {
      if (a.saving || a.uploads || (a.dirty && !confirm('¿Descartar los cambios de la encuesta que estás editando?'))) return;
      a.draft = clone(a.surveys.find(function (s) { return s.id === button.dataset.edit; })); a.dirty = false; renderEditor();
      a.root.querySelector('.survey-editor').scrollIntoView({behavior:'smooth',block:'start'});
    }; });
    el.querySelectorAll('[data-results]').forEach(function (button) { button.onclick = function () { showResults(button.dataset.results,0); }; });
  }
  function answerLabel(survey,answer) {
    if (survey.kind === 'rating') return answer + ' / 5';
    if (Array.isArray(answer)) return answer.map(function (id) { var option = survey.options.find(function (o) { return o.id === id; }); return option ? option.label : id; }).join(', ');
    return String(answer);
  }
  function showResults(id,offset) {
    var a = admin, el = a.root.querySelector('.survey-results'), s = a.surveys.find(function (s) { return s.id === id; });
    if (!s) return;
    a.resultRequest = (a.resultRequest || 0) + 1; var request = a.resultRequest;
    el.hidden = false;
    if (!offset) el.textContent = 'Cargando resultados…';
    a.rpc('app_admin_survey_results',{p_pin:a.pin,p_id:id,p_offset:offset}).then(checkedResult).then(function (r) {
      if (admin !== a || request !== a.resultRequest) return;
      if (!offset) el.innerHTML = '<h3>Resultados · ' + esc(s.question) + '</h3><p>' + r.total + ' participantes</p>' +
        (s.kind === 'multiple' ? '<p class="survey-note">Los porcentajes son sobre participantes y pueden sumar más del 100 %.</p>' : '') + r.counts.map(function (c) {
          var pct = r.total ? Math.round(c.count/r.total*100) : 0;
          return '<div class="survey-result"><div><span>' + esc(c.label) + '</span><b>' + c.count + ' · ' + pct + ' %</b></div><progress max="100" value="' + pct + '">' + pct + ' %</progress></div>';
        }).join('') + '<div class="survey-response-list"></div>';
      el.querySelector('.survey-response-list').insertAdjacentHTML('beforeend',r.responses.map(function (row) {
        return '<article class="survey-response"><b>' + esc(row.nombre || row.username) + ' · ' + esc(row.bar) + '</b><small>@' + esc(row.username) + ' · ' + esc(new Date(row.created_at).toLocaleString()) + '</small><p>' + esc(answerLabel(s,row.answer)) + '</p></article>';
      }).join(''));
      var old = el.querySelector('.survey-more'); if (old) old.remove();
      if (r.next_offset != null) { var button = document.createElement('button'); button.type = 'button'; button.className = 'survey-secondary survey-more'; button.textContent = 'Ver más respuestas'; button.onclick = function () { button.disabled = true; showResults(id,r.next_offset); }; el.appendChild(button); }
      if (!offset) el.scrollIntoView({behavior:'smooth',block:'start'});
    }).catch(function (error) { if (admin === a && request === a.resultRequest) { notice(errorText(error),true); var button = el.querySelector('.survey-more'); if (button) button.disabled = false; else el.textContent = 'No se pudieron cargar los resultados. Pulsa Resultados para volver a intentarlo.'; } });
  }
  function loadAdmin() {
    var a = admin; if (!a || a.loading || a.saving || a.uploads) return;
    a.loading = true; notice('Cargando encuestas y destinatarios…');
    Promise.all([a.rpc('app_admin_surveys',{p_pin:a.pin}).then(checkedResult),a.rpc('app_admin_users',{p_pin:a.pin})]).then(function (results) {
      if (admin !== a) return;
      if (!Array.isArray(results[1])) throw new Error('server');
      a.surveys = results[0].surveys; a.users = results[1]; a.loaded = true; renderList(); if (a.draft) renderTargets(); notice('Encuestas actualizadas. Se guardan con su propio botón, por separado de los fondos y premios.');
    }).catch(function (error) { if (admin === a) notice(errorText(error) + ' Si es la primera instalación, comprueba que se ha aplicado la migración de encuestas.',true); }).finally(function () { a.loading = false; });
  }
  function mountAdmin(el,context) {
    if (!el) return;
    if (!admin || admin.pin !== context.pin) admin = {surveys:[],users:[],draft:null,loaded:false,dirty:false,uploads:0};
    admin.root = el; admin.rpc = context.rpc; admin.pin = context.pin;
    el.innerHTML = '<div class="survey-admin-heading"><div><h2>Encuestas</h2><p>Pregunta, escucha y elige a quién te diriges.</p></div><div class="survey-list-actions"><button type="button" class="survey-secondary survey-refresh">Actualizar</button><button type="button" class="survey-primary survey-new">Nueva encuesta</button></div></div><p class="survey-admin-notice" role="status" aria-live="polite"></p><div class="survey-list"></div><div class="survey-editor"></div><section class="survey-results" hidden aria-label="Resultados de la encuesta"></section>';
    el.querySelector('.survey-new').onclick = function () { if (admin.saving || admin.uploads || (admin.dirty && !confirm('¿Descartar los cambios de la encuesta que estás editando?'))) return; admin.draft = newSurvey(); admin.dirty = false; renderEditor(); };
    el.querySelector('.survey-refresh').onclick = function () { loadAdmin(); };
    renderList(); renderEditor(); if (!admin.loaded) loadAdmin();
  }
  window.addEventListener('beforeunload',function (event) { if (admin && (admin.dirty || admin.saving || admin.uploads)) { event.preventDefault(); event.returnValue = ''; } });
  window.TkSurveys = {connectPlayer:connectPlayer,refreshPlayer:refreshPlayer,resetPlayer:resetPlayer,mountAdmin:mountAdmin};
})();
