// Sound module using Web Audio API
class SoundManager {
    constructor() {
        this.audioContext = null
        this.enabled = true
        this.masterGain = null
        this.initAudioContext()
    }

    initAudioContext() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)()
            this.masterGain = this.audioContext.createGain()
            this.masterGain.connect(this.audioContext.destination)
            this.masterGain.gain.value = 0.3
        } catch (e) {
            console.warn('Web Audio API not supported:', e)
        }
    }

    async ensureAudioContext() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            await this.audioContext.resume()
        }
    }

    playTone(frequency, duration, type = 'sine', gain = 0.3) {
        if (!this.enabled || !this.audioContext) return

        this.ensureAudioContext()

        const oscillator = this.audioContext.createOscillator()
        const gainNode = this.audioContext.createGain()

        oscillator.type = type
        oscillator.frequency.value = frequency
        oscillator.connect(gainNode)
        gainNode.connect(this.masterGain)

        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime)
        gainNode.gain.linearRampToValueAtTime(gain, this.audioContext.currentTime + 0.01)
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration)

        oscillator.start(this.audioContext.currentTime)
        oscillator.stop(this.audioContext.currentTime + duration)
    }

    playMove() {
        // Pleasant move sound
        this.playTone(523.25, 0.1, 'sine', 0.15) // C5
        setTimeout(() => this.playTone(659.25, 0.1, 'sine', 0.1), 50) // E5
    }

    playMerge() {
        // Satisfying merge sound
        this.playTone(783.99, 0.15, 'triangle', 0.2) // G5
        setTimeout(() => this.playTone(1046.5, 0.15, 'triangle', 0.15), 80) // C6
        setTimeout(() => this.playTone(1318.5, 0.2, 'triangle', 0.1), 160) // E6
    }

    playNewTile() {
        // Soft pop for new tile
        this.playTone(1046.5, 0.08, 'sine', 0.1) // C6
    }

    playGameOver() {
        // Descending tone for game over
        const notes = [523.25, 493.88, 440, 392, 349.23] // C5 B4 A4 G4 F4
        notes.forEach((freq, i) => {
            setTimeout(() => this.playTone(freq, 0.3, 'sawtooth', 0.15), i * 150)
        })
    }

    playWin() {
        // Victory fanfare
        const notes = [
            { freq: 523.25, delay: 0 },   // C5
            { freq: 659.25, delay: 100 }, // E5
            { freq: 783.99, delay: 200 }, // G5
            { freq: 1046.5, delay: 300 }, // C6
            { freq: 1318.5, delay: 400 }, // E6
            { freq: 1567.98, delay: 500 }, // G6
        ]
        notes.forEach(note => {
            setTimeout(() => this.playTone(note.freq, 0.4, 'triangle', 0.15), note.delay)
        })
    }

    playRecord() {
        // Special record broken sound
        this.playTone(880, 0.2, 'square', 0.2) // A5
        setTimeout(() => this.playTone(1108.73, 0.2, 'square', 0.15), 100) // C#6
        setTimeout(() => this.playTone(1396.91, 0.3, 'square', 0.1), 200) // F6
    }

    playUndo() {
        // Reverse sound
        this.playTone(659.25, 0.1, 'sine', 0.15) // E5
        setTimeout(() => this.playTone(523.25, 0.1, 'sine', 0.1), 50) // C5
    }

    playButtonClick() {
        this.playTone(800, 0.05, 'sine', 0.1)
    }

    setEnabled(enabled) {
        this.enabled = enabled
        if (!enabled && this.audioContext) {
            this.audioContext.suspend()
        }
    }

    isEnabled() {
        return this.enabled
    }
}

export const soundManager = new SoundManager()

export function playMove() { soundManager.playMove() }
export function playMerge() { soundManager.playMerge() }
export function playNewTile() { soundManager.playNewTile() }
export function playGameOver() { soundManager.playGameOver() }
export function playWin() { soundManager.playWin() }
export function playRecord() { soundManager.playRecord() }
export function playUndo() { soundManager.playUndo() }
export function playButtonClick() { soundManager.playButtonClick() }
export function setSoundEnabled(enabled) { soundManager.setEnabled(enabled) }
export function isSoundEnabled() { return soundManager.isEnabled() }