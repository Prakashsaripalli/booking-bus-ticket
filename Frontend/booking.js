const params = new URLSearchParams(window.location.search);

const seatLayout = document.getElementById("seatLayout");
const seatPriceDisplay = document.getElementById("seatPrice");
const selectedSeatsDisplay = document.getElementById("selectedSeats");
const gstDisplay = document.getElementById("gstAmount");
const totalDisplay = document.getElementById("totalAmount");
const proceedBtn = document.getElementById("proceedBtn");
const startPointSelect = document.getElementById("startPointSelect");
const dropPointSelect = document.getElementById("dropPointSelect");
const confirmPointsBtn = document.getElementById("confirmPointsBtn");
const boardingStatus = document.getElementById("boardingStatus");
const journeyRouteDisplay = document.getElementById("journeyRoute");
const journeyDateDisplay = document.getElementById("journeyDate");
const journeyNotice = document.getElementById("journeyNotice");
const busTypeBadge = document.getElementById("busTypeBadge");
const layoutHint = document.getElementById("layoutHint");
const layoutShell = seatLayout?.closest(".layout-shell");

const busName = params.get("name") || "";
const from = params.get("from") || "";
const to = params.get("to") || "";
const busId = params.get("busId") || "";
const journeyDate = params.get("date") || "";
const departureTime = params.get("departureTime") || "";

const catalogBus = Array.isArray(window.BUS_CATALOG)
    ? window.BUS_CATALOG.find((bus) => String(bus.id || "") === String(busId))
    : null;

const busType = typeof window.resolveBusCoachType === "function"
    ? window.resolveBusCoachType({
        ...catalogBus,
        id: busId || catalogBus?.id,
        name: busName || catalogBus?.name,
        fromCity: from || catalogBus?.fromCity,
        toCity: to || catalogBus?.toCity,
        departureTime: departureTime || catalogBus?.departureTime,
        busType: params.get("busType") || catalogBus?.busType || "Standard"
    })
    : (params.get("busType") || catalogBus?.busType || "Standard");
const basePrice = parseInt(params.get("price"), 10) || parseInt(catalogBus?.price, 10) || 1299;

let selectedUnits = [];
let boardingConfirmed = false;

const CITY_POINTS = window.CITY_POINTS || {
    Hyderabad: ["Gachibowli", "Kukatpally", "Ameerpet", "LB Nagar", "MGBS"],
    Warangal: ["Hanamkonda", "Kazipet", "Warangal Bus Stand", "Narsampet", "Mulugu"],
    Karimnagar: ["Karimnagar Bus Stand", "Kothapalli", "Jagtial Road", "Karimnagar Bypass", "Manakondur"],
    Nizamabad: ["Nizamabad Bus Stand", "Bodhan Road", "Nizamabad Railway Station", "Armur", "Nizamsagar Road"],
    Khammam: ["Khammam Bus Stand", "Bypass Road", "Wyra Road", "Kothagudem", "Madhira"],
    Vijayawada: ["Benz Circle", "PNBS", "Auto Nagar", "MG Road", "Gannavaram"],
    Visakhapatnam: ["Dwaraka Nagar", "Maddilapalem", "NAD", "Gajuwaka", "Seethammadhara"],
    Tirupati: ["APSRTC Bus Stand", "Leela Mahal", "Renigunta", "Tirumala", "Alipiri"],
    Guntur: ["Guntur Bus Stand", "Brodipet", "Arundelpet", "Ring Road", "Nallapadu"],
    Kurnool: ["Kurnool Bus Stand", "Gandhi Nagar", "Nandyal Road", "Kallur", "Bypass"],
    Nellore: ["RTC Bus Stand", "Stonehousepet", "Nellore Bypass", "Kavali", "Atmakur"],
    Rajahmundry: ["RTC Complex", "Kotipalli", "Danavaipeta", "Bypass Road", "Morampudi"],
    Bhubaneswar: ["Baramunda", "Vani Vihar", "Master Canteen", "Patia", "Kharavel Nagar"],
    Cuttack: ["Badambadi", "Link Road", "College Square", "CDA", "Bypass"],
    Puri: ["Puri Bus Stand", "Grand Road", "Station Road", "Swargadwar", "Konark Road"],
    Rourkela: ["Rourkela Bus Stand", "Sector 2", "Panposh", "Chhend", "Bisra Road"],
    Sambalpur: ["Sambalpur Bus Stand", "Ainthapali", "Dhanupali", "Burla", "Hirakud"],
    Berhampur: ["Berhampur Bus Stand", "Gopalpur", "Ankuli", "Bada Bazar", "Lochapada"],
    Chennai: ["Koyambedu", "Guindy", "Tambaram", "Central", "Perungudi"],
    Coimbatore: ["Gandhipuram", "Ukkadam", "Saravanampatti", "Peelamedu", "Singanallur"],
    Madurai: ["Mattuthavani", "Periyar", "Thallakulam", "KK Nagar", "Anna Nagar"],
    Tiruchirappalli: ["Chathiram", "Srirangam", "Thillai Nagar", "Ponmalai", "Central"],
    Salem: ["Five Roads", "New Bus Stand", "Shevapet", "Gugai", "Salem Junction"],
    Kochi: ["Vyttila", "Edappally", "Aluva", "Kalamassery", "Fort Kochi"],
    Thiruvananthapuram: ["Thampanoor", "Technopark", "Kazhakkoottam", "Attingal", "Nedumangad"],
    Kozhikode: ["Mavoor Road", "Ramanattukara", "Kallai", "Medical College", "Thondayad"],
    Thrissur: ["Swaraj Round", "Puzhakkal", "Mannuthy", "Ollur", "Kuttanellur"],
    Kannur: ["Kannur Bus Stand", "Thana", "Payyambalam", "Talap", "Kuthuparamba"],
    Bangalore: ["Majestic", "Silk Board", "Electronic City", "Hebbal", "KR Puram"],
    Mysore: ["Mysore Bus Stand", "Jayalakshmipuram", "Vijayanagar", "Hebbal", "Ramaswamy Circle"],
    Mangalore: ["Hampankatta", "Lalbagh", "Kankanady", "Surathkal", "Kuloor"],
    Hubli: ["Hubli Bus Stand", "Gokul Road", "Keshwapur", "Unkal", "Bypass"],
    Belgaum: ["Belgaum Bus Stand", "Tilakwadi", "Udyambag", "Sambra", "Bypass"]
};

