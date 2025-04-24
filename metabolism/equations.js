function G(x, p) {
    let r = (3 / (4 * (p ** 3))) * ((p ** 2) - ((x - p) ** 2));
    if (r > 0) return r;
    return 0;
}

function f_insulin(t, insulin, n_insulin) {
    return insulin * -profile.get_value("einsulin") * G(t - profile.get_value("ninsulin") - n_insulin, profile.get_value("pinsulin"));
}
function f_carbs(t, carbs) {
    return carbs * profile.get_value("ecarbs") * G(t - profile.get_value("ncarbs"), profile.get_value("pcarbs"));
}
function f_protein(t, protein) {
    return protein * profile.get_value("eprotein") * G(t - profile.get_value("nprotein"), profile.get_value("pprotein"));
}

function f_all(t, n_insulin, insulin, carbs, protein) {
    return f_insulin(t, insulin, n_insulin) + f_carbs(t, carbs) + f_protein(t, protein);
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
        // If the graph is descending and the integral is below the threshold
        // we could possibly use f1<0 instead of currentintegral<lastintegral because f1 is the derivative of the integral
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