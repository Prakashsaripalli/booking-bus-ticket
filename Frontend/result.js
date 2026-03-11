console.log("Result page loaded");

const API_BASES = window.YUBUS_API?.getBases?.() || [
    "http://localhost:8081",
    "http://127.0.0.1:8081",
    "http://localhost:8080",
    "http://127.0.0.1:8080"
];
const FALLBACK_BUSES = Array.isArray(window.BUS_CATALOG) && window.BUS_CATALOG.length > 0
    ? window.BUS_CATALOG
    : [
        { id: 1, name: "Yubus Express", fromCity: "Hyderabad", toCity: "Vijayawada", departureTime: "10:00 PM", price: 899 },
        { id: 2, name: "Yubus Deluxe", fromCity: "Hyderabad", toCity: "Vijayawada", departureTime: "08:30 PM", price: 699 },
        { id: 3, name: "Yubus Royal", fromCity: "Hyderabad", toCity: "Bangalore", departureTime: "09:00 PM", price: 1299 }
    ];

const params = new URLSearchParams(window.location.search);
const from = params.get("from")?.trim();
const to = params.get("to")?.trim();
const date = params.get("date");

const resultsDiv = document.getElementById("results");
const routeFromDisplay = document.getElementById("routeFrom");
const routeToDisplay = document.getElementById("routeTo");
const routeDateDisplay = document.getElementById("routeDate");
const routeCountDisplay = document.getElementById("routeCount");
const routeSubtitle = document.getElementById("routeSubtitle");
const resultsStatus = document.getElementById("resultsStatus");
const routeVisual = document.getElementById("routeVisual");

