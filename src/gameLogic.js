import Game from './classes/Game.js'
import { renderTiles, updateTileSizes, ANIMATION_DURATION } from './modules/renderer.js'
import { setupKeyboardControls, setupTouchControls, setupButtonRipples } from './modules/controller.js'
import { createConfetti } from './modules/confetti.js'
import { setupResizeHandler } from './modules/resizeHandler.js'
import { playMove, playMerge, playNewTile, playGameOver, playWin, playRecord, playButtonClick, setSoundEnabled, isSoundEnabled } from './modules/sound.js'

const game = new Game()
let tileList = new Map()
let isAnimating = false
let gameTimer = null

const gameField = document.getElementById('gameField')
const gameTiles = document.getElementById('gameTiles')
const gameOverlay = document.getElementById('gameOverlay')
const overlayTitle = document.getElementById('overlayTitle')
const finalScore = document.getElementById('finalScore')
const restartBtn = document.getElementById('restartBtn')
const continueBtn = document.getElementById('continueBtn')
const movesCount = document.querySelector('.moves-count')
const timeCount = document.querySelector('.time-count')
const themeToggle = document.querySelector('.theme-toggle')
const soundToggle = document.querySelector('.sound-toggle')

// === ДВИЖЕНИЕ ===
async function handleMove(direction) {
    if (isAnimating || game.gameOver) return

    isAnimating = true
    const result = game.move(direction)

    if (result.moved) {
        playMove()
        renderTiles(game, tileList, result.moveInfo)
        gameField.classList.remove('move-flash')
        void gameField.offsetWidth
        gameField.classList.add('move-flash')
        
        // Wait for all animations to complete (including merge 2-phase animation)
        const extraWait = result.moveInfo && result.moveInfo.merged.length > 0 ? ANIMATION_DURATION : 0
        await new Promise(resolve => setTimeout(resolve, ANIMATION_DURATION + extraWait + 50))
        
        // Play merge sound if there were merges
        if (result.moveInfo && result.moveInfo.merged.length > 0) {
            playMerge()
            // Play record sound if record was broken
            if (result.recordBroken) {
                playRecord()
            }
        } else {
            playNewTile()
        }
        
        updateStats()
    }

    isAnimating = false
}

// === STATS ===
function updateStats() {
    if (movesCount) movesCount.textContent = game.moves
    if (timeCount) {
        const elapsed = game.getElapsedTime()
        const minutes = Math.floor(elapsed / 60000)
        const seconds = Math.floor((elapsed % 60000) / 1000)
        timeCount.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    }
}

function startTimer() {
    if (gameTimer) clearInterval(gameTimer)
    gameTimer = setInterval(updateStats, 1000)
}

function stopTimer() {
    if (gameTimer) clearInterval(gameTimer)
}

// === THEME & SOUND ===
function initTheme() {
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme === 'light') {
        document.body.classList.add('light-theme')
        updateThemeIcon(true)
    } else {
        document.body.classList.remove('light-theme')
        updateThemeIcon(false)
    }
}

function toggleTheme() {
    const isLight = document.body.classList.toggle('light-theme')
    localStorage.setItem('theme', isLight ? 'light' : 'dark')
    updateThemeIcon(isLight)
    playButtonClick()
}

function updateThemeIcon(isLight) {
    if (themeToggle) {
        themeToggle.textContent = isLight ? '☀️' : '🌙'
        themeToggle.title = isLight ? 'Светлая тема' : 'Темная тема'
    }
}

function initSound() {
    const savedSound = localStorage.getItem('soundEnabled')
    const enabled = savedSound !== 'false'
    setSoundEnabled(enabled)
    updateSoundIcon(enabled)
}

function toggleSound() {
    const enabled = !isSoundEnabled()
    setSoundEnabled(enabled)
    localStorage.setItem('soundEnabled', enabled)
    updateSoundIcon(enabled)
    if (enabled) playButtonClick()
}

function updateSoundIcon(enabled) {
    if (soundToggle) {
        soundToggle.textContent = enabled ? '🔊' : '🔇'
        soundToggle.title = enabled ? 'Звук включен' : 'Звук выключен'
    }
}

if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme)
}

if (soundToggle) {
    soundToggle.addEventListener('click', toggleSound)
}

// === УПРАВЛЕНИЕ ===
setupKeyboardControls(handleMove)
setupTouchControls(handleMove)
setupButtonRipples()
setupResizeHandler(game, tileList, updateTileSizes)

// === КНОПКИ ===
document.querySelector('.btn-new-game').addEventListener('click', () => {
    playButtonClick()
    if (game.newGame()) {
        gameTiles.innerHTML = ''
        tileList.clear()
        gameOverlay.classList.remove('active')
        continueBtn.style.display = 'none'
        renderTiles(game, tileList)
        updateStats()
        startTimer()
    }
})

restartBtn.addEventListener('click', () => {
    playButtonClick()
    document.querySelector('.btn-new-game').click()
})

continueBtn.addEventListener('click', () => {
    playButtonClick()
    game.continueGame()
    gameOverlay.classList.remove('active')
    continueBtn.style.display = 'none'
    renderTiles(game, tileList)
    updateStats()
})

// === ИНДИКАТОР СОХРАНЕНИЯ ===
const saveIndicator = document.getElementById('saveIndicator')
let saveTimeout = null

window.addEventListener('gameSaved', () => {
    saveIndicator.textContent = '💾 Сохранено'
    saveIndicator.classList.add('show')

    if (saveTimeout) clearTimeout(saveTimeout)
    saveTimeout = setTimeout(() => {
        saveIndicator.classList.remove('show')
        saveTimeout = null
    }, 1200)
})

// === КОНЕЦ ИГРЫ ===
window.addEventListener('gameOver', (e) => {
    stopTimer()
    setTimeout(() => {
        overlayTitle.textContent = '💥 Игра окончена!'
        finalScore.textContent = e.detail.score
        continueBtn.style.display = 'none'
        gameOverlay.classList.add('active')
        createConfetti()
        playGameOver()
    }, 300)
})

// === ПОБЕДА ===
window.addEventListener('gameWon', () => {
    setTimeout(() => {
        overlayTitle.textContent = '🎉 Победа! Вы собрали 2048!'
        finalScore.textContent = game.score
        continueBtn.style.display = 'block'
        gameOverlay.classList.add('active')
        createConfetti()
        playWin()
    }, 300)
})

window.addEventListener('gameContinued', () => {
    renderTiles(game, tileList)
    updateStats()
})

// === RECORD BROKEN ===
window.addEventListener('recordBroken', (e) => {
    const maxScoreEl = document.querySelector('.maxScore')
    if (maxScoreEl) {
        maxScoreEl.textContent = e.detail.score
        maxScoreEl.classList.remove('record-pop')
        void maxScoreEl.offsetWidth
        maxScoreEl.classList.add('record-pop')
    }
})

// === СТАРТ ===
export default function start() {
    if (document.readyState === 'complete') {
        initGame()
    } else {
        window.addEventListener('load', initGame)
    }
}

function initGame() {
    initTheme()
    initSound()
    renderTiles(game, tileList)
    updateStats()
    startTimer()
    
    if (game.continueAfterWin) {
        continueBtn.style.display = 'none'
    }
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    stopTimer()
})