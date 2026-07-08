let zIndexCounter = 100
export const ANIMATION_DURATION = 200 // ms

// Calculate cell size dynamically based on game field
function getCellSize() {
    const gameField = document.getElementById('gameField')
    if (!gameField) return { cellSize: 80, gap: 10 }
    
    const computedStyle = getComputedStyle(gameField)
    const padding = parseFloat(computedStyle.padding) || 10
    const width = gameField.clientWidth - padding * 2
    const gap = 10 // from CSS
    const cellSize = (width - gap * 3) / 4
    
    return { cellSize, gap }
}

let cachedCellSize = null

function getTilePosition(x, y) {
    const { cellSize, gap } = getCellSize()
    const offset = cellSize + gap
    return {
        x: x * offset,
        y: y * offset
    }
}

function getTileSize() {
    if (cachedCellSize) return cachedCellSize
    const { cellSize } = getCellSize()
    cachedCellSize = cellSize
    return cellSize
}

export function createTileElement(tile) {
    const el = document.createElement('div')
    const pos = getTilePosition(tile.x, tile.y)
    const tileSize = getTileSize()
    
    el.className = `tile tile-${tile.value} visible`
    el.textContent = tile.value
    el.style.zIndex = zIndexCounter++
    el.dataset.id = tile.id
    el.style.width = `${tileSize}px`
    el.style.height = `${tileSize}px`
    
    // Set initial transform before appending to DOM
    if (tile.isNew) {
        el.style.transform = `translate(${pos.x}px, ${pos.y}px) scale(0)`
        el.style.opacity = '0'
    } else {
        el.style.transform = `translate(${pos.x}px, ${pos.y}px)`
        el.style.opacity = '1'
    }
    el.style.transition = `transform ${ANIMATION_DURATION}ms var(--transition-bounce), opacity ${ANIMATION_DURATION}ms ease`

    if (tile.isNew) {
        el.classList.add('tile-new')
        // Use requestAnimationFrame to ensure the initial state is applied before animation
        requestAnimationFrame(() => {
            el.style.transform = `translate(${pos.x}px, ${pos.y}px) scale(1)`
            el.style.opacity = '1'
        })
        setTimeout(() => el.classList.remove('tile-new'), 300)
    }

    if (tile.isMerged) {
        el.classList.add('tile-merged')
        el.style.zIndex = zIndexCounter++
        setTimeout(() => el.classList.remove('tile-merged'), 350)
    }

    return el
}

export function animateTileMove(el, fromX, fromY, toX, toY, isMerge = false) {
    const fromPos = getTilePosition(fromX, fromY)
    const toPos = getTilePosition(toX, toY)
    
    // Set initial position
    el.style.transition = 'none'
    el.style.transform = `translate(${fromPos.x}px, ${fromPos.y}px)`
    
    // Force reflow
    void el.offsetWidth
    
    // Animate to new position
    el.style.transition = `transform ${ANIMATION_DURATION}ms var(--transition-bounce)`
    el.style.transform = `translate(${toPos.x}px, ${toPos.y}px)`
    
    if (isMerge) {
        el.style.zIndex = zIndexCounter++
    }
}

export function animateTileMerge(el, x, y, newValue) {
    const pos = getTilePosition(x, y)
    el.style.transition = `transform ${ANIMATION_DURATION}ms var(--transition-bounce)`
    el.style.transform = `translate(${pos.x}px, ${pos.y}px) scale(1.2)`
    
    setTimeout(() => {
        el.style.transform = `translate(${pos.x}px, ${pos.y}px) scale(1)`
        // Update the tile's appearance after merge animation
        if (newValue !== undefined) {
            el.textContent = newValue
            // Update color class
            const colorClasses = el.className.split(' ').filter(c => !c.startsWith('tile-') && c !== 'visible')
            el.className = colorClasses.join(' ')
            el.classList.add(`tile-${newValue}`)
            el.classList.add('visible')
        }
    }, ANIMATION_DURATION)
}

export function animateNewTile(el, x, y) {
    const pos = getTilePosition(x, y)
    el.style.transition = 'none'
    el.style.transform = `translate(${pos.x}px, ${pos.y}px) scale(0)`
    
    void el.offsetWidth
    
    el.style.transition = `transform ${ANIMATION_DURATION}ms var(--transition-bounce)`
    el.style.transform = `translate(${pos.x}px, ${pos.y}px) scale(1)`
}

