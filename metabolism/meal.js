class Meal{
    carbs = 0;
    protein = 0;
    foods = [];
    uuid = gen_uuid();
    name = "";
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
    }
    add_food(food) {
        this.foods.push(food);
        this.calc_self_nutrition();
    }
    calc_self_nutrition() {
        this.carbs = 0;
        this.protein = 0;
        for(let f of this.foods) {
            this.carbs += f.carbs;
            this.protein += f.protein;
        }
    }
    reset() {
        this.foods = [];
        this.calc_self_nutrition();
        this.uuid = gen_uuid();
    }
}
let meal_simulation = new Meal();

function reset_meal() {
    meal_simulation.reset();
    wizard_state.update("meal", meal_simulation);
}

let saved_meals = StorageNode("saved_meals");
saved_meals.add_value("meals", []);
saved_meals.add_handlers("meals", JSON.stringify, JSON.parse);
saved_meals.add_value("ignored", []);
saved_meals.add_handlers("ignored", JSON.stringify, JSON.parse);

function prompt_save_meal() {
    let name = prompt("Enter meal name");
    meal_simulation.name = name;
    saved_meals.get("meals").push(meal_simulation.stringify());
    saved_meals.save_all();
}
function ignore_meal(uuid) {
    saved_meals.get("ignored").push(uuid);
    saved_meals.save_all();
}