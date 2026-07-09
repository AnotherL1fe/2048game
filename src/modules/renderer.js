let zIndexCounter = 10
export const ANIMATION_DURATION = 200

function getCellSize() {
    const gameField = document.getElementById('gameField')
    if (!gameField) return { cellSize: 80, gap: 10 }

    const gameBack = gameField.querySelector('.game-back')
    const computedBack = gameBack ? getComputedStyle(gameBack) : null
    const gap = computedBack ? parseFloat(computedBack.gap) || 10 : 10

    const padding = parseFloat(getComputedStyle(gameField).paddingLeft) || 10
    const fieldWidth = gameField.clientWidth - padding * 2
    const cellSize = (fieldWidth - gap * 3) / 4

    return { cellSize, gap }
}

function getTilePosition(x, y) {
    const { cellSize, gap } = getCellSize()
    const offset = cellSize + gap
    return {
        x: x * offset,
        y: y * offset
    }
}

function getTileSize() {
    const { cellSize } = getCellSize()
    return cellSize
}

function setTilePosition(el, x, y) {
    const pos = getTilePosition(x, y)
    el.style.left = `${pos.x}px`
    el.style.top = `${pos.y}px`
}

export function createTileElement(tile) {
    const el = document.createElement('div')
    const tileSize = getTileSize()
    
    el.className = `tile tile-${tile.value} visible`
    el.textContent = tile.value
    el.style.zIndex = zIndexCounter++
    el.dataset.id = tile.id
    el.style.width = `${tileSize}px`
    el.style.height = `${tileSize}px`
    el.style.transition = 'none'
    setTilePosition(el, tile.x, tile.y)
    
    if (tile.isNew) {
        el.style.transform = 'scale(0)'
        el.style.opacity = '0'
        el.classList.add('tile-new')
    } else {
        el.style.transform = 'scale(1)'
        el.style.opacity = '1'
    }

    if (tile.isMerged) {
        el.classList.add('tile-merged')
        el.style.zIndex = zIndexCounter++
    }

    return el
}

export function animateTileMove(el, fromX, fromY, toX, toY, isMerge = false) {
    const fromPos = getTilePosition(fromX, fromY)
    const toPos = getTilePosition(toX, toY)
    const dx = fromPos.x - toPos.x
    const dy = fromPos.y - toPos.y
    
    el.style.transition = 'none'
    el.style.left = `${toPos.x}px`
    el.style.top = `${toPos.y}px`
    el.style.transform = `translate(${dx}px, ${dy}px)`
    void el.offsetWidth
    el.style.transition = `transform ${ANIMATION_DURATION}ms var(--transition-bounce)`
    el.style.transform = 'translate(0, 0)'
    
    if (isMerge) {
        el.style.zIndex = zIndexCounter++
    }
}

export function animateTileMerge(el, x, y, newValue) {
    const pos = getTilePosition(x, y)

    el.classList.remove('tile-merged')

    el.style.transition = 'none'
    el.style.left = `${pos.x}px`
    el.style.top = `${pos.y}px`
    const curTranslate = el.style.transform.match(/translate\([^)]+\)/)
    const baseTranslate = curTranslate ? curTranslate[0] : 'translate(0, 0)'
    el.style.transform = `${baseTranslate} scale(1)`
    void el.offsetWidth

    el.style.transition = `transform ${ANIMATION_DURATION}ms var(--transition-bounce)`
    el.style.transform = `${baseTranslate} scale(0)`

    setTimeout(() => {
        if (newValue !== undefined) {
            el.textContent = newValue
            const colorClasses = el.className.split(' ').filter(c => !c.startsWith('tile-') && c !== 'visible')
            el.className = colorClasses.join(' ')
            el.classList.add(`tile-${newValue}`)
            el.classList.add('visible')
        }

        el.style.transition = 'none'
        el.style.transform = `${baseTranslate} scale(0)`
        void el.offsetWidth

        el.style.transition = `transform ${ANIMATION_DURATION}ms var(--transition-bounce)`
        el.style.transform = `${baseTranslate} scale(1)`
    }, ANIMATION_DURATION)
}

