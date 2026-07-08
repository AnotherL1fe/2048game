let resizeTimeout = null

export function setupResizeHandler(game, tileList) {
    function handleResize() {
        if (resizeTimeout) clearTimeout(resizeTimeout)
        resizeTimeout = setTimeout(() => {
            const gameField = document.getElementById('gameField')
            if (gameField) {
                const fieldSize = gameField.getBoundingClientRect().width || 400
                game.updateStyleTable(fieldSize)
                
                for (const [id, data] of tileList) {
                    const { tile, x, y } = data
                    const el = data.el
                    const newStyle = game.styleTable[`${x}-${y}`]
                    if (el.style.cssText !== newStyle) {
                        el.style.cssText = newStyle
                    }
                }
            }
            resizeTimeout = null
        }, 50)
    }

    window.addEventListener('resize', handleResize)
    window.addEventListener('orientationchange', () => {
        setTimeout(handleResize, 300)
    })

    if (window.ResizeObserver) {
        const resizeObserver = new ResizeObserver(() => {
            handleResize()
        })
        const gameField = document.getElementById('gameField')
        if (gameField) {
            resizeObserver.observe(gameField)
        }
    }

    return handleResize
}