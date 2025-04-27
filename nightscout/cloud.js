let ns = new StorageNode("nightscout");
ns.add_value("url", "https://example.com");
ns.add_value("api_secret", "");
ns.add_value("profile", "");

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
function get_nightscout_profile() {
    return nightscout_get_request("profile").then(a => a[ns.get("profile_id")]);
}