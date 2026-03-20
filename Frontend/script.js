
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

tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
        tabs.forEach((item) => item.classList.remove("active"));
        tab.classList.add("active");
    });
});

const swapBtn = document.querySelector(".swap");
if (swapBtn) {
    swapBtn.addEventListener("click", swapCities);
}

const dayButtons = document.querySelectorAll(".day-btn");
const dateInput = document.querySelector("input[type='date']");

if (dayButtons.length >= 2 && dateInput) {
    dayButtons[0].addEventListener("click", () => {
        const today = new Date();
        dateInput.value = today.toISOString().split("T")[0];
    });

    dayButtons[1].addEventListener("click", () => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        dateInput.value = tomorrow.toISOString().split("T")[0];
    });
}




const searchBtn = document.getElementById("searchBtn");
if (searchBtn) {
    searchBtn.addEventListener("click", () => {

        const from = document.getElementById("from").value;
        const to = document.getElementById("to").value;
        const date = document.getElementById("date").value;

        if (!from || !to || !date) {
            alert("Fill all fields");
            return;
        }

        window.location.href =
            `result.html?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&date=${date}`;
    });
}


const fromCityInput = document.getElementById("from");
const toCityInput = document.getElementById("to");
const fromDropdown = document.getElementById("fromDropdown");
const toDropdown = document.getElementById("toDropdown");
const fromCityList = document.getElementById("fromCityList");
const toCityList = document.getElementById("toCityList");

const cityCatalog = window.CITY_CATALOG || {
    "Popular": ["Hyderabad", "Vijayawada", "Visakhapatnam", "Chennai", "Bengaluru", "Kochi", "Bhubaneswar"]
};
const cityStateOrder = Array.isArray(window.CITY_STATE_ORDER)
    ? window.CITY_STATE_ORDER
    : Object.keys(cityCatalog);
const cityEntries = cityStateOrder.flatMap((state) => {
    const cities = Array.isArray(cityCatalog[state]) ? cityCatalog[state] : [];
    return cities.map((city) => ({ city, state }));
});

function toggleDropdown(dropdown, shouldShow) {
    if (!dropdown) {
        return;
    }
    dropdown.style.display = shouldShow ? "block" : "none";
}

function selectCity(inputId, city) {
    const input = document.getElementById(inputId);
    if (input) {
        input.value = city;
    }
    toggleDropdown(fromDropdown, false);
    toggleDropdown(toDropdown, false);
}

function normalizeCitySearch(value) {
    return String(value || "").trim().toLowerCase();
}

function createCityItem(inputId, city, state) {
    const item = document.createElement("div");
    item.className = "city-item";

    const strong = document.createElement("strong");
    strong.textContent = city;

    const span = document.createElement("span");
    span.textContent = state;

    item.appendChild(strong);
    item.appendChild(span);
    item.addEventListener("click", () => selectCity(inputId, city));

    return item;
}

function buildCityDropdown(listEl, inputId, query = "") {
    if (!listEl) {
        return;
    }
    listEl.innerHTML = "";
    const normalizedQuery = normalizeCitySearch(query);

    if (normalizedQuery) {
        const matchingCities = cityEntries
            .filter(({ city, state }) => {
                const cityValue = normalizeCitySearch(city);
                const stateValue = normalizeCitySearch(state);
                return cityValue.includes(normalizedQuery) || stateValue.includes(normalizedQuery);
            })
            .sort((left, right) => {
                const leftStarts = normalizeCitySearch(left.city).startsWith(normalizedQuery) ? 0 : 1;
                const rightStarts = normalizeCitySearch(right.city).startsWith(normalizedQuery) ? 0 : 1;
                if (leftStarts !== rightStarts) {
                    return leftStarts - rightStarts;
                }

                return left.city.localeCompare(right.city);
            });

        const matchTitle = document.createElement("p");
        matchTitle.className = "dropdown-title";
        matchTitle.textContent = "MATCHING CITIES";
        listEl.appendChild(matchTitle);

        if (!matchingCities.length) {
            const emptyState = document.createElement("div");
            emptyState.className = "city-empty-state";
            emptyState.textContent = "No matching cities found.";
            listEl.appendChild(emptyState);
            return;
        }

        matchingCities.forEach(({ city, state }) => {
            listEl.appendChild(createCityItem(inputId, city, state));
        });
        return;
    }

    cityStateOrder.forEach((state) => {
        const cities = cityCatalog[state];
        if (!Array.isArray(cities) || cities.length === 0) {
            return;
        }

        const stateTitle = document.createElement("p");
        stateTitle.className = "dropdown-title";
        stateTitle.textContent = state;
        listEl.appendChild(stateTitle);

        cities.forEach((city) => {
            listEl.appendChild(createCityItem(inputId, city, state));
        });
    });
}

