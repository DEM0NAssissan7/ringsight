let ns = new StorageNode("nightscout");
ns.add_value("url", "https://example.com");
ns.add_value("api_secret", "");
ns.add_value("profile", "");
ns.add_value("entries", []);
ns.add_value("last_updated", null);

function ns_api_path(path) {
    return `${ns.get("url")}/api/v1/${path}`
}
function nightscout_get_request(path, handler, options) {
    return fetch(ns_api_path(path), {
        method: "GET",
        headers: {
            "accept": "application/json",
            "api-secret": ns.get("api_secret"),
            "x-requested-with": "XMLHttpRequest"
        },
        mode: "cors",
        credentials: "omit",
        ...options // allows override or extension
    }).then(a => a.json()).then(handler);
}
function nightscout_post_request(path, content) {
    content.enteredBy = "Ringsight"
    content.timestamp = Date.now();
    return fetch(ns_api_path(path), {
            "headers": {
                "accept": "*/*",
                "accept-language": "en-US,en;q=0.9",
                "api-secret": ns.get("api_secret"),
                "content-type": "application/json; charset=UTF-8",
                "x-requested-with": "XMLHttpRequest"
            },
            "referrerPolicy": "strict-origin-when-cross-origin",
            "body": JSON.stringify(content),
            "method": "POST",
            "mode": "cors",
            "credentials": "omit"
        });
}

function mark_nightscout_insulin(meal, amount) {
    nightscout_post_request("treatments", {
        uuid: meal.uuid,
        insulin: amount,
        eventType: "Meal Bolus"
    })
}
function mark_nightscout_meal(meal) {
    meal.calc_self_nutrition();
    let uuid = meal.uuid;
    let carbs = meal.carbs;
    let protein = meal.protein;
    nightscout_post_request("treatments", {
        notes: `[${uuid}]:${carbs}/${protein}`,
        carbs: carbs,
        protein: protein,
        uuid: uuid,
        eventType: "Meal"
    })
}

function nightscout_get_current_sugar() {
    return nightscout_get_request("entries").then(a => {
        return a[0].sgv;
    });
}