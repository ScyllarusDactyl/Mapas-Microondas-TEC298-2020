let settingsOpen = false;
let linesPaneOpen = false;
let msgBar;
let statusBar;
let clickMode;
let MouseBar;

let temp;
let mapLineList = new MapLineList(); // only for IntelliSense, as this is be overriden later

// Canvas nav stuff
var startDragOffset = {};
var mouseDown = false;
var dragging = false;
var modifier = {
    shift: false,
    ctrl: false,
    alt: false,
};

// Other stuff
var hoverDistance = 7;

let MessagePane = class {
    constructor() {
        this.node = document.getElementById('msgWrapper');
    }

    clear() {
        this.node.innerHTML = '';
        this.node.classList.add('disabled');
    }

    setText(txt) {
        let splitList = txt.split("\n");
        let T = this;

        this.clear();
        splitList.forEach((t) => {
            let p = document.createElement('p');
            let tnode = document.createTextNode(t);
            p.appendChild(tnode);
            this.node.appendChild(p);
        });
        this.node.classList.remove('disabled');
    }
};

let StatusPane = class {
    constructor() {
        this.node = document.getElementById('statusBarWrapper');
        this.p = document.getElementById('statusBar');
    }

    clear() {
        this.p.innerHTML = '';
        this.node.classList.add('disabled');
    }

    setText(txt) {
        this.p.innerHTML = txt;
        this.node.classList.remove('disabled');
    }
};

let MousePane = class {
    constructor() {
        this.node = document.getElementById('mouseMsg');
    }

    clear() {this.node.innerHTML = ''}

    setText(txt) {
        let splitList = txt.split("\n");
        let T = this;

        this.clear();
        splitList.forEach((t) => {
            let p = document.createElement('p');
            let tnode = document.createTextNode(t);
            p.appendChild(tnode);
            this.node.appendChild(p);
        });
    }

    setNode(n) {
        this.clear();
        this.node.appendChild(n);
    }

    setPosition(p) {
        this.node.style.top = p.y;
        this.node.style.left = p.x;
    }
};

let ClickMode = class {
    constructor() {
        this.mode = '';
        this.oldMode = '';
        this.updateUITools();
    }

    clear() {
        this.oldMode = this.mode;
        this.mode = '';
        msgBar.clear();
        this.updateUITools(null);
    }

    set(mode) {
        this.oldMode = this.mode;
        this.mode = mode;
        this.updateUITools(mode);
    }

    deselectUITools() {
        $('.toolBtn').removeClass('active');
        $(canvas).removeClass('crosshair');
    }

    updateUITools(mode) {
        this.deselectUITools();
        switch (mode) {
            case 'setLinePoint1':
            case 'setLinePoint2':
                $('#toolLine').addClass('active');
                $(canvas).addClass('crosshair');
                break;

            default:
                $('#toolPointer').addClass('active');
        }
    }
};

// UI Handlers
/**
 * On mouse move
 * @param {event} evt
 */
function UIHandler_mousemove(evt) {
    // move by drag
    if (mouseDown) {
        dragging = true;
        translatePos.x = evt.clientX - startDragOffset.x;
        translatePos.y = evt.clientY - startDragOffset.y;
        draw(scale, translatePos);
    }
    // Set mouse pointer to 'move' if dragging
    if (dragging) {
        $(canvas).addClass('move');
    } else {
        $(canvas).removeClass('move');
    }

    // Update mousePos / coordPos global vars
    getMousePos(canvas, evt);
    getMousePosInMap(canvas, evt);

    // Determine line hover
    let lines = mapLineList.getCloseToScreenPoint(mousePos, hoverDistance);
    mapLineList.list.forEach((e) => e.hover = false);
    if (lines.length > 0) {lines[0].hover = true}
    mapLineList.updateNode();


    // Display tooltip
    var formattedPosition = formattedPixelPointToMapPoint(coordPos);
    var msg = `Pos: (${formattedPosition.x}, ${formattedPosition.y})`;
    if (clickMode.mode == '') {
        if (lines.length > 0) {
            msg += `\nLinea #${lines[0].index + 1}: ${lines[0].getDistanceMetre().toFixed(2)}m`
        }
    }
    else if (clickMode.mode == 'setLinePoint2') {
        msg += `\nDistancia: ${temp.mapline.templine.getDistanceMetre().toFixed(2)}m`
    }
    mouseBar.setText(msg);
    mouseBar.setPosition(mousePos);

    draw();
}

