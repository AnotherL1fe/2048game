import Game from './classes/Game.js'

const game = new Game()
let tileList = new Map();

const currentScore = document.querySelector('.currentScore')
const maxScore = document.querySelector('.maxScore')


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
        tileElement.style.transition = 'none';
        tileElement.setAttribute("style", styleTable[`${fromX}-${fromY}`]);

        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                tileElement.style.transition = 'all 0.15s ease-in-out';
                tileElement.setAttribute("style", styleTable[`${toX}-${toY}`]);

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

    if (tileList.size == 0) {
        gameTiles.innerHTML = ""
    }

    if (scoreElement) {
        scoreElement.textContent = game.score;
    }

    const changes = game.getTileChanges();

    const moveAnimations = changes.moved.map(change => {
        const tileElement = tileList.get(change.id)?.dom;
        if (tileElement) {
            return animateTileMovement(tileElement, change.fromX, change.fromY, change.toX, change.toY, styleTable);
        }
    });

    await Promise.all(moveAnimations);

    const mergeAnimations = changes.merged.map(change => {
        const tileElement = tileList.get(change.id)?.dom;
        if (tileElement) {
            return animateTileMerge(tileElement, change.newValue);
        }
    });

    await Promise.all(mergeAnimations);

    const currentIds = new Set();
    for (let y = 0; y < list.length; y++) {
        for (let x = 0; x < list.length; x++) {
            const item = list[y][x];
            if (item) currentIds.add(item.id);
        }
    }

    for (let [id, tileData] of tileList) {
        if (!currentIds.has(id)) {
            tileData.dom.remove();
            tileList.delete(id);
        }
    }

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
                const tileElement = createTileElement(item, x, y, styleTable);
                gameTiles.appendChild(tileElement);
                tileList.set(item.id, { dom: tileElement, x, y });
            }
        }
    }
    currentScore.innerHTML = game.score
    maxScore.innerHTML = game.maxScore
}

async function handleMove(direction) {
    const moved = game.move(direction);
    if (moved) {
        await renderWithAnimation(game.tiles, game.styleTable);

        if (!game.canMove()) {
            setTimeout(() => {
                window.localStorage.setItem('maxScore', game.score)
                alert(`Игра окончена! Ваш счет: ${game.score}`);
            }, 300);
        }
    }
}

export default function start() {
    const newGameBtn = document.querySelector(".newGame");

    newGameBtn.addEventListener("click", () => {
        game.newGame();
        console.log(tileList);

        tileList.clear();
        console.log(tileList);

        renderWithAnimation(game.tiles, game.styleTable);
    });

    document.addEventListener("keydown", async (e) => {
        e.preventDefault();

        if (e.code == "ArrowLeft") await handleMove('left');
        if (e.code == "ArrowRight") await handleMove('right');
        if (e.code == "ArrowUp") await handleMove('up');
        if (e.code == "ArrowDown") await handleMove('down');
    });

    const style = document.createElement('style');

    document.head.appendChild(style);

    game.newGame();
    renderWithAnimation(game.tiles, game.styleTable);
}

