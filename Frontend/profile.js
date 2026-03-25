function isLoggedIn() {
    return localStorage.getItem("adminLoggedIn") === "true"
        || localStorage.getItem("userOTPVerified") === "true"
        || localStorage.getItem("googleLogin") === "true";
}

const adminBookingState = {
    routeKey: "",
    busKey: "",
    ticketFilter: "booked"
};

const ADMIN_FEATURES_KEY = "adminFeatureModules";
const ADMIN_CONTACT_EMAIL = "yubusservices@gmail.com";
const DEFAULT_ADMIN_FEATURES = [
    {
        id: "offers",
        title: "Offer Engine",
        description: "Control fare campaigns, cashback pushes, and promo visibility.",
        active: true
    },
    {
        id: "notifications",
        title: "Notifications",
        description: "Manage passenger email alerts and operational announcement flow.",
        active: true
    },
    {
        id: "support",
        title: "Support Assistant",
        description: "Keep booking help, route guidance, and user support tools available.",
        active: true
    },
    {
        id: "analytics",
        title: "Analytics Mode",
        description: "Enable deeper reporting widgets for performance monitoring and review.",
        active: false
    }
];

const adminUiState = {
    busFormOpen: false
};

function normalizeEmail(email) {
    return (email || "").trim().toLowerCase();
}

function getRegisteredUsers() {
    try {
        const parsedUsers = JSON.parse(localStorage.getItem("registeredUsers") || "[]");
        if (!Array.isArray(parsedUsers)) {
            return [];
        }

        return parsedUsers.map((user) => ({
            name: typeof user?.name === "string" ? user.name.trim() : "",
            mobile: typeof user?.mobile === "string" ? user.mobile.replace(/\D/g, "").slice(-10) : "",
            email: normalizeEmail(user?.email),
            password: typeof user?.password === "string" ? user.password : ""
        }));
    } catch (error) {
        return [];
    }
}

function isMobileRegistered(mobile, excludeEmail = "") {
    const normalizedMobile = String(mobile || "").replace(/\D/g, "").slice(-10);
    const normalizedExcludeEmail = normalizeEmail(excludeEmail);

    if (!normalizedMobile) {
        return false;
    }

    return getRegisteredUsers().some((user) =>
        user.mobile === normalizedMobile && user.email !== normalizedExcludeEmail
    );
}

function getCurrentUserProfile() {
    const email = normalizeEmail(localStorage.getItem("userEmail") || localStorage.getItem("userIdentity"));
    const registeredUser = getRegisteredUsers().find((user) => user.email === email);
    const name = registeredUser?.name || (localStorage.getItem("userName") || "").trim();
    const mobile = registeredUser?.mobile || (localStorage.getItem("userMobile") || localStorage.getItem("mobile") || "").trim();

    if (email) {
        localStorage.setItem("userEmail", email);
        localStorage.setItem("userIdentity", email);
    }

    localStorage.setItem("userName", name);
    localStorage.setItem("userMobile", mobile);

    if (mobile) {
        localStorage.setItem("mobile", mobile);
    } else {
        localStorage.removeItem("mobile");
    }

    return { email, name, mobile };
}

function fillProfile() {
    const isAdmin = localStorage.getItem("adminLoggedIn") === "true";
    const role = isAdmin ? "Admin" : "User";
    const userProfile = isAdmin ? null : getCurrentUserProfile();
    const identity = isAdmin
        ? (localStorage.getItem("adminIdentity") || "Admin")
        : (userProfile?.name || userProfile?.email || "User");
    const email = isAdmin
        ? ADMIN_CONTACT_EMAIL
        : (userProfile?.email || "-");
    const mobile = isAdmin ? "-" : (userProfile?.mobile || "-");

    document.getElementById("profileRole").textContent = role;
    document.getElementById("profileIdentity").textContent = identity;
    document.getElementById("profileEmail").textContent = email || "-";
    document.getElementById("profileMobile").textContent = mobile;
}

function getVisibleBookings() {
    const allBookings = JSON.parse(localStorage.getItem("bookingHistory") || "[]");
    const isAdmin = localStorage.getItem("adminLoggedIn") === "true";

    if (isAdmin) {
        return allBookings;
    }

    const { email, mobile } = getCurrentUserProfile();
    const normalizedEmail = normalizeEmail(email);
    const normalizedMobile = (mobile || "").replace(/\D/g, "").slice(-10);

    return allBookings.filter((booking) => {
        const ownerEmail = normalizeEmail(booking?.ownerEmail || booking?.passengerEmail);
        const ownerMobile = (booking?.ownerMobile || booking?.passengerMobile || "").replace(/\D/g, "").slice(-10);

        if (normalizedEmail && ownerEmail === normalizedEmail) {
            return true;
        }

        if (normalizedMobile && ownerMobile === normalizedMobile) {
            return true;
        }

        return false;
    });
}

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function getRouteKey(booking) {
    return `${booking?.from || "-"}|||${booking?.to || "-"}`;
}

function groupByRoute(bookings) {
    const routeMap = new Map();

    bookings.forEach((booking) => {
        const routeKey = getRouteKey(booking);
        if (!routeMap.has(routeKey)) {
            routeMap.set(routeKey, {
                routeKey,
                from: booking?.from || "-",
                to: booking?.to || "-",
                bookings: []
            });
        }

        routeMap.get(routeKey).bookings.push(booking);
    });

    return Array.from(routeMap.values());
}

function groupByBus(bookings) {
    const busMap = new Map();

    bookings.forEach((booking) => {
        const busKey = booking?.busName || "-";
        if (!busMap.has(busKey)) {
            busMap.set(busKey, {
                busKey,
                busName: booking?.busName || "-",
                bookings: []
            });
        }

        busMap.get(busKey).bookings.push(booking);
    });

    return Array.from(busMap.values());
}

function getLatestBookedAt(bookings) {
    const latestBooking = bookings
        .filter((booking) => booking?.bookedAt)
        .sort((a, b) => new Date(b.bookedAt) - new Date(a.bookedAt))[0];

    return latestBooking?.bookedAt ? new Date(latestBooking.bookedAt).toLocaleString() : "-";
}

function getBookedCount(bookings) {
    return bookings.filter((booking) => (booking?.status || "Booked") === "Booked").length;
}

function getCancelledCount(bookings) {
    return bookings.filter((booking) => booking?.status === "Cancelled").length;
}

function getPendingRefundCount(bookings) {
    return bookings.filter((booking) => booking?.status === "Cancelled").length;
}

function parseJourneyDateTime(journeyDate, departureTime) {
    const dateValue = String(journeyDate || "").trim();
    const timeValue = String(departureTime || "").trim();
    if (!dateValue) {
        return null;
    }

    const combined = timeValue ? `${dateValue} ${timeValue}` : dateValue;
    let parsed = new Date(combined);
    if (!Number.isNaN(parsed.getTime())) {
        return parsed;
    }

    const isoCandidate = timeValue ? `${dateValue}T${timeValue}` : dateValue;
    parsed = new Date(isoCandidate);
    if (!Number.isNaN(parsed.getTime())) {
        return parsed;
    }

    return null;
}

function isJourneyCompleted(booking) {
    if (!booking || booking?.status === "Cancelled" || booking?.status === "Refunded") {
        return false;
    }

    const journeyDateTime = parseJourneyDateTime(booking?.journeyDate, booking?.departureTime);
    return journeyDateTime ? journeyDateTime.getTime() < Date.now() : false;
}

function getStatusBadge(status, booking = null) {
    const bookingStatus = status === "Refunded"
        ? "Refunded"
        : (status === "Cancelled"
            ? "Cancelled"
            : (isJourneyCompleted(booking) ? "Journey Completed" : "Booked"));
    const badgeClass = bookingStatus === "Refunded"
        ? "status-refunded"
        : (bookingStatus === "Cancelled"
            ? "status-cancelled"
            : (bookingStatus === "Journey Completed" ? "status-completed" : "status-booked"));
    return `<span class="booking-status ${badgeClass}">${escapeHtml(bookingStatus)}</span>`;
}

function isCancelledOrRefunded(booking) {
    return booking?.status === "Cancelled" || booking?.status === "Refunded" || isJourneyCompleted(booking);
}

async function sendCancellationEmail(booking) {
    const recipientEmail = normalizeEmail(booking?.ownerEmail || booking?.passengerEmail);
    if (!recipientEmail) {
        return;
    }

    try {
        const { response, data } = await profileRequest("/api/notifications/email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                type: "booking_cancelled",
                email: recipientEmail,
                name: booking?.passengerName || "",
                bookingId: booking?.bookingId || "",
                from: booking?.from || "",
                to: booking?.to || "",
                busName: booking?.busName || "",
                departureTime: booking?.departureTime || "",
                journeyDate: booking?.journeyDate || "",
                seats: booking?.seats || "",
                paymentMethod: booking?.paymentMethod || "",
                amount: Number(booking?.amount || 0),
                discountAmount: Number(booking?.discountAmount || 0),
                transactionId: booking?.transactionId || ""
            })
        });

        if (!response.ok || data.success === false) {
            alert(data.message || "Ticket cancelled, but email notification failed.");
        }
    } catch (error) {
        alert("Ticket cancelled, but email notification failed because the backend is not reachable.");
    }
}

