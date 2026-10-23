/* Club diario: presentation and navigation. Game results remain in app.js / Supabase. */
(function () {
  'use strict';
  var ready = false, scheduled = false, route = 'inicio', catalogSignature = '';
  function photoKey(item) { return item.image || ''; }
  function makePhoto(item, decorative) { return TkRewardImages.create(item, decorative); }
  function byId(id) { return document.getElementById(id); }
  function put(id, text) { var el = byId(id); if (el && el.textContent !== String(text)) el.textContent = text; }
  function goalKey() { return 'tikitaka_club_goal_' + currentUser; }
  var goalSession = { user: '', name: '' };
  function chooseGoal(name) {
    goalSession = { user: currentUser, name: name };
    try { localStorage.setItem(goalKey(), name); } catch (e) {}
  }
  function selectedGoal(items) {
    var name = goalSession.user === currentUser ? goalSession.name : ''; try { name = localStorage.getItem(goalKey()) || name; } catch (e) {}
    return items.find(function (it) { return it.name === name; }) ||
      items.filter(function (it) { return it.cost > state.points; }).sort(function (a, b) { return a.cost - b.cost; })[0] ||
      items.slice().sort(function (a, b) { return b.cost - a.cost; })[0];
  }
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
    TkGoalAppearance.apply(art, item.homeAppearance);
    var signature = items.map(function (it) { return it.name + ':' + it.cost; }).join('|');
    var select = byId('clubGoalSelect');
    if (signature !== catalogSignature) {
      select.replaceChildren(); items.forEach(function (it) { var option = document.createElement('option'); option.value = it.name; option.textContent = it.name + ' · ' + fmt(it.cost) + ' pts'; select.appendChild(option); });
      catalogSignature = signature;
    }
    select.value = item.name;
    var index = items.indexOf(item);
    put('clubGoalPosition', (index + 1) + ' / ' + items.length);
    byId('clubGoalBrowse').hidden = items.length < 2;
  }

  function browseGoal(direction) {
    var items = catalogItems();
    if (items.length < 2) return;
    var index = items.indexOf(selectedGoal(items));
    var item = items[(index + direction + items.length) % items.length];
    chooseGoal(item.name);
    syncGoal();
    put('clubGoalAnnouncement', 'Objetivo: ' + item.name + ', ' + fmt(item.cost) + ' puntos');
  }
  function initGoalSwipe() {
    var panel = byId('clubGoal'), gesture = null, suppressClickUntil = 0;
    var interactive = function (target) { return target.closest('button,a,input,select,textarea'); };
    panel.addEventListener('pointerdown', function (event) {
      if (!event.isPrimary || (event.pointerType === 'mouse' && event.button !== 0) || interactive(event.target)) return;
      gesture = { id: event.pointerId, x: event.clientX, y: event.clientY };
      panel.setPointerCapture(event.pointerId);
    });
    panel.addEventListener('pointerup', function (event) {
      if (!gesture || gesture.id !== event.pointerId) return;
      var dx = event.clientX - gesture.x, dy = event.clientY - gesture.y;
      gesture = null;
      if (Math.abs(dx) < 42 || Math.abs(dx) <= Math.abs(dy) * 1.4) return;
      suppressClickUntil = Date.now() + 350;
      browseGoal(dx < 0 ? 1 : -1);
    });
    ['pointercancel', 'lostpointercapture'].forEach(function (name) {
      panel.addEventListener(name, function () { gesture = null; });
    });
    panel.addEventListener('click', function (event) {
      if (Date.now() < suppressClickUntil && !interactive(event.target)) { event.preventDefault(); event.stopPropagation(); }
    }, true);
    panel.addEventListener('keydown', function (event) {
      if (interactive(event.target)) return;
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault(); browseGoal(event.key === 'ArrowRight' ? 1 : -1);
      }
    });
    byId('clubGoalPrevious').onclick = function () { browseGoal(-1); };
    byId('clubGoalNext').onclick = function () { browseGoal(1); };
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
    if (footValues.length > 1) footValues[footValues.length - 1].textContent = byId('balance').textContent || fmt(state.points);
    syncGoal(); syncWeek();
    var mine = localRedemptions().filter(function (r) { return r.username === currentUser && !r.cancelled && !r.delivered; });
    put('clubCanjeCount', mine.length ? '(' + mine.length + ')' : '');
    byId('clubCanjesEmpty').hidden = mine.length > 0;
    document.body.classList.toggle('club-home', route === 'inicio');
    document.body.classList.toggle('club-playing', route === 'inicio' || route === 'jugar');
  }
  function queueSync() { if (ready && !scheduled) { scheduled = true; requestAnimationFrame(sync); } }
  // Emphasize confirmed balance changes without changing the points awarded.
  var originalCountUp = window.countUp, gainTimer;
  window.countUp = function (element, from, to, duration) {
    if (element !== byId('balance') || to === from) return originalCountUp.apply(this, arguments);
    var increase = to > from, delta = (increase ? '+' : '−') + fmt(Math.abs(to - from)) + ' puntos';
    var wallets = [element.closest('.balance-wrap'), document.querySelector('.club-wallet')];
    clearTimeout(gainTimer);
    put('clubGameGain', delta); put('clubHomeGain', delta);
    document.body.classList.add('club-points-changing');
    wallets.forEach(function (wallet) {
      if (!wallet) return;
      wallet.classList.remove('is-gaining', 'is-spending');
      void wallet.offsetWidth; // Restart the pulse for consecutive awards.
      wallet.classList.add(increase ? 'is-gaining' : 'is-spending');
    });
    duration = Math.max(duration || 0, increase ? 1100 : 700);
    gainTimer = setTimeout(function () {
      put('clubGameGain', ''); put('clubHomeGain', '');
      wallets.forEach(function (wallet) { if (wallet) wallet.classList.remove('is-gaining', 'is-spending'); });
      document.body.classList.remove('club-points-changing');
    }, Math.max(3200, duration + 600));
    return originalCountUp.call(this, element, from, to, duration);
  };
  window.tkClubNavigation = function (name) {
    route = name;
    if (!ready) return;
    if (name !== 'jugar') byId('tab-jugar').style.removeProperty('animation');
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
    initGoalSwipe();
    // The real animated balance shares the fixed dock with the bottom navigation.
    byId('clubBottomDock').insertBefore(document.querySelector('.balance-wrap'), byId('userNavBottom'));
    byId('clubHomeGame').appendChild(byId('clubGame'));
    // Move the existing game before its original click handler runs. Never replay a click.
    byId('clubGame').addEventListener('click', function (event) {
      var button=event.target.closest('#spinBtn,#lever,#betGo,#rcGo');
      if(route!=='inicio'||!button||button.disabled||button.getAttribute('aria-disabled')==='true')return;
      byId('tab-jugar').style.animation='none';
      go('jugar');
      // Cancel the normal smooth navigation scroll so the game is ready in this frame.
      window.scrollTo({top:0,behavior:'instant'});
      button.focus({preventScroll:true});
    }, true);

    var nav = byId('userNavBottom'), dock = byId('clubBottomDock');
    function measureDock() {
      var height = dock.getBoundingClientRect().height;
      if (height > 0) {
        document.documentElement.style.setProperty('--club-dock-height', height + 'px');
        document.documentElement.style.setProperty('--club-nav-height', nav.getBoundingClientRect().height + 'px');
      }
    }
    new ResizeObserver(measureDock).observe(dock);
    measureDock();
    window.__tkNav.apply('inicio');
    document.addEventListener('click', function (event) {
      var nav = event.target.closest('[data-club-nav]'); if (nav) { go(nav.dataset.clubNav); if (nav.dataset.clubNav === 'premios') { rewardsTab('catalog'); if (state) { state.onboardingCatalog = true; saveState(); renderOnboarding(); } } }
      var rewards = event.target.closest('[data-club-rewards]'); if (rewards) rewardsTab(rewards.dataset.clubRewards);
      var account = event.target.closest('[data-club-account]'); if (account) accountTab(account.dataset.clubAccount);
    });
    byId('clubProfile').onclick = function () { go('mibar'); accountTab('cuenta'); };
    byId('clubBrandHome').onclick = function (e) { e.preventDefault(); go('inicio'); };
    byId('clubNotifications').onclick = function () { requestNotif().then(function () { subscribeClientPush(); }); };
    byId('clubGoalSelect').onchange = function () { chooseGoal(this.value); queueSync(); toast('Tu objetivo se ha actualizado'); };
    new MutationObserver(queueSync).observe(byId('balance'), { childList: true, characterData: true, subtree: true });
    new MutationObserver(queueSync).observe(document.querySelector('.slot'), { attributes: true, attributeFilter: ['class'] });
    queueSync();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();


