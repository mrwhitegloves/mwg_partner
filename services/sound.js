import { Audio } from 'expo-av';

let soundObject = null;
let isLoading = false; // Prevent concurrent loads

// Configure audio mode to ensure playback works as expected
async function ensureAudioMode() {
  try {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
      staysActiveInBackground: true,
    });
  } catch (e) {
    console.warn("Failed to set audio mode", e);
  }
}

export async function playRingtone() {
  if (isLoading) return; // Already loading, ignore duplicate trigger
  
  await ensureAudioMode();

  // Check existing sound
  if (soundObject) {
    try {
      const status = await soundObject.getStatusAsync();
      if (status.isLoaded) {
        if (status.isPlaying) return;
        await soundObject.replayAsync();
        return;
      }
    } catch (e) {
      console.warn("Sound object invalid, recreating...", e);
      try { await soundObject.unloadAsync(); } catch(err){}
      soundObject = null;
    }
  }

  try {
    isLoading = true;
    console.log("Loading ringtone via expo-av...");
    const { sound } = await Audio.Sound.createAsync(
      require('../assets/sounds/booking.wav'),
      { shouldPlay: true, isLooping: true }
    );
    soundObject = sound;
    console.log("Ringtone playing via expo-av");
  } catch (err) {
    console.error("Failed to play ringtone:", err);
    // Cleanup if partially created
    if (soundObject) {
        try { await soundObject.unloadAsync(); } catch(e){}
        soundObject = null;
    }
  } finally {
    isLoading = false;
  }
}

export async function stopRingtone() {
  if (soundObject) {
    try {
      await soundObject.stopAsync();
      await soundObject.unloadAsync();
    } catch (e) {
      console.warn("Error stopping ringtone (cleanup ignored)", e);
    }
    soundObject = null;
  }
}