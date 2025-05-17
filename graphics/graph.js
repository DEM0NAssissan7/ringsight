const DEFAULT_POINT_DIAMETER = 4;
class Graph {
    element = document.createElement("div");
    series = [];
    lines = [];
    width = 200;
    height = 200;
    scale = 1;
    constructor() {
        this.element.classList.add('graph-container');
        this.set_dimensions(this.width, this.height);

        this.svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        this.svg.style.position = "absolute";
        this.svg.style.top = "0";
        this.svg.style.left = "0";
        this.svg.style.width = "100%";
        this.svg.style.height = "100%";
        $(this.element).append(this.svg);
    }
    adjust_bounds() {

    }
    add_series(s) {
        s.add_graph(this);
        this.series.push(s);
        s.render();
    }
    attach(parent_element) {
        $(parent_element).append(this.element);
    }
    clear() {
        $(this.element).html('');
        this.svg.innerHTML = "";
    }
    set_bounds(a, b, min, max) {
        this.a = a;
        this.b = b;
        this.min = min;
        this.max = max;
    }
    set_dimensions(width, height) {
        this.width = width;
        this.height = height;
        this.element.style.width = `${width}px`;
        this.element.style.height = `${height}px`;
        this.render();
    }
    render() {
        // this.clear();
        this.series.forEach(s => s.render())
    }
}
class GraphSeries {
    points = [];
    color = "black";
    graphs = [];
    svg_paths = [];
    type = "points";
    smooth_factor = 1;
    scheduled = false;
    constructor() {
    }
    point(x, y) {
        // Because graphs are functions, if the new point has the same x as an existing point, we overwrite it
        for (let p of this.points) {
            if (p.x === x) {
                if (p.y !== y) {
                    p.coords(x, y);
                    this.render_point(p);
                }
                return;
            }
        }
        let p = new GraphPoint(x, y);
        p.attach(this);
        this.points.push(p);
        this.graphs.forEach(g => p.attach_to_graph(g))
        this.render_point(p);
        // this.render_graphs();
    }
    at(x) {
        // We find the closest point to x and return its value
        let y = null;
        let diff = null;
        let d;
        for (let point of this.points) {
            d = Math.abs(point.x - x);
            if (d < diff || diff === null) {
                diff = d;
                y = point.y;
            }
        }
        return y;
    }
    create_svg_path() {
        let path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("fill", "none");
        path.setAttribute("stroke-width", 2);
        return path;
    }
    add_graph(graph) {
        this.graphs.push(graph)

        let svg_path = this.create_svg_path();
        this.svg_paths.push(svg_path);
        $(graph.svg).append(svg_path);

        this.attach_point_elements();
    }

    render() {
        this.points.forEach(p => this.render_point(p));
    }
    schedule_render (f) {
        if (!this.scheduled) {
            this.scheduled = true;
            requestAnimationFrame(() => {
                f();
                this.scheduled = false;
            });
        }
    }
    render_point(point) {
        if (this.smooth_factor < 1) {
            this.apply_smoothing(this.smooth_factor);
        }
        switch (this.type) {
            case "smoothline":
                this.schedule_render(() => this.render_smoothline());
                // this.render_smoothline()
                break;
            default:
                point.render(this.type)
                break;
        }
    }
    render_smoothline() {
        if (this.smooth_factor < 1) {
            this.apply_smoothing(this.smooth_factor);
        }
        for (let gi = 0; gi < this.graphs.length; gi++) {
            const graph = this.graphs[gi];

            // Filter out only the points we can actually draw
            const validPoints = this.points.filter(p => {
                // if (!p.is_bounded(graph)) return false;
                const d = p.get_dimensions(graph);
                return Number.isFinite(d.left) && Number.isFinite(d.bottom);
            });

            // Need at least 2 points to make a smooth line
            if (validPoints.length < 2) continue;

            // Build up a proper SVG 'd' string
            let d = '';
            // Move to the first point
            {
                const { left, bottom } = validPoints[0].get_dimensions(graph);
                const y = graph.height - bottom;
                d += `M${left},${y} `;
            }

            // Quadratic curve through each midpoint
            for (let pi = 0; pi < validPoints.length - 1; pi++) {
                const p0 = validPoints[pi];
                const p1 = validPoints[pi + 1];
                const d0 = p0.get_dimensions(graph);
                const d1 = p1.get_dimensions(graph);

                const x0 = d0.left;
                const y0 = graph.height - d0.bottom;
                const x1 = d1.left;
                const y1 = graph.height - d1.bottom;

                // midpoint control
                const mx = (x0 + x1) / 2;
                const my = (y0 + y1) / 2;

                d += `Q ${x0},${y0} ${mx},${my} `;
            }

            // Trim and set
            const svg_path = this.svg_paths[gi];
            svg_path.setAttribute("stroke", this.color);
            svg_path.setAttribute("d", d.trim());
        }
    }

