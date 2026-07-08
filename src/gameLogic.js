import Game from './classes/Game.js'

const game = new Game()
let tileList = new Map()
let isAnimating = false
let zIndexCounter = 100

const currentScore = document.querySelector('.currentScore')
const maxScore = document.querySelector('.maxScore')
const gameTiles = document.getElementById('gameTiles')
const gameField = document.getElementById('gameField')
const gameOverlay = document.getElementById('gameOverlay')
const overlayTitle = document.getElementById('overlayTitle')
const finalScore = document.getElementById('finalScore')
const restartBtn = document.getElementById('restartBtn')

function updateTileSizes() {
    game.styleTable = Game.generateStyleTable(game.tileCount, game.tileSize)
    
    for (const [id, data] of tileList) {
        const { tile, x, y } = data
        const el = data.el
        const newStyle = game.styleTable[`${x}-${y}`]
        if (el.style.cssText !== newStyle) {
            el.style.cssText = newStyle
        }
    }
}

function createTileElement(tile) {
    const el = document.createElement('div')
    el.className = `tile tile-${tile.value}`
    el.textContent = tile.value
    el.style.cssText = game.styleTable[`${tile.x}-${tile.y}`]
    el.style.zIndex = zIndexCounter++
    el.dataset.id = tile.id
    
    if (tile.isNew) {
        el.classList.add('tile-new')
        setTimeout(() => el.classList.remove('tile-new'), 300)
    }
    
    if (tile.isMerged) {
        el.classList.add('tile-merged')
        el.style.zIndex = zIndexCounter++
        setTimeout(() => el.classList.remove('tile-merged'), 350)
    }
    
    return el
}

function renderTiles() {
    const tiles = game.getTiles()
    const currentIds = new Set()
    const tilesToKeep = new Map()
    
    for (let y = 0; y < tiles.length; y++) {
        for (let x = 0; x < tiles[y].length; x++) {
            const tile = tiles[y][x]
            if (tile) {
                currentIds.add(tile.id)
                tilesToKeep.set(tile.id, { tile, x, y })
            }
        }
    }
    
    for (const [id, data] of tileList) {
        if (!currentIds.has(id)) {
            const el = data.el
            el.style.transition = 'transform 0.15s ease-out, opacity 0.15s ease-out'
            el.style.transform = 'scale(0.8)'
            el.style.opacity = '0'
            setTimeout(() => {
                if (el.parentNode) el.remove()
            }, 150)
            tileList.delete(id)
        }
    }
    
    for (const [id, data] of tilesToKeep) {
        const { tile, x, y } = data
        let existing = tileList.get(id)
        
        if (!existing) {
            const el = createTileElement(tile)
            gameTiles.appendChild(el)
            
            if (tile.isNew) {
                el.style.transform = 'scale(0)'
                requestAnimationFrame(() => {
                    el.style.transition = 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)'
                    el.style.transform = 'scale(1)'
                })
            }
            
            tileList.set(id, { el, x, y, tile })
        } else {
            const el = existing.el
            const newPos = game.styleTable[`${x}-${y}`]
            
            if (el.style.cssText !== newPos) {
                el.style.cssText = newPos
            }
            
            if (el.textContent != tile.value) {
                el.textContent = tile.value
                el.className = `tile tile-${tile.value}`
                
                if (tile.isMerged) {
                    el.classList.add('tile-merged')
                    el.style.zIndex = zIndexCounter++
                    el.style.transform = 'scale(1.2)'
                    setTimeout(() => {
                        el.style.transition = 'transform 0.15s'
                        el.style.transform = 'scale(1)'
                        setTimeout(() => el.classList.remove('tile-merged'), 300)
                    }, 50)
                }
                
                if (tile.isNew) {
                    el.classList.add('tile-new')
                    setTimeout(() => el.classList.remove('tile-new'), 300)
                }
            }
            
            existing.x = x
            existing.y = y
            existing.tile = tile
        }
    }
    
    const oldScore = parseInt(currentScore.textContent)
    if (oldScore !== game.score) {
        currentScore.textContent = game.score
        currentScore.classList.remove('score-pop')
        void currentScore.offsetWidth
        currentScore.classList.add('score-pop')
    }
    
    if (game.score === game.maxScore && game.score > 0) {
        maxScore.textContent = game.maxScore
        maxScore.classList.remove('record-pop')
        void maxScore.offsetWidth
        maxScore.classList.add('record-pop')
    }
    maxScore.textContent = game.maxScore
}

async function handleMove(direction) {
    if (isAnimating || game.gameOver) return
    
    isAnimating = true
    const moved = game.move(direction)
    
    if (moved) {
        renderTiles()
        gameField.classList.remove('move-flash')
        void gameField.offsetWidth
        gameField.classList.add('move-flash')
    }
    
    isAnimating = false
}

