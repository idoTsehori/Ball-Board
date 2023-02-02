'use strict';
// Sounds

const WALL = 'WALL';
const FLOOR = 'FLOOR';

const BALL = 'BALL';
const GAMER = 'GAMER';
const GLUE = 'GLUE';
const FROZEN_GAMER = 'FROZEN_GAMER';

const GAMER_IMG = '\n\t\t<img src="img/gamer.png">\n';
const BALL_IMG = '\n\t\t<img src="img/ball.png">\n';
const GLUE_IMG = '\n\t\t<img src="img/candy.png">\n';
const FROZEN_GAMER_IMG = '\n\t\t<img src="img/gamer-purple.png">\n';

// Model:
var gBoard;
var gGamerPos;
var gBallsOnBoardCount;
var gScore;
var gIsGlued;
var gBallInerval;
var gGlueInterval;
var gGamerOnPassCell;

function initGame() {
  if (gBallInerval) clearInterval(gBallInerval);
  // Model
  gBallsOnBoardCount = 2;
  gScore = 0;
  gGamerPos = { i: 2, j: 9 };
  gIsGlued = false;
  gGamerOnPassCell = false;
  gBoard = buildBoard();

  gBallInerval = setInterval(addBall, 2000);
  gGlueInterval = setInterval(addGlue, 5000);

  // DOM
  renderBoard(gBoard);
  document.querySelector('.restart-btn').classList.add('hide');
  document.querySelector('.victory-msg').classList.add('hide');
  document.querySelector('.collected-balls-num').innerHTML = gScore;
}

function buildBoard() {
  var board = [];

  // TODO: Create the Matrix 10 * 12
  board = createMat(10, 12);

  // TODO: Put FLOOR everywhere and WALL at edges
  for (var i = 0; i < board.length; i++) {
    for (var j = 0; j < board[i].length; j++) {
      board[i][j] = { type: FLOOR, gameElement: null };
      if (i === 0 || i === board.length - 1) board[i][j].type = WALL;
      else if (j === 0 || j === board[i].length - 1) board[i][j].type = WALL;
    }
  }

  // TODO: Place the gamer and two balls
  board[gGamerPos.i][gGamerPos.j].gameElement = GAMER;
  board[4][7].gameElement = BALL;
  board[3][3].gameElement = BALL;

  //  Add passages that take the gamer from left/right or top/bottom:
  board[0][board[0].length / 2 - 1].type = FLOOR;
  board[board.length - 1][board[0].length / 2 - 1].type = FLOOR;
  board[board[0].length / 2 - 1][0].type = FLOOR;
  board[board[0].length / 2 - 1][board[0].length - 1].type = FLOOR;

  return board;
}

// Render the board to an HTML table
function renderBoard(board) {
  var elBoard = document.querySelector('.board');
  var strHTML = '';

  for (var i = 0; i < board.length; i++) {
    strHTML += '<tr>\n';

    for (var j = 0; j < board[0].length; j++) {
      var currCell = board[i][j];

      var cellClass = getClassName({ i, j });

      if (currCell.type === FLOOR) cellClass += ' floor';
      else if (currCell.type === WALL) cellClass += ' wall';

      strHTML += `\t<td class="cell ${cellClass}" onclick="moveTo(${i}, ${j})">`;

      if (currCell.gameElement === GAMER) {
        strHTML += GAMER_IMG;
      } else if (currCell.gameElement === BALL) {
        strHTML += BALL_IMG;
      }

      strHTML += '\t</td>\n';
    }
    strHTML += '</tr>\n';
  }
  elBoard.innerHTML = strHTML;
}

// Move the player to a specific location
function moveTo(i, j) {
  if (gIsGlued) return;

  gGamerOnPassCell = false;
  if (i < 0 || (gGamerPos.i === 0 && i === 9)) {
    i = gBoard.length - 1;
    gGamerOnPassCell = true;
  } else if (i >= gBoard.length || (gGamerPos.i === 9 && i === 0)) {
    i = 0;
    gGamerOnPassCell = true;
  } else if (j < 0 || (gGamerPos.j === 0 && j === 11)) {
    j = gBoard[0].length - 1;
    gGamerOnPassCell = true;
  } else if (j >= gBoard[0].length || (gGamerPos.j === 11 && j === 0)) {
    j = 0;
    gGamerOnPassCell = true;
  }

  var targetCell = gBoard[i][j];
  if (targetCell.type === WALL) return;
  // Calculate distance to make sure we are moving to a neighbor cell
  var iAbsDiff = Math.abs(i - gGamerPos.i);
  var jAbsDiff = Math.abs(j - gGamerPos.j);

  // If the clicked Cell is one of the four allowed
  if (
    (iAbsDiff === 1 && jAbsDiff === 0) ||
    (jAbsDiff === 1 && iAbsDiff === 0) ||
    gGamerOnPassCell
  ) {
    if (targetCell.gameElement === BALL) {
      playSound('sounds/Yam.mp3');
      // Model
      gScore++;
      gBallsOnBoardCount--;

      // DOM
      document.querySelector('.collected-balls-num').innerHTML = gScore;
      // if there's no balls on the board:
      if (!gBallsOnBoardCount) victory();
    }

    // TODO: Move the gamer
    // Update the Model:
    gBoard[gGamerPos.i][gGamerPos.j].gameElement = null;

    // DOM:
    renderCell(gGamerPos, '');

    // Update the Model:
    gGamerPos = { i, j };

    if (targetCell.gameElement === GLUE) {
      onGlueStep(targetCell);
      return;
    }
    targetCell.gameElement = GAMER;
    // DOM:
    setBallsCountAroundGamer(gGamerPos.i, gGamerPos.j);
    renderCell(gGamerPos, GAMER_IMG);
  }
  // else console.log('TOO FAR', iAbsDiff, jAbsDiff);
}

