/* Статистика по цветам за всё время: сколько раз каждый цвет угадали и сколько ошиблись.
   Общая для всех режимов викторины.

   Если страницы открыты через server.py (http://localhost:8000/...), статистика пишется
   в файл data/stats.json — общий для всех режимов, раундов и браузеров.
   Если страницы открыты напрямую как файлы, статистика хранится в localStorage браузера;
   некоторые браузеры не сохраняют её между файлами, поэтому для киоска нужен сервер. */
(function () {
  "use strict";
  const Q = window.Quiz;
  const API = '/api/stats';
  const KEY = 'quiz.colorStats';
  const viaServer = location.protocol === 'http:' || location.protocol === 'https:';

  let pending = Promise.resolve();  // незавершённые записи — дождаться перед чтением

  // ----- localStorage (запасной вариант без сервера) -----
  function loadLocal() {
    try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; }
  }
  function recordLocal(colorName, correct) {
    const all = loadLocal();
    const s = all[colorName] || (all[colorName] = { correct: 0, wrong: 0 });
    if (correct) s.correct++; else s.wrong++;
    try { localStorage.setItem(KEY, JSON.stringify(all)); } catch (e) { /* хранилище недоступно */ }
  }

  // ----- файл на сервере -----
  function recordServer(colorName, correct) {
    return fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: colorName, correct }),
      keepalive: true,
    }).then(r => { if (!r.ok) throw new Error(r.status); })
      .catch(() => recordLocal(colorName, correct));
  }

  Q.Stats = {
    record(colorName, correct) {
      if (!viaServer) { recordLocal(colorName, correct); return; }
      const write = recordServer(colorName, correct);
      pending = Promise.all([pending, write]);
    },
    // Promise<{ "ИМЯ ЦВЕТА": { correct, wrong }, ... }> — только для цветов, которые уже попадались
    async all() {
      if (!viaServer) return loadLocal();
      await pending;
      try {
        const r = await fetch(API, { cache: 'no-store' });
        if (r.ok) return await r.json();
      } catch (e) { /* сервер недоступен */ }
      return loadLocal();
    },
  };
})();
