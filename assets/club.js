/* Club diario: presentation and navigation. Game results remain in app.js / Supabase. */
(function () {
  'use strict';
  var ready = false, scheduled = false, route = 'inicio', catalogSignature = '';
  var originalImages = {
    'Llavero premium': './img/club-keyring.webp',
    'Gorra Tiki Taka': './img/club-cap.webp',
    'Set de copas de bar': './img/club-glasses.webp'
  };
  var sheetProducts = {
    mochiladeviaje: 0,
    auricularesinalambricos: 1,
    altavozbluetooth: 2,
    tabletde10pulgadas: 3,
    smarttvde50pulgadas: 4,
    escapadarural2noches: 5,
    findesemanaenlanieve: 6,
    cruceroporelmediterraneo: 7
  };
  function photoIndex(item) {
    var key = String(item.name || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
    return Object.prototype.hasOwnProperty.call(sheetProducts, key) ? sheetProducts[key] : null;
  }
  function photoKey(item) { var src = imageFor(item), index = photoIndex(item); return src || (index === null ? '' : 'rewards-sheet-' + index); }
  function makePhoto(item, decorative) {
    var src = imageFor(item);
    if (src) { var img = document.createElement('img'); img.className = 'r-img'; img.src = src; img.alt = decorative ? '' : item.name; img.decoding = 'async'; return img; }
    var index = photoIndex(item); if (index === null) return null;
    // One shared image, square viewBox and slice preserve photographic proportions.
    var ns = 'http://www.w3.org/2000/svg', svg = document.createElementNS(ns, 'svg'), image = document.createElementNS(ns, 'image');
    var cell = 443.5;
    svg.setAttribute('viewBox', (index % 4 * cell) + ' ' + (Math.floor(index / 4) * cell) + ' ' + cell + ' ' + cell);
    svg.setAttribute('preserveAspectRatio', 'xMidYMid slice'); svg.setAttribute('class', 'club-product-photo');
    if (decorative) svg.setAttribute('aria-hidden', 'true');
    else { svg.setAttribute('role', 'img'); svg.setAttribute('aria-label', item.name + ' · imagen ilustrativa'); }
    image.setAttribute('href', './img/club-rewards-sheet.jpg'); image.setAttribute('width', '1774'); image.setAttribute('height', '887');
    svg.appendChild(image); return svg;
  }
  function byId(id) { return document.getElementById(id); }
  function put(id, text) { var el = byId(id); if (el && el.textContent !== String(text)) el.textContent = text; }
  function goalKey() { return 'tikitaka_club_goal_' + currentUser; }
  function selectedGoal(items) {
    var name = ''; try { name = localStorage.getItem(goalKey()) || ''; } catch (e) {}
    return items.find(function (it) { return it.name === name; }) ||
      items.filter(function (it) { return it.cost > state.points; }).sort(function (a, b) { return a.cost - b.cost; })[0] ||
      items.slice().sort(function (a, b) { return b.cost - a.cost; })[0];
  }
  function imageFor(item) { return item.image || originalImages[item.name] || ''; }
  function syncGoal() {
    var items = catalogItems(), item = selectedGoal(items), panel = byId('clubGoal');
    panel.hidden = !item;
    byId('clubGoalPicker').hidden = !items.length;
    if (!item) return;
    var cost = Math.max(0, Number(item.cost) || 0), points = state.points || 0;
    var percent = cost ? Math.max(0, Math.min(100, points / cost * 100)) : 100;
    put('clubGoalName', item.name);
    put('clubGoalDistance', points >= cost ? 'Ya está a tu alcance.' : 'Te faltan ' + fmt(cost - points) + ' puntos');
    put('clubGoalNumbers', fmt(points) + ' / ' + fmt(cost) + ' pts');
    put('clubGoalPercent', Math.floor(percent) + ' %');
    byId('clubGoalFill').style.width = percent + '%';
    byId('clubGoalTrack').setAttribute('aria-valuenow', String(Math.round(percent)));
    panel.classList.toggle('ready', points >= cost);
    var art = byId('clubGoalArt'), photo = photoKey(item);
    if (art.dataset.src !== (photo || item.emoji || 'gift')) {
      art.replaceChildren(); art.dataset.src = photo || item.emoji || 'gift';
      if (photo) { art.appendChild(makePhoto(item, true)); }
      else { var symbol = document.createElement('span'); symbol.className = 'club-goal-symbol'; symbol.textContent = item.emoji && !/[?\uFFFD]/.test(item.emoji) ? item.emoji : '✦'; art.appendChild(symbol); }
    }
    var signature = items.map(function (it) { return it.name + ':' + it.cost; }).join('|');
    var select = byId('clubGoalSelect');
    if (signature !== catalogSignature) {
      select.replaceChildren(); items.forEach(function (it) { var option = document.createElement('option'); option.value = it.name; option.textContent = it.name + ' · ' + fmt(it.cost) + ' pts'; select.appendChild(option); });
      catalogSignature = signature;
    }
    select.value = item.name;
    // Reuse the existing catalog and redemption buttons; add only presentation images.
    document.querySelectorAll('#catalog .reward[data-idx],#catalog .next-prize[data-idx]').forEach(function (card) {
      var it = items[+card.getAttribute('data-idx')]; if (!it || it.image) return;
      var target = card.querySelector('.r-emoji,.np-emoji'), key = photoKey(it);
      if (target && key && target.dataset.clubPhoto !== key) { target.replaceChildren(makePhoto(it, true)); target.dataset.clubPhoto = key; }
    });
  }
  function syncWeek() {
    var days = rachaViva(), wrap = byId('clubWeekDays');
    put('clubWeekTitle', state.pendingBox ? 'Tu caja sorpresa te espera' : days ? 'Tu racha · día ' + days + ' de 7' : rachaPerdida() ? 'Hoy empieza una nueva racha' : 'Tu racha empieza hoy');
    var next = nextStreakGoal(days);
    put('clubWeekHint', state.pendingBox ? 'Abre tu caja desde Jugar.' : next && next.box ? 'Día 7: una caja de 70, 90 o 110 puntos.' : next ? 'Al día ' + next.day + ', +' + next.bonus + ' puntos.' : 'Un giro cada día. Un premio más cerca.');
    if (wrap.dataset.days !== String(days)) {
      wrap.dataset.days = String(days); wrap.replaceChildren();
      for (var i = 1; i <= 7; i++) { var d = document.createElement('div'), mark = document.createElement('span'), label = document.createElement('small'); d.className = 'club-day' + (i <= days ? ' done' : '') + (i === days + 1 ? ' next' : ''); mark.textContent = i <= days ? '✓' : i === 7 ? '✦' : String(i); label.textContent = 'Día ' + i; d.append(mark, label); wrap.appendChild(d); }
    }
  }
  function sync() {
    scheduled = false; if (!ready || !state || !currentUser) return;
    var info = USERS[currentUser] || {}, session = {};
    try { session = JSON.parse(localStorage.getItem('tikitaka_session') || '{}') || {}; } catch (e) {}
    var name = session.nombre || info.nombre || currentUser, bar = session.bar || info.bar || name;
    put('clubHeaderBar', bar); put('clubBarName', bar); put('clubAccountBar', bar);
    var first = name.replace(/^Bar\s+/i, '').split(' ')[0];
    var greeting = byId('clubGreeting');
    if (greeting.dataset.name !== name) { greeting.dataset.name = name; greeting.replaceChildren(document.createTextNode('Hola, ' + first + '.'), document.createElement('br'), document.createTextNode('Hoy también suma.')); }
    var initials = name.split(/\s+/).slice(0, 2).map(function (part) { return part.charAt(0); }).join('').toUpperCase();
    put('clubProfile', initials); put('clubAccountAvatar', initials); put('clubAccountName', name); put('clubAccountUsername', currentUser);
    put('clubHomeBalance', byId('balance').textContent || fmt(state.points));
    put('clubGameTitle', _game === 'bet' ? state.goldenRound ? 'Tu ronda dorada' : 'Tu ruleta de la suerte' : 'Tu giro de hoy');
    var left = betSpinsLeft();
    put('clubGameBadge', _game === 'bet' ? left + (left === 1 ? ' tirada disponible' : ' tiradas disponibles') : spunToday() ? 'Completado por hoy' : '1 tirada gratis');
    var footValues = document.querySelectorAll('#betPanel .bet-foot b');
    if (footValues.length > 1) footValues[footValues.length - 1].textContent = fmt(state.points);
    syncGoal(); syncWeek();
    var mine = localRedemptions().filter(function (r) { return r.username === currentUser && !r.cancelled && !r.delivered; });
    put('clubCanjeCount', mine.length ? '(' + mine.length + ')' : '');
    byId('clubCanjesEmpty').hidden = mine.length > 0;
    document.body.classList.toggle('club-home', route === 'inicio');
  }
  function queueSync() { if (ready && !scheduled) { scheduled = true; requestAnimationFrame(sync); } }
  window.tkClubNavigation = function (name) {
    route = name;
    if (!ready) return;
    var mount = byId(name === 'inicio' ? 'clubHomeGame' : 'clubPlayGame'), game = byId('clubGame');
    if ((name === 'inicio' || name === 'jugar') && game.parentNode !== mount) mount.appendChild(game);
    document.querySelectorAll('#userNavBottom button').forEach(function (b) { if (b.dataset.nav === name) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); });
    queueSync();
  };
  // Keep existing renderers and all their side effects, then refresh the new summaries.
  ['render', 'renderCatalog', 'renderMyCanjes', 'renderStreak', 'renderSpinState', 'renderBet', 'applyGameVisibility'].forEach(function (name) {
    var original = window[name]; if (typeof original !== 'function') return;
    window[name] = function () { var result = original.apply(this, arguments); queueSync(); return result; };
  });
  var originalPrizeModal = window.openPrizeModal;
  window.openPrizeModal = function (index) {
    var result = originalPrizeModal.apply(this, arguments), item = catalogItems()[index];
    var icon = document.querySelector('#prizeModal .pm-icon');
    if (icon && item && photoKey(item)) icon.replaceChildren(makePhoto(item, false));
    return result;
  };
  function go(name) { if (window.__tkNav) window.__tkNav.go(name); }
  function rewardsTab(name) {
    byId('clubCatalogPanel').hidden = name !== 'catalog'; byId('tab-canjes').hidden = name !== 'canjes';
    document.querySelectorAll('.club-segments button').forEach(function (b) { var selected = b.dataset.clubRewards === name; b.classList.toggle('selected', selected); b.setAttribute('aria-pressed', String(selected)); });
    queueSync();
  }
  function accountTab(name) {
    byId('tab-historial').hidden = name !== 'historial'; byId('tab-ranking').hidden = name !== 'ranking'; byId('clubAccount').hidden = name !== 'cuenta';
    document.querySelectorAll('.club-account-tabs button').forEach(function (b) { var selected = b.dataset.clubAccount === name; b.classList.toggle('selected', selected); b.setAttribute('aria-pressed', String(selected)); });
    if (name === 'ranking' && state) loadRanking();
  }
  function init() {
    ready = true;
    // app.js moves this HUD into .slot on DOMContentLoaded. Retain the HUD but
    // present it above the same game, so switching rodillos/ruleta keeps the balance.
    byId('clubGame').insertBefore(document.querySelector('.balance-wrap'), document.querySelector('.slot'));
    byId('clubHomeGame').appendChild(byId('clubGame'));
    window.__tkNav.apply('inicio');
    document.addEventListener('click', function (event) {
      var nav = event.target.closest('[data-club-nav]'); if (nav) { go(nav.dataset.clubNav); if (nav.dataset.clubNav === 'premios') { rewardsTab('catalog'); if (state) { state.onboardingCatalog = true; saveState(); renderOnboarding(); } } }
      var rewards = event.target.closest('[data-club-rewards]'); if (rewards) rewardsTab(rewards.dataset.clubRewards);
      var account = event.target.closest('[data-club-account]'); if (account) accountTab(account.dataset.clubAccount);
    });
    byId('clubProfile').onclick = function () { go('mibar'); accountTab('cuenta'); };
    byId('clubBrandHome').onclick = function (e) { e.preventDefault(); go('inicio'); };
    byId('clubNotifications').onclick = function () { requestNotif().then(function () { subscribeClientPush(); }); };
    byId('clubGoalSelect').onchange = function () { try { localStorage.setItem(goalKey(), this.value); } catch (e) {} queueSync(); toast('Tu objetivo se ha actualizado'); };
    new MutationObserver(queueSync).observe(byId('balance'), { childList: true, characterData: true, subtree: true });
    new MutationObserver(queueSync).observe(document.querySelector('.slot'), { attributes: true, attributeFilter: ['class'] });
    queueSync();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