async function sendRefundEmail(booking) {
    const recipientEmail = normalizeEmail(booking?.ownerEmail || booking?.passengerEmail);
    if (!recipientEmail) {
        return;
    }

    try {
        const { response, data } = await profileRequest("/api/notifications/email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                type: "booking_refunded",
                email: recipientEmail,
                name: booking?.passengerName || "",
                bookingId: booking?.bookingId || "",
                from: booking?.from || "",
                to: booking?.to || "",
                busName: booking?.busName || "",
                departureTime: booking?.departureTime || "",
                journeyDate: booking?.journeyDate || "",
                seats: booking?.seats || "",
                paymentMethod: booking?.paymentMethod || "",
                amount: Number(booking?.refundAmount || booking?.amount || 0),
                discountAmount: Number(booking?.discountAmount || 0),
                transactionId: booking?.transactionId || ""
            })
        });

        if (!response.ok || data.success === false) {
            alert(data.message || "Refund completed, but email notification failed.");
        }
    } catch (error) {
        alert("Refund completed, but email notification failed because the backend is not reachable.");
    }
}

async function cancelUserBooking(bookingId) {
    const persistLocal = !isAdminSession();
    const history = getBookingHistoryStore();
    const cancelledBooking = history.find((booking) => booking?.bookingId === bookingId);
    if (!cancelledBooking) {
        return;
    }
    if (isJourneyCompleted(cancelledBooking)) {
        alert("Journey completed tickets cannot be cancelled.");
        return;
    }

    const cancelledAt = new Date().toISOString();
    const updatedHistory = history.map((booking) => {
        if (booking?.bookingId !== bookingId) {
            return booking;
        }

        return {
            ...booking,
            status: "Cancelled",
            cancelledAt
        };
    });

    setBookingHistoryStore(updatedHistory, { persistLocal });

    try {
        const syncedBooking = await updateBookingStatusOnBackend({
            bookingId,
            status: "Cancelled",
            cancelledAt,
            refundStatus: "",
            refundAmount: 0,
            refundedAt: ""
        });
        replaceBookingInStore(syncedBooking, { persistLocal });
    } catch (error) {
        alert(error?.message || "Ticket cancelled locally, but backend update failed.");
    }

    void sendCancellationEmail({
        ...cancelledBooking,
        status: "Cancelled",
        cancelledAt
    });
}

async function refundBooking(bookingId) {
    const persistLocal = !isAdminSession();
    const history = getBookingHistoryStore();
    const existingBooking = history.find((booking) => booking?.bookingId === bookingId);

    if (!existingBooking || existingBooking.status !== "Cancelled") {
        return;
    }

    const refundedAt = new Date().toISOString();
    const refundAmount = Number(existingBooking.amount || 0);
    const updatedHistory = history.map((booking) => {
        if (booking?.bookingId !== bookingId) {
            return booking;
        }

        return {
            ...booking,
            status: "Refunded",
            refundStatus: "Successful",
            refundAmount,
            refundedAt
        };
    });

    setBookingHistoryStore(updatedHistory, { persistLocal });

    try {
        const syncedBooking = await updateBookingStatusOnBackend({
            bookingId,
            status: "Refunded",
            cancelledAt: existingBooking.cancelledAt || "",
            refundStatus: "Successful",
            refundAmount,
            refundedAt
        });
        replaceBookingInStore(syncedBooking, { persistLocal });
    } catch (error) {
        alert(error?.message || "Refund was updated locally, but backend update failed.");
    }

    void sendRefundEmail({
        ...existingBooking,
        status: "Refunded",
        refundStatus: "Successful",
        refundAmount,
        refundedAt
    });

    alert("Refund successful.");
}

function removeUserBooking(bookingId) {
    const persistLocal = !isAdminSession();
    const history = getBookingHistoryStore();
    const updatedHistory = history.filter((booking) => booking?.bookingId !== bookingId);
    setBookingHistoryStore(updatedHistory, { persistLocal });
}

function getPaymentMethodLabel(booking) {
    const value = String(booking?.paymentMethod || "").trim();
    return value || "Not available";
}

function renderUserBookings(bookingList, bookings) {
    bookingList.innerHTML = bookings.map((b) => {
        const bookedAt = b.bookedAt ? new Date(b.bookedAt).toLocaleString() : "-";
        const isCancelled = b?.status === "Cancelled";
        const isRefunded = b?.status === "Refunded";
        const isCompleted = isJourneyCompleted(b);
        const cancelledAt = b.cancelledAt ? new Date(b.cancelledAt).toLocaleString() : "";
        const refundedAt = b.refundedAt ? new Date(b.refundedAt).toLocaleString() : "";
        return `
            <div class="booking-item">
                <div class="booking-top">
                    <span class="booking-id">${escapeHtml(b.bookingId || "-")}</span>
                    <div class="booking-top-meta">
                        ${getStatusBadge(b.status, b)}
                        <span>${escapeHtml(bookedAt)}</span>
                    </div>
                </div>
                <div class="booking-route-row">
                    <div class="booking-route-copy">
                        <strong>${escapeHtml(b.from || "-")} -> ${escapeHtml(b.to || "-")}</strong>
                        <span class="booking-bus-name">${escapeHtml(b.busName || "-")}</span>
                    </div>
                </div>
                <div class="booking-details-grid">
                    <div class="booking-detail-card">
                        <span class="booking-label">Passenger</span>
                        <strong>${escapeHtml(b.passengerName || "-")}</strong>
                        <span>${escapeHtml(b.passengerMobile || "-")}</span>
                    </div>
                    <div class="booking-detail-card">
                        <span class="booking-label">Email</span>
                        <strong>${escapeHtml(b.passengerEmail || "-")}</strong>
                    </div>
                    <div class="booking-detail-card">
                        <span class="booking-label">Journey Date</span>
                        <strong>${escapeHtml(b.journeyDate || "-")}</strong>
                    </div>
                    <div class="booking-detail-card">
                        <span class="booking-label">Seat Number</span>
                        <strong>${escapeHtml(b.seats || "-")}</strong>
                    </div>
                    <div class="booking-detail-card">
                        <span class="booking-label">Transaction Type</span>
                        <strong>${escapeHtml(getPaymentMethodLabel(b))}</strong>
                    </div>
                    <div class="booking-detail-card booking-detail-card-strong">
                        <span class="booking-label">Paid Amount</span>
                        <strong>Rs.${escapeHtml(b.amount || "-")}</strong>
                    </div>
                    <div class="booking-detail-card booking-detail-card-accent">
                        <span class="booking-label">Discount</span>
                        <strong>Rs.${escapeHtml(b.discountAmount || 0)}</strong>
                    </div>
                    <div class="booking-detail-card booking-detail-card-wide">
                        <span class="booking-label">Transaction ID</span>
                        <strong>${escapeHtml(b.transactionId || "-")}</strong>
                    </div>
                    ${isRefunded ? `
                        <div class="booking-detail-card booking-detail-card-refund">
                            <span class="booking-label">Refund</span>
                            <strong>${escapeHtml(b.refundStatus || "Successful")}</strong>
                        </div>
                        <div class="booking-detail-card booking-detail-card-accent">
                            <span class="booking-label">Refund Amount</span>
                            <strong>Rs.${escapeHtml(b.refundAmount || b.amount || 0)}</strong>
                        </div>
                    ` : ""}
                    ${isCancelled ? `
                        <div class="booking-detail-card booking-detail-card-wide">
                            <span class="booking-label">Cancelled At</span>
                            <strong>${escapeHtml(cancelledAt || "-")}</strong>
                        </div>
                    ` : ""}
                    ${isRefunded ? `
                        <div class="booking-detail-card booking-detail-card-wide">
                            <span class="booking-label">Refunded At</span>
                            <strong>${escapeHtml(refundedAt || "-")}</strong>
                        </div>
                    ` : ""}
                </div>
                <div class="booking-actions">
                    ${isCompleted ? "" : `
                    <button class="btn btn-cancel" data-action="cancel-booking" data-booking-id="${escapeHtml(b.bookingId || "")}" ${(isCancelled || isRefunded) ? "disabled" : ""}>
                        ${isRefunded ? "Refund Successful" : (isCancelled ? "Cancelled" : "Cancel Ticket")}
                    </button>
                    `}
                    <button class="btn btn-remove" data-action="remove-booking" data-booking-id="${escapeHtml(b.bookingId || "")}" ${isCancelled || isRefunded ? "" : "disabled"}>
                        Remove
                    </button>
                </div>
            </div>
        `;
    }).join("");
}

