const profile = new StorageNode("profile");

// Insulin parameters
profile.add_value("einsulin", 28.7);
profile.add_value("ninsulin", 0.5);
profile.add_value("pinsulin", 0.6);

// Carbohydrate parameters
profile.add_value("ecarbs", 4.2);
profile.add_value("ncarbs", 0.0);
profile.add_value("pcarbs", 0.8);

// Protein parameters
profile.add_value("eprotein", 1.8);
profile.add_value("nprotein", 0.0);
profile.add_value("pprotein", 0.15);

// Glucose (capsule) parameters
profile.add_value("eglucose", 4.75);
profile.add_value("pglucose", 6);
profile.add_value("mls_per_cap", 15);
profile.add_value("glucose_density", 15 / 60);   // g/ml

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