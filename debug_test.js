// Deep bug analysis test

import Tile from './src/classes/Tile.js'

global.localStorage = {
    data: {},
    getItem(key) { return this.data[key] || null },
    setItem(key, val) { this.data[key] = String(val) }
}
global.window = {
    dispatchEvent() {},
    AudioContext: class { constructor() { this.state = 'running'; this.destination = {}; this.currentTime = 0 }; createOscillator() { return { connect() {}, start() {}, stop() {}, frequency: { value: 0 }, type: '' } }; createGain() { return { connect() {}, gain: { value: 0, setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {} } } }; resume() {}; suspend() {} },
    webkitAudioContext: undefined,
    addEventListener() {},
    CustomEvent: class CustomEvent { constructor(type, opts) { this.type = type; this.detail = opts?.detail || {} } }
}

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

function print(g) {
    console.log(g.tiles.map(row => row.map(t => t ? String(t.value).padStart(3) : ' __').join(' ')).join('\n'))
}

// BUG 1 DEEP ANALYSIS: [2,2,4,4] left
console.log("=== BUG 1: [2,2,4,4] moveLeft ===")
const g1 = setupBoard([[2,2,4,4], [null,null,null,null], [null,null,null,null], [null,null,null,null]])
console.log("Before:")
print(g1)
g1.move('left')
console.log("After:")
print(g1)
console.log(`Score: ${g1.score}`)

// The issue: after merging 2+2 at cols 0,1 -> 4,
// then merging 4+4 at cols 2,3 -> 8.
// But the shift loop leaves a dangling copy of the last tile.
// Let's trace through manually:
//
// moveLeft row 0:
//   x=1: tile[0][1]=2, slide left (no space), stays
//   x=2: tile[0][2]=4, slide left (no space), stays
//   x=3: tile[0][3]=4, slide left (no space), stays
//   Now merge pass:
//     x=0: tiles[0][0]=2, tiles[0][1]=2 -> MERGE. value=4, tile[0][1] removed.
//       Shift loop (line 326-340): for i = x+1(=1) to len-1(=2):
//         i=1: tiles[1+1]=tiles[2] -> shifted = tiles[0][2]=4
//           tiles[0][1] = 4   (BUG: this should be the shifted tile, not where the merged tile was)
//           shifted.x=1
//         i=2: tiles[2+1]=tiles[3] -> shifted = tiles[0][3]=4
//           tiles[0][2] = 4
//           shifted.x=2
//       Loop ends.
//       tiles[0][3] = null  (line 341)
//       RESULT: [4, 4, 4, null]  <- CORRECT! Wait, this actually works.

console.log("\n=== BUG 1 actual result ===")
// The test showed Row: [4, 8, _, 2]. So there's a 2 at col 3 in the actual code.
// Let me check again more carefully with a fresh instance...

const g1b = setupBoard([[2,2,4,4], [null,null,null,null], [null,null,null,null], [null,null,null,null]])
g1b.move('left')
console.log("Row 0:", g1b.tiles[0].map(t => t ? t.value : null))

// Wait, g1 gave [4,4,4,null] but the test gave [4,8,_,2]... 
// The difference: the initial setup creates a new Game() which calls loadGame() which spawns 2 random tiles!
// Those extra tiles screw up the test!

console.log("\n=== VERIFICATION: New Game spawns extra tiles! ===")
const g2 = new Game()
console.log("Extra tiles from constructor:")
g2.tiles.forEach((row, y) => {
    row.forEach((t, x) => {
        if (t) console.log(`  Tile(${t.value}) at (${x},${y})`)
    })
})

// THIS IS THE REAL ISSUE: Game constructor calls loadGame() which spawns 2 tiles
// setupBoard creates a new Game() (which spawns 2 tiles), THEN overwrites tiles.
// But the spawned tiles are overwritten... unless loadGame triggers async issues.

// Let me verify by looking at what setupBoard does more carefully
console.log("\n=== BUG ANALYSIS ===")
const g3 = setupBoard([[2,2,4,4], [null,null,null,null], [null,null,null,null], [null,null,null,null]])
console.log("Tiles after setup:")
g3.tiles.forEach((row, y) => {
    row.forEach((t, x) => {
        if (t) console.log(`  Tile ${t.value} at (${x},${y})`)
    })
})
console.log("Total non-null:", g3.tiles.flat().filter(t => t !== null).length)

// OK wait, the initial test DID show [4, 8, _, 2]. That means the 4,4 merge succeeded
// and there's a stray 2 at the end. But our step-through showed it should work.
// Let me run moveLeft step by step manually...

console.log("\n=== MANUAL TRACE ===")
const g4 = setupBoard([[2,2,4,4], [null,null,null,null], [null,null,null,null], [null,null,null,null]])
// Reset all state
g4.score = 0
g4.moves = 0
g4.lastMoveInfo = { moved: [], merged: [], new: [] }

const y = 0
const tiles = g4.tiles

// Pass 1: Slide left
console.log("\nSlide pass:")
for (let x = 1; x < 4; x++) {
    if (!tiles[y][x]) continue
    let originalX = x
    let newX = x
    while (newX > 0 && !tiles[y][newX - 1]) {
        tiles[y][newX - 1] = tiles[y][newX]
        tiles[y][newX] = null
        newX--
    }
    if (newX !== originalX) {
        tiles[y][newX].x = newX
    }
}
console.log("After slide:", tiles[y].map(t => t ? t.value : null))

// Pass 2: Merge
console.log("\nMerge pass:")
for (let x = 0; x < 3; x++) {
    if (tiles[y][x] && tiles[y][x+1] && tiles[y][x].value === tiles[y][x+1].value) {
        console.log(`  Merging at x=${x}: ${tiles[y][x].value} + ${tiles[y][x+1].value}`)
        const targetTile = tiles[y][x]
        targetTile.value *= 2
        
        // Shift loop
        for (let i = x + 1; i < tiles[y].length - 1; i++) {
            const shifted = tiles[y][i + 1]
            if (shifted) {
                console.log(`    Shift: tiles[${y}][${i}] = tiles[${y}][${i+1}] (value ${shifted.value})`)
                tiles[y][i] = shifted
                shifted.x = i
            } else {
                console.log(`    Clear: tiles[${y}][${i}] = null`)
                tiles[y][i] = null
            }
        }
        console.log(`    Clear last: tiles[${y}][${tiles[y].length - 1}] = null`)
        tiles[y][tiles[y].length - 1] = null
        console.log(`    Row now: ${tiles[y].map(t => t ? t.value : null)}`)
    } else {
        if (tiles[y][x] && tiles[y][x+1]) {
            console.log(`  x=${x}: no merge (${tiles[y][x].value} != ${tiles[y][x+1].value})`)
        } else {
            console.log(`  x=${x}: skip (null or end)`)
        }
    }
}

console.log("\nFinal row:", tiles[y].map(t => t ? t.value : null))

// Now let's check what the actual Game.moveLeft produces:
console.log("\n=== ACTUAL Game.moveLeft result ===")
const g5 = setupBoard([[2,2,4,4], [null,null,null,null], [null,null,null,null], [null,null,null,null]])
g5.lastMoveInfo = { moved: [], merged: [], new: [] }
const movedResult = g5.moveLeft()
console.log(`moved: ${movedResult}`)
console.log("Row:", g5.tiles[0].map(t => t ? t.value : null))
console.log("score:", g5.score)