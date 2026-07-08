import Tile from "./Tile.js"

export default class Game {
    static generateStyleTable(tileCount, tileSize) {
        const table = {}
        const gap = 10
        const sizeCalc = `calc((100% - ${gap * (tileCount + 1)}px) / ${tileCount})`
        const gapCalc = `${gap}px`
        
        for (let y = 0; y < tileCount; y++) {
            for (let x = 0; x < tileCount; x++) {
                const left = `calc(${x} * (${sizeCalc} + ${gapCalc}) + ${gapCalc})`
                const top = `calc(${y} * (${sizeCalc} + ${gapCalc}) + ${gapCalc})`
                table[`${x}-${y}`] = `left: ${left}; top: ${top}; width: ${sizeCalc}; height: ${sizeCalc};`
            }
        }
        return table
    }

    constructor() {
        this.tileSize = 100
        this.tileCount = 4
        this.gap = 10

        this.maxScore = parseInt(localStorage.getItem('maxScore')) || 0
        this.score = 0
        this.tiles = [
            [null, null, null, null],
            [null, null, null, null],
            [null, null, null, null],
            [null, null, null, null]
        ]

        this.previousTiles = null;
        this.styleTable = Game.generateStyleTable(this.tileCount, this.tileSize)
        this.moved = false;
        
        this.loadGame()
    }

    // === СОХРАНЕНИЕ ===
    saveGame() {
        try {
            const data = {
                maxScore: this.maxScore || 0,
                score: this.score || 0,
                tiles: this.tiles.map(row => 
                    row.map(tile => tile ? { 
                        value: tile.value, 
                        id: tile.id, 
                        x: tile.x, 
                        y: tile.y 
                    } : null)
                ),
                moves: this.moves || 0,
                gameOver: this.gameOver || false,
                won: this.won || false,
                timestamp: Date.now()
            }
            localStorage.setItem('game2048_state', JSON.stringify(data))
            localStorage.setItem('maxScore', String(this.maxScore || 0))
            window.dispatchEvent(new CustomEvent('gameSaved'))
        } catch (e) {
            console.warn('Save error:', e)
        }
    }

    loadGame() {
        try {
            const saved = localStorage.getItem('game2048_state')
            if (saved) {
                const data = JSON.parse(saved)
                this.maxScore = data.maxScore || 0
                this.score = data.score || 0
                this.moves = data.moves || 0
                this.gameOver = data.gameOver || false
                this.won = data.won || false
                
                this.tiles = data.tiles.map(row => 
                    row.map(tileData => 
                        tileData ? new Tile(tileData.value, tileData.x, tileData.y, tileData.id) : null
                    )
                )
                
                const hasTiles = this.tiles.some(row => row.some(t => t !== null))
                if (hasTiles) {
                    return true
                }
            }
        } catch (e) {
            console.warn('Load error:', e)
        }
        
        this.maxScore = parseInt(localStorage.getItem('maxScore')) || 0
        this.score = 0
        this.moves = 0
        this.gameOver = false
        this.won = false
        this.tiles = [
            [null, null, null, null],
            [null, null, null, null],
            [null, null, null, null],
            [null, null, null, null]
        ]
        this.spawnTile()
        this.spawnTile()
        return false
    }

    getTiles() {
        return this.tiles
    }

    saveState() {
        this.previousTiles = JSON.parse(JSON.stringify(this.tiles));
    }

    getTileChanges() {
        if (!this.previousTiles) return { moved: [], merged: [], new: [] };

        const changes = {
            moved: [],
            merged: [],
            new: []
        };

        const previousMap = new Map();
        const currentMap = new Map();

        for (let y = 0; y < this.previousTiles.length; y++) {
            for (let x = 0; x < this.previousTiles[y].length; x++) {
                const tile = this.previousTiles[y][x];
                if (tile) {
                    previousMap.set(tile.id, { x, y, value: tile.value });
                }
            }
        }

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
        if (this.score > 0 || this.moves > 0) {
            if (!confirm('Начать новую игру?')) return false
        }
        this.score = 0;
        this.moves = 0;
        this.gameOver = false;
        this.won = false;
        this.tiles = [
            [null, null, null, null],
            [null, null, null, null],
            [null, null, null, null],
            [null, null, null, null]
        ]
        this.previousTiles = null;
        this.spawnTile();
        this.spawnTile();
        this.saveGame();
        return true;
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
        if (x === undefined || y === undefined) {
            const emptyCoords = this.findEmptyCoords()
            if (emptyCoords.length === 0) return false;

            let randomCoords = emptyCoords[Math.floor(Math.random() * emptyCoords.length)]
            const [newX, newY] = randomCoords.split("-");
            x = parseInt(newX);
            y = parseInt(newY);
        }

        this.tiles[y][x] = new Tile(v, +x, +y)
        return true;
    }

    move(direction) {
        if (this.gameOver) return false;
        
        this.saveState();
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
            this.moves++;
            this.spawnTile();
            this.saveGame();
            
            if (!this.won && this.score >= 2048) {
                this.won = true;
                window.dispatchEvent(new CustomEvent('gameWon'));
            }
            
            if (!this.canMove()) {
                this.gameOver = true;
                this.saveGame();
                window.dispatchEvent(new CustomEvent('gameOver', { 
                    detail: { score: this.score }
                }));
            }
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

                    if (this.score > this.maxScore) {
                        this.maxScore = this.score;
                        window.dispatchEvent(new CustomEvent('recordBroken', { 
                            detail: { score: this.score }
                        }));
                    }

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

                    if (this.score > this.maxScore) {
                        this.maxScore = this.score;
                        window.dispatchEvent(new CustomEvent('recordBroken', { 
                            detail: { score: this.score }
                        }));
                    }

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

                    if (this.score > this.maxScore) {
                        this.maxScore = this.score;
                        window.dispatchEvent(new CustomEvent('recordBroken', { 
                            detail: { score: this.score }
                        }));
                    }

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

                    if (this.score > this.maxScore) {
                        this.maxScore = this.score;
                        window.dispatchEvent(new CustomEvent('recordBroken', { 
                            detail: { score: this.score }
                        }));
                    }

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