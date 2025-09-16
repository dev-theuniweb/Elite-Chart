# 🎵 Audio System Setup Guide

Your BTC Battle app now has a complete audio system! Here's everything you need to know:

## 🎯 What's Been Added

### 1. **Custom Audio Hook** (`/src/hooks/useAudio.js`)
- Manages all audio functionality
- Controls volume, muting, and background music
- Handles audio loading and error management
- Provides easy-to-use functions for all sounds

### 2. **Audio Controls Component** (`/src/components/ui/AudioControls.jsx`)
- Visual controls in the top-left corner
- Sound toggle, music toggle, and volume slider
- Responsive design for mobile and desktop
- Clean, modern UI that matches your app

### 3. **Integrated Sound Effects**
- **Background Music**: Ambient music that loops continuously (user controlled)
- **Bet Sound**: Plays when placing UP or DOWN bets
- **Win Sound**: Plays when winning bets
- **Lose Sound**: Plays when losing bets

## 📁 Audio Files Setup

### Step 1: Add Audio Files
Place these files in `/public/audio/`:
- `background-music.mp3`
- `bet-sound.mp3`
- `win-sound.mp3`
- `lose-sound.mp3`

### Step 2: File Recommendations
- **Format**: MP3 (best browser compatibility)
- **Quality**: 128-192 kbps
- **Size**: Keep under 1MB each
- **Length**: 
  - Background music: 30-120 seconds (will loop)
  - Sound effects: 0.1-3 seconds
  - Countdown tick: 0.1-0.2 seconds

## 🎨 Free Audio Resources

### Sound Effects:
- **Freesound.org** - Huge library of free sounds
- **Zapsplat.com** - Professional sounds (free account required)
- **Adobe Stock** - High-quality royalty-free sounds
- **BBC Sound Effects** - Free professional sound library

### Background Music:
- **YouTube Audio Library** - Free music for content creators
- **Freesound.org** - Community-created music loops
- **Incompetech.com** - Free music by Kevin MacLeod
- **Pixabay Music** - Free background music

## 🎮 Audio Controls Features

### User Controls:
1. **🔊/🔇 Sound Toggle**: Mutes/unmutes all sounds
2. **🎵 Music Toggle**: Controls background music only
3. **🔉 Volume Slider**: Adjusts overall volume (0-100%)

### Smart Features:
- Background music plays at 30% of main volume
- Audio gracefully handles missing files
- Mobile-responsive controls
- Remembers user preferences during session

## 🚀 Testing the Audio System

1. **Start your development server**:
   ```bash
   npm run dev
   ```

2. **Check the audio controls** in the top-left corner

3. **Test each sound**:
   - Place a bet → hear bet sound
   - Wait for round to complete → hear win/lose sound
   - Use music toggle → hear background music

## 🔧 Customization Options

### Change Audio Files:
Edit `/src/hooks/useAudio.js` and update the `audioFiles` object:
```javascript
const audioFiles = {
  background: '/audio/your-background-music.mp3',
  bet: '/audio/your-bet-sound.mp3',
  // ... etc
};
```

### Adjust Volume Levels:
Modify volume multipliers in the audio hook:
```javascript
audio.volume = key === 'background' ? volume * 0.3 : volume;
```

### Add New Sounds:
1. Add new sound to `audioFiles` object
2. Create a new play function
3. Call it where needed in your components

## 📱 Mobile Considerations

- Audio controls automatically scale for mobile
- Uses touch-friendly controls
- Optimized for mobile browsers
- Handles mobile audio autoplay restrictions

## 🐛 Troubleshooting

### No Sound Playing:
1. Check if audio files exist in `/public/audio/`
2. Check browser console for audio loading errors
3. Ensure audio controls show as enabled
4. Try adjusting volume slider

### Background Music Not Playing:
1. Check if music toggle is enabled (🎵 button)
2. Some browsers require user interaction before playing audio
3. Click somewhere on the page first, then try the music toggle

### Mobile Audio Issues:
1. Mobile browsers often require user interaction before audio
2. Tap the screen first, then try audio controls
3. Check if device is in silent mode

## 🎯 Next Steps

1. **Add your audio files** to `/public/audio/`
2. **Test all sound effects** by playing the game
3. **Adjust volumes** as needed for balance
4. **Customize** sounds to match your game's theme

Your audio system is now fully integrated and ready to enhance the gaming experience! 🎉
