const trackParams = new URLSearchParams(window.location.search);

function normalizeText(value) {
    return (value || "").trim();
}

function normalizeEmail(value) {
    return normalizeText(value).toLowerCase();
}

function profileMobile(value) {
    return normalizeText(value).replace(/\D/g, "").slice(-10);
}

function getCurrentUserRouteBooking() {
    const isAdmin = localStorage.getItem("adminLoggedIn") === "true";
    const history = JSON.parse(localStorage.getItem("bookingHistory") || "[]");

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

function getTrackingContext() {
    const from = normalizeText(trackParams.get("from"));
    const to = normalizeText(trackParams.get("to"));
    const date = normalizeText(trackParams.get("date"));
    const departureTime = normalizeText(trackParams.get("departureTime"));
    const busName = normalizeText(trackParams.get("busName"));
    const bookingId = normalizeText(trackParams.get("bookingId"));

    if (from && to) {
        return {
            from,
            to,
            journeyDate: date || "-",
            departureTime: departureTime || "Live route view",
            busName: busName || "YUbus route",
            bookingId: bookingId || "-"
        };
    }

    const latestBooking = getCurrentUserRouteBooking();
    if (latestBooking) {
        return {
            from: latestBooking.from || "Source",
            to: latestBooking.to || "Destination",
            journeyDate: latestBooking.journeyDate || "-",
            departureTime: latestBooking.departureTime || "Departure time not saved",
            busName: latestBooking.busName || "YUbus",
            bookingId: latestBooking.bookingId || "-"
        };
    }

    return {
        from: "Source",
        to: "Destination",
        journeyDate: "-",
        departureTime: "Not available",
        busName: "YUbus",
        bookingId: "-"
    };
}

function getRouteProgress(departureTime, from, to) {
    const text = normalizeText(departureTime).toLowerCase();
    const routeKey = `${normalizeText(from)}-${normalizeText(to)}`;

    if (routeKey === "bangalore-hyderabad") {
        return 68;
    }

    if (!text || text === "not available" || text.includes("not saved")) {
        return 24;
    }

    if (text.includes("am")) {
        return 34;
    }

    if (text.includes("pm")) {
        return 26;
    }

    return 28;
}

function getStatusText(progress, departureTime) {
    if (departureTime === "Not available") {
        return "Tracking route from saved trip details";
    }

    if (progress < 25) {
        return "Preparing to depart from source";
    }

    if (progress < 55) {
        return "Bus is moving on the planned route";
    }

    if (progress < 85) {
        return "Approaching destination corridor";
    }

    return "Bus is close to destination";
}

function getShortStatus(progress, departureTime) {
    if (departureTime === "Not available") {
        return "Live Route";
    }

    if (progress < 25) {
        return "Preparing";
    }

    if (progress < 80) {
        return "On the Way";
    }

    if (progress < 95) {
        return "Arriving Soon";
    }

    return "At the Stop";
}

function getTipText(from, to) {
    return `Keep your phone reachable and arrive a bit early at the ${from} boarding point. Route updates will help you prepare before arrival at ${to}.`;
}

function getRouteCode(from, to) {
    const source = normalizeText(from).slice(0, 2).toUpperCase() || "YU";
    const destination = normalizeText(to).slice(0, 2).toUpperCase() || "BS";
    return `${source}${destination}-25A`;
}

function getEta(progress) {
    if (progress < 25) {
        return "18 mins";
    }

    if (progress < 45) {
        return "12 mins";
    }

    if (progress < 70) {
        return "8 mins";
    }

    return "4 mins";
}

function getNextStop(from, to) {
    const source = normalizeText(from);
    const destination = normalizeText(to);

    if (source === "bangalore" && destination === "hyderabad") {
        return "Anantapur Stop";
    }

    if (source === "hyderabad" && destination === "bangalore") {
        return "Kurnool Stop";
    }

    return `${to} Corridor`;
}

function getUpdatedLabel() {
    return "2 mins ago";
}

document.addEventListener("DOMContentLoaded", () => {
    const context = getTrackingContext();
    const progress = getRouteProgress(context.departureTime, context.from, context.to);
    const statusText = getStatusText(progress, context.departureTime);
    const shortStatus = getShortStatus(progress, context.departureTime);
    const nextStop = getNextStop(context.from, context.to);
    const routeCode = getRouteCode(context.from, context.to);

    document.getElementById("trackRouteTitle").textContent = `${context.from} to ${context.to}`;
    document.getElementById("trackRouteCopy").textContent = `Live route view for ${context.from} to ${context.to}. Departure time and route details are shown below for easier boarding planning.`;
    document.getElementById("trackDepartureTime").textContent = context.departureTime;
    document.getElementById("trackJourneyDate").textContent = context.journeyDate;
    document.getElementById("trackBusName").textContent = context.busName;
    document.getElementById("trackSource").textContent = context.from;
    document.getElementById("trackDestination").textContent = context.to;
    document.getElementById("mapSourceLabel").textContent = context.from;
    document.getElementById("mapDestinationLabel").textContent = context.to;
    document.getElementById("mapRouteName").textContent = `Your Bus: ${routeCode}`;
    document.getElementById("trackStatusInline").textContent = shortStatus;
    document.getElementById("mapEta").textContent = getEta(progress);
    document.getElementById("mapNextStop").textContent = nextStop;
    document.getElementById("mapBusNumber").textContent = `#${(context.bookingId || routeCode).replace(/[^0-9A-Z]/gi, "").slice(-4) || "1085"}`;
    document.getElementById("detailRoute").textContent = `${context.from} -> ${context.to}`;
    document.getElementById("detailDeparture").textContent = context.departureTime;
    document.getElementById("detailBookingId").textContent = context.bookingId;
    document.getElementById("detailMode").textContent = context.bookingId !== "-" ? "Saved booking route" : "Search route";
    document.getElementById("trackStatus").textContent = shortStatus;
    document.getElementById("stopChip").textContent = nextStop;
    document.getElementById("mapEtaChip").textContent = `ETA: ${getEta(progress)}`;
    document.getElementById("trackTip").textContent = getTipText(context.from, context.to);
    document.getElementById("mapUpdatedAt").textContent = getUpdatedLabel();

    const routeBasePath = document.getElementById("routeBasePath");
    const progressPath = document.getElementById("routeProgressPath");
    const busMarkerEl = document.getElementById("busMarker");
    const refreshBtn = document.getElementById("mapRefreshBtn");
    const etaChipEl = document.getElementById("mapEtaChip");

    if (routeBasePath && progressPath) {
        const pathLength = routeBasePath.getTotalLength();
        progressPath.style.strokeDasharray = `${pathLength}`;
        progressPath.style.strokeDashoffset = `${pathLength * (1 - progress / 100)}`;

        const point = routeBasePath.getPointAtLength(pathLength * (progress / 100));
        busMarkerEl.style.left = `${point.x}px`;
        busMarkerEl.style.top = `${point.y}px`;
        etaChipEl.style.left = `${point.x - 6}px`;
        etaChipEl.style.top = `${point.y - 36}px`;
    }

    if (refreshBtn) {
        refreshBtn.addEventListener("click", () => {
            document.getElementById("mapUpdatedAt").textContent = "just now";
        });
    }
});
