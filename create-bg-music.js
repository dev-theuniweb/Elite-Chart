import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create a longer WAV file with a pleasant background tone
function createLongerBackgroundMusic(durationSeconds) {
  const sampleRate = 44100;
  const samples = sampleRate * durationSeconds;
  const channels = 2; // Stereo for background music
  const bitsPerSample = 16;
  
  // WAV header
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + samples * 2 * channels, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * channels * bitsPerSample / 8, 28);
  header.writeUInt16LE(channels * bitsPerSample / 8, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write('data', 36);
  header.writeUInt32LE(samples * 2 * channels, 40);
  
  // Generate audio data (layered sine waves for ambient sound)
  const audioData = Buffer.alloc(samples * 2 * channels);
  
  for (let i = 0; i < samples; i++) {
    // Create a layered ambient sound with multiple frequencies
    const time = i / sampleRate;
    
    // Base frequency with slow modulation
    const freq1 = 220 + 20 * Math.sin(2 * Math.PI * 0.1 * time);
    const freq2 = 330 + 15 * Math.sin(2 * Math.PI * 0.07 * time);
    const freq3 = 440 + 10 * Math.sin(2 * Math.PI * 0.13 * time);
    
    // Create harmonious ambient waves
    const wave1 = Math.sin(2 * Math.PI * freq1 * time) * 0.03;
    const wave2 = Math.sin(2 * Math.PI * freq2 * time) * 0.02;
    const wave3 = Math.sin(2 * Math.PI * freq3 * time) * 0.015;
    
    // Add some gentle envelope variation
    const envelope = 0.5 + 0.3 * Math.sin(2 * Math.PI * 0.05 * time);
    
    const amplitude = (wave1 + wave2 + wave3) * envelope;
    const sample = Math.round(amplitude * 32767);
    
    // Write stereo samples
    audioData.writeInt16LE(sample, i * 4);     // Left channel
    audioData.writeInt16LE(sample, i * 4 + 2); // Right channel
  }
  
  return Buffer.concat([header, audioData]);
}

// Create audio directory if it doesn't exist
const audioDir = path.join(__dirname, 'public', 'audio');
if (!fs.existsSync(audioDir)) {
  fs.mkdirSync(audioDir, { recursive: true });
}

console.log('Creating longer background music...');

// Create a 30-second ambient background track
const duration = 30; // 30 seconds
const audioData = createLongerBackgroundMusic(duration);
const filePath = path.join(audioDir, 'background-music.mp3');

// Actually save as WAV since we're generating WAV format
const wavFilePath = path.join(audioDir, 'background-music-long.wav');
fs.writeFileSync(wavFilePath, audioData);

console.log(`✅ Created background-music-long.wav (${duration}s, ${audioData.length} bytes)`);
console.log('🎵 This is an ambient layered tone that should be pleasant for background music');
console.log('📁 File location: public/audio/background-music-long.wav');
console.log('🔄 You can rename this to background-music.mp3 or update the code to use .wav');
