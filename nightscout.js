let nightscout_storage = new StorageNode("nightscout");
nightscout_storage.add_item("api_secret", 0);

function authorize_nightscout(api_secret) {
    nightscout_storage.update("api_secret", api_secret);
}



function mark_nightscout_insulin(units) {

}
function mark_nightscout_meal(meal) {
    let uuid = meal.uuid;
    let carbs = meal.carbs;
    let protein = meal.protein;
    let timestamp = Date.now();
}
function mark_nightscout_glucose(caps) {

}


function get_current_sugar() {

}