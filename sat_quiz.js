const modalOverlay = document.getElementById('modalOverlay');
const step1 = document.getElementById('step1');
const step2 = document.getElementById('step2');
const goalInput = document.getElementById('goalInput');
const toStep2Btn = document.getElementById('toStep2');
const startBtn = document.getElementById('startBtn');
const progressLabel = document.getElementById('progressLabel');
const progressFill = document.getElementById('progressFill');

let goalPercent = 0;
let selectedSection = null;
let currentIndex = 0;
let filteredQuestions = [];
let correctCount = 0;
let answeredCount = 0;
let questionHistory = [];

toStep2Btn.addEventListener('click', () => {
  const val = parseInt(goalInput.value);
  if (!val || val < 1 || val > 100) {
    goalInput.style.outline = '2px solid #c0504d';
    return;
  }
  goalPercent = val;
  goalInput.style.outline = '';
  step1.classList.add('hidden');
  step2.classList.remove('hidden');
});

document.querySelectorAll('.modal-section-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.modal-section-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    selectedSection = btn.dataset.section;
    startBtn.disabled = false;
  });
});

startBtn.addEventListener('click', () => {
  modalOverlay.style.display = 'none';

  filteredQuestions = selectedSection === 'Both'
    ? questions.filter(q => q.section === 'Math' || q.section === 'English')
    : questions.filter(q => q.section === selectedSection);

  filteredQuestions.sort(() => Math.random() - 0.5);

  document.getElementById('progressWrap').style.display = 'flex';
  progressFill.style.width = '100%';
  progressFill.classList.add('blue');
  progressLabel.textContent = 'Goal: ' + goalPercent + '%';

  document.querySelectorAll('.subject-btn').forEach(btn => {
    btn.classList.toggle('active', btn.textContent === selectedSection);
  });

  loadQuestion(0);
});

function updateProgress() {
  if (answeredCount === 0) {
    progressLabel.textContent = 'Goal: ' + goalPercent + '%';
    progressFill.style.width = '100%';
    progressFill.classList.remove('red');
    progressFill.classList.remove('green');
    progressFill.classList.add('blue');
    return;
  }
  const pct = Math.round((correctCount / answeredCount) * 100);
  progressLabel.textContent = correctCount + '/' + answeredCount + ' (' + pct + '%) — Goal: ' + goalPercent + '%';
  progressFill.style.width = pct + '%';
  progressFill.classList.remove('blue');
  if (pct >= goalPercent) {
    progressFill.classList.remove('red');
    progressFill.classList.add('green');
  } else {
    progressFill.classList.remove('green');
    progressFill.classList.add('red');
  }
}

function loadQuestion(index, fromBack) {
  if (filteredQuestions.length === 0) return;

  if (index >= filteredQuestions.length) {
    filteredQuestions.sort(() => Math.random() - 0.5);
    index = 0;
  }

  if (!fromBack) questionHistory.push(currentIndex);
  currentIndex = index;

  const q = filteredQuestions[currentIndex];
  document.getElementById('questionBox').textContent = q.question;

  document.querySelectorAll('.option-btn').forEach((btn, i) => {
    btn.textContent = q.options[i];
    btn.style.background = '';
    btn.style.color = '';
    btn.disabled = false;
  });

  document.getElementById('notepadArea').value = '';
  updateToolPanel(q.section);
  if (window.__satTracker) window.__satTracker.onQuestionLoad();
}

function updateToolPanel(section) {
  const englishTools = document.getElementById('englishTools');
  const mathTools = document.getElementById('mathTools');

  if (section === 'English') {
    englishTools.classList.add('visible');
    mathTools.classList.remove('visible');
  } else if (section === 'Math') {
    mathTools.classList.add('visible');
    englishTools.classList.remove('visible');
    setTimeout(initCanvas, 0);
  } else {
    englishTools.classList.remove('visible');
    mathTools.classList.remove('visible');
  }
}

