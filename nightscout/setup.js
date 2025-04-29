function skip_nightscout_setup() {
    ns.set('initialized', true);
    ns.set("url", "");
    ns.set("api_secret", "");
}
function enter_nightscout_info() {
    ns.set("url", $("#url").val());
    ns.set("api_secret", $("#apisecret").val());
    test_nightwatch_settings();
}
function test_nightwatch_settings() {
    get_nightscout_auth().then(a => {
        let can_read = a.message.canRead;
        if(can_read) {
            console.log("Connection successful");
            window.location = "index.html";
        } else {
            $("#status").val("API Secret Invalid");
        }
    }).catch(e => {
        $("#status").val("Could not configure nightscout: " + e);
        console.error(e);
    });
}