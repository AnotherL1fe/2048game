import Game from './classes/Game.js'


const game = new Game()
let tileList = []


function render(list, styleList) {
  const gameTiles = document.querySelector(".gameTiles")

  if (tileList.length == 0) gameTiles.innerHTML = ""
  for (let item of list) {
    const foundedItem = tileList.find((tileListItem) => tileListItem.id == item.id)
    if (!foundedItem) {
      const defaultTile = document.createElement("div")
      defaultTile.classList.add("tile")
      defaultTile.innerHTML = item.value
      defaultTile.setAttribute("style", styleList[`${item.x}-${item.y}`])
      tileList.push({
        dom: defaultTile,
        id: item.id
      })
      gameTiles.appendChild(defaultTile)
    }
    else {
      foundedItem.dom.setAttribute("style", styleList[`${item.x}-${item.y}`])
    }


  }
}




export default function start() {
  const newGameBtn = document.querySelector(".newGame")
  newGameBtn.addEventListener("click", () => {
    game.newGame()
    tileList = []
    render(game.tiles, game.styleTable)
  })

  document.addEventListener("keydown", (e) => {
    if (e.code == "ArrowLeft") {
      game.moveLeft()
      render(game.tiles, game.styleTable)
    }

    if (e.code == "ArrowRight") {
      game.moveRigth()
      render(game.tiles, game.styleTable)
    }

    if (e.code == "ArrowUp") {
      game.moveUp()
      render(game.tiles, game.styleTable)
    }

    if (e.code == "ArrowDown") {
      game.moveDown()
      render(game.tiles, game.styleTable)
    }
  })
  game.newGame()
  render(game.tiles, game.styleTable)
  // game.moveDown()
  // console.log(game.styleTable);



} 