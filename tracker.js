(function () {
  const BIN_ID = '69b4c063b7ec241ddc686bd7';
  const API_KEY = '$2a$10$i96ZlacCYBbYPjVnqJtHT.wNlxB2hRk7WHGsDDF1UWgpPy3Ynxz4C';
  const BASE = 'https://api.jsonbin.io/v3/b/' + BIN_ID;

  const VISITOR_KEY = 'sat_visitor_id';
  const SESSION_KEY = 'sat_session_id';
  const RETURNING_KEY = 'sat_has_visited';

  function uid() {
    return Math.random().toString(36).slice(2) + Date.now().toString(36);
  }

  function getOrCreateVisitorId() {
    let id = localStorage.getItem(VISITOR_KEY);
    if (!id) { id = 'v_' + uid(); localStorage.setItem(VISITOR_KEY, id); }
    return id;
  }

  function getSessionId() {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) { id = 's_' + uid(); sessionStorage.setItem(SESSION_KEY, id); }
    return id;
  }

  const sessionStart = Date.now();
  const visitorId = getOrCreateVisitorId();
  const sessionId = getSessionId();
  const isReturning = !!localStorage.getItem(RETURNING_KEY);
  const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);

  let sessionAnswered = 0;
  let sessionCorrect = 0;
  let sessionSkipped = 0;
  let sessionQuestionLoadTime = Date.now();
  let sessionFastestAnswer = null;
  let sessionFirstAnswerTime = null;
  let hasBounced = true;

  window.__satTracker = {
    onAnswer: function (isCorrect, questionText) {
      hasBounced = false;
      sessionAnswered++;
      if (isCorrect) sessionCorrect++;
      const elapsed = Date.now() - sessionQuestionLoadTime;
      if (sessionFastestAnswer === null || elapsed < sessionFastestAnswer) sessionFastestAnswer = elapsed;
      if (sessionFirstAnswerTime === null) sessionFirstAnswerTime = Date.now();
    },
    onSkip: function (questionText) {
      hasBounced = false;
      sessionSkipped++;
      sessionQuestionLoadTime = Date.now();
      window.__satTracker._lastSkipped = questionText;
    },
    onQuestionLoad: function () {
      sessionQuestionLoadTime = Date.now();
    },
    onMissed: function (questionText) {
      window.__satTracker._missedQuestion = questionText;
    }
  };

  async function fetchStats() {
    const res = await fetch(BASE + '/latest', { headers: { 'X-Master-Key': API_KEY } });
    const json = await res.json();
    return json.record;
  }

  async function saveStats(data) {
    await fetch(BASE, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'X-Master-Key': API_KEY },
      body: JSON.stringify(data)
    });
  }

  function getHourLabel() {
    const h = new Date().getHours();
    return ((h % 12) || 12) + (h >= 12 ? 'pm' : 'am');
  }

  function getDayLabel() {
    return ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][new Date().getDay()];
  }

  async function trackPageLoad() {
    try {
      const stats = await fetchStats();
      const isNewVisitor = !localStorage.getItem('sat_counted_' + visitorId);

      stats.totalViews = (stats.totalViews || 0) + 1;
      stats.totalSessions = (stats.totalSessions || 0) + 1;

      if (isNewVisitor) {
        stats.uniqueViews = (stats.uniqueViews || 0) + 1;
        localStorage.setItem('sat_counted_' + visitorId, '1');
      }
      if (isReturning) stats.returnVisitors = (stats.returnVisitors || 0) + 1;
      localStorage.setItem(RETURNING_KEY, '1');

      if (isMobile) stats.mobileVisits = (stats.mobileVisits || 0) + 1;
      else stats.desktopVisits = (stats.desktopVisits || 0) + 1;

      stats.byHour = stats.byHour || {};
      stats.byHour[getHourLabel()] = (stats.byHour[getHourLabel()] || 0) + 1;

      stats.byDay = stats.byDay || {};
      stats.byDay[getDayLabel()] = (stats.byDay[getDayLabel()] || 0) + 1;

      try {
        const geoRes = await fetch('https://ipapi.co/json/');
        const geo = await geoRes.json();
        if (geo && geo.country_name) {
          stats.byCountry = stats.byCountry || {};
          stats.byCountry[geo.country_name] = (stats.byCountry[geo.country_name] || 0) + 1;
        }
      } catch (e) {}

      await saveStats(stats);
    } catch (e) {}
  }

  async function trackSessionEnd() {
    const secondsSpent = Math.round((Date.now() - sessionStart) / 1000);
    if (secondsSpent < 2) return;
    try {
      const stats = await fetchStats();

      stats.totalSeconds = (stats.totalSeconds || 0) + secondsSpent;
      if (!stats.longestSession || secondsSpent > stats.longestSession) stats.longestSession = secondsSpent;

      const sessions = stats.totalSessions || 1;
      stats.avgSessionSeconds = Math.round(((stats.avgSessionSeconds || 0) * (sessions - 1) + secondsSpent) / sessions);

      if (sessionAnswered > 0) {
        stats.totalAnswered = (stats.totalAnswered || 0) + sessionAnswered;
        stats.totalCorrect = (stats.totalCorrect || 0) + sessionCorrect;
        stats.totalSkipped = (stats.totalSkipped || 0) + sessionSkipped;

        const sessionQCount = sessionAnswered + sessionSkipped;
        const prevSessions = stats.sessionsWithAnswers || 0;
        stats.sessionsWithAnswers = prevSessions + 1;
        stats.avgQuestionsPerSession = Math.round(((stats.avgQuestionsPerSession || 0) * prevSessions + sessionQCount) / stats.sessionsWithAnswers);

        if (sessionFastestAnswer !== null && (!stats.fastestAnswer || sessionFastestAnswer < stats.fastestAnswer)) {
          stats.fastestAnswer = sessionFastestAnswer;
        }
      }

      if (hasBounced) stats.bounces = (stats.bounces || 0) + 1;

      if (window.__satTracker._missedQuestion) {
        stats.missedQuestions = stats.missedQuestions || {};
        const mq = window.__satTracker._missedQuestion;
        stats.missedQuestions[mq] = (stats.missedQuestions[mq] || 0) + 1;
      }

      if (sessionSkipped > 0 && window.__satTracker._lastSkipped) {
        stats.skippedQuestions = stats.skippedQuestions || {};
        const sq = window.__satTracker._lastSkipped;
        stats.skippedQuestions[sq] = (stats.skippedQuestions[sq] || 0) + 1;
      }

      await saveStats(stats);
    } catch (e) {}
  }


  function _chk(n) {
    n = +n;
    if (isNaN(n) || !Number.isInteger(n)) return false;
    if ((n ^ 0x1F4) % 97 !== 13) return false;
    if (String(n).split('').reduce((a, c) => a + +c, 0) !== 23) return false;
    if (Math.floor(n / 1000) % 2 !== 1) return false;
    if (n % 7 !== 0) return false;
    return true;
  }

  function _fmtBar(obj, limit) {
    if (!obj || !Object.keys(obj).length) return '  (none)';
    return Object.entries(obj)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit || 5)
      .map(([k, v]) => '  ' + k.padEnd(30) + v)
      .join('\n');
  }

  async function _printStats() {
    console.log('%c⏳ Fetching stats...', 'color:#4a90d9');
    try {
      const s = await fetchStats();
      const hours = ((s.totalSeconds || 0) / 3600).toFixed(2);
      const avgMin = ((s.avgSessionSeconds || 0) / 60).toFixed(1);
      const longestMin = ((s.longestSession || 0) / 60).toFixed(1);
      const correctPct = s.totalAnswered > 0 ? Math.round((s.totalCorrect || 0) / s.totalAnswered * 100) : 0;
      const bouncePct = s.totalSessions > 0 ? Math.round((s.bounces || 0) / s.totalSessions * 100) : 0;
      const totalDev = (s.mobileVisits || 0) + (s.desktopVisits || 0);
      const mobilePct = totalDev > 0 ? Math.round((s.mobileVisits || 0) / totalDev * 100) : 0;
      const newPct = s.uniqueViews > 0 ? Math.round(((s.uniqueViews - (s.returnVisitors || 0)) / s.uniqueViews) * 100) : 0;
      const fastestSec = s.fastestAnswer ? (s.fastestAnswer / 1000).toFixed(2) + 's' : 'N/A';

      console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color:#333');
      console.log('%c  SAT PREP — STATS REPORT  ' + new Date().toLocaleString(), 'color:#fff;background:#111;font-weight:bold;padding:2px 8px;border-radius:4px');
      console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color:#333');

      console.log('%c\n👥  VISITORS', 'color:#4a90d9;font-weight:bold');
      console.log('  Unique visitors       ' + (s.uniqueViews || 0));
      console.log('  Total page views      ' + (s.totalViews || 0));
      console.log('  Return visitors       ' + (s.returnVisitors || 0));
      console.log('  New vs returning      ' + newPct + '% new');

      console.log('%c\n⏱  TIME', 'color:#4a90d9;font-weight:bold');
      console.log('  Total hours used      ' + hours + 'h');
      console.log('  Total sessions        ' + (s.totalSessions || 0));
      console.log('  Avg session length    ' + avgMin + ' min');
      console.log('  Longest session       ' + longestMin + ' min');

      console.log('%c\n📝  QUESTIONS', 'color:#4a90d9;font-weight:bold');
      console.log('  Total answered        ' + (s.totalAnswered || 0));
      console.log('  Correct rate          ' + correctPct + '%');
      console.log('  Total skipped         ' + (s.totalSkipped || 0));
      console.log('  Avg q per session     ' + (s.avgQuestionsPerSession || 0));
      console.log('  Fastest answer        ' + fastestSec);

      console.log('%c\n📊  ENGAGEMENT', 'color:#4a90d9;font-weight:bold');
      console.log('  Bounce rate           ' + bouncePct + '%');
      console.log('  Mobile visitors       ' + mobilePct + '%');
      console.log('  Peak hour             ' + (s.byHour ? Object.entries(s.byHour).sort((a,b)=>b[1]-a[1])[0]?.[0] : 'N/A'));

      console.log('%c\n📅  BY DAY', 'color:#4a90d9;font-weight:bold');
      console.log(_fmtBar(s.byDay, 7));

      console.log('%c\n🕐  BY HOUR', 'color:#4a90d9;font-weight:bold');
      console.log(_fmtBar(s.byHour, 8));

      console.log('%c\n🌍  TOP COUNTRIES', 'color:#4a90d9;font-weight:bold');
      console.log(_fmtBar(s.byCountry, 10));

      console.log('%c\n❌  MOST MISSED QUESTIONS', 'color:#4a90d9;font-weight:bold');
      console.log(_fmtBar(s.missedQuestions, 5));

      console.log('%c\n⏭  MOST SKIPPED QUESTIONS', 'color:#4a90d9;font-weight:bold');
      console.log(_fmtBar(s.skippedQuestions, 5));

      console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'color:#333');
    } catch (e) {
      console.log('%c❌ Failed to fetch stats. Check your BIN_ID / API_KEY in tracker.js', 'color:#e53935');
    }
  }

  window.sat = function (n) {
    if (_chk(n)) {
      _printStats();
    } else {
      void 0;
    }
  };

  trackPageLoad();
  window.addEventListener('beforeunload', () => { trackSessionEnd(); });
})();