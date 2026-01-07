// src/services/animationUtils.js
import * as PIXI from 'pixi.js';

/**
 * Create a parachute graphic - SIMPLE BOX TEST
 */
export function createParachute(x, y) {
  const container = new PIXI.Container();
  container.x = x;
  container.y = y;

  // Simple red box
  const box = new PIXI.Graphics();
  box.rect(-20, -20, 40, 40);
  box.fill(0xFF0000);
  box.stroke({ color: 0x000000, width: 1 });
  container.addChild(box);

  return container;
}

/**
 * Create a coin graphic - SIMPLE BOX TEST
 */
export function createCoin(x, y) {
  const container = new PIXI.Container();
  container.x = x;
  container.y = y;

  // Simple yellow box
  const box = new PIXI.Graphics();
  box.rect(-15, -15, 30, 30);
  box.fill(0xFFFF00);
  box.stroke({ color: 0x000000, width: 1 });
  container.addChild(box);

  return container;
}

/**
 * Create a complete airdrop object using SVG image
 */
export async function createAirdrop(x, y) {
  const container = new PIXI.Container();
  container.x = x;
  container.y = y;

  try {
    // Load SVG as texture - correct path to assets folder
    const texture = await PIXI.Assets.load(new URL('../assets/img/Parachutes.svg', import.meta.url).href);
    const sprite = new PIXI.Sprite(texture);
    
    // Scale down the sprite - reduced for smaller display
    sprite.scale.set(0.25);
    sprite.anchor.set(0.5, 0.5);
    
    container.addChild(sprite);
    console.log('✅ Parachute SVG loaded successfully');
  } catch (error) {
    console.warn('⚠️ Failed to load SVG, trying alternate path:', error);
    
    try {
      // Try alternate path
      const texture = await PIXI.Assets.load('/src/assets/img/Parachutes.svg');
      const sprite = new PIXI.Sprite(texture);
      sprite.scale.set(0.25);
      sprite.anchor.set(0.5, 0.5);
      container.addChild(sprite);
      console.log('✅ Parachute SVG loaded from alternate path');
    } catch (error2) {
      console.warn('⚠️ Failed with alternate path too, using fallback box:', error2);
      
      // Fallback to simple colored box if SVG fails
      const box = new PIXI.Graphics();
      box.rect(-20, -20, 40, 40);
      box.fill(0xFF0000);
      container.addChild(box);
    }
  }

  // Store properties for animation
  container.vx = 0;
  container.vy = 0;
  container.rotation = 0;
  container.swing = 0;
  container.swingSpeed = 0.02;
  container.swingAmount = 15;

  return container;
}

/**
 * Easing functions for smooth animations
 */
export const easing = {
  linear: (t) => t,
  easeOut: (t) => 1 - Math.pow(1 - t, 2),
  easeIn: (t) => t * t,
  easeInOut: (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
  bounce: (t) => {
    if (t < 0.5) return 2 * t * t;
    return -1 + (4 - 2 * t) * t;
  },
};

/**
 * Calculate trajectory for coin burst
 */
export function calculateCoinTrajectory(startX, startY, angle, speed) {
  const radians = (angle * Math.PI) / 180;
  return {
    vx: Math.cos(radians) * speed,
    vy: Math.sin(radians) * speed,
    x: startX,
    y: startY,
  };
}
