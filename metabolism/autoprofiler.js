/* This file is experimental */

function optimize_value(meal, id, initial_value = 0, precision = 10) {
    let inc = 4;
    let val = initial_value;
    let last_error = Infinity;
    const step_reduction = 2;

    let error;
    let i = 0;
    while(i < precision) {
        profile.set(id, val, true);
        meal.update();
        error = meal.get_sim_error();
        if(error <= last_error) {
            last_error = error;
        } else {
            val -= inc; // Set val back to the previous value
            inc = inc / step_reduction;
            i++;
        }
        val += inc;
    }
    profile.set(id, val); // Write value to memory
    return val;
}


let pvars = []; // Profiler variables
function profiler_var(id, min, max, iter = 15) {
    pvars.push({
        id: id,
        default: profile.get(id),
        best: profile.get(id),
        min: min,
        max: max,
        iter: iter,
    })
}

profiler_var("einsulin", 12, 80, 20);
// profiler_var("ninsulin", 0, 2, 0.08);
// profiler_var("pinsulin", 0.001, 5, 0.002);

// Carbohydrate parameters
profiler_var("ecarbs", 3, 8, 15);
// profiler_var("ncarbs", 0.0, 3, 0.08);
// profiler_var("pcarbs", 0.01, 5, 0.04);

// Protein parameters
profiler_var("eprotein", 0.5, 3, 15);
// profiler_var("nprotein", 0.0, 5, 0.08);
// profiler_var("protein_rise", 0, 8, 0.1);
// profiler_var("protein_duration", 0, 10, 0.1);
// profiler_var("protein_end", 0, 8, 0.1);


function auto_profiler(meal, precision = 1) {
    let min_error = null;
    let recurse = (index) => {
        if (index === pvars.length) {
            meal.update();
            let error = meal.get_sim_error();
            if(error < min_error || min_error === null) {
                min_error = error;
                console.log(error);
                for(let v of pvars) {
                    v.best = profile.get(v.id);
                }
            }
            return;
        }
        let v = pvars[index];
        for (let i = 0; i < (v.iter * precision) + 1; i++) {
            let val = v.min + (i / (v.iter * precision)) * (v.max - v.min);
            profile.set(v.id, val, true);
            recurse(index + 1);
        }
    }
    recurse(0);
    apply_best_profile();
    return min_error;
}
function apply_best_profile() {
    for(let v of pvars) {
        profile.set(v.id, v.best);
    }
}