buildCityDropdown(fromCityList, "from");
buildCityDropdown(toCityList, "to");

function bindCitySearch(input, dropdown, listEl, inputId, otherDropdown) {
    if (!input) {
        return;
    }

    input.addEventListener("focus", () => {
        buildCityDropdown(listEl, inputId, input.value);
        toggleDropdown(dropdown, true);
        toggleDropdown(otherDropdown, false);
    });

    input.addEventListener("click", () => {
        buildCityDropdown(listEl, inputId, input.value);
        toggleDropdown(dropdown, true);
        toggleDropdown(otherDropdown, false);
    });

    input.addEventListener("input", () => {
        buildCityDropdown(listEl, inputId, input.value);
        toggleDropdown(dropdown, true);
        toggleDropdown(otherDropdown, false);
    });
}

bindCitySearch(fromCityInput, fromDropdown, fromCityList, "from", toDropdown);
bindCitySearch(toCityInput, toDropdown, toCityList, "to", fromDropdown);

document.addEventListener("click", (event) => {
    if (!event.target.closest(".city-field")) {
        toggleDropdown(fromDropdown, false);
        toggleDropdown(toDropdown, false);
    }
});

function swapCities() {
    const fromField = document.getElementById("from");
    const toField = document.getElementById("to");
    if (!fromField || !toField) {
        return;
    }
    const temp = fromField.value;
    fromField.value = toField.value;
    toField.value = temp;
}


const ADMIN_FEATURES_KEY = "adminFeatureModules";
const DEFAULT_OFFERS_SUBTITLE = "Fresh fare drops, cashback coupons, and festive specials curated for every route.";
const OFFERS_UNAVAILABLE_SUBTITLE = "Offers are not available now.";
const slider = document.getElementById("offerSlider");
const offersCard = document.getElementById("offers");
const imageOffers = document.getElementById("imageOffers");
const textOffers = document.getElementById("textOffers");
const offersToggleBtn = document.querySelector(".view-all-btn");
const offersSubtitle = document.getElementById("offersSubtitle");
const offersStatValue = document.getElementById("offersStatValue");
const offersStatLabel = document.getElementById("offersStatLabel");
const offersFooter = document.getElementById("offersFooter");
const offersUnavailableState = document.getElementById("offersUnavailableState");

function getAdminFeatureModules() {
    try {
        const parsedModules = JSON.parse(localStorage.getItem(ADMIN_FEATURES_KEY) || "[]");
        return Array.isArray(parsedModules) ? parsedModules : [];
    } catch (error) {
        return [];
    }
}

function isOfferEngineActive() {
    const adminModules = getAdminFeatureModules();

    if (adminModules.length === 0) {
        return true;
    }

    const offerModule = adminModules.find((module) => module?.id === "offers");
    return typeof offerModule?.active === "boolean" ? offerModule.active : true;
}

function setOfferBlockState(element, shouldShow, displayValue) {
    if (!element) {
        return;
    }

    element.hidden = !shouldShow;
    element.style.display = shouldShow ? displayValue : "none";
}

function applyOffersAvailability() {
    const offerEngineActive = isOfferEngineActive();

    if (offersCard) {
        offersCard.classList.toggle("offers-paused", !offerEngineActive);
    }

    if (!offerEngineActive) {
        isViewAll = false;

        if (slider) {
            slider.classList.remove("view-all");
        }

        setOfferBlockState(imageOffers, false, "block");
        setOfferBlockState(textOffers, false, "block");
        setOfferBlockState(offersFooter, false, "flex");
        setOfferBlockState(offersToggleBtn, false, "inline-flex");
        setOfferBlockState(offersUnavailableState, true, "block");

        if (offersSubtitle) {
            offersSubtitle.textContent = OFFERS_UNAVAILABLE_SUBTITLE;
        }

        if (offersStatValue) {
            offersStatValue.textContent = "0";
        }

        if (offersStatLabel) {
            offersStatLabel.textContent = "offers paused";
        }

        return;
    }

    setOfferBlockState(offersToggleBtn, true, "inline-flex");
    setOfferBlockState(offersFooter, true, "flex");
    setOfferBlockState(offersUnavailableState, false, "block");

    if (offersSubtitle) {
        offersSubtitle.textContent = DEFAULT_OFFERS_SUBTITLE;
    }

    if (offersStatValue) {
        offersStatValue.textContent = "10+";
    }

    if (offersStatLabel) {
        offersStatLabel.textContent = "live offers";
    }

    if (isViewAll) {
        setOfferBlockState(imageOffers, false, "block");
        setOfferBlockState(textOffers, true, "block");
        if (offersToggleBtn) {
            offersToggleBtn.innerText = "Show Less";
        }
        return;
    }

    setOfferBlockState(imageOffers, true, "block");
    setOfferBlockState(textOffers, false, "block");
    if (offersToggleBtn) {
        offersToggleBtn.innerText = "View All";
    }
}

