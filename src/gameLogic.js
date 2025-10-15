import Game from './classes/Game.js'

const game = new Game()
let tileList = new Map(); // Используем Map для быстрого доступа по id

function createTileElement(tile, x, y, styleTable) {
    const tileElement = document.createElement("div");
    tileElement.classList.add("tile", `tile-${tile.value}`);
    tileElement.innerHTML = tile.value;
    tileElement.setAttribute("style", styleTable[`${x}-${y}`]);
    tileElement.dataset.id = tile.id;
    tileElement.dataset.x = x;
    tileElement.dataset.y = y;
    
    return tileElement;
}

function animateTileMovement(tileElement, fromX, fromY, toX, toY, styleTable) {
    return new Promise((resolve) => {
        // Устанавливаем начальную позицию
        tileElement.style.transition = 'none';
        tileElement.setAttribute("style", styleTable[`${fromX}-${fromY}`]);
        
        // Даем браузеру время применить стили без анимации
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                // Включаем анимацию и двигаем к конечной позиции
                tileElement.style.transition = 'all 0.15s ease-in-out';
                tileElement.setAttribute("style", styleTable[`${toX}-${toY}`]);
                
                // Ждем завершения анимации
                tileElement.addEventListener('transitionend', resolve, { once: true });
            });
        });
    });
}

function animateTileMerge(tileElement, newValue) {
    return new Promise((resolve) => {
        tileElement.style.transform = 'scale(1.1)';
        tileElement.classList.add(`tile-${newValue}`);
        tileElement.innerHTML = newValue;
        
        setTimeout(() => {
            tileElement.style.transform = 'scale(1)';
            resolve();
        }, 150);
    });
}

function animateNewTile(tileElement) {
    tileElement.style.transform = 'scale(0)';
    
    requestAnimationFrame(() => {
        tileElement.style.transition = 'transform 0.15s ease-out';
        tileElement.style.transform = 'scale(1)';
    });
}

async function renderWithAnimation(list, styleTable) {
    const gameTiles = document.querySelector(".gameTiles");
    const scoreElement = document.querySelector(".score");
    
    // Обновляем счет
    if (scoreElement) {
        scoreElement.textContent = game.score;
    }
    
    // Получаем изменения для анимации
    const changes = game.getTileChanges();
    
    // Анимация перемещений
    const moveAnimations = changes.moved.map(change => {
        const tileElement = tileList.get(change.id)?.dom;
        if (tileElement) {
            return animateTileMovement(tileElement, change.fromX, change.fromY, change.toX, change.toY, styleTable);
        }
    });
    
    // Ждем завершения всех перемещений
    await Promise.all(moveAnimations);
    
    // Анимация объединений
    const mergeAnimations = changes.merged.map(change => {
        const tileElement = tileList.get(change.id)?.dom;
        if (tileElement) {
            return animateTileMerge(tileElement, change.newValue);
        }
    });
    
    await Promise.all(mergeAnimations);
    
    // Удаляем старые тайлы (которые исчезли при объединении)
    const currentIds = new Set();
    for (let y = 0; y < list.length; y++) {
        for (let x = 0; x < list.length; x++) {
            const item = list[y][x];
            if (item) currentIds.add(item.id);
        }
    }
    
    // Удаляем элементы, которых больше нет
    for (let [id, tileData] of tileList) {
        if (!currentIds.has(id)) {
            tileData.dom.remove();
            tileList.delete(id);
        }
    }
    
    // Добавляем новые тайлы с анимацией
    changes.new.forEach(newTile => {
        const tileElement = createTileElement(
            { id: newTile.id, value: newTile.value }, 
            newTile.x, 
            newTile.y, 
            styleTable
        );
        
        gameTiles.appendChild(tileElement);
        tileList.set(newTile.id, { dom: tileElement, x: newTile.x, y: newTile.y });
        animateNewTile(tileElement);
    });
    
    // Обновляем позиции всех тайлов (на случай если что-то пропущено)
    for (let y = 0; y < list.length; y++) {
        for (let x = 0; x < list.length; x++) {
            const item = list[y][x];
            if (!item) continue;
            
            const tileData = tileList.get(item.id);
            if (tileData) {
                tileData.dom.setAttribute("style", styleTable[`${x}-${y}`]);
                tileData.dom.className = `tile tile-${item.value}`;
                tileData.dom.innerHTML = item.value;
                tileData.x = x;
                tileData.y = y;
            } else {
                // Создаем если почему-то отсутствует
                const tileElement = createTileElement(item, x, y, styleTable);
                gameTiles.appendChild(tileElement);
                tileList.set(item.id, { dom: tileElement, x, y });
            }
        }
    }
}

async function handleMove(direction) {
    const moved = game.move(direction);
    if (moved) {
        await renderWithAnimation(game.tiles, game.styleTable);
        
        // Проверка на окончание игры
        if (!game.canMove()) {
            setTimeout(() => {
                alert(`Игра окончена! Ваш счет: ${game.score}`);
            }, 300);
        }
    }
}

export default function start() {
    const newGameBtn = document.querySelector(".newGame");

    newGameBtn.addEventListener("click", () => {
        game.newGame();
        tileList.clear();
        renderWithAnimation(game.tiles, game.styleTable);
    });

    document.addEventListener("keydown", async (e) => {
        e.preventDefault();
        
        if (e.code == "ArrowLeft") await handleMove('left');
        if (e.code == "ArrowRight") await handleMove('right');
        if (e.code == "ArrowUp") await handleMove('up');
        if (e.code == "ArrowDown") await handleMove('down');
    });

    // Добавляем CSS для анимаций
    const style = document.createElement('style');
    style.textContent = `
        .tile {
            transition: all 0.15s ease-in-out;
            position: absolute;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 35px;
            font-weight: bold;
            border-radius: 5px;
        }
        
        .tile-2 { background: #eee4da; color: #776e65; }
        .tile-4 { background: #ede0c8; color: #776e65; }
        .tile-8 { background: #f2b179; color: #f9f6f2; }
        .tile-16 { background: #f59563; color: #f9f6f2; }
        .tile-32 { background: #f67c5f; color: #f9f6f2; }
        .tile-64 { background: #f65e3b; color: #f9f6f2; }
        .tile-128 { background: #edcf72; color: #f9f6f2; }
        .tile-256 { background: #edcc61; color: #f9f6f2; }
        .tile-512 { background: #edc850; color: #f9f6f2; }
        .tile-1024 { background: #edc53f; color: #f9f6f2; }
        .tile-2048 { background: #edc22e; color: #f9f6f2; }
    `;
    document.head.appendChild(style);

    game.newGame();
    renderWithAnimation(game.tiles, game.styleTable);
}