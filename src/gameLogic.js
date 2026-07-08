import Game from './classes/Game.js'
import { renderTiles, forceRecreateTiles } from './modules/renderer.js'
import { setupKeyboardControls, setupTouchControls } from './modules/controller.js'
import { createConfetti } from './modules/confetti.js'

const game = new Game()
let tileList = new Map()
let isAnimating = false

const gameField = document.getElementById('gameField')
const gameTiles = document.getElementById('gameTiles')
const gameOverlay = document.getElementById('gameOverlay')
const overlayTitle = document.getElementById('overlayTitle')
const finalScore = document.getElementById('finalScore')
const restartBtn = document.getElementById('restartBtn')
const continueBtn = document.getElementById('continueBtn')

// === ДВИЖЕНИЕ ===
async function handleMove(direction) {
    if (isAnimating || game.gameOver) return

    isAnimating = true
    const moved = game.move(direction)

    if (moved) {
        renderTiles(game, tileList)
        gameField.classList.remove('move-flash')
        void gameField.offsetWidth
        gameField.classList.add('move-flash')
    }

    isAnimating = false
}

// === УПРАВЛЕНИЕ ===
setupKeyboardControls(handleMove)
setupTouchControls(handleMove)

// === КНОПКИ ===
document.querySelector('.btn-new-game').addEventListener('click', () => {
    if (game.newGame()) {
        gameTiles.innerHTML = ''
        tileList.clear()
        gameOverlay.classList.remove('active')
        continueBtn.style.display = 'none'
        renderTiles(game, tileList)
    }
})

restartBtn.addEventListener('click', () => {
    document.querySelector('.btn-new-game').click()
})

continueBtn.addEventListener('click', () => {
    game.continueGame()
    gameOverlay.classList.remove('active')
    continueBtn.style.display = 'none'
    renderTiles(game, tileList)
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
    setTimeout(() => {
        overlayTitle.textContent = '💥 Игра окончена!'
        finalScore.textContent = e.detail.score
        continueBtn.style.display = 'none'
        gameOverlay.classList.add('active')
        createConfetti()
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
    }, 300)
})

window.addEventListener('gameContinued', () => {
    renderTiles(game, tileList)
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
    renderTiles(game, tileList)
    
    if (game.continueAfterWin) {
        continueBtn.style.display = 'none'
    }
}

window.addEventListener('load', () => {
    setTimeout(() => {
        forceRecreateTiles(game, tileList)
    }, 100)
})