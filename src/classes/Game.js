import Tile from "./Tile.js"
import { saveGameState, loadGameState, loadMaxScore, saveMaxScore } from '../modules/storage.js'

export default class Game {
    constructor() {
        this.tileCount = 4
        this.moves = 0
        this.gameOver = false
        this.won = false
        this.continueAfterWin = false
        this.startTime = Date.now()

        this.maxScore = loadMaxScore()
        this.score = 0
        this.tiles = this.createEmptyGrid()

        this.previousTiles = null
        this.moved = false
        this.lastMoveInfo = null
        this.history = []
        
        this.loadGame()
    }

    createEmptyGrid() {
        return [
            [null, null, null, null],
            [null, null, null, null],
            [null, null, null, null],
            [null, null, null, null]
        ]
    }

    getTiles() {
        return this.tiles
    }

    saveGame() {
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
            continueAfterWin: this.continueAfterWin || false,
            startTime: this.startTime || Date.now(),
            history: this.history || []
        }
        return saveGameState(data)
    }

    loadGame() {
        const savedData = loadGameState()
        
        if (savedData) {
            this.maxScore = savedData.maxScore || 0
            this.score = savedData.score || 0
            this.moves = savedData.moves || 0
            this.gameOver = savedData.gameOver || false
            this.won = savedData.won || false
            this.continueAfterWin = savedData.continueAfterWin || false
            this.startTime = savedData.startTime || Date.now()
            this.history = savedData.history || []
            
            this.tiles = savedData.tiles.map(row => 
                row.map(tileData => 
                    tileData ? new Tile(tileData.value, tileData.x, tileData.y, tileData.id) : null
                )
            )
            
            const hasTiles = this.tiles.some(row => row.some(t => t !== null))
            if (hasTiles) {
                this.resetTileFlags()
                return true
            }
        }
        
        this.maxScore = loadMaxScore()
        this.score = 0
        this.moves = 0
        this.gameOver = false
        this.won = false
        this.continueAfterWin = false
        this.startTime = Date.now()
        this.history = []
        this.tiles = this.createEmptyGrid()
        this.spawnTile()
        this.spawnTile()
        return false
    }

    resetTileFlags() {
        for (let y = 0; y < this.tiles.length; y++) {
            for (let x = 0; x < this.tiles[y].length; x++) {
                if (this.tiles[y][x]) {
                    this.tiles[y][x].isNew = false
                    this.tiles[y][x].isMerged = false
                    this.tiles[y][x].isMoving = false
                }
            }
        }
    }

    captureStateForUndo() {
        const state = {
            tiles: this.tiles.map(row => 
                row.map(tile => tile ? { 
                    value: tile.value, 
                    id: tile.id, 
                    x: tile.x, 
                    y: tile.y 
                } : null)
            ),
            score: this.score,
            moves: this.moves
        }
        this.history.push(state)
        if (this.history.length > 10) {
            this.history.shift()
        }

        this.previousTiles = []
        for (let y = 0; y < this.tiles.length; y++) {
            this.previousTiles[y] = []
            for (let x = 0; x < this.tiles[y].length; x++) {
                if (this.tiles[y][x]) {
                    this.previousTiles[y][x] = {
                        id: this.tiles[y][x].id,
                        value: this.tiles[y][x].value,
                        x: this.tiles[y][x].x,
                        y: this.tiles[y][x].y
                    }
                } else {
                    this.previousTiles[y][x] = null
                }
            }
        }
    }

    undo() {
        if (this.history.length === 0 || this.gameOver) return false
        
        const previousState = this.history.pop()
        this.score = previousState.score
        this.moves = previousState.moves
        this.tiles = previousState.tiles.map(row => 
            row.map(tileData => 
                tileData ? new Tile(tileData.value, tileData.x, tileData.y, tileData.id) : null
            )
        )
        this.resetTileFlags()
        this.saveGame()
        return true
    }

    canUndo() {
        return this.history.length > 0 && !this.gameOver
    }

    getElapsedTime() {
        return Date.now() - (this.startTime || Date.now())
    }

    newGame() {
        if (this.score > 0 || this.moves > 0) {
            if (!confirm('Начать новую игру?')) return false
        }
        this.score = 0
        this.moves = 0
        this.gameOver = false
        this.won = false
        this.continueAfterWin = false
        this.tiles = this.createEmptyGrid()
        this.previousTiles = null
        this.spawnTile()
        this.spawnTile()
        this.saveGame()
        return true
    }

    continueGame() {
        this.won = false
        this.continueAfterWin = true
        this.gameOver = false
        this.saveGame()
        window.dispatchEvent(new CustomEvent('gameContinued'))
        return true
    }

    findEmptyCoords() {
        let emptyCoords = []
        for (let y = 0; y < this.tiles.length; y++) {
            for (let x = 0; x < this.tiles[y].length; x++) {
                if (!this.tiles[y][x]) emptyCoords.push(`${x}-${y}`)
            }
        }
        return emptyCoords
    }

    spawnTile(x, y, v = Math.floor(Math.random() * 2 + 1) * 2) {
        if (x === undefined || y === undefined) {
            const emptyCoords = this.findEmptyCoords()
            if (emptyCoords.length === 0) return false

            let randomCoords = emptyCoords[Math.floor(Math.random() * emptyCoords.length)]
            const [newX, newY] = randomCoords.split("-")
            x = parseInt(newX)
            y = parseInt(newY)
        }

        const tile = new Tile(v, +x, +y)
        tile.isNew = true
        this.tiles[y][x] = tile
        return true
    }

    move(direction) {
        if (this.gameOver) return { moved: false, moveInfo: null }

        this.captureStateForUndo()
        this.moved = false
        this.lastMoveInfo = { moved: [], merged: [], new: [] }
        let moved = false

        switch (direction) {
            case 'left': moved = this.moveLeft(); break
            case 'right': moved = this.moveRight(); break
            case 'up': moved = this.moveUp(); break
            case 'down': moved = this.moveDown(); break
        }

        if (moved) {
            this.moves++
            const emptyBefore = this.findEmptyCoords()
            this.spawnTile()
            const emptyAfter = this.findEmptyCoords()
            const newTilePos = emptyBefore.find(pos => !emptyAfter.includes(pos))
            if (newTilePos) {
                const [x, y] = newTilePos.split('-').map(Number)
                const tile = this.tiles[y][x]
                if (tile) {
                    this.lastMoveInfo.new.push({
                        id: tile.id,
                        x: tile.x,
                        y: tile.y,
                        value: tile.value
                    })
                }
            }
            this.saveGame()

            if (!this.won && !this.continueAfterWin && this.score >= 2048) {
                this.won = true
                this.saveGame()
                window.dispatchEvent(new CustomEvent('gameWon'))
            }

            if (!this.canMove()) {
                this.gameOver = true
                this.saveGame()
                window.dispatchEvent(new CustomEvent('gameOver', {
                    detail: { score: this.score }
                }))
            }
        }
        return { moved, moveInfo: this.lastMoveInfo }
    }

    moveLeft() {
        let moved = false
        for (let y = 0; y < this.tiles.length; y++) {
            for (let x = 1; x < this.tiles[y].length; x++) {
                if (!this.tiles[y][x]) continue
                let originalX = x
                let newX = x
                while (newX > 0 && !this.tiles[y][newX - 1]) {
                    this.tiles[y][newX - 1] = this.tiles[y][newX]
                    this.tiles[y][newX] = null
                    newX--
                    moved = true
                }
                if (newX !== originalX) {
                    const tile = this.tiles[y][newX]
                    tile.x = newX
                    tile.y = y
                    this.lastMoveInfo.moved.push({
                        id: tile.id,
                        fromX: originalX,
                        fromY: y,
                        toX: newX,
                        toY: y
                    })
                }
            }
            for (let x = 0; x < this.tiles[y].length - 1; x++) {
                if (this.tiles[y][x] && this.tiles[y][x + 1] &&
                    this.tiles[y][x].value === this.tiles[y][x + 1].value) {
                    const mergedTile = this.tiles[y][x + 1]
                    const fromId = mergedTile.id
                    const targetTile = this.tiles[y][x]
                    targetTile.value *= 2
                    this.score += targetTile.value
                    if (this.score > this.maxScore) {
                        this.maxScore = this.score
                        saveMaxScore(this.maxScore)
                        window.dispatchEvent(new CustomEvent('recordBroken', {
                            detail: { score: this.score }
                        }))
                    }
                    this.lastMoveInfo.merged.push({
                        id: targetTile.id,
                        fromIds: [fromId],
                        toX: x,
                        toY: y,
                        newValue: targetTile.value
                    })
                    targetTile.isMerged = true
                    for (let i = x + 1; i < this.tiles[y].length - 1; i++) {
                        this.tiles[y][i] = this.tiles[y][i + 1]
                    }
                    this.tiles[y][this.tiles[y].length - 1] = null
                    moved = true
                }
            }
        }
        return moved
    }

    moveRight() {
        let moved = false
        for (let y = 0; y < this.tiles.length; y++) {
            for (let x = this.tiles[y].length - 2; x >= 0; x--) {
                if (!this.tiles[y][x]) continue
                let originalX = x
                let newX = x
                while (newX < this.tiles[y].length - 1 && !this.tiles[y][newX + 1]) {
                    this.tiles[y][newX + 1] = this.tiles[y][newX]
                    this.tiles[y][newX] = null
                    newX++
                    moved = true
                }
                if (newX !== originalX) {
                    const tile = this.tiles[y][newX]
                    tile.x = newX
                    tile.y = y
                    this.lastMoveInfo.moved.push({
                        id: tile.id,
                        fromX: originalX,
                        fromY: y,
                        toX: newX,
                        toY: y
                    })
                }
            }
            for (let x = this.tiles[y].length - 1; x > 0; x--) {
                if (this.tiles[y][x] && this.tiles[y][x - 1] &&
                    this.tiles[y][x].value === this.tiles[y][x - 1].value) {
                    const mergedTile = this.tiles[y][x - 1]
                    const fromId = mergedTile.id
                    const targetTile = this.tiles[y][x]
                    targetTile.value *= 2
                    this.score += targetTile.value
                    if (this.score > this.maxScore) {
                        this.maxScore = this.score
                        saveMaxScore(this.maxScore)
                        window.dispatchEvent(new CustomEvent('recordBroken', {
                            detail: { score: this.score }
                        }))
                    }
                    this.lastMoveInfo.merged.push({
                        id: targetTile.id,
                        fromIds: [fromId],
                        toX: x,
                        toY: y,
                        newValue: targetTile.value
                    })
                    targetTile.isMerged = true
                    for (let i = x - 1; i > 0; i--) {
                        this.tiles[y][i] = this.tiles[y][i - 1]
                    }
                    this.tiles[y][0] = null
                    moved = true
                }
            }
        }
        return moved
    }

    moveUp() {
        let moved = false
        for (let x = 0; x < this.tiles[0].length; x++) {
            for (let y = 1; y < this.tiles.length; y++) {
                if (!this.tiles[y][x]) continue
                let originalY = y
                let newY = y
                while (newY > 0 && !this.tiles[newY - 1][x]) {
                    this.tiles[newY - 1][x] = this.tiles[newY][x]
                    this.tiles[newY][x] = null
                    newY--
                    moved = true
                }
                if (newY !== originalY) {
                    const tile = this.tiles[newY][x]
                    tile.x = x
                    tile.y = newY
                    this.lastMoveInfo.moved.push({
                        id: tile.id,
                        fromX: x,
                        fromY: originalY,
                        toX: x,
                        toY: newY
                    })
                }
            }
            for (let y = 0; y < this.tiles.length - 1; y++) {
                if (this.tiles[y][x] && this.tiles[y + 1][x] &&
                    this.tiles[y][x].value === this.tiles[y + 1][x].value) {
                    const mergedTile = this.tiles[y + 1][x]
                    const fromId = mergedTile.id
                    const targetTile = this.tiles[y][x]
                    targetTile.value *= 2
                    this.score += targetTile.value
                    if (this.score > this.maxScore) {
                        this.maxScore = this.score
                        saveMaxScore(this.maxScore)
                        window.dispatchEvent(new CustomEvent('recordBroken', {
                            detail: { score: this.score }
                        }))
                    }
                    this.lastMoveInfo.merged.push({
                        id: targetTile.id,
                        fromIds: [fromId],
                        toX: x,
                        toY: y,
                        newValue: targetTile.value
                    })
                    targetTile.isMerged = true
                    for (let i = y + 1; i < this.tiles.length - 1; i++) {
                        this.tiles[i][x] = this.tiles[i + 1][x]
                    }
                    this.tiles[this.tiles.length - 1][x] = null
                    moved = true
                }
            }
        }
        return moved
    }

    moveDown() {
        let moved = false
        for (let x = 0; x < this.tiles[0].length; x++) {
            for (let y = this.tiles.length - 2; y >= 0; y--) {
                if (!this.tiles[y][x]) continue
                let originalY = y
                let newY = y
                while (newY < this.tiles.length - 1 && !this.tiles[newY + 1][x]) {
                    this.tiles[newY + 1][x] = this.tiles[newY][x]
                    this.tiles[newY][x] = null
                    newY++
                    moved = true
                }
                if (newY !== originalY) {
                    const tile = this.tiles[newY][x]
                    tile.x = x
                    tile.y = newY
                    this.lastMoveInfo.moved.push({
                        id: tile.id,
                        fromX: x,
                        fromY: originalY,
                        toX: x,
                        toY: newY
                    })
                }
            }
            for (let y = this.tiles.length - 1; y > 0; y--) {
                if (this.tiles[y][x] && this.tiles[y - 1][x] &&
                    this.tiles[y][x].value === this.tiles[y - 1][x].value) {
                    const mergedTile = this.tiles[y - 1][x]
                    const fromId = mergedTile.id
                    const targetTile = this.tiles[y][x]
                    targetTile.value *= 2
                    this.score += targetTile.value
                    if (this.score > this.maxScore) {
                        this.maxScore = this.score
                        saveMaxScore(this.maxScore)
                        window.dispatchEvent(new CustomEvent('recordBroken', {
                            detail: { score: this.score }
                        }))
                    }
                    this.lastMoveInfo.merged.push({
                        id: targetTile.id,
                        fromIds: [fromId],
                        toX: x,
                        toY: y,
                        newValue: targetTile.value
                    })
                    targetTile.isMerged = true
                    for (let i = y - 1; i > 0; i--) {
                        this.tiles[i][x] = this.tiles[i - 1][x]
                    }
                    this.tiles[0][x] = null
                    moved = true
                }
            }
        }
        return moved
    }

    canMove() {
        if (this.findEmptyCoords().length > 0) return true
        for (let y = 0; y < this.tiles.length; y++) {
            for (let x = 0; x < this.tiles[y].length; x++) {
                const current = this.tiles[y][x]
                if (!current) continue
                if (x < this.tiles[y].length - 1 && this.tiles[y][x + 1] &&
                    this.tiles[y][x + 1].value === current.value) return true
                if (y < this.tiles.length - 1 && this.tiles[y + 1][x] &&
                    this.tiles[y + 1][x].value === current.value) return true
            }
        }
        return false
    }
}