export function setupKeyboardControls(handleMove) {
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
}

export function setupTouchControls(handleMove) {
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
}