function slideLeft() {
    if (!slider) {
        return;
    }
    slider.scrollLeft -= 300;
}

function slideRight() {
    if (!slider) {
        return;
    }
    slider.scrollLeft += 300;
}

let isViewAll = false;

function toggleViewAll() {
    if (!isOfferEngineActive()) {
        applyOffersAvailability();
        return;
    }

    isViewAll = !isViewAll;

    if (!imageOffers || !textOffers || !offersToggleBtn) {
        return;
    }

    if (isViewAll) {
        imageOffers.style.display = "none";
        textOffers.style.display = "block";
        offersToggleBtn.innerText = "Show Less";
    } else {
        imageOffers.style.display = "block";
        textOffers.style.display = "none";
        offersToggleBtn.innerText = "View All";
    }
}

applyOffersAvailability();

window.addEventListener("focus", applyOffersAvailability);
window.addEventListener("storage", (event) => {
    if (!event.key || event.key === ADMIN_FEATURES_KEY) {
        applyOffersAvailability();
    }
});



let isDragging = false;
let startX;
let scrollLeftStart;

if (slider) {
    // Disable browser context menu on slider
    slider.addEventListener("contextmenu", (event) => event.preventDefault());

    // Right mouse button down
    slider.addEventListener("mousedown", (event) => {
        if (event.button !== 2) return; // RIGHT CLICK ONLY

        isDragging = true;
        slider.classList.add("dragging");
        startX = event.pageX;
        scrollLeftStart = slider.scrollLeft;
    });

    // Mouse move
    document.addEventListener("mousemove", (event) => {
        if (!isDragging) return;

        const x = event.pageX;
        const walk = (startX - x);
        slider.scrollLeft = scrollLeftStart + walk;
    });

    // Mouse up
    document.addEventListener("mouseup", () => {
        isDragging = false;
        slider.classList.remove("dragging");
    });
}


const LIVE_REVIEWS_STORAGE_KEY = "yubusLiveReviews";
const liveReviewMarquee = document.getElementById("liveReviewMarquee");
const liveReviewTrack = document.getElementById("liveReviewTrack");
const openQuickReviewButton = document.getElementById("openQuickReview");
const quickReviewModal = document.getElementById("quickReviewModal");
const quickReviewForm = document.getElementById("quickReviewForm");
const quickReviewStatus = document.getElementById("quickReviewStatus");
const quickReviewTypeButtons = Array.from(document.querySelectorAll(".quick-review-type"));
let liveReviewScrollTimer = null;
let selectedQuickReviewType = quickReviewTypeButtons[0] || null;
const defaultLiveReviews = [
    {
        author: "Ananya R.",
        route: "Hyderabad -> Vijayawada",
        tag: "On-time boarding",
        text: "Boarding was smooth, the bus left on time, and the ticket details were easy to access on my phone.",
        rating: 5,
        createdAt: new Date(Date.now() - 2 * 60 * 1000).toISOString()
    },
    {
        author: "Karthik S.",
        route: "Chennai -> Bengaluru",
        tag: "Clean bus",
        text: "Seat quality was good, the bus was clean, and I liked how quickly I could compare timings before booking.",
        rating: 5,
        createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString()
    },
    {
        author: "Meera P.",
        route: "Visakhapatnam -> Hyderabad",
        tag: "Helpful support",
        text: "Live trip updates helped me reach the boarding point early, and support answered my route question without delay.",
        rating: 5,
        createdAt: new Date(Date.now() - 8 * 60 * 1000).toISOString()
    }
];

