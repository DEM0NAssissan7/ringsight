const storage_nodes = [];
class StorageNode {
    values = []
    constructor(name) {
        this.name = name;
        storage_nodes.push(this); // add itself to the storage nodes array
    }
    add_value(id, default_value) {
        this.values.push({
            id: id,
            value: value,
            default_value: default_value,
            write_handler: a => a,
            read_handler: a => a,
        });
    }
    add_handlers(id, write_handler, read_handler) {
        let v = this.get_value_from_id(id);
        v.write_handler = write_handler;
        v.read_handler = read_handler;
    }
    add_event_listener(id, element, event, handler = (a, b) => a) {
        element.addEventListener(event, e => {
            this.update(id, handler($(element).val(), e));
        })
    }
    get_value(id) {
        return this.get_value_from_id(id).value;
    }
    get_value_from_id(id) {
        for (let v in this.values) {
            if (v.id === id)
                return v;
        }
        throw new Error(`Could not find value for id ${id} in node ${this.name}`);
    }
    update(id, value) {
        this.get_value_from_id(id).value = value;
        this.write(id);
    }
    get_localstorage_key(id) {
        return `storagenode:${this.name}.${id}`
    }

    write(id) {
        let v = this.get_value_from_id(id);
        localStorage.setItem(this.get_localstorage_key(id), v.write_handler(v.value));
    }
    write_all() {
        for(let v in this.values)
            this.write(v.id)
    }
    read(id) {
        let v = this.get_value_from_id(id);
        let key = this.get_localstorage_key(id)
        let item = localStorage.getItem(key);
        if (item === null) {
            item = v.value;
            console.log(`${id} in node ${this.name} was missing from storage, initializing with default value`);
        } else
            item = v.read_handler(item);
        this.update(id, item);
        return item;
    }
    reset(id) {
        console.log(`Resetting ${id} from node ${this.name}`);
        let v = this.get_value_from_id(id);
        v.update(id, v.default_value);
    }
    reset_all() {
        console.warn(`Resetting storage node ${this.name}`);
        for(let v of this.values) {
            this.reset(v.id);
        }
    }
}

function initialize_localstorage() {
    // Read test
    for (let s in storage_nodes) {
        for(let v in s.values) {
            s.read(v.id);
        }
    }
    // Write test
    for (let s in storage_nodes) {
        for(let v in s.values) {
            s.write(v.id);
        }
    }
}

function export_storage() {
    let nodes = [];
    for (let s in storage_nodes) {
        let values = [];
        for (let v in s.values) {
            values.push({
                id: id,
                value: value
            })
        }
        nodes.push({
            name: s.name,
            values: values
        })
    }
    return JSON.stringify(nodes);
}
function import_storage(string) {
    let nodes = JSON.parse(string);
    for (let n in nodes) {
        for (let s in storage_nodes) {
            if(n.name === s.name) {
                for(let source in n.values) {
                    for(let target in s.values) {
                        if(source.id === target.id) {
                            target.value = source.value;
                            break;
                        }
                    }
                }
                break;
            }
        }
    }
}