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

function createRipple(button, event) {
    const ripple = document.createElement('span')
    ripple.className = 'ripple'
    
    const rect = button.getBoundingClientRect()
    const size = Math.max(rect.width, rect.height)
    
    ripple.style.width = ripple.style.height = `${size}px`
    ripple.style.left = `${event.clientX - rect.left - size / 2}px`
    ripple.style.top = `${event.clientY - rect.top - size / 2}px`
    
    button.appendChild(ripple)
    
    ripple.addEventListener('animationend', () => {
        ripple.remove()
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

// Add ripple effect to all buttons
export function setupButtonRipples() {
    document.addEventListener('click', (e) => {
        const button = e.target.closest('.btn')
        if (button) {
            createRipple(button, e)
        }
    })
}