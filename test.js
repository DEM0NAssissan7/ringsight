let graph = new Graph();
let series, meal, meal_series;
$(document).ready(async () => {
    initialize_localstorage();
    ns.set("url", "http://mawi.ddns.net:48736")
    ns.set("api_secret", "ringsight-9b5b95e502ffbbf1")


    const until = 12;
    graph.attach(document.body, 200, 200);
    graph.set_dimensions(700, 700)
    graph.set_bounds(-1, until, 50, 140);
    graph.scale = 2;

    series = new GlucoseSeries(new Date("Apr 26 2025 13:35:00"), -1, until);
    series.type = "smoothline"
    graph.add_series(series);

    let perfect_line = new GraphSeries();
    perfect_line.color = "green";
    perfect_line.type = "horizontal lines"
    perfect_line.point(0, 83);
    graph.add_series(perfect_line);

    
    let now_line = new GraphSeries();
    now_line.color = "gray";
    now_line.type = "vertical lines"
    now_line.point(0, 0);
    graph.add_series(now_line);


    let n_insulin = 19/60;
    let insulin = 6.5;
    let carbs = 6.5;
    let protein = 63;

    let insulin_line = new GraphSeries();
    insulin_line.color = "maroon";
    insulin_line.type = "vertical lines"
    insulin_line.point(19/60, 0);
    graph.add_series(insulin_line);


    // Meal
    meal_series = new GraphSeries();
    meal_series.color = "red";
    meal_series.type = "smoothline"
    graph.add_series(meal_series);

    meal = new Metabolism()
    meal.add_function(meal_metabolism(n_insulin, insulin, carbs, protein));



    setInterval(() => {
        meal.populate_series(meal_series, 130);
    }, 500)
    
    

    // nightscout_get_current_sugar().then(console.log)
    // document.addEventListener("mousemove", e=>{
    //     graph.set_dimensions(e.x, e.y);
    // })
})