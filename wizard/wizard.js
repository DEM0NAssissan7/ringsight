const wizard_state = new StorageNode("wizard");
wizard_state.add_value("page", "intro");

wizard_state.add_value("insulin_amount", -1);
wizard_state.add_value("insulin_timestamp", -1);

wizard_state.add_value("meal_timestamp", -1);
wizard_state.add_value("meal", meal);
wizard_state.add_handlers("meal", meal.stringify, meal.parse);

const Page = {
    MAIN_MENU: "intro",
    MEAL: "meal",
    INSULIN: "insulin",
    CONFIRMATION: "meal_confirmation",
}

function get_wizard_html_name(page) {
    return `wizard_${page}.html`;
}

function reset_meal() {
    meal = new Meal(new Date());
    wizard_state.write(meal);
}