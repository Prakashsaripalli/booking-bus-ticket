console.log("Result page loaded");

const API_BASES = window.YUBUS_API?.getBases?.() || [
    "http://localhost:8000",
    "http://127.0.0.1:8000"
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
const ROUTE_CORRIDORS = [
    ["Visakhapatnam", "Anakapalle", "Tuni", "Samalkot", "Jaggampeta", "Rajahmundry", "Kovvur", "Eluru", "Vijayawada", "Nandigama", "Kodad", "Suryapet", "Hyderabad"],
    ["Hyderabad", "Vijayawada", "Guntur", "Ongole", "Nellore", "Chennai"],
    ["Hyderabad", "Kurnool", "Anantapur", "Bengaluru", "Mysuru"],
    ["Hyderabad", "Kurnool", "Anantapur", "Dharmavaram", "Kadiri", "Chittoor", "Tirupati"],
    ["Chennai", "Vellore", "Krishnagiri", "Hosur", "Bengaluru"],
    ["Bengaluru", "Tumakuru", "Chitradurga", "Davanagere", "Hubballi", "Belagavi"],
    ["Bengaluru", "Hassan", "Sakleshpur", "Mangaluru"],
    ["Chennai", "Salem", "Erode", "Coimbatore", "Palakkad", "Thrissur", "Kochi"],
    ["Kochi", "Kottayam", "Pathanamthitta", "Thiruvananthapuram"],
    ["Bhubaneswar", "Cuttack", "Kendrapara", "Jagatsinghpur", "Brahmapur", "Visakhapatnam"],
    ["Hyderabad", "Warangal", "Khammam", "Vijayawada"],
    ["Vijayawada", "Tenali", "Guntur", "Narasaraopet", "Sattenapalli", "Markapur", "Kurnool"],
    ["Vijayawada", "Machilipatnam"],
    ["Rajahmundry", "Kakinada", "Amalapuram"],
    ["Hyderabad", "Karimnagar", "Nizamabad", "Adilabad"],
    ["Hyderabad", "Mahabubnagar", "Kurnool"],
    ["Nellore", "Gudur", "Naidupeta", "Tirupati"]
];

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

function normalizeCityKey(value) {
    return String(value || "").trim().toLowerCase();
}

function normalizeDate(value) {
    return (value || "").trim();
}

function normalizeSeatToken(value) {
    return String(value || "").trim().toUpperCase();
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

function toMinutes(timeStr) {
    const timeText = String(timeStr || "").trim().toUpperCase();
    const matched = timeText.match(/^(\d{1,2}):(\d{2})\s?(AM|PM)$/);
    if (!matched) {
        return null;
    }

    let hours = Number(matched[1]);
    const minutes = Number(matched[2]);
    const period = matched[3];

    if (period === "PM" && hours !== 12) {
        hours += 12;
    } else if (period === "AM" && hours === 12) {
        hours = 0;
    }

    return (hours * 60) + minutes;
}

function fromMinutes(totalMinutes) {
    let safeMinutes = Number(totalMinutes || 0) % 1440;
    if (safeMinutes < 0) {
        safeMinutes += 1440;
    }

    let hours = Math.floor(safeMinutes / 60);
    const minutes = safeMinutes % 60;
    const period = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;

    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")} ${period}`;
}

function estimateTravelMinutes(bus) {
    if (bus?.arrivalTime) {
        const departure = toMinutes(bus.departureTime);
        const arrival = toMinutes(bus.arrivalTime);
        if (departure !== null && arrival !== null) {
            const delta = (arrival - departure + 1440) % 1440;
            if (delta > 0) {
                return delta;
            }
        }
    }

    if (typeof window.getCatalogRouteDistanceKm === "function") {
        const distanceKm = Number(window.getCatalogRouteDistanceKm(bus?.fromCity, bus?.toCity));
        if (Number.isFinite(distanceKm) && distanceKm > 0) {
            return Math.max(70, Math.round((distanceKm / 52) * 60));
        }
    }

    return 240;
}

function getTemplateRouteStops(fromCity, toCity) {
    const sourceKey = normalizeCityKey(fromCity);
    const destinationKey = normalizeCityKey(toCity);

    for (const corridor of ROUTE_CORRIDORS) {
        const sourceIndex = corridor.findIndex((city) => normalizeCityKey(city) === sourceKey);
        const destinationIndex = corridor.findIndex((city) => normalizeCityKey(city) === destinationKey);

        if (sourceIndex < 0 || destinationIndex < 0 || sourceIndex === destinationIndex) {
            continue;
        }

        if (sourceIndex < destinationIndex) {
            return corridor.slice(sourceIndex, destinationIndex + 1);
        }

        return corridor.slice(destinationIndex, sourceIndex + 1).reverse();
    }

    return [fromCity, toCity].filter(Boolean);
}

function resolveRouteStops(bus) {
    const providedStops = Array.isArray(bus?.routeStops)
        ? bus.routeStops.map((stop) => String(stop || "").trim()).filter(Boolean)
        : [];

    if (providedStops.length >= 2) {
        return providedStops;
    }

    return getTemplateRouteStops(bus?.fromCity, bus?.toCity);
}

function buildStopTimeline(bus, routeStops) {
    const normalizedTimeline = bus?.stopTimeline && typeof bus.stopTimeline === "object"
        ? bus.stopTimeline
        : null;

    if (normalizedTimeline) {
        const hasAllStops = routeStops.every((stop) => String(normalizedTimeline[stop] || "").trim());
        if (hasAllStops) {
            return normalizedTimeline;
        }
    }

    const departureMinutes = toMinutes(bus?.departureTime);
    if (departureMinutes === null) {
        return {};
    }

    const totalMinutes = estimateTravelMinutes(bus);
    const segmentCount = Math.max(routeStops.length - 1, 1);
    const perSegment = totalMinutes / segmentCount;
    const timeline = {};

    routeStops.forEach((stop, index) => {
        timeline[stop] = fromMinutes(departureMinutes + Math.round(perSegment * index));
    });

    return timeline;
}

function projectBusForSearch(bus, sourceCity, destinationCity) {
    const routeStops = resolveRouteStops(bus);
    const sourceKey = normalizeCityKey(sourceCity);
    const destinationKey = normalizeCityKey(destinationCity);
    const sourceIndex = routeStops.findIndex((stop) => normalizeCityKey(stop) === sourceKey);
    const destinationIndex = routeStops.findIndex((stop) => normalizeCityKey(stop) === destinationKey);

    if (sourceIndex < 0 || destinationIndex < 0 || sourceIndex >= destinationIndex) {
        return null;
    }

    const stopTimeline = buildStopTimeline(bus, routeStops);
    const sourceStop = routeStops[sourceIndex];
    const destinationStop = routeStops[destinationIndex];

    return {
        ...bus,
        routeStops,
        stopTimeline,
        searchSource: sourceStop,
        searchDestination: destinationStop,
        matchedRouteStops: routeStops.slice(sourceIndex, destinationIndex + 1),
        departureFromSource: stopTimeline[sourceStop] || bus?.departureTime || "-",
        arrivalAtDestination: stopTimeline[destinationStop] || bus?.arrivalTime || "-"
    };
}

function getMatchingBusesByStopOrder(list, sourceCity, destinationCity) {
    return (Array.isArray(list) ? list : [])
        .map((bus) => projectBusForSearch(normalizeBusRecord(bus), sourceCity, destinationCity))
        .filter(Boolean);
}

function getBusSignature(bus) {
    return [
        String(bus?.id || "").trim(),
        String(bus?.name || "").trim().toLowerCase(),
        String(bus?.searchSource || bus?.fromCity || "").trim().toLowerCase(),
        String(bus?.searchDestination || bus?.toCity || "").trim().toLowerCase(),
        String(bus?.departureFromSource || bus?.departureTime || "").trim().toLowerCase()
    ].join("|");
}

function mergeBusLists(primaryBuses, secondaryBuses) {
    const merged = [];
    const seen = new Set();

    [primaryBuses, secondaryBuses].forEach((list) => {
        (Array.isArray(list) ? list : []).forEach((bus) => {
            const signature = getBusSignature(bus);
            if (!signature || seen.has(signature)) {
                return;
            }

            seen.add(signature);
            merged.push(bus);
        });
    });

    return merged;
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

function getBusCapacity(busType) {
    const normalizedType = (busType || "Standard").toLowerCase();

    if (normalizedType.includes("sleeper")) {
        return 36;
    }

    if (normalizedType.includes("seater")) {
        return 48;
    }

    return 40;
}

function getBookedSeatCount(bus) {
    let history = [];
    try {
        history = JSON.parse(localStorage.getItem("bookingHistory") || "[]");
    } catch (error) {
        history = [];
    }

    const bookedSeats = new Set();
    const matchFrom = String(bus?.searchSource || bus?.fromCity || "");
    const matchTo = String(bus?.searchDestination || bus?.toCity || "");

    history.forEach((booking) => {
        const sameBus = String(booking?.busName || "") === String(bus?.name || "");
        const sameFrom = String(booking?.from || "") === matchFrom;
        const sameTo = String(booking?.to || "") === matchTo;
        const sameDate = normalizeDate(booking?.journeyDate) === normalizeDate(date);
        const isActive = (booking?.status || "Booked") === "Booked";

        if (!sameBus || !sameFrom || !sameTo || !sameDate || !isActive) {
            return;
        }

        String(booking?.seats || "")
            .split(",")
            .map(normalizeSeatToken)
            .filter(Boolean)
            .forEach((seat) => bookedSeats.add(seat));
    });

    return bookedSeats.size;
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
    if (Array.isArray(window.BUS_CATALOG) && window.BUS_CATALOG.length > 0) {
        return getMatchingBusesByStopOrder(window.BUS_CATALOG, from, to);
    }

    return getMatchingBusesByStopOrder(FALLBACK_BUSES, from, to);
}

function renderBuses(buses) {
    const normalizedBuses = buses.map(normalizeBusRecord);
    resultsDiv.innerHTML = "";
    setPageMeta(normalizedBuses.length);
    setStatus(`${normalizedBuses.length} buses ready`, normalizedBuses.length > 0 ? "" : "empty");

    normalizedBuses.forEach((bus) => {
        const tags = getTypeTags(bus.busType);
        const totalSeats = getBusCapacity(bus.busType);
        const bookedSeats = getBookedSeatCount(bus);
        const availableSeats = Math.max(totalSeats - bookedSeats, 0);
        const displayFrom = String(bus.searchSource || from || bus.fromCity || "").trim();
        const displayTo = String(bus.searchDestination || to || bus.toCity || "").trim();
        const sourceDeparture = String(bus.departureFromSource || bus.departureTime || "-").trim() || "-";
        const destinationArrival = String(bus.arrivalAtDestination || bus.arrivalTime || "-").trim() || "-";
        const routeTrace = `${displayFrom} -> ${displayTo}`;
        const runsAsDifferentRoute = normalizeCityKey(displayFrom) !== normalizeCityKey(bus.fromCity)
            || normalizeCityKey(displayTo) !== normalizeCityKey(bus.toCity);
        const subline = runsAsDifferentRoute
            ? `Runs as ${bus.fromCity} to ${bus.toCity} | Journey ${formatDateLabel(date)}`
            : `${displayFrom} to ${displayTo} | Journey ${formatDateLabel(date)}`;
        const safeName = escapeHtml(bus.name);
        const safeFrom = escapeHtml(displayFrom);
        const safeTo = escapeHtml(displayTo);
        const safeDeparture = escapeHtml(sourceDeparture);
        const safeArrival = escapeHtml(destinationArrival);
        const safeType = escapeHtml(bus.busType || "Standard");
        const safeSubline = escapeHtml(subline);
        const safeRouteTrace = escapeHtml(routeTrace);

        resultsDiv.innerHTML += `
            <div class="bus-card">
                <div class="bus-brand">
                    <div class="bus-brand-top">
                        <h3 class="bus-name">${safeName}</h3>
                        <span class="bus-badge">${safeType}</span>
                    </div>
                    <div class="bus-subline">${safeSubline}</div>
                    <div class="bus-route-trace">Route: ${safeRouteTrace}</div>
                    <div class="bus-tags">
                        ${tags.map((tag) => `<span class="bus-tag">${escapeHtml(tag)}</span>`).join("")}
                    </div>
                </div>

                <div class="bus-schedule">
                    <div class="schedule-row">
                        <span class="schedule-label">Departure</span>
                        <span class="schedule-value">${safeDeparture}</span>
                    </div>
                    <div class="schedule-row">
                        <span class="schedule-label">Arrival</span>
                        <span class="schedule-value">${safeArrival}</span>
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
                        <p class="price-note">${availableSeats} / ${totalSeats} seats available</p>
                    </div>
                    <button class="book-btn"
                        data-id="${bus.id}"
                        data-name="${encodeURIComponent(bus.name)}"
                        data-from="${encodeURIComponent(displayFrom)}"
                        data-to="${encodeURIComponent(displayTo)}"
                        data-price="${bus.price}"
                        data-bus-type="${encodeURIComponent(bus.busType || "Standard")}"
                        data-departure="${encodeURIComponent(sourceDeparture)}">
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
            const projectedApiBuses = getMatchingBusesByStopOrder(apiBuses, from, to);
            const buses = mergeBusLists(projectedApiBuses, getLocalRouteBuses());

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