function getPointsForCity(city) {
    const normalized = String(city || "").trim();
    return CITY_POINTS[normalized] || ["Main Bus Stand", "City Center", "Railway Station", "Airport", "Bypass"];
}

function setBoardingStatus(message, variant = "") {
    if (!boardingStatus) {
        return;
    }
    boardingStatus.textContent = message;
    boardingStatus.className = "boarding-status";
    if (variant) {
        boardingStatus.classList.add(variant);
    }
}

function populateSelect(select, points, placeholder) {
    if (!select) {
        return;
    }
    select.innerHTML = "";
    const placeholderOption = document.createElement("option");
    placeholderOption.value = "";
    placeholderOption.textContent = placeholder;
    placeholderOption.disabled = true;
    placeholderOption.selected = true;
    select.appendChild(placeholderOption);
    points.forEach((point) => {
        const option = document.createElement("option");
        option.value = point;
        option.textContent = point;
        select.appendChild(option);
    });
}

function resetBoardingConfirmation() {
    boardingConfirmed = false;
    if (confirmPointsBtn) {
        confirmPointsBtn.disabled = false;
        confirmPointsBtn.textContent = "Submit Boarding Details";
    }
    setBoardingStatus("Select starting and dropping points to continue.", "");
}

function normalizeDate(value) {
    return (value || "").trim();
}

function normalizeSeatToken(value) {
    return String(value || "").trim().toUpperCase();
}

function getTodayDate() {
    return new Date().toISOString().split("T")[0];
}

function isPastJourneyDate(value) {
    const normalized = normalizeDate(value);
    if (!normalized) {
        return true;
    }

    return normalized < getTodayDate();
}

function isBookingLoginActive() {
    return localStorage.getItem("userOTPVerified") === "true"
        || localStorage.getItem("googleLogin") === "true"
        || localStorage.getItem("adminLoggedIn") === "true";
}

function createPrice(base, adjustments) {
    return Math.max(299, base + adjustments);
}

function buildSleeperUnits(base) {
    const units = [];
    const columns = [
        { code: "A", section: "left", deck: "lower", kind: "berth" },
        { code: "B", section: "right", deck: "lower", kind: "berth" },
        { code: "C", section: "right", deck: "lower", kind: "berth" },
        { code: "D", section: "left", deck: "upper", kind: "berth" },
        { code: "E", section: "right", deck: "upper", kind: "berth" },
        { code: "F", section: "right", deck: "upper", kind: "berth" }
    ];
    let legacyNumber = 1;

    for (let row = 1; row <= 6; row += 1) {
        columns.forEach((column, columnIndex) => {
            const isWindow = columnIndex === 0 || columnIndex === 2 || columnIndex === 3 || columnIndex === 5;
            const rowAdjustment = row <= 2 ? 120 : (row >= 5 ? -40 : 35);
            const windowAdjustment = isWindow ? 90 : 30;
            const deckAdjustment = column.deck === "lower" ? 60 : 20;

            units.push({
                id: `${column.code}${row}`,
                label: `${column.code}${row}`,
                legacyNumber,
                row,
                deck: column.deck,
                section: column.section,
                kind: column.kind,
                price: createPrice(base, rowAdjustment + windowAdjustment + deckAdjustment)
            });

            legacyNumber += 1;
        });
    }

    return units;
}

