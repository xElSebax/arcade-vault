const SOUND_PATHS = {
  bounce: "/games/arkanoid/sounds/ball-bounce.mp3",
  break: "/games/arkanoid/sounds/break-sound.mp3",
} as const;

export type ArkanoidSoundId = keyof typeof SOUND_PATHS;

const templates: Partial<Record<ArkanoidSoundId, HTMLAudioElement>> = {};

export function loadSounds(): void {
  for (const [id, src] of Object.entries(SOUND_PATHS) as [
    ArkanoidSoundId,
    string,
  ][]) {
    if (templates[id]) continue;
    const audio = new Audio(src);
    audio.preload = "auto";
    templates[id] = audio;
  }
}

export function playSound(id: ArkanoidSoundId): void {
  const template = templates[id];
  if (!template) return;

  const clone = template.cloneNode(true) as HTMLAudioElement;
  clone.play().catch(() => {
    // Browsers may block audio until the player interacts with the page.
  });
}

export function unlockSounds(): void {
  for (const audio of Object.values(templates)) {
    if (!audio) continue;
    audio
      .play()
      .then(() => {
        audio.pause();
        audio.currentTime = 0;
      })
      .catch(() => {});
  }
}

export function disposeSounds(): void {
  for (const key of Object.keys(templates)) {
    delete templates[key as ArkanoidSoundId];
  }
}