function renderAdminRoutes(bookingList, routes) {
    setAdminCurrentView("All Routes");
    bookingList.innerHTML = `
        <div class="booking-toolbar">
            <div class="booking-path">Routes</div>
        </div>
        <div class="booking-grid">
            ${routes.map((route) => `
                <div class="group-card">
                    <h3>${escapeHtml(route.from)} -> ${escapeHtml(route.to)}</h3>
                    <div class="group-meta">
                        <div><strong>Bookings:</strong> ${route.bookings.length}</div>
                        <div><strong>Active Tickets:</strong> ${getBookedCount(route.bookings)}</div>
                        <div><strong>Cancelled:</strong> ${getCancelledCount(route.bookings)}</div>
                        <div><strong>Pending Refunds:</strong> ${getPendingRefundCount(route.bookings)}</div>
                        <div><strong>Buses:</strong> ${groupByBus(route.bookings).length}</div>
                        <div><strong>Latest Ticket:</strong> ${escapeHtml(getLatestBookedAt(route.bookings))}</div>
                    </div>
                    <button class="btn btn-inline" data-action="view-route" data-route-key="${escapeHtml(route.routeKey)}">View Buses</button>
                </div>
            `).join("")}
        </div>
    `;
}

function renderAdminBuses(bookingList, routeGroup, buses) {
    setAdminCurrentView(`${routeGroup.from} -> ${routeGroup.to}`);
    bookingList.innerHTML = `
        <div class="booking-toolbar">
            <div class="booking-path">Routes / ${escapeHtml(routeGroup.from)} -> ${escapeHtml(routeGroup.to)}</div>
            <button class="btn btn-ghost" data-action="back-routes">Back to Routes</button>
        </div>
        <div class="booking-grid">
            ${buses.map((bus) => `
                <div class="group-card">
                    <h3>${escapeHtml(bus.busName)}</h3>
                    <div class="group-meta">
                        <div><strong>Route:</strong> ${escapeHtml(routeGroup.from)} -> ${escapeHtml(routeGroup.to)}</div>
                        <div><strong>Tickets:</strong> ${bus.bookings.length}</div>
                        <div><strong>Active Tickets:</strong> ${getBookedCount(bus.bookings)}</div>
                        <div><strong>Cancelled:</strong> ${getCancelledCount(bus.bookings)}</div>
                        <div><strong>Pending Refunds:</strong> ${getPendingRefundCount(bus.bookings)}</div>
                        <div><strong>Latest Ticket:</strong> ${escapeHtml(getLatestBookedAt(bus.bookings))}</div>
                    </div>
                    <button class="btn btn-inline" data-action="view-bus" data-bus-key="${escapeHtml(bus.busKey)}">View Tickets</button>
                </div>
            `).join("")}
        </div>
    `;
}

function renderAdminTickets(bookingList, routeGroup, busGroup) {
    const showingCancelled = adminBookingState.ticketFilter === "cancelled";
    const showingRefunded = adminBookingState.ticketFilter === "refunded";
    setAdminCurrentView(`${busGroup.busName} / ${showingRefunded ? "Refunds" : (showingCancelled ? "Cancelled" : "Bookings")}`);
    const filteredBookings = busGroup.bookings.filter((booking) => {
        if (showingRefunded) {
            return booking?.status === "Refunded";
        }

        if (showingCancelled) {
            return booking?.status === "Cancelled";
        }

        return (booking?.status || "Booked") === "Booked";
    });

    bookingList.innerHTML = `
        <div class="booking-toolbar">
            <div class="booking-path">
                Routes / ${escapeHtml(routeGroup.from)} -> ${escapeHtml(routeGroup.to)} / ${escapeHtml(busGroup.busName)} / ${showingRefunded ? "Refund Details" : (showingCancelled ? "Cancelled Details" : "Booking Details")}
            </div>
            <div class="booking-toolbar-actions">
                <div class="ticket-filter-group">
                    <button class="btn btn-filter ${adminBookingState.ticketFilter === "booked" ? "active" : ""}" data-action="show-booked">Bookings</button>
                    <button class="btn btn-filter ${adminBookingState.ticketFilter === "cancelled" ? "active" : ""}" data-action="show-cancelled">Cancelled</button>
                    <button class="btn btn-filter ${adminBookingState.ticketFilter === "refunded" ? "active" : ""}" data-action="show-refunded">Refund</button>
                </div>
                <button class="btn btn-ghost" data-action="back-buses">Back to Buses</button>
            </div>
        </div>
        <div class="booking-list">
            ${filteredBookings.length ? filteredBookings.map((b) => {
                const bookedAt = b.bookedAt ? new Date(b.bookedAt).toLocaleString() : "-";
                const cancelledAt = b.cancelledAt ? new Date(b.cancelledAt).toLocaleString() : "";
                const refundedAt = b.refundedAt ? new Date(b.refundedAt).toLocaleString() : "";
                const isRefunded = b?.status === "Refunded";
                return `
                    <div class="booking-item">
                        <div class="booking-top">
                            <span class="booking-id">${escapeHtml(b.bookingId || "-")}</span>
                            <div class="booking-top-meta">
                                ${getStatusBadge(b.status)}
                                <span>${escapeHtml(bookedAt)}</span>
                            </div>
                        </div>
                        <div class="booking-route-row">
                            <div class="booking-route-copy">
                                <strong>${escapeHtml(b.from || "-")} -> ${escapeHtml(b.to || "-")}</strong>
                                <span class="booking-bus-name">${escapeHtml(b.busName || "-")}</span>
                            </div>
                        </div>
                        <div class="booking-details-grid">
                            <div class="booking-detail-card">
                                <span class="booking-label">Passenger</span>
                                <strong>${escapeHtml(b.passengerName || "-")}</strong>
                                <span>${escapeHtml(b.passengerMobile || "-")}</span>
                            </div>
                            <div class="booking-detail-card">
                                <span class="booking-label">Email</span>
                                <strong>${escapeHtml(b.passengerEmail || "-")}</strong>
                            </div>
                            <div class="booking-detail-card">
                                <span class="booking-label">Journey Date</span>
                                <strong>${escapeHtml(b.journeyDate || "-")}</strong>
                            </div>
                            <div class="booking-detail-card">
                                <span class="booking-label">Seat Number</span>
                                <strong>${escapeHtml(b.seats || "-")}</strong>
                            </div>
                            <div class="booking-detail-card">
                                <span class="booking-label">Transaction Type</span>
                                <strong>${escapeHtml(getPaymentMethodLabel(b))}</strong>
                            </div>
                            <div class="booking-detail-card booking-detail-card-strong">
                                <span class="booking-label">Paid Amount</span>
                                <strong>Rs.${escapeHtml(b.amount || "-")}</strong>
                            </div>
                            <div class="booking-detail-card booking-detail-card-accent">
                                <span class="booking-label">Discount</span>
                                <strong>Rs.${escapeHtml(b.discountAmount || 0)}</strong>
                            </div>
                            <div class="booking-detail-card booking-detail-card-wide">
                                <span class="booking-label">Transaction ID</span>
                                <strong>${escapeHtml(b.transactionId || "-")}</strong>
                            </div>
                            ${b?.status === "Cancelled" ? `
                                <div class="booking-detail-card booking-detail-card-wide">
                                    <span class="booking-label">Cancelled At</span>
                                    <strong>${escapeHtml(cancelledAt || "-")}</strong>
                                </div>
                            ` : ""}
                            ${isRefunded ? `
                                <div class="booking-detail-card booking-detail-card-refund">
                                    <span class="booking-label">Refund</span>
                                    <strong>${escapeHtml(b.refundStatus || "Successful")}</strong>
                                </div>
                                <div class="booking-detail-card booking-detail-card-accent">
                                    <span class="booking-label">Refund Amount</span>
                                    <strong>Rs.${escapeHtml(b.refundAmount || b.amount || 0)}</strong>
                                </div>
                                <div class="booking-detail-card booking-detail-card-wide">
                                    <span class="booking-label">Refunded At</span>
                                    <strong>${escapeHtml(refundedAt || "-")}</strong>
                                </div>
                            ` : ""}
                        </div>
                        ${b?.status === "Cancelled" ? `
                            <div class="booking-actions">
                                <button class="btn btn-refund" data-action="refund-booking" data-booking-id="${escapeHtml(b.bookingId || "")}">
                                    Refund
                                </button>
                            </div>
                        ` : ""}
                    </div>
                `;
            }).join("") : `<div class="booking-empty">${showingRefunded ? "No refund details found in this bus." : (showingCancelled ? "No cancelled details found in this bus." : "No booking details found in this bus.")}</div>`}
        </div>
    `;
}

function renderAdminBookings(bookingList, bookings) {
    const routes = groupByRoute(bookings);
    const bookingSectionTitle = document.getElementById("bookingSectionTitle");
    updateAdminDashboard(bookings);
    const selectedRoute = routes.find((route) => route.routeKey === adminBookingState.routeKey);

    if (!selectedRoute) {
        adminBookingState.routeKey = "";
        adminBookingState.busKey = "";
        bookingSectionTitle.textContent = "Route Explorer";
        renderAdminRoutes(bookingList, routes);
        return;
    }

    const buses = groupByBus(selectedRoute.bookings);
    const selectedBus = buses.find((bus) => bus.busKey === adminBookingState.busKey);

    if (!selectedBus) {
        adminBookingState.busKey = "";
        bookingSectionTitle.textContent = `Bus Explorer: ${selectedRoute.from} -> ${selectedRoute.to}`;
        renderAdminBuses(bookingList, selectedRoute, buses);
        return;
    }

    bookingSectionTitle.textContent = adminBookingState.ticketFilter === "refunded"
        ? `Refund Desk: ${selectedBus.busName}`
        : (adminBookingState.ticketFilter === "cancelled"
        ? `Cancellation Desk: ${selectedBus.busName}`
        : `Booking Desk: ${selectedBus.busName}`);
    renderAdminTickets(bookingList, selectedRoute, selectedBus);
}

