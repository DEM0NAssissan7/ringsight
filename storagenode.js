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
            has_handler: false,
            write_handler: a => a,
            read_handler: a => a,
        });
    }
    add_handlers(id, write_handler, read_handler) {
        let v = this.get_value_from_id(id);
        v.has_handlers = true;
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
        this.update(id, v.read_handler(localStorage.getItem(this.get_localstorage_key(id))));
    }
    reset() {
        console.log(`Resetting storage node ${this.name}`);
        for(let v of this.values) {
            v.update(v.id, v.default_value);
        }
    }
}

function localstorage_is_valid() {
    for (let s in storage_nodes) {
        for(let v in s.values) {
            if(s.read(v.id) === null) {
                return false;
            }
        }
    }
    return true;
}
function initialize_localstorage() {
    for (let s in storage_nodes) {
        for(let v in s.values) {
            s.write(v.id);
        }
    }
}