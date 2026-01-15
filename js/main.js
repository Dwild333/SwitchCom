/**
 * SwitchCom — Main Game Controller
 * Initializes game, manages game loop, handles state transitions
 */

(function() {
  'use strict';

  const GameController = {
    animationFrameId: null,
    isRunning: false,
    sessionCoins: 0,
    sessionXP: 0,
    levelStartTime: 0,
    freezeTimeActive: false,
    freezeTimeEnd: 0,

    // ========================================
    // Initialization
    // ========================================
    init() {
      // Initialize all systems
      SwitchCom.loadProgress();
      SwitchComEconomy.init();
      SwitchComConfetti.init();

      if (SwitchCom.state.settings.sound === undefined) {
        SwitchCom.state.settings.sound = true;
      }

      SwitchComUI.init();
      SwitchComAudio.setEnabled(SwitchCom.state.settings.sound);

      // Initialize gamification UI
      this.initGamificationUI();

      // Check for daily login reward
      this.checkDailyReward();

      // Bind start button
      SwitchComUI.elements.startBtn.addEventListener('click', () => {
        SwitchComAudio.init();
        this.startNewGame(SwitchComUI.selectedMode, SwitchComUI.selectedDifficulty, false);
      });

      SwitchComUI.elements.dailyBtn.addEventListener('click', () => {
        SwitchComAudio.init();
        this.startNewGame('timeAttack', 'medium', true);
      });

      // Bind game over play again button
      SwitchComUI.elements.playAgainBtn.addEventListener('click', () => {
        SwitchComUI.hideGameOver();
        this.startNewGame(SwitchComUI.selectedMode, SwitchComUI.selectedDifficulty, false);
      });

      // Set up return to menu callback
      SwitchComUI.onReturnToMenu = () => {
        this.stopGameLoop();
        SwitchCom.state.isPlaying = false;
        this.hidePowerupsBar();
        this.hideGameplayUI();
        this.updateHomeUI();
      };

      // Update home screen UI
      this.updateHomeUI();
      SwitchComUI.showStartScreen();

      // Keyboard support
      document.addEventListener('keydown', (e) => {
        if (e.code === 'Escape') {
          if (SwitchComUI.elements.settingsModal.classList.contains('active')) {
            SwitchComUI.closeSettings();
          } else if (SwitchComUI.elements.pauseModal.classList.contains('active')) {
            SwitchComUI.hidePauseModal();
          } else if (SwitchCom.state.isPlaying) {
            SwitchComUI.showPauseModal();
          }
        }
        if (e.code === 'Space' && SwitchComUI.elements.pauseModal.classList.contains('active')) {
          e.preventDefault();
          SwitchComUI.hidePauseModal();
        }
      });

      // Listen for economy events
      this.bindEconomyEvents();

      console.log('SwitchCom initialized. Highest level:', SwitchCom.state.highestLevel);
    },

    // ========================================
    // Gamification UI Initialization
    // ========================================
    initGamificationUI() {
      // Mode cards (new style)
      const modeCards = document.querySelectorAll('.mode-card');
      modeCards.forEach(card => {
        card.addEventListener('click', () => {
          modeCards.forEach(c => c.classList.remove('selected'));
          card.classList.add('selected');
          SwitchComUI.selectedMode = card.dataset.mode;
        });
      });

      // Difficulty pills (new style)
      const diffPills = document.querySelectorAll('.difficulty-pill');
      diffPills.forEach(pill => {
        pill.addEventListener('click', () => {
          diffPills.forEach(p => p.classList.remove('selected'));
          pill.classList.add('selected');
          SwitchComUI.selectedDifficulty = pill.dataset.difficulty;
        });
      });

      // Bottom nav tabs
      const navTabs = document.querySelectorAll('.nav-tab');
      navTabs.forEach(tab => {
        tab.addEventListener('click', () => {
          const tabName = tab.dataset.tab;
          if (tabName === 'daily') {
            this.showDailyRewardModal();
          } else if (tabName === 'leaderboard') {
            this.showLeaderboardModal();
          } else if (tabName === 'stats') {
            this.showStatsModal();
          }
        });
      });

      // Achievements button (now Profile)
      document.getElementById('achievements-btn')?.addEventListener('click', () => {
        this.showAchievementsModal();
      });

      // Settings button on home screen
      document.getElementById('settings-btn-home')?.addEventListener('click', () => {
        SwitchComUI.openSettings();
      });

      // Settings button during gameplay
      document.getElementById('settings-btn-gameplay')?.addEventListener('click', () => {
        SwitchComUI.openSettings();
      });

      // Pause button during gameplay
      document.getElementById('pause-btn-header')?.addEventListener('click', () => {
        SwitchComUI.showPauseModal();
      });

      // Modal close buttons
      document.getElementById('close-achievements')?.addEventListener('click', () => {
        document.getElementById('achievements-modal').classList.remove('active');
      });
      document.getElementById('close-shop')?.addEventListener('click', () => {
        document.getElementById('shop-modal').classList.remove('active');
      });
      document.getElementById('close-stats')?.addEventListener('click', () => {
        document.getElementById('stats-modal').classList.remove('active');
      });
      document.getElementById('close-leaderboard')?.addEventListener('click', () => {
        document.getElementById('leaderboard-modal').classList.remove('active');
      });

      // Daily reward claim
      document.getElementById('claim-daily-btn')?.addEventListener('click', () => {
        this.claimDailyReward();
      });

      // Power-up buttons
      this.initPowerupButtons();
    },

    // ========================================
    // Power-ups
    // ========================================
    initPowerupButtons() {
      const powerupBtns = document.querySelectorAll('.powerup-btn');
      powerupBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          const powerupId = btn.dataset.powerup;
          this.usePowerup(powerupId);
        });
      });
    },

    usePowerup(powerupId) {
      if (!SwitchCom.state.isPlaying) return;

      const canAfford = SwitchComEconomy.canAffordPowerUp(powerupId);
      const hasInventory = SwitchComEconomy.state.powerUpInventory[powerupId] > 0;

      if (!canAfford && !hasInventory) {
        // Show not enough coins feedback
        return;
      }

      let success = false;
      if (hasInventory) {
        success = SwitchComEconomy.usePowerUp(powerupId);
      } else {
        const result = SwitchComEconomy.purchasePowerUp(powerupId);
        if (result.success) {
          success = SwitchComEconomy.usePowerUp(powerupId);
        }
      }

      if (success) {
        this.applyPowerup(powerupId);
        this.updatePowerupButtons();
      }
    },

    applyPowerup(powerupId) {
      // Haptic feedback first
      SwitchCom.triggerHaptic('medium');
      
      // Play sound
      if (SwitchCom.state.settings.sound) {
        SwitchComAudio.playSuccess();
      }

      switch (powerupId) {
        case 'revealOne':
          this.revealOneSwitch();
          break;
        case 'extraLife':
          SwitchCom.state.retriesRemaining++;
          SwitchComUI.updateLives(SwitchCom.state.retriesRemaining);
          // Visual feedback
          this.showPowerupFeedback('+1 Life');
          break;
        case 'skipLevel':
          // Skip gives no points/coins
          this.skipCurrentLevel();
          break;
      }
    },

    showPowerupFeedback(message) {
      // Create floating feedback
      const container = document.getElementById('floating-points-container');
      if (!container) return;
      
      const el = document.createElement('div');
      el.className = 'floating-powerup-feedback';
      el.textContent = message;
      el.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-size: 1.2rem;
        font-weight: 600;
        color: var(--text);
        animation: floatUp 1s ease-out forwards;
      `;
      container.appendChild(el);
      setTimeout(() => el.remove(), 1000);
    },

    revealOneSwitch() {
      const solution = SwitchCom.state.solution;
      const pattern = SwitchCom.state.playerPattern;
      
      // Find first incorrect switch
      for (let i = 0; i < solution.length; i++) {
        if (pattern[i] !== solution[i]) {
          // Reveal this switch
          SwitchCom.state.playerPattern[i] = solution[i];
          SwitchComUI.updateSwitch(i, solution[i] === 1);
          
          // Visual feedback
          const wrappers = document.querySelectorAll('.toggle-wrapper');
          if (wrappers[i]) {
            wrappers[i].classList.add('hot-glow');
            setTimeout(() => wrappers[i].classList.remove('hot-glow'), 600);
          }
          break;
        }
      }
    },

    activateFreezeTime() {
      this.freezeTimeActive = true;
      this.freezeTimeEnd = performance.now() + 10000; // 10 seconds
      
      // Visual indicator
      document.getElementById('powerup-freeze')?.classList.add('active');
      
      setTimeout(() => {
        this.freezeTimeActive = false;
        document.getElementById('powerup-freeze')?.classList.remove('active');
      }, 10000);
    },

    skipCurrentLevel() {
      // Skip level - advance without rewards
      this.stopGameLoop();
      
      // Increment level without giving rewards
      SwitchCom.state.currentLevel++;
      SwitchCom.state.levelsCompleted++;
      
      // Show brief feedback
      this.showPowerupFeedback('Level Skipped');
      
      // Check if game should end
      const modeConfig = SwitchCom.config.modes[SwitchCom.state.gameMode];
      if (SwitchCom.state.timeBudget <= 0 || SwitchCom.state.clickBudget <= 0) {
        setTimeout(() => this.endGame('budget'), 500);
        return;
      }
      
      // Setup next level after brief delay
      setTimeout(() => {
        const config = SwitchCom.generateLevelConfig(SwitchCom.state.currentLevel);
        this.setupLevel(config);
        this.levelStartTime = performance.now();
        this.updateRunStatsDisplay();
        this.startGameLoop();
      }, 600);
    },

    updatePowerupButtons() {
      const coins = SwitchComEconomy.getCoins();
      const inventory = SwitchComEconomy.getPowerUpInventory();
      const config = SwitchComEconomy.config.powerUps;

      Object.keys(config).forEach(id => {
        const btn = document.querySelector(`[data-powerup="${id}"]`);
        if (btn) {
          const hasInventory = inventory[id] > 0;
          const canAfford = coins >= config[id].cost;
          
          btn.disabled = !hasInventory && !canAfford;
          btn.classList.toggle('has-inventory', hasInventory);
          
          const costEl = btn.querySelector('.powerup-cost');
          if (costEl) {
            costEl.textContent = hasInventory ? `×${inventory[id]}` : config[id].cost;
          }
        }
      });
    },

    showPowerupsBar() {
      document.getElementById('powerups-bar')?.classList.add('visible');
      this.updatePowerupButtons();
    },

    hidePowerupsBar() {
      document.getElementById('powerups-bar')?.classList.remove('visible');
    },

    showGameplayUI() {
      document.getElementById('gameplay-header')?.classList.add('visible');
      document.getElementById('gameplay-stats-card')?.classList.add('visible');
    },

    hideGameplayUI() {
      document.getElementById('gameplay-header')?.classList.remove('visible');
      document.getElementById('gameplay-stats-card')?.classList.remove('visible');
    },

    // ========================================
    // Economy Events
    // ========================================
    bindEconomyEvents() {
      window.addEventListener('coinsChanged', (e) => {
        this.updateCoinsDisplay();
      });

      window.addEventListener('xpChanged', (e) => {
        this.updateXPDisplay();
      });

      window.addEventListener('playerLevelUp', (e) => {
        this.showPlayerLevelUp(e.detail);
      });

      window.addEventListener('achievementsUnlocked', (e) => {
        e.detail.achievements.forEach((achievement, index) => {
          setTimeout(() => {
            this.showAchievementToast(achievement);
          }, index * 2000);
        });
      });
    },

    // ========================================
    // UI Updates
    // ========================================
    updateHomeUI() {
      const state = SwitchComEconomy.getState();
      
      // Update coins
      const homeCoins = document.getElementById('home-coins');
      if (homeCoins) homeCoins.textContent = state.coins.toLocaleString();

      // Update player level
      const playerLevel = document.getElementById('player-level');
      if (playerLevel) playerLevel.textContent = state.playerLevel;

      // Update XP bar
      const xpFill = document.getElementById('xp-bar-fill');
      if (xpFill) xpFill.style.width = `${state.xpProgress * 100}%`;

      // Update XP text
      const xpText = document.getElementById('xp-text');
      if (xpText) xpText.textContent = `${state.xp} / ${state.xpForNextLevel} XP`;

      // Update daily challenge button
      this.updateDailyButton();
    },

    updateCoinsDisplay() {
      const coins = SwitchComEconomy.getCoins();
      
      const homeCoins = document.getElementById('home-coins');
      if (homeCoins) homeCoins.textContent = coins.toLocaleString();

      const shopCoins = document.getElementById('shop-coin-amount');
      if (shopCoins) shopCoins.textContent = coins.toLocaleString();

      // Update gameplay coins display
      const gameplayCoins = document.getElementById('gameplay-coins');
      if (gameplayCoins) gameplayCoins.textContent = coins.toLocaleString();

      this.updatePowerupButtons();
    },

    updateXPDisplay() {
      const state = SwitchComEconomy.getState();
      
      const playerLevel = document.getElementById('player-level');
      if (playerLevel) playerLevel.textContent = state.playerLevel;

      const xpFill = document.getElementById('xp-bar-fill');
      if (xpFill) xpFill.style.width = `${state.xpProgress * 100}%`;

      const xpText = document.getElementById('xp-text');
      if (xpText) xpText.textContent = `${state.xp} / ${state.xpForNextLevel} XP`;
    },

    updateDailyButton() {
      const dailyBtn = document.getElementById('daily-btn');
      const dailyBadge = document.getElementById('daily-badge');
      
      if (!dailyBtn) return;

      const isAvailable = SwitchCom.isDailyChallengeAvailable();
      const isCompleted = SwitchCom.hasDailyChallengeBeenCompleted();

      dailyBtn.style.display = isAvailable ? 'flex' : 'none';
      
      if (isCompleted) {
        dailyBtn.classList.add('completed');
        if (dailyBadge) dailyBadge.textContent = 'DONE';
      } else {
        dailyBtn.classList.remove('completed');
        if (dailyBadge) dailyBadge.textContent = 'NEW';
      }
    },

    // ========================================
    // Daily Reward
    // ========================================
    checkDailyReward() {
      const loginResult = SwitchComEconomy.checkDailyLogin();
      
      if (loginResult.isNewDay && loginResult.canClaimReward) {
        setTimeout(() => {
          this.showDailyRewardModal();
        }, 500);
      }
    },

    showDailyRewardModal() {
      const modal = document.getElementById('daily-reward-modal');
      const info = SwitchComEconomy.getDailyRewardInfo();
      
      // Update streak count
      const streakCount = document.getElementById('daily-streak-count');
      if (streakCount) streakCount.textContent = info.streak;

      // Update reward amount
      const rewardCoins = document.getElementById('daily-reward-coins');
      if (rewardCoins) rewardCoins.textContent = `+${info.todayReward}`;

      // Render calendar
      this.renderDailyCalendar(info);

      // Update claim button
      const claimBtn = document.getElementById('claim-daily-btn');
      if (claimBtn) {
        claimBtn.disabled = info.claimed;
        claimBtn.textContent = info.claimed ? 'Claimed!' : 'Claim Reward';
      }

      modal?.classList.add('active');
    },

    renderDailyCalendar(info) {
      const calendar = document.getElementById('daily-calendar');
      if (!calendar) return;

      calendar.innerHTML = '';
      
      for (let i = 0; i < 7; i++) {
        const day = document.createElement('div');
        day.className = 'calendar-day';
        
        const dayNum = i + 1;
        const reward = info.rewards[i] || 50;
        
        if (dayNum < info.streak) {
          day.classList.add('claimed');
          day.innerHTML = '✓';
        } else if (dayNum === info.streak) {
          day.classList.add('today');
          day.innerHTML = `${reward}`;
        } else {
          day.classList.add('future');
          day.innerHTML = `${reward}`;
        }
        
        calendar.appendChild(day);
      }
    },

    claimDailyReward() {
      const result = SwitchComEconomy.claimDailyReward();
      
      if (result.success) {
        SwitchComConfetti.celebrate('achievement');
        
        // Update button
        const claimBtn = document.getElementById('claim-daily-btn');
        if (claimBtn) {
          claimBtn.disabled = true;
          claimBtn.textContent = 'Claimed!';
        }

        // Close modal after delay
        setTimeout(() => {
          document.getElementById('daily-reward-modal')?.classList.remove('active');
          this.updateHomeUI();
        }, 1500);
      }
    },

    // ========================================
    // Modals
    // ========================================
    showAchievementsModal() {
      const modal = document.getElementById('achievements-modal');
      const list = document.getElementById('achievements-list');
      const achievements = SwitchComEconomy.getAchievements();
      
      // Update counts
      const unlocked = achievements.filter(a => a.unlocked).length;
      document.getElementById('achievements-unlocked').textContent = unlocked;
      document.getElementById('achievements-total').textContent = achievements.length;

      // Render list
      list.innerHTML = achievements.map(a => `
        <div class="achievement-item ${a.unlocked ? 'unlocked' : 'locked'}">
          <div class="achievement-icon">${a.icon}</div>
          <div class="achievement-info">
            <div class="achievement-name">${a.name}</div>
            <div class="achievement-desc">${a.description}</div>
          </div>
          <div class="achievement-reward">
            <span>🪙</span>
            <span>${a.reward}</span>
          </div>
        </div>
      `).join('');

      modal?.classList.add('active');
    },

    showShopModal() {
      const modal = document.getElementById('shop-modal');
      const items = document.getElementById('shop-items');
      const config = SwitchComEconomy.config.powerUps;
      const coins = SwitchComEconomy.getCoins();

      document.getElementById('shop-coin-amount').textContent = coins.toLocaleString();

      items.innerHTML = Object.entries(config).map(([id, powerup]) => `
        <div class="shop-item">
          <div class="shop-item-icon">${powerup.icon}</div>
          <div class="shop-item-info">
            <div class="shop-item-name">${powerup.name}</div>
            <div class="shop-item-desc">${powerup.description}</div>
          </div>
          <button class="shop-item-buy" data-id="${id}" ${coins < powerup.cost ? 'disabled' : ''}>
            <span>🪙</span>
            <span>${powerup.cost}</span>
          </button>
        </div>
      `).join('');

      // Bind buy buttons
      items.querySelectorAll('.shop-item-buy').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.dataset.id;
          const result = SwitchComEconomy.purchasePowerUp(id);
          if (result.success) {
            this.showShopModal(); // Refresh
            SwitchComConfetti.starBurst(btn.getBoundingClientRect().x, btn.getBoundingClientRect().y);
          }
        });
      });

      modal?.classList.add('active');
    },

    showStatsModal() {
      const modal = document.getElementById('stats-modal');
      const grid = document.getElementById('stats-grid');
      const runsGrid = document.getElementById('best-runs-grid');
      
      const ecoState = SwitchComEconomy.getState();
      const gameState = SwitchCom.state;

      // Stats grid
      grid.innerHTML = `
        <div class="stat-card">
          <div class="stat-card-value">${ecoState.stats.totalGamesPlayed}</div>
          <div class="stat-card-label">Games Played</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-value">${ecoState.stats.totalLevelsCompleted}</div>
          <div class="stat-card-label">Levels Beat</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-value">${ecoState.stats.highestLevelReached}</div>
          <div class="stat-card-label">Highest Level</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-value">${ecoState.bestStreak}</div>
          <div class="stat-card-label">Best Streak</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-value">${ecoState.stats.perfectLevels}</div>
          <div class="stat-card-label">Perfect Levels</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-value">${ecoState.achievements}/${SwitchComEconomy.achievements.length}</div>
          <div class="stat-card-label">Achievements</div>
        </div>
      `;

      // Best runs
      const bestRuns = gameState.bestRuns;
      runsGrid.innerHTML = `
        <div class="best-run-item">
          <div class="best-run-mode-name">⏱ Time Attack</div>
          <div class="best-run-scores-display">
            <span>E: ${bestRuns.timeAttack?.easy || 0}</span>
            <span>M: ${bestRuns.timeAttack?.medium || 0}</span>
            <span>H: ${bestRuns.timeAttack?.hard || 0}</span>
          </div>
        </div>
        <div class="best-run-item">
          <div class="best-run-mode-name">☝ Click Challenge</div>
          <div class="best-run-scores-display">
            <span>E: ${bestRuns.clickChallenge?.easy || 0}</span>
            <span>M: ${bestRuns.clickChallenge?.medium || 0}</span>
            <span>H: ${bestRuns.clickChallenge?.hard || 0}</span>
          </div>
        </div>
        <div class="best-run-item">
          <div class="best-run-mode-name">♡ Lives</div>
          <div class="best-run-scores-display">
            <span>E: ${bestRuns.lives?.easy || 0}</span>
            <span>M: ${bestRuns.lives?.medium || 0}</span>
            <span>H: ${bestRuns.lives?.hard || 0}</span>
          </div>
        </div>
        <div class="best-run-item">
          <div class="best-run-mode-name">∞ Endless</div>
          <div class="best-run-scores-display">
            <span>E: ${bestRuns.endless?.easy || 0}</span>
            <span>M: ${bestRuns.endless?.medium || 0}</span>
            <span>H: ${bestRuns.endless?.hard || 0}</span>
          </div>
        </div>
      `;

      modal?.classList.add('active');
    },

    showLeaderboardModal() {
      const modal = document.getElementById('leaderboard-modal');
      // Leaderboard will be populated when Supabase is connected
      modal?.classList.add('active');
    },

    // ========================================
    // Achievement Toast
    // ========================================
    showAchievementToast(achievement) {
      const toast = document.getElementById('achievement-toast');
      const icon = document.getElementById('achievement-toast-icon');
      const name = document.getElementById('achievement-toast-name');

      if (icon) icon.textContent = achievement.icon;
      if (name) name.textContent = achievement.name;

      toast?.classList.add('visible');
      SwitchComConfetti.achievement();

      setTimeout(() => {
        toast?.classList.remove('visible');
      }, 3000);
    },

    // ========================================
    // Player Level Up
    // ========================================
    showPlayerLevelUp(detail) {
      SwitchComConfetti.levelUp();
      // Could show a modal here for player level up
    },

    // ========================================
    // Game Start
    // ========================================
    startNewGame(mode = 'timeAttack', difficulty = 'medium', isDaily = false) {
      SwitchComUI.hideStartScreen();

      // Reset session tracking
      this.sessionCoins = 0;
      this.sessionXP = 0;

      // Track game start in economy
      SwitchComEconomy.onGameStart();

      // Update coins display at start
      this.updateCoinsDisplay();

      // Initialize game state with selected mode and difficulty
      SwitchCom.startGame(mode, difficulty, isDaily);

      // Get level config
      const config = SwitchCom.generateLevelConfig(
        SwitchCom.state.currentLevel,
        isDaily
      );

      // Setup UI
      this.setupLevel(config);
      this.levelStartTime = performance.now();

      // Show gameplay UI (header + stats card)
      this.showGameplayUI();

      // Show run stats bar with mode-specific stats
      SwitchComUI.showRunStats(mode);

      // Show power-ups bar
      this.showPowerupsBar();

      // Initialize lives display
      SwitchComUI.resetLives();

      this.updateRunStatsDisplay();

      // Start game loop
      this.startGameLoop();
    },

    // ========================================
    // Level Setup
    // ========================================
    setupLevel(config) {
      SwitchComUI.updateLevel(config.levelNumber);
      SwitchComUI.updateTimer(config.baseTime);
      SwitchComUI.updateClicks(config.maxGuesses - SwitchCom.state.guessCount);
      SwitchComUI.resetHintDisplay();

      SwitchComUI.renderSwitchRow(
        config.switchCount,
        SwitchCom.state.playerPattern,
        (index) => this.handleToggle(index),
        config.levelNumber
      );
    },

    // ========================================
    // Update Run Stats Display
    // ========================================
    updateRunStatsDisplay() {
      SwitchComUI.updateRunStats(
        SwitchCom.state.timeBudget,
        SwitchCom.state.clickBudget,
        SwitchCom.state.retriesRemaining,
        SwitchCom.state.levelsCompleted
      );
    },

    // ========================================
    // Toggle Handler
    // ========================================
    handleToggle(index) {
      const result = SwitchCom.handleToggle(index);

      if (!result) return;

      SwitchCom.triggerHaptic('light');

      // Update clicks remaining (per level)
      const remaining = SwitchCom.state.maxGuesses - SwitchCom.state.guessCount;
      SwitchComUI.updateClicks(remaining);

      // Update run stats display
      this.updateRunStatsDisplay();

      // Handle result
      console.log('handleToggle result:', result.type);
      switch (result.type) {
        case 'success':
          console.log('Calling handleSuccess');
          this.handleSuccess();
          break;

        case 'gameOver':
          this.handleGameOver(result.reason);
          break;

        case 'failure':
          this.handleFailure(result.reason);
          break;

        case 'continue':
          SwitchComUI.showHint(
            result.result.proximity,
            result.nearWin,
            result.result.matches,
            result.result.total,
            result.direction,
            result.toggledIndex
          );
          break;
      }
    },

    // ========================================
    // Success Handler
    // ========================================
    handleSuccess() {
      console.log('handleSuccess called');
      this.stopGameLoop();

      // Calculate time spent on level
      const timeSpent = (performance.now() - this.levelStartTime) / 1000;
      
      // Check if perfect (no wrong guesses - simplified check)
      const isPerfect = SwitchCom.state.retriesRemaining === SwitchCom.state.retriesPerLevel;

      // Process rewards through economy system
      const rewards = SwitchComEconomy.onLevelComplete(
        SwitchCom.state.currentLevel,
        isPerfect,
        timeSpent
      );

      // Track session totals
      this.sessionCoins += rewards.coinsEarned;
      this.sessionXP += rewards.xpEarned;

      // Calculate points for UI display
      const points = this.calculateLevelPoints();
      SwitchComUI.addPoints(points);

      // Animate level progression
      SwitchComUI.animateLevelProgress();

      // Show level complete celebration
      this.showLevelComplete(rewards);

      // Check for daily challenge completion
      if (SwitchCom.state.isDaily) {
        SwitchCom.completeDailyChallenge();

        setTimeout(() => {
          this.hideLevelComplete();
          SwitchComUI.showStartScreen();
          this.hidePowerupsBar();
          this.updateHomeUI();
        }, 2500);
        return;
      }

      const nextLevel = SwitchCom.state.currentLevel + 1;
      const self = this;

      setTimeout(() => {
        self.hideLevelComplete();
        
        const { cosmeticReward } = SwitchCom.advanceLevel();

        if (cosmeticReward) {
          SwitchComUI.showCosmeticUnlock(cosmeticReward);
        }

        // Reset lives for new level
        SwitchComUI.resetLives();

        // Update run stats
        self.updateRunStatsDisplay();
        self.updatePowerupButtons();

        const config = SwitchCom.generateLevelConfig(SwitchCom.state.currentLevel);

        SwitchComUI.transitionToLevel(config, (index) => self.handleToggle(index));

        // Reset level start time
        self.levelStartTime = performance.now();

        setTimeout(() => {
          SwitchCom.state.lastTick = performance.now();
          self.startGameLoop();
        }, 350);
      }, 2200);
    },

    // ========================================
    // Level Complete Celebration
    // ========================================
    showLevelComplete(rewards) {
      const overlay = document.getElementById('level-complete-overlay');
      
      // Update level number
      document.getElementById('complete-level-num').textContent = SwitchCom.state.currentLevel;
      
      // Update rewards
      document.getElementById('level-coins-earned').textContent = `+${rewards.coinsEarned}`;
      document.getElementById('level-xp-earned').textContent = `+${rewards.xpEarned} XP`;

      // Show streak if > 1
      const streakIndicator = document.getElementById('streak-indicator');
      if (rewards.streak > 1) {
        document.getElementById('streak-text').textContent = `${rewards.streak} Streak!`;
        streakIndicator?.classList.add('visible');
      } else {
        streakIndicator?.classList.remove('visible');
      }

      // Show perfect indicator
      const perfectIndicator = document.getElementById('perfect-indicator');
      if (rewards.isPerfect) {
        perfectIndicator?.classList.add('visible');
      } else {
        perfectIndicator?.classList.remove('visible');
      }

      // Show overlay
      overlay?.classList.add('active');

      // Trigger confetti
      if (rewards.isMilestone) {
        SwitchComConfetti.milestone();
      } else if (rewards.isPerfect) {
        SwitchComConfetti.celebrate('perfect');
      } else if (rewards.streak >= 3) {
        SwitchComConfetti.celebrate('streak');
      } else {
        SwitchComConfetti.burst({ count: 80 });
      }

      // Play sound
      if (SwitchCom.state.settings.sound) {
        SwitchComAudio.playSuccess();
      }
    },

    hideLevelComplete() {
      document.getElementById('level-complete-overlay')?.classList.remove('active');
      document.getElementById('streak-indicator')?.classList.remove('visible');
      document.getElementById('perfect-indicator')?.classList.remove('visible');
    },

    // ========================================
    // Points Calculation
    // ========================================
    calculateLevelPoints() {
      const state = SwitchCom.state;

      // Base points for level completion
      let points = 100 * state.currentLevel;

      // Bonus for remaining time (up to 50% bonus)
      const timeBonus = Math.floor((state.timeRemaining / state.baseTime) * 50);
      points += timeBonus;

      // Bonus for efficient clicks (fewer clicks = more points)
      const clickEfficiency = Math.max(0, state.maxGuesses - state.guessCount);
      points += clickEfficiency * 10;

      // Bonus for lives not used (big bonus for not losing any lives)
      points += state.retriesRemaining * 25;

      return points;
    },

    // ========================================
    // Failure Handler (level failure - uses retry)
    // ========================================
    handleFailure(reason) {
      this.stopGameLoop();

      // Play special sound for zero correct
      if (reason === 'zero_correct' && SwitchCom.state.settings.sound) {
        SwitchComAudio.playZeroCorrect();
      }

      // Get the life index that will be lost (before useRetry decrements it)
      const lifeToLose = SwitchCom.state.retriesPerLevel - SwitchCom.state.retriesRemaining;

      // Check if we have retries left
      const self = this;
      if (SwitchCom.useRetry()) {
        // Animate life loss
        SwitchComUI.loseLife(lifeToLose);

        // Show failure animation then restart level
        SwitchComUI.showFailure(() => {
          SwitchCom.restartLevel();

          // Update retries display
          self.updateRunStatsDisplay();

          const config = SwitchCom.generateLevelConfig(
            SwitchCom.state.currentLevel,
            SwitchCom.state.isDaily
          );

          SwitchComUI.transitionToLevel(config, (index) => self.handleToggle(index));

          setTimeout(() => {
            SwitchCom.state.lastTick = performance.now();
            self.startGameLoop();
          }, 350);
        });
      } else {
        // No retries left - game over
        this.handleGameOver('no_retries');
      }
    },

    // ========================================
    // Game Over Handler
    // ========================================
    handleGameOver(reason) {
      this.stopGameLoop();
      this.hidePowerupsBar();

      // Mark streak as broken
      SwitchComEconomy.onLevelFailed();

      if (SwitchCom.state.settings.sound) {
        SwitchComAudio.playFail();
      }

      const result = SwitchCom.endGame(reason);

      // Update game over screen with session rewards
      document.getElementById('gameover-coins').textContent = `+${this.sessionCoins}`;
      document.getElementById('gameover-xp').textContent = `+${this.sessionXP} XP`;
      document.getElementById('gameover-streak').textContent = SwitchComEconomy.state.bestStreak;
      document.getElementById('gameover-score').textContent = SwitchComUI.currentScore;

      SwitchComUI.hideRunStats();
      SwitchComUI.showGameOver(reason, result.levelsCompleted);
    },

    // ========================================
    // Game Loop
    // ========================================
    startGameLoop() {
      if (this.isRunning) return;

      this.isRunning = true;
      SwitchCom.state.lastTick = performance.now();

      const loop = (timestamp) => {
        if (!this.isRunning) return;

        // Handle freeze time power-up
        if (this.freezeTimeActive && timestamp < this.freezeTimeEnd) {
          // Don't tick the timer while frozen
          SwitchCom.state.lastTick = timestamp;
          this.animationFrameId = requestAnimationFrame(loop);
          return;
        } else if (this.freezeTimeActive && timestamp >= this.freezeTimeEnd) {
          this.freezeTimeActive = false;
        }

        const timerResult = SwitchCom.tick(timestamp);

        SwitchComUI.updateTimer(timerResult.timeRemaining);

        // Update run stats (time budget counts down)
        this.updateRunStatsDisplay();

        // Check for budget expiration (game over)
        if (timerResult.budgetExpired) {
          this.handleGameOver('time_budget');
          return;
        }

        // Check for level time expiration (uses a retry)
        if (timerResult.expired) {
          this.handleFailure('time');
          return;
        }

        this.animationFrameId = requestAnimationFrame(loop);
      };

      this.animationFrameId = requestAnimationFrame(loop);
    },

    stopGameLoop() {
      this.isRunning = false;
      if (this.animationFrameId) {
        cancelAnimationFrame(this.animationFrameId);
        this.animationFrameId = null;
      }
    },
  };

  // Initialize on DOM Ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => GameController.init());
  } else {
    GameController.init();
  }

  // Debug helpers
  window.SwitchComDebug = {
    game: SwitchCom,
    ui: SwitchComUI,
    audio: SwitchComAudio,
    economy: SwitchComEconomy,
    confetti: SwitchComConfetti,
    controller: GameController,

    showSolution: () => console.log('Solution:', SwitchCom.state.solution),
    win: () => {
      SwitchCom.state.playerPattern = [...SwitchCom.state.solution];
      GameController.handleSuccess();
    },
    setLevel: (n) => {
      SwitchCom.state.currentLevel = n;
      SwitchCom.state.highestLevel = Math.max(SwitchCom.state.highestLevel, n);
      SwitchCom.saveProgress();
      location.reload();
    },
    testSound: () => {
      SwitchComAudio.init();
      SwitchComAudio.playSuccess();
    },
    addCoins: (n) => SwitchComEconomy.addCoins(n, 'debug'),
    testConfetti: () => SwitchComConfetti.milestone(),
    resetEconomy: () => {
      SwitchComEconomy.resetState();
      location.reload();
    },
  };
})();
