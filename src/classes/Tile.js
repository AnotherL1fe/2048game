import { v4 as uuidv4 } from 'uuid';


export default class Tile {
    // value = 2
    // x = 1
    // y = 1
    constructor(value, x, y) {
        this.id = uuidv4();
        this.value = value
    }

    sumValues(tile) {
        return new Tile(this.value + tile.value)
    }

}