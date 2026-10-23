/* Fit uploads to the catalog's 4:3 frame before saving. No image leaves the browser. */
(function () {
  'use strict';
  window.TkFrameReward = function (file) {
    return new Promise(function (resolve, reject) {
      var url = URL.createObjectURL(file), img = new Image();
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error('image')); };
      img.onload = function () {
        URL.revokeObjectURL(url);
        var previous = document.activeElement;
        var dialog = document.createElement('dialog');
        dialog.className = 'reward-frame-dialog';
        dialog.setAttribute('aria-labelledby', 'rewardFrameTitle');
        dialog.innerHTML = '<h2 id="rewardFrameTitle">Encuadrar foto del premio</h2>' +
          '<p>La foto empieza completa y centrada. Arrástrala para colocar el objeto y ajusta su tamaño. El recuadro muestra cómo se guardará.</p>' +
          '<canvas width="512" height="384" tabindex="0" aria-label="Vista previa. Arrastra la foto o usa las flechas para moverla."></canvas>' +
          '<label>Tamaño <input type="range" min="0.25" max="3" step="0.01" value="1" aria-label="Tamaño de la foto"></label>' +
          '<div class="reward-frame-actions"><button type="button" data-frame="reset">Centrar y ver completa</button><button type="button" data-frame="cancel">Cancelar</button><button type="button" data-frame="save">Usar este encuadre</button></div>';
        document.body.appendChild(dialog);
        var canvas = dialog.querySelector('canvas'), ctx = canvas.getContext('2d');
        var range = dialog.querySelector('input');
        var fit = Math.min(480 / img.naturalWidth, 352 / img.naturalHeight);
        var zoom = 1, x = 256, y = 192, drag = null;
        function draw() {
          ctx.clearRect(0, 0, 512, 384);
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          var w = img.naturalWidth * fit * zoom, h = img.naturalHeight * fit * zoom;
          ctx.drawImage(img, x - w / 2, y - h / 2, w, h);
        }
        function finish(value) {
          dialog.close(); dialog.remove();
          if (previous && previous.isConnected) previous.focus();
          resolve(value);
        }
        range.oninput = function () { zoom = Number(range.value); draw(); };
        canvas.onpointerdown = function (e) {
          drag = {x: e.clientX, y: e.clientY}; canvas.setPointerCapture(e.pointerId);
        };
        canvas.onpointermove = function (e) {
          if (!drag) return;
          var rect = canvas.getBoundingClientRect();
          x = Math.max(0, Math.min(512, x + (e.clientX - drag.x) * 512 / rect.width));
          y = Math.max(0, Math.min(384, y + (e.clientY - drag.y) * 384 / rect.height));
          drag = {x: e.clientX, y: e.clientY}; draw();
        };
        canvas.onpointerup = canvas.onpointercancel = function () { drag = null; };
        canvas.onkeydown = function (e) {
          var step = e.shiftKey ? 16 : 4;
          if (e.key === 'ArrowLeft') x -= step;
          else if (e.key === 'ArrowRight') x += step;
          else if (e.key === 'ArrowUp') y -= step;
          else if (e.key === 'ArrowDown') y += step;
          else return;
          e.preventDefault(); x = Math.max(0, Math.min(512, x)); y = Math.max(0, Math.min(384, y)); draw();
        };
        dialog.querySelector('[data-frame="reset"]').onclick = function () {
          x = 256; y = 192; zoom = 1; range.value = '1'; draw();
        };
        dialog.querySelector('[data-frame="cancel"]').onclick = function () { finish(null); };
        dialog.oncancel = function (e) { e.preventDefault(); finish(null); };
        dialog.querySelector('[data-frame="save"]').onclick = function () {
          try {
            var data = canvas.toDataURL('image/webp', .85);
            if (!data.startsWith('data:image/webp')) data = canvas.toDataURL('image/png');
            finish(data);
          } catch (e) { dialog.close(); dialog.remove(); reject(e); }
        };
        draw(); dialog.showModal();
      };
      img.src = url;
    });
  };
})();
