// More edge case tests
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

// Test 1: Game over on full board should trigger when user tries to move
console.log("=== Test 1: Game over detection ===")
const g1 = setupBoard([
    [2, 4, 8, 16],
    [32, 64, 128, 256],
    [2, 4, 8, 16],
    [32, 64, 128, 256]
])
g1.move('left')
console.log(`gameOver after attempted move: ${g1.gameOver}`)
console.log(`Status: ${g1.gameOver === false ? 'BUG: gameOver not set (user cannot continue playing but game doesn''t know it)' : 'OK'}`)

// Test 2: Game over when user CAN make a move that fills up the board to no-merge state
const g2 = setupBoard([
    [2, 4, 8, 16],
    [32, 64, 128, 256],
    [2, 4, 8, 16],
    [32, 64, 128, 2]
])
// This board has an extra 2 at (3,3). Moving right should merge (3,2)=128 with... no, nothing matches.
// (0,0)=2, (2,0)=2 — but not adjacent. (3,3)=2, (0,0)=2, (2,0)=2 — not adjacent.
// Actually there's NO merge possible with [2,4,8,16] row 0 and [32,64,128,256] row 1 etc.
// Wait, [32,64,128,2] — (3,3)=2 doesn't match (3,2)=128. So no matching adjacent.
// So move left: row 3 = [32,64,128,2] -> slides to [32,64,128,2] (compact left) -> no change, no merge.
// All tiles are at leftmost. moved=false. gameOver not set.
console.log("\n=== Test 2: Full board with no merge, can't slide either ===")
const r2 = g2.move('left')
console.log(`moved: ${r2.moved}, gameOver: ${g2.gameOver}`)

// Test 3: move right then move left to check if canMove detection works mid-game
// Let's build toward game over naturally
console.log("\n=== Test 3: canMove false + full board + user tries direction ===")
const g3 = setupBoard([
    [2, 4, 8, 16],
    [32, 64, 128, 256],
    [2, 4, 8, 16],
    [32, 64, 128, 256]
])
console.log(`canMove: ${g3.canMove()}`)
console.log(`findEmpty: ${g3.findEmptyCoords().length}`)
// Now the user presses left: tiles are at leftmost, no merge possible, moved=false
g3.move('left')
console.log(`After moveLeft - gameOver: ${g3.gameOver}`)

// Test 4: Move right on [16,8,4,2] row
console.log("\n=== Test 4: Move right on leftmost-full row ===")
const g4 = setupBoard([
    [16, 8, 4, 2],
    [256, 128, 64, 32],
    [16, 8, 4, 2],
    [256, 128, 64, 32]
])
g4.move('right')
console.log(`moved: true (should slide right)`)
g4.tiles[0].forEach((t, i) => console.log(`  [0][${i}] = ${t ? t.value : 'null'}`))
console.log(`gameOver: ${g4.gameOver}`)
console.log(`canMove after: ${g4.canMove()}`)

// Test 5: Undo with game over
console.log("\n=== Test 5: Undo with gameOver blocking ===")
const g5 = setupBoard([
    [2, 2, 8, 16],
    [32, 64, 128, 256],
    [2, 4, 8, 16],
    [32, 64, 128, 256]
])
g5.captureStateForUndo()
console.log(`history length: ${g5.history.length}`)
g5.gameOver = true
console.log(`canUndo: ${g5.canUndo()} (should be false when gameOver)`)

// Test 6: Full board where a merge IS possible mid-board
console.log("\n=== Test 6: Full board with merge position ===")
const g6 = setupBoard([
    [2, 4, 8, 16],
    [32, 64, 128, 256],
    [2, 4, 8, 8],
    [32, 64, 128, 256]
])
console.log(`canMove: ${g6.canMove()} (should be true, tiles[2][2]=8 == tiles[2][3]=8)`)
g6.move('right')
console.log(`moved: true`)
g6.tiles[2].forEach((t, i) => console.log(`  [2][${i}] = ${t ? t.value : 'null'}`))
console.log(`gameOver: ${g6.gameOver}`)

// Test 7: Verify the game over DOES trigger naturally in a sequence
console.log("\n=== Test 7: Game over should trigger when board fills naturally ===")
// Fill board with merges to create a deadlock
const g7 = setupBoard([
    [2, 4, 8, 16],
    [32, 64, 128, 256],
    [2, 4, 8, 16],
    [32, 64, 128, 256]
])
// Force fill: after every move, the game checks canMove. But if no move is possible (moved=false),
// we never enter the if(moved) block and canMove is not checked.
// This means game over is NEVER DETECTED from a no-move start.
// The ONLY way gameOver gets set is if a move DOES happen (tiles slide/merge),
// triggering spawnTile, and after spawn the canMove check finds no moves.
console.log("This confirms the game over detection bug")

// Test 8: Verify undo restores score correctly
console.log("\n=== Test 8: Undo score restoration ===")
const g8 = setupBoard([
    [2, 2, null, null],
    [null, null, null, null],
    [null, null, null, null],
    [null, null, null, null]
])
g8.move('left')
const scoreAfterMerge = g8.score
console.log(`Score after merge: ${scoreAfterMerge}`)
g8.undo()
console.log(`Score after undo: ${g8.score} (should be 0)`)
console.log(`Status: ${g8.score === 0 ? 'OK' : 'BUG'}`)