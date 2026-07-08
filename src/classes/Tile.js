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
}