function renderBookings() {
    const bookingSectionTitle = document.getElementById("bookingSectionTitle");
    const bookingList = document.getElementById("bookingList");
    const isAdmin = isAdminSession();
    const bookings = getVisibleBookings();

    bookingList.classList.toggle("user-booking-list", !isAdmin);

    if (!bookings.length) {
        if (isAdmin) {
            updateAdminDashboard([]);
            setAdminCurrentView("No Data");
            bookingSectionTitle.textContent = "Route Explorer";
            bookingList.innerHTML = '<div class="booking-empty">No bookings found.</div>';
            return;
        }

        updateUserDashboard([]);
        bookingSectionTitle.textContent = "My Trips";
        bookingList.innerHTML = isAdmin
            ? '<div class="booking-empty">No bookings found.</div>'
            : '<div class="booking-empty">No trips found for this account yet.</div>';
        return;
    }

    if (isAdmin) {
        renderAdminBookings(bookingList, bookings);
        return;
    }

    bookingSectionTitle.textContent = "My Trips";
    updateUserDashboard(bookings);
    renderUserBookings(bookingList, bookings);
}

function attachActions() {
    document.getElementById("backBtn").addEventListener("click", () => {
        window.location.href = "index.html";
    });

    document.getElementById("logoutBtn").addEventListener("click", () => {
        [
            "adminLoggedIn",
            "adminIdentity",
            "userOTPVerified",
            "googleLogin",
            "userEmail",
            "userIdentity",
            "userName",
            "userMobile",
            "mobile",
            "loginType",
            "otpMode",
            "mockOTP",
            "mockOTPExpiry",
            "userPassword"
        ].forEach((k) => localStorage.removeItem(k));

        window.location.href = "index.html";
    });

    document.getElementById("bookingList").addEventListener("click", async (event) => {
        const actionButton = event.target.closest("[data-action]");
        if (!actionButton) {
            return;
        }

        const action = actionButton.dataset.action;
        if (action === "view-route") {
            adminBookingState.routeKey = actionButton.dataset.routeKey || "";
            adminBookingState.busKey = "";
            adminBookingState.ticketFilter = "booked";
        } else if (action === "view-bus") {
            adminBookingState.busKey = actionButton.dataset.busKey || "";
            adminBookingState.ticketFilter = "booked";
        } else if (action === "cancel-booking") {
            await cancelUserBooking(actionButton.dataset.bookingId || "");
        } else if (action === "remove-booking") {
            removeUserBooking(actionButton.dataset.bookingId || "");
        } else if (action === "refund-booking") {
            await refundBooking(actionButton.dataset.bookingId || "");
        } else if (action === "show-booked") {
            adminBookingState.ticketFilter = "booked";
        } else if (action === "show-cancelled") {
            adminBookingState.ticketFilter = "cancelled";
        } else if (action === "show-refunded") {
            adminBookingState.ticketFilter = "refunded";
        } else if (action === "back-routes") {
            adminBookingState.routeKey = "";
            adminBookingState.busKey = "";
            adminBookingState.ticketFilter = "booked";
        } else if (action === "back-buses") {
            adminBookingState.busKey = "";
            adminBookingState.ticketFilter = "booked";
        }

        renderBookings();
    });
}

document.addEventListener("DOMContentLoaded", async () => {
    if (!isLoggedIn()) {
        window.location.href = "login.html";
        return;
    }

    enforceSessionDashboard();

    if (isAdminSession()) {
        await loadAdminBookingsFromBackend();
    }

    fillProfile();
    renderBookings();
    attachActions();
});

window.addEventListener("storage", refreshProfilePage);
window.addEventListener("focus", refreshProfilePage);

const PROFILE_API_BASES = window.YUBUS_API?.getBases?.() || [
    "http://localhost:8000",
    "http://127.0.0.1:8000"
];
const PROFILE_USERS_KEY = "registeredUsers";
const PROFILE_EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PROFILE_MOBILE_REGEX = /^[6-9]\d{9}$/;
let currentProfileCache = null;
let currentBookingCache = null;

function enforceSessionDashboard() {
    const isAdmin = isAdminSession();
    const adminDashboard = document.getElementById("adminDashboardPanel");
    const userDashboard = document.getElementById("userDashboardPanel");
    const adminCityOptions = document.getElementById("adminCityOptions");

    if (isAdmin) {
        if (userDashboard) {
            userDashboard.remove();
        }
        return;
    }

    if (adminDashboard) {
        adminDashboard.remove();
    }

    if (adminCityOptions) {
        adminCityOptions.remove();
    }
}

function buildProfileApiUrl(path, base) {
    if (window.YUBUS_API?.buildUrl) {
        return window.YUBUS_API.buildUrl(path, base);
    }

    return `${base}${path}`;
}

async function profileRequest(path, options = {}) {
    let lastError;
    for (const base of PROFILE_API_BASES) {
        try {
            const response = await fetch(buildProfileApiUrl(path, base), options);
            const data = await response.json().catch(() => ({}));
            return { response, data };
        } catch (error) {
            lastError = error;
        }
    }
    throw lastError || new Error("Backend not reachable");
}

function profileMobile(value) {
    return (value || "").replace(/\D/g, "").slice(-10);
}

function getRegisteredUsers() {
    try {
    const parsedUsers = JSON.parse(localStorage.getItem(PROFILE_USERS_KEY) || "[]"); // Synced with login.js
        if (!Array.isArray(parsedUsers)) {
            return [];
        }
        return parsedUsers.map((user) => ({
            name: typeof user?.name === "string" ? user.name.trim() : "",
            mobile: profileMobile(user?.mobile),
            email: normalizeEmail(user?.email),
            password: typeof user?.password === "string" ? user.password : ""
        }));
    } catch (error) {
        return [];
    }
}

function saveRegisteredUsers(users) {
    localStorage.setItem(PROFILE_USERS_KEY, JSON.stringify(users));
}

function storeProfileLocally(profile) {
    const email = normalizeEmail(profile?.email);
    const name = (profile?.name || "").trim();
    const mobile = profileMobile(profile?.mobile);

    if (email) {
        localStorage.setItem("userEmail", email);
        localStorage.setItem("userIdentity", email);
    }
    localStorage.setItem("userName", name);
    localStorage.setItem("userMobile", mobile);

    if (mobile) {
        localStorage.setItem("mobile", mobile);
    } else {
        localStorage.removeItem("mobile");
    }
}

function isAdminSession() {
    return localStorage.getItem("adminLoggedIn") === "true";
}

function getLocalBookingHistory() {
    try {
        const parsedBookings = JSON.parse(localStorage.getItem("bookingHistory") || "[]");
        return Array.isArray(parsedBookings) ? parsedBookings : [];
    } catch (error) {
        return [];
    }
}

function getBookingHistoryStore() {
    return Array.isArray(currentBookingCache) ? currentBookingCache : getLocalBookingHistory();
}

function setBookingHistoryStore(bookings, options = {}) {
    const persistLocal = options.persistLocal === true;
    const nextBookings = Array.isArray(bookings) ? bookings : [];
    currentBookingCache = nextBookings;

    if (persistLocal) {
        localStorage.setItem("bookingHistory", JSON.stringify(nextBookings));
    }
}

function normalizeBookingRecord(booking) {
    return {
        bookingId: booking?.bookingId || "",
        from: booking?.from || booking?.fromCity || "",
        to: booking?.to || booking?.toCity || "",
        busName: booking?.busName || "",
        seats: booking?.seats || "",
        journeyDate: booking?.journeyDate || "",
        departureTime: booking?.departureTime || "",
        originalAmount: Number(booking?.originalAmount || 0),
        amount: Number(booking?.amount || 0),
        discountAmount: Number(booking?.discountAmount || 0),
        passengerName: booking?.passengerName || "",
        passengerMobile: booking?.passengerMobile || "",
        passengerEmail: booking?.passengerEmail || "",
        ownerEmail: booking?.ownerEmail || booking?.passengerEmail || "",
        ownerMobile: booking?.ownerMobile || booking?.passengerMobile || "",
        paymentMethod: booking?.paymentMethod || "",
        transactionId: booking?.transactionId || "",
        status: booking?.status || "Booked",
        bookedAt: booking?.bookedAt || "",
        cancelledAt: booking?.cancelledAt || "",
        refundStatus: booking?.refundStatus || "",
        refundAmount: Number(booking?.refundAmount || 0),
        refundedAt: booking?.refundedAt || ""
    };
}

function replaceBookingInStore(nextBooking, options = {}) {
    const bookingId = nextBooking?.bookingId;
    if (!bookingId) {
        return;
    }

    const history = getBookingHistoryStore();
    const normalizedBooking = normalizeBookingRecord(nextBooking);
    let found = false;
    const updatedHistory = history.map((booking) => {
        if (booking?.bookingId !== bookingId) {
            return booking;
        }

        found = true;
        return normalizedBooking;
    });

    if (!found) {
        updatedHistory.unshift(normalizedBooking);
    }

    setBookingHistoryStore(updatedHistory, options);
}

