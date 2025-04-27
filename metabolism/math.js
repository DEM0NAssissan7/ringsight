function G(t, p) { // exponential: has an area under of 1 and peaks at 'p'
    p = Number(p) || 0;
    if (p <= 0) {
        console.warn(`K() got p=${p}; returning 0`);
        return 0;
    }
    if (t <= 0) return 0;
    if (t >= p * 2) return 1;

    // r = ((3 / (4 * (p ** 3))) * ((p ** 2) - ((t - p) ** 2))); -> This was the original function that was then integrated into the return function

    return ((3 * Math.pow(t, 2)) / (4 * Math.pow(p, 2))) - (Math.pow(t, 3) / (4 * Math.pow(p, 3)));
}
function C(t, z) { // Constant function: has an area under it of 1 and will extend from 0->z, otherwise it's zero
    if (t <= 0) return 0;
    if (t >= z) return 1;
    return t / z;
}
function K(t, p) {
    p = Number(p) || 0;
    if (p <= 0) {
        console.warn(`G() got p=${p}; returning 0`);
        return 0;
    }
    if (t <= 0) return 0;
    if (t >= 2 * p) return 1;

    const x = t / p;
    return (3 / 4) * x * x - (1 / 4) * x * x * x;
}
function Z(t, p) { // Exponential decay
    if(t <= 0) return 0;
    return 1 - Math.exp(-p * t);
}
function Z2(t, p, x) {
    if(t <= 0) return 0;
    if(x <= 1) throw new Error("Z2(): Cannot use an 'x' value <= 1");
    return 1 - Math.pow(x, -p * t);
}

class MathSeries extends GraphSeries {
    constructor() {
        super();
    }
    functions = []
    add_function(f) {
        this.functions.push(f);
    }
    transfer_functions(math_series) {
        const self = this;
        math_series.functions.forEach(f => {
            self.add_function(f);
        });
    }
    integral(current_glucose, a, b) {
        let r = current_glucose;
        for (let f of this.functions) {
            const delta = f(b) - f(a);
            if (Number.isNaN(delta)) {
                console.log(f)
                panic(`integral(): function returned NaN for a=${a}, b=${b}`);
                return NaN;
            }
            r += delta;
        }
        return r;
    }
    populate(current_glucose, a, b, interval) {
        for (let t = a; t < b; t += interval) {
            let integral = this.integral(current_glucose, a, t);
            if(!Number.isFinite(integral)) continue;
            this.point(t, integral);
        }
    }
}

function meta_function(t, e, n, p, f) {
    return e * f(t - n, p)
}