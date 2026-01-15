/**
 * SwitchCom — Animated Dot Grid Background
 * Interactive canvas-based dot grid with mouse proximity effects
 */

const DotGrid = {
  // Configuration
  config: {
    dotSize: 8,
    gap: 40,
    baseColor: '#E0E0E0',
    activeColor: '#9A9A9A',
    proximity: 120,
    returnSpeed: 0.08,
    maxOffset: 15,
  },

  // State
  canvas: null,
  ctx: null,
  wrapper: null,
  dots: [],
  pointer: { x: -1000, y: -1000 },
  animationId: null,
  dpr: 1,

  // ========================================
  // Initialize
  // ========================================
  init(wrapperSelector = '#dot-grid-wrapper') {
    this.wrapper = document.querySelector(wrapperSelector);
    if (!this.wrapper) return;

    this.canvas = document.createElement('canvas');
    this.canvas.className = 'dot-grid-canvas';
    this.wrapper.appendChild(this.canvas);
    
    this.ctx = this.canvas.getContext('2d');
    this.dpr = window.devicePixelRatio || 1;

    this.buildGrid();
    this.bindEvents();
    this.startAnimation();

    // Rebuild on resize
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => this.buildGrid(), 150);
    });
  },

  // ========================================
  // Build Grid
  // ========================================
  buildGrid() {
    if (!this.wrapper || !this.canvas) return;

    const rect = this.wrapper.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    // Set canvas size with DPR
    this.canvas.width = width * this.dpr;
    this.canvas.height = height * this.dpr;
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    this.ctx.scale(this.dpr, this.dpr);

    // Calculate grid
    const { dotSize, gap } = this.config;
    const cell = dotSize + gap;
    const cols = Math.floor((width + gap) / cell);
    const rows = Math.floor((height + gap) / cell);

    const gridW = cell * cols - gap;
    const gridH = cell * rows - gap;
    const startX = (width - gridW) / 2 + dotSize / 2;
    const startY = (height - gridH) / 2 + dotSize / 2;

    this.dots = [];
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        this.dots.push({
          cx: startX + x * cell,
          cy: startY + y * cell,
          x: startX + x * cell,
          y: startY + y * cell,
          targetX: startX + x * cell,
          targetY: startY + y * cell,
          vx: 0,
          vy: 0,
        });
      }
    }
  },

  // ========================================
  // Bind Events
  // ========================================
  bindEvents() {
    // Track mouse position
    document.addEventListener('mousemove', (e) => {
      if (!this.canvas) return;
      const rect = this.canvas.getBoundingClientRect();
      this.pointer.x = e.clientX - rect.left;
      this.pointer.y = e.clientY - rect.top;
    });

    // Track touch
    document.addEventListener('touchmove', (e) => {
      if (!this.canvas || !e.touches[0]) return;
      const rect = this.canvas.getBoundingClientRect();
      this.pointer.x = e.touches[0].clientX - rect.left;
      this.pointer.y = e.touches[0].clientY - rect.top;
    }, { passive: true });

    // Reset pointer on leave
    document.addEventListener('mouseleave', () => {
      this.pointer.x = -1000;
      this.pointer.y = -1000;
    });
  },

  // ========================================
  // Animation Loop
  // ========================================
  startAnimation() {
    const { proximity, returnSpeed, maxOffset, dotSize, baseColor, activeColor } = this.config;
    const proxSq = proximity * proximity;

    // Pre-calculate colors
    const baseRgb = this.hexToRgb(baseColor);
    const activeRgb = this.hexToRgb(activeColor);

    const animate = () => {
      if (!this.ctx || !this.canvas) return;

      // Clear canvas
      this.ctx.clearRect(0, 0, this.canvas.width / this.dpr, this.canvas.height / this.dpr);

      for (const dot of this.dots) {
        const dx = dot.cx - this.pointer.x;
        const dy = dot.cy - this.pointer.y;
        const distSq = dx * dx + dy * dy;

        // Calculate target position based on pointer proximity
        if (distSq < proxSq && distSq > 0) {
          const dist = Math.sqrt(distSq);
          const force = (1 - dist / proximity) * maxOffset;
          const angle = Math.atan2(dy, dx);
          dot.targetX = dot.cx + Math.cos(angle) * force;
          dot.targetY = dot.cy + Math.sin(angle) * force;
        } else {
          dot.targetX = dot.cx;
          dot.targetY = dot.cy;
        }

        // Smooth interpolation to target
        dot.x += (dot.targetX - dot.x) * returnSpeed;
        dot.y += (dot.targetY - dot.y) * returnSpeed;

        // Calculate color based on distance
        let color = baseColor;
        if (distSq < proxSq) {
          const dist = Math.sqrt(distSq);
          const t = 1 - dist / proximity;
          const r = Math.round(baseRgb.r + (activeRgb.r - baseRgb.r) * t);
          const g = Math.round(baseRgb.g + (activeRgb.g - baseRgb.g) * t);
          const b = Math.round(baseRgb.b + (activeRgb.b - baseRgb.b) * t);
          color = `rgb(${r},${g},${b})`;
        }

        // Draw dot
        this.ctx.beginPath();
        this.ctx.arc(dot.x, dot.y, dotSize / 2, 0, Math.PI * 2);
        this.ctx.fillStyle = color;
        this.ctx.fill();
      }

      this.animationId = requestAnimationFrame(animate);
    };

    animate();
  },

  // ========================================
  // Stop Animation
  // ========================================
  stop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  },

  // ========================================
  // Utility: Hex to RGB
  // ========================================
  hexToRgb(hex) {
    const m = hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
    if (!m) return { r: 0, g: 0, b: 0 };
    return {
      r: parseInt(m[1], 16),
      g: parseInt(m[2], 16),
      b: parseInt(m[3], 16)
    };
  },

  // ========================================
  // Update Config
  // ========================================
  setConfig(newConfig) {
    Object.assign(this.config, newConfig);
    this.buildGrid();
  }
};

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DotGrid;
}


