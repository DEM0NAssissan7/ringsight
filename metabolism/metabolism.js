function insulin_metabolism(t, insulin, n_insulin) {
    // return insulin_sim2({
    //     dose: insulin,
    //     ka: profile.get("pinsulin") + profile.get('xinsulin') * insulin,
    //     F: profile.get("bioavailability"),
    //     einsulin: profile.get("einsulin")
    // }, t - n_insulin - profile.get("ninsulin"))
    return meta_function(t,
        -insulin * profile.get("einsulin"),
        profile.get("ninsulin") + n_insulin,
        profile.get("pinsulin"),
        Z
    )
}
function carbs_metabolism(t, carbs, glycemic_index) {
    let p_factor = (glycemic_index / 15) || 1;
    return meta_function(t,
        profile.get("ecarbs") * carbs,
        profile.get("ncarbs"),
        profile.get("pcarbs") * p_factor,
        G
    )
}
function protein_metabolism(t, protein) {
    return meta_function(t,
        protein * profile.get("eprotein"),
        profile.get("nprotein"),
        [profile.get("protein_rise"), profile.get("protein_duration"), profile.get("protein_end")],
        P
    )
    // return protein_sim({
    //     protein: protein,
    //     pprotein: profile.get("pprotein"),
    //     eprotein: profile.get("eprotein")
    // }, t - profile.get("nprotein"));
}
function glucose_metabolism(t, caps, n_glucose) {
    let carbs = caps * profile.get("mls_per_cap") * profile.get("glucose_density")
    return meta_function(t,
        carbs * profile.get("eglucose"),
        n_glucose,
        profile.get("pglucose"),
        Z
    );
}
function basal(t) {
    return - t * profile.get("basal_surplus")/24
}