async function updateBookingStatusOnBackend(payload) {
    const { response, data } = await profileRequest("/api/bookings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    });

    if (!response.ok || data.success === false || !data.booking) {
        throw new Error(data.message || "Failed to update booking");
    }

    return normalizeBookingRecord(data.booking);
}

async function loadAdminBookingsFromBackend() {
    if (!isAdminSession()) {
        currentBookingCache = null;
        return;
    }

    try {
        const { response, data } = await profileRequest("/api/bookings?admin=true");
        if (!response.ok || data.success === false || !Array.isArray(data.data)) {
            return;
        }

        setBookingHistoryStore(data.data.map(normalizeBookingRecord), { persistLocal: true });
    } catch (error) {
        currentBookingCache = getLocalBookingHistory();
    }
}

function getCurrentUserProfile() {
    const email = normalizeEmail(localStorage.getItem("userEmail") || localStorage.getItem("userIdentity"));
    const registered = getRegisteredUsers().find((user) => user.email === email);
    const profile = {
        email,
        name: registered?.name || (localStorage.getItem("userName") || "").trim(),
        mobile: registered?.mobile || profileMobile(localStorage.getItem("userMobile") || localStorage.getItem("mobile"))
    };
    storeProfileLocally(profile);
    return profile;
}

function formatDateTime(value) {
    if (!value) {
        return "-";
    }

    const parsedDate = new Date(value);
    if (Number.isNaN(parsedDate.getTime())) {
        return String(value);
    }

    return parsedDate.toLocaleString();
}

function formatCurrency(value) {
    return `Rs.${Number(value || 0).toLocaleString("en-IN")}`;
}

function getUpcomingUserBooking(bookings) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return [...bookings]
        .filter((booking) => {
            if ((booking?.status || "Booked") !== "Booked" || !booking?.journeyDate) {
                return false;
            }

            const journeyDate = new Date(`${booking.journeyDate}T00:00:00`);
            return !Number.isNaN(journeyDate.getTime()) && journeyDate >= today;
        })
        .sort((a, b) => new Date(`${a.journeyDate}T00:00:00`) - new Date(`${b.journeyDate}T00:00:00`))[0] || null;
}

function getLatestUserBooking(bookings) {
    return [...bookings]
        .filter((booking) => booking?.bookedAt)
        .sort((a, b) => new Date(b.bookedAt) - new Date(a.bookedAt))[0] || null;
}

function updateUserDashboard(bookings) {
    const dashboard = document.getElementById("userDashboardPanel");
    const title = document.getElementById("userDashboardTitle");
    const subtitle = document.getElementById("userDashboardSubtitle");
    const identity = document.getElementById("userDashboardIdentity");
    const statsGrid = document.getElementById("userStatsGrid");
    const snapshot = document.getElementById("userJourneySnapshot");
    const highlights = document.getElementById("userAccountHighlights");
    const profile = currentProfileCache || getCurrentUserProfile();
    const upcomingTrip = getUpcomingUserBooking(bookings);
    const latestBooking = getLatestUserBooking(bookings);
    const totalDiscount = bookings.reduce((sum, booking) => {
        if (booking?.status === "Refunded") {
            return sum;
        }

        return sum + Number(booking?.discountAmount || 0);
    }, 0);
    const totalSpent = bookings.reduce((sum, booking) => {
        if (booking?.status === "Refunded") {
            return sum;
        }

        return sum + Number(booking?.amount || 0);
    }, 0);
    const activeTickets = bookings.filter((booking) => (booking?.status || "Booked") === "Booked").length;
    const closedTickets = bookings.filter((booking) => booking?.status === "Cancelled" || booking?.status === "Refunded").length;

    if (dashboard) {
        dashboard.classList.remove("hidden");
    }

    if (title) {
        title.textContent = profile?.name ? `Welcome back, ${profile.name}` : "Your Travel Dashboard";
    }

    if (subtitle) {
        subtitle.textContent = bookings.length
            ? `You have ${activeTickets} active ticket${activeTickets === 1 ? "" : "s"} and ${bookings.length} travel record${bookings.length === 1 ? "" : "s"} in your account.`
            : "Track your bookings, upcoming trips, and account details from one place.";
    }

    if (identity) {
        identity.textContent = profile?.name || profile?.email || "Traveller";
    }

    if (statsGrid) {
        const stats = [
            {
                label: "Total Trips",
                value: bookings.length,
                note: "All journeys in your account"
            },
            {
                label: "Active Tickets",
                value: activeTickets,
                note: upcomingTrip ? `Next trip on ${upcomingTrip.journeyDate}` : "No upcoming journey yet"
            },
            {
                label: "Closed Tickets",
                value: closedTickets,
                note: "Cancelled or refunded tickets"
            },
            {
                label: "Total Spend",
                value: formatCurrency(totalSpent),
                note: "Across non-refunded bookings"
            },
            {
                label: "Discount Saved",
                value: formatCurrency(totalDiscount),
                note: "Total savings from applied offers"
            }
        ];

        statsGrid.innerHTML = stats.map((stat) => `
            <div class="user-stat-card">
                <span class="user-stat-label">${escapeHtml(stat.label)}</span>
                <strong class="user-stat-value">${escapeHtml(stat.value)}</strong>
                <span class="user-stat-note">${escapeHtml(stat.note)}</span>
            </div>
        `).join("");
    }

    if (snapshot) {
        const items = [];

        if (upcomingTrip) {
            items.push({
                title: `Upcoming: ${upcomingTrip.from || "-"} -> ${upcomingTrip.to || "-"}`,
                meta: `${upcomingTrip.busName || "-"} | ${upcomingTrip.journeyDate || "-"} | Seats ${upcomingTrip.seats || "-"}`
            });
        } else {
            items.push({
                title: "No upcoming trip",
                meta: "Book your next journey to see your next active ticket here."
            });
        }

        if (latestBooking) {
            items.push({
                title: `Last booked: ${latestBooking.from || "-"} -> ${latestBooking.to || "-"}`,
                meta: `${formatDateTime(latestBooking.bookedAt)} | ${latestBooking.busName || "-"}`
            });
        }

        snapshot.innerHTML = items.map((item) => `
            <div class="user-summary-item">
                <div class="user-summary-title">${escapeHtml(item.title)}</div>
                <div class="user-summary-meta">${escapeHtml(item.meta)}</div>
            </div>
        `).join("");
    }

    if (highlights) {
        const items = [
            {
                title: "Saved Email",
                meta: profile?.email || "Email not available"
            },
            {
                title: "Saved Mobile",
                meta: profile?.mobile || "Mobile number not added"
            },
            {
                title: "Travel Status",
                meta: activeTickets ? "You currently have active travel plans." : "You can start a new booking anytime."
            }
        ];

        highlights.innerHTML = items.map((item) => `
            <div class="user-summary-item">
                <div class="user-summary-title">${escapeHtml(item.title)}</div>
                <div class="user-summary-meta">${escapeHtml(item.meta)}</div>
            </div>
        `).join("");
    }
}

function getRefundedCount(bookings) {
    return bookings.filter((booking) => booking?.status === "Refunded").length;
}

function getTotalSalesAmount(bookings) {
    return bookings.reduce((sum, booking) => sum + Number(booking?.amount || 0), 0);
}

function getTotalRefundAmount(bookings) {
    return bookings.reduce((sum, booking) => {
        if (booking?.status !== "Refunded") {
            return sum;
        }

        return sum + Number(booking?.refundAmount || booking?.amount || 0);
    }, 0);
}

function getLatestActivityTime(booking) {
    return booking?.refundedAt || booking?.cancelledAt || booking?.bookedAt || "";
}

function getStatusChipClass(status) {
    if (status === "Refunded") {
        return "admin-chip-refunded";
    }

    if (status === "Cancelled") {
        return "admin-chip-cancelled";
    }

    return "admin-chip-booked";
}

function setAdminCurrentView(label) {
    const currentView = document.getElementById("adminCurrentView");
    if (currentView) {
        currentView.textContent = label;
    }
}

function renderAdminStats(bookings) {
    const statsGrid = document.getElementById("adminStatsGrid");
    if (!statsGrid) {
        return;
    }

    const routes = groupByRoute(bookings);
    const buses = groupByBus(bookings);
    const customFleetCount = readAdminManagedBuses().length;
    const stats = [
        {
            label: "Total Bookings",
            value: bookings.length,
            note: `${routes.length} active routes`
        },
        {
            label: "Live Tickets",
            value: getBookedCount(bookings),
            note: "Currently in booked status"
        },
        {
            label: "Cancelled",
            value: getCancelledCount(bookings),
            note: "Awaiting or completed action"
        },
        {
            label: "Refunded",
            value: getRefundedCount(bookings),
            note: formatCurrency(getTotalRefundAmount(bookings))
        },
        {
            label: "Buses",
            value: buses.length + customFleetCount,
            note: `${buses.length} with booking data, ${customFleetCount} custom fleet`
        },
        {
            label: "Gross Sales",
            value: formatCurrency(getTotalSalesAmount(bookings)),
            note: "Across all recorded bookings"
        }
    ];

    statsGrid.innerHTML = stats.map((stat) => `
        <div class="admin-stat-card">
            <span class="admin-stat-label">${escapeHtml(stat.label)}</span>
            <strong class="admin-stat-value">${escapeHtml(stat.value)}</strong>
            <span class="admin-stat-note">${escapeHtml(stat.note)}</span>
        </div>
    `).join("");
}

