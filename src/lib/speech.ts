// Vorlesen mit der deutschen Stimme des iPhones (Web Speech, funktioniert auch offline).

export function canSpeak(): boolean {
  return typeof speechSynthesis !== 'undefined';
}

export function speak(text: string): void {
  if (!canSpeak()) return;
  speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'de-DE';
  const voice = speechSynthesis.getVoices().find((v) => v.lang.startsWith('de'));
  if (voice) utterance.voice = voice;
  speechSynthesis.speak(utterance);
}

export function stopSpeaking(): void {
  if (canSpeak()) speechSynthesis.cancel();
}
