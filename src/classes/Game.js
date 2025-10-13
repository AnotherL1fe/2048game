import Tile from "./Tile"

export default class Game {
    static generateStyleTable(tileCount, tileSize) {
        const table = {}
        for (let y = 1; y <= tileCount; y++) {
            for (let x = 1; x <= tileCount; x++) {
                let left = `left: ${(x - 1) * tileSize + (x - 1) * 10}px;`
                let top = `top: ${(y - 1) * tileSize + (y - 1) * 10}px;`
                table[`${x}-${y}`] = `${left} ${top}`
            }

        }
        return table
    }

    constructor() {
        this.tileSize = 100
        this.tileCount = 4

        this.score = 0
        this.tiles = []

        this.styleTable = Game.generateStyleTable(this.tileCount, this.tileSize)
    }

    getTiles() {
        return this.tiles
    }
    newGame() {
        this.score = 0;
        this.tiles = []
        this.spawnTile()
        this.spawnTile()
    }

    findEmptyCoords() {
        const emptyCoords = []
        for (let y = 1; y <= this.tileCount; y++) {
            for (let x = 1; x <= this.tileCount; x++) {
                emptyCoords.push(`${x}-${y}`)
            }

        }
        return emptyCoords.filter((item) =>
            !this.tiles.find((tile) =>
                item == `${tile.x}-${tile.y}`)
        )

    }

    spawnTile() {
        const emptyCoords = this.findEmptyCoords()

        let randomCoords = emptyCoords[Math.floor(Math.random() * emptyCoords.length)]

        let [x, y] = randomCoords.split("-")

        this.tiles.push(new Tile(2, +x, +y))


    }


    isCollide() {
        for (let i = 0; i < this.tiles.length; i++) {
            for (let j = i + 1; j < this.tiles.length; j++) {
                const tile1 = this.tiles[i];
                const tile2 = this.tiles[j];

                const isHorizontalNeighbor = tile1.y === tile2.y && Math.abs(tile1.x - tile2.x) === 1;
                const isVerticalNeighbor = tile1.x === tile2.x && Math.abs(tile1.y - tile2.y) === 1;

                if (isHorizontalNeighbor || isVerticalNeighbor) {
                    return true;
                }
            }
        }
        return false;
    }

    moveDown() {
        for (let tile of this.tiles) {
            tile.y = tile.y + 1 == 5 ? 4 : tile.y + 1
        }
    }
    moveUp() {
        for (let tile of this.tiles) {
            tile.y = tile.y - 1 == 0 ? 1 : tile.y - 1
        }
    }
    moveRigth() {
        for (let tile of this.tiles) {
            tile.x = tile.x + 1 == 5 ? 4 : tile.x + 1
        }
    }
    moveLeft() {
        for (let tile of this.tiles) {
            tile.x = tile.x - 1 == 0 ? 1 : tile.x - 1
        }
    }

}