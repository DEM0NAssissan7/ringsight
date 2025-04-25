const storage_nodes = [];

function default_read_handler(a) {
    let p;
    try{
        p = JSON.parse(a);
    } catch {
        console.warn("JSON parse failed - output may be unreliable");
        p = a;
    }
    return p;
}
function default_write_handler(a) {
    let p;
    try{
        p = JSON.stringify(a);
    } catch {
        throw new Error("JSON input is invalid - cannot write");
    }
    return p;
}

class StorageNode {
    values = []
    exclude_from_export = false;
    constructor(name) {
        this.name = name;
        storage_nodes.push(this); // add itself to the storage nodes array
    }
    add_value(id, default_value) {
        this.values.push({
            id: id,
            value: default_value,
            default_value: default_value,
            write_handler: default_write_handler,
            read_handler: default_read_handler,
            callbacks: [],
        });
    }
    add_handlers(id, write_handler, read_handler) {
        let v = this.get_value_from_id(id);
        v.write_handler = write_handler;
        v.read_handler = read_handler;
    }

    add_input_element(id, element, event, handler = (a, b) => a) {
        let self = this;
        $(element).on(event, function(e) {
            self.set(id, handler($(element).val(), e));
        })
    }
    add_output_element(id, element, handler = a => a) {
        this.add_callback(id, a => {$(element).html(handler(a))});
    }
    add_callback(id, callback) {
        let v = this.get_value_from_id(id);
        v.callbacks.push(callback);
    }
    
    get_value_from_id(id) {
        for (let v of this.values) {
            if (v.id === id)
                return v;
        }
        throw new Error(`Could not find value for id '${id}' in node '${this.name}'`);
    }
    get_localstorage_key(id) {
        return `${this.name}.${id}`
    }

    get(id) {
        return this.get_value_from_id(id).value;
    }
    set(id, value) {
        let v = this.get_value_from_id(id);
        v.value = value;
        for(let f of v.callbacks)
            f(value);
        this.write(id);
        return value;
    }

    get_write_value(id) {
        let v = this.get_value_from_id(id);
        return v.write_handler(v.value)
    }
    get_real_value(id, write_value) {
        let v = this.get_value_from_id(id);
        let value = v.read_handler(write_value);
        return value;
    }

    write(id) {
        storage_write(this.get_localstorage_key(id), this.get_write_value(id));
    }
    write_all() {
        for(let v of this.values)
            this.write(v.id)
    }
    read(id) {
        let v = this.get_value_from_id(id);
        let key = this.get_localstorage_key(id)
        let item = storage_read(key);
        if (item === null) {
            item = v.value;
            this.set(id, item);
            console.log(`'${id}' in node '${this.name}' was missing from storage, initializing with default value`);
        } else
            item = this.get_real_value(id, item)
        this.set(id, item);
        return item;
    }

    reset(id) {
        console.log(`Resetting '${id}' from node '${this.name}'`);
        let v = this.get_value_from_id(id);
        this.set(id, v.default_value);
    }
    reset_all() {
        console.warn(`Resetting storage node '${this.name}'`);
        for(let v of this.values) {
            this.reset(v.id);
        }
    }
}

function storage_write(key, value) {
    try {
        localStorage.setItem(key, value);
      } catch (e) {
        if (e.name === 'QuotaExceededError') {
          panic('Application out of local storage'); //data wasn't successfully saved due to quota exceed so throw an error
        }
      }
}
function storage_read(key) {
    let a = localStorage.getItem(key);
    if(a === null) console.error(`Cannot read key ${key}: does not exist`);
    return a;
}

function initialize_localstorage() {
    // Read test
    for (let s of storage_nodes) {
        for(let v of s.values) {
            s.read(v.id);
        }
    }
    // Write test
    for (let s of storage_nodes) {
        for(let v of s.values) {
            s.write(v.id);
        }
    }
}

function export_storage() {
    let nodes = [];
    for (let node of storage_nodes) {
        if(node.exclude_from_export) continue;
        let values = [];
        for (let v of node.values) {
            values.push({
                id: v.id,
                value: node.get_write_value(v.id)
            })
        }
        nodes.push({
            name: node.name,
            values: values
        })
    }
    return JSON.stringify(nodes);
}
function import_storage(string) {
    const error_prefix = `Storage import incomplete due to mismatch between import and local storage: `
    let nodes = JSON.parse(string);
    for (let source of nodes) {
        let success = false;
        for (let target of storage_nodes) {
            if(source.name === target.name) {
                for(let source_val of source.values) {
                    let success = false;
                    for(let target_val of target.values) {
                        if(source_val.id === target_val.id) {
                            target.set(target_val.id, target.get_real_value(target_val.id, source_val.value))
                            success = true;
                            break;
                        }
                    }
                    if(!success) warn(`${error_prefix}No matching target found for value '${source_val.id}' in node '${source.name}'`);
                }
                success = true;
                break;
            }
        }
        if(!success) warn(`${error_prefix}No matching storage node found for '${source.name}'`);
    }
}
function reset_storage() {
    let condition = confirm("Are you sure you want to reset all stored data? This does not apply to nightscout.")
    if(!condition) return;

    console.warn("Resetting all storage nodes and reloading the page");
    for(let n of storage_nodes) {
        n.reset_all();
    }
    location.reload(); // We only reload to absolutely ensure integrity of the application. We do NOT want to risk leaving the user in a bad place
}