# Audio Files Setup

This folder should contain the following audio files for the BTC Battle game:

## Required Audio Files:

### 1. **background-music.mp3**
- Background music that loops during gameplay
- Should be ambient/electronic music, not too distracting
- Recommended: 30-120 seconds loop
- Volume will be automatically reduced to 30% of main volume

### 2. **bet-sound.mp3** 
- Sound effect when placing a bet (UP or DOWN)
- Should be a short, satisfying click/confirmation sound
- Recommended duration: 0.1-0.5 seconds

### 3. **win-sound.mp3**
- Celebratory sound when winning a bet
- Should be positive and rewarding
- Recommended duration: 1-3 seconds

### 4. **lose-sound.mp3** 
- Sound when losing a bet
- Should be subtle disappointment sound, not harsh
- Recommended duration: 0.5-2 seconds

### 5. **tick-sound.mp3** (Optional)
- Countdown tick sound for the last 10 seconds
- Short tick/beep sound
- Recommended duration: 0.1-0.2 seconds

### 6. **new-round.mp3** (Optional)
- Sound when a new trading round starts
- Bell or chime sound
- Recommended duration: 0.5-1 second

## Audio Format Recommendations:
- **Format**: MP3 (best browser compatibility)
- **Quality**: 128-192 kbps (good quality, reasonable file size)
- **Sample Rate**: 44.1 kHz
- **File Size**: Keep under 1MB each for better loading

## Free Audio Resources:
- **Freesound.org**: Free sound effects
- **Zapsplat.com**: Professional sound library (free with account)
- **Adobe Stock**: Royalty-free music and sounds
- **YouTube Audio Library**: Free background music
- **BBC Sound Effects**: Free sound effects library

## Usage:
Once you add these files to this folder, the audio system will automatically load and use them in the game. The audio controls will appear in the top-left corner of the game interface.

## Note:
Make sure the file names match exactly as listed above, or update the file names in `/src/hooks/useAudio.js` if you use different names.
