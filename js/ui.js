/**
 * SwitchCom — UI Components & Animations
 * Switch row rendering, stats display, hint system, success/fail feedback
 */

const SwitchComUI = {
  // ========================================
  // DOM References
  // ========================================
  elements: {
    app: null,
    switchRow: null,
    levelNumber: null,
    timerValue: null,
    clicksValue: null,
    livesValue: null,
    correctCount: null,
    hintDirection: null,
    hintGlowLine: null,
    proximityGlow: null,
    runStatsBar: null,
    timeBudgetStat: null,
    timeBudgetValue: null,
    clickBudgetStat: null,
    clickBudgetValue: null,
    levelsCompletedValue: null,
    pauseBtn: null,
    pauseModal: null,
    pauseLevel: null,
    pauseCompleted: null,
    resumeBtn: null,
    menuBtn: null,
    gameoverScreen: null,
    gameoverReason: null,
    gameoverLevels: null,
    playAgainBtn: null,
    gameoverMenuBtn: null,
    successRipple: null,
    unlockOverlay: null,
    unlockLevel: null,
    failureOverlay: null,
    startScreen: null,
    startBtn: null,
    dailyBtn: null,
    modeBtns: null,
    difficultyBtns: null,
    totalGames: null,
    highestLevel: null,
    leaderboard: null,
    settingsBtn: null,
    settingsModal: null,
    // New elements
    levelProgression: null,
    levelPrevNum: null,
    levelNextNum: null,
    levelConnectorFill: null,
    pointsDisplay: null,
    pointsValue: null,
    floatingPointsContainer: null,
  },

  // Score tracking
  currentScore: 0,

  // Current selections
  selectedMode: 'timeAttack',
  selectedDifficulty: 'medium',

  // ========================================
  // Layout Patterns by Level (unique designs for levels 1-30)
  // ========================================
  levelLayouts: {
    1: 'horizontal-2',
    2: 'vertical-2',
    3: 'triangle-3',
    4: 'line-3',
    5: 'square-4',
    6: 'diamond-4',
    7: 'plus-5',
    8: 'x-5',
    9: 'hexagon-6',
    10: 'rectangle-6',
    11: 'arrow-7',
    12: 'h-shape-7',
    13: 'circle-8',
    14: 'hourglass-8',
    15: 'grid-9',
    16: 'diamond-9',
    17: 'pentagon-10',
    18: 'cross-10',
    19: 'star-11',
    20: 'chevron-11',
    21: 'hexagon-12',
    22: 'triangle-12',
    23: 'arrow-13',
    24: 'wave-13',
    25: 'butterfly-14',
    26: 'diamond-14',
    27: 'pyramid-15',
    28: 'spiral-15',
    29: 'grid-16',
    30: 'flower-16',
  },

  // ========================================
  // Initialize UI
  // ========================================
  init() {
    this.cacheElements();
    this.bindEvents();
    this.applySettings();

    return this;
  },

  cacheElements() {
    this.elements.app = document.getElementById('app');
    this.elements.switchRow = document.getElementById('switch-row');
    this.elements.levelNumber = document.getElementById('level-number');
    this.elements.timerValue = document.getElementById('timer-value');
    this.elements.clicksValue = document.getElementById('clicks-value');
    this.elements.hintGlowLine = document.querySelector('.hint-glow-line');
    this.elements.proximityGlow = document.querySelector('.proximity-glow');
    this.elements.runStatsBar = document.getElementById('run-stats-bar');
    this.elements.timeBudgetStat = document.getElementById('time-budget-stat');
    this.elements.timeBudgetValue = document.getElementById('time-budget-value');
    this.elements.clickBudgetStat = document.getElementById('click-budget-stat');
    this.elements.clickBudgetValue = document.getElementById('click-budget-value');
    this.elements.levelsCompletedValue = document.getElementById('levels-completed-value');
    this.elements.pauseBtn = document.getElementById('pause-btn');
    this.elements.pauseModal = document.getElementById('pause-modal');
    this.elements.pauseLevel = document.getElementById('pause-level');
    this.elements.pauseCompleted = document.getElementById('pause-completed');
    this.elements.resumeBtn = document.getElementById('resume-btn');
    this.elements.menuBtn = document.getElementById('menu-btn');
    this.elements.gameoverScreen = document.getElementById('gameover-screen');
    this.elements.gameoverReason = document.getElementById('gameover-reason');
    this.elements.gameoverLevels = document.getElementById('gameover-levels');
    this.elements.playAgainBtn = document.getElementById('play-again-btn');
    this.elements.gameoverMenuBtn = document.getElementById('gameover-menu-btn');
    this.elements.successRipple = document.querySelector('.success-ripple');
    this.elements.unlockOverlay = document.getElementById('unlock-overlay');
    this.elements.unlockLevel = document.getElementById('unlock-level');
    this.elements.failureOverlay = document.querySelector('.failure-overlay');
    this.elements.startScreen = document.getElementById('start-screen');
    this.elements.startBtn = document.getElementById('start-btn');
    this.elements.dailyBtn = document.getElementById('daily-btn');
    this.elements.modeBtns = document.querySelectorAll('.mode-btn');
    this.elements.difficultyBtns = document.querySelectorAll('.difficulty-btn');
    this.elements.totalGames = document.getElementById('total-games');
    this.elements.highestLevel = document.getElementById('highest-level');
    this.elements.leaderboard = document.getElementById('leaderboard');
    this.elements.settingsBtn = document.getElementById('settings-btn');
    this.elements.settingsModal = document.getElementById('settings-modal');
    // New elements
    this.elements.levelProgression = document.getElementById('level-progression');
    this.elements.levelPrevNum = document.getElementById('level-prev-num');
    this.elements.levelNextNum = document.getElementById('level-next-num');
    this.elements.levelConnectorFill = document.getElementById('level-connector-fill');
    this.elements.pointsDisplay = document.getElementById('points-display');
    this.elements.pointsValue = document.getElementById('points-value');
    this.elements.floatingPointsContainer = document.getElementById('floating-points-container');
    // Stats bar elements
    this.elements.livesValue = document.getElementById('lives-value');
    this.elements.correctCount = document.getElementById('correct-count');
    this.elements.hintDirection = document.getElementById('hint-direction');
  },

  bindEvents() {
    // Settings
    this.elements.settingsBtn.addEventListener('click', () => this.openSettings());
    document.getElementById('close-settings').addEventListener('click', () => this.closeSettings());
    this.elements.settingsModal.addEventListener('click', (e) => {
      if (e.target === this.elements.settingsModal) this.closeSettings();
    });

    // Settings toggles
    document.getElementById('haptics-toggle').addEventListener('change', (e) => {
      SwitchCom.updateSetting('haptics', e.target.checked);
    });

    document.getElementById('sound-toggle').addEventListener('change', (e) => {
      SwitchCom.updateSetting('sound', e.target.checked);
      SwitchComAudio.setEnabled(e.target.checked);
    });

    document.getElementById('reduce-motion-toggle').addEventListener('change', (e) => {
      this.setReduceMotion(e.target.checked);
      SwitchCom.updateSetting('reduceMotion', e.target.checked);
    });

    // Dark mode toggle - CRITICAL FIX
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    console.log('Dark mode toggle element:', darkModeToggle);
    if (darkModeToggle) {
      console.log('Binding dark mode toggle event...');
      darkModeToggle.addEventListener('change', (e) => {
        console.log('🌓 Dark mode toggle FIRED! Checked:', e.target.checked);
        this.setDarkMode(e.target.checked);
        SwitchCom.updateSetting('darkMode', e.target.checked);
      });
      console.log('Dark mode toggle event bound successfully');
    } else {
      console.error('❌ Dark mode toggle element NOT FOUND!');
    }

    // Mode selection
    this.elements.modeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        this.elements.modeBtns.forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        this.selectedMode = btn.dataset.mode;
      });
    });

    // Difficulty selection
    this.elements.difficultyBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        this.elements.difficultyBtns.forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        this.selectedDifficulty = btn.dataset.difficulty;
      });
    });

    // Pause button
    this.elements.pauseBtn.addEventListener('click', () => this.showPauseModal());

    // Resume button
    this.elements.resumeBtn.addEventListener('click', () => this.hidePauseModal());

    // Menu button (from pause)
    this.elements.menuBtn.addEventListener('click', () => {
      this.hidePauseModal();
      this.returnToMenu();
    });

    // Game over buttons
    this.elements.gameoverMenuBtn.addEventListener('click', () => {
      this.hideGameOver();
      this.showStartScreen();
    });
  },

  applySettings() {
    const settings = SwitchCom.state.settings;

    document.getElementById('haptics-toggle').checked = settings.haptics;
    document.getElementById('sound-toggle').checked = settings.sound;
    document.getElementById('reduce-motion-toggle').checked = settings.reduceMotion;
    
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    if (darkModeToggle) {
      darkModeToggle.checked = settings.darkMode || false;
    }

    this.setReduceMotion(settings.reduceMotion);
    this.setDarkMode(settings.darkMode || false);
    SwitchComAudio.setEnabled(settings.sound);
  },

  setReduceMotion(reduce) {
    this.elements.app.classList.toggle('reduce-motion', reduce);
  },

  setDarkMode(dark) {
    console.log('setDarkMode called with:', dark);
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    // Also set on body for broader compatibility
    document.body.setAttribute('data-theme', dark ? 'dark' : 'light');
    // Force background color change as fallback
    document.body.style.background = dark ? '#0D0D0D' : '#FAFAFA';
    const app = document.getElementById('app');
    if (app) {
      app.style.background = dark ? '#0D0D0D' : '#FAFAFA';
      app.style.color = dark ? '#E8E8E8' : '#2A2A2A';
    }
    console.log('data-theme set to:', document.documentElement.getAttribute('data-theme'));
    // Update meta theme-color for mobile browsers
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.setAttribute('content', dark ? '#0D0D0D' : '#FFFFFF');
    }
  },

  // ========================================
  // Get Layout Class for Level
  // ========================================
  getLayoutClass(switchCount, level) {
    if (level && this.levelLayouts[level]) {
      return 'layout-' + this.levelLayouts[level];
    }
    const fallbackLayouts = ['grid', 'diamond', 'hexagon', 'circle', 'pyramid'];
    const index = (level - 31) % fallbackLayouts.length;
    return 'layout-' + fallbackLayouts[index] + '-' + switchCount;
  },

  // ========================================
  // Switch Row Rendering
  // ========================================
  renderSwitchRow(switchCount, pattern, onToggle, level) {
    this.elements.switchRow.innerHTML = '';

    const currentLevel = level || SwitchCom.state.currentLevel;
    this.elements.switchRow.className = 'switch-row ' + this.getLayoutClass(switchCount, currentLevel);

    for (let i = 0; i < switchCount; i++) {
      const wrapper = document.createElement('label');
      wrapper.className = 'toggle-wrapper';
      wrapper.innerHTML = `
        <input type="checkbox" class="toggle-checkbox" data-index="${i}" ${pattern[i] ? 'checked' : ''}>
        <div class="toggle-container">
          <div class="toggle-button">
            <div class="toggle-button-circles-container">
              <div class="toggle-button-circle"></div>
              <div class="toggle-button-circle"></div>
              <div class="toggle-button-circle"></div>
            </div>
          </div>
        </div>
      `;

      const checkbox = wrapper.querySelector('.toggle-checkbox');
      checkbox.addEventListener('change', (e) => {
        const index = parseInt(e.target.dataset.index);
        const isOn = e.target.checked;

        if (SwitchCom.state.settings.sound) {
          if (isOn) {
            SwitchComAudio.playToggleOn();
          } else {
            SwitchComAudio.playToggleOff();
          }
        }

        onToggle(index);
      });

      this.elements.switchRow.appendChild(wrapper);
    }
  },

  updateSwitch(index, isOn) {
    const checkbox = this.elements.switchRow.querySelectorAll('.toggle-checkbox')[index];
    if (checkbox) {
      checkbox.checked = isOn;
    }
  },

  // ========================================
  // Stats Display
  // ========================================
  updateTimer(seconds) {
    const displaySeconds = Math.ceil(seconds);
    this.elements.timerValue.textContent = displaySeconds;

    this.elements.timerValue.classList.remove('warning', 'danger');
    if (displaySeconds <= 10) {
      this.elements.timerValue.classList.add('danger');
    } else if (displaySeconds <= 20) {
      this.elements.timerValue.classList.add('warning');
    }
  },

  updateClicks(remaining) {
    this.elements.clicksValue.textContent = remaining;

    this.elements.clicksValue.classList.remove('warning', 'danger');
    if (remaining <= 1) {
      this.elements.clicksValue.classList.add('danger');
    } else if (remaining <= 2) {
      this.elements.clicksValue.classList.add('warning');
    }
  },

  updateLevel(level) {
    this.updateLevelProgression(level);
  },

  // ========================================
  // Hint System
  // ========================================
  showHint(proximity, nearWin = false, matchCount = 0, totalSwitches = 0, direction = 'same', toggledIndex = -1) {
    const opacity = 0.08 + (proximity * 0.12);

    this.elements.hintGlowLine.style.setProperty('--hint-opacity', opacity);
    this.elements.hintGlowLine.classList.remove('active');
    void this.elements.hintGlowLine.offsetWidth;
    this.elements.hintGlowLine.classList.add('active');

    this.elements.proximityGlow.style.opacity = opacity * 0.5;

    if (SwitchCom.state.guessCount >= 1) {
      this.updateCorrectCount(matchCount, direction);
    }

    if (toggledIndex >= 0) {
      this.showSwitchFeedback(toggledIndex, direction);
    }

    if (nearWin) {
      this.triggerMicroPulse();
    }

    setTimeout(() => {
      this.elements.proximityGlow.style.opacity = 0;
    }, 400);
  },

  updateCorrectCount(count, direction) {
    // Update the correct count display
    if (this.elements.correctCount) {
      this.elements.correctCount.textContent = count;
    }

    // Update the direction indicator
    if (this.elements.hintDirection) {
      this.elements.hintDirection.classList.remove('warmer', 'colder', 'visible');

      if (direction === 'warmer') {
        this.elements.hintDirection.textContent = '▲';
        this.elements.hintDirection.classList.add('warmer', 'visible');
      } else if (direction === 'colder') {
        this.elements.hintDirection.textContent = '▼';
        this.elements.hintDirection.classList.add('colder', 'visible');
      } else {
        this.elements.hintDirection.textContent = '';
      }
    }
  },

  // ========================================
  // Run Stats Display
  // ========================================
  showRunStats(mode) {
    this.elements.runStatsBar.classList.add('visible');
    this.elements.pauseBtn.classList.add('visible');
    this.elements.levelProgression.classList.add('visible');
    this.elements.pointsDisplay.classList.add('visible');

    // Show/hide mode-specific stats
    if (mode === 'timeAttack') {
      this.elements.timeBudgetStat.style.display = 'flex';
      this.elements.clickBudgetStat.style.display = 'none';
    } else if (mode === 'clickChallenge') {
      this.elements.timeBudgetStat.style.display = 'none';
      this.elements.clickBudgetStat.style.display = 'flex';
    } else {
      // Endless - hide both budget stats
      this.elements.timeBudgetStat.style.display = 'none';
      this.elements.clickBudgetStat.style.display = 'none';
    }

    // Reset score
    this.currentScore = 0;
    this.elements.pointsValue.textContent = '0';
  },

  hideRunStats() {
    this.elements.runStatsBar.classList.remove('visible');
    this.elements.pauseBtn.classList.remove('visible');
    this.elements.levelProgression.classList.remove('visible');
    this.elements.pointsDisplay.classList.remove('visible');
  },

  updateRunStats(timeBudget, clickBudget, retries, levelsCompleted) {
    // Time budget (for Time Attack)
    if (timeBudget !== Infinity) {
      const minutes = Math.floor(Math.max(0, timeBudget) / 60);
      const seconds = Math.floor(Math.max(0, timeBudget) % 60);
      this.elements.timeBudgetValue.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;

      this.elements.timeBudgetValue.classList.remove('warning', 'danger');
      if (timeBudget <= 30) {
        this.elements.timeBudgetValue.classList.add('danger');
      } else if (timeBudget <= 60) {
        this.elements.timeBudgetValue.classList.add('warning');
      }
    }

    // Click budget (for Click Challenge)
    if (clickBudget !== Infinity) {
      this.elements.clickBudgetValue.textContent = clickBudget;

      this.elements.clickBudgetValue.classList.remove('warning', 'danger');
      if (clickBudget <= 10) {
        this.elements.clickBudgetValue.classList.add('danger');
      } else if (clickBudget <= 20) {
        this.elements.clickBudgetValue.classList.add('warning');
      }
    }

    // Update lives display
    this.updateLives(retries);

    // Levels completed
    this.elements.levelsCompletedValue.textContent = levelsCompleted;
  },

  // ========================================
  // Lives Display (Numeric in stats bar)
  // ========================================
  updateLives(retries) {
    if (this.elements.livesValue) {
      this.elements.livesValue.textContent = retries;

      // Visual feedback for low lives
      this.elements.livesValue.classList.remove('warning', 'danger');
      if (retries <= 1) {
        this.elements.livesValue.classList.add('danger');
      } else if (retries === 2) {
        this.elements.livesValue.classList.add('warning');
      }
    }
  },

  loseLife(lifeIndex) {
    // Animate the lives value with a bump
    if (this.elements.livesValue) {
      this.elements.livesValue.classList.add('bump');
      setTimeout(() => {
        this.elements.livesValue.classList.remove('bump');
      }, 200);
    }
  },

  resetLives() {
    const maxRetries = SwitchCom.state.retriesPerLevel;
    if (this.elements.livesValue) {
      this.elements.livesValue.textContent = maxRetries;
      this.elements.livesValue.classList.remove('warning', 'danger');
    }
  },

  // ========================================
  // Points System
  // ========================================
  addPoints(points, fromY = null) {
    this.currentScore += points;

    // Show floating point
    this.showFloatingPoint(points, fromY);

    // Update total with bump animation
    setTimeout(() => {
      this.elements.pointsValue.textContent = this.currentScore;
      this.elements.pointsValue.classList.add('bump');
      setTimeout(() => {
        this.elements.pointsValue.classList.remove('bump');
      }, 200);
    }, 800);
  },

  showFloatingPoint(points, fromY = null) {
    const container = this.elements.floatingPointsContainer;
    const floater = document.createElement('div');
    floater.className = 'floating-point';
    floater.textContent = '+' + points;
    floater.style.top = (fromY || (window.innerHeight / 2)) + 'px';
    container.appendChild(floater);

    setTimeout(() => {
      floater.remove();
    }, 1500);
  },

  // ========================================
  // Level Progression Display
  // ========================================
  updateLevelProgression(level) {
    this.elements.levelNumber.textContent = level;
    this.elements.levelPrevNum.textContent = level > 1 ? level - 1 : '-';
    this.elements.levelNextNum.textContent = level + 1;

    // Reset connector fill
    if (this.elements.levelConnectorFill) {
      this.elements.levelConnectorFill.style.width = '0%';
    }
  },

  animateLevelProgress() {
    // Animate the connector fill to show progress to next level
    if (this.elements.levelConnectorFill) {
      this.elements.levelConnectorFill.style.width = '100%';
    }
  },

  // ========================================
  // Individual Switch Feedback (Hot/Cold glow)
  // ========================================
  showSwitchFeedback(index, direction) {
    const wrappers = this.elements.switchRow.querySelectorAll('.toggle-wrapper');
    const wrapper = wrappers[index];

    if (!wrapper) return;

    wrapper.classList.remove('hot-glow', 'cold-glow');
    void wrapper.offsetWidth;

    if (direction === 'warmer') {
      wrapper.classList.add('hot-glow');
    } else if (direction === 'colder') {
      wrapper.classList.add('cold-glow');
    }

    setTimeout(() => {
      wrapper.classList.remove('hot-glow', 'cold-glow');
    }, 400);
  },

  resetHintDisplay() {
    // Reset correct count display
    if (this.elements.correctCount) {
      this.elements.correctCount.textContent = '-';
    }
    if (this.elements.hintDirection) {
      this.elements.hintDirection.textContent = '';
      this.elements.hintDirection.classList.remove('warmer', 'colder', 'visible');
    }
  },

  triggerMicroPulse() {
    this.elements.switchRow.classList.remove('micro-pulse');
    void this.elements.switchRow.offsetWidth;
    this.elements.switchRow.classList.add('micro-pulse');

    setTimeout(() => {
      this.elements.switchRow.classList.remove('micro-pulse');
    }, 100);
  },

  triggerShake() {
    this.elements.switchRow.classList.remove('shake');
    void this.elements.switchRow.offsetWidth;
    this.elements.switchRow.classList.add('shake');

    setTimeout(() => {
      this.elements.switchRow.classList.remove('shake');
    }, 100);
  },

  // ========================================
  // Success Animation with Unlock
  // ========================================
  showSuccess(nextLevel, callback) {
    if (SwitchCom.state.settings.sound) {
      SwitchComAudio.playSuccess();
    }

    this.elements.successRipple.classList.remove('active');
    void this.elements.successRipple.offsetWidth;
    this.elements.successRipple.classList.add('active');

    SwitchCom.triggerHaptic('success');

    setTimeout(() => {
      if (nextLevel) {
        this.elements.unlockLevel.textContent = nextLevel;
        this.elements.unlockOverlay.classList.add('active');
      }
    }, 200);

    setTimeout(() => {
      this.elements.unlockOverlay.classList.remove('active');
      this.elements.successRipple.classList.remove('active');
      if (callback) callback();
    }, 2000);
  },

  // ========================================
  // Failure Animation
  // ========================================
  showFailure(callback) {
    if (SwitchCom.state.settings.sound) {
      SwitchComAudio.playFail();
    }

    this.elements.failureOverlay.classList.remove('active');
    void this.elements.failureOverlay.offsetWidth;
    this.elements.failureOverlay.classList.add('active');

    this.triggerShake();
    SwitchCom.triggerHaptic('failure');

    setTimeout(() => {
      this.elements.failureOverlay.classList.remove('active');
      if (callback) callback();
    }, 700);
  },

  // ========================================
  // Start Screen
  // ========================================
  showStartScreen() {
    this.elements.startScreen.classList.remove('hidden');
    this.hideRunStats();

    // Update stats summary
    this.elements.totalGames.textContent = SwitchCom.state.totalGamesPlayed;
    this.elements.highestLevel.textContent = SwitchCom.state.highestLevel;

    // Show daily button if unlocked
    if (SwitchCom.isDailyChallengeAvailable()) {
      this.elements.dailyBtn.style.display = 'block';

      if (SwitchCom.hasDailyChallengeBeenCompleted()) {
        this.elements.dailyBtn.textContent = 'Daily (done)';
        this.elements.dailyBtn.disabled = true;
        this.elements.dailyBtn.style.opacity = 0.5;
      } else {
        this.elements.dailyBtn.textContent = 'Daily Challenge';
        this.elements.dailyBtn.disabled = false;
        this.elements.dailyBtn.style.opacity = 1;
      }
    }

    this.updateLeaderboard();
  },

  updateLeaderboard() {
    const bestRuns = SwitchCom.state.bestRuns || {
      timeAttack: { easy: 0, medium: 0, hard: 0 },
      clickChallenge: { easy: 0, medium: 0, hard: 0 },
      endless: { easy: 0, medium: 0, hard: 0 },
    };

    // Time Attack
    document.getElementById('best-ta-easy').textContent = (bestRuns.timeAttack && bestRuns.timeAttack.easy) || 0;
    document.getElementById('best-ta-medium').textContent = (bestRuns.timeAttack && bestRuns.timeAttack.medium) || 0;
    document.getElementById('best-ta-hard').textContent = (bestRuns.timeAttack && bestRuns.timeAttack.hard) || 0;

    // Click Challenge
    document.getElementById('best-cc-easy').textContent = (bestRuns.clickChallenge && bestRuns.clickChallenge.easy) || 0;
    document.getElementById('best-cc-medium').textContent = (bestRuns.clickChallenge && bestRuns.clickChallenge.medium) || 0;
    document.getElementById('best-cc-hard').textContent = (bestRuns.clickChallenge && bestRuns.clickChallenge.hard) || 0;

    // Endless
    document.getElementById('best-en-easy').textContent = (bestRuns.endless && bestRuns.endless.easy) || 0;
    document.getElementById('best-en-medium').textContent = (bestRuns.endless && bestRuns.endless.medium) || 0;
    document.getElementById('best-en-hard').textContent = (bestRuns.endless && bestRuns.endless.hard) || 0;
  },

  hideStartScreen() {
    this.elements.startScreen.classList.add('hidden');
  },

  // ========================================
  // Settings Modal
  // ========================================
  openSettings() {
    this.elements.settingsModal.classList.add('active');
    SwitchCom.state.isPaused = true;
  },

  closeSettings() {
    this.elements.settingsModal.classList.remove('active');
    SwitchCom.state.isPaused = false;
  },

  // ========================================
  // Level Transition
  // ========================================
  transitionToLevel(config, onReady) {
    this.elements.switchRow.style.opacity = 0;
    this.elements.switchRow.style.transform = 'scale(0.9)';

    this.resetHintDisplay();

    setTimeout(() => {
      this.updateLevel(config.levelNumber);

      this.renderSwitchRow(
        config.switchCount,
        SwitchCom.state.playerPattern,
        onReady,
        config.levelNumber
      );

      this.updateTimer(config.baseTime);
      this.updateClicks(config.maxGuesses);

      this.elements.switchRow.style.opacity = 1;
      this.elements.switchRow.style.transform = 'scale(1)';
    }, 250);
  },

  // ========================================
  // Cosmetic Unlock Notification
  // ========================================
  showCosmeticUnlock(cosmetic) {
    console.log('Unlocked cosmetic:', cosmetic.name);
  },

  // ========================================
  // Pause Modal
  // ========================================
  showPauseModal() {
    SwitchCom.state.isPaused = true;
    this.elements.pauseLevel.textContent = SwitchCom.state.currentLevel;
    this.elements.pauseCompleted.textContent = SwitchCom.state.levelsCompleted;
    this.elements.pauseModal.classList.add('active');
  },

  hidePauseModal() {
    SwitchCom.state.isPaused = false;
    this.elements.pauseModal.classList.remove('active');
  },

  // ========================================
  // Game Over Screen
  // ========================================
  showGameOver(reason, levelsCompleted) {
    let reasonText = 'Game Over';
    if (reason === 'time_budget') {
      reasonText = "Time's up!";
    } else if (reason === 'clicks_budget') {
      reasonText = 'Out of clicks!';
    } else if (reason === 'no_retries') {
      reasonText = 'Out of retries!';
    } else if (reason === 'time') {
      reasonText = 'Level time expired';
    }

    this.elements.gameoverReason.textContent = reasonText;
    this.elements.gameoverLevels.textContent = levelsCompleted;

    this.elements.gameoverScreen.classList.add('active');
  },

  hideGameOver() {
    this.elements.gameoverScreen.classList.remove('active');
  },

  // ========================================
  // Return to Menu
  // ========================================
  returnToMenu() {
    if (this.onReturnToMenu) {
      this.onReturnToMenu();
    }
    this.showStartScreen();
  },
};

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SwitchComUI;
}
