/* Всплывающие окна (правила перед игрой, «О технике»).
   Разметка окна лежит в HTML страницы:
     <div class="modal-overlay" id="..." data-autoshow> — data-autoshow открывает окно при загрузке;
     кнопки с data-modal-open="id" открывают окно;
     клик по фону и кнопки с data-modal-close закрывают. */
(function () {
  "use strict";

  function open(id) { document.getElementById(id).classList.add('show'); }
  function close(id) { document.getElementById(id).classList.remove('show'); }

  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', e => {
      if (e.target === overlay || e.target.closest('[data-modal-close]')) close(overlay.id);
    });
  });
  document.querySelectorAll('[data-modal-open]').forEach(btn => {
    btn.addEventListener('click', () => open(btn.dataset.modalOpen));
  });
  document.querySelectorAll('.modal-overlay[data-autoshow]').forEach(overlay => open(overlay.id));

  window.Modal = { open, close };
})();
