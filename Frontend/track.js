const trackParams = new URLSearchParams(window.location.search);
const TRACK_STORAGE_PREFIX = "yubusLiveTrackingState";
const TRACK_TICK_MS = 3000;

const trackDom = {
    routeTitle: document.getElementById("trackRouteTitle"),
    routeCopy: document.getElementById("trackRouteCopy"),
    departureTime: document.getElementById("trackDepartureTime"),
    journeyDate: document.getElementById("trackJourneyDate"),
    busName: document.getElementById("trackBusName"),
    distance: document.getElementById("trackDistance"),
    speed: document.getElementById("trackSpeed"),
    routeName: document.getElementById("mapRouteName"),
    source: document.getElementById("trackSource"),
    destination: document.getElementById("trackDestination"),
    inlineStatus: document.getElementById("trackStatusInline"),
    eta: document.getElementById("mapEta"),
    nextStop: document.getElementById("mapNextStop"),
    busNumber: document.getElementById("mapBusNumber"),
    detailRoute: document.getElementById("detailRoute"),
    detailDeparture: document.getElementById("detailDeparture"),
    detailBookingId: document.getElementById("detailBookingId"),
    detailMode: document.getElementById("detailMode"),
    status: document.getElementById("trackStatus"),
    stopChip: document.getElementById("stopChip"),
    etaChip: document.getElementById("mapEtaChip"),
    tip: document.getElementById("trackTip"),
    updatedAt: document.getElementById("mapUpdatedAt"),
    sourceLabel: document.getElementById("mapSourceLabel"),
    destinationLabel: document.getElementById("mapDestinationLabel"),
    progressPercent: document.getElementById("progressPercent"),
    progressFill: document.getElementById("progressFill"),
    progressCovered: document.getElementById("progressCovered"),
    progressRemaining: document.getElementById("progressRemaining"),
    liveCovered: document.getElementById("liveCovered"),
    liveRemaining: document.getElementById("liveRemaining"),
    liveProgress: document.getElementById("liveProgress"),
    liveLastPing: document.getElementById("liveLastPing"),
    stopTimeline: document.getElementById("stopTimeline"),
    refreshBtn: document.getElementById("mapRefreshBtn"),
    routeBasePath: document.getElementById("routeBasePath"),
    routeProgressPath: document.getElementById("routeProgressPath"),
    busMarker: document.getElementById("busMarker"),
    statusItems: Array.from(document.querySelectorAll(".status-strip-item")),
    townOne: document.querySelector(".town-1"),
    townTwo: document.querySelector(".town-2"),
    townThree: document.querySelector(".town-3"),
    townFour: document.querySelector(".town-4"),
    routeBlueOne: document.querySelector(".route-blue-one"),
    routeBlueTwo: document.querySelector(".route-blue-two"),
    stopOne: document.querySelector(".stop-one"),
    stopTwo: document.querySelector(".stop-two")
};

let liveTrackingContext = null;
let liveTrackingState = null;
let liveTrackingStops = [];
let liveTrackingTimer = null;

function normalizeText(value) {
    return (value || "").trim();
}

function normalizeEmail(value) {
    return normalizeText(value).toLowerCase();
}

function profileMobile(value) {
    return normalizeText(value).replace(/\D/g, "").slice(-10);
}

function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

function hashString(value) {
    const source = String(value || "");
    let hash = 0;

    for (let index = 0; index < source.length; index += 1) {
        hash = ((hash << 5) - hash) + source.charCodeAt(index);
        hash |= 0;
    }

    return Math.abs(hash);
}

function getCurrentUserRouteBooking() {
    const isAdmin = localStorage.getItem("adminLoggedIn") === "true";
    let history = [];

    try {
        history = JSON.parse(localStorage.getItem("bookingHistory") || "[]");
    } catch (error) {
        history = [];
    }

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
            bookingId: bookingId || "-",
            bookedAt: ""
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
            bookingId: latestBooking.bookingId || "-",
            bookedAt: latestBooking.bookedAt || ""
        };
    }

    return {
        from: "Source",
        to: "Destination",
        journeyDate: "-",
        departureTime: "Not available",
        busName: "YUbus",
        bookingId: "-",
        bookedAt: ""
    };
}

