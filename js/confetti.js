/**
 * SwitchCom — Confetti & Celebration System
 * Particle effects for level completion, achievements, milestones
 */

const SwitchComConfetti = {
  canvas: null,
  ctx: null,
  particles: [],
  animationId: null,
  isRunning: false,

  // ========================================
  // Configuration
  // ========================================
  config: {
    particleCount: 150,
    gravity: 0.3,
    drag: 0.02,
    terminalVelocity: 3,
    colors: [
      '#FFD700', // Gold
      '#FF6B6B', // Coral
      '#4ECDC4', // Teal
      '#A78BFA', // Purple
      '#F472B6', // Pink
      '#34D399', // Green
      '#60A5FA', // Blue
      '#FBBF24', // Amber
    ],
    shapes: ['square', 'circle', 'triangle', 'strip'],
  },

  // ========================================
  // Initialization
  // ========================================
  init() {
    this.createCanvas();
    return this;
  },

  createCanvas() {
    if (this.canvas) return;

    this.canvas = document.createElement('canvas');
    this.canvas.id = 'confetti-canvas';
    this.canvas.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 9999;
    `;
    document.body.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d');
    this.resize();

    window.addEventListener('resize', () => this.resize());
  },

  resize() {
    if (!this.canvas) return;
    this.canvas.width = window.innerWidth * window.devicePixelRatio;
    this.canvas.height = window.innerHeight * window.devicePixelRatio;
    this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
  },

  // ========================================
  // Particle Class
  // ========================================
  createParticle(x, y, options = {}) {
    const angle = options.angle || Math.random() * Math.PI * 2;
    const velocity = options.velocity || (Math.random() * 6 + 4);
    const color = options.color || this.config.colors[Math.floor(Math.random() * this.config.colors.length)];
    const shape = options.shape || this.config.shapes[Math.floor(Math.random() * this.config.shapes.length)];

    return {
      x,
      y,
      vx: Math.cos(angle) * velocity,
      vy: Math.sin(angle) * velocity - 3,
      color,
      shape,
      size: Math.random() * 8 + 4,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.2,
      opacity: 1,
      life: 1,
      decay: 0.003 + Math.random() * 0.005,
    };
  },

  // ========================================
  // Drawing
  // ========================================
  drawParticle(p) {
    this.ctx.save();
    this.ctx.translate(p.x, p.y);
    this.ctx.rotate(p.rotation);
    this.ctx.globalAlpha = p.opacity * p.life;
    this.ctx.fillStyle = p.color;

    const size = p.size * p.life;

    switch (p.shape) {
      case 'square':
        this.ctx.fillRect(-size / 2, -size / 2, size, size);
        break;
      case 'circle':
        this.ctx.beginPath();
        this.ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
        this.ctx.fill();
        break;
      case 'triangle':
        this.ctx.beginPath();
        this.ctx.moveTo(0, -size / 2);
        this.ctx.lineTo(size / 2, size / 2);
        this.ctx.lineTo(-size / 2, size / 2);
        this.ctx.closePath();
        this.ctx.fill();
        break;
      case 'strip':
        this.ctx.fillRect(-size / 4, -size, size / 2, size * 2);
        break;
    }

    this.ctx.restore();
  },

  // ========================================
  // Animation Loop
  // ========================================
  update() {
    if (!this.isRunning) return;

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];

      // Physics
      p.vy += this.config.gravity;
      p.vx *= (1 - this.config.drag);
      p.vy *= (1 - this.config.drag);

      // Terminal velocity
      p.vy = Math.min(p.vy, this.config.terminalVelocity);

      // Position
      p.x += p.vx;
      p.y += p.vy;

      // Rotation
      p.rotation += p.rotationSpeed;

      // Life
      p.life -= p.decay;

      // Draw
      if (p.life > 0) {
        this.drawParticle(p);
      } else {
        this.particles.splice(i, 1);
      }
    }

    if (this.particles.length > 0) {
      this.animationId = requestAnimationFrame(() => this.update());
    } else {
      this.isRunning = false;
    }
  },

  // ========================================
  // Effects
  // ========================================
  
  // Standard confetti burst from center
  burst(options = {}) {
    const x = options.x || window.innerWidth / 2;
    const y = options.y || window.innerHeight / 2;
    const count = options.count || this.config.particleCount;

    for (let i = 0; i < count; i++) {
      this.particles.push(this.createParticle(x, y, {
        velocity: Math.random() * 8 + 6,
      }));
    }

    this.start();
  },

  // Confetti cannon from bottom
  cannon(side = 'left') {
    const x = side === 'left' ? 0 : window.innerWidth;
    const y = window.innerHeight;
    const angleBase = side === 'left' ? -Math.PI / 4 : -Math.PI * 3 / 4;

    for (let i = 0; i < 80; i++) {
      this.particles.push(this.createParticle(x, y, {
        angle: angleBase + (Math.random() - 0.5) * 0.8,
        velocity: Math.random() * 12 + 10,
      }));
    }

    this.start();
  },

  // Rain from top
  rain(duration = 3000) {
    const interval = setInterval(() => {
      for (let i = 0; i < 5; i++) {
        this.particles.push(this.createParticle(
          Math.random() * window.innerWidth,
          -20,
          {
            angle: Math.PI / 2 + (Math.random() - 0.5) * 0.5,
            velocity: Math.random() * 2 + 1,
          }
        ));
      }
      this.start();
    }, 50);

    setTimeout(() => clearInterval(interval), duration);
  },

  // Firework explosion
  firework(x, y, color = null) {
    const particleColor = color || this.config.colors[Math.floor(Math.random() * this.config.colors.length)];
    
    for (let i = 0; i < 40; i++) {
      this.particles.push(this.createParticle(x, y, {
        color: particleColor,
        velocity: Math.random() * 6 + 2,
        shape: 'circle',
      }));
    }

    this.start();
  },

  // Multiple fireworks
  fireworks(count = 5, delay = 300) {
    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        this.firework(
          Math.random() * window.innerWidth * 0.6 + window.innerWidth * 0.2,
          Math.random() * window.innerHeight * 0.4 + window.innerHeight * 0.1
        );
      }, i * delay);
    }
  },

  // Star burst (for achievements)
  starBurst(x, y) {
    const goldColors = ['#FFD700', '#FFC107', '#FFEB3B', '#FFF59D'];
    
    for (let i = 0; i < 60; i++) {
      this.particles.push(this.createParticle(x, y, {
        color: goldColors[Math.floor(Math.random() * goldColors.length)],
        velocity: Math.random() * 8 + 4,
        shape: Math.random() > 0.5 ? 'circle' : 'strip',
      }));
    }

    this.start();
  },

  // Level up celebration
  levelUp() {
    // Burst from center
    this.burst({ count: 100 });
    
    // Cannons from both sides
    setTimeout(() => {
      this.cannon('left');
      this.cannon('right');
    }, 200);
  },

  // Milestone celebration (bigger!)
  milestone() {
    // Initial burst
    this.burst({ count: 150 });
    
    // Fireworks
    setTimeout(() => this.fireworks(7, 200), 300);
    
    // Rain
    setTimeout(() => this.rain(2000), 500);
  },

  // Achievement unlock
  achievement(x, y) {
    this.starBurst(x || window.innerWidth / 2, y || window.innerHeight / 2);
  },

  // ========================================
  // Control
  // ========================================
  start() {
    if (!this.isRunning) {
      this.isRunning = true;
      this.update();
    }
  },

  stop() {
    this.isRunning = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    this.particles = [];
    if (this.ctx) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  },

  // ========================================
  // Preset Celebrations
  // ========================================
  celebrate(type = 'levelUp', options = {}) {
    switch (type) {
      case 'levelUp':
        this.levelUp();
        break;
      case 'milestone':
        this.milestone();
        break;
      case 'achievement':
        this.achievement(options.x, options.y);
        break;
      case 'perfect':
        this.starBurst(window.innerWidth / 2, window.innerHeight / 2);
        break;
      case 'streak':
        this.cannon('left');
        setTimeout(() => this.cannon('right'), 150);
        break;
      case 'gameOver':
        this.rain(1500);
        break;
      default:
        this.burst();
    }
  },
};

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SwitchComConfetti;
}
