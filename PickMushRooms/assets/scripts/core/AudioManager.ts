export type AudioCue = 'tap' | 'remove_layer' | 'pick_mushroom' | 'level_complete';

export class AudioManager {
  readonly playedCues: AudioCue[] = [];

  play(cue: AudioCue): void {
    this.playedCues.push(cue);
  }
}
