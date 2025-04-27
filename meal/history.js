const INSULIN_EVENT_TYPE = "Meal Bolus";
const MEAL_EVENT_TYPE = "Meal";

function mark_nightscout_insulin(meal, units) {
    return nightscout_post_request("treatments", {
        uuid: meal.uuid,
        insulin: units,
        eventType: INSULIN_EVENT_TYPE
    })
}
function mark_nightscout_meal(meal) {
    meal.calc_self_nutrition();
    let uuid = meal.uuid;
    let carbs = meal.carbs;
    let protein = meal.protein;
    return nightscout_post_request("treatments", {
        notes: `${carbs}/${protein}`,
        carbs: carbs,
        protein: protein,
        uuid: uuid,
        eventType: MEAL_EVENT_TYPE
    })
}

let loaded_meals = [];
function ignore_meal(uuid) {
    meal_storage.get("ignored").push(uuid);
    meal_storage.save_all();
}
function is_ignored(uuid) {
    let ignored = meal_storage.get("ignored");
    for(let u of ignored) {
        if(u === uuid) return true;
    }
    return false;
}
function nightscout_load_previous_meals() {
    let uuids = [];
    let meals = [];
    return nightscout_get_request("treatments", treatments => {
        for(let t of treatments) {
            if(t.uuid && t.enteredBy === "Ringsight") { // If this is a treatment with a uuid and entered by ringsight previously
                let uuid = t.uuid;
                if(is_ignored(uuid)) continue;
                let meal = meals[uuid];
                if(!meal) {
                    meal = new Meal(new Date());
                    meals[uuid] = meal;
                    uuids.push(uuid);
                }   
    
                // Determine whether it's insulin or a meal
                if(t.insulin && t.eventType === INSULIN_EVENT_TYPE) {
                    meal.insulin(t.insulin, t.timestamp);
                }
                if((t.carbs || t.protein) && t.eventType === MEAL_EVENT_TYPE) {
                    meal.carbs_offset = t.carbs;
                    meal.protein_offset = t.protein;
                    meal.set_timestamp(t.timestamp);
                }
            }
        }
        for(let uuid of uuids) {
            let meal = meals[uuid];
            meal.update();
            loaded_meals.push(meal);
        }
        loaded_meals.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        return loaded_meals;
    })
}