function buildDeckSeaterUnits(base) {
    const units = [];
    let legacyNumber = 1;

    for (let row = 1; row <= 12; row += 1) {
        const frontAdjustment = row <= 3 ? 70 : (row >= 10 ? -25 : 20);

        [
            { code: "A", section: "left", deck: "lower", kind: "seat" },
            { code: "B", section: "right", deck: "lower", kind: "seat" },
            { code: "C", section: "right", deck: "lower", kind: "seat" }
        ].forEach((column, columnIndex) => {
            const isWindow = columnIndex === 0 || columnIndex === 2;
            const unitAdjustment = isWindow ? 35 : 5;

            units.push({
                id: `${column.code}${row}`,
                label: `${column.code}${row}`,
                legacyNumber,
                row,
                deck: column.deck,
                section: column.section,
                kind: column.kind,
                price: createPrice(base, frontAdjustment + unitAdjustment + 35)
            });

            legacyNumber += 1;
        });
    }

    for (let row = 1; row <= 6; row += 1) {
        const frontAdjustment = row <= 2 ? 90 : (row >= 5 ? -20 : 30);

        [
            { code: "D", section: "left", deck: "upper", kind: "berth" },
            { code: "E", section: "right", deck: "upper", kind: "berth" },
            { code: "F", section: "right", deck: "upper", kind: "berth" }
        ].forEach((column, columnIndex) => {
            const isWindow = columnIndex === 0 || columnIndex === 2;
            const unitAdjustment = isWindow ? 90 : 30;

            units.push({
                id: `${column.code}${row}`,
                label: `${column.code}${row}`,
                legacyNumber,
                row,
                deck: column.deck,
                section: column.section,
                kind: column.kind,
                price: createPrice(base, frontAdjustment + unitAdjustment + 80)
            });

            legacyNumber += 1;
        });
    }

    return units;
}

function buildRegularSeaterUnits(base) {
    const units = [];
    const columns = [
        { code: "A", section: "left" },
        { code: "B", section: "left" },
        { code: "C", section: "right" },
        { code: "D", section: "right" }
    ];
    let legacyNumber = 1;

    for (let row = 1; row <= 10; row += 1) {
        const frontAdjustment = row <= 2 ? 70 : (row >= 8 ? -30 : 15);
        columns.forEach((column, columnIndex) => {
            const isWindow = columnIndex === 0 || columnIndex === columns.length - 1;
            const seatAdjustment = isWindow ? 35 : 5;

            units.push({
                id: `${column.code}${row}`,
                label: `${column.code}${row}`,
                legacyNumber,
                row,
                section: column.section,
                kind: "seat",
                price: createPrice(base, frontAdjustment + seatAdjustment)
            });

            legacyNumber += 1;
        });
    }

    return units;
}

function getLayoutProfile(type, base) {
    if (/sleeper/i.test(type)) {
        return {
            kind: "sleeper",
            badge: type,
            hint: "Lower berth on the left card, upper berth on the right card.",
            units: buildSleeperUnits(base),
            deckCards: [
                { key: "lower", title: "Lower Berths", subtitle: "1 berth left, 2 berths right", showDriver: true },
                { key: "upper", title: "Upper Berths", subtitle: "1 berth left, 2 berths right", showDriver: false }
            ]
        };
    }

    if (/seater/i.test(type)) {
        return {
            kind: "seater-deck",
            badge: type,
            hint: "Lower seats on the left card, upper berths on the right card.",
            units: buildDeckSeaterUnits(base),
            deckCards: [
                { key: "lower", title: "Lower Seats", subtitle: "1 seat left, 2 seats right", showDriver: true },
                { key: "upper", title: "Upper Berths", subtitle: "1 berth left, 2 berths right", showDriver: false }
            ]
        };
    }

    return {
        kind: "regular-seater",
        badge: type,
        hint: "Left 2 seats, middle aisle, right 2 seats.",
        units: buildRegularSeaterUnits(base)
    };
}

