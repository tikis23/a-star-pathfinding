var canvas = document.getElementById('canvas');
var ctx = canvas.getContext('2d');
var gridSizeX = 32;
var gridSizeY = 32;
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
var allowDiagonal = document.getElementById('allow-diagonal');
var cornerCheck = document.getElementById('diagonal-corner-check');
var animSpeed = document.getElementById('anim-speed');
var animStep = document.getElementById('anim-step');
var animReset = document.getElementById('anim-reset');
var ui = document.getElementById('ui-menu');
var uiExpanded = true;
var draggingMouse = false;
var rightClick = false;
var animStepCount = 0;

// A* https://en.wikipedia.org/wiki/A*_search_algorithm
function heuristic(from, to) {
    return Math.abs(from.x - to.x) + Math.abs(from.y - to.y);
}
function astar(from, to) {
    // setup walk directions
    var costHorizontal = 10;
    var costDiagonal = 14;
    var dirs = [
        {x: -1, y:  0, cost: costHorizontal},
        {x:  1, y:  0, cost: costHorizontal},
        {x:  0, y:  1, cost: costHorizontal},
        {x:  0, y: -1, cost: costHorizontal},
    ];
    if (allowDiagonal.checked) {
        dirs = [
            {x: -1, y:  0, cost: costHorizontal},
            {x:  1, y:  0, cost: costHorizontal},
            {x:  0, y:  1, cost: costHorizontal},
            {x:  0, y: -1, cost: costHorizontal},
            {x: -1, y: -1, cost: costDiagonal},
            {x: -1, y:  1, cost: costDiagonal},
            {x:  1, y: -1, cost: costDiagonal},
            {x:  1, y:  1, cost: costDiagonal},
        ];
    }

    // TODO: use something like a heap to speed up the pathfinding
    // setup used lists
    var path = [];
    var open = [];
    var closed = new Array(gridSizeX * gridSizeY).fill(false);
    if (from === null || to === null) return {path: path, open: open, closed: closed};
    open.push({parent: null, pos: from, g: 0, h: costHorizontal * heuristic(from, to)});

    var counter = 0;
    while (open.length > 0) {
        if (counter >= animStepCount) break;
        counter += 1;
        // get node with lowest f
        var currentIndex = 0;
        var lowestF = Infinity;
        for (var i = 0; i < open.length; i++) {
            var f = open[i].g + open[i].h;
            if (f <= lowestF) {
                lowestF = f;
                currentIndex = i;
            }
        }
        var current = open[currentIndex];
        open.splice(currentIndex, 1);
        closed[current.pos.y * gridSizeX + current.pos.x] = true;

        // check if target is reached
        if (current.pos.x == to.x && current.pos.y == to.y) {
            while (current.parent !== null) {
                path.push(current.pos);
                current = current.parent;
            }
            path.reverse();
            break;
        }

        // check neighbors
        for (var i = 0; i < dirs.length; i++) {
            var dir = dirs[i];
            var newNodePos = {x: current.pos.x + dir.x, y: current.pos.y + dir.y};
            var newNode = {
                parent: current,
                pos : newNodePos,
                g: current.g + dir.cost,
                h: costHorizontal * heuristic(newNodePos, to)
            };
            
            // check if out-of-bounds/closed/wall
            var newNodeIndex = newNode.pos.y * gridSizeX + newNode.pos.x;
            if (newNode.pos.x < 0 || newNode.pos.x >= gridSizeX) continue;
            if (newNode.pos.y < 0 || newNode.pos.y >= gridSizeY) continue;
            if (closed[newNodeIndex]) continue;
            if (grid[newNodeIndex] == 1) continue;

            // skipping corners
            if (dir.x !== 0 && dir.y !== 0 && !cornerCheck.checked) {
                if (grid[(current.pos.y + dir.y) * gridSizeX + current.pos.x] == 1 &&
                    grid[current.pos.y * gridSizeX + (current.pos.x + dir.x)] == 1) continue;
            }

            // check if node is already in open list
            var foundIndex = null;
            for (var j = 0; j < open.length; j++) {
                if (open[j].pos.x == newNode.pos.x && open[j].pos.y == newNode.pos.y) {
                    foundIndex = j;
                    break;
                }
            }

            // if node is not in open list, add it
            if (foundIndex === null) {
                open.push(newNode);
                continue;
            }

            // if node is in open list, check if new path is better
            if (newNode.g < open[foundIndex].g) {
                open[foundIndex] = newNode;
            }
        }
    }

    return {path: path, open: open, closed: closed};
}

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
    var index = posY * gridSizeX + posX;
    var updated = false;
    if (posX < 0 || posX >= gridSizeX) return updated;
    if (posY < 0 || posY >= gridSizeY) return updated;
    if (erase) {
        if (grid[index] !== 0) updated = true;
        grid[index] = 0;
    } else {
        var val = grid[index];
        if (selectionTileWall.checked) {
            if (val !== 1) updated = true;
            grid[index] = 1;
        } else if (selectionTileStart.checked && val !== 2 && val !== 1 && val !== 3) {
            removeCells(2);
            grid[index] = 2;
            updated = true;
        }
        else if (selectionTileEnd.checked && val !== 3 && val !== 1 && val !== 2) {
            removeCells(3);
            grid[index] = 3;
            updated = true;
        }
    }
    return updated;
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
        if (setCell(cell.x, cell.y, rightClick)) drawGrid();
    }   
}, true);
canvas.addEventListener('click', function(e) { // left-click
    var cell = getCellFromMouse(e);
    if (setCell(cell.x, cell.y, false)) drawGrid();
}, true);
canvas.addEventListener('contextmenu', function(e) { // right-click
    var cell = getCellFromMouse(e);
    if (setCell(cell.x, cell.y, true)) drawGrid();
    e.preventDefault();
});
document.addEventListener('mouseleave', function(e) {
    draggingMouse = false;
}, true);
window.addEventListener('keydown', function(e) {
    if(e.code === 'Space') {
        animStepCount = 0;
        drawGrid();
        e.preventDefault();
    }
});
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
allowDiagonal.addEventListener('change', function() {
    drawGrid();
}, true);
animStep.addEventListener('click', function() {
    animStepCount += 1;
    drawGrid();
}, true);
animReset.addEventListener('click', function() {
    animStepCount = 0;
    drawGrid();
}, true);

