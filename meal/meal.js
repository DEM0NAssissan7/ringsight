const A = -1;
const B = 20;
class Meal{
    carbs = 0;
    protein = 0;
    carbs_offset = 0;
    protein_offset = 0;

    initial_sugar = 0;
    foods = [];
    insulins = [];
    uuid = gen_uuid();
    name = "";
    series = null;
    cgm_series = null;
    constructor(timestamp) {
        this.timestamp = timestamp;
        this.series = new MathSeries();
        this.series.color = "blue"
        this.series.type = "smoothline";

        this.series.add_function(t => carbs_metabolism(t, this.carbs));
        this.series.add_function(t => protein_metabolism(t, this.protein));

        this.cgm_series = new GlucoseSeries(this.timestamp, A, B);
        this.cgm_series.color = "black";
        this.cgm_series.create_update_interval();
    }
    stringify() {
        let arr = [];
        for(let f of this.foods) {
            arr.push(f.get_stringify_object());
        }
        return JSON.stringify(arr);
    }
    parse(string) {
        let arr = JSON.parse(string);
        for(let a of arr) {
            let f = new Food(null, null, null, null);
            this.add_food(f.parse_object(a));
        }
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
        this.foods = [];
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
        let timestamp = new Date(this.get_sim_start().getTime() + ns.get("cgm_delay") * dimension_conversion(Units.Time.MINUTES, Units.Time.MILLIS));
        nightscout_get_sugar(timestamp).then(a => (this.initial_sugar = a.sugar)).then(() => this.update());
    }
    add_to_graph(graph) {
        graph.add_series(this.series);
        graph.add_series(this.cgm_series);
    }
    update() {
        this.calc_self_nutrition();
        this.series.populate(this.initial_sugar, A - 2, B, ns.get("minutes_per_reading") / 60);
    }
    get_n(timestamp) {
        return get_hour_difference(this.timestamp, timestamp);
    }
    insulin(insulin, timestamp) {
        this.series.add_function(t => insulin_metabolism(t, insulin, this.get_n(timestamp)));
        this.insulins.push({
            timestamp: timestamp,
            insulin: insulin,
            marked: false
        });
        this.get_initial_glucose();
    }

    smoothline() {
        this.series.type = "smoothline";
        this.cgm_series.type = "smoothline";
    }
    points() {
        this.series.type = "points";
        this.cgm_series.type = "points";
    }

}
let meal = new Meal(new Date());

function reset_meal() {
    meal.reset();
    wizard_state.update("meal", meal);
}

let meal_storage = new StorageNode("saved_meals");
meal_storage.add_value("meals", []);
meal_storage.add_value("ignored", []);

function prompt_save_meal() {
    let name = prompt("Enter meal name");
    meal.name = name;
    meal_storage.get("meals").push(meal.stringify());
    meal_storage.save_all();
}
function ignore_meal(uuid) {
    meal_storage.get("ignored").push(uuid);
    meal_storage.save_all();
}

// Nightscout
let loaded_meals = [];
function mark_nightscout_insulin(meal, amount) {
    nightscout_post_request("treatments", {
        uuid: meal.uuid,
        insulin: amount,
        eventType: "Meal Bolus"
    })
}
function mark_nightscout_meal(meal) {
    meal.calc_self_nutrition();
    let uuid = meal.uuid;
    let carbs = meal.carbs;
    let protein = meal.protein;
    nightscout_post_request("treatments", {
        notes: `[${uuid}]:${carbs}/${protein}`,
        carbs: carbs,
        protein: protein,
        uuid: uuid,
        eventType: "Meal"
    })
}