/**
 * Stores the current click mode (selected tool) and updates a few things when changed.
 */
export class ClickMode {
    /**
     * Stores the current click mode (selected tool) and updates a few things when changed.
     * - Updates the visual cursor (css).
     * - Updates the selected tool buttons.
     * @param canvas Canvas element. Used to update the cursor
     * @param msgBar Top message output. ClickMode will clear it when no tool is selected.
     */
    constructor(app) {
        this.mode = null;
        this.oldMode = null;
        this.app = app;
        this.updateUITools();
    }
    /** Sets the current tool to pointer, and clears topMsgBar() */
    clear() {
        this.oldMode = this.mode;
        this.mode = null;
        this.app.interman.out.topMsg.clear();
        this.updateUITools();
    }
    /** Sets the corresponding tool button ON. */
    set(mode) {
        this.oldMode = this.mode;
        this.mode = mode;
        this.updateUITools();
    }
    /** Removes the .active tag from all the tool buttons. */
    deselectUITools() {
        $('.toolBtn').removeClass('active');
        $(this.app.canvas).removeClass('crosshair');
    }
    /** Updates the canvas cursor and tool button according to the selected click mode. */
    updateUITools() {
        let mode = this.mode;
        let canvas = this.app.canvas;
        let interman = this.app.interman;
        this.deselectUITools();
        switch (mode) {
            case 'setLinePoint1':
            case 'setLinePoint2':
                $('#toolLine').addClass('active');
                $(canvas).addClass('crosshair');
                break;
            case 'setPointMarker':
                $('#toolPoint').addClass('active');
                $(canvas).addClass('crosshair');
                break;
            case 'setTopographicPoint':
            case 'selectTopographicLine':
                $('#toolTopoPoint').addClass('active');
                break;
            default:
                $('#toolPointer').addClass('active');
        }
    }
}
//# sourceMappingURL=ClickMode.js.map