function getTrackingKey(context) {
    return `${TRACK_STORAGE_PREFIX}:${[
        context.bookingId,
        context.busName,
        context.from,
        context.to,
        context.journeyDate
    ].join("|").toLowerCase()}`;
}

function parseDepartureDateTime(dateValue, timeValue) {
    const journeyDate = normalizeText(dateValue);
    const departureTime = normalizeText(timeValue);

    if (!journeyDate || journeyDate === "-") {
        return null;
    }

    const parsedDate = new Date(`${journeyDate}T00:00:00`);
    if (Number.isNaN(parsedDate.getTime())) {
        return null;
    }

    const match = departureTime.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (!match) {
        return null;
    }

    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const meridiem = match[3].toUpperCase();

    if (meridiem === "PM" && hours !== 12) {
        hours += 12;
    }

    if (meridiem === "AM" && hours === 12) {
        hours = 0;
    }

    parsedDate.setHours(hours, minutes, 0, 0);
    return parsedDate;
}

function getRouteDistanceKm(from, to) {
    if (typeof window.getCatalogRouteDistanceKm === "function") {
        return window.getCatalogRouteDistanceKm(from, to);
    }

    return 180 + (hashString(`${from}-${to}`) % 420);
}

function estimateTravelHours(distanceKm) {
    const cruiseSpeed = distanceKm <= 220 ? 50 : (distanceKm <= 480 ? 57 : 62);
    const haltHours = distanceKm <= 220 ? 0.35 : (distanceKm <= 480 ? 0.75 : 1.2);
    return Math.max(3, Number((distanceKm / cruiseSpeed + haltHours).toFixed(1)));
}

function getClockProgress(context, totalDurationHours) {
    const departureAt = parseDepartureDateTime(context.journeyDate, context.departureTime);
    if (!departureAt) {
        return null;
    }

    const elapsedMs = Date.now() - departureAt.getTime();
    const durationMs = totalDurationHours * 60 * 60 * 1000;
    const progress = (elapsedMs / durationMs) * 100;

    if (progress >= 0 && progress < 100) {
        return clamp(progress, 0, 100);
    }

    return null;
}

function buildBusNumber(context) {
    const source = (context.bookingId || context.busName || `${context.from}${context.to}`)
        .replace(/[^0-9A-Z]/gi, "")
        .toUpperCase();

    return `#${source.slice(-6) || "1085"}`;
}

function shortenLabel(value, maxLength = 18) {
    const text = normalizeText(value);
    if (text.length <= maxLength) {
        return text;
    }

    return `${text.slice(0, maxLength - 1)}…`;
}

function getCityPoints(city) {
    const points = window.CITY_POINTS?.[normalizeText(city)];
    if (Array.isArray(points) && points.length) {
        return points;
    }

    return [
        `${city} Bus Stand`,
        `${city} Main Road`,
        `${city} Bypass`,
        `${city} Junction`
    ];
}

function getMidwayStop(from, to) {
    const routeKey = `${normalizeText(from).toLowerCase()}-${normalizeText(to).toLowerCase()}`;
    const routeStops = {
        "hyderabad-bengaluru": "Kurnool Junction",
        "bengaluru-hyderabad": "Anantapur Bypass",
        "hyderabad-vijayawada": "Suryapet Junction",
        "vijayawada-hyderabad": "Narketpally Toll Plaza",
        "hyderabad-chennai": "Nellore Corridor",
        "chennai-hyderabad": "Ongole Highway Point",
        "bengaluru-chennai": "Vellore Bypass",
        "chennai-bengaluru": "Krishnagiri Junction",
        "hyderabad-visakhapatnam": "Rajahmundry Corridor",
        "visakhapatnam-hyderabad": "Eluru Highway Point"
    };

    return routeStops[routeKey] || `${from} - ${to} Highway Hub`;
}

