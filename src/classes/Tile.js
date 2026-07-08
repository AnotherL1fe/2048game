import { v4 as uuidv4 } from 'uuid'

export default class Tile {
    constructor(value, x, y, id = null) {
        this.id = id || uuidv4()
        this.value = value
        this.x = x
        this.y = y
        this.isNew = false
        this.isMerged = false
        this.isMoving = false
    }

    sumValues(tile) {
        return new Tile(this.value + tile.value, this.x, this.y)
    }

    // Create a copy with new position
    moveTo(x, y) {
        const newTile = new Tile(this.value, x, y, this.id)
        newTile.isNew = this.isNew
        newTile.isMerged = this.isMerged
        newTile.isMoving = this.isMoving
        return newTile
    }

    // Create a merged tile
    static merge(tile1, tile2, x, y) {
        const newTile = new Tile(tile1.value + tile2.value, x, y)
        newTile.isMerged = true
        return newTile
    }
}