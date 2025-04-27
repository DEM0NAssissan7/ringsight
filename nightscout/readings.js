ns.add_value("minutes_per_reading", 5);
ns.add_value("units", Units.Glucose.MGDL); // The opposite of whatever we currently have. This value converts whatever sugar unit we are using into mg/dl so that the math can work properly
ns.add_value("profile_id", 0);

class GlucoseReading {
    sugar = 0;
    conv = 0;
    timestamp = new Date();
    from_nightscout(ns_object) {
        this.raw_sugar = ns_object.sgv;
        this.sugar = this.convert();
        this.set_time(ns_object.dateString);
        return this;
    }
    set_time(date) {
        this.timestamp = new Date(date);
    }
    convert() {
        return this.raw_sugar * ns.get("units");
    }
    stringify(obj) {
        return JSON.stringify(obj);
    }
    parse(string) {
        let obj = JSON.parse(string);
        this.sugar = obj.sugar;
        this.conv = obj.conv;
        this.timestamp = new Date(obj.time);
        return this;
    }
}

function nightscout_get_current_sugar() {
    return nightscout_get_request("entries").then(a => {
        return a[0].sgv;
    });
}
function get_readings_count(timestampA, timestampB) { // 'a' and 'b' are in units of 
    return (timestampB.getTime() - timestampA.getTime()) * dimension_conversion(Units.Time.MILLIS, Units.Time.MINUTES) / ns.get("minutes_per_reading");
}
function nightscout_get_readings(timestampA, timestampB) {
    let count = get_readings_count(timestampA, timestampB);
    return nightscout_get_request(`entries/sgv.json?find[date][$gte]=${timestampA.getTime()}&find[date][$lte]=${timestampB.getTime()}&count=${count}`)
        // .then(r => JSON.parse(r))
        // .then(console.log)
        .then(data => data.map(a => new GlucoseReading().from_nightscout(a)))
        .catch(console.error);
}
let nightscout_interval;
function create_nightscout_cgm_interval() {
    nightscout_interval = setInterval(refresh_nightscout_entries, ns.get("minutes_per_reading") * 60 * 1000);
}

function convert_to_unit(value) {
    return value * Units.Glucose
}
function get_nightscout_units() {
    get_nightscout_profile().then(a=> {
        switch(a.units) {
            case "mg/dl":
                ns.set("units", Units.Glucose.MGDL);
                break;
            case "mmol/l":
                ns.set("units", Units.Glucose.MMOL);
                break;
            default:
                panic(`Nightscout: unknown units '${a.units}'`);
                break;
        }
    })
}