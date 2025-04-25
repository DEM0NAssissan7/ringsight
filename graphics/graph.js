class GraphPoint{
    element = $("<div class='graphpoint' style='left: 0px; bottom: 0px;'></div>");
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}
class Graph {
    div = $("<div id='graph' class='graph-container'></div>")
    points = [];
    constructor(a, b, min, max) {

    }
    adjust_bounds() {

    }
    plot_point(x, y) {

    }
    add_horizontal_line(y, color) {

    }
    add_vertical_line(x, color) {

    }
    attach(parent_element, width, height, style) {
        $(parent_element).append(this.canvas);
        $(parent_element).width(width);
        $(parent_element).height(height);
    }
}