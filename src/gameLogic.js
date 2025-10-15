import Game from './classes/Game.js'
import Tile from './classes/Tile.js'

const game = new Game()
let tileList = []


function render(list, styleList) {
  const gameTiles = document.querySelector(".gameTiles")
  if (tileList.length == 0) gameTiles.innerHTML = ""

  for (let y = 0; y < list.length; y++) {
    for (let x = 0; x < list.length; x++) {
      const item = list[y][x];
      if (!item) continue
      const foundedItem = tileList.find((tileListItem) => tileListItem.id == item.id)

      if (!foundedItem) {
        const defaultTile = document.createElement("div")
        defaultTile.classList.add("tile", `tile-${item.value}`)
        defaultTile.innerHTML = item.value
        defaultTile.setAttribute("style", styleList[`${x}-${y}`])
        tileList.push({
          dom: defaultTile,
          id: item.id
        })
        gameTiles.appendChild(defaultTile)
      }
      else {
        foundedItem.dom.className = `tile tile-${item.value}`;
        foundedItem.dom.setAttribute("style", styleList[`${x}-${y}`])
      }
    }
  }
  console.log(list, tileList)
}






export default function start() {
  const newGameBtn = document.querySelector(".newGame")

  newGameBtn.addEventListener("click", () => {
    game.newGame();
    tileList = [];
    render(game.tiles, game.styleTable)
  })

  document.addEventListener("keydown", (e) => {
    if (e.code == "ArrowLeft") {
      game.moveLeft()
      render(game.tiles, game.styleTable)
    };

    if (e.code == "ArrowRight") {
      game.moveRight()
      render(game.tiles, game.styleTable)
    };

    if (e.code == "ArrowUp") {
      game.moveUp()
      render(game.tiles, game.styleTable)
    };

    if (e.code == "ArrowDown") {
      game.moveDown()
      render(game.tiles, game.styleTable)
    }
  })

  game.newGame();
  render(game.tiles, game.styleTable);
} 