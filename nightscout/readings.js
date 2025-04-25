const Conversions = {
    MMOL: 1/18.018,
    MGDL: 1,
}

class GlucoseReading {
    sugar = 0;
    conv = 0;
    time = new Date();
    from_nightscout(ns_object) {
        this.sugar = ns_object.sgv;
        this.conv = this.convert();
        this.set_time(ns_object.dateString);
        return this;
    }
    set_time(date) {
        this.time = new Date(date);
    }
    convert() {
        return this.sugar * ns.get("sugar_conversion");
    }
    stringify(obj) {
        return JSON.stringify(obj);
    }
    parse(string) {
        let obj = JSON.parse(string);
        this.sugar = obj.sugar;
        this.conv = obj.conv;
        this.time = new Date(obj.time);
        return this;
    }
}

function stringify_entries(obj) {
    return JSON.stringify(obj);
}
function parse_entries(string) {
    return JSON.parse(string);
}

ns.add_value("entries", []);
ns.add_handlers("entries", stringify_entries, parse_entries);
ns.add_value("last_updated", null);
ns.add_value("minutes_per_reading", 5);
ns.add_value("units", Conversions.MGDL); // The opposite of whatever we currently have. This value converts whatever sugar unit we are using into mg/dl so that the math can work properly
ns.add_value("profile_id", 0);

function nightscout_get_current_sugar() {
    return nightscout_get_request("entries").then(a => {
        return a[0].sgv;
    });
}
function refresh_nightscout_entries(time = 2) {
    let count = Math.round((time * 60) / ns.get("minutes_per_reading"));
    nightscout_get_request(`entries.json?count=${count}`)
        .then(r => r.json())
        .then(data => {
            let readings = data.map(a => new GlucoseReading().from_nightscout(a));
            ns.set("entries", readings);
            ns.set("last_updated", Date.now());
        })
        .catch(console.error);
}
let nightscout_interval;
function create_nightscout_cgm_interval() {
    nightscout_interval = setInterval(refresh_nightscout_entries, ns.get("minutes_per_reading") * 60 * 1000);
}

function convert_to_unit(value) {
    return value * Conversions
}
function get_nightscout_units() {
    get_nightscout_profile().then(a=> {
        switch(a.units) {
            case "mg/dl":
                ns.set("units", Conversions.MGDL);
                break;
            case "mmol/l":
                ns.set("units", Conversions.MMOL);
                break;
            default:
                panic(`Nightscout: unknown units '${a.units}'`);
                break;
        }
    })
}