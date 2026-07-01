(function () {
  var categories = ['英語・資格などの学習', '運動・ストレッチ・散歩', '読書・日記・瞑想'];
  var reasons = ['忙しかった', '忘れていた', '疲れていた', '面倒だった', '目標が重すぎた', '意味を見失った', '完璧にやろうとした'];
  var storageKey = 'mikkabozu-free-plan-v3';

  var seedState = {
    screen: 'onboarding',
    active: 1,
    draftReasons: ['忙しかった', '疲れていた'],
    checkReasons: ['疲れていた'],
    showAddForm: false,
    habits: [
      {
        id: 1,
        name: '英語学習',
        category: categories[0],
        normalGoal: '10分だけ音読する',
        busyGoal: '3分だけ単語を見る',
        tinyGoal: '教材を開いて1文読む',
        purpose: '海外出張で困らないようにしたい',
        reminder: '21:30',
        lastRecordOffset: 4,
        restarts: 2,
        records: [
          { label: 'できた', type: 'done', date: '2026-06-22' },
          { label: '戻るだけできた', type: 'tiny', date: '2026-06-24' }
        ]
      },
      {
        id: 2,
        name: '夜のストレッチ',
        category: categories[1],
        normalGoal: '寝る前に8分伸ばす',
        busyGoal: '肩だけ1分回す',
        tinyGoal: '深呼吸を3回する',
        purpose: '疲れを翌日に残しにくくしたい',
        reminder: '22:15',
        lastRecordOffset: 1,
        restarts: 1,
        records: [{ label: '休む', type: 'rest', date: '2026-06-27' }]
      }
    ]
  };

  var state = loadState();

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function byId(id) {
    return document.getElementById(id);
  }

  function contains(list, value) {
    return list.indexOf(value) !== -1;
  }

  function loadState() {
    var saved;
    try {
      saved = JSON.parse(localStorage.getItem(storageKey));
    } catch (error) {
      saved = null;
    }
    return normalizeState(saved);
  }

  function normalizeState(saved) {
    var base = clone(seedState);
    var i;
    if (!saved || !saved.habits || !saved.habits.length) return base;
    base.screen = contains(['onboarding', 'home', 'restart', 'report', 'insights'], saved.screen) ? saved.screen : 'onboarding';
    base.active = saved.active || base.active;
    base.draftReasons = saved.draftReasons && saved.draftReasons.length ? saved.draftReasons : base.draftReasons;
    base.checkReasons = saved.checkReasons && saved.checkReasons.length ? saved.checkReasons : base.checkReasons;
    base.showAddForm = !!saved.showAddForm;
    base.habits = [];
    for (i = 0; i < saved.habits.length; i += 1) {
      base.habits.push(normalizeHabit(saved.habits[i], seedState.habits[i % seedState.habits.length]));
    }
    return base;
  }

  function normalizeHabit(savedHabit, fallback) {
    var habit = clone(fallback);
    var key;
    var records = [];
    var i;
    for (key in savedHabit) {
      if (Object.prototype.hasOwnProperty.call(savedHabit, key)) habit[key] = savedHabit[key];
    }
    if (savedHabit.records && savedHabit.records.length) {
      for (i = 0; i < savedHabit.records.length; i += 1) records.push(normalizeRecord(savedHabit.records[i]));
      habit.records = records;
    }
    return habit;
  }

  function normalizeRecord(record) {
    if (record && typeof record === 'object') return record;
    return { label: String(record || '記録'), type: 'tiny', date: todayIso() };
  }

  function saveState() {
    try {
      localStorage.setItem(storageKey, JSON.stringify(state));
    } catch (error) {
      window.console && console.warn('State could not be saved.', error);
    }
  }

  function todayIso() {
    var date = new Date();
    var month = String(date.getMonth() + 1);
    var day = String(date.getDate());
    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;
    return date.getFullYear() + '-' + month + '-' + day;
  }

  function activeHabit() {
    var i;
    for (i = 0; i < state.habits.length; i += 1) {
      if (state.habits[i].id === state.active) return state.habits[i];
    }
    return state.habits[0];
  }

  function totalRestarts() {
    var total = 0;
    var i;
    for (i = 0; i < state.habits.length; i += 1) total += state.habits[i].restarts || 0;
    return total;
  }

  function htmlEscape(value) {
    return String(value).replace(/[&<>'"]/g, function (char) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char];
    });
  }

  function options(items, selected) {
    var html = '';
    var i;
    for (i = 0; i < items.length; i += 1) {
      html += '<option' + (items[i] === selected ? ' selected' : '') + '>' + htmlEscape(items[i]) + '</option>';
    }
    return html;
  }

  function chips(kind, selected) {
    var html = '<div class="chips">';
    var i;
    for (i = 0; i < reasons.length; i += 1) {
      html += '<button class="' + (contains(selected, reasons[i]) ? 'selected' : '') + '" onclick="toggleReason(\'' + kind + '\',\'' + reasons[i] + '\')">' + reasons[i] + '</button>';
    }
    return html + '</div>';
  }

  function shell(content) {
    return '' +
      '<main class="app-shell">' +
      '<aside class="sidebar">' +
      '<div class="brand"><div class="logo">三</div><div><b>三日boze</b><span>戻る力を育てる</span></div></div>' +
      '<nav>' +
      navButton('home', '⌂ ホーム') + navButton('restart', '↻ リスタート') + navButton('report', '▣ レポート') + navButton('insights', '◇ 差別化') +
      '</nav>' +
      '<div class="free-card"><b>無料プラン</b><p>習慣2件、基本記録、リスタートチェック、標準再開プラン、月次簡易レポートまで。</p></div>' +
      '</aside><section class="content">' + content + '</section></main>';
  }

  function navButton(screen, label) {
    return '<button class="' + (state.screen === screen ? 'active' : '') + '" onclick="setScreen(\'' + screen + '\')">' + label + '</button>';
  }

  function templateCards() {
    return '' +
      '<div class="template-grid">' +
      '<button onclick="useTemplate(0)"><b>英語学習</b><span>教材を開いて1文読む</span></button>' +
      '<button onclick="useTemplate(1)"><b>朝の散歩</b><span>靴を履いて深呼吸する</span></button>' +
      '<button onclick="useTemplate(2)"><b>読書メモ</b><span>本を開いて1行読む</span></button>' +
      '</div>';
  }

  function onboarding() {
    return shell('' +
      '<div class="hero grid-2"><section>' +
      '<p class="eyebrow">♡ 責めないリスタート支援アプリ</p>' +
      '<h1>続かなかった？<br>じゃあ、戻り方を変えよう。</h1>' +
      '<p class="lead">優秀な習慣化アプリの「簡単記録」「テンプレート」「見える化」は取り入れつつ、三日bozeはストリークが切れた後の復帰体験に集中します。</p>' +
      '<div class="research-strip"><span>1タップ記録</span><span>前向きな称賛</span><span>小さなルーティン</span></div>' +
      '</section><section class="panel form-card">' +
      '<h2>過去の挫折から、最小再開ルールを作る</h2>' + templateCards() +
      '<label>続かなかった習慣<input id="onboardName" value="英語学習"></label>' +
      '<label>カテゴリ<select id="onboardCategory">' + options(categories, categories[0]) + '</select></label>' +
      '<div><span class="label">止まった理由</span>' + chips('draft', state.draftReasons) + '</div>' +
      '<div class="rule-grid"><label>通常日<input id="onboardNormal" value="10分だけ進める"></label><label>忙しい日<input id="onboardBusy" value="3分だけ触れる"></label><label>限界日<input id="onboardTiny" value="30秒だけ開く"></label></div>' +
      '<label>復帰招待の目安時間<input id="onboardReminder" type="time" value="21:00"></label>' +
      '<label>本当の目的<textarea id="onboardPurpose" placeholder="例: 海外出張で困らないようにしたい"></textarea></label>' +
      '<div class="restart-plan"><b>提案:</b> 途切れた日は、通常目標ではなく「限界日の最小行動」から戻ります。</div>' +
      '<button class="primary" onclick="addHabitFromForm(\'onboarding\')">無料プランで始める →</button>' +
      '</section></div>');
  }

  function stat(label, value, hint) {
    return '<div class="stat"><span>' + label + '</span><b>' + value + '</b><small>' + (hint || '') + '</small></div>';
  }

  function home() {
    var habit = activeHabit();
    var paused = pausedHabits();
    var i;
    var tabs = '';
    var pausedHtml = '';
    for (i = 0; i < state.habits.length; i += 1) {
      tabs += '<button class="' + (state.habits[i].id === habit.id ? 'active' : '') + '" onclick="selectHabit(' + state.habits[i].id + ')">' + htmlEscape(state.habits[i].name) + '</button>';
    }
    if (paused.length) {
      for (i = 0; i < paused.length; i += 1) {
        pausedHtml += '<div class="notice"><b>' + htmlEscape(paused[i].name) + '</b><p>' + paused[i].lastRecordOffset + '日空いています。今日は「' + htmlEscape(paused[i].tinyGoal) + '」だけ戻りますか？</p><button onclick="selectHabit(' + paused[i].id + ');setScreen(\'restart\')">リスタートチェックへ</button></div>';
      }
    } else {
      pausedHtml = '<p>今は大丈夫。休んだ日も、戻る準備の一部です。</p>';
    }
    return shell('' +
      '<header class="top"><div><p class="eyebrow">おかえりなさい</p><h1>今日は戻るだけで十分です</h1></div><button class="ghost" onclick="toggleAddForm()">＋ 習慣 ' + state.habits.length + '/2</button></header>' +
      '<div class="stats">' + stat('有効再開数', totalRestarts() + '回', '2日以上空いた後に戻れた回数') + stat('見守り中の習慣', state.habits.length + '/2', '無料プラン上限') + stat('復帰モード', paused.length + '件', '責めずに招待') + '</div>' +
      (state.showAddForm ? addHabitForm() : '') +
      '<div class="grid-2"><section class="panel"><h2>1タップ記録</h2><div class="tabs">' + tabs + '</div>' +
      '<div class="habit-card"><p class="category">' + htmlEscape(habit.category) + '</p><h3>' + htmlEscape(habit.name) + '</h3><p>始めた理由: ' + htmlEscape(habit.purpose) + '</p><div class="mini-rules"><span>通常: ' + htmlEscape(habit.normalGoal) + '</span><span>忙しい日: ' + htmlEscape(habit.busyGoal) + '</span><span>限界日: ' + htmlEscape(habit.tinyGoal) + '</span><span>復帰招待: ' + htmlEscape(habit.reminder) + '</span></div></div>' +
      '<div class="record-actions"><button onclick="record(\'done\',\'できた\')">✓ できた</button><button onclick="record(\'tiny\',\'戻るだけできた\')">↻ 戻るだけできた</button><button onclick="record(\'rest\',\'休む\')">休む</button></div>' +
      '</section><section class="panel warm"><h2>復帰招待</h2>' + pausedHtml + '</section></div>');
  }

  function pausedHabits() {
    var result = [];
    var i;
    for (i = 0; i < state.habits.length; i += 1) if (state.habits[i].lastRecordOffset >= 2) result.push(state.habits[i]);
    return result;
  }

  function addHabitForm() {
    if (state.habits.length >= 2) return '<section class="panel limit"><b>無料プランの上限です</b><p>今は2件までに絞り、戻り方の精度を育てましょう。</p></section>';
    return '<section class="panel form-card compact"><h2>2件目の習慣を追加</h2><div class="rule-grid"><label>習慣名<input id="addName" value="読書メモ"></label><label>カテゴリ<select id="addCategory">' + options(categories, categories[2]) + '</select></label><label>復帰招待<input id="addReminder" type="time" value="21:30"></label></div><div class="rule-grid"><label>通常日<input id="addNormal" value="5ページ読む"></label><label>忙しい日<input id="addBusy" value="1ページだけ読む"></label><label>限界日<input id="addTiny" value="本を開いて1行読む"></label></div><label>始めた理由<textarea id="addPurpose">考えを言葉にする時間を作りたい</textarea></label><button class="primary" onclick="addHabitFromForm(\'add\')">追加する</button></section>';
  }

  function restart() {
    var habit = activeHabit();
    var mainReason = state.checkReasons[0] || '忙しさ';
    return shell('<div class="grid-2"><section class="panel"><p class="eyebrow">30秒で完了</p><h1>リスタートチェック</h1><p>診断ではありません。今回のつまずき傾向を軽く見て、今日の一歩を小さくします。</p>' + chips('check', state.checkReasons) + '<label>今の気分<select><option>少し重い</option><option>落ち着いている</option><option>かなり疲れている</option></select></label><label>今使える時間<select><option>30秒ならできる</option><option>3分ならできる</option><option>10分ならできる</option></select></label></section><section class="panel plan"><h2>標準再開プラン</h2><p>今回は「' + htmlEscape(mainReason) + '」が障害だったかもしれません。</p><div class="big-action">今日の再開は、<b>' + htmlEscape(habit.tinyGoal) + '</b> で十分です。</div><ul><li>元の目標へ一気に戻さない</li><li>始めた理由「' + htmlEscape(habit.purpose) + '」を読み返す</li><li>次回は忙しい日のルール「' + htmlEscape(habit.busyGoal) + '」を先に使う</li></ul><button class="primary" onclick="record(\'tiny\',\'戻るだけできた\')">戻るだけできた</button></section></div>');
  }

  function calendarDots() {
    var records = activeHabit().records || [];
    var html = '<div class="calendar-dots">';
    var i;
    var record;
    for (i = 0; i < 21; i += 1) {
      record = records[i];
      html += '<span class="' + (record ? htmlEscape(record.type) : '') + '" title="' + (record ? htmlEscape(record.label) : '記録なし') + '"></span>';
    }
    return html + '</div>';
  }

  function report() {
    return shell('<header class="top"><div><p class="eyebrow">月次簡易レポート</p><h1>戻れた事実を積み上げる</h1></div></header><div class="stats">' + stat('有効再開数', totalRestarts() + '回', '連続日数より重視') + stat('戻るまでの平均', '2.5日', '試算表示') + stat('今月の記録', recordCount() + '件', 'できた/戻る/休む') + '</div><section class="panel"><h2>最近の記録</h2>' + calendarDots() + '<p class="legend"><span class="done"></span>できた <span class="tiny"></span>戻るだけ <span class="rest"></span>休む</p></section><section class="panel"><h2>よくある中断理由</h2>' + reasonBars() + '<div class="premium"><b>プレミアムはまだ入口だけ</b><p>3回目の有効再開後に、AI再開コーチや週次レビューを提案します。無料プランではここまで使えます。</p></div></section>');
  }

  function recordCount() {
    var total = 0;
    var i;
    for (i = 0; i < state.habits.length; i += 1) total += (state.habits[i].records || []).length;
    return total;
  }

  function reasonBars() {
    var counts = {};
    var all = state.draftReasons.concat(state.checkReasons);
    var html = '';
    var reason;
    var i;
    for (i = 0; i < all.length; i += 1) counts[all[i]] = (counts[all[i]] || 0) + 1;
    for (reason in counts) {
      if (Object.prototype.hasOwnProperty.call(counts, reason)) html += '<div class="bar"><span>' + htmlEscape(reason) + '</span><div><i style="width:' + (counts[reason] * 35) + '%"></i></div></div>';
    }
    return html;
  }

  function insights() {
    return shell('<header class="top"><div><p class="eyebrow">競合調査からの改修方針</p><h1>強い習慣化アプリの良さを、復帰体験へ変換</h1></div></header><div class="insight-grid"><article class="panel"><h2>1. 摩擦を減らす</h2><p>人気アプリは1タップ記録やテンプレートで開始負荷を下げています。三日bozeでは「できた」だけでなく「戻るだけできた」を同じ主役にしました。</p></article><article class="panel"><h2>2. ゲーム化は罰より称賛</h2><p>ゲーム要素は強力ですが、三日bozeではHP減少のような罰ではなく、有効再開数として復帰を称賛します。</p></article><article class="panel"><h2>3. ルーティンを小さくする</h2><p>通常日・忙しい日・限界日を分け、崩れた日の復帰先を明確にしました。</p></article><article class="panel"><h2>4. データは手元に残す</h2><p>無料プロトタイプではブラウザのローカルストレージに保存し、更新しても記録が残るようにしました。</p></article></div>');
  }

  function render() {
    var app = byId('app');
    var content;
    if (!app) return;
    try {
      if (state.screen === 'home') content = home();
      else if (state.screen === 'restart') content = restart();
      else if (state.screen === 'report') content = report();
      else if (state.screen === 'insights') content = insights();
      else content = onboarding();
      app.innerHTML = content;
    } catch (error) {
      window.console && console.error(error);
      try { localStorage.removeItem(storageKey); } catch (ignore) {}
      app.innerHTML = '<main class="boot-fallback"><h1>三日bozeを読み込めませんでした</h1><p>保存済みデータまたは古いキャッシュが原因の可能性があります。下のボタンで初期状態に戻して再読み込みできます。</p><button onclick="location.reload()">再読み込みする</button></main>';
    }
  }

  window.setScreen = function (screen) {
    state.screen = screen;
    state.showAddForm = false;
    saveState();
    render();
  };

  window.selectHabit = function (id) {
    state.active = id;
    saveState();
    render();
  };

  window.toggleAddForm = function () {
    state.showAddForm = !state.showAddForm;
    saveState();
    render();
  };

  window.toggleReason = function (kind, reason) {
    var key = kind === 'draft' ? 'draftReasons' : 'checkReasons';
    var index = state[key].indexOf(reason);
    if (index === -1) state[key].push(reason);
    else state[key].splice(index, 1);
    saveState();
    render();
  };

  window.record = function (type, label) {
    var habit = activeHabit();
    var isEffectiveRestart = type === 'tiny' && habit.lastRecordOffset >= 2;
    habit.restarts = isEffectiveRestart ? habit.restarts + 1 : habit.restarts;
    habit.lastRecordOffset = 0;
    habit.records = [{ label: label, type: type, date: todayIso() }].concat(habit.records || []).slice(0, 30);
    saveState();
    render();
  };

  window.addHabitFromForm = function (source) {
    var prefix = source === 'onboarding' ? 'onboard' : 'add';
    var habit;
    if (state.habits.length >= 2) {
      state.screen = 'home';
      state.showAddForm = false;
      saveState();
      render();
      return;
    }
    habit = {
      id: new Date().getTime(),
      name: byId(prefix + 'Name').value || '新しい習慣',
      category: byId(prefix + 'Category').value,
      normalGoal: byId(prefix + 'Normal').value || '10分だけ進める',
      busyGoal: byId(prefix + 'Busy').value || '3分だけ触れる',
      tinyGoal: byId(prefix + 'Tiny').value || '30秒だけ開く',
      purpose: byId(prefix + 'Purpose').value || '続けたい理由を忘れないため',
      reminder: byId(prefix + 'Reminder').value || '21:00',
      lastRecordOffset: 0,
      restarts: 0,
      records: []
    };
    state.habits.push(habit);
    state.active = habit.id;
    state.screen = 'home';
    state.showAddForm = false;
    saveState();
    render();
  };

  window.useTemplate = function (index) {
    var templates = [
      ['英語学習', categories[0], '10分だけ音読する', '3分だけ単語を見る', '教材を開いて1文読む', '海外出張で困らないようにしたい'],
      ['朝の散歩', categories[1], '10分歩く', '玄関を出て1分歩く', '靴を履いて深呼吸する', '仕事前の頭を軽くしたい'],
      ['読書メモ', categories[2], '5ページ読む', '1ページだけ読む', '本を開いて1行読む', '考えを言葉にする時間を作りたい']
    ];
    var item = templates[index];
    byId('onboardName').value = item[0];
    byId('onboardCategory').value = item[1];
    byId('onboardNormal').value = item[2];
    byId('onboardBusy').value = item[3];
    byId('onboardTiny').value = item[4];
    byId('onboardPurpose').value = item[5];
  };

  window.mikkabozuState = state;
  render();
}());
