export function createConfetti() {
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