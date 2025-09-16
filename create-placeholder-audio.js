#!/usr/bin/env node

// Simple script to create placeholder audio files for testing
// This creates silent MP3 files that can be used for testing the audio system

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create a minimal MP3 header for a 1-second silent file
// This is a very basic MP3 structure that most browsers will accept
const createSilentMp3 = (durationMs = 1000) => {
  // This is a minimal MP3 header for a silent file
  // In a real implementation, you'd want proper MP3 encoding
  const mp3Header = Buffer.from([
    0xFF, 0xFB, 0x90, 0x00, // MP3 frame header
    0x00, 0x00, 0x00, 0x00, // Silent data
    0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00
  ]);
  return mp3Header;
};

const audioFiles = [
  'background-music.mp3',
  'bet-sound.mp3',
  'win-sound.mp3',
  'lose-sound.mp3'
];

const audioDir = path.join(__dirname, 'public', 'audio');

console.log('Creating placeholder audio files...');

audioFiles.forEach(filename => {
  const filepath = path.join(audioDir, filename);
  const silentMp3 = createSilentMp3();
  
  fs.writeFileSync(filepath, silentMp3);
  console.log(`✓ Created ${filename}`);
});

console.log('\n🎵 Placeholder audio files created!');
console.log('⚠️  Note: These are silent placeholder files.');
console.log('📁 Replace them with real audio files in /public/audio/');
console.log('🔊 The audio system will work, but you won\'t hear any sounds until you add real audio files.');
