function random(min, max) {
    return Math.random() * (max - min) + min
}
function gen_uuid() {
    return Math.round(random(0, 2**16))
}