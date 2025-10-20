import Tile from "./Tile.js"

export default class Game {
    static generateStyleTable(tileCount, tileSize) {
        const table = {}
        for (let y = 0; y <= tileCount; y++) {
            for (let x = 0; x <= tileCount; x++) {
                let left = `left: ${(x) * tileSize + (x) * 10}px;`
                let top = `top: ${(y) * tileSize + (y) * 10}px;`
                table[`${x}-${y}`] = `${left} ${top}`
            }
        }
        return table
    }

    constructor() {
        this.tileSize = 100
        this.tileCount = 4

        this.maxScore = window.localStorage.getItem('maxScore') || 0
        this.score = 0
        this.tiles = [
            [null, null, null, null],
            [null, null, null, null],
            [null, null, null, null],
            [null, null, null, null]
        ]

        this.previousTiles = null; // Сохраняем предыдущее состояние для анимации
        this.styleTable = Game.generateStyleTable(this.tileCount, this.tileSize)
        this.moved = false;
    }

    getTiles() {
        return this.tiles
    }

    // Сохраняем текущее состояние перед движением
    saveState() {
        this.previousTiles = JSON.parse(JSON.stringify(this.tiles));
    }

    // Получаем изменения между состояниями
    getTileChanges() {
        if (!this.previousTiles) return { moved: [], merged: [], new: [] };

        const changes = {
            moved: [],
            merged: [],
            new: []
        };

        const previousMap = new Map();
        const currentMap = new Map();

        // Собираем информацию о предыдущем состоянии
        for (let y = 0; y < this.previousTiles.length; y++) {
            for (let x = 0; x < this.previousTiles[y].length; x++) {
                const tile = this.previousTiles[y][x];
                if (tile) {
                    previousMap.set(tile.id, { x, y, value: tile.value });
                }
            }
        }

        // Собираем информацию о текущем состоянии
        for (let y = 0; y < this.tiles.length; y++) {
            for (let x = 0; x < this.tiles[y].length; x++) {
                const tile = this.tiles[y][x];
                if (tile) {
                    currentMap.set(tile.id, { x, y, value: tile.value });
                }
            }
        }

        for (let [id, currentPos] of currentMap) {
            const previousPos = previousMap.get(id);
            if (previousPos) {
                if (previousPos.x !== currentPos.x || previousPos.y !== currentPos.y) {
                    changes.moved.push({
                        id,
                        fromX: previousPos.x,
                        fromY: previousPos.y,
                        toX: currentPos.x,
                        toY: currentPos.y
                    });
                }
            } else {
                changes.new.push({
                    id,
                    x: currentPos.x,
                    y: currentPos.y,
                    value: currentPos.value
                });
            }
        }

        for (let [id, previousPos] of previousMap) {
            if (!currentMap.has(id)) {
                const currentTile = this.tiles[previousPos.y]?.[previousPos.x];
                if (currentTile && currentTile.value === previousPos.value * 2) {
                    changes.merged.push({
                        id: currentTile.id,
                        fromIds: [id],
                        toX: previousPos.x,
                        toY: previousPos.y,
                        newValue: currentTile.value
                    });
                }
            }
        }

        return changes;
    }

    newGame() {
        this.score = 0;
        this.tiles = [
            [null, null, null, null],
            [null, null, null, null],
            [null, null, null, null],
            [null, null, null, null]
        ]
        this.previousTiles = null;
        this.spawnTile();
        this.spawnTile();
    }

    findEmptyCoords() {
        let emptyCoords = [];
        for (let y = 0; y < this.tiles.length; y++) {
            for (let x = 0; x < this.tiles[y].length; x++) {
                if (!this.tiles[y][x]) emptyCoords.push(`${x}-${y}`);
            }
        }
        return emptyCoords
    }

    spawnTile(x, y, v = Math.floor(Math.random() * 2 + 1) * 2) {
        if (!x || !y) {
            const emptyCoords = this.findEmptyCoords()
            if (emptyCoords.length === 0) return false;

            let randomCoords = emptyCoords[Math.floor(Math.random() * emptyCoords.length)]
            const [newX, newY] = randomCoords.split("-");
            x = newX;
            y = newY;
        }

        this.tiles[y][x] = new Tile(v, +x, +y)
        return true;
    }

    move(direction) {
        this.saveState(); // Сохраняем состояние перед движением
        this.moved = false;
        let moved = false;

        switch (direction) {
            case 'left':
                moved = this.moveLeft();
                break;
            case 'right':
                moved = this.moveRight();
                break;
            case 'up':
                moved = this.moveUp();
                break;
            case 'down':
                moved = this.moveDown();
                break;
        }

        if (moved) {
            this.spawnTile();
        }
        return moved;
    }