// rendering
function getCellSize() {
    return window.innerWidth / gridSizeX;
}
function drawGrid() {
    // find start/end point
    var start = null;
    var end = null;
    for (var x = 0; x < gridSizeX; x++) {
        for (var y = 0; y < gridSizeY; y++) {
            var cell = grid[y * gridSizeX + x];
            if (cell === 2) start = {x: x, y: y};
            else if (cell === 3) end = {x: x, y: y};
            // early exit
            if (start !== null && end !== null) break;
        }
    }

    // reset anim timer when start/end is not set
    if (start === null || end === null) {
        animStepCount = 0;
    }

    // get results from astar
    var res = astar(start, end);
    
    // clear the canvas
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // draw the grid
    var cellSize = getCellSize();
    for (var x = 0; x < gridSizeX; x++) {
        for (var y = 0; y < gridSizeY; y++) {
            var gridIndex = y * gridSizeX + x;
            var cell = grid[gridIndex];

            if (res.closed[gridIndex]) ctx.fillStyle = 'yellow';
            else if (cell === 0) ctx.fillStyle = 'lightgray';
            else if (cell === 1) ctx.fillStyle = '#505050';
            else continue;

            ctx.fillRect(x * cellSize, y * cellSize, cellSize - 1, cellSize - 1);
        }
    }

    // draw open
    ctx.fillStyle = 'orange';
    for (var i = 0; i < res.open.length; i++) {
        var x = res.open[i].pos.x;
        var y = res.open[i].pos.y;
        ctx.fillRect(x * cellSize, y * cellSize, cellSize - 1, cellSize - 1);
    }

    // draw final path
    ctx.fillStyle = 'blue';
    for (var i = 0; i < res.path.length - 1; i++) {
        var x = res.path[i].x;
        var y = res.path[i].y;
        ctx.fillRect(x * cellSize, y * cellSize, cellSize - 1, cellSize - 1);
    }

    // draw start/end
    if (start !== null) {
        ctx.fillStyle = 'green';
        ctx.fillRect(start.x * cellSize, start.y * cellSize, cellSize - 1, cellSize - 1);
    }
    if (end !== null) {
        ctx.fillStyle = 'red';
        ctx.fillRect(end.x * cellSize, end.y * cellSize, cellSize - 1, cellSize - 1);
    }
}
function updateCanvasSize() {
    var width = document.body.clientWidth;
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

function animationLoop() {
    var intervalTime = 1000;
    var speedVal = parseInt(animSpeed.value);
    if (speedVal <= 0) {
    } else if (speedVal <= 40) {
        intervalTime -= speedVal * 20;
        animStepCount += 1;
    } else if (speedVal <= 80) {
        intervalTime -= speedVal * 20;
        animStepCount += speedVal / 60;
    } else if (speedVal < 100) {
        intervalTime = 0;
        animStepCount += speedVal / 40;
    } else {
        intervalTime = 250;
        animStepCount = Infinity;
    }
    drawGrid();
    intervalTime = Math.max(intervalTime, 1);
    intervalTime = Math.min(intervalTime, 1000);
    setTimeout(animationLoop, intervalTime);
}
setTimeout(animationLoop, 1000);