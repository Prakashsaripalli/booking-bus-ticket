const params = new URLSearchParams(window.location.search);
const PAYMENT_API_BASES = window.YUBUS_API?.getBases?.() || [
    "http://localhost:8081",
    "http://127.0.0.1:8081",
    "http://localhost:8080",
    "http://127.0.0.1:8080"
];

function buildPaymentApiUrl(path, base) {
    if (window.YUBUS_API?.buildUrl) {
        return window.YUBUS_API.buildUrl(path, base);
    }

    return `${base}${path}`;
}

const from = params.get("from") || "";
const to = params.get("to") || "";
const busName = params.get("name") || "";
const seats = params.get("seats") || "";
const journeyDate = params.get("date") || "";
const departureTime = params.get("departureTime") || "";
const passenger = params.get("passenger") || "";
const mobile = params.get("mobile") || "";
const email = params.get("email") || "";
const total = parseInt(params.get("total"), 10) || 0;
const storedUserEmail = (localStorage.getItem("userEmail") || localStorage.getItem("userIdentity") || "").trim();

let discount = 0;
let finalAmount = total;
let passengerSubmitted = false;
const qrImage = document.getElementById("qrImage");
const generateQrBtn = document.getElementById("generateQrBtn");
const upiIdModeBtn = document.getElementById("upiIdModeBtn");
const qrModeBtn = document.getElementById("qrModeBtn");
const qrPanel = document.getElementById("qrPanel");
const upiIdInput = document.getElementById("upiIdInput");
const transactionIdInput = document.getElementById("transactionIdInput");
const cardNumberInput = document.getElementById("cardNumberInput");
const cardHolderNameInput = document.getElementById("cardHolderNameInput");
const cardExpiryInput = document.getElementById("cardExpiryInput");
const cardCvvInput = document.getElementById("cardCvvInput");
const walletMobileInput = document.getElementById("walletMobileInput");
const walletOtpInput = document.getElementById("walletOtpInput");
const sendWalletOtpBtn = document.getElementById("sendWalletOtpBtn");
const verifyWalletOtpBtn = document.getElementById("verifyWalletOtpBtn");
const resendWalletOtpBtn = document.getElementById("resendWalletOtpBtn");
const walletOtpStatus = document.getElementById("walletOtpStatus");
const upiSection = document.getElementById("upiSection");
const paymentSuccessOverlay = document.getElementById("paymentSuccessOverlay");
const coinLane = document.getElementById("coinLane");
const goHomeBtn = document.getElementById("goHomeBtn");
let activeUpiMode = "upi-id";
let activePaymentMethod = "upi";
let walletGeneratedOtp = "";
let walletOtpVerified = false;
let walletVerifiedMobile = "";

// Display trip info
document.getElementById("routeDetails").innerText = `${from} - ${to}`;
document.getElementById("busDetails").innerText = busName;
document.getElementById("seatNumbers").innerText = seats;
document.getElementById("passengerName").value = passenger;
document.getElementById("passengerMobile").value = mobile;
document.getElementById("passengerEmail").value = email || storedUserEmail;
qrImage.src = "Assets/qr.jpeg";

updateAmount();

function updateAmount() {
    document.getElementById("finalAmount").innerText = finalAmount;
    document.getElementById("discountAmount").innerText = discount;
    document.getElementById("btnAmount").innerText = finalAmount;
}

