const categories = ['英語・資格などの学習', '運動・ストレッチ・散歩', '読書・日記・瞑想'];
const reasons = ['忙しかった', '忘れていた', '疲れていた', '面倒だった', '目標が重すぎた', '意味を見失った', '完璧にやろうとした'];
const storageKey = 'mikkabozu-free-plan-v2';

const seedState = {
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
        { label: '戻るだけできた', type: 'tiny', date: '2026-06-24' },
      ],
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
      records: [{ label: '休む', type: 'rest', date: '2026-06-27' }],
    },
  ],
};

let state = loadState();
const $ = (id) => document.getElementById(id);
const clone = (value) => JSON.parse(JSON.stringify(value));

function loadState() {
  try {
    return normalizeState(JSON.parse(localStorage.getItem(storageKey)));
  } catch {
    return clone(seedState);
  }
}

function normalizeState(savedState) {
  if (!savedState || !Array.isArray(savedState.habits)) return clone(seedState);
  const allowedScreens = ['onboarding', 'home', 'restart', 'report', 'insights'];
  return {
    ...clone(seedState),
    ...savedState,
    screen: allowedScreens.includes(savedState.screen) ? savedState.screen : 'onboarding',
    draftReasons: Array.isArray(savedState.draftReasons) ? savedState.draftReasons : seedState.draftReasons,
    checkReasons: Array.isArray(savedState.checkReasons) ? savedState.checkReasons : seedState.checkReasons,
    habits: savedState.habits.map((habit, index) => ({
      ...seedState.habits[index % seedState.habits.length],
      ...habit,
      records: Array.isArray(habit.records) ? habit.records.map(normalizeRecord) : [],
    })),
  };
}

function normalizeRecord(record) {
  if (record && typeof record === 'object') return record;
  return { label: String(record || '記録'), type: 'tiny', date: todayIso() };
}

function saveState() {
  localStorage.setItem(storageKey, JSON.stringify(state));
}

function setScreen(screen) {
  state.screen = screen;
  state.showAddForm = false;
  saveState();
  render();
}

function activeHabit() {
  return state.habits.find((habit) => habit.id === state.active) || state.habits[0];
}

function totalRestarts() {
  return state.habits.reduce((sum, habit) => sum + habit.restarts, 0);
}

