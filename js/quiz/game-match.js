/* Режим C (game-c.html) — разложить четыре образца по названиям.
   Таблица: слева клетка для образца, справа название.
   Мышь: перетаскивание. Сенсорный экран: тянуть пальцем или коснуться образца, затем строки.
   Образец можно перенести из одной клетки в другую (занятые меняются местами)
   или вернуть наверх; «Сбросить всё» возвращает все образцы. */
(function () {
  "use strict";
  const Q = window.Quiz;
  const { shuffle, pickRandom } = Utils;
  const $ = id => document.getElementById(id);

  let targets = [];     // цвета в порядке строк с названиями
  let trayOrder = [];   // те же цвета в порядке образцов сверху — отдельно от названий
  let assign = {};      // название строки → имя положенного туда цвета
  let selected = null;  // образец, выбранный касанием

  const slotOf = colorName => Object.keys(assign).find(k => assign[k] === colorName) || null;

  function startRound() {
    const colors = pickRandom(Q.COLORS, Q.PAIRS);
    targets = shuffle(colors.slice());
    trayOrder = shuffle(colors.slice());
    assign = {};
    selected = null;
    Q.showScreen('screenGame');
    render();
  }

  function fishHtml(c) {
    return `<div class="drag-fish ${selected === c.name ? 'selected' : ''}" draggable="true" data-color="${c.name}" style="background:${c.hex}"></div>`;
  }

  function render() {
    const placed = Object.keys(assign).length;
    const used = Object.values(assign);
    const free = trayOrder.filter(c => !used.includes(c.name));

    $('fishTray').innerHTML = free.length
      ? free.map(fishHtml).join('')
      : '<span class="placed-note">Все образцы разложены</span>';

    $('matchTable').innerHTML = targets.map(c => {
      const put = assign[c.name] ? Q.colorByName(assign[c.name]) : null;
      return `
        <div class="match-row ${put ? 'filled' : ''}" data-target="${c.name}">
          <div class="match-slot">${put ? fishHtml(put) : ''}</div>
          <span class="match-name">${c.name}</span>
        </div>`;
    }).join('');

    $('checkBtn').disabled = placed < Q.PAIRS;
    $('resetBtn').disabled = placed === 0;

    bindFish();
    bindRows();
  }

  // ----- ДЕЙСТВИЯ -----
  // положить образец в строку; если он уже лежал в другой строке, а целевая занята — поменять местами
  function place(colorName, target) {
    const from = slotOf(colorName);
    const prev = assign[target];
    if (from) delete assign[from];
    assign[target] = colorName;
    if (prev && prev !== colorName && from) assign[from] = prev;
    selected = null;
    render();
  }
  // вернуть образец наверх
  function unplace(colorName) {
    const from = slotOf(colorName);
    if (from) delete assign[from];
    selected = null;
    render();
  }

  // ----- СОБЫТИЯ -----
  function bindFish() {
    document.querySelectorAll('.drag-fish').forEach(fish => {
      // мышь: HTML5 drag & drop
      fish.addEventListener('dragstart', e => {
        e.dataTransfer.setData('text/plain', fish.dataset.color);
        fish.classList.add('dragging');
      });
      fish.addEventListener('dragend', () => fish.classList.remove('dragging'));
      // касание или клик: выбрать образец
      fish.addEventListener('click', e => {
        e.stopPropagation();
        selected = selected === fish.dataset.color ? null : fish.dataset.color;
        render();
      });
      // сенсорный экран: тянем «призрак» пальцем
      fish.addEventListener('touchstart', e => startTouchDrag(e, fish), { passive: false });
    });
  }

  function bindDropTarget(el, onDrop) {
    el.addEventListener('dragover', e => { e.preventDefault(); el.classList.add('over'); });
    el.addEventListener('dragleave', () => el.classList.remove('over'));
    el.addEventListener('drop', e => {
      e.preventDefault();
      el.classList.remove('over');
      const colorName = e.dataTransfer.getData('text/plain');
      if (colorName) onDrop(colorName);
    });
  }

  function bindRows() {
    document.querySelectorAll('.match-row').forEach(row => {
      const target = row.dataset.target;
      bindDropTarget(row, colorName => place(colorName, target));
      row.addEventListener('click', () => { if (selected) place(selected, target); });
    });
  }

  // лоток с образцами создаётся один раз
  bindDropTarget($('fishTray'), unplace);
  $('fishTray').addEventListener('click', () => {
    if (selected && slotOf(selected)) unplace(selected);
  });

  function startTouchDrag(e, fish) {
    const t = e.touches[0];
    const colorName = fish.dataset.color;
    const startX = t.clientX, startY = t.clientY;
    let ghost = null, moved = false;

    const clearOver = () => document.querySelectorAll('.over').forEach(z => z.classList.remove('over'));

    const onMove = ev => {
      const p = ev.touches[0];
      if (!moved && Math.hypot(p.clientX - startX, p.clientY - startY) < 8) return;
      ev.preventDefault();
      if (!ghost) {
        moved = true;
        ghost = document.createElement('div');
        ghost.className = 'drag-ghost';
        ghost.style.background = Q.colorByName(colorName).hex;
        document.body.appendChild(ghost);
        fish.classList.add('dragging');
      }
      ghost.style.left = p.clientX + 'px';
      ghost.style.top = p.clientY + 'px';
      clearOver();
      const zone = zoneAt(p);
      if (zone) zone.classList.add('over');
    };

    const onEnd = ev => {
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onEnd);
      if (ghost) ghost.remove();
      clearOver();
      if (!moved) return; // это было касание — сработает click
      ev.preventDefault();
      const zone = zoneAt(ev.changedTouches[0]);
      if (!zone) render();
      else if (zone.id === 'fishTray') unplace(colorName);
      else place(colorName, zone.dataset.target);
    };

    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('touchend', onEnd, { passive: false });
  }

  function zoneAt(point) {
    const el = document.elementFromPoint(point.clientX, point.clientY);
    return el && el.closest('.match-row, #fishTray');
  }

  $('resetBtn').addEventListener('click', () => {
    assign = {};
    selected = null;
    render();
  });

  $('checkBtn').addEventListener('click', () => {
    if (Object.keys(assign).length < Q.PAIRS) return;
    const items = targets.map(c => {
      const put = assign[c.name] || '';
      const ok = put === c.name;
      Q.Stats.record(c.name, ok);
      return { color: c, selected: put, correct: ok };
    });
    Q.showResults({ items, label: 'Совпало пар', pickedVerb: 'положили', onRestart: startRound });
  });

  startRound();
})();
