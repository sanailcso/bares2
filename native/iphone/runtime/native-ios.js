/* Loaded only inside the packaged iPhone app. */
(function(){
  'use strict';
  window.__TK_NATIVE_IOS__=true;
  document.documentElement.classList.add('native-ios');
  function connection(){
    var banner=document.getElementById('nativeConnection');
    if(navigator.onLine===false){
      if(!banner){banner=document.createElement('div');banner.id='nativeConnection';banner.setAttribute('role','status');banner.textContent='Sin conexión. Vuelve a conectarte para jugar y actualizar tus puntos.';document.body.appendChild(banner);}
    }else if(banner){banner.remove();}
  }
  window.addEventListener('offline',connection);
  window.addEventListener('online',function(){
    connection();
    // Reuse the existing authenticated sync; never award points locally.
    document.dispatchEvent(new Event('visibilitychange'));
  });
  document.addEventListener('DOMContentLoaded',connection);
})();
