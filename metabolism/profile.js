const profile = new StorageNode("profile");

// Insulin parameters
profile.add_value("einsulin", 18);
profile.add_value("ninsulin", 0.5);
profile.add_value("pinsulin", 0.43);

// Carbohydrate parameters
profile.add_value("ecarbs", 4.1);
profile.add_value("ncarbs", 0.0);
profile.add_value("pcarbs", 1.61);

// Protein parameters
profile.add_value("eprotein", 1.19);
profile.add_value("nprotein", 0.0);
profile.add_value("protein_rise", 3.6);
profile.add_value("protein_duration", 0.0351);
profile.add_value("protein_end", 1.83);

// Glucose (capsule) parameters
profile.add_value("eglucose", 4.275);
profile.add_value("pglucose", 6.45);
profile.add_value("mls_per_cap", 15);
profile.add_value("glucose_density", 1/3);   // g/ml

// Basal rate surplus
profile.add_value("basal_surplus", 0.0);


function create_profile_slider(id, element = "#sliders") {
    let val = profile.get(id) || 1;
    let element_id = `${id}slider`;
    let display_id = `${id}display`
    $(element).append($(`
        <div class="slider-group">
            <div class="slider-label">${id}</div>
            <input type="range" id="${element_id}" min="0" max="${2 * val}" step="${val / 100}" value="${val}">
            <i id=${display_id}><i>
        </div>`
    ));
    profile.add_input_element(id, "#" + element_id, "input", a => parseFloat(a));
    profile.add_output_element(id, "#" + display_id);
}