function renderAdminRecentActivity(bookings) {
    const activityList = document.getElementById("adminRecentActivity");
    if (!activityList) {
        return;
    }

    const recentBookings = [...bookings]
        .filter((booking) => getLatestActivityTime(booking))
        .sort((a, b) => new Date(getLatestActivityTime(b)) - new Date(getLatestActivityTime(a)))
        .slice(0, 4);

    if (!recentBookings.length) {
        activityList.innerHTML = '<div class="admin-empty-note">No recent booking activity is available yet.</div>';
        return;
    }

    activityList.innerHTML = recentBookings.map((booking) => {
        const status = booking?.status || "Booked";
        return `
            <div class="admin-activity-item">
                <div class="admin-activity-top">
                    <span class="admin-activity-title">${escapeHtml(booking?.from || "-")} -> ${escapeHtml(booking?.to || "-")}</span>
                    <span class="admin-chip ${getStatusChipClass(status)}">${escapeHtml(status)}</span>
                </div>
                <div class="admin-activity-meta">
                    ${escapeHtml(booking?.busName || "-")} | ${escapeHtml(booking?.bookingId || "-")} | ${escapeHtml(formatDateTime(getLatestActivityTime(booking)))}
                </div>
                <div class="admin-activity-meta">
                    ${escapeHtml(booking?.passengerName || "Passenger")} | ${escapeHtml(booking?.seats || "-")}
                </div>
            </div>
        `;
    }).join("");
}

function renderAdminSnapshot(bookings) {
    const snapshot = document.getElementById("adminSnapshot");
    if (!snapshot) {
        return;
    }

    const routes = groupByRoute(bookings).sort((a, b) => b.bookings.length - a.bookings.length);
    const buses = groupByBus(bookings).sort((a, b) => b.bookings.length - a.bookings.length);
    const latestBooking = [...bookings]
        .filter((booking) => booking?.bookedAt)
        .sort((a, b) => new Date(b.bookedAt) - new Date(a.bookedAt))[0];
    const snapshotItems = [
        {
            title: "Busiest Route",
            meta: routes.length
                ? `${routes[0].from} -> ${routes[0].to} with ${routes[0].bookings.length} bookings`
                : "No route data available"
        },
        {
            title: "Top Bus",
            meta: buses.length
                ? `${buses[0].busName} handling ${buses[0].bookings.length} tickets`
                : "No bus data available"
        },
        {
            title: "Refund Queue",
            meta: `${getCancelledCount(bookings)} cancelled tickets pending attention`
        },
        {
            title: "Last Booking",
            meta: latestBooking
                ? `${latestBooking.from || "-"} -> ${latestBooking.to || "-"} at ${formatDateTime(latestBooking.bookedAt)}`
                : "No booking has been created yet"
        }
    ];

    snapshot.innerHTML = snapshotItems.map((item) => `
        <div class="admin-snapshot-item">
            <div class="admin-snapshot-top">
                <span class="admin-snapshot-title">${escapeHtml(item.title)}</span>
            </div>
            <div class="admin-snapshot-meta">${escapeHtml(item.meta)}</div>
        </div>
    `).join("");
}

function updateAdminDashboard(bookings) {
    const adminIdentity = localStorage.getItem("adminIdentity") || "Admin";
    const dashboard = document.getElementById("adminDashboardPanel");
    const dashboardIdentity = document.getElementById("adminDashboardIdentity");
    const dashboardSubtitle = document.getElementById("adminDashboardSubtitle");

    if (dashboard) {
        dashboard.classList.remove("hidden");
    }

    if (dashboardIdentity) {
        dashboardIdentity.textContent = adminIdentity;
    }

    if (dashboardSubtitle) {
        if (bookings.length) {
            const routes = groupByRoute(bookings).length;
            const buses = groupByBus(bookings).length;
            dashboardSubtitle.textContent = `Managing ${routes} routes, ${buses} buses, and ${bookings.length} booking records from one control center.`;
        } else {
            dashboardSubtitle.textContent = "Track routes, buses, bookings, cancellations, and refunds from one dashboard.";
        }
    }

    renderAdminStats(bookings);
    renderAdminRecentActivity(bookings);
    renderAdminSnapshot(bookings);
    renderAdminBusList(bookings);
    renderAdminFeatureGrid();
    populateAdminCityOptions();
}

function readAdminManagedBuses() {
    if (typeof window.getManagedAdminBuses === "function") {
        return window.getManagedAdminBuses();
    }

    try {
        const parsed = JSON.parse(localStorage.getItem("adminManagedBuses") || "[]");
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        return [];
    }
}

function persistAdminManagedBuses(buses) {
    if (typeof window.saveManagedAdminBuses === "function") {
        return window.saveManagedAdminBuses(buses);
    }

    localStorage.setItem("adminManagedBuses", JSON.stringify(Array.isArray(buses) ? buses : []));
    return Array.isArray(buses) ? buses : [];
}

function getAdminFeatures() {
    try {
        const parsed = JSON.parse(localStorage.getItem(ADMIN_FEATURES_KEY) || "null");
        if (Array.isArray(parsed) && parsed.length) {
            return DEFAULT_ADMIN_FEATURES.map((feature) => {
                const stored = parsed.find((item) => item?.id === feature.id);
                return stored ? { ...feature, active: stored.active !== false } : feature;
            });
        }
    } catch (error) {
        // Fall through to defaults.
    }

    return DEFAULT_ADMIN_FEATURES.map((feature) => ({ ...feature }));
}

function saveAdminFeatures(features) {
    localStorage.setItem(ADMIN_FEATURES_KEY, JSON.stringify(features));
}

function populateAdminCityOptions() {
    const datalist = document.getElementById("adminCityOptions");
    if (!datalist || datalist.childElementCount > 0) {
        return;
    }

    const cities = Array.isArray(window.CITY_CATALOG)
        ? window.CITY_CATALOG
        : Object.values(window.CITY_CATALOG || {}).flat();
    const uniqueCities = [...new Set((cities || []).map((city) => String(city || "").trim()).filter(Boolean))];

    datalist.innerHTML = uniqueCities
        .sort((a, b) => a.localeCompare(b))
        .map((city) => `<option value="${escapeHtml(city)}"></option>`)
        .join("");
}

function setAdminBusStatus(message, tone = "") {
    const status = document.getElementById("adminBusStatus");
    if (!status) {
        return;
    }

    status.textContent = message;
    status.classList.remove("success", "error");
    if (tone) {
        status.classList.add(tone);
    }
}

function setAdminBusFormOpen(visible) {
    adminUiState.busFormOpen = visible;
    const form = document.getElementById("adminBusForm");
    if (form) {
        form.classList.toggle("hidden", !visible);
    }

    if (!visible) {
        setAdminBusStatus("");
    }
}

function resetAdminBusForm() {
    const form = document.getElementById("adminBusForm");
    if (form) {
        form.reset();
    }

    const typeField = document.getElementById("adminBusType");
    if (typeField) {
        typeField.value = "AC Sleeper";
    }

    setAdminBusStatus("");
}

function renderAdminBusList(bookings) {
    const busList = document.getElementById("adminBusList");
    if (!busList) {
        return;
    }

    const managedBuses = readAdminManagedBuses()
        .slice()
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    if (!managedBuses.length) {
        busList.innerHTML = '<div class="admin-empty-note">No custom buses added yet. Use <strong>Add Bus</strong> to create fleet entries for new routes or services.</div>';
        return;
    }

    busList.innerHTML = managedBuses.map((bus) => {
        const relatedBookings = (bookings || []).filter((booking) =>
            String(booking?.busName || "").trim() === String(bus?.name || "").trim() &&
            String(booking?.from || "").trim() === String(bus?.fromCity || "").trim() &&
            String(booking?.to || "").trim() === String(bus?.toCity || "").trim()
        );

        return `
            <div class="admin-bus-card">
                <div class="admin-bus-top">
                    <div>
                        <div class="admin-bus-name">${escapeHtml(bus?.name || "-")}</div>
                        <div class="admin-bus-route">${escapeHtml(bus?.fromCity || "-")} -> ${escapeHtml(bus?.toCity || "-")}</div>
                    </div>
                    <span class="admin-module-pill admin-module-live">Custom Fleet</span>
                </div>
                <div class="admin-bus-meta">
                    <div class="admin-bus-metric">
                        <span>Departure</span>
                        <strong>${escapeHtml(bus?.departureTime || "-")}</strong>
                    </div>
                    <div class="admin-bus-metric">
                        <span>Fare</span>
                        <strong>${escapeHtml(formatCurrency(bus?.price || 0))}</strong>
                    </div>
                    <div class="admin-bus-metric">
                        <span>Coach</span>
                        <strong>${escapeHtml(bus?.busType || "Standard")}</strong>
                    </div>
                    <div class="admin-bus-metric">
                        <span>Bookings</span>
                        <strong>${escapeHtml(relatedBookings.length)}</strong>
                    </div>
                </div>
                <div class="admin-bus-actions">
                    <button class="btn btn-admin-danger" type="button" data-admin-action="delete-bus" data-bus-id="${escapeHtml(bus?.id || "")}">
                        Remove Bus
                    </button>
                </div>
            </div>
        `;
    }).join("");
}

