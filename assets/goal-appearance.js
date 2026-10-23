/* Per-prize presentation controls shared by the home card and admin preview. */
(function () {
  'use strict';
  var fields = [
    ['fade', 'Intensidad del degradado', 0, 100, 100, '%'],
    ['reach', 'Recorrido del degradado', 10, 100, 100, '%'],
    ['angle', 'Dirección del degradado', 0, 360, 90, '°'],
    ['scale', 'Tamaño de la imagen', 50, 200, 100, '%'],
    ['x', 'Posición horizontal', -50, 50, 0, '%'],
    ['y', 'Posición vertical', -50, 50, 0, '%'],
    ['rotate', 'Giro de la imagen', -180, 180, 0, '°']
  ];
  function normalize(value) {
    var out = {}; value = value || {};
    fields.forEach(function (f) {
      var n = value[f[0]];
      out[f[0]] = typeof n === 'number' && Number.isFinite(n) ? Math.min(f[3], Math.max(f[2], n)) : f[4];
    });
    return out;
  }
  function apply(art, value) {
    var a = normalize(value);
    var stops = [[0,0],[18,.06],[38,.25],[60,.58],[82,.88],[100,1]].map(function (s) {
      return 'rgba(0,0,0,' + (1 - a.fade / 100 * (1 - s[1])) + ') ' + (s[0] * a.reach / 100) + '%';
    });
    var mask = 'linear-gradient(' + a.angle + 'deg,' + stops.join(',') + ')';
    if (art.style.maskImage !== mask) { art.style.maskImage = mask; art.style.webkitMaskImage = mask; }
    var transform = 'translate(' + a.x + '%, ' + a.y + '%) rotate(' + a.rotate + 'deg) scale(' + a.scale / 100 + ')';
    if (art.firstElementChild && art.firstElementChild.style.transform !== transform) art.firstElementChild.style.transform = transform;
    return a;
  }
  function edit(item) {
    return new Promise(function (resolve) {
      var previous = document.activeElement, value = normalize(item.homeAppearance);
      var dialog = document.createElement('dialog'); dialog.className = 'goal-appearance-dialog';
      dialog.setAttribute('aria-labelledby', 'goalAppearanceTitle');
      dialog.innerHTML = '<h2 id="goalAppearanceTitle">Imagen de portada</h2>' +
        '<p>Ajusta este premio en «Tu próximo premio». 90° hace aparecer la imagen de izquierda a derecha. Intensidad 0% elimina el degradado.</p>' +
        '<div class="club-goal goal-appearance-preview"><div class="club-goal-content"><div class="club-eyebrow">TU PRÓXIMO PREMIO</div><h2 class="goal-preview-name"></h2><p>Te faltan 1.500 puntos</p></div><div class="club-goal-art"></div><div class="club-goal-browse"><button type="button" disabled aria-label="Anterior">‹</button><span>Vista previa</span><button type="button" disabled aria-label="Siguiente">›</button></div><div class="club-goal-progress"><div class="club-track"><span style="width:40%"></span></div><div class="club-progress-labels"><span>1.000 / 2.500 pts</span><span>40 %</span></div></div></div>' +
        '<div class="goal-appearance-fields">' + fields.map(function (f) {
          return '<label for="goal-setting-' + f[0] + '"><span>' + f[1] + ' <output></output></span><input id="goal-setting-' + f[0] + '" data-setting="' + f[0] + '" type="range" min="' + f[2] + '" max="' + f[3] + '" value="' + value[f[0]] + '"></label>';
        }).join('') + '</div><div class="goal-appearance-actions"><button type="button" data-action="reset">Restablecer</button><button type="button" data-action="cancel">Cancelar</button><button type="button" data-action="save">Guardar ajustes</button></div>';
      dialog.querySelector('.goal-preview-name').textContent = item.name || 'Premio';
      var art = dialog.querySelector('.club-goal-art'), image = TkRewardImages.create(item, true);
      if (image) art.appendChild(image);
      else { var emoji = document.createElement('span'); emoji.className = 'club-goal-symbol'; emoji.textContent = item.emoji || '🎁'; art.appendChild(emoji); }
      function update() {
        fields.forEach(function (f) {
          var input = dialog.querySelector('[data-setting="' + f[0] + '"]');
          input.value = value[f[0]];
          input.parentElement.querySelector('output').textContent = value[f[0]] + f[5];
        });
        apply(art, value);
      }
      dialog.querySelectorAll('input').forEach(function (input) {
        input.oninput = function () { value[input.dataset.setting] = Number(input.value); update(); };
      });
      function finish(result) { dialog.close(); dialog.remove(); if (previous && previous.isConnected) previous.focus(); resolve(result); }
      dialog.querySelector('[data-action="reset"]').onclick = function () { value = normalize(); update(); };
      dialog.querySelector('[data-action="cancel"]').onclick = function () { finish(null); };
      dialog.querySelector('[data-action="save"]').onclick = function () { finish(normalize(value)); };
      dialog.oncancel = function (e) { e.preventDefault(); finish(null); };
      document.body.appendChild(dialog); update(); dialog.showModal();
    });
  }
  window.TkGoalAppearance = {normalize: normalize, apply: apply, edit: edit};
})();