function getBookedSeats() {
    const history = JSON.parse(localStorage.getItem("bookingHistory") || "[]");
    const bookedSeatSet = new Set();

    history.forEach((booking) => {
        const sameBus = String(booking?.busName || "") === busName
            && String(booking?.from || "") === from
            && String(booking?.to || "") === to;
        const sameDate = normalizeDate(booking?.journeyDate) === normalizeDate(journeyDate);
        const isActive = (booking?.status || "Booked") === "Booked";

        if (!sameBus || !sameDate || !isActive) {
            return;
        }

        String(booking?.seats || "")
            .split(",")
            .map(normalizeSeatToken)
            .filter(Boolean)
            .forEach((seat) => bookedSeatSet.add(seat));
    });

    return bookedSeatSet;
}

function groupUnitsByRow(units) {
    const rows = new Map();

    units.forEach((unit) => {
        if (!rows.has(unit.row)) {
            rows.set(unit.row, {
                left: [],
                right: []
            });
        }

        rows.get(unit.row)[unit.section].push(unit);
    });

    return rows;
}

function groupUnitsByDeck(units) {
    const decks = new Map();

    units.forEach((unit) => {
        const deckKey = unit.deck || "main";
        if (!decks.has(deckKey)) {
            decks.set(deckKey, []);
        }

        decks.get(deckKey).push(unit);
    });

    return decks;
}

function sortSelectedUnits(a, b) {
    if (a.row !== b.row) {
        return a.row - b.row;
    }

    return a.label.localeCompare(b.label);
}

function getPaymentData() {
    const seatTotal = selectedUnits.reduce((sum, unit) => sum + unit.price, 0);
    const gst = Math.round(seatTotal * 0.05);
    const finalTotal = seatTotal + gst;

    return { seatTotal, gst, finalTotal };
}

function updatePayment() {
    const { seatTotal, gst, finalTotal } = getPaymentData();

    seatPriceDisplay.innerText = String(seatTotal);
    selectedSeatsDisplay.innerText =
        selectedUnits.length > 0
            ? selectedUnits.map((unit) => unit.label).join(", ")
            : "None";
    gstDisplay.innerText = String(gst);
    totalDisplay.innerText = String(finalTotal);
}

function toggleUnitSelection(unit, button) {
    if (button.classList.contains("booked") || proceedBtn.disabled) {
        return;
    }

    const alreadySelected = selectedUnits.some((selected) => selected.id === unit.id);

    if (alreadySelected) {
        selectedUnits = selectedUnits.filter((selected) => selected.id !== unit.id);
        button.classList.remove("selected");
    } else {
        selectedUnits = [...selectedUnits, unit].sort(sortSelectedUnits);
        button.classList.add("selected");
    }

    updatePayment();
}

function createUnitButton(unit, bookedSeats) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `layout-unit ${unit.kind}`;
    button.setAttribute("aria-label", `${unit.kind} ${unit.label} price Rs ${unit.price}`);

    button.innerHTML = `
        <span class="layout-unit-inner">
            <span class="unit-label">${unit.label}</span>
            <span class="unit-price">₹${unit.price}</span>
        </span>
    `;

    const isBooked = bookedSeats.has(normalizeSeatToken(unit.id))
        || bookedSeats.has(String(unit.legacyNumber));

    if (isBooked) {
        button.classList.add("booked");
        button.disabled = true;
    }

    button.addEventListener("click", () => {
        toggleUnitSelection(unit, button);
    });

    return button;
}