function renderAdminFeatureGrid() {
    const grid = document.getElementById("adminFeatureGrid");
    if (!grid) {
        return;
    }

    const features = getAdminFeatures();
    grid.innerHTML = features.map((feature) => `
        <div class="admin-feature-card">
            <div class="admin-feature-top">
                <span class="admin-feature-title">${escapeHtml(feature.title)}</span>
                <span class="admin-module-pill ${feature.active ? "admin-module-live" : "admin-module-paused"}">
                    ${feature.active ? "Live" : "Paused"}
                </span>
            </div>
            <div class="admin-feature-desc">${escapeHtml(feature.description)}</div>
            <div class="admin-feature-actions">
                <button class="btn btn-admin-soft" type="button" data-admin-action="toggle-feature" data-feature-id="${escapeHtml(feature.id)}">
                    ${feature.active ? "Pause Module" : "Activate Module"}
                </button>
            </div>
        </div>
    `).join("");
}

function toggleAdminFeature(featureId) {
    const features = getAdminFeatures().map((feature) =>
        feature.id === featureId
            ? { ...feature, active: !feature.active }
            : feature
    );
    saveAdminFeatures(features);
    renderAdminFeatureGrid();
}

async function submitAdminBusForm(event) {
    event.preventDefault();

    const name = String(document.getElementById("adminBusName")?.value || "").trim();
    const fromCity = String(document.getElementById("adminBusFrom")?.value || "").trim();
    const toCity = String(document.getElementById("adminBusTo")?.value || "").trim();
    const departureTime = String(document.getElementById("adminBusDeparture")?.value || "").trim();
    const busType = String(document.getElementById("adminBusType")?.value || "AC Sleeper").trim();
    const price = Number(document.getElementById("adminBusPrice")?.value || 0);

    if (!name || !fromCity || !toCity || !departureTime || !price) {
        setAdminBusStatus("Fill all bus details before saving.", "error");
        return;
    }

    if (fromCity.toLowerCase() === toCity.toLowerCase()) {
        setAdminBusStatus("From city and To city cannot be the same.", "error");
        return;
    }

    if (price < 100) {
        setAdminBusStatus("Fare should be at least Rs.100.", "error");
        return;
    }

    const managedBuses = readAdminManagedBuses();
    const nextBus = {
        id: Date.now(),
        name,
        fromCity,
        toCity,
        departureTime,
        price,
        busType,
        managedByAdmin: true,
        createdAt: new Date().toISOString()
    };

    persistAdminManagedBuses([nextBus, ...managedBuses]);
    if (typeof window.refreshBusCatalog === "function") {
        window.refreshBusCatalog();
    }

    resetAdminBusForm();
    setAdminBusFormOpen(false);
    renderBookings();
    alert("Bus added to admin fleet successfully.");
}

function deleteManagedBus(busId) {
    const busKey = String(busId || "").trim();
    if (!busKey) {
        return;
    }

    const updatedBuses = readAdminManagedBuses().filter((bus) => String(bus?.id || "") !== busKey);
    persistAdminManagedBuses(updatedBuses);
    if (typeof window.refreshBusCatalog === "function") {
        window.refreshBusCatalog();
    }

    renderBookings();
}

async function runAdminRefresh(triggerButton = null) {
    const button = triggerButton instanceof HTMLElement ? triggerButton : null;
    const previousLabel = button ? button.innerHTML : "";
    const adminSession = isAdminSession();

    if (button) {
        button.disabled = true;
        button.innerHTML = '<i class="fa-solid fa-rotate-right fa-spin"></i> Refreshing';
    }

    if (adminSession) {
        setAdminCurrentView("Refreshing...");
    }

    try {
        if (typeof window.refreshBusCatalog === "function") {
            window.refreshBusCatalog();
        }

        if (adminSession) {
            currentBookingCache = null;
            await loadAdminBookingsFromBackend();
        } else {
            currentProfileCache = getCurrentUserProfile();
            await loadProfileFromBackend();
        }

        fillProfile();
        renderBookings();
    } finally {
        if (button) {
            button.disabled = false;
            button.innerHTML = previousLabel;
        }
    }
}

function setProfileMode(isAdmin) {
    document.body.classList.toggle("admin-mode", isAdmin);
    document.body.classList.toggle("user-mode", !isAdmin);

    const pageTitle = document.getElementById("profilePageTitle");
    const pageSubtitle = document.getElementById("profilePageSubtitle");
    const summaryTitle = document.getElementById("profileSummaryTitle");
    const summarySubtitle = document.getElementById("profileSummarySubtitle");
    const identityLabel = document.getElementById("profileIdentityLabel");
    const emailLabel = document.getElementById("profileEmailLabel");
    const mobileLabel = document.getElementById("profileMobileLabel");
    const adminDashboard = document.getElementById("adminDashboardPanel");
    const userDashboard = document.getElementById("userDashboardPanel");

    if (pageTitle) {
        pageTitle.innerHTML = isAdmin
            ? '<i class="fa-solid fa-shield-halved"></i> Admin Dashboard'
            : '<i class="fa-solid fa-circle-user"></i> My Travel Dashboard';
    }

    if (pageSubtitle) {
        pageSubtitle.textContent = isAdmin
            ? "Monitor bookings, routes, bus performance, and refund operations from a single admin workspace."
            : "View your account, upcoming journeys, and trip activity in one passenger dashboard.";
    }

    if (summaryTitle) {
        summaryTitle.textContent = isAdmin ? "Admin Access" : "Account Overview";
    }

    if (summarySubtitle) {
        summarySubtitle.textContent = isAdmin
            ? "Verified administrator identity with access to booking operations and controls."
            : "Your saved login identity and personal contact details.";
    }

    if (identityLabel) {
        identityLabel.textContent = isAdmin ? "Admin Login" : "Name / Email";
    }

    if (emailLabel) {
        emailLabel.textContent = isAdmin ? "Contact" : "Email";
    }

    if (mobileLabel) {
        mobileLabel.textContent = isAdmin ? "Privileges" : "Mobile";
    }

    if (adminDashboard) {
        adminDashboard.classList.toggle("hidden", !isAdmin);
        adminDashboard.hidden = !isAdmin;
        adminDashboard.setAttribute("aria-hidden", isAdmin ? "false" : "true");
    }

    if (userDashboard) {
        userDashboard.classList.toggle("hidden", isAdmin);
        userDashboard.hidden = isAdmin;
        userDashboard.setAttribute("aria-hidden", isAdmin ? "true" : "false");
    }
}

function fillProfile() {
    const isAdmin = isAdminSession();
    const profile = isAdmin ? null : (currentProfileCache || getCurrentUserProfile());
    setProfileMode(isAdmin);
    document.getElementById("profileRole").textContent = isAdmin ? "Administrator" : "User";
    document.getElementById("profileIdentity").textContent = isAdmin
        ? (localStorage.getItem("adminIdentity") || "Admin")
        : (profile?.name || profile?.email || "User");
    document.getElementById("profileEmail").textContent = isAdmin
        ? ADMIN_CONTACT_EMAIL
        : (profile?.email || "-");
    document.getElementById("profileMobile").textContent = isAdmin ? "Routes, bookings, refunds" : (profile?.mobile || "-");
}

function setEditMode(visible) {
    const form = document.getElementById("profileEditForm");
    if (form) {
        form.classList.toggle("hidden", !visible);
    }
}

function setEditStatus(message, tone = "") {
    const status = document.getElementById("profileEditStatus");
    if (!status) {
        return;
    }
    status.textContent = message;
    status.classList.remove("success", "error");
    if (tone) {
        status.classList.add(tone);
    }
}

function populateEditForm() {
    const profile = currentProfileCache || getCurrentUserProfile();
    document.getElementById("editName").value = profile?.name || "";
    document.getElementById("editEmail").value = profile?.email || "";
    document.getElementById("editMobile").value = profile?.mobile || "";
    setEditStatus("");
}

function syncRegisteredUsers(previousProfile, nextProfile) {
    const users = getRegisteredUsers();
    let found = false;
    const updated = users.map((user) => {
        if (user.email !== previousProfile.email) {
            return user;
        }
        found = true;
        return { ...user, name: nextProfile.name, email: nextProfile.email, mobile: nextProfile.mobile };
    });

    if (!found && nextProfile.email) {
        updated.push({
            name: nextProfile.name,
            email: nextProfile.email,
            mobile: nextProfile.mobile,
            password: localStorage.getItem("userPassword") || ""
        });
    }

    saveRegisteredUsers(updated);
}