function onGlueStep(cell) {
  playSound('sounds/awww.mp3');
  // UPDATE MODEL
  cell.gameElement = FROZEN_GAMER;
  gIsGlued = true;
  //   DOM
  renderCell(gGamerPos, FROZEN_GAMER_IMG);

  setTimeout(() => {
    // UPDATE MODEL
    cell.gameElement = GAMER;
    gIsGlued = false;
    //   DOM
    renderCell(gGamerPos, GAMER_IMG);
  }, 3000);
}

// Convert a location object {i, j} to a selector and render a value in that element
function renderCell(location, value) {
  var cellSelector = '.' + getClassName(location);
  var elCell = document.querySelector(cellSelector);
  elCell.innerHTML = value;
}

// Move the player by keyboard arrows
function handleKey(event) {
  var i = gGamerPos.i;
  var j = gGamerPos.j;

  switch (event.key) {
    case 'ArrowLeft':
      moveTo(i, j - 1);
      break;
    case 'ArrowRight':
      moveTo(i, j + 1);
      break;
    case 'ArrowUp':
      moveTo(i - 1, j);
      break;
    case 'ArrowDown':
      moveTo(i + 1, j);
      break;
  }
}

// Returns the class name for a specific cell
function getClassName(location) {
  var cellClass = 'cell-' + location.i + '-' + location.j;
  return cellClass;
}

function addBall() {
  var emptyPos = getEmptyCellPos();
  if (!emptyPos) return;
  //   Model
  gBoard[emptyPos.i][emptyPos.j].gameElement = BALL;
  //   Dom
  renderCell(emptyPos, BALL_IMG);

  gBallsOnBoardCount++;

  setBallsCountAroundGamer(gGamerPos.i, gGamerPos.j);
}

function addGlue() {
  var emptyPos = getEmptyCellPos();
  if (!emptyPos) return;
  //   Model
  var currCell = gBoard[emptyPos.i][emptyPos.j];
  currCell.gameElement = GLUE;
  //   Dom
  renderCell(emptyPos, GLUE_IMG);

  setTimeout(() => {
    if (currCell.gameElement === GAMER || currCell.gameElement === FROZEN_GAMER) return;
    //   Model
    currCell.gameElement = null;
    //   Dom
    renderCell(emptyPos, '');
  }, 3000);
}

function isEmptyCell(cellPos) {
  var currCell = gBoard[cellPos.i][cellPos.j];
  if (!currCell.gameElement && currCell.type === FLOOR) return true;
  return false;
}

function victory() {
  gIsGlued = true;
  clearInterval(gBallInerval);
  clearInterval(gGlueInterval);
  document.querySelector('.restart-btn').classList.remove('hide');
  document.querySelector('.victory-msg').classList.remove('hide');
  playSound('sounds/KULULU.mp3');
}

function setBallsCountAroundGamer(gamerI, gamerJ) {
  var count = 0;
  for (var i = gamerI - 1; i <= gamerI + 1; i++) {
    if (i < 0 || i >= gBoard.length) continue;
    for (var j = gamerJ - 1; j <= gamerJ + 1; j++) {
      if (i === gamerI && j === gamerJ) continue;
      if (j < 0 || j >= gBoard[i].length) continue;
      var currCell = gBoard[i][j];
      if (currCell.gameElement === BALL) count++;
    }
  }
  document.querySelector('.balls-around-msg span').innerHTML = count;
}

function getEmptyCellPos() {
  var emptyCellsPoss = [];
  for (var i = 0; i < gBoard.length; i++) {
    for (var j = 0; j < gBoard[i].length; j++) {
      if (isEmptyCell({ i, j })) emptyCellsPoss.push({ i, j });
    }
  }
  if (emptyCellsPoss.length === 0) return null;
  var randomIdx = getRandomInt(0, emptyCellsPoss.length);
  return emptyCellsPoss[randomIdx];
}
