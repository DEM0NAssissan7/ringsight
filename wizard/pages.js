const wizard_state = new StorageNode("wizard");
wizard_state.add_value("page", 0);

wizard_state.add_value("insulin_amount", -1);
wizard_state.add_value("insulin_timestamp", -1);

wizard_state.add_value("meal_timestamp", -1);
wizard_state.add_value("meal", meal);
wizard_state.add_handlers("meal", meal.stringify, meal.parse);

let wizard_pages = [];

const Page = {
    FIRST_START: 0,
    MAIN_MENU: 1,
    MEAL_CREATION: 2,
    INSULIN: 3,
    EAT: 4,
    PROFILER: 5,
}

function clear_page() {
    
}
function load_page(page) {
    console.log(`Loading page ${page}...`)
    clear_page();
    wizard_pages[page]();
}