async function postPayment(payload) {
    let lastNetworkError;

    for (const base of PAYMENT_API_BASES) {
        try {
            return await fetch(buildPaymentApiUrl("/api/payment/process", base), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
        } catch (error) {
            lastNetworkError = error;
        }
    }

    throw lastNetworkError || new Error("Unable to reach payment API");
}

function resetPayButton(button) {
    button.innerHTML = `Pay Now &#8377;<span id="btnAmount">${finalAmount}</span>`;
    button.disabled = false;
}

function resetQrState() {
    qrImage.classList.add("qr-blur");
    generateQrBtn.disabled = false;
    generateQrBtn.innerText = "Generate QR";
}

function setUpiMode(mode) {
    activeUpiMode = mode;
    const isQrMode = mode === "qr";

    upiIdModeBtn.classList.toggle("active", !isQrMode);
    qrModeBtn.classList.toggle("active", isQrMode);
    qrPanel.classList.toggle("hidden", !isQrMode);
    upiIdInput.classList.toggle("hidden", isQrMode);
    upiIdInput.disabled = isQrMode;
    transactionIdInput.classList.toggle("hidden", !isQrMode);

    if (isQrMode) {
        resetQrState();
        transactionIdInput.placeholder = "Enter QR Transaction ID";
        transactionIdInput.value = "";
    } else {
        transactionIdInput.placeholder = "Enter Transaction ID";
        transactionIdInput.value = "";
    }
}

function normalizeEmail(value) {
    return (value || "").trim().toLowerCase();
}

function normalizeTransactionId(value) {
    return (value || "").trim().replace(/\s+/g, "").toUpperCase();
}

function digitsOnly(value) {
    return (value || "").replace(/\D/g, "");
}

function limitDigits(value, maxLength) {
    return digitsOnly(value).slice(0, maxLength);
}

function formatCardExpiry(value) {
    const digits = limitDigits(value, 4);

    if (digits.length <= 2) {
        return digits;
    }

    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}`;
}

function isValidTransactionId(value) {
    return /^[A-Z]{1,4}\d{22}$/.test(value);
}

function isTransactionIdAlreadyUsed(value) {
    const normalizedId = normalizeTransactionId(value);
    if (!normalizedId) {
        return false;
    }

    const history = JSON.parse(localStorage.getItem("bookingHistory") || "[]");
    return history.some((booking) => normalizeTransactionId(booking?.transactionId) === normalizedId);
}

function buildPaymentReference(prefix) {
    const normalizedPrefix = String(prefix || "PAY").trim().toUpperCase().replace(/[^A-Z]/g, "").slice(0, 4) || "PAY";
    const timestampPart = `${Date.now()}`.slice(-13);
    const randomPart = `${Math.floor(Math.random() * 1e12)}`.padStart(12, "0").slice(0, 9);
    return `${normalizedPrefix}${timestampPart}${randomPart}`;
}

function isValidCardNumber(value) {
    return /^\d{16}$/.test(digitsOnly(value));
}

function isValidCardHolderName(value) {
    return /^[A-Za-z ]+$/.test((value || "").trim()) && /[A-Za-z]/.test((value || "").trim());
}

function isValidCardExpiry(value) {
    return /^(0[1-9]|1[0-2])\/\d{2}$/.test((value || "").trim());
}

function isValidCardCvv(value) {
    return /^\d{3}$/.test(digitsOnly(value));
}

function setWalletStatus(message, variant) {
    if (!walletOtpStatus) {
        return;
    }

    walletOtpStatus.textContent = message;
    walletOtpStatus.className = "wallet-status";

    if (variant) {
        walletOtpStatus.classList.add(variant);
    }
}

function toggleResendWalletOtp(show) {
    if (!resendWalletOtpBtn) {
        return;
    }

    resendWalletOtpBtn.classList.toggle("hidden", !show);
}

function resetWalletOtpState(options = {}) {
    const preserveMobile = options.preserveMobile === true;

    walletGeneratedOtp = "";
    walletOtpVerified = false;
    walletVerifiedMobile = "";

    if (walletOtpInput) {
        walletOtpInput.value = "";
    }

    if (!preserveMobile && walletMobileInput) {
        walletMobileInput.value = "";
    }

    if (sendWalletOtpBtn) {
        sendWalletOtpBtn.disabled = false;
        sendWalletOtpBtn.textContent = "Get OTP";
    }

    if (verifyWalletOtpBtn) {
        verifyWalletOtpBtn.disabled = false;
    }

    toggleResendWalletOtp(false);

    setWalletStatus("Enter mobile number and request OTP.", "");
}

function buildDummyOtp() {
    return String(100000 + Math.floor(Math.random() * 900000));
}

function isValidWalletMobile(value) {
    return /^\d{10}$/.test(limitDigits(value, 10));
}

function isValidWalletOtp(value) {
    return /^\d{6}$/.test(limitDigits(value, 6));
}

function sendWalletOtp(isResend = false) {
    const walletMobile = limitDigits(walletMobileInput?.value || "", 10);

    if (!isValidWalletMobile(walletMobile)) {
        setWalletStatus("Enter a valid 10-digit wallet mobile number.", "error");
        walletMobileInput.focus();
        walletMobileInput.select();
        return;
    }

    walletGeneratedOtp = buildDummyOtp();
    walletOtpVerified = false;
    walletVerifiedMobile = walletMobile;

    if (sendWalletOtpBtn) {
        sendWalletOtpBtn.disabled = true;
        sendWalletOtpBtn.textContent = "OTP Sent";
    }

    if (walletOtpInput) {
        walletOtpInput.value = "";
        walletOtpInput.focus();
    }

    toggleResendWalletOtp(false);
    setWalletStatus(
        isResend
            ? `New dummy OTP sent: ${walletGeneratedOtp}`
            : `Dummy OTP sent: ${walletGeneratedOtp}`,
        "success"
    );
}

function getBookingOwner(passengerEmail, passengerMobile) {
    const currentUserEmail = normalizeEmail(localStorage.getItem("userEmail") || localStorage.getItem("userIdentity"));
    const currentUserMobile = (localStorage.getItem("userMobile") || localStorage.getItem("mobile") || "").replace(/\D/g, "").slice(-10);

    return {
        ownerEmail: currentUserEmail,
        ownerMobile: currentUserMobile
    };
}

function getPaymentMethodLabel() {
    if (activePaymentMethod === "upi") {
        return activeUpiMode === "qr" ? "UPI (QR)" : "UPI";
    }

    if (activePaymentMethod === "card") {
        return "Card";
    }

    if (activePaymentMethod === "wallet") {
        return "Wallet";
    }

    if (activePaymentMethod === "netbank") {
        return "Net Banking";
    }

    return "Unknown";
}

function saveBookingHistory(bookingId, passengerName, passengerMobile, passengerEmail, transactionId, paymentMethod) {
    const owner = getBookingOwner(passengerEmail, passengerMobile);
    const normalizedTransactionId = normalizeTransactionId(transactionId);
    const bookingEntry = {
        bookingId,
        from,
        to,
        busName,
        seats,
        journeyDate,
        departureTime,
        originalAmount: total,
        amount: finalAmount,
        discountAmount: discount,
        passengerName,
        passengerMobile,
        passengerEmail,
        ownerEmail: owner.ownerEmail,
        ownerMobile: owner.ownerMobile,
        paymentMethod,
        transactionId: normalizedTransactionId,
        status: "Booked",
        bookedAt: new Date().toISOString()
    };

    const history = JSON.parse(localStorage.getItem("bookingHistory") || "[]");
    history.unshift(bookingEntry);
    localStorage.setItem("bookingHistory", JSON.stringify(history.slice(0, 25)));
}

function playSuccessAnimationAndRedirect() {
    paymentSuccessOverlay.classList.remove("hidden");

    let launched = 0;
    const maxCoins = 36;
    const timer = setInterval(() => {
        const coin = document.createElement("span");
        coin.className = "coin";
        coin.style.top = `${12 + Math.random() * 70}%`;
        coin.style.animationDelay = `${Math.random() * 0.08}s`;
        coinLane.appendChild(coin);

        launched += 1;
        setTimeout(() => coin.remove(), 1100);

        if (launched >= maxCoins) {
            clearInterval(timer);
        }
    }, 50);

    goHomeBtn.disabled = false;
}

goHomeBtn.addEventListener("click", () => {
    goHomeBtn.disabled = true;
    window.location.href = "index.html";
});

cardNumberInput.addEventListener("input", () => {
    cardNumberInput.value = limitDigits(cardNumberInput.value, 16);
});

cardCvvInput.addEventListener("input", () => {
    cardCvvInput.value = limitDigits(cardCvvInput.value, 3);
});

cardExpiryInput.addEventListener("input", () => {
    cardExpiryInput.value = formatCardExpiry(cardExpiryInput.value);
});

document.getElementById("passengerMobile").addEventListener("input", function () {
    this.value = limitDigits(this.value, 10);
});

if (walletMobileInput) {
    walletMobileInput.addEventListener("input", () => {
        const sanitized = limitDigits(walletMobileInput.value, 10);
        const mobileChanged = sanitized !== walletVerifiedMobile;

        walletMobileInput.value = sanitized;

        if (mobileChanged) {
            walletGeneratedOtp = "";
            walletOtpVerified = false;

            if (sendWalletOtpBtn) {
                sendWalletOtpBtn.disabled = false;
                sendWalletOtpBtn.textContent = "Get OTP";
            }

            toggleResendWalletOtp(false);
            setWalletStatus("Enter mobile number and request OTP.", "");
        }
    });
}

if (walletOtpInput) {
    walletOtpInput.addEventListener("input", () => {
        walletOtpInput.value = limitDigits(walletOtpInput.value, 6);
    });
}

if (sendWalletOtpBtn) {
    sendWalletOtpBtn.addEventListener("click", () => {
        sendWalletOtp(false);
    });
}

if (resendWalletOtpBtn) {
    resendWalletOtpBtn.addEventListener("click", () => {
        sendWalletOtp(true);
    });
}

if (verifyWalletOtpBtn) {
    verifyWalletOtpBtn.addEventListener("click", () => {
        const walletMobile = limitDigits(walletMobileInput?.value || "", 10);
        const enteredOtp = limitDigits(walletOtpInput?.value || "", 6);

        if (!walletGeneratedOtp) {
            setWalletStatus("Click Get OTP first.", "error");
            return;
        }

        if (!isValidWalletMobile(walletMobile)) {
            setWalletStatus("Enter a valid 10-digit wallet mobile number.", "error");
            walletMobileInput.focus();
            walletMobileInput.select();
            return;
        }

        if (!isValidWalletOtp(enteredOtp)) {
            setWalletStatus("Enter the 6-digit OTP.", "error");
            walletOtpInput.focus();
            walletOtpInput.select();
            return;
        }

        if (walletMobile !== walletVerifiedMobile || enteredOtp !== walletGeneratedOtp) {
            walletOtpVerified = false;
            toggleResendWalletOtp(true);
            setWalletStatus("OTP verification failed. Enter the correct OTP.", "error");
            walletOtpInput.focus();
            walletOtpInput.select();
            return;
        }

        walletOtpVerified = true;
        toggleResendWalletOtp(false);
        setWalletStatus("Wallet OTP verified. You can complete payment now.", "success");
    });
}

upiIdModeBtn.addEventListener("click", () => {
    setUpiMode("upi-id");
    upiIdInput.focus();
});

qrModeBtn.addEventListener("click", () => {
    setUpiMode("qr");
    generateQrBtn.focus();
});

generateQrBtn.addEventListener("click", function () {
    qrImage.classList.remove("qr-blur");
    generateQrBtn.disabled = true;
    generateQrBtn.innerText = "QR Generated";
    transactionIdInput.focus();
});

// Coupon
document.getElementById("applyCoupon").addEventListener("click", function () {
    const code = document.getElementById("couponCode").value.trim().toUpperCase();

    if (code === "UPIBUS" || code === "JET20") {
        discount = Math.round(total * 0.2);
        finalAmount = total - discount;
        alert("20% discount applied");
    } else {
        alert("Invalid Coupon");
    }

    updateAmount();
});

// Passenger details submit
document.getElementById("submitPassenger").addEventListener("click", function () {
    const passengerName = document.getElementById("passengerName").value.trim();
    const passengerMobile = document.getElementById("passengerMobile").value.trim();
    const passengerEmail = document.getElementById("passengerEmail").value.trim();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!passengerName || !passengerMobile || !passengerEmail) {
        alert("Please fill passenger name, mobile and email");
        return;
    }

    if (!/^\d{10}$/.test(passengerMobile)) {
        alert("Please enter a valid 10-digit mobile number");
        return;
    }

    if (!emailPattern.test(passengerEmail)) {
        alert("Please enter a valid email address");
        return;
    }

    passengerSubmitted = true;
    alert("Passenger details submitted");
});

// Method switching
document.querySelectorAll(".method").forEach(method => {
    method.addEventListener("click", function () {
        activePaymentMethod = this.dataset.method;

        document.querySelectorAll(".method")
            .forEach(m => m.classList.remove("active"));

        this.classList.add("active");

        document.querySelectorAll(".payment-section")
            .forEach(sec => sec.classList.add("hidden"));

        document.getElementById(this.dataset.method + "Section")
            .classList.remove("hidden");

        if (activePaymentMethod !== "wallet") {
            resetWalletOtpState({ preserveMobile: true });
        }
    });
});

// Payment request + success animation
document.getElementById("payBtn").addEventListener("click", async function () {
    const passengerName = document.getElementById("passengerName").value.trim();
    const passengerMobile = document.getElementById("passengerMobile").value.trim();
    const passengerEmail = document.getElementById("passengerEmail").value.trim();
    const transactionId = transactionIdInput.value.trim();
    const normalizedTransactionId = normalizeTransactionId(transactionId);
    const paymentMethodLabel = getPaymentMethodLabel();
    const notificationEmail = normalizeEmail(storedUserEmail || passengerEmail);
    const bookingId = `BK${Date.now()}`;
    let paymentReference = "";

    if (!passengerName || !passengerMobile || !passengerEmail) {
        alert("Please enter passenger details");
        return;
    }

    if (!/^\d{10}$/.test(passengerMobile)) {
        alert("Please enter a valid 10-digit mobile number");
        return;
    }

    if (!passengerSubmitted) {
        alert("Please submit passenger details first");
        return;
    }

    if (activePaymentMethod === "upi") {
        const upiId = upiIdInput.value.trim();

        if (activeUpiMode === "upi-id" && !upiId) {
            alert("Please enter UPI ID");
            upiIdInput.focus();
            return;
        }

        if (activeUpiMode === "qr" && !generateQrBtn.disabled) {
            alert("Please generate QR first or switch to UPI ID payment.");
            generateQrBtn.focus();
            return;
        }

        if (activeUpiMode === "qr") {
            if (!transactionId) {
                alert("Please enter Transaction ID");
                return;
            }

            if (!isValidTransactionId(normalizedTransactionId)) {
                alert("Transaction ID must have 1 to 4 starting letters and exactly 22 numbers after that.");
                transactionIdInput.focus();
                transactionIdInput.select();
                return;
            }

            if (isTransactionIdAlreadyUsed(normalizedTransactionId)) {
                alert("This Transaction ID is already used. Please enter a new Transaction ID.");
                transactionIdInput.focus();
                transactionIdInput.select();
                return;
            }

            paymentReference = normalizedTransactionId;
        } else {
            paymentReference = buildPaymentReference("UPID");
        }
    }

    if (activePaymentMethod === "card") {
        const cardNumber = limitDigits(cardNumberInput.value, 16);
        const cardHolderName = cardHolderNameInput.value.trim();
        const cardExpiry = cardExpiryInput.value.trim();
        const cardCvv = limitDigits(cardCvvInput.value, 3);

        if (!cardNumber || !cardHolderName || !cardExpiry || !cardCvv) {
            alert("Please enter all card details");
            return;
        }

        if (!isValidCardNumber(cardNumber)) {
            alert("Card number must be exactly 16 digits.");
            cardNumberInput.focus();
            cardNumberInput.select();
            return;
        }

        if (!isValidCardHolderName(cardHolderName)) {
            alert("Card holder name must contain only letters and spaces.");
            cardHolderNameInput.focus();
            cardHolderNameInput.select();
            return;
        }

        if (!isValidCardExpiry(cardExpiry)) {
            alert("Expiry date must be in MM/YY format.");
            cardExpiryInput.focus();
            cardExpiryInput.select();
            return;
        }

        if (!isValidCardCvv(cardCvv)) {
            alert("CVV must be exactly 3 digits.");
            cardCvvInput.focus();
            cardCvvInput.select();
            return;
        }

        paymentReference = buildPaymentReference("CARD");
    }

    if (activePaymentMethod === "wallet") {
        const walletMobile = limitDigits(walletMobileInput?.value || "", 10);
        const enteredOtp = limitDigits(walletOtpInput?.value || "", 6);

        if (!isValidWalletMobile(walletMobile)) {
            alert("Please enter a valid 10-digit wallet mobile number.");
            walletMobileInput.focus();
            walletMobileInput.select();
            return;
        }

        if (!walletGeneratedOtp) {
            alert("Please click Get OTP for wallet payment.");
            sendWalletOtpBtn.focus();
            return;
        }

        if (!isValidWalletOtp(enteredOtp)) {
            alert("Please enter the 6-digit wallet OTP.");
            walletOtpInput.focus();
            walletOtpInput.select();
            return;
        }

        if (!walletOtpVerified || walletMobile !== walletVerifiedMobile) {
            alert("Please verify wallet OTP before paying.");
            verifyWalletOtpBtn.focus();
            return;
        }

        paymentReference = buildPaymentReference("WALT");
    }

    if (!paymentReference) {
        paymentReference = buildPaymentReference("PAY");
    }

    this.innerText = "Processing...";
    this.disabled = true;

    try {
        const response = await postPayment({
            bookingId,
            passengerName,
            mobile: passengerMobile,
            email: passengerEmail,
            notificationEmail,
            from,
            to,
            busName,
            seats,
            journeyDate,
            departureTime,
            originalAmount: total,
            discountAmount: discount,
            paymentMethod: paymentMethodLabel,
            amount: finalAmount,
            transactionId: paymentReference
        });

        const data = await response.json().catch(() => ({}));
        if (!response.ok || data.success === false) {
            alert(data.message || "Payment failed");
            resetPayButton(this);
            return;
        }

        saveBookingHistory(
            bookingId,
            passengerName,
            passengerMobile,
            passengerEmail,
            paymentReference,
            paymentMethodLabel
        );
    } catch (error) {
        alert(`Payment API error. Backend was not reachable at ${window.YUBUS_API?.describeTarget?.() || "http://localhost:8081"}.\n${error?.message || "Unknown network error"}`);
        resetPayButton(this);
        return;
    }

    setTimeout(() => {
        playSuccessAnimationAndRedirect();
    }, 1200);
});

setUpiMode("upi-id");
resetWalletOtpState();