document.querySelectorAll('.option-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    if (btn.disabled) return;
    const q = filteredQuestions[currentIndex];

    document.querySelectorAll('.option-btn').forEach(b => {
      b.disabled = true;
      b.style.background = b.textContent === q.answer ? '#4caf50' : '#2a2a2a';
      b.style.color = '#fff';
    });

    answeredCount++;
    const isCorrect = btn.textContent === q.answer;
    if (isCorrect) correctCount++;
    if (window.__satTracker) {
      window.__satTracker.onAnswer(isCorrect, q.question);
      if (!isCorrect) window.__satTracker.onMissed(q.question);
    }
    updateProgress();

    setTimeout(() => loadQuestion(currentIndex + 1), 1200);
  });
});

document.querySelectorAll('.subject-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    if (!filteredQuestions.length) return;

    const newSection = btn.textContent;

    document.querySelectorAll('.subject-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    const currentSection = filteredQuestions[currentIndex]?.section;

    if (newSection === 'Both') {
      selectedSection = 'Both';
      filteredQuestions = questions.filter(q => q.section === 'Math' || q.section === 'English');
      filteredQuestions.sort(() => Math.random() - 0.5);
      currentIndex = 0;
      loadQuestion(0);
      return;
    }

    selectedSection = newSection;

    if (currentSection === newSection) {
      updateToolPanel(newSection);
      return;
    }

    filteredQuestions = questions.filter(q => q.section === newSection);
    filteredQuestions.sort(() => Math.random() - 0.5);
    currentIndex = 0;
    loadQuestion(0);
  });
});

document.querySelector('.skip-btn').addEventListener('click', () => {
  const q = filteredQuestions[currentIndex];
  if (!q) return;

  document.querySelectorAll('.option-btn').forEach(b => {
    b.disabled = true;
    b.style.background = b.textContent === q.answer ? '#4caf50' : '#2a2a2a';
    b.style.color = '#fff';
  });

  if (window.__satTracker) {
    window.__satTracker.onSkip(q.question);
    window.__satTracker._lastSkipped = q.question;
  }
  setTimeout(() => loadQuestion(currentIndex + 1), 1200);
});

document.getElementById('backBtn').addEventListener('click', () => {
  if (questionHistory.length <= 1) return;
  questionHistory.pop(); // remove current
  const prev = questionHistory.pop(); // get previous
  loadQuestion(prev, true);
});


document.getElementById('notepadClearBtn').addEventListener('click', () => {
  document.getElementById('notepadArea').value = '';
});

const mathTabWB = document.getElementById('mathTabWB');
const mathTabCalc = document.getElementById('mathTabCalc');
const mathTabGraph = document.getElementById('mathTabGraph');
const panelWhiteboard = document.getElementById('panelWhiteboard');
const panelCalc = document.getElementById('panelCalc');
const panelGraph = document.getElementById('panelGraph');

const canvas = document.getElementById('wbCanvas');
const ctx = canvas.getContext('2d');
let isDrawing = false;
let wbMode = 'pen';
let wbColor = '#111111';
let wbSize = 3;
let lastX = 0;
let lastY = 0;
let canvasReady = false;

function initCanvas() {
  if (canvas.offsetWidth === 0) return;
  const imageData = canvasReady ? ctx.getImageData(0, 0, canvas.width, canvas.height) : null;
  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;
  if (imageData) ctx.putImageData(imageData, 0, 0);
  canvasReady = true;
}

window.addEventListener('resize', initCanvas);

let calcInstance = null;
let graphInstance = null;

function setMathTab(activeTab, activePanel) {
  [mathTabWB, mathTabCalc, mathTabGraph].forEach(t => t.classList.remove('active'));
  [panelWhiteboard, panelCalc, panelGraph].forEach(p => p.classList.remove('visible'));
  activeTab.classList.add('active');
  activePanel.classList.add('visible');
  if (activePanel === panelWhiteboard) initCanvas();
  if (activePanel === panelCalc && !calcInstance) {
    calcInstance = Desmos.ScientificCalculator(document.getElementById('desmosCalc'));
  }
  if (activePanel === panelGraph && !graphInstance) {
    graphInstance = Desmos.GraphingCalculator(document.getElementById('desmosGraph'), { expressionsCollapsed: false });
  }
}

mathTabWB.addEventListener('click', () => setMathTab(mathTabWB, panelWhiteboard));
mathTabCalc.addEventListener('click', () => setMathTab(mathTabCalc, panelCalc));
mathTabGraph.addEventListener('click', () => setMathTab(mathTabGraph, panelGraph));