function buildTrackingStops(context) {
    const fromPoints = getCityPoints(context.from);
    const toPoints = getCityPoints(context.to);

    return [
        { name: fromPoints[0] || `${context.from} Boarding`, progress: 0 },
        { name: fromPoints[Math.min(2, fromPoints.length - 1)] || `${context.from} Exit`, progress: 22 },
        { name: getMidwayStop(context.from, context.to), progress: 52 },
        { name: toPoints[Math.max(1, toPoints.length - 2)] || `${context.to} Outer`, progress: 81 },
        { name: toPoints[0] || `${context.to} Arrival`, progress: 100 }
    ];
}

function createInitialTrackingState(context, distanceKm) {
    const trackingKey = getTrackingKey(context);
    const seed = hashString(trackingKey);
    const totalDurationHours = estimateTravelHours(distanceKm);
    const clockProgress = getClockProgress(context, totalDurationHours);
    const initialSpeed = clamp(distanceKm <= 250 ? 48 + (seed % 10) : 54 + (seed % 12), 42, 72);

    return {
        progress: clockProgress ?? clamp(12 + (seed % 24), 8, 36),
        baseSpeedKmph: initialSpeed,
        speedKmph: initialSpeed,
        totalDurationHours,
        lastTickAt: Date.now(),
        lastPingAt: Date.now(),
        trackingMode: clockProgress !== null ? "Realtime from schedule" : "Simulated live route",
        seed,
        clockDriven: clockProgress !== null
    };
}

function loadTrackingState(context, distanceKm) {
    const trackingKey = getTrackingKey(context);

    try {
        const storedState = JSON.parse(localStorage.getItem(trackingKey) || "null");
        if (storedState && typeof storedState === "object") {
            const initialState = createInitialTrackingState(context, distanceKm);
            const clockProgress = getClockProgress(context, initialState.totalDurationHours);

            return {
                ...initialState,
                ...storedState,
                totalDurationHours: initialState.totalDurationHours,
                trackingMode: clockProgress !== null ? "Realtime from schedule" : (storedState.trackingMode || "Simulated live route"),
                clockDriven: clockProgress !== null,
                progress: clockProgress !== null ? clockProgress : clamp(Number(storedState.progress || initialState.progress), 0, 100),
                lastTickAt: Date.now()
            };
        }
    } catch (error) {
        // Fall through to a fresh state.
    }

    return createInitialTrackingState(context, distanceKm);
}

function saveTrackingState(context, state) {
    localStorage.setItem(getTrackingKey(context), JSON.stringify(state));
}

function computeLiveSpeed(state, progress, timestamp) {
    const wave = Math.sin((timestamp / 42000) + state.seed) * 4;
    const progressAdjustment = progress < 12 ? -6 : (progress > 84 ? -5 : 2);
    return clamp(Math.round(state.baseSpeedKmph + wave + progressAdjustment), 24, 76);
}

function advanceTrackingState(context, state, forceRefresh = false) {
    const now = Date.now();
    const scheduledProgress = getClockProgress(context, state.totalDurationHours);

    state.speedKmph = computeLiveSpeed(state, state.progress, now);

    if (scheduledProgress !== null) {
        state.progress = clamp(scheduledProgress + (forceRefresh ? 0.35 : 0), 0, 100);
        state.trackingMode = "Realtime from schedule";
        state.clockDriven = true;
        state.lastTickAt = now;
        state.lastPingAt = now;
        return state;
    }

    state.clockDriven = false;
    state.trackingMode = "Simulated live route";

    const elapsedSeconds = Math.max(1, (now - Number(state.lastTickAt || now)) / 1000);
    const durationSeconds = Math.max(state.totalDurationHours * 60 * 60, 1);
    let progressGain = (elapsedSeconds / durationSeconds) * 100 * (state.speedKmph / Math.max(state.baseSpeedKmph, 1));

    if (forceRefresh) {
        progressGain += 0.75;
    }

    state.progress = clamp(Number(state.progress || 0) + progressGain, 0, 100);
    state.lastTickAt = now;
    state.lastPingAt = now;
    return state;
}