/**
 * On mouse up (equivalent to clicking)
 * @param {event} evt
 */
function UIHandler_mouseup(evt) {
    var canvas = document.getElementById('renderCanvas');
    var context = canvas.getContext('2d');

    if (!dragging) {
        switch (clickMode.mode) {
            case 'setLeftUpPos':
                $('#up-left-pos-x').val(Math.round(coordPos.x));
                $('#up-left-pos-y').val(Math.round(coordPos.y));
                clickMode.clear();
                break;
            case 'setRightDownPos':
                $('#down-right-pos-x').val(Math.round(coordPos.x));
                $('#down-right-pos-y').val(Math.round(coordPos.y));
                clickMode.clear();
                break;
            case 'setLinePoint1':
                temp.mapline.point1 = screenToMapPos(mousePos);
                temp.mapline.templine.p1 = temp.mapline.point1;
                clickMode.set('setLinePoint2');
                msgBar.setText('Click en el 2do punto de la linea');
                break;
            case 'setLinePoint2':
                var pos = screenToMapPos(mousePos);
                mapLineList.add(
                    new MapLine(temp.mapline.point1, pos, {
                        color: '#f00',
                        width: 2,
                    })
                );
                clickMode.clear();
                msgBar.clear();
                break;

            case 'setMetreDefPoint1':
                clickMode.set('setMetreDefPoint2');
                msgBar.setText('Haga click en el 2do punto de la regla.');

                temp.mapline.point1 = screenToMapPos(mousePos);
                break;
            case 'setMetreDefPoint2':
                var pos = screenToMapPos(mousePos);
                var dist = Math.sqrt(
                    (pos.x - temp.mapline.point1.x) ** 2 +
                        (pos.y - temp.mapline.point1.y) ** 2
                );

                clickMode.clear();
                msgBar.clear();
                var i = parseInt(
                    prompt('Cuanto media ese punto (en metros)?', '900')
                );
                $('#one-metre-px').val(dist / i);
                break;


            // With Pointer mode 
            default:
                // mapLines selection
                let lines = mapLineList.getCloseToScreenPoint(mousePos, hoverDistance);
                if (!modifier.shift) {mapLineList.deselectAll()}
                if (lines.length > 0) {lines[0].active = !lines[0].active}
                mapLineList.updateNode();
        }
    }

    mouseDown = false;
    dragging = false;
    draw();
}

