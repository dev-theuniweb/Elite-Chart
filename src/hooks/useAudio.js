// src/hooks/useAudio.js
import { useState, useRef, useEffect, useCallback } from 'react';

const useAudio = () => {
  const [isEnabled, setIsEnabled] = useState(true);
  const [volume, setVolume] = useState(0.5);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const audioRefs = useRef({});

    // Audio file paths (removed background music)
  const audioFiles = {
    bet: '/audio/bet-sound.mp3',
    win: '/audio/win-sound.mp3',
    lose: '/audio/lose-sound.mp3',
    even: '/audio/even-sound.mp3'
  };

  // Listen for user interactions to enable audio
  useEffect(() => {
    const enableAudioAfterInteraction = (event) => {
      console.log('🎵 User interaction detected:', event.type);
      setHasUserInteracted(true);
      document.removeEventListener('click', enableAudioAfterInteraction);
      document.removeEventListener('touchstart', enableAudioAfterInteraction);
      document.removeEventListener('keydown', enableAudioAfterInteraction);
      document.removeEventListener('pointerdown', enableAudioAfterInteraction);
    };

    // Add multiple event types for better coverage
    document.addEventListener('click', enableAudioAfterInteraction, { passive: true });
    document.addEventListener('touchstart', enableAudioAfterInteraction, { passive: true });
    document.addEventListener('keydown', enableAudioAfterInteraction, { passive: true });
    document.addEventListener('pointerdown', enableAudioAfterInteraction, { passive: true });

    console.log('🎵 Audio interaction listeners added');

    return () => {
      document.removeEventListener('click', enableAudioAfterInteraction);
      document.removeEventListener('touchstart', enableAudioAfterInteraction);
      document.removeEventListener('keydown', enableAudioAfterInteraction);
      document.removeEventListener('pointerdown', enableAudioAfterInteraction);
    };
  }, []);

  // Initialize audio objects
  useEffect(() => {
    console.log('Initializing audio objects with files:', audioFiles);
    
    Object.keys(audioFiles).forEach(key => {
      if (!audioRefs.current[key]) {
        const audio = new Audio();
        audio.src = audioFiles[key];
        audio.volume = volume;
        audio.preload = 'auto';
        
        console.log(`Creating audio object for ${key}:`, audio.src);
        
        // Add basic event listeners with more detailed error info
        audio.addEventListener('canplaythrough', () => console.log(`${key}: ready to play`));
        audio.addEventListener('error', (e) => {
          console.error(`${key}: error loading audio file`);
          console.error('Error details:', e);
          console.error('Audio error code:', audio.error?.code);
          console.error('Audio error message:', audio.error?.message);
          console.error('File path:', audio.src);
        });
        
        audioRefs.current[key] = audio;
      }
    });

    // Cleanup function
    return () => {
      Object.values(audioRefs.current).forEach(audio => {
        if (audio) {
          audio.pause();
          audio.currentTime = 0;
        }
      });
    };
  }, [volume]);

  // Update volume for all audio files when volume changes
  useEffect(() => {
    Object.keys(audioRefs.current).forEach(key => {
      const audio = audioRefs.current[key];
      if (audio) {
        audio.volume = volume;
      }
    });
  }, [volume]);

  // Play audio function with better error handling (sound effects only)
  const playAudio = useCallback(async (soundType) => {
    console.log(`🎵 playAudio called for: ${soundType}`);
    console.log(`🎵 Current state:`, { isEnabled, hasUserInteracted });
    
    // Auto-enable user interaction if it's not detected but we're trying to play audio
    if (!hasUserInteracted && isEnabled) {
      console.log('🎵 Auto-enabling user interaction for audio playback');
      setHasUserInteracted(true);
    }
    
    if (!isEnabled) {
      console.log('🎵 Audio not enabled, skipping playback');
      return;
    }

    try {
      const audio = audioRefs.current[soundType];
      if (!audio) {
        console.error(`🎵 Audio element not found for: ${soundType}`);
        return;
      }

      console.log(`🎵 Attempting to play: ${soundType}`, {
        currentTime: audio.currentTime,
        duration: audio.duration,
        paused: audio.paused,
        volume: audio.volume,
        readyState: audio.readyState,
        src: audio.src
      });

      // For sound effects, create a new audio instance to allow overlapping
      console.log(`🎵 Creating new audio instance for ${soundType}`);
      const soundEffect = new Audio(audioFiles[soundType]);
      soundEffect.volume = volume;
      soundEffect.loop = false;
      
      console.log(`🎵 New sound effect created:`, {
        src: soundEffect.src,
        volume: soundEffect.volume,
        readyState: soundEffect.readyState
      });
      
      await soundEffect.play();
      console.log(`🎵 Sound effect ${soundType} played successfully`);
      
      // Clean up after playing
      soundEffect.addEventListener('ended', () => {
        console.log(`🎵 Sound effect ${soundType} ended, cleaning up`);
        soundEffect.src = '';
      });
    } catch (error) {
      console.error(`🎵 Error playing ${soundType}:`, error);
      
      // If autoplay was blocked, show a user message
      if (error.name === 'NotAllowedError') {
        console.log('🎵 Autoplay blocked - user interaction required');
      }
    }
  }, [isEnabled, hasUserInteracted, volume, audioFiles]);

  // Stop all audio
  const stopAllAudio = useCallback(() => {
    Object.values(audioRefs.current).forEach(audio => {
      if (audio && !audio.paused) {
        audio.pause();
        audio.currentTime = 0;
      }
    });
  }, []);

  // Toggle all sounds
  const toggleSounds = useCallback(() => {
    const newState = !isEnabled;
    setIsEnabled(newState);
    
    if (!newState) {
      stopAllAudio();
    }
  }, [isEnabled, stopAllAudio]);

  // Manual function to force enable user interaction
  const forceEnableInteraction = useCallback(() => {
    console.log('🎵 Manually enabling user interaction');
    setHasUserInteracted(true);
  }, []);

  return {
    // State
    isEnabled,
    volume,
    hasUserInteracted,
    
    // Controls
    playAudio,
    stopAllAudio,
    toggleSounds,
    setVolume,
    forceEnableInteraction,
    
    // Essential sound functions
    playBetSound: () => playAudio('bet'),
    playWinSound: () => playAudio('win'),
    playLoseSound: () => playAudio('lose'),
    playEvenSound: () => playAudio('even')
  };
};

export default useAudio;
