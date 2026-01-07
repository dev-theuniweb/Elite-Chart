// src/services/pixiService.js
import * as PIXI from 'pixi.js';

class PixiService {
  constructor() {
    this.app = null;
    this.container = null;
    this.isInitialized = false;
    this.animationCallbacks = [];
  }

  /**
   * Initialize PIXI application - called once at app startup
   */
  async initialize() {
    if (this.isInitialized) {
      console.log('✅ PIXI already initialized');
      return;
    }

    try {
      console.log('🚀 Initializing PIXI Service...');

      // Create or reuse container
      this.container = document.getElementById('pixi-animation-container');
      if (!this.container) {
        this.container = document.createElement('div');
        this.container.id = 'pixi-animation-container';
        this.container.style.cssText = `
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          width: 100vw !important;
          height: 100vh !important;
          pointer-events: none !important;
          z-index: 999999 !important;
          display: none !important;
          overflow: hidden !important;
        `;
        document.body.appendChild(this.container);
        console.log('📦 Container created with center alignment');
      }

      // Create PIXI Application
      this.app = new PIXI.Application();
      
      await this.app.init({
        width: window.innerWidth,
        height: window.innerHeight,
        backgroundAlpha: 0,
        antialias: true,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
      });

      console.log('✅ PIXI app initialized:', {
        width: this.app.canvas.width,
        height: this.app.canvas.height,
      });

      // Style canvas
      this.app.canvas.style.cssText = `
        width: 100% !important;
        height: 100% !important;
        display: block !important;
        position: absolute !important;
        top: 0 !important;
        left: 0 !important;
      `;

      // Append canvas to container
      this.container.appendChild(this.app.canvas);

      // Start the ticker
      this.app.ticker.start();

      this.isInitialized = true;
      console.log('✅ PIXI Service ready!');
    } catch (error) {
      console.error('❌ Failed to initialize PIXI:', error);
      throw error;
    }
  }

  /**
   * Show the animation container
   */
  show() {
    if (this.container) {
      this.container.style.display = 'block';
      console.log('📺 PIXI container shown');
    }
  }

  /**
   * Hide the animation container
   */
  hide() {
    if (this.container) {
      this.container.style.display = 'none';
      console.log('📺 PIXI container hidden');
    }
  }

  /**
   * Clear all children from stage
   */
  clearStage() {
    if (this.app && this.app.stage) {
      this.app.stage.removeChildren();
    }
  }

  /**
   * Get the stage
   */
  getStage() {
    return this.app?.stage;
  }

  /**
   * Get the ticker
   */
  getTicker() {
    return this.app?.ticker;
  }

  /**
   * Add a callback to animation ticker
   */
  onTick(callback) {
    if (this.app) {
      this.app.ticker.add(callback);
      return callback; // Return for easy removal
    }
  }

  /**
   * Remove a callback from animation ticker
   */
  offTick(callback) {
    if (this.app) {
      this.app.ticker.remove(callback);
    }
  }

  /**
   * Force render
   */
  render() {
    if (this.app) {
      this.app.render();
    }
  }

  /**
   * Get canvas dimensions
   */
  getCanvasDimensions() {
    if (this.app) {
      return {
        width: this.app.canvas.width,
        height: this.app.canvas.height,
      };
    }
    return null;
  }
}

// Export singleton instance
export const pixiService = new PixiService();
