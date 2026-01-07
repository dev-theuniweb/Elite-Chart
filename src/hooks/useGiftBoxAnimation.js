import { useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';

const useGiftBoxAnimation = ({ onGiftBoxClick } = {}) => {
  const containerRef = useRef(null);
  const appRef = useRef(null);
  const giftBoxRef = useRef(null);

  useEffect(() => {
    const initializeGiftBox = async () => {
      if (!containerRef.current) return;

      try {
        // Create PIXI Application - render at high resolution for crisp quality
        const app = new PIXI.Application();
        await app.init({
          width: 500,
          height: 900,
          backgroundAlpha: 0,
          antialias: true,
          resolution: 2,
          autoDensity: true,
        });

        appRef.current = app;
        containerRef.current.appendChild(app.canvas);

        // Load gift box PNG sprite (high quality) or SVG fallback
        try {
          // Try PNG sprite first (best quality)
          const texture = await PIXI.Assets.load(
            new URL('../assets/img/gift-box.png', import.meta.url).href
          );
          const giftBox = new PIXI.Sprite(texture);
          giftBox.scale.set(0.5);
          giftBox.anchor.set(0.5, 0.5);
          giftBox.x = 300;
          giftBox.y = 150;
          giftBox.interactive = true;
          giftBox.cursor = 'pointer';

          app.stage.addChild(giftBox);
          giftBoxRef.current = giftBox;

          // Add click event listener
          giftBox.on('pointerdown', () => {
            console.log('🎁 Gift box clicked!');
            if (onGiftBoxClick) {
              onGiftBoxClick();
            }
          });

          console.log('✅ Gift box PNG sprite loaded successfully');
        } catch (pngError) {
          console.warn('⚠️ PNG not found, trying SVG:', pngError);
          
          try {
            // Fallback to SVG
            const texture = await PIXI.Assets.load(
              new URL('../assets/img/gift-box.svg', import.meta.url).href
            );
            const giftBox = new PIXI.Sprite(texture);
            giftBox.scale.set(0.9);
            giftBox.anchor.set(0.5, 0.5);
            giftBox.x = 150;
            giftBox.y = 150;
            giftBox.interactive = true;
            giftBox.cursor = 'pointer';

            app.stage.addChild(giftBox);
            giftBoxRef.current = giftBox;

            // Add click event listener
            giftBox.on('pointerdown', () => {
              console.log('🎁 Gift box clicked!');
              if (onGiftBoxClick) {
                onGiftBoxClick();
              }
            });

            console.log('✅ Gift box SVG loaded as fallback');
          } catch (svgError) {
            console.error('❌ Both PNG and SVG failed:', svgError);
            // Final fallback to graphics box
            const fallback = new PIXI.Graphics();
            fallback.rect(450, 450, 100, 100);
            fallback.fill(0xDDA520);
            app.stage.addChild(fallback);
            giftBoxRef.current = fallback;
          }
        }

        // Animation loop - bobbing motion
        let time = 0;
        app.ticker.add(() => {
          time += 0.05;
          if (giftBoxRef.current) {
            giftBoxRef.current.y = 150 + Math.sin(time) * 15;
            giftBoxRef.current.rotation = Math.sin(time * 0.5) * 0.08;
          }
        });

        console.log('✅ Gift box animation initialized');
      } catch (error) {
        console.error('❌ Failed to initialize gift box:', error);
      }
    };

    initializeGiftBox();

    return () => {
      if (appRef.current) {
        appRef.current.destroy();
        if (containerRef.current && containerRef.current.contains(appRef.current.canvas)) {
          containerRef.current.removeChild(appRef.current.canvas);
        }
      }
    };
  }, []);

  return containerRef;
};

export default useGiftBoxAnimation;
