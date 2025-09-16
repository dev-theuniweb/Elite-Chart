import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create longer placeholder MP3 files with proper headers and realistic durations
function createLongerPlaceholderMP3(filename, durationSeconds) {
  // MP3 frame header for 44.1kHz, 128kbps, stereo
  const mp3Header = Buffer.from([
    0xFF, 0xFB, 0x90, 0x00, // MP3 sync word and header
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
  ]);
  
  // Calculate approximate number of frames needed for the duration
  // At 44.1kHz with typical frame size, roughly 38 frames per second
  const framesNeeded = Math.ceil(durationSeconds * 38);
  
  // Create a buffer with multiple MP3 frames
  const frameSize = 384; // Typical MP3 frame size at 128kbps
  const totalSize = framesNeeded * frameSize;
  const audioData = Buffer.alloc(totalSize);
  
  // Fill with MP3 frame headers repeated
  for (let i = 0; i < framesNeeded; i++) {
    const offset = i * frameSize;
    mp3Header.copy(audioData, offset);
    
    // Fill the rest of the frame with silence/minimal data
    for (let j = mp3Header.length; j < frameSize && (offset + j) < totalSize; j++) {
      audioData[offset + j] = 0x00;
    }
  }
  
  return audioData;
}

// Create audio directory if it doesn't exist
const audioDir = path.join(__dirname, 'public', 'audio');
if (!fs.existsSync(audioDir)) {
  fs.mkdirSync(audioDir, { recursive: true });
}

// Create longer placeholder files
const audioFiles = [
  { name: 'background-music.mp3', duration: 220 }, // 2 minutes of background music
  { name: 'bet-sound.mp3', duration: 2 },          // 2 seconds for bet sound
  { name: 'win-sound.mp3', duration: 3 },          // 3 seconds for win sound  
  { name: 'lose-sound.mp3', duration: 2 }          // 2 seconds for lose sound
];

console.log('Creating longer placeholder audio files...');

audioFiles.forEach(file => {
  const audioData = createLongerPlaceholderMP3(file.name, file.duration);
  const filePath = path.join(audioDir, file.name);
  
  fs.writeFileSync(filePath, audioData);
  console.log(`✅ Created ${file.name} (${file.duration}s, ${audioData.length} bytes)`);
});

console.log('\n🎵 Longer placeholder audio files created successfully!');
console.log('📁 Files are located in: public/audio/');
console.log('🔄 Refresh your browser to use the new longer audio files.');
