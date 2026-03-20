const API_BASES = window.YUBUS_API?.getBases?.() || [
    "http://localhost:8001",
    "http://127.0.0.1:8001",
    "http://localhost:8000",
    "http://127.0.0.1:8000"
];
const REGISTERED_USERS_KEY = "registeredUsers";
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const resetForm = document.getElementById("resetPasswordForm");
const resetEmailInput = document.getElementById("resetEmail");
const resetOtpInput = document.getElementById("resetOtp");
const newPasswordInput = document.getElementById("newPassword");
const confirmPasswordInput = document.getElementById("confirmPassword");
const sendResetOtpBtn = document.getElementById("sendResetOtpBtn");
const resetStatus = document.getElementById("resetStatus");

function setResetStatus(message, variant = "") {
    if (!resetStatus) {
        return;
    }

    resetStatus.textContent = message;
    resetStatus.classList.remove("error");
    if (variant) {
        resetStatus.classList.add(variant);
    }
}

function buildApiUrl(path, base) {
    if (window.YUBUS_API?.buildUrl) {
        return window.YUBUS_API.buildUrl(path, base);
    }
    return `${base}${path}`;
}

async function postWithFallback(path, payload) {
    let lastError;
    for (const base of API_BASES) {
        try {
            const response = await fetch(buildApiUrl(path, base), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            const data = await response.json().catch(() => ({}));
            return { response, data };
        } catch (error) {
            lastError = error;
        }
    }
    throw lastError || new Error("Backend not reachable");
}

function normalizeEmail(value) {
    return (value || "").trim().toLowerCase();
}

function getRegisteredUsers() {
    try {
        const parsedUsers = JSON.parse(localStorage.getItem(REGISTERED_USERS_KEY) || "[]");
        return Array.isArray(parsedUsers) ? parsedUsers : [];
    } catch (error) {
        return [];
    }
}

function saveRegisteredUsers(users) {
    localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(Array.isArray(users) ? users : []));
}

async function sendResetOtp() {
    const email = normalizeEmail(resetEmailInput?.value);
    if (!EMAIL_REGEX.test(email)) {
        setResetStatus("Enter a valid registered Gmail before sending OTP.", "error");
        return;
    }

    sendResetOtpBtn.disabled = true;
    setResetStatus("Sending OTP to your Gmail...");

    try {
        const { response, data } = await postWithFallback("/api/auth/send-otp", { email });
        if (!response.ok || data.success === false) {
            setResetStatus(data.message || "Failed to send OTP email.", "error");
            return;
        }

        setResetStatus(`OTP sent to ${email}. Check Inbox/Spam/Promotions.`);
    } catch (error) {
        setResetStatus(
            `Backend not reachable. Check backend availability at ${window.YUBUS_API?.describeTarget?.() || "http://localhost:8000"}.`,
            "error"
        );
    } finally {
        sendResetOtpBtn.disabled = false;
    }
}

async function handleResetPassword(event) {
    event.preventDefault();

    const email = normalizeEmail(resetEmailInput?.value);
    const enteredOtp = String(resetOtpInput?.value || "").replace(/\D/g, "").slice(0, 6);
    const newPassword = String(newPasswordInput?.value || "").trim();
    const confirmPassword = String(confirmPasswordInput?.value || "").trim();

    if (!EMAIL_REGEX.test(email)) {
        setResetStatus("Enter a valid registered Gmail.", "error");
        return;
    }

    if (!/^\d{6}$/.test(enteredOtp)) {
        setResetStatus("Enter the 6-digit OTP from your email.", "error");
        return;
    }

    if (newPassword.length < 4) {
        setResetStatus("New password must be at least 4 characters.", "error");
        return;
    }

    if (newPassword !== confirmPassword) {
        setResetStatus("New password and confirm password must match.", "error");
        return;
    }

    try {
        const { response, data } = await postWithFallback("/api/auth/reset-password", {
            email,
            otp: enteredOtp,
            newPassword
        });
        if (!response.ok || data.success === false) {
            setResetStatus(data.message || "Failed to reset password.", "error");
            return;
        }
    } catch (error) {
        setResetStatus(
            `Backend not reachable. Check backend availability at ${window.YUBUS_API?.describeTarget?.() || "http://localhost:8000"}.`,
            "error"
        );
        return;
    }

    const users = getRegisteredUsers();
    const userIndex = users.findIndex((user) => normalizeEmail(user?.email) === email);
    if (userIndex >= 0) {
        users[userIndex] = {
            ...users[userIndex],
            password: newPassword
        };
        saveRegisteredUsers(users);
    }

    const currentIdentity = normalizeEmail(localStorage.getItem("userIdentity") || localStorage.getItem("userEmail"));
    if (currentIdentity === email) {
        localStorage.setItem("userPassword", newPassword);
    }

    setResetStatus("Password reset successful. Redirecting to login...");
    window.setTimeout(() => {
        window.location.href = `login.html?email=${encodeURIComponent(email)}`;
    }, 900);
}

function preloadEmailFromQuery() {
    const params = new URLSearchParams(window.location.search);
    const email = normalizeEmail(params.get("email"));
    if (EMAIL_REGEX.test(email) && resetEmailInput) {
        resetEmailInput.value = email;
    }
}

if (sendResetOtpBtn) {
    sendResetOtpBtn.addEventListener("click", () => {
        void sendResetOtp();
    });
}

if (resetForm) {
    resetForm.addEventListener("submit", (event) => {
        void handleResetPassword(event);
    });
}

if (resetOtpInput) {
    resetOtpInput.addEventListener("input", () => {
        resetOtpInput.value = resetOtpInput.value.replace(/\D/g, "").slice(0, 6);
    });
}

preloadEmailFromQuery();
