const A = -1;
const B = 20;
const A_OFFSET = -2;
const MEAL_JSON_VERSION = 1;
function get_reading_interval() {
    return ns.get("minutes_per_reading") / 60
}
class Meal{
    carbs = 0;
    protein = 0;
    carbs_offset = 0;
    protein_offset = 0;

    initial_sugar = 0;
    foods = [];
    insulins = [];
    glucoses = [];
    uuid = gen_uuid();
    name = "";
    series = null;
    cgm_series = null;
    marked = false;
    a = A + A_OFFSET;
    b = B;

    GI = 15;
    GI_avg = 0;
    constructor(timestamp) {
        this.set_timestamp(timestamp);
        this.series = new MathSeries();
        this.series.color = "blue"
        this.series.type = "smoothline";

        this.series.add_function(t => carbs_metabolism(t, this.carbs, this.GI_avg || this.GI));
        this.series.add_function(t => protein_metabolism(t, this.protein));

        this.cgm_series = new GlucoseSeries(this.timestamp, this.a - A_OFFSET, this.b);
        this.cgm_series.color = "black";
        this.cgm_series.create_update_interval();
    }
    set_bounds(a, b) {
        this.a = a;
        this.b = b;
        this.cgm_series.a = a;
        this.cgm_series.b = b;
    }
    stringify() {
        let foods = [];
        for(let f of this.foods) {
            foods.push(f.get_stringify_object());
        }
        return JSON.stringify({
            version: MEAL_JSON_VERSION,
            foods: foods,
            carbs: this.carbs_offset,
            protein: this.protein_offset,
            insulins: insulins,
            uuid: this.uuid,
        });
    }
    parse(string) {
        let obj = JSON.parse(string);
        for(let a of obj.foods) {
            let f = new Food(null, null, null, null);
            this.add_food(f.parse_object(a));
        }

        this.carbs_offset = obj.carbs;
        this.protein_offset = obj.protein;
        this.uuid = obj.uuid || gen_uuid();
        for(let insulin of obj.insulins) {
            let obj = this.insulin(insulin.units, new Date(insulin.timestamp));
            obj.marked = insulin.marked;
        }

        this.calc_self_nutrition();
        this.get_initial_glucose();
    }
    add_food(food) {
        this.foods.push(food);
        this.calc_self_nutrition();
    }
    calc_self_nutrition() {
        this.carbs = this.carbs_offset;
        this.protein = this.protein_offset;
        for(let f of this.foods) {
            f.calc_nutrition();
            this.carbs += f.carbs;
            this.protein += f.protein;
        }
    }
    reset() {
        this.set_timestamp(new Date());
        this.foods = [];
        this.insulins = [];
        this.calc_self_nutrition();
        this.uuid = gen_uuid();
    }
    set_timestamp(timestamp) {
        this.timestamp = timestamp;
        this.get_initial_glucose();
    }

    get_sim_start() {
        let timestamp = this.timestamp; // Set the time when you start eating
        for(let insulin of this.insulins) {
            if(get_hour_difference(timestamp, insulin.timestamp) < 0) // If the insulin happened before
                timestamp = insulin.timestamp;
        }
        return timestamp;
    }
    get_initial_glucose() {
        let delay = ns.get("cgm_delay") * dimension_conversion(Units.Time.MINUTES, Units.Time.MILLIS);
        let timestamp = new Date(this.get_sim_start().getTime() + delay * 0);
        nightscout_get_sugar(timestamp).then(a => (this.initial_sugar = a.sugar)).then(() => this.update());
    }
    add_to_graph(graph) {
        graph.add_series(this.series);
        graph.add_series(this.cgm_series);
    }
    update() {
        this.calc_self_nutrition();
        this.series.populate(this.initial_sugar, this.a, this.b, get_reading_interval());
    }
    get_n(timestamp) {
        return get_hour_difference(this.timestamp, timestamp);
    }
    insulin(units, timestamp) {
        this.series.add_function(t => insulin_metabolism(t, units, this.get_n(timestamp)));
        let obj = {
            timestamp: timestamp,
            units: units,
            marked: false
        };
        this.insulins.push(obj);
        this.get_initial_glucose();
        return obj;
    }
    glucose(caps, timestamp) {
        this.series.add_function(t => glucose_metabolism(t, caps, this.get_n(timestamp)))
        let obj = {
            timestamp: timestamp,
            caps: caps,
            marked: false
        };
        this.glucoses.push(obj);
        return obj;
    }
    mark_insulin(units) {
        let timestamp = new Date();
        let obj = this.insulin(units, timestamp);
        mark_nightscout_insulin(this, units).then(() => (obj.marked = true));
    }
    mark() {
        if(this.marked) throw new Error("Cannot mark meal: already marked");
        mark_nightscout_meal(this).then(() => this.marked = true);
    }

    smoothline() {
        this.series.type = "smoothline";
        this.cgm_series.type = "smoothline";
    }
    points() {
        this.series.type = "points";
        this.cgm_series.type = "points";
    }

    get_sim_error() {
        let a = this.get_n(this.get_sim_start());
        let b = this.cgm_series.points[0].rawX;
        return series_difference(this.series, this.cgm_series, a, b, get_reading_interval());
    }
    absorb(meal) { // Allow the meal series to absorb another meal so they can be plotted together
        let n_offset = this.get_n(meal.timestamp);
        for(let f of meal.series.functions) {
            this.series.add_function(t => f(t - n_offset));
        }
        if(n_offset > 0) {
            this.set_bounds(this.a, this.b + n_offset)
        }
        if(n_offset < 0) {
            this.set_bounds(this.a + n_offset, this.b);
        }
    }
}


let meal;

let meal_storage = new StorageNode("saved_meals");
meal_storage.add_value("meals", []);
meal_storage.add_value("ignored", []);
meal_storage.add_value("meal", meal);

function reset_meal() {
    meal.reset();
    meal_storage.set("meal", meal);
}
function init_meal() {
    meal = new Meal(new Date());
    meal_storage.add_handlers("meal", meal.stringify, meal.parse)
}


function prompt_save_meal() {
    let name = prompt("Enter meal name");
    meal.name = name;
    meal_storage.get("meals").push(meal.stringify());
    meal_storage.save_all();
}