// On doc ready
$(window).ready(function () {
    // Init stuff
    msgBar = new MessagePane();
    statusBar = new StatusPane();
    clickMode = new ClickMode();
    mouseBar = new MousePane();

    // This part is now managed by the savedMapState
    // mapLineList = new MapLineList();
    // mapLineList.node = $('#lineListWrapper')[0];
    temp = {
        mapline: {
            point1: new p(0, 0),
            templine: new MapLine(new p(0, 0), new p(1, 1), {
                color: 'red',
                width: 1,
            }),
        },
    };

    // Toolbox buttons
    $('#toolPointer').on('click', (e) => clickMode.clear());
    $('#toolLine').on('click', createLineFun);

    // Keypress
    $(document).keyup(function (e) {
        switch (e.key) {
            case 'Shift':
                modifier.shift = false;
                break;
            case 'Control':
                modifier.ctrl = false;
                break;
            case 'Alt':
                modifier.alt = false;
                break;

            // Other shortcuts
            case 'Escape':
                clickMode.clear();
                break;
            case 'Delete':
                mapLineList.deleteActive();
                mapLineList.updateNode();
                break;
            case 'L':
            case 'l':
                createLineFun();
                break;

        }
        draw();
    });

    $(document).keydown(function (e) {
        switch (e.key) {
            case 'Shift':
                modifier.shift = true;
                break;
            case 'Control':
                modifier.ctrl = true;
                break;
            case 'Alt':
                modifier.alt = true;
                break;
        }
    });

    // Zoom buttons
    $('#plus').on('click', function () {
        //scale /= scaleMultiplier;
        zoomAtPosition(
            canvas.width / 2,
            canvas.height / 2,
            scale / scaleMultiplier
        );
        draw();
    });

    $('#minus').on('click', function () {
        //scale *= scaleMultiplier;
        zoomAtPosition(
            canvas.width / 2,
            canvas.height / 2,
            scale * scaleMultiplier
        );
        draw();
    });

    $('#reset').on('click', function () {
        //scale *= scaleMultiplier;
        mapLoader.setDefaultZoom();
        draw();
    });

    // UI Buttons
    // Config
    $('#openSettings').on('click', function () {
        settingsOpen = !settingsOpen;
        if (settingsOpen) {
            mapMeta.loadToSetup();
            $('#settingsWrapper').removeClass('disabled');
        } else {
            $('#settingsWrapper').addClass('disabled');
        }
    });

    $('#map-select').on('change', function () {
        let m = $('#map-select').val();
        mapLoader.load(m);
        draw();
    });

    $('#up-left-set-btn').on('click', function () {
        clickMode.set('setLeftUpPos');
        msgBar.setText('Haga click en el limite superior izquierdo del mapa.');
    });

    $('#down-right-set-btn').on('click', function () {
        clickMode.set('setRightDownPos');
        msgBar.setText('Haga click en el limite inferior derecho del mapa.');
    });

    $('#set-ok-btn').on('click', function () {
        mapMeta.loadFromSetup();
        mapMeta.loadToGlobal();
        settingsOpen = false;
        $('#settingsWrapper').addClass('disabled');
    });

    $('#set-cancel-btn').on('click', function () {
        settingsOpen = false;
        $('#settingsWrapper').addClass('disabled');
    });

    $('#dev-json-vals').on('click', function () {
        mapMeta.alertJson();
    });

    $('#one-metre-px-def').on('click', function () {
        clickMode.set('setMetreDefPoint1');
        msgBar.setText('Haga click en el 1er punto de la regla.');
    });

    // Lines
    function createLineFun() {
        clickMode.set('setLinePoint1');
        msgBar.setText('Click en el 1er punto de la linea');
    }
    $('#openLinePane').on('dblclick', createLineFun);
    $('#createLine').on('click', createLineFun);

    $('#openLinePane').on('click', function () {
        linesPaneOpen = !linesPaneOpen;
        if (linesPaneOpen) {
            $('#linesWrapper').removeClass('disabled');
        } else {
            $('#linesWrapper').addClass('disabled');
        }
    });

    function deleteLineFun() {
        mapLineList.deleteActive();
        mapLineList.updateNode();
        draw();
    }
    $('#deleteLine').on('click', deleteLineFun);

    // Redraw on resize
    $(window).resize(function () {
        draw();
    });

    // Canvas functionality
    // Mouse down (click downstroke)
    $(canvas).on('mousedown', function (evt) {
        mouseDown = true;

        startDragOffset.x = evt.clientX - translatePos.x;
        startDragOffset.y = evt.clientY - translatePos.y;
    });

    // Mousemove
    $(canvas).on('mousemove', UIHandler_mousemove);

    // Eqv to Click
    $(canvas).on('mouseup', UIHandler_mouseup);

    // Cancel mouse movements
    $(canvas).on('mouseover', function (evt) {
        mouseDown = false;
        dragging = false;
    });

    $(canvas).on('mouseout', function (evt) {
        mouseDown = false;
        dragging = false;
    });

    // Wheel zooming
    canvas.addEventListener('wheel', function (e) {
        // jquery is broken with wheel?
        e.preventDefault();
        let previousScale = scale;

        // calculate scale direction 6 new scale value
        let scaleMult = e.deltaY > 0 ? scaleMultiplier : 1 / scaleMultiplier;
        zoomAtPosition(e.offsetX, e.offsetY, scale * scaleMult);
        draw();
    });
});
