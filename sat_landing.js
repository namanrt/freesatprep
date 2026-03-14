const today = new Date();
const dayIndex = (today.getFullYear() * 365 + today.getMonth() * 31 + today.getDate()) % questions.length;
const dailyQ = questions[dayIndex];

const questionBox = document.getElementById('questionBox');
const optionBtns = document.querySelectorAll('.option-btn');

questionBox.textContent = dailyQ.question;
optionBtns.forEach((btn, i) => {
  btn.textContent = dailyQ.options[i];
});

optionBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    if (btn.disabled) return;
    optionBtns.forEach(b => {
      b.disabled = true;
      if (b.textContent === dailyQ.answer) {
        b.style.background = '#4caf50';
        b.style.color = '#fff';
      } else {
        b.style.background = '#2a2a2a';
        b.style.color = '#fff';
      }
    });
  });
});

document.querySelector('.dont-know-btn').addEventListener('click', () => {
  optionBtns.forEach(b => {
    b.disabled = true;
    if (b.textContent === dailyQ.answer) {
      b.style.background = '#4caf50';
      b.style.color = '#fff';
    } else {
      b.style.background = '#2a2a2a';
      b.style.color = '#fff';
    }
  });
});

document.querySelector('.practiceMore').addEventListener('click', () => {
  window.location.href = 'sat_quiz.html';
});

const track = document.getElementById('carouselTrack');
const dotsContainer = document.getElementById('carouselDots');
const slideWidth = 76;
let current = 0;

const originalSlides = Array.from(track.querySelectorAll('.carousel-slide'));
const firstClone = originalSlides[0].cloneNode(true);
const lastClone = originalSlides[originalSlides.length - 1].cloneNode(true);
track.appendChild(firstClone);
track.insertBefore(lastClone, originalSlides[0]);

const allSlides = track.querySelectorAll('.carousel-slide');
const total = originalSlides.length;

originalSlides.forEach((_, i) => {
  const dot = document.createElement('div');
  dot.classList.add('carousel-dot');
  if (i === 0) dot.classList.add('active');
  dot.addEventListener('click', () => goTo(i + 1));
  dotsContainer.appendChild(dot);
});

function updateDots(realIndex) {
  document.querySelectorAll('.carousel-dot').forEach((d, i) => {
    d.classList.toggle('active', i === realIndex);
  });
}

function goTo(index, animate = true) {
  if (!animate) track.style.transition = 'none';
  else track.style.transition = 'transform 0.4s ease';

  const offset = index * slideWidth;
  track.style.transform = `translateX(calc(-${offset}% + 12%))`;
  current = index;

  const realIndex = ((index - 1) + total) % total;
  updateDots(realIndex);
}

track.addEventListener('transitionend', () => {
  if (current === 0) {
    goTo(total, false);
  }
  if (current === total + 1) {
    goTo(1, false);
  }
});

document.getElementById('prevBtn').addEventListener('click', () => goTo(current - 1));
document.getElementById('nextBtn').addEventListener('click', () => goTo(current + 1));

goTo(1, false);