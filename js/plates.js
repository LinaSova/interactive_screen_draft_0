/* Игра «Точка совмещения» (пластины/prokudin-gorsky.html) */
(function(){
  "use strict";

  /* Материалы раундов: картинки из папки img/game (подготовлены из img/1 и img/2).
     Пути считаются от HTML-страницы, а не от этого файла. */
  var ROUNDS = [
    {
      dir:'img/game/1/', ratio:'1000 / 998',
      plate:'Пруд с кувшинками'
    },
    {
      dir:'img/game/2/', ratio:'1000 / 795',
      plate:'Деревянная церковь'
    }
  ];
  var TOTAL_ROUNDS = ROUNDS.length;

  var state = {
    positiveURL:{r:null,g:null,b:null},
    negativeURL:{r:null,g:null,b:null},
    correctURL:null,
    wrongURLs:[],
    answerOrder:[],
    correctIndex:0,
    plateOn:[false,false,false],
    answered:false,
    round:0,
    score:0,
    history:[]   // по раунду: { round, pool — варианты в показанном порядке, picked — индекс выбранного }
  };

  function setRoundAssets(r){
    var d = r.dir;
    state.negativeURL = { r:d+'negative-r.jpg', g:d+'negative-g.jpg', b:d+'negative-b.jpg' };
    state.positiveURL = { r:d+'positive-r.jpg', g:d+'positive-g.jpg', b:d+'positive-b.jpg' };
    state.correctURL = d+'answer-true.jpg';
    state.wrongURLs = [ d+'answer-false-1.jpg', d+'answer-false-2.jpg' ];
  }

  function preload(urls, done){
    var left = urls.length, finished = false;
    function one(){ if(--left <= 0 && !finished){ finished = true; done(); } }
    urls.forEach(function(u){
      var im = new Image();
      im.onload = one; im.onerror = one;
      im.src = u;
    });
    setTimeout(function(){ if(!finished){ finished = true; done(); } }, 8000);
  }

  function buildAll(){
    var ratio = ROUNDS[state.round].ratio;
    document.getElementById('plates').style.setProperty('--ar', ratio);
    document.getElementById('answers').style.setProperty('--ar', ratio);
    renderPlates();
    shuffleAndRenderAnswers();
    updateRoundIndicator();
  }

  function updateRoundIndicator(){
    var el = document.getElementById('roundIndicator');
    if(!el) return;
    el.textContent = Utils.pad(state.round+1)+' / '+Utils.pad(TOTAL_ROUNDS);
  }

  function renderPlates(){
    var wrap = document.getElementById('plates');
    wrap.innerHTML = '';
    var labels = ['I','II','III'];
    var colors = [ {cls:'r', name:'Красный'}, {cls:'g', name:'Зелёный'}, {cls:'b', name:'Синий'} ];
    var neg = [state.negativeURL.r, state.negativeURL.g, state.negativeURL.b];
    var pos = [state.positiveURL.r, state.positiveURL.g, state.positiveURL.b];
    for(var i=0;i<3;i++){
      (function(i){
        var plate = document.createElement('div');
        plate.className = 'plate';
        plate.innerHTML =
          '<p class="plate-color '+colors[i].cls+'">'+colors[i].name+'</p>'+
          '<div class="plate-frame">'+
            '<div class="plate-glass">'+
              '<img class="neg-img shown" src="'+neg[i]+'" alt="Негатив пластины '+labels[i]+'">'+
              '<img class="pos-img" src="'+pos[i]+'" alt="Позитивная проекция пластины '+labels[i]+'">'+
              (i===1 ? '<img class="final-img" id="mergeFinalImg" alt="Итоговое цветное изображение">' : '')+
            '</div>'+
          '</div>'+
          '<p class="plate-caption" id="cap'+i+'">негатив</p>'+
          '<div class="toggle-row" id="toggleRow'+i+'">'+
            '<span class="lever-label">НЕГАТИВ</span>'+
            '<div class="lever" id="lever'+i+'" data-idx="'+i+'"><div class="lever-knob"></div></div>'+
            '<span class="lever-label">ПОЗИТИВ</span>'+
          '</div>';
        wrap.appendChild(plate);
        document.getElementById('lever'+i).addEventListener('click', function(){
          togglePlate(i);
        });
      })(i);
    }
  }

  function togglePlate(i, forceOn){
    var lever = document.getElementById('lever'+i);
    var plateEl = lever.closest('.plate');
    var negImg = plateEl.querySelector('.neg-img');
    var posImg = plateEl.querySelector('.pos-img');
    var cap = document.getElementById('cap'+i);
    var on = (typeof forceOn === 'boolean') ? forceOn : !state.plateOn[i];
    state.plateOn[i] = on;
    lever.classList.toggle('on', on);
    negImg.classList.toggle('shown', !on);
    posImg.classList.toggle('shown', on);
    cap.textContent = on ? 'проекция (позитив)' : 'негатив';
  }

  function shuffleAndRenderAnswers(){
    var pool = Utils.shuffle([
      {url: state.correctURL, correct:true},
      {url: state.wrongURLs[0], correct:false},
      {url: state.wrongURLs[1], correct:false}
    ]);
    state.answerOrder = pool;
    state.correctIndex = pool.findIndex(function(p){return p.correct;});
    state.answered = false;

    var wrap = document.getElementById('answers');
    wrap.innerHTML = '';
    var letters = ['А','Б','В'];
    pool.forEach(function(item,idx){
      var btn = document.createElement('button');
      btn.className = 'answer';
      btn.setAttribute('data-idx', idx);
      btn.innerHTML =
        '<div class="answer-frame">'+
          '<span class="answer-letter">'+letters[idx]+'</span>'+
          '<img src="'+item.url+'" alt="Вариант '+letters[idx]+'">'+
        '</div>';
      btn.addEventListener('click', function(){ handleAnswer(idx); });
      wrap.appendChild(btn);
    });

    document.getElementById('feedbackWrap').classList.remove('show');
  }

  function handleAnswer(idx){
    if(state.answered) return;
    state.answered = true;
    var correct = idx === state.correctIndex;
    if(correct) state.score++;
    state.history.push({ round: state.round, pool: state.answerOrder, picked: idx });

    var buttons = document.querySelectorAll('.answer');
    buttons.forEach(function(b){ b.disabled = true; });

    buttons.forEach(function(b, i){
      var frame = b.querySelector('.answer-frame');
      if(i === idx && correct){
        frame.classList.add('correct');
      } else if(i === idx && !correct){
        frame.classList.add('wrong');
      } else if(i === state.correctIndex && !correct){
        frame.classList.add('correct');
      } else {
        frame.classList.add('dim');
      }
    });

    updateRoundIndicator();

    var fbWrap = document.getElementById('feedbackWrap');
    var fbText = document.getElementById('feedbackText');
    fbText.className = 'feedback-text ' + (correct ? 'good' : 'bad');
    fbText.textContent = correct ? 'Верно — регистр сошёлся' : 'Не совсем — каналы перепутаны местами';
    fbWrap.classList.add('show');

    setTimeout(playMerge, 550);
  }

  function revealNextButton(){
    var wrap = document.getElementById('nextBtnWrap');
    var btn = document.getElementById('nextBtn');
    var isLast = state.round === TOTAL_ROUNDS - 1;
    btn.textContent = isLast ? 'Итоги →' : 'Следующий раунд →';
    wrap.classList.add('show');
  }

  function goToNext(){
    if(state.round === TOTAL_ROUNDS - 1){ showFinal(); return; }
    state.round += 1;
    loadRound();
  }

  document.getElementById('nextBtn').addEventListener('click', goToNext);

  /* ===== ИТОГИ: все кадры, выбранный и правильный варианты ===== */
  function finalRoundHtml(h){
    var r = ROUNDS[h.round];
    var ok = h.pool[h.picked].correct;
    var frames = h.pool.map(function(item, i){
      var picked = i === h.picked;
      var cls = item.correct ? 'correct' : (picked ? 'wrong' : 'dim');
      var tag = item.correct
        ? '<span class="answer-tag good">'+(picked ? '✓ ваш ответ' : '✓ правильный')+'</span>'
        : (picked ? '<span class="answer-tag bad">✕ ваш ответ</span>' : '');
      return '<div class="answer-frame '+cls+'"><img src="'+item.url+'" alt="">'+tag+'</div>';
    }).join('');
    return '<div class="final-round">'+
      '<p class="final-caption">кадр '+Utils.pad(h.round+1)+' · '+r.plate+' — '+
        '<span class="'+(ok ? 'good' : 'bad')+'">'+(ok ? 'верно' : 'ошибка')+'</span></p>'+
      '<div class="answers" style="--ar:'+r.ratio+'">'+frames+'</div>'+
    '</div>';
  }

  function showFinal(){
    document.getElementById('finalList').innerHTML = state.history.map(finalRoundHtml).join('');
    document.getElementById('finalScore').textContent = state.score;
    document.getElementById('finalTotal').textContent = TOTAL_ROUNDS;
    document.getElementById('gameScreen').hidden = true;
    document.getElementById('finalScreen').hidden = false;
    document.getElementById('roundIndicator').hidden = true;
  }

  document.getElementById('restartBtn').addEventListener('click', function(){
    state.round = 0;
    state.score = 0;
    state.history = [];
    document.getElementById('finalScreen').hidden = true;
    document.getElementById('gameScreen').hidden = false;
    document.getElementById('roundIndicator').hidden = false;
    loadRound();
  });

  function playMerge(){
    var platesWrap = document.getElementById('plates');

    for(var i=0;i<3;i++){
      document.getElementById('toggleRow'+i).classList.add('hide');
    }
    for(var i=0;i<3;i++){ togglePlate(i, true); }

    setTimeout(function(){
      var frames = document.querySelectorAll('.plate-frame');
      var rects = Array.prototype.map.call(frames, function(el){ return el.getBoundingClientRect(); });
      var targetLeft = rects[1].left;

      platesWrap.classList.add('merge-mode');

      frames.forEach(function(el, i){
        var dx = targetLeft - rects[i].left;
        el.style.transform = 'translateX(' + dx + 'px)';
        el.style.zIndex = (i === 1) ? '3' : '1';
      });

      setTimeout(function(){
        var finalImg = document.getElementById('mergeFinalImg');
        finalImg.src = state.correctURL;
        finalImg.classList.add('show');
        document.querySelectorAll('.pos-img').forEach(function(img){
          img.style.opacity = '0';
        });
        frames[1].classList.add('settle');
        setTimeout(function(){ frames[1].classList.remove('settle'); }, 1100);

        revealNextButton();
      }, 1200);

    }, 450);
  }

  function clearVisualState(){
    var platesWrap = document.getElementById('plates');
    platesWrap.classList.remove('merge-mode');
    document.querySelectorAll('.plate-frame').forEach(function(el){
      el.style.transform = '';
      el.style.zIndex = '';
      el.classList.remove('settle');
    });
    document.querySelectorAll('.pos-img').forEach(function(img){
      img.style.opacity = '';
    });
    var finalImg = document.getElementById('mergeFinalImg');
    if(finalImg){ finalImg.classList.remove('show'); }
    for(var i=0;i<3;i++){
      var row = document.getElementById('toggleRow'+i);
      if(row) row.classList.remove('hide');
    }
    document.getElementById('feedbackWrap').classList.remove('show');
    document.getElementById('nextBtnWrap').classList.remove('show');
  }

  function loadRound(){
    clearVisualState();
    state.plateOn = [false,false,false];
    state.answered = false;
    document.getElementById('plates').innerHTML = '<div class="loading-note">Проявляю пластины…</div>';
    document.getElementById('answers').innerHTML = '';
    updateRoundIndicator();

    var r = ROUNDS[state.round];
    setRoundAssets(r);
    updateAboutFigure();
    preload([
      state.negativeURL.r, state.negativeURL.g, state.negativeURL.b,
      state.positiveURL.r, state.positiveURL.g, state.positiveURL.b,
      state.correctURL, state.wrongURLs[0], state.wrongURLs[1]
    ], buildAll);
  }

  /* окно «О технике» показывает оригинальную пластину текущего кадра */
  function updateAboutFigure(){
    var r = ROUNDS[state.round];
    var img = document.getElementById('aboutPlateImg');
    img.src = r.dir+'original-plate.jpg';
    img.alt = 'Оригинальная стеклянная пластина: '+r.plate;
    document.getElementById('aboutPlateName').textContent = r.plate;
  }

  loadRound();
})();
