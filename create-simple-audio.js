import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create a simple WAV file with a basic tone
function createSimpleWav(durationSeconds, frequency = 440) {
  const sampleRate = 44100;
  const samples = sampleRate * durationSeconds;
  const channels = 1;
  const bitsPerSample = 16;
  
  // WAV header
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + samples * 2, 4);
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
  header.writeUInt32LE(samples * 2, 40);
  
  // Generate audio data (simple sine wave)
  const audioData = Buffer.alloc(samples * 2);
  for (let i = 0; i < samples; i++) {
    const amplitude = Math.sin((2 * Math.PI * frequency * i) / sampleRate) * 0.1; // Low volume
    const sample = Math.round(amplitude * 32767);
    audioData.writeInt16LE(sample, i * 2);
  }
  
  return Buffer.concat([header, audioData]);
}

// Create audio directory if it doesn't exist
const audioDir = path.join(__dirname, 'public', 'audio');
if (!fs.existsSync(audioDir)) {
  fs.mkdirSync(audioDir, { recursive: true });
}

console.log('Creating simple WAV audio files...');

// Create different tones for different sounds
const audioFiles = [
  { name: 'background-music.wav', duration: 10, frequency: 220 },  // Low tone for background
  { name: 'bet-sound.wav', duration: 0.5, frequency: 800 },        // Sharp beep for bet
  { name: 'win-sound.wav', duration: 1.5, frequency: 1000 },       // High tone for win
  { name: 'lose-sound.wav', duration: 1, frequency: 200 }          // Low tone for lose
];

audioFiles.forEach(file => {
  const audioData = createSimpleWav(file.duration, file.frequency);
  const filePath = path.join(audioDir, file.name);
  
  fs.writeFileSync(filePath, audioData);
  console.log(`✅ Created ${file.name} (${file.duration}s, ${file.frequency}Hz, ${audioData.length} bytes)`);
});

console.log('\n🎵 Simple WAV audio files created successfully!');
console.log('📁 Files are located in: public/audio/');
console.log('🔄 Update your audio file paths to use .wav instead of .mp3');
