// Comprehensive test suite for 2048 Game logic
// Run with: node test_game.js

import Game from './src/classes/Game.js'

// Mock localStorage
global.localStorage = {
    data: {},
    getItem(key) { return this.data[key] || null },
    setItem(key, val) { this.data[key] = String(val) },
    removeItem(key) { delete this.data[key] }
}

global.window = {
    dispatchEvent() {},
    AudioContext: class { constructor() { this.state = 'running'; this.destination = {}; this.currentTime = 0 }; createOscillator() { return { connect() {}, start() {}, stop() {}, frequency: { value: 0 }, type: '' } }; createGain() { return { connect() {}, gain: { value: 0, setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {} } } }; resume() {}; suspend() {} },
    webkitAudioContext: undefined,
    addEventListener() {},
    CustomEvent: class CustomEvent { constructor(type, opts) { this.type = type; this.detail = opts?.detail || {} } }
}

let pass = 0
let fail = 0
let bugs = []

function assert(condition, message, file, line) {
    if (condition) {
        pass++
    } else {
        fail++
        console.error(`  FAIL: ${message}`)
        bugs.push({ message, file, line })
    }
}

function describe(name, fn) {
    console.log(`\n=== ${name} ===`)
    fn()
}

// Helper: create a game with a specific board state
function createGameWithTiles(tileValues) {
    const g = new Game()
    // Override the randomly generated board
    g.tiles = g.createEmptyGrid()
    for (let y = 0; y < tileValues.length; y++) {
        for (let x = 0; x < tileValues[y].length; x++) {
            if (tileValues[y][x] !== null) {
                const { Tile } = require('./src/classes/Tile.js')
                // We already import Tile via Game, just create new Tile directly
                const tile = new g.constructor.prototype.constructor.prototype.constructor.prototype.constructor // hack
            }
        }
    }
    return g
}

// Better helper: directly use Tile class
import Tile from './src/classes/Tile.js'

