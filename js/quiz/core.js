/* Общее для всех страниц викторины: настройки, режим киоска, вспомогательные функции */
(function () {
  "use strict";
  const Q = window.Quiz = window.Quiz || {};

  Q.QUESTIONS_PER_ROUND = 5;
  Q.PAIRS = 4;
  Q.LETTERS = ['А', 'Б', 'В', 'Г'];
  Q.IDLE_MS = 45000;            // через сколько бездействия на статистике киоск возвращается к заставке
  Q.ATTRACT_PAGE = '0.html';
  Q.MODES_PAGE = 'modes.html';

  // Режим киоска: вход через заставку 0.html, ссылки несут ?kiosk,
  // после игры — возврат к выбору режима, при бездействии — к заставке.
  Q.kiosk = new URLSearchParams(location.search).has('kiosk');
  Q.link = url => Q.kiosk ? url + (url.includes('?') ? '&' : '?') + 'kiosk' : url;

  // ----- ЦВЕТА -----
  Q.randomColors = function (excludeNames, count) {
    let pool = Q.COLORS.filter(c => !excludeNames.includes(c.name));
    if (pool.length < count) pool = Q.COLORS.slice();
    return Utils.pickRandom(pool, count);
  };
  // цвет текста, который читается поверх образца
  Q.inkOn = function (hex) {
    const n = parseInt(hex.slice(1), 16);
    const lum = 0.299 * (n >> 16 & 255) + 0.587 * (n >> 8 & 255) + 0.114 * (n & 255);
    return lum > 150 ? '#171814' : '#fbfcf7';
  };

  // ----- ЭКРАН -----
  // счётчик раундов внизу страницы; пустой текст — скрыть
  Q.setCounter = function (text) {
    const el = document.getElementById('roundIndicator');
    if (!el) return;
    el.textContent = text || '';
    el.hidden = !text;
  };
  // показывает один из <section class="screen"> внутри #app
  Q.showScreen = function (id) {
    const app = document.getElementById('app');
    app.querySelectorAll(':scope > .screen').forEach(s => { s.hidden = s.id !== id; });
    app.scrollTop = 0;
  };

  // Разметка страницы: ссылки с data-kiosk-link сохраняют режим киоска,
  // элементы с data-hide-in-kiosk в киоске скрыты.
  document.querySelectorAll('a[data-kiosk-link]').forEach(a => {
    a.setAttribute('href', Q.link(a.getAttribute('href')));
  });
  if (Q.kiosk) document.querySelectorAll('[data-hide-in-kiosk]').forEach(el => { el.hidden = true; });
})();
