let zIndexCounter = 100

export function createTileElement(tile) {
    const el = document.createElement('div')
    const posClass = `tile-pos-${tile.x}-${tile.y}`
    
    el.className = `tile tile-${tile.value} ${posClass} visible`
    el.textContent = tile.value
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

export function renderTiles(game, tileList) {
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

    // Удаляем тайлы, которых больше нет
    for (const [id, data] of tileList) {
        if (!currentIds.has(id)) {
            const el = data.el
            el.style.transition = 'opacity 0.15s ease-out, transform 0.15s ease-out'
            el.style.transform = 'scale(0.8)'
            el.style.opacity = '0'
            setTimeout(() => {
                if (el.parentNode) el.remove()
            }, 150)
            tileList.delete(id)
        }
    }

    zIndexCounter = 100
    
    for (const [id, data] of tilesToKeep) {
        const { tile, x, y } = data
        let existing = tileList.get(id)

        if (!existing) {
            const el = createTileElement(tile)
            gameTiles.appendChild(el)
            tileList.set(id, { el, x, y, tile })
        } else {
            const el = existing.el
            
            // Обновляем позицию
            const newPosClass = `tile-pos-${x}-${y}`
            el.className = el.className.split(' ').filter(c => !c.startsWith('tile-pos-')).join(' ')
            el.className += ` ${newPosClass}`
            
            // Добавляем класс visible для плавного появления
            if (!el.classList.contains('visible')) {
                el.classList.add('visible')
            }
            
            // Обновляем значение
            if (el.textContent != tile.value) {
                el.textContent = tile.value
                
                // Обновляем класс цвета
                const colorClasses = el.className.split(' ').filter(c => !c.startsWith('tile-'))
                el.className = colorClasses.join(' ')
                el.classList.add(`tile-${tile.value}`)

                if (tile.isMerged) {
                    el.classList.add('tile-merged')
                    el.style.zIndex = zIndexCounter++
                    setTimeout(() => el.classList.remove('tile-merged'), 350)
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

    // Обновляем счет
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
    forceRecreateTiles(game, tileList)
}