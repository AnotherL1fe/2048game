const STORAGE_KEY = 'game2048_state'
const MAX_SCORE_KEY = 'maxScore'

export function saveGameState(gameData) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(gameData))
        localStorage.setItem(MAX_SCORE_KEY, String(gameData.maxScore || 0))
        window.dispatchEvent(new CustomEvent('gameSaved'))
        return true
    } catch (e) {
        console.warn('Save error:', e)
        return false
    }
}

export function loadGameState() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY)
        if (!saved) return null
        return JSON.parse(saved)
    } catch (e) {
        console.warn('Load error:', e)
        return null
    }
}

export function loadMaxScore() {
    try {
        return parseInt(localStorage.getItem(MAX_SCORE_KEY)) || 0
    } catch (e) {
        return 0
    }
}

export function saveMaxScore(maxScore) {
    try {
        localStorage.setItem(MAX_SCORE_KEY, String(maxScore))
        return true
    } catch (e) {
        return false
    }
}