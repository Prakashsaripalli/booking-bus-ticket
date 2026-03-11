const buses = [
    {id:1, name:"Yubus Express", from:"Hyderabad", to:"Vijayawada", time:"10:00 PM", type:"AC Sleeper", price:899},
    {id:2, name:"Yubus Deluxe", from:"Hyderabad", to:"Vijayawada", time:"08:30 PM", type:"Non-AC", price:699},
    {id:3, name:"Yubus Royal", from:"Hyderabad", to:"Bangalore", time:"09:00 PM", type:"AC Sleeper", price:1299},
    {id:4, name:"Yubus Star", from:"Vijayawada", to:"Hyderabad", time:"07:00 AM", type:"AC Seater", price:799},
    {id:5, name:"Yubus Comfort", from:"Hyderabad", to:"Chennai", time:"11:00 PM", type:"AC Sleeper", price:1499},
    {id:6, name:"Yubus SuperFast", from:"Chennai", to:"Hyderabad", time:"06:00 AM", type:"Non-AC", price:999},
    {id:7, name:"Yubus Luxury", from:"Hyderabad", to:"Bangalore", time:"05:30 PM", type:"AC Volvo", price:1599},
    {id:8, name:"Yubus Night Rider", from:"Bangalore", to:"Hyderabad", time:"10:30 PM", type:"Sleeper", price:1199}
];

function searchBuses() {
    const fromCity = document.getElementById("from").value.trim();
    const toCity = document.getElementById("to").value.trim();
    const results = document.getElementById("results");

    results.innerHTML = "";

    if(fromCity === "" || toCity === ""){
        results.innerHTML = "<h3>Please enter both cities</h3>";
        return;
    }

    const filtered = buses.filter(bus =>
        bus.from.toLowerCase() === fromCity.toLowerCase() &&
        bus.to.toLowerCase() === toCity.toLowerCase()
    );

    if(filtered.length === 0){
        results.innerHTML = "<h3>No buses available for this route 🚫</h3>";
        return;
    }

    filtered.forEach(bus => {
        const card = document.createElement("div");
        card.classList.add("bus-card");

        card.innerHTML = `
            <div class="bus-details">
                <h3>${bus.name}</h3>
                <p>${bus.from} → ${bus.to}</p>
                <p>Departure: ${bus.time}</p>
                <p>Type: ${bus.type}</p>
            </div>
            <div>
                <p class="price">₹${bus.price}</p>
                <button class="book-btn">Book Now</button>
            </div>
        `;

        results.appendChild(card);
    });
}