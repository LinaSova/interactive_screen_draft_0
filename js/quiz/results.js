/* Экраны «Итог раунда» и «Статистика за всё время» — общие для всех режимов викторины.
   Режим вызывает Quiz.showResults(...) по окончании раунда. */
(function () {
  "use strict";
  const Q = window.Quiz;
  const $ = id => document.getElementById(id);

  let idleTimer = null;
  let restartRound = null;
  let roundColors = [];

  $('app').insertAdjacentHTML('beforeend', `
    <section class="screen" id="screenResult" hidden>
      <p class="section-label">итог раунда</p>
      <h2><span id="resultLabel"></span>: <em id="resultScore"></em> из <span id="resultTotal"></span></h2>
      <div class="result-list" id="resultList"></div>
      <div class="actions"><button type="button" class="btn-primary" id="toStatsBtn">Далее →</button></div>
    </section>

    <section class="screen" id="screenStats" hidden>
      <p class="section-label">все игроки · за всё время</p>
      <h2>Кто <em>угадал</em>, а кто нет</h2>
      <p class="stats-lede">Сколько раз посетители угадали каждый цвет и сколько раз ошиблись. Цвета из вашего раунда выделены.</p>
      <div class="stats-table">
        <div class="stats-head">
          <span class="stats-head-name">цвет</span>
          <span class="stat-col">угадали</span>
          <span class="stat-col">ошиблись</span>
        </div>
        <div id="statsList"></div>
      </div>
      <div class="actions">
        <button type="button" class="btn-primary" id="playAgainBtn">Играть ещё раз</button>
        <a class="btn-secondary" href="${Q.link(Q.MODES_PAGE)}">← В меню</a>
      </div>
    </section>`);

  /**
   * items      — [{ color, selected, correct }] по каждому вопросу / паре
   * label      — подпись к счёту: «Правильных ответов», «Совпало пар»
   * pickedVerb — «выбрали» / «положили» для строки с ошибкой
   * onRestart  — запускает новый раунд того же режима
   */
  Q.showResults = function ({ items, label, pickedVerb, onRestart }) {
    restartRound = onRestart;
    roundColors = items.map(i => i.color.name);
    const correctCount = items.filter(i => i.correct).length;

    $('resultLabel').textContent = label;
    $('resultScore').textContent = correctCount;
    $('resultTotal').textContent = items.length;
    $('resultList').innerHTML = items.map(item => `
      <div class="result-row">
        <span class="color-sample" style="background:${item.color.hex}"></span>
        <span class="result-text">
          <span class="result-name">${item.color.name}</span>
          ${item.correct ? '' : `<span class="result-picked">${pickedVerb}: ${item.selected || '—'}</span>`}
        </span>
        <span class="mark ${item.correct ? 'good' : 'bad'}">${item.correct ? '✓' : '✕'}</span>
      </div>`).join('');

    Q.setCounter('');
    Q.showScreen('screenResult');
  };

  // все цвета базы — даже те, что ещё ни разу не попадались
  async function showStats() {
    const stats = await Q.Stats.all();
    $('statsList').innerHTML = Q.COLORS.map(color => {
      const s = stats[color.name] || { correct: 0, wrong: 0 };
      const inRound = roundColors.includes(color.name);
      return `
        <div class="result-row ${inRound ? 'in-round' : ''}">
          <span class="color-sample" style="background:${color.hex}"></span>
          <span class="result-text">
            <span class="result-name">${color.name}</span>
          </span>
          <span class="stat-col good">${s.correct}</span>
          <span class="stat-col bad">${s.wrong}</span>
        </div>`;
    }).join('');

    Q.showScreen('screenStats');

    if (Q.kiosk) {
      idleTimer = setTimeout(() => { location.href = Q.ATTRACT_PAGE; }, Q.IDLE_MS);
    }
  }

  $('toStatsBtn').addEventListener('click', showStats);

  $('playAgainBtn').addEventListener('click', () => {
    clearTimeout(idleTimer);
    if (Q.kiosk) location.href = Q.link(Q.MODES_PAGE);
    else restartRound();
  });
})();
