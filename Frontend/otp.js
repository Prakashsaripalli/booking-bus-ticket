const OTP_API_BASES = window.YUBUS_API?.getBases?.() || [
    "http://localhost:8081",
    "http://127.0.0.1:8081",
    "http://localhost:8080",
    "http://127.0.0.1:8080"
];

function buildOtpUrl(path, base) {
    if (window.YUBUS_API?.buildUrl) {
        return window.YUBUS_API.buildUrl(path, base);
    }

    return `${base}${path}`;
}

const inputs = document.querySelectorAll(".otp-box");
const resendOtpBtn = document.getElementById("resendOtpBtn");
const resendOtpStatus = document.getElementById("resendOtpStatus");
const otpBackBtn = document.getElementById("otpBackBtn");
const RESEND_COOLDOWN_MS = 15000;
let resendCooldownUntil = 0;
let resendCooldownTimer = null;

function setResendStatus(message, variant = "") {
    if (!resendOtpStatus) {
        return;
    }
    resendOtpStatus.textContent = message;
    resendOtpStatus.className = "otp-status";
    if (variant) {
        resendOtpStatus.classList.add(variant);
    }
}

function clearOtpInputs() {
    inputs.forEach((input) => {
        input.value = "";
    });
    if (inputs[0]) {
        inputs[0].focus();
    }
}

function updateResendButton() {
    if (!resendOtpBtn) {
        return;
    }

    const remaining = resendCooldownUntil - Date.now();
    if (remaining > 0) {
        const seconds = Math.ceil(remaining / 1000);
        resendOtpBtn.disabled = true;
        resendOtpBtn.textContent = `Resend in ${seconds}s`;
        return;
    }

    resendOtpBtn.disabled = false;
    resendOtpBtn.textContent = "Resend OTP";
    if (resendCooldownTimer) {
        clearInterval(resendCooldownTimer);
        resendCooldownTimer = null;
    }
}

function startResendCooldown() {
    resendCooldownUntil = Date.now() + RESEND_COOLDOWN_MS;
    updateResendButton();
    if (resendCooldownTimer) {
        clearInterval(resendCooldownTimer);
    }
    resendCooldownTimer = setInterval(updateResendButton, 500);
}