function escapeReviewHtml(value) {
    return String(value || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function getReviewStars(rating) {
    const safeRating = Math.min(5, Math.max(1, Number(rating || 5)));
    return `${"&#9733;".repeat(safeRating)}${"&#9734;".repeat(5 - safeRating)}`;
}

function formatReviewTime(createdAt) {
    const timestamp = new Date(createdAt).getTime();
    if (Number.isNaN(timestamp)) {
        return "Recently";
    }

    const minutes = Math.max(0, Math.round((Date.now() - timestamp) / 60000));
    if (minutes < 1) {
        return "Just now";
    }

    if (minutes < 60) {
        return `${minutes} min ago`;
    }

    const hours = Math.round(minutes / 60);
    if (hours < 24) {
        return `${hours} hr ago`;
    }

    const days = Math.round(hours / 24);
    return `${days} day${days === 1 ? "" : "s"} ago`;
}

function getStoredLiveReviews() {
    try {
        const parsed = JSON.parse(localStorage.getItem(LIVE_REVIEWS_STORAGE_KEY) || "[]");
        if (!Array.isArray(parsed)) {
            return [];
        }

        return parsed
            .filter((review) => review?.author && review?.text)
            .map((review) => ({
                author: String(review.author || "").trim(),
                route: String(review.route || "Passenger route").trim(),
                tag: String(review.tag || "Recent review").trim(),
                text: String(review.text || "").trim(),
                rating: Math.min(5, Math.max(1, Number(review.rating || 5))),
                createdAt: review.createdAt || new Date().toISOString()
            }));
    } catch (error) {
        return [];
    }
}

function buildLiveReviewItem(review, duplicate = false) {
    return `
        <article class="live-review-item"${duplicate ? ' aria-hidden="true"' : ""}>
            <div class="live-review-item-top">
                <strong class="live-review-author"><i class="fa-solid fa-circle-user" aria-hidden="true"></i>${escapeReviewHtml(review.author)}</strong>
                <span>${escapeReviewHtml(formatReviewTime(review.createdAt))}</span>
            </div>
            <div class="live-review-item-route">${escapeReviewHtml(review.route)}</div>
            <div class="live-review-stars" aria-label="Passenger rating">${getReviewStars(review.rating)}</div>
            <p>${escapeReviewHtml(review.text)}</p>
            <span class="live-review-tag">${escapeReviewHtml(review.tag)}</span>
        </article>
    `;
}

function renderLiveReviewFeed() {
    if (!liveReviewTrack) {
        return;
    }

    const sourceReviews = [...getStoredLiveReviews(), ...defaultLiveReviews].slice(0, 6);
    const reviews = sourceReviews.length ? sourceReviews : defaultLiveReviews;
    const duplicatedReviews = [...reviews, ...reviews];

    liveReviewTrack.innerHTML = duplicatedReviews
        .map((review, index) => buildLiveReviewItem(review, index >= reviews.length))
        .join("");

    if (liveReviewMarquee) {
        liveReviewMarquee.scrollLeft = 0;
    }
}

function startLiveReviewScroll() {
    if (!liveReviewMarquee || !liveReviewTrack) {
        return;
    }

    const resetPoint = liveReviewTrack.scrollWidth / 2;
    if (!resetPoint) {
        return;
    }

    if (liveReviewScrollTimer) {
        window.clearInterval(liveReviewScrollTimer);
    }

    liveReviewScrollTimer = window.setInterval(() => {
        if (liveReviewMarquee.scrollLeft >= resetPoint) {
            liveReviewMarquee.scrollLeft = 0;
            return;
        }

        liveReviewMarquee.scrollLeft += 1;
    }, 32);
}

function refreshLiveReviewFeed() {
    renderLiveReviewFeed();
    startLiveReviewScroll();
}

function setQuickReviewStatus(message, tone = "") {
    if (!quickReviewStatus) {
        return;
    }

    quickReviewStatus.textContent = message;
    quickReviewStatus.classList.remove("error");
    if (tone) {
        quickReviewStatus.classList.add(tone);
    }
}

function openQuickReviewModal() {
    if (!quickReviewModal) {
        return;
    }

    quickReviewModal.hidden = false;
    quickReviewModal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    setQuickReviewStatus("");
}

function closeQuickReviewModal() {
    if (!quickReviewModal) {
        return;
    }

    quickReviewModal.hidden = true;
    quickReviewModal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    setQuickReviewStatus("");
}

function selectQuickReviewType(nextButton) {
    if (!nextButton) {
        return;
    }

    selectedQuickReviewType = nextButton;
    quickReviewTypeButtons.forEach((button) => {
        button.classList.toggle("active", button === nextButton);
    });
}

function saveQuickReview(event) {
    event.preventDefault();

    const selectedType = selectedQuickReviewType || quickReviewTypeButtons[0];
    const author = String(localStorage.getItem("userName") || localStorage.getItem("userIdentity") || "Passenger").trim();
    const from = String(document.getElementById("from")?.value || "").trim();
    const to = String(document.getElementById("to")?.value || "").trim();
    const route = from && to ? `${from} -> ${to}` : "General Yubus Experience";

    if (!selectedType) {
        setQuickReviewStatus("Pick a quick review type before posting.", "error");
        return;
    }

    const nextReview = {
        author,
        route,
        tag: selectedType.dataset.tag || "Quick Review",
        text: selectedType.dataset.text || "Quick trip feedback shared from the homepage.",
        rating: Number(selectedType.dataset.rating || "5"),
        createdAt: new Date().toISOString()
    };

    const storedReviews = getStoredLiveReviews();
    localStorage.setItem(LIVE_REVIEWS_STORAGE_KEY, JSON.stringify([nextReview, ...storedReviews].slice(0, 20)));
    setQuickReviewStatus("Quick review posted to the live feed.");
    refreshLiveReviewFeed();

    window.setTimeout(() => {
        quickReviewForm?.reset();
        if (quickReviewTypeButtons.length) {
            selectQuickReviewType(quickReviewTypeButtons[0]);
        }
        closeQuickReviewModal();
    }, 700);
}

if (liveReviewMarquee && liveReviewTrack) {
    refreshLiveReviewFeed();
    liveReviewMarquee.addEventListener("mouseenter", () => {
        if (liveReviewScrollTimer) {
            window.clearInterval(liveReviewScrollTimer);
            liveReviewScrollTimer = null;
        }
    });

    liveReviewMarquee.addEventListener("mouseleave", () => {
        startLiveReviewScroll();
    });

    window.addEventListener("focus", refreshLiveReviewFeed);
    window.addEventListener("storage", (event) => {
        if (!event.key || event.key === LIVE_REVIEWS_STORAGE_KEY) {
            refreshLiveReviewFeed();
        }
    });
}

if (openQuickReviewButton) {
    openQuickReviewButton.addEventListener("click", openQuickReviewModal);
}

quickReviewTypeButtons.forEach((button) => {
    button.addEventListener("click", () => selectQuickReviewType(button));
});

if (quickReviewForm) {
    quickReviewForm.addEventListener("submit", saveQuickReview);
}

if (quickReviewModal) {
    quickReviewModal.addEventListener("click", (event) => {
        if (event.target instanceof HTMLElement && event.target.closest("[data-quick-review-close]")) {
            closeQuickReviewModal();
        }
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && quickReviewModal.hidden === false) {
            closeQuickReviewModal();
        }
    });
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
    "http://localhost:8000",
    "http://127.0.0.1:8000"
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
    if (typeof window.getCatalogRouteImage === "function") {
        const resolvedImage = window.getCatalogRouteImage(from, to);
        if (resolvedImage) {
            return resolvedImage;
        }
    }

    return routeImageByKey[`${from}-${to}`] || "https://images.unsplash.com/photo-1597047084897-51e81819a499";
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
        const image = getRouteImage(from, to) || route.image || "https://images.unsplash.com/photo-1597047084897-51e81819a499";

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

if (routesContainer) {
    renderPopularRoutes(routesData);
}
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

function showBusTab(tabButton) {
    const tabId = typeof tabButton === "string" ? tabButton : tabButton?.dataset?.tab;
    if (!tabId) {
        return;
    }

    let contents = document.querySelectorAll(".busroutes-content");
    let tabs = document.querySelectorAll(".busroutes-tab");

    contents.forEach(function(content) {
        content.classList.remove("active");
    });

    tabs.forEach(function(tab) {
        tab.classList.remove("active");
    });

    const activeTab = document.getElementById(tabId);
    if (activeTab) {
        activeTab.classList.add("active");
    }

    const activeButton = typeof tabButton === "string"
        ? document.querySelector(`.busroutes-tab[data-tab="${tabId}"]`)
        : tabButton;
    if (activeButton) {
        activeButton.classList.add("active");
    }
}


