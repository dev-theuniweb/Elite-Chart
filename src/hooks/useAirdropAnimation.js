// src/hooks/useAirdropAnimation.js
import { useEffect } from 'react';
import { pixiService } from '../services/pixiService';
import { createAirdrop, easing } from '../services/animationUtils';

const useAirdropAnimation = () => {
  // Initialize PIXI service on mount
  useEffect(() => {
    const initializePixi = async () => {
      try {
        await pixiService.initialize();
        console.log('✅ PIXI Service initialized in hook');
      } catch (error) {
        console.error('❌ Failed to initialize PIXI in hook:', error);
      }
    };

    initializePixi();

    return () => {
      // Cleanup on unmount
      console.log('Cleaning up PIXI hook');
    };
  }, []);

  const triggerAirdrop = () => {
    console.log('🪂 Airdrop triggered!');

    if (!pixiService.isInitialized) {
      console.error('❌ PIXI not initialized');
      return;
    }

    // Clear previous animation
    pixiService.clearStage();
    pixiService.show();

    const stage = pixiService.getStage();
    const { width: canvasWidth, height: canvasHeight } = pixiService.getCanvasDimensions();

    const airdrops = [];
    const animationDuration = 12000; // 12 seconds (increased to show all 10)
    const startTime = Date.now();

    console.log('🚀 Creating airdrops...');

    // Create 20 airdrops at different positions with async loading
    const createAirdropsAsync = async () => {
      for (let i = 0; i < 50; i++) {
        try {
          // Spread parachutes across entire screen (both horizontally and vertically)
          const randomX = Math.random() * canvasWidth;
          const randomStartY = -100 - Math.random() * 700; // More varied starting heights
          
          const airdrop = await createAirdrop(randomX, randomStartY);
          airdrop.velocity = 0.8 + Math.random() * 0.5;
          airdrop.swingSpeed = 0.01 + Math.random() * 0.02;
          airdrop.swingAmount = 5 + Math.random() * 10;

          stage.addChild(airdrop);
          airdrops.push(airdrop);
        } catch (error) {
          console.error('❌ Failed to create airdrop:', error);
        }
      }

      console.log(`✅ Created ${airdrops.length} airdrops`);

      // Animation loop
      const animateFrame = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / animationDuration, 1);

        let allOffScreen = true;

        airdrops.forEach((airdrop) => {
          // Fall down
          airdrop.y += airdrop.velocity * 2;

          // Swing side to side
          airdrop.swing += airdrop.swingSpeed;
          airdrop.x += Math.sin(airdrop.swing) * airdrop.swingAmount * 0.01;

          // Slight rotation
          airdrop.rotation = Math.sin(airdrop.swing) * 0.15;

          // Check if visible
          if (airdrop.y < canvasHeight + 100) {
            allOffScreen = false;
          }

          // Fade out at end
          if (progress > 0.8) {
            airdrop.alpha = 1 - (progress - 0.8) * 5;
          }
        });

        pixiService.render();

        // Continue or stop animation
        if (allOffScreen || progress >= 1) {
          console.log('✅ Animation complete');
          pixiService.offTick(animateFrame);
          pixiService.clearStage();
          pixiService.hide();
        }
      };

      // Register animation loop once
      console.log('📢 Registering animation frame callback');
      pixiService.onTick(animateFrame);
    };

    // Start async creation
    createAirdropsAsync().catch(error => {
      console.error('❌ Airdrop creation failed:', error);
      pixiService.clearStage();
      pixiService.hide();
    });
  };

  return { triggerAirdrop };
};

export default useAirdropAnimation;

