/**
 * Voice splitting helpers and prompt presets
 */

export const SAMPLE_VOICE_PROMPTS = [
  "I had biryani, Rohan and I shared paneer tikka, Priya had cold coffee, Kabir had lime soda.",
  "Maine biryani khayi, Rohan and I shared paneer tikka, Priya had cold coffee, Kabir had lime soda.",
  "Cold coffee was Priya's, Kabir took lime soda, and Rohan and I shared both biryani and paneer tikka.",
  "Split paneer tikka equally between all of us, biryani was mine.",
];

/**
 * Checks if browser has native speech recognition
 */
export function checkSpeechSupport() {
  if (typeof window === 'undefined') return false;
  return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
}
