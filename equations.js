function G(x, p) {
    let r = (3 / (4 * (p ** 3))) * ((p ** 2) - ((x - p) ** 2));
    if (r > 0) return r;
    return 0;
}

function f_insulin(t, insulin, n_insulin) {
    return insulin * -profile.e.insulin * G(t - profile.n.insulin - n_insulin, profile.p.insulin);
}
function f_carbs(t, carbs) {
    return carbs * profile.e.carbs * G(t - profile.n.carbs, profile.p.carbs);
}
function f_protein(t, protein) {
    return protein * profile.e.protein * G(t - profile.n.protein, profile.p.protein);
}

function f_all(t, n_insulin, insulin, carbs, protein) {
    // return f_insulin(t - profile.n.system, insulin, n_insulin) + f_meal(t, carbs, protein);
    return f_insulin(t - profile.n.system, insulin, n_insulin) + f_carbs(t - profile.n.system, carbs) + f_protein(t - profile.n.system, protein)
}

function integral_range(f, y_offset, a, b, minThreshold, n = 1000) {
    const h = (b - a) / n;

    let x0 = a;
    let f0 = f(x0);

    // Starting integral value at a is 0
    let currentIntegral = y_offset;
    let lastIntegral = currentIntegral;
    let maxVal = currentIntegral;
    let minVal = currentIntegral;

    for (let i = 1; i <= n; i++) {
        const x1 = a + i * h;
        const f1 = f(x1);

        // Trapezoidal increment
        currentIntegral += (h * (f0 + f1)) / 2;

        // Check early termination condition
        // if(currentIntegral <= minThreshold) {
        //     console.log("UH OH", currentIntegral)
        //     return null;
        // }
        if (currentIntegral < lastIntegral && currentIntegral <= minThreshold) {
            return null;
        }

        // Update max and min encountered integral
        if (currentIntegral > maxVal) {
            maxVal = currentIntegral;
        }
        if (currentIntegral < minVal) {
            minVal = currentIntegral;
        }

        // Move to next interval
        x0 = x1;
        f0 = f1;
        lastIntegral = currentIntegral;
    }

    return { integral: currentIntegral, max: maxVal, min: minVal };
}