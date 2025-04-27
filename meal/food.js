let foods = [];
class Food {
    carbs_per_unit = 0;
    protein_per_unit = 0;
    carbs = 0;
    protein = 0;
    amount = 0;
    constructor(name, carbs_per_unit, protein_per_unit, element) {
        this.carbs_per_unit;
        this.name = name;
        this.carbs_per_unit = carbs_per_unit;
        this.protein_per_unit = protein_per_unit;
        this.element = element;
    }
    stringify() {
        return JSON.stringify(this.get_stringify_object());
    }
    get_stringify_object() {
        return {
            name: this.name,
            carbs_per_unit: this.carbs_per_unit,
            protein_per_unit: this.protein_per_unit
        }
    }
    parse_object(o) {
        this.name = o.name;
        this.carbs_per_unit = o.carbs_per_unit;
        this.protein_per_unit = o.protein_per_unit;
    }
    parse(string) {
        let o = JSON.parse(string);
        this.parse_object(o);
    }
    calc_nutrition() {
        this.carbs = this.amount * this.carbs_per_unit;
        this.protein = this.amount * this.protein_per_unit;
    }
    set_amount(n) {
        this.amount = n;
        this.calc_nutrition();
    }
}

const GRAMS = 100;
const UNIT = 1;
function add_food(name, carbs, protein, unit = GRAMS) {
    foods.push(new Food(name, carbs/unit, protein/unit));
}