function getStatusPayload(progress) {
    if (progress < 8) {
        return { short: "Boarding", long: "Bus is at the boarding point and preparing to leave.", phase: 0 };
    }

    if (progress < 30) {
        return { short: "Departed", long: "Bus has departed and is moving out of the source corridor.", phase: 0 };
    }

    if (progress < 82) {
        return { short: "On the Way", long: "Bus is moving on the highway with live tracking updates.", phase: 0 };
    }

    if (progress < 98) {
        return { short: "Arriving Soon", long: "Bus is entering the destination corridor and arrival is near.", phase: 1 };
    }

    return { short: "At the Stop", long: "Bus has reached the destination stop.", phase: 2 };
}

function formatDistance(distanceKm) {
    return `${Math.round(distanceKm)} km`;
}

function formatSpeed(speedKmph) {
    return `${Math.round(speedKmph)} km/h`;
}

function formatEta(remainingKm, speedKmph, progress) {
    if (progress >= 99.5 || remainingKm <= 0) {
        return "Reached";
    }

    const etaMinutes = Math.max(1, Math.round((remainingKm / Math.max(speedKmph, 24)) * 60));
    if (etaMinutes < 60) {
        return `${etaMinutes} mins`;
    }

    const hours = Math.floor(etaMinutes / 60);
    const minutes = etaMinutes % 60;
    return minutes ? `${hours} hr ${minutes} mins` : `${hours} hr`;
}

function formatUpdatedLabel(timestamp) {
    const seconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));

    if (seconds < 5) {
        return "just now";
    }

    if (seconds < 60) {
        return `${seconds} sec ago`;
    }

    const minutes = Math.floor(seconds / 60);
    return `${minutes} min${minutes === 1 ? "" : "s"} ago`;
}

function getNextStop(stops, progress) {
    return stops.find((stop) => stop.progress > progress + 0.2) || stops[stops.length - 1];
}

function getCurrentStop(stops, progress) {
    return stops
        .slice()
        .reverse()
        .find((stop) => stop.progress <= progress + 0.2) || stops[0];
}

function getTrackingTip(context, snapshot) {
    if (snapshot.progress < 12) {
        return `Boarding for ${context.from} is starting soon. Reach the pickup point a little early and keep your booking details ready.`;
    }

    if (snapshot.progress < 82) {
        return `The bus is currently moving near ${snapshot.currentStop.name}. Keep your phone reachable for boarding and arrival updates.`;
    }

    if (snapshot.progress < 98) {
        return `The bus is approaching ${context.to}. Be ready near ${snapshot.nextStop.name} for a smoother arrival.`;
    }

    return `The trip has reached ${context.to}. Check your belongings before you leave the bus.`;
}

function buildTrackingSnapshot(context, state, stops) {
    const totalDistanceKm = getRouteDistanceKm(context.from, context.to);
    const progress = clamp(Number(state.progress || 0), 0, 100);
    const coveredKm = Math.min(totalDistanceKm, Math.max(0, (totalDistanceKm * progress) / 100));
    const remainingKm = Math.max(0, totalDistanceKm - coveredKm);
    const nextStop = getNextStop(stops, progress);
    const currentStop = getCurrentStop(stops, progress);
    const status = getStatusPayload(progress);

    return {
        progress,
        totalDistanceKm,
        coveredKm,
        remainingKm,
        speedKmph: state.speedKmph,
        eta: formatEta(remainingKm, state.speedKmph, progress),
        nextStop,
        currentStop,
        status,
        updatedLabel: formatUpdatedLabel(state.lastPingAt),
        lastPingLabel: formatUpdatedLabel(state.lastPingAt),
        trackingMode: state.trackingMode,
        busNumber: buildBusNumber(context),
        tip: getTrackingTip(context, { progress, currentStop, nextStop }),
        routeCode: `${normalizeText(context.from).slice(0, 2).toUpperCase() || "YU"}${normalizeText(context.to).slice(0, 2).toUpperCase() || "BS"}-LIVE`
    };
}