function toggle(kind, reason) {
  const key = kind === 'draft' ? 'draftReasons' : 'checkReasons';
  state[key] = state[key].includes(reason)
    ? state[key].filter((item) => item !== reason)
    : [...state[key], reason];
  saveState();
  render();
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function record(type, label) {
  state.habits = state.habits.map((habit) => {
    if (habit.id !== state.active) return habit;
    const isEffectiveRestart = type === 'tiny' && habit.lastRecordOffset >= 2;
    return {
      ...habit,
      restarts: isEffectiveRestart ? habit.restarts + 1 : habit.restarts,
      lastRecordOffset: 0,
      records: [{ label, type, date: todayIso() }, ...habit.records].slice(0, 30),
    };
  });
  saveState();
  render();
}

function addHabitFromForm(source) {
  if (state.habits.length >= 2) {
    state.showAddForm = false;
    render();
    return;
  }

  const prefix = source === 'onboarding' ? 'onboard' : 'add';
  const habit = {
    id: Date.now(),
    name: $(`${prefix}Name`).value || '新しい習慣',
    category: $(`${prefix}Category`).value,
    normalGoal: ($(`${prefix}Normal`) && $(`${prefix}Normal`).value) || '10分だけ進める',
    busyGoal: ($(`${prefix}Busy`) && $(`${prefix}Busy`).value) || '3分だけ触れる',
    tinyGoal: ($(`${prefix}Tiny`) && $(`${prefix}Tiny`).value) || '30秒だけ開く',
    purpose: $(`${prefix}Purpose`).value || '続けたい理由を忘れないため',
    reminder: ($(`${prefix}Reminder`) && $(`${prefix}Reminder`).value) || '21:00',
    lastRecordOffset: 0,
    restarts: 0,
    records: [],
  };

  state.habits = [...state.habits, habit];
  state.active = habit.id;
  state.screen = 'home';
  state.showAddForm = false;
  saveState();
  render();
}

function useTemplate(name, category, normalGoal, busyGoal, tinyGoal, purpose) {
  $('onboardName').value = name;
  $('onboardCategory').value = category;
  $('onboardNormal').value = normalGoal;
  $('onboardBusy').value = busyGoal;
  $('onboardTiny').value = tinyGoal;
  $('onboardPurpose').value = purpose;
}

function chips(kind, selected) {
  return `<div class="chips">${reasons
    .map((reason) => `<button class="${selected.includes(reason) ? 'selected' : ''}" onclick="toggle('${kind}','${reason}')">${reason}</button>`)
    .join('')}</div>`;
}

function shell(content) {
  return `
    <main class="app-shell">
      <aside class="sidebar">
        <div class="brand"><div class="logo">三</div><div><b>三日boze</b><span>戻る力を育てる</span></div></div>
        <nav>
          <button class="${state.screen === 'home' ? 'active' : ''}" onclick="setScreen('home')">⌂ ホーム</button>
          <button class="${state.screen === 'restart' ? 'active' : ''}" onclick="setScreen('restart')">↻ リスタート</button>
          <button class="${state.screen === 'report' ? 'active' : ''}" onclick="setScreen('report')">▣ レポート</button>
          <button class="${state.screen === 'insights' ? 'active' : ''}" onclick="setScreen('insights')">◇ 差別化</button>
        </nav>
        <div class="free-card"><b>無料プラン</b><p>習慣2件、基本記録、リスタートチェック、標準再開プラン、月次簡易レポートまで。</p></div>
      </aside>
      <section class="content">${content}</section>
    </main>`;
}

function templateCards() {
  const templates = [
    ['英語学習', categories[0], '10分だけ音読する', '3分だけ単語を見る', '教材を開いて1文読む', '海外出張で困らないようにしたい'],
    ['朝の散歩', categories[1], '10分歩く', '玄関を出て1分歩く', '靴を履いて深呼吸する', '仕事前の頭を軽くしたい'],
    ['読書メモ', categories[2], '5ページ読む', '1ページだけ読む', '本を開いて1行読む', '考えを言葉にする時間を作りたい'],
  ];
  return `<div class="template-grid">${templates
    .map(([name, category, normal, busy, tiny, purpose]) => `<button onclick="useTemplate('${name}','${category}','${normal}','${busy}','${tiny}','${purpose}')"><b>${name}</b><span>${tiny}</span></button>`)
    .join('')}</div>`;
}

function onboarding() {
  return shell(`
    <div class="hero grid-2">
      <section>
        <p class="eyebrow">♡ 責めないリスタート支援アプリ</p>
        <h1>続かなかった？<br>じゃあ、戻り方を変えよう。</h1>
        <p class="lead">優秀な習慣化アプリの「簡単記録」「テンプレート」「見える化」は取り入れつつ、三日bozeはストリークが切れた後の復帰体験に集中します。</p>
        <div class="research-strip"><span>Streaks型: 1タップ記録</span><span>Habitica型: 前向きな称賛</span><span>Fabulous型: 小さなルーティン</span></div>
      </section>
      <section class="panel form-card">
        <h2>過去の挫折から、最小再開ルールを作る</h2>
        ${templateCards()}
        <label>続かなかった習慣<input id="onboardName" value="英語学習"></label>
        <label>カテゴリ<select id="onboardCategory">${categories.map((category) => `<option>${category}</option>`).join('')}</select></label>
        <div><span class="label">止まった理由</span>${chips('draft', state.draftReasons)}</div>
        <div class="rule-grid">
          <label>通常日<input id="onboardNormal" value="10分だけ進める"></label>
          <label>忙しい日<input id="onboardBusy" value="3分だけ触れる"></label>
          <label>限界日<input id="onboardTiny" value="30秒だけ開く"></label>
        </div>
        <label>復帰招待の目安時間<input id="onboardReminder" type="time" value="21:00"></label>
        <label>本当の目的<textarea id="onboardPurpose" placeholder="例: 海外出張で困らないようにしたい"></textarea></label>
        <div class="restart-plan"><b>提案:</b> 途切れた日は、通常目標ではなく「限界日の最小行動」から戻ります。</div>
        <button class="primary" onclick="addHabitFromForm('onboarding')">無料プランで始める →</button>
      </section>
    </div>`);
}

function stat(label, value, hint = '') {
  return `<div class="stat"><span>${label}</span><b>${value}</b><small>${hint}</small></div>`;
}

function home() {
  const habit = activeHabit();
  const paused = state.habits.filter((item) => item.lastRecordOffset >= 2);
  return shell(`
    <header class="top">
      <div><p class="eyebrow">おかえりなさい</p><h1>今日は戻るだけで十分です</h1></div>
      <button class="ghost" onclick="state.showAddForm = !state.showAddForm; render()">＋ 習慣 ${state.habits.length}/2</button>
    </header>
    <div class="stats">
      ${stat('有効再開数', `${totalRestarts()}回`, '2日以上空いた後に戻れた回数')}
      ${stat('見守り中の習慣', `${state.habits.length}/2`, '無料プラン上限')}
      ${stat('復帰モード', `${paused.length}件`, '責めずに招待')}
    </div>
    ${state.showAddForm ? addHabitForm() : ''}
    <div class="grid-2">
      <section class="panel">
        <h2>1タップ記録</h2>
        <div class="tabs">${state.habits.map((item) => `<button class="${item.id === habit.id ? 'active' : ''}" onclick="state.active=${item.id};render()">${item.name}</button>`).join('')}</div>
        <div class="habit-card">
          <p class="category">${habit.category}</p>
          <h3>${habit.name}</h3>
          <p>始めた理由: ${habit.purpose}</p>
          <div class="mini-rules"><span>通常: ${habit.normalGoal}</span><span>忙しい日: ${habit.busyGoal}</span><span>限界日: ${habit.tinyGoal}</span><span>復帰招待: ${habit.reminder}</span></div>
        </div>
        <div class="record-actions"><button onclick="record('done','できた')">✓ できた</button><button onclick="record('tiny','戻るだけできた')">↻ 戻るだけできた</button><button onclick="record('rest','休む')">休む</button></div>
      </section>
      <section class="panel warm">
        <h2>復帰招待</h2>
        ${paused.length ? paused.map((item) => `<div class="notice"><b>${item.name}</b><p>${item.lastRecordOffset}日空いています。今日は「${item.tinyGoal}」だけ戻りますか？</p><button onclick="state.active=${item.id};setScreen('restart')">リスタートチェックへ</button></div>`).join('') : '<p>今は大丈夫。休んだ日も、戻る準備の一部です。</p>'}
      </section>
    </div>`);
}

function addHabitForm() {
  if (state.habits.length >= 2) {
    return '<section class="panel limit"><b>無料プランの上限です</b><p>今は2件までに絞り、戻り方の精度を育てましょう。</p></section>';
  }
  return `<section class="panel form-card compact"><h2>2件目の習慣を追加</h2><div class="rule-grid"><label>習慣名<input id="addName" value="読書メモ"></label><label>カテゴリ<select id="addCategory">${categories.map((category) => `<option>${category}</option>`).join('')}</select></label><label>復帰招待<input id="addReminder" type="time" value="21:30"></label></div><div class="rule-grid"><label>通常日<input id="addNormal" value="5ページ読む"></label><label>忙しい日<input id="addBusy" value="1ページだけ読む"></label><label>限界日<input id="addTiny" value="本を開いて1行読む"></label></div><label>始めた理由<textarea id="addPurpose">考えを言葉にする時間を作りたい</textarea></label><button class="primary" onclick="addHabitFromForm('add')">追加する</button></section>`;
}

function restart() {
  const habit = activeHabit();
  const mainReason = state.checkReasons[0] || '忙しさ';
  return shell(`
    <div class="grid-2">
      <section class="panel">
        <p class="eyebrow">30秒で完了</p>
        <h1>リスタートチェック</h1>
        <p>診断ではありません。今回のつまずき傾向を軽く見て、今日の一歩を小さくします。</p>
        ${chips('check', state.checkReasons)}
        <label>今の気分<select><option>少し重い</option><option>落ち着いている</option><option>かなり疲れている</option></select></label>
        <label>今使える時間<select><option>30秒ならできる</option><option>3分ならできる</option><option>10分ならできる</option></select></label>
      </section>
      <section class="panel plan">
        <h2>標準再開プラン</h2>
        <p>今回は「${mainReason}」が障害だったかもしれません。</p>
        <div class="big-action">今日の再開は、<b>${habit.tinyGoal}</b> で十分です。</div>
        <ul><li>元の目標へ一気に戻さない</li><li>始めた理由「${habit.purpose}」を読み返す</li><li>次回は忙しい日のルール「${habit.busyGoal}」を先に使う</li></ul>
        <button class="primary" onclick="record('tiny','戻るだけできた')">戻るだけできた</button>
      </section>
    </div>`);
}

function calendarDots() {
  const records = activeHabit().records.slice(0, 21);
  return `<div class="calendar-dots">${Array.from({ length: 21 }, (_, index) => {
    const record = records[index];
    return `<span class="${record ? record.type : ''}" title="${record ? record.label : '記録なし'}"></span>`;
  }).join('')}</div>`;
}

function report() {
  const counts = {};
  [...state.draftReasons, ...state.checkReasons].forEach((reason) => { counts[reason] = (counts[reason] || 0) + 1; });
  return shell(`
    <header class="top"><div><p class="eyebrow">月次簡易レポート</p><h1>戻れた事実を積み上げる</h1></div></header>
    <div class="stats">
      ${stat('有効再開数', `${totalRestarts()}回`, '連続日数より重視')}
      ${stat('戻るまでの平均', '2.5日', '試算表示')}
      ${stat('今月の記録', `${state.habits.reduce((sum, habit) => sum + habit.records.length, 0)}件`, 'できた/戻る/休む')}
    </div>
    <section class="panel"><h2>最近の記録</h2>${calendarDots()}<p class="legend"><span class="done"></span>できた <span class="tiny"></span>戻るだけ <span class="rest"></span>休む</p></section>
    <section class="panel"><h2>よくある中断理由</h2>${Object.entries(counts).map(([reason, count]) => `<div class="bar"><span>${reason}</span><div><i style="width:${count * 35}%"></i></div></div>`).join('')}<div class="premium"><b>プレミアムはまだ入口だけ</b><p>3回目の有効再開後に、AI再開コーチや週次レビューを提案します。無料プランではここまで使えます。</p></div></section>`);
}

function insights() {
  return shell(`
    <header class="top"><div><p class="eyebrow">競合調査からの改修方針</p><h1>強い習慣化アプリの良さを、復帰体験へ変換</h1></div></header>
    <div class="insight-grid">
      <article class="panel"><h2>1. 摩擦を減らす</h2><p>人気アプリは1タップ記録やテンプレートで開始負荷を下げています。三日bozeでは「できた」だけでなく「戻るだけできた」を同じ主役にしました。</p></article>
      <article class="panel"><h2>2. ゲーム化は罰より称賛</h2><p>ゲーム要素は強力ですが、三日bozeではHP減少のような罰ではなく、有効再開数として復帰を称賛します。</p></article>
      <article class="panel"><h2>3. ルーティンを小さくする</h2><p>朝夜ルーティン型アプリのように、通常日・忙しい日・限界日を分け、崩れた日の復帰先を明確にしました。</p></article>
      <article class="panel"><h2>4. データは手元に残す</h2><p>無料プロトタイプではブラウザのローカルストレージに保存し、更新しても記録が残るようにしました。</p></article>
    </div>`);
}

function render() {
  const views = { onboarding, home, restart, report, insights };
  const view = views[state.screen] || onboarding;
  try {
    $('app').innerHTML = view();
  } catch (error) {
    console.error(error);
    localStorage.removeItem(storageKey);
    $('app').innerHTML = `<main class="boot-fallback"><h1>三日bozeを読み込めませんでした</h1><p>保存済みデータまたは古いキャッシュが原因の可能性があります。下のボタンで初期状態に戻して再読み込みできます。</p><button onclick="location.reload()">再読み込みする</button></main>`;
  }
}

window.state = state;
window.render = render;
window.setScreen = setScreen;
window.toggle = toggle;
window.record = record;
window.addHabitFromForm = addHabitFromForm;
window.useTemplate = useTemplate;
render();