function setupBoard(tiles) {
    const g = new Game()
    // Reset to empty
    g.tiles = g.createEmptyGrid()
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

function boardToString(g) {
    return g.tiles.map(row => row.map(t => t ? t.value : '_').join('\t')).join('\n')
}

function printBoard(g) {
    console.log(boardToString(g))
}

// ============================================================
// Test Suite
// ============================================================

// 1. INITIALIZATION
describe('Initialization', () => {
    const g = new Game()
    assert(g.tiles.length === 4, 'Board should have 4 rows', 'src/classes/Game.js', 25)
    assert(g.tiles[0].length === 4, 'Board should have 4 columns', 'src/classes/Game.js', 25)
    
    const flat = g.tiles.flat().filter(t => t !== null)
    assert(flat.length === 2, 'Should spawn exactly 2 tiles on init', 'src/classes/Game.js', 95)
    
    const allValid = flat.every(t => t.value === 2 || t.value === 4)
    assert(allValid, 'Spawned tiles should be 2 or 4 only', 'src/classes/Game.js', 208)
    
    // Make sure no two tiles occupy the same cell
    const positions = flat.map(t => `${t.x},${t.y}`)
    const uniquePositions = new Set(positions)
    assert(uniquePositions.size === 2, 'Tiles should be in different positions', 'src/classes/Game.js', 208)
    
    assert(g.score === 0, 'Score should start at 0', 'src/classes/Game.js', 14)
    assert(g.moves === 0, 'Moves should start at 0', 'src/classes/Game.js', 7)
    assert(g.gameOver === false, 'gameOver should be false', 'src/classes/Game.js', 8)
    assert(g.won === false, 'won should be false', 'src/classes/Game.js', 9)
})

// 2. MOVE LEFT - basic slide
describe('Move Left - basic slide', () => {
    // Row: [_, 2, _, _]
    const g = setupBoard([
        [null, 2, null, null],
        [null, null, null, null],
        [null, null, null, null],
        [null, null, null, null]
    ])
    const result = g.move('left')
    assert(result.moved === true, 'Tile should move left', 'src/classes/Game.js', 277)
    assert(g.tiles[0][0] !== null && g.tiles[0][0].value === 2, 'Tile should be at column 0', 'src/classes/Game.js', 277)
    assert(g.tiles[0][1] === null, 'Column 1 should be empty after move', 'src/classes/Game.js', 277)
    assert(g.moves === 1, 'Move count should increment', 'src/classes/Game.js', 241)
})

// 3. MOVE LEFT - no move when no space
describe('Move Left - no movement possible', () => {
    const g = setupBoard([
        [2, 4, 8, 16],
        [null, null, null, null],
        [null, null, null, null],
        [null, null, null, null]
    ])
    const result = g.move('left')
    assert(result.moved === false, 'No move when tiles are already at left edge', 'src/classes/Game.js', 277)
})

// 4. MOVE LEFT - basic merge [2,2,_,_] -> [4,_,_,_]
describe('Move Left - basic merge', () => {
    const g = setupBoard([
        [2, 2, null, null],
        [null, null, null, null],
        [null, null, null, null],
        [null, null, null, null]
    ])
    g.move('left')
    // After left: [4, _, _, _]
    assert(g.tiles[0][0] !== null && g.tiles[0][0].value === 4, 'Two 2s should merge into 4 at col 0', 'src/classes/Game.js', 303)
    assert(g.tiles[0][1] === null, 'Col 1 should be empty after merge', 'src/classes/Game.js', 303)
    assert(g.score === 4, 'Score should be 4 after merging 2+2', 'src/classes/Game.js', 310)
})

// 5. CRITICAL: Merge priority [2,2,2,2] -> [4,4,_,_] (NOT [4,_,4,_] and NOT [_,_,8,_])
describe('Merge priority - [2,2,2,2] left', () => {
    const g = setupBoard([
        [2, 2, 2, 2],
        [null, null, null, null],
        [null, null, null, null],
        [null, null, null, null]
    ])
    g.move('left')
    // Expected: [4, 4, _, _] — the leftmost pair (col 0 & 1) merges to 4 at col 0,
    // then col 2 & 3 merge to 4 at col 1
    const v0 = g.tiles[0][0] ? g.tiles[0][0].value : null
    const v1 = g.tiles[0][1] ? g.tiles[0][1].value : null
    const v2 = g.tiles[0][2] ? g.tiles[0][2].value : null
    const v3 = g.tiles[0][3] ? g.tiles[0][3].value : null
    console.log(`  Row after: [${[v0, v1, v2, v3].map(v => v === null ? '_' : v).join(', ')}]`)
    assert(v0 === 4 && v1 === 4, 'Leftmost pair merges first: [4,4,_,_]', 'src/classes/Game.js', 277)
    assert(v2 === null && v3 === null, 'Cols 2-3 should be empty', 'src/classes/Game.js', 277)
})

// 6. CRITICAL: Multiple merges per row [4,2,2,4] -> [4,4,4,_]
describe('Multiple merges - [4,2,2,4] left', () => {
    const g = setupBoard([
        [4, 2, 2, 4],
        [null, null, null, null],
        [null, null, null, null],
        [null, null, null, null]
    ])
    g.move('left')
    const v0 = g.tiles[0][0] ? g.tiles[0][0].value : null
    const v1 = g.tiles[0][1] ? g.tiles[0][1].value : null
    const v2 = g.tiles[0][2] ? g.tiles[0][2].value : null
    const v3 = g.tiles[0][3] ? g.tiles[0][3].value : null
    console.log(`  Row: [${[v0, v1, v2, v3].map(v => v === null ? '_' : v).join(', ')}]`)
    // [4, 2, 2, 4] -> slide -> [4, 2, 2, 4] (no slide), merge 2+2 -> [4, 4, 4, null] (the 4s should NOT merge after one merge per tile per turn)
    assert(v0 === 4, 'Col 0 should be 4 (original 4 stays)', 'src/classes/Game.js', 277)
    assert(v1 === 4, 'Col 1 should be 4 (merged 2+2)', 'src/classes/Game.js', 277)
    assert(v2 === 4, 'Col 2 should be 4 (original right 4 slides to col 2)', 'src/classes/Game.js', 277)
    assert(v3 === null, 'Col 3 should be empty', 'src/classes/Game.js', 277)
})

// 7. CRITICAL: No re-merge of newly merged tile
describe('No double-merge - [2,2,4,4] left', () => {
    const g = setupBoard([
        [2, 2, 4, 4],
        [null, null, null, null],
        [null, null, null, null],
        [null, null, null, null]
    ])
    g.move('left')
    const v0 = g.tiles[0][0] ? g.tiles[0][0].value : null
    const v1 = g.tiles[0][1] ? g.tiles[0][1].value : null
    const v2 = g.tiles[0][2] ? g.tiles[0][2].value : null
    const v3 = g.tiles[0][3] ? g.tiles[0][3].value : null
    console.log(`  Row: [${[v0, v1, v2, v3].map(v => v === null ? '_' : v).join(', ')}]`)
    // Expected: [4, 8, _, _] — NOT [8, 8, _, _], NOT [_, _, _, 16]
    assert(v0 === 4, 'Col 0 should be 4 (2+2 first merge)', 'src/classes/Game.js', 277)
    assert(v1 === 8, 'Col 1 should be 8 (4+4 second merge)', 'src/classes/Game.js', 277)
    assert(v2 === null, 'Col 2 should be empty', 'src/classes/Game.js', 277)
    assert(v3 === null, 'Col 3 should be empty', 'src/classes/Game.js', 277)
})

// 8. MOVE RIGHT tests
describe('Move Right - basic', () => {
    const g = setupBoard([
        [2, null, null, null],
        [null, null, null, null],
        [null, null, null, null],
        [null, null, null, null]
    ])
    g.move('right')
    assert(g.tiles[0][3] !== null && g.tiles[0][3].value === 2, 'Tile should move to rightmost col', 'src/classes/Game.js', 349)
})

describe('Move Right - merge [2,2,_,_] right', () => {
    const g = setupBoard([
        [2, 2, null, null],
        [null, null, null, null],
        [null, null, null, null],
        [null, null, null, null]
    ])
    g.move('right')
    const v3 = g.tiles[0][3] ? g.tiles[0][3].value : null
    const v2 = g.tiles[0][2] ? g.tiles[0][2].value : null
    // [2,2,_,_] right -> slide -> [_,_,2,2] -> merge rightmost -> [_,_,_,4]
    console.log(`  Row after right: [${g.tiles[0].map(t => t ? t.value : '_').join(',')}]`)
    assert(v3 === 4, 'Col 3 should be 4 after right merge', 'src/classes/Game.js', 349)
    assert(v2 === null, 'Col 2 should be empty after right merge', 'src/classes/Game.js', 349)
})

describe('Move Right - [2,2,2,2] right', () => {
    const g = setupBoard([
        [2, 2, 2, 2],
        [null, null, null, null],
        [null, null, null, null],
        [null, null, null, null]
    ])
    g.move('right')
    const row = g.tiles[0].map(t => t ? t.value : '_')
    console.log(`  Row after right: [${row.join(',')}]`)
    assert(row[2] === 4 && row[3] === 4, '[2,2,2,2] right should be [_,_,4,4]', 'src/classes/Game.js', 349)
    assert(row[0] === '_' && row[1] === '_', 'Cols 0-1 should be empty', 'src/classes/Game.js', 349)
})

// 9. MOVE UP / DOWN tests
describe('Move Up - basic', () => {
    const g = setupBoard([
        [null, null, null, null],
        [2, null, null, null],
        [null, null, null, null],
        [null, null, null, null]
    ])
    g.move('up')
    assert(g.tiles[0][0] !== null && g.tiles[0][0].value === 2, 'Tile should move to top row', 'src/classes/Game.js', 421)
})

describe('Move Down - basic', () => {
    const g = setupBoard([
        [2, null, null, null],
        [null, null, null, null],
        [null, null, null, null],
        [null, null, null, null]
    ])
    g.move('down')
    assert(g.tiles[3][0] !== null && g.tiles[3][0].value === 2, 'Tile should move to bottom row', 'src/classes/Game.js', 493)
})

// 10. Score tracking accuracy
describe('Score tracking', () => {
    const g = setupBoard([
        [2, 2, 4, 4],
        [null, null, null, null],
        [null, null, null, null],
        [null, null, null, null]
    ])
    g.move('left')
    assert(g.score === 12, 'Score should be 4 + 8 = 12', 'src/classes/Game.js', 310)
})

// 11. Game over detection
describe('Game over detection', () => {
    // Create a full board with no merges possible
    const g = setupBoard([
        [2, 4, 8, 16],
        [32, 64, 128, 256],
        [2, 4, 8, 16],
        [32, 64, 128, 256]
    ])
    assert(g.canMove() === false, 'No moves possible on alternating board', 'src/classes/Game.js', 565)
    
    // Board with merge possible
    const g2 = setupBoard([
        [2, 2, 8, 16],
        [32, 64, 128, 256],
        [2, 4, 8, 16],
        [32, 64, 128, 256]
    ])
    assert(g2.canMove() === true, 'Move is possible when adjacent tiles match', 'src/classes/Game.js', 565)
})

// 12. Undo functionality
describe('Undo', () => {
    const g = setupBoard([
        [2, null, null, null],
        [null, null, null, null],
        [null, null, null, null],
        [null, null, null, null]
    ])
    const scoreBefore = g.score
    const tilesBefore = g.tiles[0][0].value
    g.move('right')
    assert(g.canUndo() === true, 'Should be able to undo after move', 'src/classes/Game.js', 164)
    g.undo()
    assert(g.tiles[0][0] !== null && g.tiles[0][0].value === tilesBefore, 'Undo should restore tile position', 'src/classes/Game.js', 148)
    assert(g.score === scoreBefore, 'Undo should restore score', 'src/classes/Game.js', 152)
})

// 13. Game over triggers correctly
describe('Game over triggers on move', () => {
    const g = setupBoard([
        [2, 4, 8, 16],
        [32, 64, 128, 256],
        [2, 4, 8, 16],
        [32, 64, 128, 256]
    ])
    g.move('left')
    // canMove was checked after spawnTile — but spawning failed (no room). Game should be over.
    assert(g.gameOver === true, 'Game should be over on full board with no merges', 'src/classes/Game.js', 266)
})

// 14. Spawn only on valid moves
describe('Spawn only on valid moves', () => {
    const g = setupBoard([
        [2, 4, 8, 16],
        [32, 64, 128, 256],
        [2, 4, 8, 16],
        [32, 64, 128, 256]
    ])
    const tileCountBefore = g.tiles.flat().filter(t => t !== null).length
    g.move('left')
    const tileCountAfter = g.tiles.flat().filter(t => t !== null).length
    assert(tileCountBefore === tileCountAfter, 'Should not spawn new tile when no move happened', 'src/classes/Game.js', 240)
})

// 15. CanMove returns correct values
describe('canMove edge cases', () => {
    // Empty board
    const g1 = setupBoard([
        [null, null, null, null],
        [null, null, null, null],
        [null, null, null, null],
        [null, null, null, null]
    ])
    assert(g1.canMove() === true, 'Empty board should have moves', 'src/classes/Game.js', 565)

    // Full board with 1 merge-able pair (adjacent 128s at row 3 col 2-3)
    const g2 = setupBoard([
        [2, 4, 8, 16],
        [32, 64, 128, 256],
        [2, 4, 8, 16],
        [32, 64, 128, 128]
    ])
    assert(g2.canMove() === true, 'Full board with one matching pair should have moves', 'src/classes/Game.js', 565)
})

// 16. Merged tile has correct isMerged flag
describe('Tile flags', () => {
    const g = setupBoard([
        [2, 2, null, null],
        [null, null, null, null],
        [null, null, null, null],
        [null, null, null, null]
    ])
    g.move('left')
    assert(g.tiles[0][0].isMerged === true, 'Merged tile should have isMerged = true', 'src/classes/Game.js', 325)
})

// 17. Row compaction after merge
describe('Row compaction after merge', () => {
    const g = setupBoard([
        [2, 4, 2, 2],
        [null, null, null, null],
        [null, null, null, null],
        [null, null, null, null]
    ])
    g.move('left')
    // [2,4,2,2] -> compact -> [2,4,2,2], merge -> [2,4,4,_] (merge col 2+3 -> col 2 becomes 4, col 3 null)
    const row = g.tiles[0].map(t => t ? t.value : '_')
    console.log(`  Row: [${row.join(',')}]`)
    // Check no gaps: any non-null tile must be before any null tile
    let foundNull = false
    let gapIssue = false
    for (const v of row) {
        if (v === '_') foundNull = true
        else if (foundNull) gapIssue = true
    }
    assert(!gapIssue, 'Row should be compacted with no gaps', 'src/classes/Game.js', 326)
})

// 18. Multiple merges in different rows
describe('Multiple rows - parallel merges', () => {
    const g = setupBoard([
        [2, 2, null, null],
        [4, 4, null, null],
        [null, null, null, null],
        [null, null, null, null]
    ])
    g.move('left')
    assert(g.tiles[0][0].value === 4, 'Row 0: 2+2=4', 'src/classes/Game.js', 277)
    assert(g.tiles[1][0].value === 8, 'Row 1: 4+4=8', 'src/classes/Game.js', 277)
    assert(g.score === 12, 'Score should be 4+8=12', 'src/classes/Game.js', 310)
})

// 19: Move block on gameOver
describe('No move allowed after gameOver', () => {
    const g = setupBoard([
        [2, 4, 8, 16],
        [32, 64, 128, 256],
        [2, 4, 8, 16],
        [32, 64, 128, 256]
    ])
    g.gameOver = true
    const result = g.move('left')
    assert(result.moved === false, 'No move allowed when gameOver is true', 'src/classes/Game.js', 226)
})

// 20: findEmptyCoords works  
describe('findEmptyCoords', () => {
    const g = setupBoard([
        [2, null, null, null],
        [null, null, null, null],
        [null, null, null, null],
        [null, null, null, null]
    ])
    const empty = g.findEmptyCoords()
    assert(empty.length === 15, 'Should find 15 empty cells when 1 tile', 'src/classes/Game.js', 198)
})

// 21: spawnTile returns false when board is full
describe('spawnTile on full board', () => {
    const g = setupBoard([
        [2, 4, 8, 16],
        [32, 64, 128, 256],
        [2, 4, 8, 16],
        [32, 64, 128, 256]
    ])
    const result = g.spawnTile()
    assert(result === false, 'spawnTile should return false on full board', 'src/classes/Game.js', 208)
})

// ============================================================
// Summary
// ============================================================
console.log(`\n========================================`)
console.log(`Results: ${pass} passed, ${fail} failed`)
console.log(`========================================`)

if (fail > 0) {
    console.log('\nBUGS FOUND:')
    bugs.forEach((b, i) => {
        console.log(`  ${i+1}. ${b.message}`)
        console.log(`     File: ${b.file}:${b.line}`)
    })
}

process.exit(fail > 0 ? 1 : 0)