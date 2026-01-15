/**
 * SwitchCom — Core Game Logic
 * State management, timer, pattern evaluation, difficulty scaling
 */

const SwitchCom = {
  // ========================================
  // Game Configuration
  // ========================================
  config: {
    baseTime: 45,                    // Base time in seconds per level
    timePerLevel: 3,                 // Additional seconds per level
    baseAcceleration: 0.04,          // 4% time decay per guess
    guessMultiplier: 1.5,            // maxGuesses = ceil(switchCount * this)
    minSwitches: 2,                  // Starting switch count
    cosmeticUnlockInterval: 5,       // Unlock cosmetic every N levels
    dailyChallengeUnlockLevel: 10,   // Level to unlock daily challenge

    // Game Modes
    modes: {
      timeAttack: {
        label: 'Time Attack',
        description: '3 minutes to complete as many levels as possible',
        timeBudget: 180,  // 3 minutes
        clickBudget: Infinity,
        hasRetries: true,
        hasLevelTimer: true,
      },
      clickChallenge: {
        label: 'Click Challenge',
        description: 'Limited clicks to complete as many levels as possible',
        timeBudget: Infinity,
        clickBudget: { easy: 80, medium: 60, hard: 40 },
        hasRetries: true,
        hasLevelTimer: false,
      },
      lives: {
        label: 'Lives',
        description: 'Limited lives, no time pressure',
        timeBudget: Infinity,
        clickBudget: Infinity,
        hasRetries: true,
        hasLevelTimer: false,
        livesMode: true,
        startingLives: { easy: 5, medium: 3, hard: 2 },
      },
      endless: {
        label: 'Endless',
        description: 'No limits, but retries are scarce and difficulty ramps up',
        timeBudget: Infinity,
        clickBudget: Infinity,
        hasRetries: true,
        hasLevelTimer: true,
      },
    },

    // Difficulty settings (retries per level)
    difficulties: {
      easy: { retriesPerLevel: 3, label: 'Easy' },
      medium: { retriesPerLevel: 2, label: 'Medium' },
      hard: { retriesPerLevel: 1, label: 'Hard' },
    },
  },

  // ========================================
  // Game State
  // ========================================
  state: {
    currentLevel: 1,
    isPlaying: false,
    isPaused: false,
    isDaily: false,

    // Game mode and difficulty
    gameMode: 'timeAttack',
    difficulty: 'medium',

    // Level state
    solution: [],
    playerPattern: [],
    switchCount: 2,

    // Level timer state (per-level countdown)
    timeRemaining: 90,
    baseTime: 90,
    timeDecayRate: 1,
    lastTick: 0,

    // Level guess state
    guessCount: 0,
    maxGuesses: 4,
    previousMatches: 0,

    // Retry tracking
    retriesRemaining: 2,     // Retries left for current level
    retriesPerLevel: 2,      // Max retries per level (from difficulty)

    // Run tracking
    timeBudget: 180,         // Total time budget (for Time Attack)
    clickBudget: Infinity,   // Total clicks budget (for Click Challenge)
    clicksUsed: 0,           // Clicks used this run
    levelsCompleted: 0,      // Levels completed this run

    // Stats tracking
    totalGamesPlayed: 0,
    highestLevel: 1,

    // Best runs per mode
    bestRuns: {
      timeAttack: { easy: 0, medium: 0, hard: 0 },
      clickChallenge: { easy: 0, medium: 0, hard: 0 },
      lives: { easy: 0, medium: 0, hard: 0 },
      endless: { easy: 0, medium: 0, hard: 0 },
    },

    // Cosmetics
    unlockedCosmetics: [],
    currentTheme: null,

    // Settings
    settings: {
      haptics: true,
      sound: true,
      reduceMotion: false,
      darkMode: false,
    },
  },

  // ========================================
  // Level Configuration Generator
  // ========================================
  generateLevelConfig(levelNumber, isDaily = false) {
    // CAP switch count at 10 to prevent overwhelming gameplay
    // After level 9, difficulty increases through time/guesses, not more switches
    const maxSwitches = 10;
    let switchCount = Math.min(this.config.minSwitches + levelNumber - 1, maxSwitches);

    // Time scales slower, caps out
    let baseTime = this.config.baseTime + (levelNumber * this.config.timePerLevel);
    baseTime = Math.min(baseTime, 75); // Cap at 75 seconds max

    // Guesses scale tighter at higher levels
    let maxGuesses = Math.ceil(switchCount * this.config.guessMultiplier);

    let acceleration = this.config.baseAcceleration;

    // Difficulty scaling kicks in earlier
    if (levelNumber > 5) {
      // Reduce time more aggressively
      baseTime = Math.max(30, baseTime - (levelNumber - 5) * 2);
      acceleration = Math.min(0.08, acceleration + (levelNumber - 5) * 0.005);
    }

    // After level 10, increase difficulty through tighter constraints
    if (levelNumber > 10) {
      // Fewer guesses allowed
      maxGuesses = Math.max(switchCount, maxGuesses - Math.floor((levelNumber - 10) / 2));
      // Less time
      baseTime = Math.max(25, baseTime - (levelNumber - 10) * 1.5);
      // Faster time decay
      acceleration = Math.min(0.12, acceleration + (levelNumber - 10) * 0.008);
    }

    // Tighter guess limits at higher levels
    if (levelNumber > 3) {
      const reduction = Math.floor((levelNumber - 3) / 2);
      maxGuesses = Math.max(switchCount, maxGuesses - reduction);
    }

    // Daily challenge is harder
    if (isDaily) {
      baseTime = Math.floor(baseTime * 0.6);
      maxGuesses = Math.max(switchCount, maxGuesses - 2);
      acceleration *= 1.5;
    }

    // Endless mode: progressively harder after level 10
    if (this.state.gameMode === 'endless' && levelNumber > 10) {
      baseTime = Math.max(20, baseTime - (levelNumber - 10) * 2);
      maxGuesses = Math.max(switchCount, maxGuesses - Math.floor((levelNumber - 10) / 3));
    }

    return {
      levelNumber,
      switchCount,
      baseTime,
      maxGuesses,
      timeAccelerationPerGuess: acceleration,
    };
  },

  // ========================================
  // Pattern Generation
  // ========================================
  generateSolution(n, seed = null) {
    if (seed !== null) {
      const seededRandom = this.seededRandom(seed);
      return Array.from({ length: n }, () => seededRandom() < 0.5 ? 1 : 0);
    }
    return Array.from({ length: n }, () => Math.random() < 0.5 ? 1 : 0);
  },

  seededRandom(seed) {
    let s = seed;
    return function() {
      s = Math.sin(s) * 10000;
      return s - Math.floor(s);
    };
  },

  getDailySeed() {
    const today = new Date();
    return today.getFullYear() * 10000 +
           (today.getMonth() + 1) * 100 +
           today.getDate();
  },

  // ========================================
  // Pattern Evaluation
  // ========================================
  evaluatePattern(playerPattern, solution) {
    if (playerPattern.length !== solution.length) return { match: false, matches: 0 };

    let matches = 0;
    for (let i = 0; i < solution.length; i++) {
      if (playerPattern[i] === solution[i]) matches++;
    }

    return {
      match: matches === solution.length,
      matches,
      total: solution.length,
      proximity: matches / solution.length,
    };
  },

  // ========================================
  // Game Flow
  // ========================================
  initLevel(levelNumber = null, isDaily = false) {
    const level = levelNumber || this.state.currentLevel;
    const config = this.generateLevelConfig(level, isDaily);

    // Generate solution
    const seed = isDaily ? this.getDailySeed() : null;
    const solution = this.generateSolution(config.switchCount, seed);

    // Update state
    this.state.isDaily = isDaily;
    this.state.currentLevel = level;
    this.state.solution = solution;
    this.state.playerPattern = new Array(config.switchCount).fill(0);
    this.state.switchCount = config.switchCount;
    this.state.baseTime = config.baseTime;
    this.state.timeRemaining = config.baseTime;
    this.state.timeDecayRate = 1;
    this.state.guessCount = 0;
    this.state.maxGuesses = config.maxGuesses;
    this.state.previousMatches = 0;
    this.state.isPaused = false;

    // Reset retries for new level
    this.state.retriesRemaining = this.state.retriesPerLevel;

    return config;
  },

  startGame(mode = 'timeAttack', difficulty = 'medium', isDaily = false) {
    this.state.isPlaying = true;
    this.state.lastTick = performance.now();
    this.state.gameMode = mode;
    this.state.difficulty = difficulty;
    this.state.isDaily = isDaily;

    // Get mode and difficulty settings
    const modeConfig = this.config.modes[mode];
    const diffConfig = this.config.difficulties[difficulty];

    // Set retries per level
    this.state.retriesPerLevel = diffConfig.retriesPerLevel;

    // Set budgets based on mode
    if (mode === 'timeAttack') {
      this.state.timeBudget = modeConfig.timeBudget;
      this.state.clickBudget = Infinity;
    } else if (mode === 'clickChallenge') {
      this.state.timeBudget = Infinity;
      this.state.clickBudget = modeConfig.clickBudget[difficulty];
    } else {
      // Endless mode
      this.state.timeBudget = Infinity;
      this.state.clickBudget = Infinity;
    }

    // Reset tracking
    this.state.clicksUsed = 0;
    this.state.levelsCompleted = 0;
    this.state.currentLevel = 1;

    if (isDaily) {
      const dailyLevel = Math.min(this.state.highestLevel, 15);
      this.initLevel(dailyLevel, true);
    } else {
      this.initLevel(this.state.currentLevel);
    }
  },

  // ========================================
  // Toggle Handler
  // ========================================
  handleToggle(index) {
    if (!this.state.isPlaying || this.state.isPaused) return null;

    // Store previous matches for hot/cold feedback
    const prevMatches = this.state.previousMatches;

    // Toggle the switch
    this.state.playerPattern[index] = this.state.playerPattern[index] === 0 ? 1 : 0;

    // Increment guess and track clicks
    this.state.guessCount++;
    this.state.clicksUsed++;

    // Decrease click budget if applicable
    if (this.state.clickBudget !== Infinity) {
      this.state.clickBudget--;
      if (this.state.clickBudget <= 0) {
        return { type: 'gameOver', reason: 'clicks_budget', result: null };
      }
    }

    const config = this.generateLevelConfig(this.state.currentLevel, this.state.isDaily);
    this.state.timeDecayRate *= (1 + config.timeAccelerationPerGuess);

    // Evaluate pattern
    const result = this.evaluatePattern(this.state.playerPattern, this.state.solution);

    // Determine direction (warmer/colder/same)
    let direction = 'same';
    if (result.matches > prevMatches) {
      direction = 'warmer';
    } else if (result.matches < prevMatches) {
      direction = 'colder';
    }

    // Update previous matches for next comparison
    this.state.previousMatches = result.matches;

    // ZERO CORRECT = LOSE A LIFE (not instant game over)
    if (result.matches === 0 && this.state.guessCount > 0) {
      return { type: 'failure', reason: 'zero_correct', result, direction, toggledIndex: index };
    }

    // Check for success
    if (result.match) {
      return { type: 'success', result, direction, toggledIndex: index };
    }

    // Check for guess limit failure (uses a retry)
    if (this.state.guessCount >= this.state.maxGuesses) {
      return { type: 'failure', reason: 'guesses', result, direction, toggledIndex: index };
    }

    // Return hint data
    return {
      type: 'continue',
      result,
      direction,
      toggledIndex: index,
      nearWin: result.matches === this.state.solution.length - 1,
    };
  },

  // ========================================
  // Retry System
  // ========================================
  useRetry() {
    if (this.state.retriesRemaining > 0) {
      this.state.retriesRemaining--;
      return true;
    }
    return false;
  },

  hasRetriesLeft() {
    return this.state.retriesRemaining > 0;
  },

  // ========================================
  // Timer System
  // ========================================
  tick(timestamp) {
    if (!this.state.isPlaying || this.state.isPaused) {
      this.state.lastTick = timestamp;
      return {
        timeRemaining: this.state.timeRemaining,
        timeBudget: this.state.timeBudget,
        expired: false,
        budgetExpired: false
      };
    }

    const deltaTime = (timestamp - this.state.lastTick) / 1000;
    this.state.lastTick = timestamp;

    // Decrease level timer
    this.state.timeRemaining -= deltaTime * this.state.timeDecayRate;

    // Decrease total time budget if applicable (Time Attack mode)
    if (this.state.timeBudget !== Infinity) {
      this.state.timeBudget -= deltaTime;
      if (this.state.timeBudget <= 0) {
        this.state.timeBudget = 0;
        return {
          timeRemaining: this.state.timeRemaining,
          timeBudget: 0,
          expired: false,
          budgetExpired: true
        };
      }
    }

    // Check if level timer expired
    if (this.state.timeRemaining <= 0) {
      this.state.timeRemaining = 0;
      return {
        timeRemaining: 0,
        timeBudget: this.state.timeBudget,
        expired: true,
        budgetExpired: false
      };
    }

    return {
      timeRemaining: this.state.timeRemaining,
      timeBudget: this.state.timeBudget,
      expired: false,
      budgetExpired: false,
      progress: this.state.timeRemaining / this.state.baseTime,
    };
  },

  // ========================================
  // Level Progression
  // ========================================
  advanceLevel() {
    this.state.levelsCompleted++;
    this.state.currentLevel++;

    // Update highest level
    if (this.state.currentLevel > this.state.highestLevel) {
      this.state.highestLevel = this.state.currentLevel;
    }

    // Update best run for this mode/difficulty
    this.updateBestRun();
    this.saveProgress();

    // Check for cosmetic unlock
    const cosmeticReward = this.checkCosmeticUnlock();

    this.initLevel();

    return { cosmeticReward };
  },

  updateBestRun() {
    const mode = this.state.gameMode;
    const diff = this.state.difficulty;
    // Safety check for bestRuns structure
    if (!this.state.bestRuns[mode]) {
      this.state.bestRuns[mode] = { easy: 0, medium: 0, hard: 0 };
    }
    if (this.state.levelsCompleted > this.state.bestRuns[mode][diff]) {
      this.state.bestRuns[mode][diff] = this.state.levelsCompleted;
    }
  },

  restartLevel() {
    this.initLevel(this.state.currentLevel, this.state.isDaily);
  },

  // End game and record stats
  endGame(reason) {
    this.state.isPlaying = false;
    this.state.totalGamesPlayed++;

    // Update best run
    this.updateBestRun();
    this.saveProgress();

    return {
      levelsCompleted: this.state.levelsCompleted,
      reason: reason
    };
  },

  // ========================================
  // Cosmetic System
  // ========================================
  cosmetics: [
    { id: 'theme-midnight', type: 'background', name: 'Midnight', unlockLevel: 5 },
    { id: 'theme-forest', type: 'background', name: 'Forest', unlockLevel: 10 },
    { id: 'theme-rose', type: 'background', name: 'Rose', unlockLevel: 15 },
    { id: 'theme-amber', type: 'background', name: 'Amber', unlockLevel: 20 },
  ],

  checkCosmeticUnlock() {
    const level = this.state.currentLevel;
    const newCosmetic = this.cosmetics.find(c =>
      c.unlockLevel === level &&
      !this.state.unlockedCosmetics.includes(c.id)
    );

    if (newCosmetic) {
      this.state.unlockedCosmetics.push(newCosmetic.id);
      this.saveProgress();
      return newCosmetic;
    }

    return null;
  },

  setTheme(themeId) {
    if (themeId === null || this.state.unlockedCosmetics.includes(themeId)) {
      this.state.currentTheme = themeId;
      this.saveProgress();
      return true;
    }
    return false;
  },

  // ========================================
  // Persistence
  // ========================================
  saveProgress() {
    const saveData = {
      highestLevel: this.state.highestLevel,
      unlockedCosmetics: this.state.unlockedCosmetics,
      currentTheme: this.state.currentTheme,
      settings: this.state.settings,
      totalGamesPlayed: this.state.totalGamesPlayed,
      bestRuns: this.state.bestRuns,
    };

    try {
      localStorage.setItem('switchcom_save', JSON.stringify(saveData));
    } catch (e) {
      console.warn('Could not save progress:', e);
    }
  },

  loadProgress() {
    try {
      const saved = localStorage.getItem('switchcom_save');
      if (saved) {
        const data = JSON.parse(saved);
        this.state.highestLevel = data.highestLevel || 1;
        this.state.currentLevel = 1;
        this.state.unlockedCosmetics = data.unlockedCosmetics || [];
        this.state.currentTheme = data.currentTheme || null;
        this.state.settings = { ...this.state.settings, ...data.settings };
        this.state.totalGamesPlayed = data.totalGamesPlayed || 0;
        // Ensure bestRuns has proper structure with all modes and difficulties
        const defaultBestRuns = {
          timeAttack: { easy: 0, medium: 0, hard: 0 },
          clickChallenge: { easy: 0, medium: 0, hard: 0 },
          endless: { easy: 0, medium: 0, hard: 0 },
        };
        if (data.bestRuns) {
          // Merge saved data with defaults to ensure all keys exist
          this.state.bestRuns = {
            timeAttack: { ...defaultBestRuns.timeAttack, ...data.bestRuns.timeAttack },
            clickChallenge: { ...defaultBestRuns.clickChallenge, ...data.bestRuns.clickChallenge },
            endless: { ...defaultBestRuns.endless, ...data.bestRuns.endless },
          };
        } else {
          this.state.bestRuns = defaultBestRuns;
        }
        return true;
      }
    } catch (e) {
      console.warn('Could not load progress:', e);
    }
    return false;
  },

  // ========================================
  // Daily Challenge
  // ========================================
  isDailyChallengeAvailable() {
    return this.state.highestLevel >= this.config.dailyChallengeUnlockLevel;
  },

  hasDailyChallengeBeenCompleted() {
    const today = this.getDailySeed().toString();
    try {
      return localStorage.getItem('switchcom_daily_' + today) === 'completed';
    } catch (e) {
      return false;
    }
  },

  completeDailyChallenge() {
    const today = this.getDailySeed().toString();
    try {
      localStorage.setItem('switchcom_daily_' + today, 'completed');
    } catch (e) {
      console.warn('Could not save daily completion:', e);
    }
  },

  // ========================================
  // Settings
  // ========================================
  updateSetting(key, value) {
    if (key in this.state.settings) {
      this.state.settings[key] = value;
      this.saveProgress();
      return true;
    }
    return false;
  },

  // ========================================
  // Haptics
  // ========================================
  triggerHaptic(type = 'light') {
    if (!this.state.settings.haptics) return;

    if ('vibrate' in navigator) {
      switch (type) {
        case 'light':
          navigator.vibrate(10);
          break;
        case 'medium':
          navigator.vibrate(25);
          break;
        case 'success':
          navigator.vibrate([20, 50, 30]);
          break;
        case 'failure':
          navigator.vibrate([50, 30, 50]);
          break;
      }
    }
  },
};

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SwitchCom;
}