    moveLeft() {
        let moved = false;

        for (let y = 0; y < this.tiles.length; y++) {
            for (let x = 1; x < this.tiles[y].length; x++) {
                if (!this.tiles[y][x]) continue;

                let newX = x;
                while (newX > 0 && !this.tiles[y][newX - 1]) {
                    this.tiles[y][newX - 1] = this.tiles[y][newX];
                    this.tiles[y][newX] = null;
                    newX--;
                    moved = true;
                }
            }

            for (let x = 0; x < this.tiles[y].length - 1; x++) {
                if (this.tiles[y][x] && this.tiles[y][x + 1] &&
                    this.tiles[y][x].value === this.tiles[y][x + 1].value) {

                    this.tiles[y][x] = new Tile(this.tiles[y][x].value * 2, x, y);
                    this.score += this.tiles[y][x].value;

                    for (let i = x + 1; i < this.tiles[y].length - 1; i++) {
                        this.tiles[y][i] = this.tiles[y][i + 1];
                    }
                    this.tiles[y][this.tiles[y].length - 1] = null;
                    moved = true;
                }
            }
        }

        return moved;
    }

    moveRight() {
        let moved = false;

        for (let y = 0; y < this.tiles.length; y++) {
            for (let x = this.tiles[y].length - 2; x >= 0; x--) {
                if (!this.tiles[y][x]) continue;

                let newX = x;
                while (newX < this.tiles[y].length - 1 && !this.tiles[y][newX + 1]) {
                    this.tiles[y][newX + 1] = this.tiles[y][newX];
                    this.tiles[y][newX] = null;
                    newX++;
                    moved = true;
                }
            }

            for (let x = this.tiles[y].length - 1; x > 0; x--) {
                if (this.tiles[y][x] && this.tiles[y][x - 1] &&
                    this.tiles[y][x].value === this.tiles[y][x - 1].value) {

                    this.tiles[y][x] = new Tile(this.tiles[y][x].value * 2, x, y);
                    this.score += this.tiles[y][x].value;

                    for (let i = x - 1; i > 0; i--) {
                        this.tiles[y][i] = this.tiles[y][i - 1];
                    }
                    this.tiles[y][0] = null;
                    moved = true;
                }
            }
        }

        return moved;
    }

    moveUp() {
        let moved = false;

        for (let x = 0; x < this.tiles[0].length; x++) {
            for (let y = 1; y < this.tiles.length; y++) {
                if (!this.tiles[y][x]) continue;

                let newY = y;
                while (newY > 0 && !this.tiles[newY - 1][x]) {
                    this.tiles[newY - 1][x] = this.tiles[newY][x];
                    this.tiles[newY][x] = null;
                    newY--;
                    moved = true;
                }
            }

            for (let y = 0; y < this.tiles.length - 1; y++) {
                if (this.tiles[y][x] && this.tiles[y + 1][x] &&
                    this.tiles[y][x].value === this.tiles[y + 1][x].value) {

                    this.tiles[y][x] = new Tile(this.tiles[y][x].value * 2, x, y);
                    this.score += this.tiles[y][x].value;

                    for (let i = y + 1; i < this.tiles.length - 1; i++) {
                        this.tiles[i][x] = this.tiles[i + 1][x];
                    }
                    this.tiles[this.tiles.length - 1][x] = null;
                    moved = true;
                }
            }
        }

        return moved;
    }

    moveDown() {
        let moved = false;

        for (let x = 0; x < this.tiles[0].length; x++) {
            for (let y = this.tiles.length - 2; y >= 0; y--) {
                if (!this.tiles[y][x]) continue;

                let newY = y;
                while (newY < this.tiles.length - 1 && !this.tiles[newY + 1][x]) {
                    this.tiles[newY + 1][x] = this.tiles[newY][x];
                    this.tiles[newY][x] = null;
                    newY++;
                    moved = true;
                }
            }

            for (let y = this.tiles.length - 1; y > 0; y--) {
                if (this.tiles[y][x] && this.tiles[y - 1][x] &&
                    this.tiles[y][x].value === this.tiles[y - 1][x].value) {

                    this.tiles[y][x] = new Tile(this.tiles[y][x].value * 2, x, y);
                    this.score += this.tiles[y][x].value;

                    for (let i = y - 1; i > 0; i--) {
                        this.tiles[i][x] = this.tiles[i - 1][x];
                    }
                    this.tiles[0][x] = null;
                    moved = true;
                }
            }
        }

        return moved;
    }

    canMove() {
        if (this.findEmptyCoords().length > 0) return true;

        for (let y = 0; y < this.tiles.length; y++) {
            for (let x = 0; x < this.tiles[y].length; x++) {
                const current = this.tiles[y][x];
                if (!current) continue;

                if (x < this.tiles[y].length - 1 && this.tiles[y][x + 1] &&
                    this.tiles[y][x + 1].value === current.value) return true;

                if (y < this.tiles.length - 1 && this.tiles[y + 1][x] &&
                    this.tiles[y + 1][x].value === current.value) return true;
            }
        }

        return false;
    }
}