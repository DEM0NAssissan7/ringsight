const Units = {
    Glucose: {
        MMOL: 1/18.018,
        MGDL: 1,
    },
    Time: { // In units of UNIT/sec
        MILLIS: 1000,
        MINUTES: 1/60,
        HOURS: 1/(60**2)
    }
}
const MILLIS = 1000;
const MINUTES = 1/60;

function random(min, max) {
    return Math.random() * (max - min) + min
}
function gen_uuid() {
    return Math.round(random(0, 2**16))
}
function get_unix_epoch_minutes(date) {
    return Math.round(date.getTime() / 1000 / 60);
}

function dimension_conversion(source, target) {
    return target / source;
}

function round(num, precision) {
    return Math.round(num * (10 ** precision)) / (10 ** precision)
}