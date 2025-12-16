//-------------------------- SECTION: ELEMENT REFERENCES ----------------------------------------------
const btnStart = document.getElementById('startVehiclePosition');
const btnEnd = document.getElementById('endVehiclePosition');
const field = document.querySelector('.displayField');
const distanceField = document.getElementById('distanceField');
const onAllyMarker = document.querySelector('#onAllyMarker');
const onEnemyMarker = document.querySelector('#onEnemyMarker');
const imageCanvas = document.getElementById('imageCanvas');
const btnGridStart = document.getElementById('startGridPosition'); 
const btnGridEnd = document.getElementById('endGridPosition'); 
const gridDistanceInput = document.getElementById('gridDistanceInput'); 

const ctx = imageCanvas ? imageCanvas.getContext('2d') : null;
const TARGET_SIZE = 800;
let isMapLoaded = false;
let currentImageFile = null;


//-------------------------- SECTION: STATE VARIABLES -------------------------------------------------
let tankPos1 = {x:0, y:0};
let tankPos2 = {x:0, y:0};
let gridPos1 = {x: 0, y: 0};
let gridPos2 = {x: 0, y: 0};
let mode = null;
let scaleFactor = 1.0;


//-------------------------- SECTION: IMAGE LOADING AND CROPPING (CANVAS) -----------------------------
function drawCroppedImageToCanvas(file) {
    if (!ctx) {
        console.error("Canvas context is not available.");
        return;
    }
    
    currentImageFile = file;
    const img = new Image();
    img.src = URL.createObjectURL(file); 
    
    img.onload = function() {
        redrawImage(img);
        
        isMapLoaded = true;
        onAllyMarker.style.display = 'none';
        onEnemyMarker.style.display = 'none';
        tankPos1 = {x:0, y:0};
        tankPos2 = {x:0, y:0};
        gridPos1 = {x:0, y:0};
        gridPos2 = {x:0, y:0};
        calculateDistance();
        URL.revokeObjectURL(img.src); 
    };
    
    img.onerror = function() {
        console.error("Failed to load image from source.");
        URL.revokeObjectURL(img.src);
    };
}

function redrawImage(img) {
    if (!ctx || !img) return;

    const sourceWidth = img.naturalWidth;
    const sourceHeight = img.naturalHeight;
    const targetRatio = 1; 
    let sX = 0, sY = 0, sW = sourceWidth, sH = sourceHeight;

    if (sourceWidth / sourceHeight > targetRatio) {
        sW = sourceHeight * targetRatio;
        sX = (sourceWidth - sW) / 2;
    } else if (sourceWidth / sourceHeight < targetRatio) {
        sH = sourceWidth / targetRatio;
        sY = (sourceHeight - sH) / 2;
    }

    ctx.clearRect(0, 0, TARGET_SIZE, TARGET_SIZE);
    ctx.drawImage(img, sX, sY, sW, sH, 0, 0, TARGET_SIZE, TARGET_SIZE);
    drawGridLine();
}

//-------------------------- SECTION: DRAWING GRID LINE ON CANVAS -----------------------------------
function drawGridLine() {
    if (!ctx || !isMapLoaded || (gridPos1.x === 0 && gridPos1.y === 0 && gridPos2.x === 0 && gridPos2.y === 0)) {
        if (isMapLoaded && currentImageFile) {
            const tempImg = new Image();
            tempImg.onload = () => redrawImage(tempImg);
            tempImg.src = URL.createObjectURL(currentImageFile);
        }
        return;
    }

    const startX = gridPos1.x;
    const startY = gridPos1.y;
    const endX = gridPos2.x;
    const endY = gridPos2.y;
    const endCapLength = 10;

    ctx.beginPath();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    const dx = endX - startX;
    const dy = endY - startY;
    const angle = Math.atan2(dy, dx); 
    
    const perpAngle = angle + Math.PI / 2; 

    const drawEndCap = (x, y) => {
        const capX1 = x + Math.cos(perpAngle) * endCapLength / 2;
        const capY1 = y + Math.sin(perpAngle) * endCapLength / 2;
        
        const capX2 = x - Math.cos(perpAngle) * endCapLength / 2;
        const capY2 = y - Math.sin(perpAngle) * endCapLength / 2;

        ctx.beginPath();
        ctx.strokeStyle = '#FFFFFF'; 
        ctx.lineWidth = 2;
        ctx.moveTo(capX1, capY1);
        ctx.lineTo(capX2, capY2);
        ctx.stroke();
    };

    drawEndCap(startX, startY);
    drawEndCap(endX, endY);
}


//-------------------------- SECTION: FILE & PASTE HANDLING -------------------------------------------
const fileInput = document.getElementById('imageUpload');

fileInput.addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
        drawCroppedImageToCanvas(file); 
    } else if (file) {
        alert('Please select a valid image file.'); 
    }
});

