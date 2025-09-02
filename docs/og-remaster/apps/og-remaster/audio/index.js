/**
 * Simple audio bus: loads audio files and plays them on demand. This is a
 * minimal loader; a more robust system could pool Audio elements and
 * provide channel-based mixing. Audio files should be placed in
 * apps/og-remaster/audio/<filename> relative to this module.
 */
export class AudioBus {
    constructor() {
        this.bank = new Map();
    }
    /**
     * Preload a list of audio files. Returns a promise once all are
     * sufficiently loaded.
     */
    async load(list) {
        await Promise.all(list.map(async (file) => {
            const audio = new Audio(`./audio/${file}`);
            audio.preload = "auto";
            this.bank.set(file, audio);
        }));
    }
    /**
     * Play a named clip at the given volume. Resets playback position
     * so consecutive calls retrigger the sound.
     */
    play(name, volume = 1) {
        const clip = this.bank.get(name);
        if (!clip)
            return;
        clip.volume = volume;
        clip.currentTime = 0;
        clip.play();
    }
}
