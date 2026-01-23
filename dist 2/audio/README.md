# Public Audio Files

This folder contains the audio files that will be served by the web server.

## Required Files:

Place the following audio files in this directory:

1. **background-music.mp3** - Background music loop
2. **bet-sound.mp3** - Sound when placing a bet (UP or DOWN)
3. **win-sound.mp3** - Sound when winning a bet
4. **lose-sound.mp3** - Sound when losing a bet

## Audio Behavior:
- **Background Music**: Loops continuously, user can toggle on/off
- **Bet Sound**: Plays immediately when clicking UP or DOWN buttons
- **Win Sound**: Plays when bet result is WIN
- **Lose Sound**: Plays when bet result is LOSE

## File Requirements:
- Format: MP3
- Quality: 128-192 kbps
- Size: Keep under 1MB each
- Sample Rate: 44.1 kHz

## Free Audio Resources:
- Freesound.org
- Zapsplat.com
- YouTube Audio Library
- Adobe Stock
- BBC Sound Effects

## Testing:
Once you add the files here, the audio system will automatically load them. Use the audio controls in the top-left corner of the game to test and adjust volume.

## Note:
The audio files must have the exact names listed above, or update the file names in `/src/hooks/useAudio.js` to match your file names.