// === ОБРАБОТЧИК ИЗМЕНЕНИЯ РАЗМЕРА ===
let resizeTimeout = null
window.addEventListener('resize', () => {
    if (resizeTimeout) clearTimeout(resizeTimeout)
    resizeTimeout = setTimeout(() => {
        updateTileSizes()
        resizeTimeout = null
    }, 100)
})

// === EVENTS ===
document.addEventListener('keydown', (e) => {
    const keyMap = {
        'ArrowLeft': 'left',
        'ArrowRight': 'right',
        'ArrowUp': 'up',
        'ArrowDown': 'down'
    }
    if (keyMap[e.key]) {
        e.preventDefault()
        handleMove(keyMap[e.key])
    }
})

let touchStartX = 0
let touchStartY = 0
let isSwiping = false

document.addEventListener('touchstart', (e) => {
    const touch = e.touches[0]
    touchStartX = touch.clientX
    touchStartY = touch.clientY
    isSwiping = false
}, { passive: true })

document.addEventListener('touchmove', (e) => {
    const touch = e.touches[0]
    const dx = touch.clientX - touchStartX
    const dy = touch.clientY - touchStartY
    
    if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
        isSwiping = true
    }
    e.preventDefault()
}, { passive: false })

document.addEventListener('touchend', (e) => {
    if (!isSwiping || touchStartX === 0) return
    
    const touch = e.changedTouches[0]
    const dx = touch.clientX - touchStartX
    const dy = touch.clientY - touchStartY
    
    if (Math.abs(dx) < 30 && Math.abs(dy) < 30) return
    
    let direction
    if (Math.abs(dx) > Math.abs(dy)) {
        direction = dx > 0 ? 'right' : 'left'
    } else {
        direction = dy > 0 ? 'down' : 'up'
    }
    
    handleMove(direction)
    touchStartX = 0
    touchStartY = 0
    isSwiping = false
}, { passive: true })

// === BUTTONS ===
document.querySelector('.btn-new-game').addEventListener('click', () => {
    if (game.newGame()) {
        for (const [id, data] of tileList) {
            data.el.remove()
        }
        tileList.clear()
        zIndexCounter = 100
        gameOverlay.classList.remove('active')
        renderTiles()
    }
})

restartBtn.addEventListener('click', () => {
    document.querySelector('.btn-new-game').click()
})

// === SAVE INDICATOR ===
const saveIndicator = document.getElementById('saveIndicator')
let saveTimeout = null

window.addEventListener('gameSaved', () => {
    saveIndicator.textContent = 'Сохранено'
    saveIndicator.classList.add('show')
    
    if (saveTimeout) clearTimeout(saveTimeout)
    saveTimeout = setTimeout(() => {
        saveIndicator.classList.remove('show')
        saveTimeout = null
    }, 1200)
})

// === GAME OVER ===
window.addEventListener('gameOver', (e) => {
    setTimeout(() => {
        overlayTitle.textContent = 'Игра окончена!'
        finalScore.textContent = e.detail.score
        gameOverlay.classList.add('active')
        createConfetti()
    }, 300)
})

// === WIN ===
window.addEventListener('gameWon', () => {
    setTimeout(() => {
        overlayTitle.textContent = 'Победа! Вы собрали 2048!'
        finalScore.textContent = game.score
        gameOverlay.classList.add('active')
        createConfetti()
    }, 300)
})

// === CONFETTI ===
function createConfetti() {
    const oldContainer = document.querySelector('.confetti-container')
    if (oldContainer) oldContainer.remove()
    
    const container = document.createElement('div')
    container.className = 'confetti-container'
    document.body.appendChild(container)
    
    const colors = ['#ff6b6b', '#feca57', '#48dbfb', '#1dd1a1', '#a29bfe', '#fd79a8', '#ffd700', '#ff4757']
    const isMobile = window.innerWidth < 500
    const count = isMobile ? 25 : 50
    
    for (let i = 0; i < count; i++) {
        const el = document.createElement('div')
        el.className = 'confetti'
        
        const size = Math.random() * 8 + 4
        el.style.cssText = `
            left: ${Math.random() * 100}%;
            width: ${size}px;
            height: ${size}px;
            background: ${colors[Math.floor(Math.random() * colors.length)]};
            animation-duration: ${Math.random() * 2 + 1.5}s;
            animation-delay: ${Math.random() * 0.8}s;
            border-radius: ${Math.random() > 0.5 ? '50%' : '2px'};
            transform: rotate(${Math.random() * 360}deg);
        `
        container.appendChild(el)
    }
    
    setTimeout(() => {
        if (container.parentNode) container.remove()
    }, 4500)
}

// === START ===
export default function start() {
    renderTiles()
}

window.addEventListener('load', start)