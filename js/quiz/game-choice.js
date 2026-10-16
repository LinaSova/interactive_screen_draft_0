/* Режимы A и B — выбор одного из четырёх вариантов.
   A (game-a.html): дано название, выбрать образец.
     После ответа поле с названием окрашивается в правильный цвет;
     на ошибочно выбранном образце появляется его настоящее название.
   B (game-b.html): дан образец, выбрать название.
     После ответа на образце появляется правильное название;
     ошибочно выбранный вариант окрашивается в цвет со своим названием.
   Режим берётся из <body data-mode="A|B">. */
(function () {
  "use strict";
  const Q = window.Quiz;
  const { shuffle, pickRandom, pad } = Utils;
  const $ = id => document.getElementById(id);

  const isA = document.body.dataset.mode === 'A';
  const ANSWER_PAUSE_MS = 2600;

  let questions = [];
  let index = 0;
  let answers = [];
  let locked = false;

  function startRound() {
    questions = pickRandom(Q.COLORS, Q.QUESTIONS_PER_ROUND).map(color => ({
      color,
      options: shuffle([color, ...Q.randomColors([color.name], 3)]),
    }));
    index = 0;
    answers = [];
    locked = false;
    Q.showScreen('screenGame');
    renderQuestion();
  }

  function renderQuestion() {
    const q = questions[index];

    if (isA) {
      $('stimBox').style.background = '';
      $('stimBox').style.color = '';
      $('stimName').textContent = `«${q.color.name}»`;
    } else {
      $('stimColor').style.background = q.color.hex;
      $('stimReveal').textContent = '';
    }

    $('options').innerHTML = q.options.map((opt, i) => isA
      ? `<button type="button" class="option-btn swatch-option" data-index="${i}" aria-label="Вариант ${Q.LETTERS[i]}">
           <span class="opt-letter">${Q.LETTERS[i]}</span><span class="opt-swatch" style="background:${opt.hex}"></span>
         </button>`
      : `<button type="button" class="option-btn name-option" data-index="${i}">
           <span class="opt-letter">${Q.LETTERS[i]}</span><span class="opt-name">${opt.name}</span>
         </button>`
    ).join('');
    $('options').querySelectorAll('.option-btn').forEach(btn => {
      btn.addEventListener('click', () => handleAnswer(parseInt(btn.dataset.index, 10)));
    });

    $('feedback').innerHTML = '';
    Q.setCounter(`${pad(index + 1)} / ${pad(questions.length)}`);
    $('app').scrollTop = 0;
  }

  function handleAnswer(selectedIdx) {
    if (locked) return;
    locked = true;
    const q = questions[index];
    const selected = q.options[selectedIdx];
    const isCorrect = selected.name === q.color.name;

    Q.Stats.record(q.color.name, isCorrect);

    // показать правильный ответ на самом вопросе
    if (isA) {
      $('stimBox').style.background = q.color.hex;
      $('stimBox').style.color = Q.inkOn(q.color.hex);
    } else {
      $('stimReveal').textContent = q.color.name;
      $('stimReveal').style.color = Q.inkOn(q.color.hex);
    }

    $('options').querySelectorAll('.option-btn').forEach((btn, i) => {
      if (q.options[i].name === q.color.name) btn.classList.add('correct');
      else if (i === selectedIdx) {
        btn.classList.add('wrong');
        revealWrongOption(btn, selected);
      }
      else btn.classList.add('dim');
      btn.classList.add('disabled');
    });

    $('feedback').innerHTML = isCorrect
      ? `<p class="feedback-text good">Верно!</p>`
      : `<p class="feedback-text bad">Не совсем — это «<span class="cname">${q.color.name}</span>»</p>`;

    answers.push({ selected: selected.name, correct: isCorrect });

    setTimeout(nextQuestion, ANSWER_PAUSE_MS);
  }

  // A: на выбранном образце пишем его настоящее название; B: красим вариант в его цвет
  function revealWrongOption(btn, color) {
    if (isA) {
      btn.insertAdjacentHTML('beforeend',
        `<span class="opt-reveal" style="color:${Q.inkOn(color.hex)}">${color.name}</span>`);
    } else {
      btn.style.background = color.hex;
      btn.style.color = Q.inkOn(color.hex);
    }
  }

  function nextQuestion() {
    index++;
    locked = false;
    if (index < questions.length) { renderQuestion(); return; }
    Q.showResults({
      items: questions.map((q, i) => ({ color: q.color, ...answers[i] })),
      label: 'Правильных ответов',
      pickedVerb: 'выбрали',
      onRestart: startRound,
    });
  }

  startRound();
})();