async function postOtpWithFallback(path, payload) {
    let lastError;
    for (const base of OTP_API_BASES) {
        try {
            const response = await fetch(buildOtpUrl(path, base), {
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
    throw lastError || new Error("OTP backend not reachable");
}

async function resendOTP() {
    if (!resendOtpBtn) {
        return;
    }

    if (Date.now() < resendCooldownUntil) {
        updateResendButton();
        setResendStatus("Please wait before requesting another OTP.", "error");
        return;
    }

    const loginType = localStorage.getItem("loginType");
    const mobile = localStorage.getItem("mobile") || "";
    const userEmail = localStorage.getItem("userEmail") || "";
    const useEmail = loginType === "email" || (!mobile && userEmail);

    const payload = {};
    if (useEmail) {
        if (!userEmail) {
            alert("Email missing. Please login again.");
            window.location.href = "login.html";
            return;
        }
        payload.email = userEmail;
        localStorage.setItem("loginType", "email");
    } else {
        if (!mobile) {
            alert("Mobile number missing. Please login again.");
            window.location.href = "login.html";
            return;
        }
        payload.mobile = `+91${mobile}`;
        localStorage.setItem("loginType", "phone");
    }

    resendOtpBtn.disabled = true;
    resendOtpBtn.textContent = "Sending...";
    setResendStatus("Requesting a new OTP...", "");
    let resendSucceeded = false;

    try {
        const { response, data } = await postOtpWithFallback("/api/auth/send-otp", payload);
        if (!response.ok || data.success === false) {
            setResendStatus(data.message || "OTP send failed. Please try again.", "error");
            return;
        }

        localStorage.removeItem("userOTPVerified");
        localStorage.removeItem("mockOTP");
        localStorage.removeItem("mockOTPExpiry");

        if (data.otp) {
            const expiresAt = Date.now() + 5 * 60 * 1000;
            localStorage.setItem("otpMode", "debug");
            localStorage.setItem("mockOTP", data.otp);
            localStorage.setItem("mockOTPExpiry", String(expiresAt));
            alert(`OTP (dev): ${data.otp}. Use it within 5 minutes.`);
            setResendStatus("New OTP generated for testing.", "success");
        } else {
            localStorage.setItem("otpMode", "api");
            setResendStatus("New OTP sent. Please check your inbox or SMS.", "success");
        }

        clearOtpInputs();
        resendSucceeded = true;
        startResendCooldown();
    } catch (error) {
        setResendStatus(
            `OTP send API error. Check backend availability at ${window.YUBUS_API?.describeTarget?.() || "http://localhost:8081"}.`,
            "error"
        );
    } finally {
        if (!resendSucceeded) {
            resendOtpBtn.disabled = false;
            resendOtpBtn.textContent = "Resend OTP";
        }
    }
}

inputs.forEach((input, index) => {
    input.addEventListener("input", () => {
        input.value = input.value.replace(/\D/g, "");
        if (input.value.length === 1 && index < inputs.length - 1) {
            inputs[index + 1].focus();
        }
    });

    input.addEventListener("keydown", (e) => {
        if (e.key === "Backspace" && input.value === "" && index > 0) {
            inputs[index - 1].focus();
        }
    });

    input.addEventListener("paste", (e) => {
        e.preventDefault();
        const pasteData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
        pasteData.split("").forEach((char, i) => {
            if (inputs[i]) {
                inputs[i].value = char;
            }
        });

        const focusIndex = Math.min(pasteData.length, 5);
        inputs[focusIndex].focus();
    });
});

if (resendOtpBtn) {
    resendOtpBtn.addEventListener("click", () => {
        void resendOTP();
    });
    updateResendButton();
}

if (otpBackBtn) {
    otpBackBtn.addEventListener("click", () => {
        window.location.href = "login.html";
    });
}

async function verifyOTP() {
    let otp = "";
    inputs.forEach(input => {
        otp += input.value;
    });

    if (!/^\d{6}$/.test(otp)) {
        alert("Please enter complete 6-digit OTP");
        return;
    }

    const otpMode = localStorage.getItem("otpMode");
    if (otpMode === "debug") {
        const mockOtp = localStorage.getItem("mockOTP") || "";
        const expiry = Number(localStorage.getItem("mockOTPExpiry") || "0");
        if (!mockOtp || !expiry || Date.now() > expiry) {
            alert("OTP expired. Please request a new OTP.");
            return;
        }
        if (otp !== mockOtp) {
            alert("Invalid OTP. Please try again.");
            return;
        }
        localStorage.setItem("userOTPVerified", "true");
        localStorage.removeItem("otpMode");
        localStorage.removeItem("mockOTP");
        localStorage.removeItem("mockOTPExpiry");
        alert("OTP Verified Successfully");
        window.location.href = "index.html";
        return;
    }

    const loginType = localStorage.getItem("loginType") || "phone";
    const mobile = localStorage.getItem("mobile") || "";
    const userEmail = localStorage.getItem("userEmail") || "";

    const payload = { otp };
    if (loginType === "email") {
        if (!userEmail) {
            alert("Email missing. Please login again.");
            window.location.href = "login.html";
            return;
        }
        payload.email = userEmail;
    } else {
        if (!mobile) {
            alert("Mobile number missing. Please login again.");
            window.location.href = "login.html";
            return;
        }
        payload.mobile = `+91${mobile}`;
    }

    try {
        let response;
        let data = {};
        let lastError;

        for (const base of OTP_API_BASES) {
            try {
                response = await fetch(buildOtpUrl("/api/auth/verify-otp", base), {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });
                data = await response.json().catch(() => ({}));
                break;
            } catch (error) {
                lastError = error;
            }
        }

        if (!response) {
            throw lastError || new Error("OTP verification backend not reachable");
        }

        if (!response.ok || data.success === false) {
            alert(data.message || "Invalid OTP. Please try again.");
            return;
        }

        localStorage.setItem("userOTPVerified", "true");
        localStorage.removeItem("otpMode");
        alert("OTP Verified Successfully");
        window.location.href = "index.html";
    } catch (error) {
        alert(`OTP verification API error. Check backend availability at ${window.YUBUS_API?.describeTarget?.() || "http://localhost:8081"}.`);
    }
}
