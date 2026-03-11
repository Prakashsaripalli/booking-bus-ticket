
const tabs = document.querySelectorAll(".tab");

function updateAuthNav() {
    const authNavLink = document.getElementById("authNavLink");
    if (!authNavLink) {
        return;
    }

    const isLoggedIn =
        localStorage.getItem("adminLoggedIn") === "true" ||
        localStorage.getItem("userOTPVerified") === "true" ||
        localStorage.getItem("googleLogin") === "true";

    if (!isLoggedIn) {
        authNavLink.classList.remove("profile-icon-link");
        authNavLink.href = "login.html";
        authNavLink.innerHTML = '<i class="fa-solid fa-user"></i> Login / Sign Up';
        return;
    }

    authNavLink.classList.add("profile-icon-link");
    authNavLink.href = "profile.html";
    authNavLink.title = "Profile";
    authNavLink.innerHTML = '<i class="fa-solid fa-circle-user"></i>';
}

updateAuthNav();

tabs.forEach(tab => {
    tab.addEventListener("click", () => {
        tabs.forEach(t => t.classList.remove("active"));
        tab.classList.add("active");
    });
});

const swapBtn = document.querySelector(".swap");
if (swapBtn) {
    swapBtn.addEventListener("click", swapCities);
}

const dayButtons = document.querySelectorAll(".day-btn");
const dateInput = document.querySelector("input[type='date']");

dayButtons[0].addEventListener("click", () => {
    const today = new Date();
    dateInput.value = today.toISOString().split("T")[0];
});

dayButtons[1].addEventListener("click", () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    dateInput.value = tomorrow.toISOString().split("T")[0];
});




document.getElementById("searchBtn").addEventListener("click", function () {

    const from = document.getElementById("from").value;
    const to = document.getElementById("to").value;
    const date = document.getElementById("date").value;

    if(!from || !to || !date){
        alert("Fill all fields");
        return;
    }

    window.location.href =
        `result.html?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&date=${date}`;
});


const fromCityInput = document.getElementById("from");
const fromDropdown = document.getElementById("fromDropdown");

fromCityInput.addEventListener("click", () => {
    fromDropdown.style.display = "block";
});

function selectCity(city) {
    fromCityInput.value = city;
    fromDropdown.style.display = "none";
}

document.addEventListener("click", (e) => {
    if (!e.target.closest(".city-field")) {
        fromDropdown.style.display = "none";
    }
});

const dropdown = document.getElementById("fromDropdown");

fromCityInput.addEventListener("click", () => {
    dropdown.style.display = "block";
});


function selectCity(city) {
    fromCityInput.value = city;
    dropdown.style.display = "none";
}


document.addEventListener("click", (e) => {
    if (!e.target.closest(".city-field")) {
        dropdown.style.display = "none";
    }
});


////
const fromCity = document.getElementById("from");
const toCity = document.getElementById("to");
const toDropdown = document.getElementById("toDropdown");

fromCity.addEventListener("click", () => {
    fromDropdown.style.display = "block";
    toDropdown.style.display = "none";
});

toCity.addEventListener("click", () => {
    toDropdown.style.display = "block";
    fromDropdown.style.display = "none";
});

function selectCity(inputId, city) {
    document.getElementById(inputId).value = city;
    fromDropdown.style.display = "none";
    toDropdown.style.display = "none";
}

function swapCities(e) {
    const fromField = document.getElementById("from");
    const toField = document.getElementById("to");
    if (!fromField || !toField) {
        return;
    }
    const temp = fromField.value;
    fromField.value = toField.value;
    toField.value = temp;
}

document.addEventListener("click", (e) => {
    if (!e.target.closest(".city-field")) {
        fromDropdown.style.display = "none";
        toDropdown.style.display = "none";
    }
});


const slider = document.getElementById("offerSlider");

function slideLeft() {
    slider.scrollLeft -= 300;
}

function slideRight() {
    slider.scrollLeft += 300;
}


let isViewAll = false;

