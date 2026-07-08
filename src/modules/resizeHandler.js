let resizeTimeout = null

export function setupResizeHandler(game, tileList) {
    function handleResize() {
        if (resizeTimeout) clearTimeout(resizeTimeout)
        resizeTimeout = setTimeout(() => {
            // С grid не нужно ничего пересчитывать — просто обновляем видимость
            resizeTimeout = null
        }, 50)
    }

    window.addEventListener('resize', handleResize)
    window.addEventListener('orientationchange', () => {
        setTimeout(handleResize, 300)
    })

    return handleResize
}