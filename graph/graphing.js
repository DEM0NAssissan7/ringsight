class Graph {
    points = [];
    constructor(range) {
        this.range = range;
    }
    plot_point(x, y) {
        this.points.push({ x, y });
    }
    render() {

    }
}