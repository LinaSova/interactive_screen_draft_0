/* Заставка киоска (0.html): случайные образцы, касание — к выбору режима */
(function () {
  "use strict";
  const Q = window.Quiz;

  document.getElementById('swatchRow').innerHTML = Utils.pickRandom(Q.COLORS, 15)
    .map(c => `<span style="background:${c.hex}"></span>`).join('');

  document.getElementById('attract').addEventListener('click', () => {
    location.href = Q.MODES_PAGE + '?kiosk';
  });
})();
