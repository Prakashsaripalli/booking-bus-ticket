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