function setPathPosition(element, progressPercent, offsetX = 0, offsetY = 0) {
    if (!element || !trackDom.routeBasePath) {
        return;
    }

    const pathLength = trackDom.routeBasePath.getTotalLength();
    const point = trackDom.routeBasePath.getPointAtLength(pathLength * clamp(progressPercent, 0, 100) / 100);
    element.style.left = `${point.x + offsetX}px`;
    element.style.top = `${point.y + offsetY}px`;
}

function renderStopTimeline(stops, snapshot) {
    if (!trackDom.stopTimeline) {
        return;
    }

    trackDom.stopTimeline.innerHTML = stops.map((stop) => {
        let stateClass = "upcoming";
        let stateText = "Upcoming";

        if (snapshot.progress >= stop.progress) {
            stateClass = "completed";
            stateText = "Passed";
        } else if (snapshot.nextStop.name === stop.name) {
            stateClass = "current";
            stateText = snapshot.progress >= 98 ? "Reached" : "Next stop";
        }

        return `
            <div class="timeline-step ${stateClass}">
                <span class="timeline-dot"></span>
                <div class="timeline-copy">
                    <strong>${stop.name}</strong>
                    <span>${stateText}</span>
                </div>
            </div>
        `;
    }).join("");
}

function renderTracking(snapshot) {
    const context = liveTrackingContext;

    if (!context) {
        return;
    }

    trackDom.routeTitle.textContent = `${context.from} to ${context.to}`;
    trackDom.routeCopy.textContent = `${snapshot.status.long} Live location refresh runs automatically with distance, ETA, and next-stop updates.`;
    trackDom.departureTime.textContent = context.departureTime;
    trackDom.journeyDate.textContent = context.journeyDate;
    trackDom.busName.textContent = context.busName;
    trackDom.distance.textContent = formatDistance(snapshot.totalDistanceKm);
    trackDom.speed.textContent = formatSpeed(snapshot.speedKmph);
    trackDom.routeName.textContent = `Your Bus: ${snapshot.routeCode}`;
    trackDom.source.textContent = context.from;
    trackDom.destination.textContent = context.to;
    trackDom.sourceLabel.textContent = context.from;
    trackDom.destinationLabel.textContent = context.to;
    trackDom.inlineStatus.textContent = snapshot.status.short;
    trackDom.eta.textContent = snapshot.eta;
    trackDom.nextStop.textContent = snapshot.nextStop.name;
    trackDom.busNumber.textContent = snapshot.busNumber;
    trackDom.detailRoute.textContent = `${context.from} -> ${context.to}`;
    trackDom.detailDeparture.textContent = context.departureTime;
    trackDom.detailBookingId.textContent = context.bookingId;
    trackDom.detailMode.textContent = snapshot.trackingMode;
    trackDom.status.textContent = snapshot.status.short;
    trackDom.stopChip.textContent = snapshot.nextStop.name;
    trackDom.etaChip.textContent = snapshot.progress >= 99.5 ? "Arrived" : `ETA: ${snapshot.eta}`;
    trackDom.tip.textContent = snapshot.tip;
    trackDom.updatedAt.textContent = snapshot.updatedLabel;
    trackDom.progressPercent.textContent = `${Math.round(snapshot.progress)}%`;
    trackDom.progressFill.style.width = `${snapshot.progress}%`;
    trackDom.progressCovered.textContent = `${Math.round(snapshot.coveredKm)} km covered`;
    trackDom.progressRemaining.textContent = `${Math.round(snapshot.remainingKm)} km remaining`;
    trackDom.liveCovered.textContent = formatDistance(snapshot.coveredKm);
    trackDom.liveRemaining.textContent = formatDistance(snapshot.remainingKm);
    trackDom.liveProgress.textContent = `${Math.round(snapshot.progress)}%`;
    trackDom.liveLastPing.textContent = snapshot.lastPingLabel;

    if (trackDom.townOne) {
        trackDom.townOne.textContent = shortenLabel(liveTrackingStops[1]?.name || context.from, 16);
    }

    if (trackDom.townTwo) {
        trackDom.townTwo.textContent = shortenLabel(liveTrackingStops[2]?.name || snapshot.currentStop.name, 16);
    }

    if (trackDom.townThree) {
        trackDom.townThree.textContent = shortenLabel(liveTrackingStops[3]?.name || snapshot.nextStop.name, 16);
    }

    if (trackDom.townFour) {
        trackDom.townFour.textContent = shortenLabel(liveTrackingStops[4]?.name || context.to, 16);
    }

    renderStopTimeline(liveTrackingStops, snapshot);

    trackDom.statusItems.forEach((item, index) => {
        item.classList.toggle("active", index === snapshot.status.phase);
    });

    if (trackDom.routeBasePath && trackDom.routeProgressPath) {
        const pathLength = trackDom.routeBasePath.getTotalLength();
        trackDom.routeProgressPath.style.strokeDasharray = `${pathLength}`;
        trackDom.routeProgressPath.style.strokeDashoffset = `${pathLength * (1 - snapshot.progress / 100)}`;
    }

    setPathPosition(trackDom.busMarker, snapshot.progress);
    setPathPosition(trackDom.etaChip, snapshot.progress, 0, -42);
    setPathPosition(trackDom.stopChip, snapshot.nextStop.progress, 0, -54);
    setPathPosition(trackDom.routeBlueOne, liveTrackingStops[1]?.progress || 22);
    setPathPosition(trackDom.stopOne, liveTrackingStops[1]?.progress || 22);
    setPathPosition(trackDom.routeBlueTwo, liveTrackingStops[3]?.progress || 81);
    setPathPosition(trackDom.stopTwo, liveTrackingStops[3]?.progress || 81);
}