function toggleViewAll() {
    const slider = document.getElementById("offerSlider");
    const btn = document.querySelector(".view-all-btn");

    isViewAll = !isViewAll;

    if (isViewAll) {
        slider.classList.add("view-all");
        btn.innerText = "Show Less";
    } else {
        slider.classList.remove("view-all");
        btn.innerText = "View All";
    }
}



const imageOffers = document.getElementById("imageOffers");
const textOffers = document.getElementById("textOffers");
const btn = document.querySelector(".view-all-btn");


function slideLeft() {
    slider.scrollLeft -= 300;
}

function slideRight() {
    slider.scrollLeft += 300;
}

function toggleViewAll() {
    isViewAll = !isViewAll;

    if (isViewAll) {
        imageOffers.style.display = "none";
        textOffers.style.display = "block";
        btn.innerText = "Show Less";
    } else {
        imageOffers.style.display = "block";
        textOffers.style.display = "none";
        btn.innerText = "View All";
    }
}



let isDragging = false;
let startX;
let scrollLeftStart;

// Disable browser context menu on slider
slider.addEventListener("contextmenu", e => e.preventDefault());

// Right mouse button down
slider.addEventListener("mousedown", (e) => {
    if (e.button !== 2) return; // RIGHT CLICK ONLY

    isDragging = true;
    slider.classList.add("dragging");
    startX = e.pageX;
    scrollLeftStart = slider.scrollLeft;
});

// Mouse move
document.addEventListener("mousemove", (e) => {
    if (!isDragging) return;

    const x = e.pageX;
    const walk = (startX - x);
    slider.scrollLeft = scrollLeftStart + walk;
});

// Mouse up
document.addEventListener("mouseup", () => {
    isDragging = false;
    slider.classList.remove("dragging");
});


const ratings = document.querySelectorAll('.rating')
const ratingsContainer = document.querySelector('.ratings-container')
const sendBtn = document.querySelector('#send')
const panel = document.querySelector('#panel')
let selectedRating = 'Satisfied'

ratingsContainer.addEventListener('click', (e) => {
    if (e.target.parentNode.classList.contains('rating')) {
        removeActive()
        e.target.parentNode.classList.add('active')
        selectedRating = e.target.nextElementSibling.innerHTML
    }
})

sendBtn.addEventListener('click', (e) => {
    panel.innerHTML = `
        <i class="fas fa-heart"></i>
        <strong>Thank You!</strong>
        <br>
        <strong>Feedback: ${selectedRating}</strong>
        <p>We'll use your feedback to improve our customer support</p>
    `
})

function removeActive() {
    for (let i = 0; i < ratings.length; i++) {
        ratings[i].classList.remove('active')
    }
}
const routesData = typeof window.getCatalogPopularRoutes === "function"
    ? window.getCatalogPopularRoutes(16).map((route) => ({
        from: route.fromCity || route.from,
        to: route.toCity || route.to,
        image: route.image || (typeof window.getCatalogRouteImage === "function"
            ? window.getCatalogRouteImage(route.fromCity || route.from, route.toCity || route.to)
            : "https://images.unsplash.com/photo-1593693397690-362cb9666fc2")
    }))
    : [
    {
        from: "Bangalore",
        to: "Hyderabad",
        image: "https://images.unsplash.com/photo-1593693397690-362cb9666fc2"
    },
    {
        from: "Bangalore",
        to: "Chennai",
        image: "https://images.unsplash.com/photo-1589394815804-964ed0be2eb5"
    },
    {
        from: "Bangalore",
        to: "Tirupati",
        image: "https://images.unsplash.com/photo-1589394815804-964ed0be2eb5"
    },
    {
        from: "Hyderabad",
        to: "Vijayawada",
        image: "https://images.unsplash.com/photo-1625225233840-695456021cde"
    },
    {
        from: "Hyderabad",
        to: "Visakhapatnam",
        image: "https://images.unsplash.com/photo-1593693397690-362cb9666fc2"
    },
    {
        from: "Hyderabad",
        to: "Tirupati",
        image: "https://images.unsplash.com/photo-1593693397690-362cb9666fc2"
    },
    {
        from: "Chennai",
        to: "Madurai",
        image: "https://images.unsplash.com/photo-1593693397690-362cb9666fc2"
    },
    {
        from: "Delhi",
        to: "Lucknow",
        image: "https://images.unsplash.com/photo-1587474260584-136574528ed5"
    },
    {
        from: "Hyderabad",
        to: "Visakhapatnam",
        image: "https://images.unsplash.com/photo-1593693397690-362cb9666fc2"
    },
    {
        from: "Hyderabad",
        to: "Tirupati",
        image: "https://images.unsplash.com/photo-1593693397690-362cb9666fc2"
    },
];
const POPULAR_ROUTES_API_BASES = window.YUBUS_API?.getBases?.() || [
    "http://localhost:8081",
    "http://127.0.0.1:8081",
    "http://localhost:8080",
    "http://127.0.0.1:8080"
];
const routeImageByKey = Object.fromEntries(
    routesData.map((route) => [`${route.from}-${route.to}`, route.image])
);

