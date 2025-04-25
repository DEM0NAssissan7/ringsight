$(document).ready(async () => {
    initialize_localstorage();
    ns.set("url", "http://mawi.ddns.net:48736")
    ns.set("api_secret", "")

    // nightscout_get_request("entries", console.log)
    nightscout_get_current_sugar().then(console.log)
  
})