function runTrackingTick(forceRefresh = false) {
    if (!liveTrackingContext || !liveTrackingState) {
        return;
    }

    liveTrackingState = advanceTrackingState(liveTrackingContext, liveTrackingState, forceRefresh);
    saveTrackingState(liveTrackingContext, liveTrackingState);
    renderTracking(buildTrackingSnapshot(liveTrackingContext, liveTrackingState, liveTrackingStops));
}

function initializeRefreshButton() {
    if (!trackDom.refreshBtn) {
        return;
    }

    trackDom.refreshBtn.addEventListener("click", () => {
        const button = trackDom.refreshBtn;
        const previousMarkup = button.innerHTML;
        button.disabled = true;
        button.innerHTML = '<i class="fa-solid fa-rotate-right"></i> Refreshing...';
        runTrackingTick(true);

        window.setTimeout(() => {
            button.disabled = false;
            button.innerHTML = previousMarkup;
        }, 850);
    });
}

document.addEventListener("DOMContentLoaded", () => {
    liveTrackingContext = getTrackingContext();
    const totalDistanceKm = getRouteDistanceKm(liveTrackingContext.from, liveTrackingContext.to);
    liveTrackingStops = buildTrackingStops(liveTrackingContext, totalDistanceKm);
    liveTrackingState = loadTrackingState(liveTrackingContext, totalDistanceKm);

    initializeRefreshButton();
    runTrackingTick(false);

    if (liveTrackingTimer) {
        window.clearInterval(liveTrackingTimer);
    }

    liveTrackingTimer = window.setInterval(() => {
        runTrackingTick(false);
    }, TRACK_TICK_MS);

    window.addEventListener("focus", () => runTrackingTick(true));
});