const routesContainer = document.getElementById("routes");
const popularRouteDateInput = document.getElementById("popularRouteDate");

function buildApiUrl(path, base) {
    if (window.YUBUS_API?.buildUrl) {
        return window.YUBUS_API.buildUrl(path, base);
    }

    return `${base}${path}`;
}

function getTodayDateString() {
    return new Date().toISOString().split("T")[0];
}

function initializePopularRouteDate() {
    if (!popularRouteDateInput) {
        return;
    }

    const homepageDateInput = document.getElementById("date");
    const fallbackDate = homepageDateInput?.value || getTodayDateString();

    popularRouteDateInput.min = getTodayDateString();
    popularRouteDateInput.value = fallbackDate;
}

function getPopularRouteDate() {
    if (popularRouteDateInput && popularRouteDateInput.value) {
        return popularRouteDateInput.value;
    }

    const homepageDateInput = document.getElementById("date");
    if (homepageDateInput && homepageDateInput.value) {
        return homepageDateInput.value;
    }

    return getTodayDateString();
}

function getRouteImage(from, to) {
    return routeImageByKey[`${from}-${to}`] || "https://images.unsplash.com/photo-1593693397690-362cb9666fc2";
}

function normalizeText(value) {
    return (value || "").trim();
}

function normalizeEmail(value) {
    return normalizeText(value).toLowerCase();
}

function profileMobile(value) {
    return normalizeText(value).replace(/\D/g, "").slice(-10);
}

function getLatestTrackBooking() {
    const history = JSON.parse(localStorage.getItem("bookingHistory") || "[]");
    const isAdmin = localStorage.getItem("adminLoggedIn") === "true";

    if (isAdmin) {
        return history.sort((a, b) => new Date(b.bookedAt || 0) - new Date(a.bookedAt || 0))[0] || null;
    }

    const email = normalizeEmail(localStorage.getItem("userEmail") || localStorage.getItem("userIdentity"));
    const mobile = profileMobile(localStorage.getItem("userMobile") || localStorage.getItem("mobile"));

    return history
        .filter((booking) => {
            const ownerEmail = normalizeEmail(booking?.ownerEmail);
            const ownerMobile = profileMobile(booking?.ownerMobile);

            if (email && ownerEmail) {
                return ownerEmail === email;
            }

            if (!email && mobile && ownerMobile) {
                return ownerMobile === mobile;
            }

            return false;
        })
        .sort((a, b) => new Date(b.bookedAt || 0) - new Date(a.bookedAt || 0))[0] || null;
}