function syncBookingHistory(previousProfile, nextProfile) {
    const oldEmail = normalizeEmail(previousProfile?.email);
    const oldMobile = profileMobile(previousProfile?.mobile);
    const bookings = getLocalBookingHistory();

    const updatedBookings = bookings.map((booking) => {
        const ownerEmail = normalizeEmail(booking?.ownerEmail);
        const ownerMobile = profileMobile(booking?.ownerMobile);
        const isOwned = (oldEmail && ownerEmail === oldEmail) || (oldMobile && ownerMobile === oldMobile);

        if (!isOwned) {
            return booking;
        }

        return {
            ...booking,
            ownerEmail: nextProfile.email,
            ownerMobile: nextProfile.mobile
        };
    });

    localStorage.setItem("bookingHistory", JSON.stringify(updatedBookings));

    if (!isAdminSession()) {
        currentBookingCache = updatedBookings;
    }
}

async function loadProfileFromBackend() {
    if (isAdminSession()) {
        return;
    }

    const localProfile = currentProfileCache || getCurrentUserProfile();
    const identity = normalizeEmail(localStorage.getItem("userIdentity") || localProfile.email);
    if (!identity) {
        return;
    }

    try {
        const { response, data } = await profileRequest(`/api/profile?identity=${encodeURIComponent(identity)}`);
        if (!response.ok || data.success === false || !data.profile) {
            return;
        }

        const nextProfile = {
            name: (data.profile.name || localProfile.name || "").trim(),
            email: normalizeEmail(data.profile.email || identity),
            mobile: profileMobile(data.profile.mobile || localProfile.mobile)
        };

        syncRegisteredUsers(localProfile, nextProfile);
        storeProfileLocally(nextProfile);
        currentProfileCache = nextProfile;
        fillProfile();
    } catch (error) {
        // Keep local profile when backend is unavailable.
    }
}

function getVisibleBookings() {
    const allBookings = getBookingHistoryStore();
    const isAdmin = isAdminSession();
    if (isAdmin) {
        return allBookings;
    }

    const profile = currentProfileCache || getCurrentUserProfile();
    const email = normalizeEmail(profile.email);
    const mobile = profileMobile(profile.mobile);

    return allBookings.filter((booking) => {
        const ownerEmail = normalizeEmail(booking?.ownerEmail);
        const ownerMobile = profileMobile(booking?.ownerMobile);

        if (email && ownerEmail) {
            return ownerEmail === email;
        }

        if (!email && mobile && ownerMobile) {
            return ownerMobile === mobile;
        }

        return false;
    });
}

async function submitProfileEdit(event) {
    event.preventDefault();

    const previousProfile = currentProfileCache || getCurrentUserProfile();
    const name = document.getElementById("editName").value.trim();
    const email = normalizeEmail(document.getElementById("editEmail").value);
    const mobile = profileMobile(document.getElementById("editMobile").value);
    const currentIdentity = normalizeEmail(localStorage.getItem("userIdentity") || previousProfile.email || email);

    if (!name) {
        setEditStatus("Name is required.", "error");
        return;
    }
    if (!PROFILE_EMAIL_REGEX.test(email)) {
        setEditStatus("Enter a valid email address.", "error");
        return;
    }
    if (!PROFILE_MOBILE_REGEX.test(mobile)) {
        setEditStatus("Enter a valid 10-digit mobile number.", "error");
        return;
    }
    if (isMobileRegistered(mobile, currentIdentity || email)) {
        setEditStatus("This mobile number is already registered.", "error");
        return;
    }

    setEditStatus("Saving profile...");

    try {
        const { response, data } = await profileRequest("/api/profile", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                currentIdentity: currentIdentity || email,
                name,
                email,
                mobile
            })
        });

        if (!response.ok || data.success === false) {
            setEditStatus(data.message || "Failed to update profile.", "error");
            return;
        }

        const nextProfile = {
            name: (data.profile?.name || name).trim(),
            email: normalizeEmail(data.profile?.email || email),
            mobile: profileMobile(data.profile?.mobile || mobile)
        };

        syncRegisteredUsers(previousProfile, nextProfile);
        syncBookingHistory(previousProfile, nextProfile);
        storeProfileLocally(nextProfile);
        currentProfileCache = nextProfile;
        fillProfile();
        renderBookings();
        setEditMode(false);
        setEditStatus("");
        alert("Profile updated successfully.");
    } catch (error) {
        setEditStatus(`Backend not reachable. Check backend availability at ${window.YUBUS_API?.describeTarget?.() || "http://localhost:8000"}.`, "error");
    }
}

function attachActions() {
    document.getElementById("backBtn").addEventListener("click", () => {
        window.location.href = "index.html";
    });

    document.getElementById("logoutBtn").addEventListener("click", () => {
        [
            "adminLoggedIn",
            "adminIdentity",
            "userOTPVerified",
            "googleLogin",
            "userEmail",
            "userIdentity",
            "userName",
            "userMobile",
            "mobile",
            "loginType",
            "otpMode",
            "mockOTP",
            "mockOTPExpiry",
            "userPassword"
        ].forEach((k) => localStorage.removeItem(k));

        window.location.href = "index.html";
    });

    const editBtn = document.getElementById("editProfileBtn");
    const cancelBtn = document.getElementById("cancelEditBtn");
    const editForm = document.getElementById("profileEditForm");
    const adminBusForm = document.getElementById("adminBusForm");
    const adminBusCancelBtn = document.getElementById("adminBusCancelBtn");
    const adminDashboardPanel = document.getElementById("adminDashboardPanel");
    const isAdmin = isAdminSession();

    if (editBtn) {
        editBtn.classList.toggle("hidden", isAdmin);
        editBtn.addEventListener("click", () => {
            populateEditForm();
            setEditMode(true);
        });
    }

    if (cancelBtn) {
        cancelBtn.addEventListener("click", () => {
            setEditMode(false);
            setEditStatus("");
        });
    }

    if (editForm) {
        editForm.classList.add("hidden");
        editForm.addEventListener("submit", submitProfileEdit);
    }

    if (adminBusForm) {
        adminBusForm.classList.add("hidden");
        adminBusForm.addEventListener("submit", submitAdminBusForm);
    }

    if (adminBusCancelBtn) {
        adminBusCancelBtn.addEventListener("click", () => {
            resetAdminBusForm();
            setAdminBusFormOpen(false);
        });
    }

    if (adminDashboardPanel) {
        adminDashboardPanel.addEventListener("click", async (event) => {
            const actionButton = event.target.closest("[data-admin-action]");
            if (!actionButton) {
                return;
            }

            const action = actionButton.dataset.adminAction;
            if (action === "toggle-bus-form") {
                const nextVisible = !adminUiState.busFormOpen;
                setAdminBusFormOpen(nextVisible);
                if (nextVisible) {
                    document.getElementById("adminFleetPanel")?.scrollIntoView({ behavior: "smooth", block: "start" });
                    document.getElementById("adminBusName")?.focus();
                }
            } else if (action === "scroll-fleet") {
                document.getElementById("adminFleetPanel")?.scrollIntoView({ behavior: "smooth", block: "start" });
            } else if (action === "scroll-routes") {
                document.querySelector(".booking-shell")?.scrollIntoView({ behavior: "smooth", block: "start" });
            } else if (action === "refresh-dashboard") {
                await runAdminRefresh(actionButton);
            } else if (action === "delete-bus") {
                deleteManagedBus(actionButton.dataset.busId || "");
            } else if (action === "toggle-feature") {
                toggleAdminFeature(actionButton.dataset.featureId || "");
            }
        });
    }

    document.getElementById("bookingList").addEventListener("click", async (event) => {
        const actionButton = event.target.closest("[data-action]");
        if (!actionButton) {
            return;
        }

        const action = actionButton.dataset.action;
        if (action === "view-route") {
            adminBookingState.routeKey = actionButton.dataset.routeKey || "";
            adminBookingState.busKey = "";
            adminBookingState.ticketFilter = "booked";
        } else if (action === "view-bus") {
            adminBookingState.busKey = actionButton.dataset.busKey || "";
            adminBookingState.ticketFilter = "booked";
        } else if (action === "cancel-booking") {
            await cancelUserBooking(actionButton.dataset.bookingId || "");
        } else if (action === "remove-booking") {
            removeUserBooking(actionButton.dataset.bookingId || "");
        } else if (action === "refund-booking") {
            await refundBooking(actionButton.dataset.bookingId || "");
        } else if (action === "show-booked") {
            adminBookingState.ticketFilter = "booked";
        } else if (action === "show-cancelled") {
            adminBookingState.ticketFilter = "cancelled";
        } else if (action === "show-refunded") {
            adminBookingState.ticketFilter = "refunded";
        } else if (action === "back-routes") {
            adminBookingState.routeKey = "";
            adminBookingState.busKey = "";
            adminBookingState.ticketFilter = "booked";
        } else if (action === "back-buses") {
            adminBookingState.busKey = "";
            adminBookingState.ticketFilter = "booked";
        }

        renderBookings();
    });

    loadProfileFromBackend();
}

async function refreshProfilePage() {
    await runAdminRefresh();
}