function getPos(e) {
  const rect = canvas.getBoundingClientRect();
  const src = e.touches ? e.touches[0] : e;
  return {
    x: (src.clientX - rect.left) * (canvas.width / rect.width),
    y: (src.clientY - rect.top) * (canvas.height / rect.height)
  };
}

function startDraw(e) {
  isDrawing = true;
  const p = getPos(e);
  lastX = p.x;
  lastY = p.y;
}

function draw(e) {
  if (!isDrawing) return;
  e.preventDefault();
  const p = getPos(e);

  ctx.beginPath();
  ctx.moveTo(lastX, lastY);
  ctx.lineTo(p.x, p.y);
  ctx.lineWidth = wbMode === 'eraser' ? wbSize * 5 : wbSize;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = wbMode === 'eraser' ? '#ffffff' : wbColor;
  ctx.stroke();

  lastX = p.x;
  lastY = p.y;
}

function stopDraw() {
  isDrawing = false;
}

canvas.addEventListener('mousedown', startDraw);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseup', stopDraw);
canvas.addEventListener('mouseleave', stopDraw);
canvas.addEventListener('touchstart', startDraw, { passive: false });
canvas.addEventListener('touchmove', draw, { passive: false });
canvas.addEventListener('touchend', stopDraw);

document.getElementById('wbPenBtn').addEventListener('click', () => {
  wbMode = 'pen';
  document.getElementById('wbPenBtn').classList.add('active');
  document.getElementById('wbEraserBtn').classList.remove('active');
});

document.getElementById('wbEraserBtn').addEventListener('click', () => {
  wbMode = 'eraser';
  document.getElementById('wbEraserBtn').classList.add('active');
  document.getElementById('wbPenBtn').classList.remove('active');
});

document.querySelectorAll('.wb-color-swatch').forEach(swatch => {
  swatch.addEventListener('click', () => {
    wbColor = swatch.dataset.color;
    document.querySelectorAll('.wb-color-swatch').forEach(s => s.classList.remove('active'));
    swatch.classList.add('active');
    wbMode = 'pen';
    document.getElementById('wbPenBtn').classList.add('active');
    document.getElementById('wbEraserBtn').classList.remove('active');
  });
});

document.getElementById('wbSize').addEventListener('input', e => {
  wbSize = parseInt(e.target.value);
});

document.getElementById('wbClearBtn').addEventListener('click', () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
});

const askAiBtn = document.getElementById('askAiBtn');
const aiPanel = document.getElementById('aiPanel');
const aiPanelBody = document.getElementById('aiPanelBody');

document.getElementById('aiCloseBtn').addEventListener('click', () => {
  aiPanel.classList.remove('visible');
});

askAiBtn.addEventListener('click', () => {
  if (!filteredQuestions.length) return;
  const q = filteredQuestions[currentIndex];
  if (!q) return;

  const prompt = `You are an SAT tutor.
Please solve the following SAT question and explain it clearly.

Question:
${q.question}

Answer Choices:
A) ${q.options[0]}
B) ${q.options[1]}
C) ${q.options[2]}
D) ${q.options[3]}

Instructions:
1. Tell me the correct answer.
2. Explain step-by-step why it is correct.
3. Explain why each of the other answers is wrong.
4. Keep the explanation simple like you are teaching a high school student.`;

  aiPanelBody.innerHTML = `
    <p class="ai-prompt-text" id="aiPromptText"></p>
    <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
      <button class="ai-copy-btn" id="aiCopyBtn">📋 Copy Prompt</button>
      <p class="ai-copy-hint">Paste into ChatGPT, Claude, or any AI!</p>
    </div>`;

  document.getElementById('aiPromptText').textContent = prompt;

  document.getElementById('aiCopyBtn').addEventListener('click', () => {
    navigator.clipboard.writeText(prompt).then(() => {
      const btn = document.getElementById('aiCopyBtn');
      btn.textContent = '✅ Copied!';
      btn.style.background = '#4caf50';
      setTimeout(() => {
        btn.textContent = '📋 Copy Prompt';
        btn.style.background = '';
      }, 2000);
    });
  });

  aiPanel.classList.add('visible');
});