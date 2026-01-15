/**
 * SwitchCom — Economy & Gamification System
 * Coins, XP, achievements, daily rewards, streaks, power-ups
 */

const SwitchComEconomy = {
  // ========================================
  // Economy Configuration
  // ========================================
  config: {
    // Coin rewards
    rewards: {
      levelComplete: 100,           // Base coins per level
      levelBonusPerLevel: 10,       // Extra coins per level number
      perfectLevel: 50,             // Bonus for no mistakes
      streakBonus: 25,              // Per streak level
      dailyLogin: 50,               // Daily login reward
      dailyLoginStreak: [50, 75, 100, 150, 200, 250, 500], // 7-day streak rewards
      achievementBase: 100,         // Base achievement reward
      firstTimeBonus: 200,          // First game ever bonus
    },

    // XP rewards
    xp: {
      levelComplete: 50,
      levelBonusPerLevel: 5,
      perfectLevel: 25,
      streakBonus: 10,
      achievementBonus: 50,
    },

    // XP required per player level (cumulative)
    xpLevels: [
      0, 100, 250, 450, 700, 1000, 1400, 1900, 2500, 3200,
      4000, 5000, 6200, 7600, 9200, 11000, 13000, 15500, 18500, 22000,
      26000, 30500, 35500, 41000, 47000, 54000, 62000, 71000, 81000, 92000,
      // Level 30+ continues at 12000 XP per level
    ],

    // Power-up costs (balanced so skip is still cheaper than revealing all 10 switches)
    // Max 10 switches, so 10 reveals = 1500 coins. Skip at 1000 is cheaper but gives no rewards.
    // Level complete gives ~100-200 coins, so using reveals eats into profits significantly.
    powerUps: {
      revealOne: { cost: 150, name: 'Reveal', icon: '💡', description: 'Shows 1 correct switch' },
      extraLife: { cost: 100, name: 'Extra Life', icon: '❤️', description: '+1 retry this level' },
      skipLevel: { cost: 1000, name: 'Skip', icon: '⏭️', description: 'Skip to next level (no points)' },
    },

    // Milestone levels for special celebrations
    milestones: [5, 10, 15, 20, 25, 50, 75, 100],
  },

  // ========================================
  // Player State
  // ========================================
  state: {
    coins: 0,
    totalCoinsEarned: 0,
    xp: 0,
    playerLevel: 1,
    
    // Streaks
    currentStreak: 0,           // Current win streak in session
    bestStreak: 0,              // All-time best streak
    dailyLoginStreak: 0,        // Consecutive days logged in
    lastLoginDate: null,        // Last login date (YYYY-MM-DD)
    
    // Daily rewards
    dailyRewardsClaimed: [],    // Array of claimed dates
    
    // Achievements
    achievements: [],           // Array of unlocked achievement IDs
    
    // Power-up inventory (owned but not used)
    powerUpInventory: {
      revealOne: 0,
      extraLife: 0,
      skipLevel: 0,
    },

    // Stats for achievements
    stats: {
      totalLevelsCompleted: 0,
      totalGamesPlayed: 0,
      perfectLevels: 0,
      totalClicks: 0,
      fastestLevel: Infinity,    // Seconds
      highestLevelReached: 1,
      powerUpsUsed: 0,
      coinsSpent: 0,
    },
  },

  // ========================================
  // Achievements Definition
  // ========================================
  achievements: [
    // Progression achievements
    { id: 'first_win', name: 'First Steps', description: 'Complete your first level', icon: '🎯', reward: 100, condition: (s) => s.totalLevelsCompleted >= 1 },
    { id: 'level_5', name: 'Getting Started', description: 'Reach level 5', icon: '⭐', reward: 150, condition: (s) => s.highestLevelReached >= 5 },
    { id: 'level_10', name: 'Double Digits', description: 'Reach level 10', icon: '🌟', reward: 200, condition: (s) => s.highestLevelReached >= 10 },
    { id: 'level_25', name: 'Quarter Century', description: 'Reach level 25', icon: '💫', reward: 500, condition: (s) => s.highestLevelReached >= 25 },
    { id: 'level_50', name: 'Half Way There', description: 'Reach level 50', icon: '🏆', reward: 1000, condition: (s) => s.highestLevelReached >= 50 },
    { id: 'level_100', name: 'Centurion', description: 'Reach level 100', icon: '👑', reward: 2500, condition: (s) => s.highestLevelReached >= 100 },
    
    // Streak achievements
    { id: 'streak_3', name: 'Hat Trick', description: 'Win 3 levels in a row', icon: '🔥', reward: 100, condition: (s) => s.bestStreak >= 3 },
    { id: 'streak_5', name: 'On Fire', description: 'Win 5 levels in a row', icon: '🔥', reward: 200, condition: (s) => s.bestStreak >= 5 },
    { id: 'streak_10', name: 'Unstoppable', description: 'Win 10 levels in a row', icon: '💥', reward: 500, condition: (s) => s.bestStreak >= 10 },
    
    // Perfect level achievements
    { id: 'perfect_1', name: 'Flawless', description: 'Complete a level without mistakes', icon: '✨', reward: 100, condition: (s) => s.perfectLevels >= 1 },
    { id: 'perfect_5', name: 'Perfectionist', description: 'Complete 5 perfect levels', icon: '💎', reward: 300, condition: (s) => s.perfectLevels >= 5 },
    { id: 'perfect_25', name: 'Master Mind', description: 'Complete 25 perfect levels', icon: '🧠', reward: 1000, condition: (s) => s.perfectLevels >= 25 },
    
    // Volume achievements
    { id: 'games_10', name: 'Regular', description: 'Play 10 games', icon: '🎮', reward: 100, condition: (s) => s.totalGamesPlayed >= 10 },
    { id: 'games_50', name: 'Dedicated', description: 'Play 50 games', icon: '🎯', reward: 300, condition: (s) => s.totalGamesPlayed >= 50 },
    { id: 'games_100', name: 'Addicted', description: 'Play 100 games', icon: '🏅', reward: 500, condition: (s) => s.totalGamesPlayed >= 100 },
    { id: 'levels_100', name: 'Century Club', description: 'Complete 100 total levels', icon: '💯', reward: 500, condition: (s) => s.totalLevelsCompleted >= 100 },
    { id: 'levels_500', name: 'Veteran', description: 'Complete 500 total levels', icon: '🎖️', reward: 1500, condition: (s) => s.totalLevelsCompleted >= 500 },
    
    // Speed achievements
    { id: 'speed_demon', name: 'Speed Demon', description: 'Complete a level in under 5 seconds', icon: '⚡', reward: 200, condition: (s) => s.fastestLevel <= 5 },
    { id: 'lightning', name: 'Lightning Fast', description: 'Complete a level in under 3 seconds', icon: '🌩️', reward: 500, condition: (s) => s.fastestLevel <= 3 },
    
    // Economy achievements
    { id: 'saver_1000', name: 'Penny Pincher', description: 'Save 1,000 coins', icon: '💰', reward: 100, condition: (s, e) => e.coins >= 1000 },
    { id: 'saver_5000', name: 'Money Bags', description: 'Save 5,000 coins', icon: '💎', reward: 300, condition: (s, e) => e.coins >= 5000 },
    { id: 'spender_1000', name: 'Big Spender', description: 'Spend 1,000 coins', icon: '🛒', reward: 200, condition: (s) => s.coinsSpent >= 1000 },
    
    // Daily login achievements
    { id: 'daily_7', name: 'Week Warrior', description: 'Log in 7 days in a row', icon: '📅', reward: 300, condition: (s, e) => e.dailyLoginStreak >= 7 },
    { id: 'daily_30', name: 'Monthly Master', description: 'Log in 30 days in a row', icon: '🗓️', reward: 1000, condition: (s, e) => e.dailyLoginStreak >= 30 },
  ],

  // ========================================
  // Initialization
  // ========================================
  init() {
    this.loadState();
    this.checkDailyLogin();
    return this;
  },

  // ========================================
  // Coin Management
  // ========================================
  addCoins(amount, reason = '') {
    this.state.coins += amount;
    this.state.totalCoinsEarned += amount;
    this.saveState();
    
    // Dispatch event for UI
    window.dispatchEvent(new CustomEvent('coinsChanged', { 
      detail: { coins: this.state.coins, change: amount, reason } 
    }));
    
    return this.state.coins;
  },

  spendCoins(amount) {
    if (this.state.coins >= amount) {
      this.state.coins -= amount;
      this.state.stats.coinsSpent += amount;
      this.saveState();
      
      window.dispatchEvent(new CustomEvent('coinsChanged', { 
        detail: { coins: this.state.coins, change: -amount, reason: 'purchase' } 
      }));
      
      return true;
    }
    return false;
  },

  getCoins() {
    return this.state.coins;
  },

  // ========================================
  // XP & Player Level
  // ========================================
  addXP(amount) {
    const oldLevel = this.state.playerLevel;
    this.state.xp += amount;
    
    // Check for level up
    const newLevel = this.calculatePlayerLevel(this.state.xp);
    if (newLevel > oldLevel) {
      this.state.playerLevel = newLevel;
      
      // Bonus coins for leveling up
      const levelUpBonus = newLevel * 50;
      this.addCoins(levelUpBonus, 'level_up');
      
      window.dispatchEvent(new CustomEvent('playerLevelUp', { 
        detail: { oldLevel, newLevel, bonus: levelUpBonus } 
      }));
    }
    
    this.saveState();
    
    window.dispatchEvent(new CustomEvent('xpChanged', { 
      detail: { xp: this.state.xp, level: this.state.playerLevel, change: amount } 
    }));
    
    return { xp: this.state.xp, level: this.state.playerLevel, leveledUp: newLevel > oldLevel };
  },

  calculatePlayerLevel(xp) {
    const levels = this.config.xpLevels;
    for (let i = levels.length - 1; i >= 0; i--) {
      if (xp >= levels[i]) {
        return i + 1;
      }
    }
    // For levels beyond 30
    const baseXP = levels[levels.length - 1];
    const extraXP = xp - baseXP;
    return levels.length + Math.floor(extraXP / 12000);
  },

  getXPForNextLevel() {
    const currentLevel = this.state.playerLevel;
    const levels = this.config.xpLevels;
    
    if (currentLevel < levels.length) {
      return levels[currentLevel];
    }
    // Beyond level 30
    return levels[levels.length - 1] + (currentLevel - levels.length + 1) * 12000;
  },

  getXPProgress() {
    const currentXP = this.state.xp;
    const currentLevel = this.state.playerLevel;
    const levels = this.config.xpLevels;
    
    let currentLevelXP = currentLevel <= levels.length ? levels[currentLevel - 1] : 
      levels[levels.length - 1] + (currentLevel - levels.length) * 12000;
    let nextLevelXP = this.getXPForNextLevel();
    
    const progress = (currentXP - currentLevelXP) / (nextLevelXP - currentLevelXP);
    return Math.min(1, Math.max(0, progress));
  },

  // ========================================
  // Level Completion Rewards
  // ========================================
  onLevelComplete(levelNumber, isPerfect = false, timeSpent = 0) {
    const rewards = this.config.rewards;
    const xpConfig = this.config.xp;
    
    let coinsEarned = rewards.levelComplete + (levelNumber * rewards.levelBonusPerLevel);
    let xpEarned = xpConfig.levelComplete + (levelNumber * xpConfig.levelBonusPerLevel);
    
    // Perfect level bonus
    if (isPerfect) {
      coinsEarned += rewards.perfectLevel;
      xpEarned += xpConfig.perfectLevel;
      this.state.stats.perfectLevels++;
    }
    
    // Streak bonus
    this.state.currentStreak++;
    if (this.state.currentStreak > this.state.bestStreak) {
      this.state.bestStreak = this.state.currentStreak;
    }
    
    if (this.state.currentStreak > 1) {
      const streakMultiplier = Math.min(this.state.currentStreak, 10);
      coinsEarned += rewards.streakBonus * streakMultiplier;
      xpEarned += xpConfig.streakBonus * streakMultiplier;
    }
    
    // Update stats
    this.state.stats.totalLevelsCompleted++;
    if (levelNumber > this.state.stats.highestLevelReached) {
      this.state.stats.highestLevelReached = levelNumber;
    }
    if (timeSpent > 0 && timeSpent < this.state.stats.fastestLevel) {
      this.state.stats.fastestLevel = timeSpent;
    }
    
    // Add rewards
    this.addCoins(coinsEarned, 'level_complete');
    const xpResult = this.addXP(xpEarned);
    
    // Check for new achievements
    const newAchievements = this.checkAchievements();
    
    // Check if milestone level
    const isMilestone = this.config.milestones.includes(levelNumber);
    
    this.saveState();
    
    return {
      coinsEarned,
      xpEarned,
      streak: this.state.currentStreak,
      isPerfect,
      leveledUp: xpResult.leveledUp,
      newLevel: xpResult.level,
      newAchievements,
      isMilestone,
    };
  },

  onLevelFailed() {
    this.state.currentStreak = 0;
    this.saveState();
  },

  onGameStart() {
    this.state.stats.totalGamesPlayed++;
    this.state.currentStreak = 0;
    this.saveState();
  },

  // ========================================
  // Power-ups
  // ========================================
  purchasePowerUp(powerUpId) {
    const powerUp = this.config.powerUps[powerUpId];
    if (!powerUp) return { success: false, reason: 'invalid' };
    
    if (this.spendCoins(powerUp.cost)) {
      this.state.powerUpInventory[powerUpId]++;
      this.saveState();
      
      window.dispatchEvent(new CustomEvent('powerUpPurchased', { 
        detail: { powerUpId, inventory: this.state.powerUpInventory[powerUpId] } 
      }));
      
      return { success: true, inventory: this.state.powerUpInventory[powerUpId] };
    }
    
    return { success: false, reason: 'insufficient_coins' };
  },

  usePowerUp(powerUpId) {
    if (this.state.powerUpInventory[powerUpId] > 0) {
      this.state.powerUpInventory[powerUpId]--;
      this.state.stats.powerUpsUsed++;
      this.saveState();
      
      window.dispatchEvent(new CustomEvent('powerUpUsed', { 
        detail: { powerUpId, remaining: this.state.powerUpInventory[powerUpId] } 
      }));
      
      return true;
    }
    return false;
  },

  canAffordPowerUp(powerUpId) {
    const powerUp = this.config.powerUps[powerUpId];
    return powerUp && this.state.coins >= powerUp.cost;
  },

  getPowerUpInventory() {
    return { ...this.state.powerUpInventory };
  },

  // ========================================
  // Daily Login & Rewards
  // ========================================
  checkDailyLogin() {
    const today = this.getTodayString();
    const lastLogin = this.state.lastLoginDate;
    
    if (lastLogin === today) {
      // Already logged in today
      return { isNewDay: false, streak: this.state.dailyLoginStreak };
    }
    
    const yesterday = this.getYesterdayString();
    
    if (lastLogin === yesterday) {
      // Consecutive day
      this.state.dailyLoginStreak++;
    } else if (lastLogin !== null) {
      // Streak broken
      this.state.dailyLoginStreak = 1;
    } else {
      // First login ever
      this.state.dailyLoginStreak = 1;
    }
    
    this.state.lastLoginDate = today;
    this.saveState();
    
    return { 
      isNewDay: true, 
      streak: this.state.dailyLoginStreak,
      canClaimReward: !this.state.dailyRewardsClaimed.includes(today)
    };
  },

  claimDailyReward() {
    const today = this.getTodayString();
    
    if (this.state.dailyRewardsClaimed.includes(today)) {
      return { success: false, reason: 'already_claimed' };
    }
    
    const streakDay = Math.min(this.state.dailyLoginStreak, 7) - 1;
    const reward = this.config.rewards.dailyLoginStreak[streakDay] || this.config.rewards.dailyLogin;
    
    this.state.dailyRewardsClaimed.push(today);
    
    // Keep only last 30 days of claims
    if (this.state.dailyRewardsClaimed.length > 30) {
      this.state.dailyRewardsClaimed = this.state.dailyRewardsClaimed.slice(-30);
    }
    
    this.addCoins(reward, 'daily_reward');
    this.saveState();
    
    return { 
      success: true, 
      reward, 
      streak: this.state.dailyLoginStreak,
      nextReward: this.config.rewards.dailyLoginStreak[Math.min(streakDay + 1, 6)]
    };
  },

  getDailyRewardInfo() {
    const today = this.getTodayString();
    const claimed = this.state.dailyRewardsClaimed.includes(today);
    const streakDay = Math.min(this.state.dailyLoginStreak, 7) - 1;
    const todayReward = this.config.rewards.dailyLoginStreak[streakDay] || this.config.rewards.dailyLogin;
    
    return {
      claimed,
      streak: this.state.dailyLoginStreak,
      todayReward,
      rewards: this.config.rewards.dailyLoginStreak,
    };
  },

  // ========================================
  // Achievements
  // ========================================
  checkAchievements() {
    const newAchievements = [];
    
    for (const achievement of this.achievements) {
      if (this.state.achievements.includes(achievement.id)) continue;
      
      if (achievement.condition(this.state.stats, this.state)) {
        this.state.achievements.push(achievement.id);
        this.addCoins(achievement.reward, 'achievement');
        this.addXP(this.config.xp.achievementBonus);
        newAchievements.push(achievement);
      }
    }
    
    if (newAchievements.length > 0) {
      this.saveState();
      
      window.dispatchEvent(new CustomEvent('achievementsUnlocked', { 
        detail: { achievements: newAchievements } 
      }));
    }
    
    return newAchievements;
  },

  getAchievements() {
    return this.achievements.map(a => ({
      ...a,
      unlocked: this.state.achievements.includes(a.id)
    }));
  },

  getUnlockedAchievements() {
    return this.achievements.filter(a => this.state.achievements.includes(a.id));
  },

  // ========================================
  // Utility Functions
  // ========================================
  getTodayString() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  },

  getYesterdayString() {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  },

  // ========================================
  // Persistence
  // ========================================
  saveState() {
    try {
      localStorage.setItem('switchcom_economy', JSON.stringify(this.state));
    } catch (e) {
      console.warn('Could not save economy state:', e);
    }
  },

  loadState() {
    try {
      const saved = localStorage.getItem('switchcom_economy');
      if (saved) {
        const data = JSON.parse(saved);
        // Merge with defaults to handle new properties
        this.state = {
          ...this.state,
          ...data,
          stats: { ...this.state.stats, ...data.stats },
          powerUpInventory: { ...this.state.powerUpInventory, ...data.powerUpInventory },
        };
      }
    } catch (e) {
      console.warn('Could not load economy state:', e);
    }
  },

  // Reset for testing
  resetState() {
    this.state = {
      coins: 0,
      totalCoinsEarned: 0,
      xp: 0,
      playerLevel: 1,
      currentStreak: 0,
      bestStreak: 0,
      dailyLoginStreak: 0,
      lastLoginDate: null,
      dailyRewardsClaimed: [],
      achievements: [],
      powerUpInventory: {
        revealOne: 0,
        freezeTime: 0,
        extraLife: 0,
        fiftyFifty: 0,
        skipLevel: 0,
      },
      stats: {
        totalLevelsCompleted: 0,
        totalGamesPlayed: 0,
        perfectLevels: 0,
        totalClicks: 0,
        fastestLevel: Infinity,
        highestLevelReached: 1,
        powerUpsUsed: 0,
        coinsSpent: 0,
      },
    };
    this.saveState();
  },

  // Get full state for display
  getState() {
    return {
      coins: this.state.coins,
      xp: this.state.xp,
      playerLevel: this.state.playerLevel,
      xpProgress: this.getXPProgress(),
      xpForNextLevel: this.getXPForNextLevel(),
      currentStreak: this.state.currentStreak,
      bestStreak: this.state.bestStreak,
      dailyLoginStreak: this.state.dailyLoginStreak,
      achievements: this.getUnlockedAchievements().length,
      totalAchievements: this.achievements.length,
      stats: { ...this.state.stats },
    };
  },
};

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SwitchComEconomy;
}
