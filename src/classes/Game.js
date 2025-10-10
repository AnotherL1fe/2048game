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

        this.tiles.push(new Tile(2, x, y))


    }

    moveDown() { }
    moveUp() { }
    moveRigth() { }
    moveLeft() {
        this.tiles = this.tiles.map((tile) => ({...tile, x: tile.x - 1 == 0 ? 1 : tile.x - 1}))
    }

}