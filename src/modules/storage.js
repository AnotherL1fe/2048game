const STORAGE_KEY = 'game2048_state'
const MAX_SCORE_KEY = 'maxScore'

export function saveGameState(gameData) {
    try {
        const data = {
            maxScore: gameData.maxScore || 0,
            score: gameData.score || 0,
            tiles: gameData.tiles.map(row => 
                row.map(tile => tile ? { 
                    value: tile.value, 
                    id: tile.id, 
                    x: tile.x, 
                    y: tile.y 
                } : null)
            ),
            moves: gameData.moves || 0,
            gameOver: gameData.gameOver || false,
            won: gameData.won || false,
            timestamp: Date.now()
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
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
        
        const data = JSON.parse(saved)
        return {
            maxScore: data.maxScore || 0,
            score: data.score || 0,
            moves: data.moves || 0,
            gameOver: data.gameOver || false,
            won: data.won || false,
            tiles: data.tiles.map(row => 
                row.map(tileData => 
                    tileData ? { 
                        value: tileData.value, 
                        id: tileData.id, 
                        x: tileData.x, 
                        y: tileData.y 
                    } : null
                )
            )
        }
    } catch (e) {
        console.warn('Load error:', e)
        return null
    }
}

export function hasSavedGame() {
    return localStorage.getItem(STORAGE_KEY) !== null
}

export function clearSavedGame() {
    localStorage.removeItem(STORAGE_KEY)
}


export function saveMaxScore(maxScore) {
    try {
        localStorage.setItem(MAX_SCORE_KEY, String(maxScore))
        return true
    } catch (e) {
        console.warn('Save maxScore error:', e)
        return false
    }
}


export function loadMaxScore() {
    try {
        return parseInt(localStorage.getItem(MAX_SCORE_KEY)) || 0
    } catch (e) {
        return 0
    }
}


export function getLastSaveTime() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY)
        if (!saved) return null
        const data = JSON.parse(saved)
        return data.timestamp || null
    } catch (e) {
        return null
    }
}


export function getLastSaveTimeFormatted() {
    const timestamp = getLastSaveTime()
    if (!timestamp) return 'Никогда'
    
    const date = new Date(timestamp)
    return date.toLocaleString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    })
}