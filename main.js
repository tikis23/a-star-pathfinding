var canvas = document.getElementById('canvas');
var ctx = canvas.getContext('2d');
var gridSizeX = 20;
var gridSizeY = 20;
var oldGridSizeX = gridSizeX;
var oldGridSizeY = gridSizeY;
var grid = null;
var selectionTileWall = document.getElementById('tile-wall');
var selectionTileStart = document.getElementById('tile-start');
var selectionTileEnd = document.getElementById('tile-end');
var dropdownButton = document.getElementById('dropdown-button');
var clearButton = document.getElementById('clear-button');
var menuGridSizeX = document.getElementById('grid-size-x');
var menuGridSizeY = document.getElementById('grid-size-y');
var ui = document.getElementById('ui-menu');
var uiExpanded = true;
var draggingMouse = false;
var rightClick = false;

// A*

// grid
function updateGridSize() {
    var newGrid = new Array(gridSizeX * gridSizeY).fill(0);
    // copy old grid into the new one
    if (grid !== null) {
        for (var x = 0; x < gridSizeX; x++) {
            for (var y = 0; y < gridSizeY; y++) {
                if (x < oldGridSizeX && y < oldGridSizeY) {
                    newGrid[y * gridSizeX + x] = grid[y * oldGridSizeX + x];
                } else {
                    newGrid[y * gridSizeX + x] = 0;
                }
            }
        }
    }

    oldGridSizeX = gridSizeX;
    oldGridSizeY = gridSizeY;
    grid = newGrid;
    updateCanvasSize();
}
updateGridSize();

// input
function removeCells(cellType) {
    for (var i = 0; i < grid.length; i++) {
        if (grid[i] == cellType) grid[i] = 0;
    }
}
function setCell(posX, posY, erase) {
    if (erase) {
        grid[posY * gridSizeX + posX] = 0;
    } else {
        var val = grid[posY * gridSizeX + posX];
        if (selectionTileWall.checked) grid[posY * gridSizeX + posX] = 1;
        else if (val === 1 || val === 2 || val === 3) return;
        if (selectionTileStart.checked) {
            removeCells(2);
            grid[posY * gridSizeX + posX] = 2;
        }
        else if (selectionTileEnd.checked) {
            removeCells(3);
            grid[posY * gridSizeX + posX] = 3;
        }
    }
} 
function getCellFromMouse(e) {
    var cellSize = getCellSize();
    var x = Math.floor(e.pageX / cellSize);
    var y = Math.floor(e.pageY / cellSize);
    return { x: x, y: y };
}
canvas.addEventListener('mousedown', function(e) {
    draggingMouse = true;
    rightClick = (e.button == 2);
}, true);
canvas.addEventListener('mouseup', function(e) {
    draggingMouse = false;
}, true);
canvas.addEventListener('mousemove', function (e) {
    if (draggingMouse) {
        var cell = getCellFromMouse(e);
        setCell(cell.x, cell.y, rightClick);
        drawGrid();
    }   
}, true);
canvas.addEventListener('click', function(e) { // left-click
    var cell = getCellFromMouse(e);
    setCell(cell.x, cell.y, false);
    drawGrid();
}, true);
canvas.addEventListener('contextmenu', function(e) { // right-click
    var cell = getCellFromMouse(e);
    setCell(cell.x, cell.y, true);
    drawGrid();
    e.preventDefault();
});
document.addEventListener('mouseleave', function(e) {
    draggingMouse = false;
}, true);

// ui
menuGridSizeX.value = gridSizeX;
menuGridSizeY.value = gridSizeY;
selectionTileWall.checked = true;
dropdownButton.addEventListener('click', function() {
    uiExpanded = !uiExpanded;
    if (uiExpanded) dropdownButton.textContent = "<";
    else dropdownButton.textContent = ">";

    if (uiExpanded) ui.style.display = 'flex';
    else ui.style.display = 'none';
}, true);
clearButton.addEventListener('click', function() {
    grid = new Array(gridSizeX * gridSizeY).fill(0);
    drawGrid();
}, true);
menuGridSizeX.addEventListener('input', function() {
    gridSizeX = parseInt(menuGridSizeX.value);
    if (gridSizeX > menuGridSizeX.max) gridSizeX = menuGridSizeX.max;
    if (gridSizeX < menuGridSizeX.min) gridSizeX = menuGridSizeX.min;
    menuGridSizeX.value = gridSizeX;
    updateGridSize();
}, true);
menuGridSizeY.addEventListener('input', function() {
    gridSizeY = parseInt(menuGridSizeY.value);
    if (gridSizeY > menuGridSizeY.max) gridSizeY = menuGridSizeY.max;
    if (gridSizeY < menuGridSizeY.min) gridSizeY = menuGridSizeY.min;
    menuGridSizeY.value = gridSizeY;
    updateGridSize();
}, true);


// rendering
function getCellSize() {
    return window.innerWidth / gridSizeX;
}
function drawGrid() {
    // clear the canvas
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // draw the grid
    var cellSize = getCellSize();
    for (var x = 0; x < gridSizeX; x++) {
        for (var y = 0; y < gridSizeY; y++) {
            var cell = grid[y * gridSizeX + x];
            if (cell === 0) ctx.fillStyle = 'lightgray';
            else if (cell === 1) ctx.fillStyle = '#505050';
            else if (cell === 2) ctx.fillStyle = 'green';
            else if (cell === 3) ctx.fillStyle = 'red';
            ctx.fillRect(x * cellSize, y * cellSize, cellSize - 1, cellSize - 1);
        }
    }
}
function updateCanvasSize() {
    var width = window.innerWidth;
    var height = getCellSize() * gridSizeY;

    canvas.width = width;
    canvas.height = height;
    canvas.style.width = canvas.width + 'px';
    canvas.style.height = canvas.height + 'px';
    drawGrid();
}
window.addEventListener('resize', function() {
    updateCanvasSize();
}, true);
updateCanvasSize();