function renderLayout(profile, bookedSeats) {
    seatLayout.innerHTML = "";
    seatLayout.dataset.layout = profile.kind;
    layoutShell?.classList.toggle("sleeper-mode", Array.isArray(profile.deckCards));

    const renderRows = (units, container) => {
        const groupedRows = groupUnitsByRow(units);
        const sortedRows = Array.from(groupedRows.keys()).sort((a, b) => a - b);

        sortedRows.forEach((rowNumber) => {
            const rowUnits = groupedRows.get(rowNumber);
            const row = document.createElement("div");
            row.className = "layout-row";

            const leftGroup = document.createElement("div");
            leftGroup.className = "layout-group left";
            rowUnits.left.forEach((unit) => {
                leftGroup.appendChild(createUnitButton(unit, bookedSeats));
            });

            const aisle = document.createElement("div");
            aisle.className = "layout-aisle";
            aisle.textContent = rowNumber === sortedRows[0] ? "Aisle" : "";

            const rightGroup = document.createElement("div");
            rightGroup.className = "layout-group right";
            rowUnits.right.forEach((unit) => {
                rightGroup.appendChild(createUnitButton(unit, bookedSeats));
            });

            row.appendChild(leftGroup);
            row.appendChild(aisle);
            row.appendChild(rightGroup);
            container.appendChild(row);
        });
    };

    if (Array.isArray(profile.deckCards)) {
        const decks = groupUnitsByDeck(profile.units);
        const board = document.createElement("div");
        board.className = `sleepers-board ${profile.kind}`;

        profile.deckCards.forEach((deckMeta) => {
            const deckUnits = decks.get(deckMeta.key) || [];
            if (!deckUnits.length) {
                return;
            }

            const card = document.createElement("section");
            card.className = `deck-card ${deckMeta.key}`;

            const header = document.createElement("div");
            header.className = "deck-card-header";
            header.innerHTML = `
                <div class="deck-card-copy">
                    <span class="deck-card-title">${deckMeta.title}</span>
                    <span class="deck-card-subtitle">${deckMeta.subtitle}</span>
                </div>
                ${deckMeta.showDriver ? `
                    <div class="driver-zone deck-driver" aria-label="Driver area">
                        <div class="driver-seat-mark">
                            <span>Driver Seat</span>
                        </div>
                        <div class="steering-wheel" aria-hidden="true"></div>
                    </div>
                ` : ""}
            `;

            const body = document.createElement("div");
            body.className = "deck-card-body";

            renderRows(deckUnits, body);

            card.appendChild(header);
            card.appendChild(body);
            board.appendChild(card);
        });

        seatLayout.appendChild(board);
        return;
    }

    renderRows(profile.units, seatLayout);
}

function initPage() {
    if (!proceedBtn) {
        return;
    }

    const profile = getLayoutProfile(busType, basePrice);
    const bookedSeats = getBookedSeats();

    journeyRouteDisplay.textContent = `${from || "-"} -> ${to || "-"}`;
    journeyDateDisplay.textContent = journeyDate || "-";
    busTypeBadge.textContent = profile.badge;
    layoutHint.textContent = profile.hint;

    renderLayout(profile, bookedSeats);

    if (isPastJourneyDate(journeyDate)) {
        journeyNotice.classList.remove("hidden");
        journeyNotice.textContent = "Please select today or a future journey date before booking seats.";
        proceedBtn.disabled = true;
    }

    updatePayment();

    populateSelect(startPointSelect, getPointsForCity(from), "Select starting point");
    populateSelect(dropPointSelect, getPointsForCity(to), "Select dropping point");

    if (startPointSelect) {
        startPointSelect.addEventListener("change", resetBoardingConfirmation);
    }

    if (dropPointSelect) {
        dropPointSelect.addEventListener("change", resetBoardingConfirmation);
    }

    if (confirmPointsBtn) {
        confirmPointsBtn.addEventListener("click", () => {
            const startPoint = startPointSelect?.value || "";
            const dropPoint = dropPointSelect?.value || "";

            if (!startPoint) {
                setBoardingStatus("Please select a starting point.", "error");
                startPointSelect?.focus();
                return;
            }

            if (!dropPoint) {
                setBoardingStatus("Please select a dropping point.", "error");
                dropPointSelect?.focus();
                return;
            }

            boardingConfirmed = true;
            confirmPointsBtn.disabled = true;
            confirmPointsBtn.textContent = "Boarding Details Saved";
            setBoardingStatus("Boarding details saved. You can proceed now.", "success");

            localStorage.setItem("boardingStartPoint", startPoint);
            localStorage.setItem("boardingDropPoint", dropPoint);
        });
    }

    proceedBtn.addEventListener("click", () => {
        if (!isBookingLoginActive()) {
            localStorage.setItem("postLoginRedirect", window.location.href);
            alert("Please log in before proceeding to payment.");
            window.location.href = "login.html";
            return;
        }

        if (isPastJourneyDate(journeyDate)) {
            alert("Past travel dates cannot be booked. Please go back and choose a valid date.");
            return;
        }

        if (selectedUnits.length === 0) {
            alert("Please select at least one seat or berth.");
            return;
        }

        if (!boardingConfirmed) {
            alert("Please submit your starting and dropping points before proceeding.");
            return;
        }

        const startPoint = startPointSelect?.value || "";
        const dropPoint = dropPointSelect?.value || "";
        if (!startPoint || !dropPoint) {
            alert("Please select both starting and dropping points.");
            return;
        }

        const { finalTotal } = getPaymentData();
        const query = new URLSearchParams({
            busId,
            name: busName,
            from,
            to,
            date: journeyDate,
            departureTime,
            seats: selectedUnits.map((unit) => unit.label).join(","),
            total: String(finalTotal),
            startPoint,
            dropPoint
        });

        window.location.href = `payment.html?${query.toString()}`;
    });
}

initPage();
