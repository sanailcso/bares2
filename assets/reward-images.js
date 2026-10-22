/* Shared catalog image values. Admin configuration is the source of truth. */
(function () {
  'use strict';
  var photos = [
    ['Llavero premium', './img/club-keyring.webp'],
    ['Gorra Tiki Taka', './img/club-cap.webp'],
    ['Set de copas de bar', './img/club-glasses.webp'],
    ['Mochila de viaje', './img/club-rewards-sheet.jpg#reward-0'],
    ['Auriculares inalámbricos', './img/club-rewards-sheet.jpg#reward-1'],
    ['Altavoz Bluetooth', './img/club-rewards-sheet.jpg#reward-2'],
    ['Tablet de 10 pulgadas', './img/club-rewards-sheet.jpg#reward-3'],
    ['Smart TV de 50 pulgadas', './img/club-rewards-sheet.jpg#reward-4'],
    ['Escapada rural (2 noches)', './img/club-rewards-sheet.jpg#reward-5'],
    ['Fin de semana en la nieve', './img/club-rewards-sheet.jpg#reward-6'],
    ['Crucero por el Mediterráneo', './img/club-rewards-sheet.jpg#reward-7']
  ];
  function key(name) { return String(name || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, ''); }
  function esc(value) { return String(value == null ? '' : value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function migrate(items) {
    (items || []).forEach(function (item) {
      // Null/empty image is an explicit admin decision and must stay empty.
      if (!item || Object.prototype.hasOwnProperty.call(item, 'image')) return;
      var photo = photos.find(function (entry) { return key(entry[0]) === key(item.name); });
      item.image = photo ? photo[1] : null;
    });
    return items;
  }
  function markup(item, decorative) {
    if (!item || !item.image) return '';
    var match = /^\.\/img\/club-rewards-sheet\.jpg#reward-([0-7])$/.exec(item.image);
    var alt = decorative ? '' : item.name;
    if (!match) return '<img class="r-img" src="' + esc(item.image) + '" alt="' + esc(alt) + '" decoding="async">';
    var index = Number(match[1]), cell = 443.5;
    return '<svg class="club-product-photo" width="100%" height="100%" viewBox="' + (index % 4 * cell) + ' ' + (Math.floor(index / 4) * cell) + ' ' + cell + ' ' + cell + '" preserveAspectRatio="xMidYMid meet" ' +
      (decorative ? 'aria-hidden="true"' : 'role="img" aria-label="' + esc(alt) + '"') +
      '><image href="./img/club-rewards-sheet.jpg" width="1774" height="887"/></svg>';
  }
  function create(item, decorative) {
    var template = document.createElement('template'); template.innerHTML = markup(item, decorative);
    return template.content.firstElementChild;
  }
  function options() {
    return '<option value="">Elegir foto del catálogo…</option>' + photos.map(function (photo) {
      return '<option value="' + esc(photo[1]) + '">' + esc(photo[0]) + '</option>';
    }).join('');
  }
  window.TkRewardImages = { migrate: migrate, markup: markup, create: create, options: options };
})();
