let core_storage = new StorageNode("core");

function panic(message) {
    let m = `[${new Date().toISOString()}] PANIC: ${message}`;
    console.error(m);
    lock_storage();
    confirm(`The application has had an irrecoverable error. A debug log will be printed to the console along with an export of the onboard storage.\n\nPlease report this if issues continue.\n-----------------------------------------------------\n${message}`);
    let dump = export_storage();
    console.log(`${dump}`);
    localStorage.setItem("panic_dump", dump);
    throw new Error(message);
}

function warn(message) {
    let m = `[${new Date().toISOString()}] WARN: ${message}`;
    console.warn(m);
    let dump = export_storage();
    console.log(`${dump}`);
    localStorage.setItem("warn_dump", dump);
    if(confirm(`The application encountered an unexpected condition but will continue running. For best stability, click 'OK' to proceed safely and cancel the offending operation. Click 'Cancel' only if you're aware of the risks of potential corruption.\n\nA debug log and storage export has been printed to the console.\n\nPlease report this issue if it persists.\n\n> ${message}`)) {
        throw new Error("Operation canceled by user");
    }
}

function get_error_dump(type) {
    return localStorage.get()
}