function buildApiUrl(path, base) {
    if (window.YUBUS_API?.buildUrl) {
        return window.YUBUS_API.buildUrl(path, base);
    }

    return `${base}${path}`;
}

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function formatDateLabel(value) {
    if (!value) {
        return "Flexible";
    }

    const parsed = new Date(`${value}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) {
        return value;
    }

    return parsed.toLocaleDateString("en-IN", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric"
    });
}

function getRouteImage(fromCity, toCity) {
    if (typeof window.getCatalogRouteImage === "function") {
        return window.getCatalogRouteImage(fromCity, toCity);
    }

    return "";
}

function normalizeBusRecord(bus) {
    if (typeof window.normalizeCatalogBus === "function") {
        return window.normalizeCatalogBus(bus);
    }

    return {
        ...bus,
        busType: bus?.busType || "Standard"
    };
}

function getTypeTags(busType) {
    const normalizedType = (busType || "Standard").toLowerCase();
    const tags = [busType || "Standard"];

    if (normalizedType.includes("ac")) {
        tags.push("AC coach");
    } else {
        tags.push("Non-AC");
    }

    if (normalizedType.includes("sleeper")) {
        tags.push("Berth layout");
    } else if (normalizedType.includes("seater")) {
        tags.push("Seat layout");
    } else if (normalizedType.includes("volvo")) {
        tags.push("Premium coach");
    }

    return tags.slice(0, 3);
}

function setStatus(message, variant) {
    if (!resultsStatus) {
        return;
    }

    resultsStatus.textContent = message;
    resultsStatus.className = "results-status";

    if (variant) {
        resultsStatus.classList.add(variant);
    }
}

function setPageMeta(count) {
    if (routeFromDisplay) {
        routeFromDisplay.textContent = from || "From";
    }

    if (routeToDisplay) {
        routeToDisplay.textContent = to || "To";
    }

    if (routeDateDisplay) {
        routeDateDisplay.textContent = formatDateLabel(date);
    }

    if (routeCountDisplay) {
        routeCountDisplay.textContent = String(count ?? 0);
    }

    if (routeSubtitle) {
        routeSubtitle.textContent = from && to
            ? `Browse buses for ${from} to ${to} and move to seat selection in one step.`
            : "Select a route first, then continue to booking.";
    }

    if (routeVisual) {
        const image = from && to ? getRouteImage(from, to) : "";
        if (image) {
            routeVisual.style.backgroundImage = `linear-gradient(180deg, rgba(10, 18, 36, 0.08), rgba(10, 18, 36, 0.28)), url('${image}')`;
        }
    }
}

function renderEmptyState(title, description) {
    resultsDiv.innerHTML = `
        <div class="empty-state">
            <h3>${escapeHtml(title)}</h3>
            <p>${escapeHtml(description)}</p>
        </div>
    `;
}

function getLocalRouteBuses() {
    if (typeof window.getCatalogBusesByRoute === "function") {
        return window.getCatalogBusesByRoute(from, to);
    }

    return FALLBACK_BUSES.filter((bus) =>
        bus.fromCity.toLowerCase() === from.toLowerCase() &&
        bus.toCity.toLowerCase() === to.toLowerCase()
    );
}

function renderBuses(buses) {
    const normalizedBuses = buses.map(normalizeBusRecord);
    resultsDiv.innerHTML = "";
    setPageMeta(normalizedBuses.length);
    setStatus(`${normalizedBuses.length} buses ready`, normalizedBuses.length > 0 ? "" : "empty");

    normalizedBuses.forEach((bus) => {
        const tags = getTypeTags(bus.busType);
        const safeName = escapeHtml(bus.name);
        const safeFrom = escapeHtml(bus.fromCity);
        const safeTo = escapeHtml(bus.toCity);
        const safeDeparture = escapeHtml(bus.departureTime || "-");
        const safeType = escapeHtml(bus.busType || "Standard");

        resultsDiv.innerHTML += `
            <div class="bus-card">
                <div class="bus-brand">
                    <div class="bus-brand-top">
                        <h3 class="bus-name">${safeName}</h3>
                        <span class="bus-badge">${safeType}</span>
                    </div>
                    <div class="bus-subline">
                        ${safeFrom} to ${safeTo} | Journey ${escapeHtml(formatDateLabel(date))}
                    </div>
                    <div class="bus-tags">
                        ${tags.map((tag) => `<span class="bus-tag">${escapeHtml(tag)}</span>`).join("")}
                    </div>
                </div>

                <div class="bus-schedule">
                    <div class="schedule-row">
                        <span class="schedule-label">Departure</span>
                        <span class="schedule-value">${safeDeparture}</span>
                    </div>
                    <div class="schedule-route">
                        <span>${safeFrom}</span>
                        <span class="route-line"></span>
                        <span>${safeTo}</span>
                    </div>
                </div>

                <div class="bus-price-box">
                    <div class="price-copy">
                        <span class="price-label">Starting fare</span>
                        <p class="price">&#8377;${bus.price}</p>
                        <p class="price-note">Seat selection available</p>
                    </div>
                    <button class="book-btn"
                        data-id="${bus.id}"
                        data-name="${encodeURIComponent(bus.name)}"
                        data-from="${encodeURIComponent(bus.fromCity)}"
                        data-to="${encodeURIComponent(bus.toCity)}"
                        data-price="${bus.price}"
                        data-bus-type="${encodeURIComponent(bus.busType || "Standard")}"
                        data-departure="${encodeURIComponent(bus.departureTime)}">
                        Book Now
                    </button>
                </div>
            </div>
        `;
    });

    document.querySelectorAll(".book-btn").forEach((button) => {
        button.addEventListener("click", function () {
            const query = new URLSearchParams({
                busId: this.dataset.id,
                name: decodeURIComponent(this.dataset.name),
                from: decodeURIComponent(this.dataset.from),
                to: decodeURIComponent(this.dataset.to),
                price: this.dataset.price,
                busType: decodeURIComponent(this.dataset.busType || "Standard"),
                date: date || "",
                departureTime: decodeURIComponent(this.dataset.departure || "")
            });

            window.location.href = `booking.html?layoutRev=20260307-seatlayout-v28&${query.toString()}`;
        });
    });
}

async function fetchBuses() {
    let lastError;

    for (const base of API_BASES) {
        try {
            const response = await fetch(
                `${buildApiUrl("/api/buses/search", base)}?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
            );
            if (!response.ok) {
                throw new Error(`Failed to fetch buses from ${base}`);
            }
            return await response.json();
        } catch (error) {
            lastError = error;
        }
    }

    throw lastError || new Error("Failed to fetch buses");
}

if (!from || !to) {
    setPageMeta(0);
    setStatus("Route details missing", "error");
    renderEmptyState("Invalid search data", "Go back and choose a valid from and to route.");
} else {
    setPageMeta(0);
    setStatus("Loading buses...", "");

    fetchBuses()
        .then((payload) => {
            const apiBuses = Array.isArray(payload) ? payload : (Array.isArray(payload?.data) ? payload.data : []);
            const buses = apiBuses.length > 0 ? apiBuses : getLocalRouteBuses();

            if (buses.length === 0) {
                setPageMeta(0);
                setStatus("No buses found", "empty");
                renderEmptyState("No buses available", "Try another date or search a different route.");
                return;
            }

            renderBuses(buses);
        })
        .catch(() => {
            const fallback = getLocalRouteBuses();

            if (fallback.length === 0) {
                setPageMeta(0);
                setStatus("Unable to load buses", "error");
                renderEmptyState("Buses could not be loaded", "The server is unavailable and there are no local buses for this route.");
                return;
            }

            setStatus(`Showing ${fallback.length} local buses`, "");
            renderBuses(fallback);
        });
}