function renderPopularRoutes(routes) {
    if (!routesContainer) {
        return;
    }

    routesContainer.innerHTML = "";

    routes.forEach((route) => {
        const from = route.from || route.fromCity;
        const to = route.to || route.toCity;
        const image = route.image || getRouteImage(from, to);

        const card = document.createElement("div");
        card.className = "route-card";

        card.innerHTML = `
            <div class="route-info">
                <img src="${image}" alt="${from} to ${to}">
                <div class="route-name">${from} &rarr; ${to}</div>
            </div>
            <button class="view-btn">View Buses</button>
        `;

        routesContainer.appendChild(card);

        const viewButton = card.querySelector(".view-btn");
        if (viewButton) {
            viewButton.addEventListener("click", () => {
                const query = new URLSearchParams({
                    from,
                    to,
                    date: getPopularRouteDate()
                });

                window.location.href = `result.html?${query.toString()}`;
            });
        }
    });
}

async function fetchPopularRoutes() {
    let lastError;

    for (const base of POPULAR_ROUTES_API_BASES) {
        try {
            const response = await fetch(buildApiUrl("/api/routes/popular", base));
            if (!response.ok) {
                throw new Error(`Failed to fetch popular routes from ${base}`);
            }

            const payload = await response.json();
            return Array.isArray(payload?.data) ? payload.data : [];
        } catch (error) {
            lastError = error;
        }
    }

    throw lastError || new Error("Failed to fetch popular routes");
}

async function loadPopularRoutes() {
    try {
        const routes = await fetchPopularRoutes();
        if (Array.isArray(routes) && routes.length > 0) {
            renderPopularRoutes(routes);
        }
    } catch (error) {
        console.warn("Unable to load popular routes from backend.", error);
    }
}

routesData.forEach(route => {
    const card = document.createElement("div");
    card.className = "route-card";

    card.innerHTML = `
        <div class="route-info">
            <img src="${route.image}" alt="${route.from} to ${route.to}">
            <div class="route-name">${route.from} → ${route.to}</div>
        </div>
        <button class="view-btn">View Buses</button>
    `;

    routesContainer.appendChild(card);

    const viewButton = card.querySelector(".view-btn");
    if (viewButton) {
        viewButton.addEventListener("click", () => {
            const query = new URLSearchParams({
                from: route.from,
                to: route.to,
                date: getPopularRouteDate()
            });

            window.location.href = `result.html?${query.toString()}`;
        });
    }
});

initializePopularRouteDate();
loadPopularRoutes();

const trackNowBtn = document.getElementById("trackNowBtn");
if (trackNowBtn) {
    trackNowBtn.addEventListener("click", () => {
        const fromValue = normalizeText(document.getElementById("from")?.value);
        const toValue = normalizeText(document.getElementById("to")?.value);
        const dateValue = normalizeText(document.getElementById("date")?.value) || getPopularRouteDate();
        const latestBooking = getLatestTrackBooking();

        const query = new URLSearchParams({
            from: fromValue || latestBooking?.from || "",
            to: toValue || latestBooking?.to || "",
            date: dateValue || latestBooking?.journeyDate || "",
            departureTime: latestBooking?.departureTime || "",
            busName: latestBooking?.busName || "",
            bookingId: latestBooking?.bookingId || ""
        });

        if (!query.get("from") || !query.get("to")) {
            alert("Enter source and destination or book a ticket first to open live route tracking.");
            return;
        }

        window.location.href = `track.html?${query.toString()}`;
    });
}


const button = document.getElementById("goBtn");
const loader = document.getElementById("loader");

if (button && loader) {
    button.addEventListener("click", () => {
        button.style.display = "none";
        loader.style.display = "block";

        setTimeout(() => {
            window.location.href = "index.html"; // change page name if needed
        }, 2000);
    });
}

function showBusTab(tabId) {

    let contents = document.querySelectorAll(".busroutes-content");
    let tabs = document.querySelectorAll(".busroutes-tab");

    contents.forEach(function(content) {
        content.classList.remove("active");
    });

    tabs.forEach(function(tab) {
        tab.classList.remove("active");
    });

    document.getElementById(tabId).classList.add("active");
    event.target.classList.add("active");
}

