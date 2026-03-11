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
        ? (localStorage.getItem("adminIdentity") || "-")
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

function getStatusBadge(status) {
    const bookingStatus = status === "Refunded"
        ? "Refunded"
        : (status === "Cancelled" ? "Cancelled" : "Booked");
    const badgeClass = bookingStatus === "Refunded"
        ? "status-refunded"
        : (bookingStatus === "Cancelled" ? "status-cancelled" : "status-booked");
    return `<span class="booking-status ${badgeClass}">${escapeHtml(bookingStatus)}</span>`;
}

function isCancelledOrRefunded(booking) {
    return booking?.status === "Cancelled";
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

function cancelUserBooking(bookingId) {
    const history = JSON.parse(localStorage.getItem("bookingHistory") || "[]");
    const cancelledBooking = history.find((booking) => booking?.bookingId === bookingId);
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

    localStorage.setItem("bookingHistory", JSON.stringify(updatedHistory));

    if (cancelledBooking) {
        void sendCancellationEmail({
            ...cancelledBooking,
            status: "Cancelled",
            cancelledAt
        });
    }
}

function refundBooking(bookingId) {
    const history = JSON.parse(localStorage.getItem("bookingHistory") || "[]");
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

    localStorage.setItem("bookingHistory", JSON.stringify(updatedHistory));

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
    const history = JSON.parse(localStorage.getItem("bookingHistory") || "[]");
    const updatedHistory = history.filter((booking) => booking?.bookingId !== bookingId);
    localStorage.setItem("bookingHistory", JSON.stringify(updatedHistory));
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
        const cancelledAt = b.cancelledAt ? new Date(b.cancelledAt).toLocaleString() : "";
        const refundedAt = b.refundedAt ? new Date(b.refundedAt).toLocaleString() : "";
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
                    <button class="btn btn-cancel" data-action="cancel-booking" data-booking-id="${escapeHtml(b.bookingId || "")}" ${(isCancelled || isRefunded) ? "disabled" : ""}>
                        ${isRefunded ? "Refund Successful" : (isCancelled ? "Cancelled" : "Cancel Ticket")}
                    </button>
                    <button class="btn btn-remove" data-action="remove-booking" data-booking-id="${escapeHtml(b.bookingId || "")}" ${isCancelled || isRefunded ? "" : "disabled"}>
                        Remove
                    </button>
                </div>
            </div>
        `;
    }).join("");
}

function renderAdminRoutes(bookingList, routes) {
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
    const selectedRoute = routes.find((route) => route.routeKey === adminBookingState.routeKey);

    if (!selectedRoute) {
        adminBookingState.routeKey = "";
        adminBookingState.busKey = "";
        bookingSectionTitle.textContent = "All Routes";
        renderAdminRoutes(bookingList, routes);
        return;
    }

    const buses = groupByBus(selectedRoute.bookings);
    const selectedBus = buses.find((bus) => bus.busKey === adminBookingState.busKey);

    if (!selectedBus) {
        adminBookingState.busKey = "";
        bookingSectionTitle.textContent = `Buses: ${selectedRoute.from} -> ${selectedRoute.to}`;
        renderAdminBuses(bookingList, selectedRoute, buses);
        return;
    }

    bookingSectionTitle.textContent = adminBookingState.ticketFilter === "refunded"
        ? `Refund Details: ${selectedBus.busName}`
        : (adminBookingState.ticketFilter === "cancelled"
        ? `Cancelled Details: ${selectedBus.busName}`
        : `Booking Details: ${selectedBus.busName}`);
    renderAdminTickets(bookingList, selectedRoute, selectedBus);
}

function renderBookings() {
    const bookingSectionTitle = document.getElementById("bookingSectionTitle");
    const bookingList = document.getElementById("bookingList");
    const isAdmin = localStorage.getItem("adminLoggedIn") === "true";
    const bookings = getVisibleBookings();

    bookingList.classList.toggle("user-booking-list", !isAdmin);

    if (!bookings.length) {
        bookingSectionTitle.textContent = "Booking Details";
        bookingList.innerHTML = isAdmin
            ? '<div class="booking-empty">No bookings found.</div>'
            : '<div class="booking-empty">No bookings found for this user.</div>';
        return;
    }

    if (isAdmin) {
        renderAdminBookings(bookingList, bookings);
        return;
    }

    bookingSectionTitle.textContent = "My Booking Details";
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

document.addEventListener("DOMContentLoaded", () => {
    if (!isLoggedIn()) {
        window.location.href = "login.html";
        return;
    }

    fillProfile();
    renderBookings();
    attachActions();
});

window.addEventListener("storage", refreshProfilePage);
window.addEventListener("focus", refreshProfilePage);

const PROFILE_API_BASES = window.YUBUS_API?.getBases?.() || [
    "http://localhost:8081",
    "http://127.0.0.1:8081",
    "http://localhost:8080",
    "http://127.0.0.1:8080"
];
const PROFILE_USERS_KEY = "registeredUsers";
const PROFILE_EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PROFILE_MOBILE_REGEX = /^[6-9]\d{9}$/;
let currentProfileCache = null;

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
        const parsedUsers = JSON.parse(localStorage.getItem(PROFILE_USERS_KEY) || "[]");
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

function fillProfile() {
    const isAdmin = localStorage.getItem("adminLoggedIn") === "true";
    const profile = isAdmin ? null : (currentProfileCache || getCurrentUserProfile());
    document.getElementById("profileRole").textContent = isAdmin ? "Admin" : "User";
    document.getElementById("profileIdentity").textContent = isAdmin
        ? (localStorage.getItem("adminIdentity") || "Admin")
        : (profile?.name || profile?.email || "User");
    document.getElementById("profileEmail").textContent = isAdmin
        ? (localStorage.getItem("adminIdentity") || "-")
        : (profile?.email || "-");
    document.getElementById("profileMobile").textContent = isAdmin ? "-" : (profile?.mobile || "-");
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
    const bookings = JSON.parse(localStorage.getItem("bookingHistory") || "[]");

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
}

async function loadProfileFromBackend() {
    if (localStorage.getItem("adminLoggedIn") === "true") {
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
    const allBookings = JSON.parse(localStorage.getItem("bookingHistory") || "[]");
    const isAdmin = localStorage.getItem("adminLoggedIn") === "true";
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
        setEditStatus(`Backend not reachable. Check backend availability at ${window.YUBUS_API?.describeTarget?.() || "http://localhost:8081"}.`, "error");
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
    const isAdmin = localStorage.getItem("adminLoggedIn") === "true";

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

    document.getElementById("bookingList").addEventListener("click", (event) => {
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
            cancelUserBooking(actionButton.dataset.bookingId || "");
        } else if (action === "remove-booking") {
            removeUserBooking(actionButton.dataset.bookingId || "");
        } else if (action === "refund-booking") {
            refundBooking(actionButton.dataset.bookingId || "");
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

function refreshProfilePage() {
    currentProfileCache = localStorage.getItem("adminLoggedIn") === "true" ? null : getCurrentUserProfile();
    fillProfile();
    renderBookings();
}
