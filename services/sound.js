// NOTE: expo-audio uses imperative API via AudioModule.AudioPlayer in this version (Alpha)
// We cannot use hooks here because this is a background service file.
import { AudioModule } from 'expo-audio';

let ringtonePlayer = null;

export async function playRingtone() {
  if (ringtonePlayer) {
    if (ringtonePlayer.playing) return;
    ringtonePlayer.play();
    return;
  }

  try {
    // AudioModule.AudioPlayer is the constructor
    // (source, updateInterval, keepAudioSessionActive)
    ringtonePlayer = new AudioModule.AudioPlayer(
      require('../assets/sounds/booking.wav'), 
      100, 
      true
    );
    
    // Set looping
    ringtonePlayer.isLooping = true;
    
    // Play
    ringtonePlayer.play();
    
    console.log("Ringtone playing via expo-audio");
    
  } catch (err) {
    console.error("Failed to play ringtone:", err);
    ringtonePlayer = null;
  }
}

export async function stopRingtone() {
  if (ringtonePlayer) {
    ringtonePlayer.pause(); // or stop if available, Alpha API is limited
    ringtonePlayer = null;
  }
}