export function animateNewTile(el, x, y) {
    setTilePosition(el, x, y)
    el.style.transition = 'none'
    el.style.transform = 'scale(0)'
    el.style.opacity = '0'
    
    void el.offsetWidth
    
    el.style.transition = `transform ${ANIMATION_DURATION}ms var(--transition-bounce), opacity ${ANIMATION_DURATION}ms ease`
    el.style.transform = 'scale(1)'
    el.style.opacity = '1'
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

    if (moveInfo) {
        for (const move of moveInfo.moved) {
            const existing = tileList.get(move.id)
            if (existing) {
                const isMergeSource = moveInfo.merged.some(m => m.fromIds.includes(move.id))
                animateTileMove(existing.el, move.fromX, move.fromY, move.toX, move.toY, isMergeSource)
                existing.x = move.toX
                existing.y = move.toY
            }
        }
        
        for (const merge of moveInfo.merged) {
            const existing = tileList.get(merge.id)
            if (existing) {
                animateTileMerge(existing.el, merge.toX, merge.toY, merge.newValue)
                existing.x = merge.toX
                existing.y = merge.toY
                existing.tile = tiles[merge.toY][merge.toX]
                existing.tile.value = merge.newValue
            }
        }
        
        for (const merge of moveInfo.merged) {
            for (const fromId of merge.fromIds) {
                const sourceTile = tileList.get(fromId)
                if (sourceTile) {
                    const sid = fromId
                    setTimeout(() => {
                        const st = tileList.get(sid)
                        if (st) {
                            st.el.style.transition = 'opacity 0.1s ease-out, transform 0.1s ease-out'
                            st.el.style.opacity = '0'
                            st.el.style.transform += ' scale(0.8)'
                            setTimeout(() => {
                                if (st.el.parentNode) st.el.remove()
                            }, 100)
                            tileList.delete(sid)
                        }
                    }, ANIMATION_DURATION)
                }
            }
        }
        
        for (const newTile of moveInfo.new) {
            const tile = tiles[newTile.y][newTile.x]
            if (tile) {
                const el = createTileElement(tile)
                gameTiles.appendChild(el)
                tileList.set(tile.id, { el, x: tile.x, y: tile.y, tile })
                animateNewTile(el, tile.x, tile.y)
                setTimeout(() => el.classList.remove('tile-new'), 300)
            }
        }
    } else {
        for (const [id, data] of tilesToKeep) {
            const { tile, x, y } = data
            let existing = tileList.get(id)
            const tileSize = getTileSize()

            if (!existing) {
                const el = createTileElement(tile)
                gameTiles.appendChild(el)
                tileList.set(id, { el, x, y, tile })
                if (tile.isNew) {
                    animateNewTile(el, tile.x, tile.y)
                    setTimeout(() => el.classList.remove('tile-new'), 300)
                }
            } else {
                const el = existing.el
                const pos = getTilePosition(x, y)
                
                el.style.transition = 'none'
                el.style.left = `${pos.x}px`
                el.style.top = `${pos.y}px`
                el.style.transform = 'scale(1)'
                el.style.width = `${tileSize}px`
                el.style.height = `${tileSize}px`
                
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
    zIndexCounter = 10

    renderTiles(game, tileList)
}

export function updateTileSizes(game, tileList) {
    const gameTiles = document.getElementById('gameTiles')
    if (!gameTiles) return
    
    const tileSize = getTileSize()
    
    for (const [id, data] of tileList) {
        const { el, x, y } = data
        const pos = getTilePosition(x, y)
        el.style.transition = 'none'
        el.style.left = `${pos.x}px`
        el.style.top = `${pos.y}px`
        el.style.transform = 'scale(1)'
        el.style.width = `${tileSize}px`
        el.style.height = `${tileSize}px`
    }
}
