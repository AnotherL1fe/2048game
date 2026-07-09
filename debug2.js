// Investigate basic merge test failure
import Tile from './src/classes/Tile.js'

global.localStorage = { data: {}, getItem(key) { return this.data[key] || null }, setItem(key, val) { this.data[key] = String(val) } }
global.window = { dispatchEvent() {}, AudioContext: class { constructor() { this.state = 'running'; this.destination = {}; this.currentTime = 0 }; createOscillator() { return { connect() {}, start() {}, stop() {}, frequency: { value: 0 }, type: '' } }; createGain() { return { connect() {}, gain: { value: 0, setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {} } } }; resume() {}; suspend() {} }, webkitAudioContext: undefined, addEventListener() {}, CustomEvent: class CustomEvent { constructor(type, opts) { this.type = type; this.detail = opts?.detail || {} } } }

import Game from './src/classes/Game.js'

function setupBoard(tiles) {
    const g = new Game()
    g.tiles = [
        [null, null, null, null],
        [null, null, null, null],
        [null, null, null, null],
        [null, null, null, null]
    ]
    g.score = 0
    g.moves = 0
    g.gameOver = false
    g.won = false
    g.history = []
    for (let y = 0; y < tiles.length; y++) {
        for (let x = 0; x < tiles[y].length; x++) {
            if (tiles[y][x] !== null) {
                g.tiles[y][x] = new Tile(tiles[y][x], x, y)
            }
        }
    }
    return g
}

console.log("=== Test: [2,2,_,_] basic merge ===")
const g = setupBoard([
    [2, 2, null, null],
    [null, null, null, null],
    [null, null, null, null],
    [null, null, null, null]
])
console.log("Before:")
g.tiles[0].forEach((t, i) => console.log(`  [0][${i}] = ${t ? t.value : 'null'}`))

// Check if there are unwanted tiles from constructor
const totalInit = g.tiles.flat().filter(t => t !== null).length
console.log(`Total tiles before move: ${totalInit}`)
for (let y = 0; y < 4; y++) {
    for (let x = 0; x < 4; x++) {
        if (g.tiles[y][x]) console.log(`  tile at (${y},${x}) = ${g.tiles[y][x].value}`)
    }
}

g.move('left')

console.log("\nAfter moveLeft:")
for (let y = 0; y < 4; y++) {
    const row = []
    for (let x = 0; x < 4; x++) {
        row.push(g.tiles[y][x] ? g.tiles[y][x].value : null)
    }
    console.log(`  Row ${y}: [${row.join(', ')}]`)
}
console.log(`score: ${g.score}`)

// Check test assertions
const t00 = g.tiles[0][0]
const t01 = g.tiles[0][1]
console.log(`\ntiles[0][0] = ${t00 ? t00.value : 'null'}`)
console.log(`tiles[0][1] = ${t01 ? t01.value : 'null'}`)

if (t00 && t00.value === 4) console.log("PASS: tiles[0][0] is 4")
else console.log("FAIL: tiles[0][0] should be 4")

if (t01 === null) console.log("PASS: tiles[0][1] is null")
else console.log("FAIL: tiles[0][1] should be null but is " + (t01 ? t01.value : 'null'))

// Now let's check the game over bug:
console.log("\n=== Test: Game over with full board ===")
const g2 = setupBoard([
    [2, 4, 8, 16],
    [32, 64, 128, 256],
    [2, 4, 8, 16],
    [32, 64, 128, 256]
])
console.log("canMove() before:", g2.canMove())
console.log("findEmptyCoords count:", g2.findEmptyCoords().length)

// Move should do nothing since all tiles are already at their destination
const result = g2.move('left')
console.log("move result.moved:", result.moved)
console.log("g2.gameOver:", g2.gameOver)
console.log("g2.moves:", g2.moves)

// Now check a board where tiles need to slide but can't find room
console.log("\n=== Game over on full board: horizontal check ===")
const g3 = setupBoard([
    [16, 8, 4, 2],
    [256, 128, 64, 32],
    [16, 8, 4, 2],
    [256, 128, 64, 32]
])
console.log("canMove:", g3.canMove())
// Try move left - already leftmost, no merges possible
const r3 = g3.move('left')
console.log("moved:", r3.moved, "gameOver:", g3.gameOver)

// Board where tiles CAN move horizontally (no merges, but gaps exist)
console.log("\n=== Move with gaps on full board ===")
const g4 = setupBoard([
    [16, null, 4, 2],
    [null, null, null, null],
    [null, null, null, null],
    [null, null, null, null]
])
const r4 = g4.move('left')
console.log("moved:", r4.moved, "gameOver:", g4.gameOver)
g4.tiles[0].forEach((t, i) => console.log(`  [0][${i}] = ${t ? t.value : 'null'}`))