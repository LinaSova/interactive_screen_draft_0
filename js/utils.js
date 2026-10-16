/* Общие мелкие функции для всех страниц */
(function () {
  "use strict";

  // перемешивает массив на месте и возвращает его
  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function pickRandom(arr, n) { return shuffle(arr.slice()).slice(0, n); }

  // 3 → "03"
  function pad(n) { return String(n).padStart(2, '0'); }

  window.Utils = { shuffle, pickRandom, pad };
})();
