let resizeTimeout = null

export function setupResizeHandler(game, tileList, updateFn) {
    function handleResize() {
        if (resizeTimeout) clearTimeout(resizeTimeout)
        resizeTimeout = setTimeout(() => {
            updateFn(game, tileList)
            resizeTimeout = null
        }, 100)
    }

    window.addEventListener('resize', handleResize)
    window.addEventListener('orientationchange', () => {
        setTimeout(handleResize, 300)
    })
}