export function renderTiles(game, tileList, moveInfo = null) {
    const gameTiles = document.getElementById('gameTiles')
    const currentScore = document.querySelector('.currentScore')
    const maxScore = document.querySelector('.maxScore')
    
    if (!gameTiles) return
    
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

    // Handle removed tiles (merged tiles)
    for (const [id, data] of tileList) {
        if (!currentIds.has(id)) {
            const el = data.el
            el.style.transition = 'opacity 0.15s ease-out, transform 0.15s ease-out'
            el.style.transform += ' scale(0.8)'
            el.style.opacity = '0'
            setTimeout(() => {
                if (el.parentNode) el.remove()
            }, 150)
            tileList.delete(id)
        }
    }

    zIndexCounter = 100
    
    // If we have move info, animate the moves
    if (moveInfo) {
        // First, animate moved tiles (including tiles that will merge)
        for (const move of moveInfo.moved) {
            const existing = tileList.get(move.id)
            if (existing) {
                // Check if this tile will be merged (it's a source tile)
                const isMergeSource = moveInfo.merged.some(m => m.fromIds.includes(move.id))
                animateTileMove(existing.el, move.fromX, move.fromY, move.toX, move.toY, isMergeSource)
                existing.x = move.toX
                existing.y = move.toY
            }
        }
        
        // Then handle merged tiles - animate the target tile's merge effect
for (const merge of moveInfo.merged) {
            const existing = tileList.get(merge.id)
            if (existing) {
                // The target tile is already at merge position, play merge animation
                animateTileMerge(existing.el, merge.toX, merge.toY, merge.newValue)
                existing.x = merge.toX
                existing.y = merge.toY
                existing.tile = tiles[merge.toY][merge.toX]
                existing.tile.value = merge.newValue
            }
        }
        
        // Handle source tiles that were merged - they should disappear after moving to target
        for (const merge of moveInfo.merged) {
            for (const fromId of merge.fromIds) {
                const sourceTile = tileList.get(fromId)
                if (sourceTile) {
                    // Source tile has already animated to merge position, now fade it out
                    sourceTile.el.style.transition = 'opacity 0.1s ease-out, transform 0.1s ease-out'
                    sourceTile.el.style.opacity = '0'
                    sourceTile.el.style.transform += ' scale(0.8)'
                    setTimeout(() => {
                        if (sourceTile.el.parentNode) sourceTile.el.remove()
                    }, 100)
                    tileList.delete(fromId)
                }
            }
        }
        
        // Handle new tiles
        for (const newTile of moveInfo.new) {
            const tile = tiles[newTile.y][newTile.x]
            if (tile) {
                const el = createTileElement(tile)
                gameTiles.appendChild(el)
                tileList.set(tile.id, { el, x: tile.x, y: tile.y, tile })
            }
        }
    } else {
        // No move info - just render all tiles at their positions (initial load or force recreate)
        for (const [id, data] of tilesToKeep) {
            const { tile, x, y } = data
            let existing = tileList.get(id)
            const tileSize = getTileSize()

            if (!existing) {
                const el = createTileElement(tile)
                gameTiles.appendChild(el)
                tileList.set(id, { el, x, y, tile })
            } else {
                const el = existing.el
                const pos = getTilePosition(x, y)
                
                // Update position with animation
                el.style.transition = `transform ${ANIMATION_DURATION}ms var(--transition-bounce)`
                el.style.transform = `translate(${pos.x}px, ${pos.y}px)`
                el.style.width = `${tileSize}px`
                el.style.height = `${tileSize}px`
                
                // Update value if changed
                if (el.textContent != tile.value) {
                    el.textContent = tile.value
                    
                    const colorClasses = el.className.split(' ').filter(c => !c.startsWith('tile-'))
                    el.className = colorClasses.join(' ')
                    el.classList.add(`tile-${tile.value}`)
                    el.classList.add('visible')
                }

                if (tile.isMerged) {
                    el.classList.add('tile-merged')
                    el.style.zIndex = zIndexCounter++
                    setTimeout(() => el.classList.remove('tile-merged'), 350)
                }

                if (tile.isNew) {
                    el.classList.add('tile-new')
                    setTimeout(() => el.classList.remove('tile-new'), 300)
                }

                existing.x = x
                existing.y = y
                existing.tile = tile
            }
        }
    }

    // Update score
    const oldScore = parseInt(currentScore?.textContent || '0')
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

export function forceRecreateTiles(game, tileList) {
    const gameTiles = document.getElementById('gameTiles')
    if (!gameTiles) return
    
    gameTiles.innerHTML = ''
    tileList.clear()
    zIndexCounter = 100
    
    renderTiles(game, tileList)
}

export function updateTileSizes(game, tileList) {
    // Re-render all tiles at their new positions without animation
    const gameTiles = document.getElementById('gameTiles')
    if (!gameTiles) return
    
    const tileSize = getTileSize()
    
    for (const [id, data] of tileList) {
        const { el, x, y } = data
        const pos = getTilePosition(x, y)
        el.style.transition = 'none'
        el.style.transform = `translate(${pos.x}px, ${pos.y}px)`
        el.style.width = `${tileSize}px`
        el.style.height = `${tileSize}px`
    }
}