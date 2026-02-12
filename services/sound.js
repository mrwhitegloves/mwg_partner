import { Audio } from "expo-audio";

let ringtoneSound = null;

export async function playRingtone() {
  if (ringtoneSound) return;
  const { sound } = await Audio.Sound.createAsync(
    require("../assets/sounds/booking.wav"),
    { isLooping: true },
  );
  ringtoneSound = sound;
  await sound.playAsync();
}
export async function stopRingtone() {
  if (ringtoneSound) {
    await ringtoneSound.stopAsync();
    await ringtoneSound.unloadAsync();
    ringtoneSound = null;
  }
}