document.addEventListener('paste', function(event) {
    event.preventDefault();
    const items = event.clipboardData.items;

    for (let i = 0; i < items.length; i++) {
        if (items[i].kind === 'file' && items[i].type.startsWith('image/')) {
            const clipboardFile = items[i].getAsFile();
            if (clipboardFile) {
                drawCroppedImageToCanvas(clipboardFile);
                return;
            }
        }
    }
    console.log("Pasted data was not a supported image file format.");
});


//-------------------------- SECTION: BUTTON MODE CONTROL ---------------------------------------------
btnStart.onclick = () => {
    mode = 'startTank'; 
    btnStart.style.background = '#86b6feff';
    btnEnd.style.background = '';
    btnGridStart.style.background = '';
    btnGridEnd.style.background = '';
    drawGridLine();
};
btnEnd.onclick = () => {
    mode = 'endTank'; 
    btnEnd.style.background = '#ed6b6bff';
    btnStart.style.background = '';
    btnGridStart.style.background = '';
    btnGridEnd.style.background = '';
    drawGridLine();
};
btnGridStart.onclick = () => {
    mode = 'startGrid'; 
    btnGridStart.style.background = '#00ffaaff';
    btnGridEnd.style.background = '';
    btnStart.style.background = '';
    btnEnd.style.background = '';
}
btnGridEnd.onclick = () => {
    mode = 'endGrid'; 
    btnGridEnd.style.background = '#ff4d00ff';
    btnGridStart.style.background = '';
    btnStart.style.background = '';
    btnEnd.style.background = '';
}


//-------------------------- SECTION: MAP CLICK HANDLER -----------------------------------------------
field.addEventListener('click', (e) => {
    if (!mode) return;
    if (!isMapLoaded) {
        alert("Please load a map image first.");
        return;
    }

    const markerX = e.offsetX; 
    const markerY = e.offsetY; 
    
    if (mode === 'startTank') {
        tankPos1.x = markerX; 
        tankPos1.y = markerY; 
        
        onAllyMarker.style.left = markerX + 'px';
        onAllyMarker.style.top = markerY + 'px';
        onAllyMarker.style.display = 'block';
        
        btnStart.style.background = '';
        mode = null;
        calculateDistance();

    } else if (mode === 'endTank') {
        tankPos2.x = markerX;
        tankPos2.y = markerY;

        onEnemyMarker.style.left = markerX + 'px';
        onEnemyMarker.style.top = markerY + 'px';
        onEnemyMarker.style.display = 'block';

        btnEnd.style.background = '';
        mode = null;
        calculateDistance();
    }
    
    else if (mode === 'startGrid') {
        gridPos1.x = markerX; 
        gridPos1.y = markerY; 
        
        btnGridStart.style.background = '';
        mode = null;
        calculateScaleFactor();

    } else if (mode === 'endGrid') { 
        gridPos2.x = markerX;
        gridPos2.y = markerY;
        
        btnGridEnd.style.background = '';
        mode = null;
        calculateScaleFactor();
    }
});


//-------------------------- SECTION: DISTANCE & SCALE CALCULATION FUNCTIONS --------------------------
gridDistanceInput.addEventListener('input', calculateScaleFactor);

function calculateScaleFactor() {
    const realDistanceMeters = parseFloat(gridDistanceInput.value);
    
    if (currentImageFile) {
        const tempImg = new Image();
        tempImg.onload = () => {
            redrawImage(tempImg);
        };
        tempImg.src = URL.createObjectURL(currentImageFile);
    }

    if (gridPos1.x === 0 && gridPos1.y === 0 && gridPos2.x === 0 && gridPos2.y === 0) {
        scaleFactor = 1.0; 
        calculateDistance();
        return;
    }
    
    const dx = gridPos2.x - gridPos1.x;
    const dy = gridPos2.y - gridPos1.y;
    
    const pixelDistance = Math.sqrt(dx * dx + dy * dy); 
    
    if (pixelDistance > 0 && realDistanceMeters > 0) {
        scaleFactor = realDistanceMeters / pixelDistance;
    } else {
        scaleFactor = 1.0; 
    }
    
    calculateDistance();
}


function calculateDistance() {
    if (!isMapLoaded || (tankPos1.x === 0 && tankPos1.y === 0 && tankPos2.x === 0 && tankPos2.y === 0)) {
        distanceField.textContent = 0;
        return;
    }
    
    const dx = tankPos2.x - tankPos1.x;
    const dy = tankPos2.y - tankPos1.y;
    
    const pixelDistance = Math.sqrt(dx * dx + dy * dy); 
    
    const meterDistance = pixelDistance * scaleFactor * 1.12;
    
    distanceField.textContent = meterDistance.toFixed(1);
}