    attach_point_elements() {
        this.graphs.forEach(g => {
            this.points.forEach(p => p.attach_to_graph(g));
        })
    }
    apply_smoothing(factor) {
        if (typeof factor !== 'number' || factor < 0 || factor > 1) {
            throw new Error(`apply_smoothing: smooth_factor must be a number between 0 and 1`);
        }
        if (this.points.length === 0) return;

        // compute smoothed y’s
        const smoothedYs = [];
        smoothedYs[0] = this.points[0].rawY;
        for (let i = 1; i < this.points.length; i++) {
            smoothedYs[i] = factor * this.points[i].rawY
                + (1 - factor) * smoothedYs[i - 1];
        }

        // update point objects
        for (let i = 0; i < this.points.length; i++) {
            this.points[i].disp_coords(this.points[i].rawX, smoothedYs[i]);
        }
    }
    raw() {
        this.points.forEach(p => p.raw());
    }
    clear() {
        this.points = [];
    }
}
class GraphPoint {
    elements = [];
    graphs = [];
    series = null;
    constructor(x, y) {
        this.coords(x, y);
    }
    disp_coords(x, y) {
        this.x = x;
        this.y = y;
    }
    coords(x, y) {
        this.rawX = x;
        this.rawY = y;
        this.disp_coords(x, y);
        this.elements.forEach(e => e.title = y);
    }
    raw() {
        this.coords(this.rawX, this.rawY);
    }

    get_dimensions(graph) {
        let d = DEFAULT_POINT_DIAMETER * graph.scale;

        return {
            left: (this.x - graph.a) * graph.width / (graph.b - graph.a),
            bottom: (this.y - graph.min) * graph.height / (graph.max - graph.min),
            diameter: d
        }
    }
    is_bounded(graph) {
        if (this.x < graph.a || this.x > graph.b || this.y > graph.max || this.y < graph.min)
            return false;
        return true;
    }

    render(type) {
        switch (type) {
            case "points":
                this.render_point();
                break;
            case "horizontal lines":
                this.render_hor_line();
                break;
            case "vertical lines":
                this.render_vert_line();
                break;
            default:
                console.warn(`Point cannot render: unknown type '${type}'`);
                break;
        }
    }
    render_point() {
        for (let i = 0; i < this.graphs.length; i++) {
            let graph = this.graphs[i];
            let element = this.elements[i];

            if (!this.is_bounded(graph)) {
                element.style.display = "none";
                return;
            }
            const d = this.get_dimensions(graph);

            element.style.display = "";
            element.className = "dot";
            Object.assign(element.style, {
                width: `${d.diameter}px`,
                height: `${d.diameter}px`,
                backgroundColor: this.series.color,
                left: `${d.left - d.diameter / 2}px`,
                bottom: `${d.bottom - d.diameter / 2}px`
            })
        }
    }
    render_hor_line() {
        for (let i = 0; i < this.graphs.length; i++) {
            let graph = this.graphs[i];
            let element = this.elements[i];

            const d = this.get_dimensions(graph);

            element.className = "line";
            Object.assign(element.style, {
                left: `0px`,
                bottom: `${d.bottom + graph.scale / 2}px`,
                width: `${graph.width}px`,
                height: `${graph.scale}px`,
                background: this.series.color
            });
        }
    }
    render_vert_line() {
        for (let i = 0; i < this.graphs.length; i++) {
            let graph = this.graphs[i];
            let element = this.elements[i];

            const d = this.get_dimensions(graph);

            element.className = "line";
            Object.assign(element.style, {
                left: `${d.left - graph.scale / 2}px`,
                bottom: `0px`,
                width: `${graph.scale}px`,
                height: `${graph.height}px`,
                background: this.series.color
            });
        }
    }

    attach(series) {
        this.series = series;
    }
    create_element() {
        let element = document.createElement("div")
        element.style.left = "0px";
        element.style.bottom = "0px";
        element.title = this.y;
        return element;
    }
    attach_to_graph(graph) {
        let element = this.create_element();
        element.style.display = "";
        this.elements.push(element);
        this.graphs.push(graph);
        $(graph.element).append(element);
    }
}
function series_difference(series1, series2, a, b, interval) {
    let sum = 0;
    let count = 0;
    for (let x = a; x < b; x += interval) {
        let p1 = series1.at(x);
        let p2 = series2.at(x);
        if (p1 === null || p2 === null) break;
        sum += Math.abs(p1 - p2);
        count++;
    }
    return sum / count;
}
function series_max_diff(series1, series2, a, b, interval) {
    let max = 0;
    for (let x = a; x < b; x += interval) {
        let p1 = series1.at(x);
        let p2 = series2.at(x);
        if (p1 === null || p2 === null) break;
        max = Math.max(max, Math.abs(p1 - p2));
    }
    return max;
}