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
        this.render();
    }
    attach(parent_element) {
        $(parent_element).append(this.element);
    }
    clear() {
        $(this.element).html('');
        this.svg.innerHTML = "";
    }
    set_bounds(a,b,min,max) {
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
    color="black";
    graphs=[];
    svg_paths=[];
    type="points";
    constructor() {
    }
    point(x, y) {
        // Because graphs are functions, if the new point has the same x as an existing point, we overwrite it
        for(let p of this.points) {
            if(p.x === x) {
                p.coords(x, y);
                this.render_graphs();
                return;
            }
        }
        let p = new GraphPoint(x, y);
        p.attach(this);
        this.points.push(p);
        this.graphs.forEach(g => p.attach_to_graph(g))
        this.render_graphs();
    }
    at(x) {
        // We find the closest point to x and return its value
        let y = null;
        let diff = null;
        let d;
        for(let point of this.points) {
            d=Math.abs(point.x - x);
            if(d < diff || diff === null){
                diff = d;
                y = point.y;
            }
        }
        return y;
    }
    render_graphs() {
        const self = this;
        self.graphs.forEach(a=>a.render())
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
        this.check_validity();
        switch(this.type) {
            case "points":
                this.render_points();
                break;
            case "horizontal lines":
                this.render_hor_lines();
                break;
            case "vertical lines":
                this.render_vert_lines();
                break;
            case "smoothline":
                this.render_smoothline();
                break;                
            default:
                warn(`Graph cannot render: unknown type '${this.type}'`);
                break;
        }
    }
    render_points() {
        this.points.forEach(p => p.render_point());
    }
    render_hor_lines() {
            this.points.forEach(p => p.render_hor_line());
    }
    render_vert_lines() {
        this.points.forEach(p => p.render_vert_line());
    }
    render_smoothline() {    this.check_validity();

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
    
    check_validity() {
        // if(ctx === null) throw new Error("Validity check failed: invalid or undefined rendering context");
        if(this.graph === null) throw new Error("Validity check failed: invalid or undefined graph container");
    }
    attach_point_elements() {
        this.graphs.forEach(g => {
            this.points.forEach(p => p.attach_to_graph(g));
        })
    }
    apply_smoothing(smooth_factor) {
        if (typeof smooth_factor !== 'number' || smooth_factor < 0 || smooth_factor > 1) {
            throw new Error(`apply_smoothing: smooth_factor must be a number between 0 and 1`);
        }
        if (this.points.length === 0) return;

        // compute smoothed y’s
        const smoothedYs = [];
        smoothedYs[0] = this.points[0].y;
        for (let i = 1; i < this.points.length; i++) {
            smoothedYs[i] = smooth_factor * this.points[i].y 
                          + (1 - smooth_factor) * smoothedYs[i - 1];
        }

        // update point objects
        for (let i = 0; i < this.points.length; i++) {
            this.points[i].disp_coords(this.points[i].x, smoothedYs[i]);
        }
    }
    raw() {
        this.points.forEach(p => p.raw());
    }
    clear() {
        this.points = [];
    }
}
class GraphPoint{
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
        this.disp_coords(x,y);
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
        if(this.x < graph.a || this.x > graph.b || this.y > graph.max || this.y < graph.min)
            return false;
        return true;
    }

    render_point() {
        for(let i = 0; i < this.graphs.length; i++) {
            let graph = this.graphs[i];
            let element = this.elements[i];

            if(!this.is_bounded(graph)) {
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
                left: `${d.left - d.diameter/2}px`,
                bottom: `${d.bottom - d.diameter/2}px`
            })
        }
    }
    render_hor_line() {
        for(let i = 0; i < this.graphs.length; i++) {
            let graph = this.graphs[i];
            let element = this.elements[i];

            const d = this.get_dimensions(graph);
        
            element.className = "line";
            Object.assign(element.style, {
            left:       `0px`,
            bottom:     `${d.bottom + graph.scale/2}px`,
            width:      `${graph.width}px`,
            height:     `${graph.scale}px`,
            background: this.series.color
            });
        }
    }
    render_vert_line() {
        for(let i = 0; i < this.graphs.length; i++) {
            let graph = this.graphs[i];
            let element = this.elements[i];

            const d = this.get_dimensions(graph);
        
            element.className = "line";
            Object.assign(element.style, {
            left:       `${d.left - graph.scale/2}px`,
            bottom:     `0px`,
            width:      `${graph.scale}px`,
            height:     `${graph.height}px`,
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
    for(let x = a; x < b; x+=interval) {
        let p1 = series1.at(x);
        let p2 = series2.at(x);
        console.log(p1, p2, x)
        if(p1 === null || p2 === null) break;
        sum += Math.abs(p1 - p2);
        count++;
    }
    return sum/count;
}