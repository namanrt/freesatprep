// ── MODAL LOGIC ──
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

// Step 1 → Step 2
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

// Section buttons in modal
document.querySelectorAll('.modal-section-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.modal-section-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    selectedSection = btn.dataset.section;
    startBtn.disabled = false;
  });
});

// Start
startBtn.addEventListener('click', () => {
  modalOverlay.style.display = 'none';

  // Filter and shuffle questions
  if (selectedSection === 'Both') {
    filteredQuestions = questions.filter(q => q.section === 'Math' || q.section === 'English');
  } else {
    filteredQuestions = questions.filter(q => q.section === selectedSection);
  }
  filteredQuestions.sort(() => Math.random() - 0.5);

  // Show progress bar at 100% blue to start
  document.getElementById('progressWrap').style.display = 'flex';
  progressFill.style.width = '100%';
  progressFill.classList.add('blue');
  progressLabel.textContent = `Goal: ${goalPercent}%`;

  // Highlight matching subject button
  document.querySelectorAll('.subject-btn').forEach(btn => {
    btn.classList.toggle('active', btn.textContent === selectedSection);
  });

  loadQuestion(0);
});

// ── UPDATE PROGRESS ──
function updateProgress() {
  if (answeredCount === 0) {
    progressLabel.textContent = `Goal: ${goalPercent}%`;
    progressFill.style.width = '100%';
    progressFill.classList.remove('red');
    progressFill.classList.add('green');
    return;
  }

  const currentPct = Math.round((correctCount / answeredCount) * 100);
  progressLabel.textContent = `${correctCount}/${answeredCount} (${currentPct}%) — Goal: ${goalPercent}%`;

  progressFill.style.width = currentPct + '%';

  progressFill.classList.remove('blue');
  if (currentPct >= goalPercent) {
    progressFill.classList.remove('red');
    progressFill.classList.add('green');
  } else {
    progressFill.classList.remove('green');
    progressFill.classList.add('red');
  }
}

// ── LOAD QUESTION ──
function loadQuestion(index) {
  // Reshuffle and loop when all questions are done
  if (index >= filteredQuestions.length) {
    filteredQuestions.sort(() => Math.random() - 0.5);
    index = 0;
  }
  currentIndex = index;

  // Skip questions that don't match selected section (unless Both)
  if (selectedSection !== 'Both' && filteredQuestions[currentIndex].section !== selectedSection) {
    skipToMatchingQuestion();
    return;
  }

  const q = filteredQuestions[index];
  document.querySelector('.question-box').textContent = q.question;

  document.querySelectorAll('.option-btn').forEach((btn, i) => {
    btn.textContent = q.options[i];
    btn.style.background = '';
    btn.style.color = '';
    btn.disabled = false;
  });
}

// ── OPTION BUTTON SELECTION ──
document.querySelectorAll('.option-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    if (btn.disabled) return;

    const q = filteredQuestions[currentIndex];
    const optionBtns = document.querySelectorAll('.option-btn');

    // Lock all buttons
    optionBtns.forEach(b => {
      b.disabled = true;
      if (b.textContent === q.answer) {
        b.style.background = '#4caf50';
        b.style.color = '#fff';
      } else {
        b.style.background = '#2a2a2a';
        b.style.color = '#fff';
      }
    });

    // Track score
    answeredCount++;
    if (btn.textContent === q.answer) correctCount++;
    updateProgress();

    // Move to next question
    setTimeout(() => {
      loadQuestion(currentIndex + 1);
    }, 1200);
  });
});

// ── SUBJECT BUTTONS ──
document.querySelectorAll('.subject-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.subject-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    selectedSection = btn.textContent;
    progressLabel.textContent = answeredCount > 0
      ? `${correctCount}/${answeredCount} (${Math.round((correctCount/answeredCount)*100)}%) — Goal: ${goalPercent}%`
      : `Goal: ${goalPercent}%`;

    // Skip to next question that matches the selected section
    skipToMatchingQuestion();
  });
});

function skipToMatchingQuestion() {
  if (selectedSection === 'Both') return;

  let attempts = 0;
  while (
    filteredQuestions[currentIndex] &&
    filteredQuestions[currentIndex].section !== selectedSection &&
    attempts < filteredQuestions.length
  ) {
    currentIndex++;
    if (currentIndex >= filteredQuestions.length) {
      filteredQuestions.sort(() => Math.random() - 0.5);
      currentIndex = 0;
    }
    attempts++;
  }
  loadQuestion(currentIndex);
}

// ── SKIP — show answer briefly then move on ──
document.querySelector('.skip-btn').addEventListener('click', () => {
  const q = filteredQuestions[currentIndex];
  if (!q) return;

  const optionBtns = document.querySelectorAll('.option-btn');
  optionBtns.forEach(b => {
    b.disabled = true;
    if (b.textContent === q.answer) {
      b.style.background = '#4caf50';
      b.style.color = '#fff';
    } else {
      b.style.background = '#2a2a2a';
      b.style.color = '#fff';
    }
  });

  setTimeout(() => {
    loadQuestion(currentIndex + 1);
  }, 1200);
});