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


// General glucose series that can be used anywhere. This is a wrapper to the series, but it's integrated with nightscout so it can be automatically populated
ns.add_value("graph_timestamp", new Date());
ns.add_handlers("graph_timestamp", a=>a, a=>new Date(a));
ns.add_value("cgm_delay", 10); // How delayed the CGM is (in minutes)
class GlucoseSeries extends GraphSeries {
    complete = false
    constructor(timestamp, a, b) { // 'a' and 'b' are in hours
        super()
        this.timestamp = timestamp;
        this.populate(a, b);
    }
    async populate(a, b) { // We populate the graph with whatever points we can from 'a' hours after timestamp and 'b' hours after timestamp
        let timestampA = this.get_timestamp_from_offset(a);
        let timestampB = this.get_timestamp_from_offset(b);

        let readings = await nightscout_get_readings(timestampA, timestampB);
        this.complete = readings[0].timestamp.getTime() >= timestampB.getTime();

        for (let r of readings) {
            this.add_glucose_reading(r)
        }
    }
    add_glucose_reading(reading) {
        let x = this.get_relative_minutes(reading.timestamp) / 60;
        let y = reading.sugar;
        this.point(x, y);
    }
    get_relative_minutes(timestamp) {
        return get_unix_epoch_minutes(timestamp) - get_unix_epoch_minutes(this.timestamp) - ns.get("cgm_delay"); // adjust for CGM delay to create more accurate simulations
    }
    get_timestamp_from_offset(a) { // offset is in hours
        let unix_timestamp = this.timestamp.getTime();
        let millis_from_offset = a * dimension_conversion(Units.Time.HOURS, Units.Time.MILLIS);
        return new Date(unix_timestamp + millis_from_offset);
    }
}
let glucose_series;
// let glucose_graph = new GlucoseGraph();

function init_sugar_graph(timestamp) {
    glucose_series = new GlucoseSeries(ns.get("graph_timestamp"), -1, 8);
}