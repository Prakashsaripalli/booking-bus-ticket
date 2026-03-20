const API_BASES = window.YUBUS_API?.getBases?.() || [
    "http://localhost:8001",
    "http://127.0.0.1:8001",
    "http://localhost:8000",
    "http://127.0.0.1:8000"
];
const REGISTERED_USERS_KEY = "registeredUsers";
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

async function sendNotificationEmail(payload) {
    return postWithFallback("/api/notifications/email", payload);
}

function switchRole(role) {
    const adminShell = document.getElementById("adminLoginShell");
    const userShell = document.getElementById("userLoginShell");
    const roleTitle = document.getElementById("roleTitle");
    const statusMsg = document.getElementById("statusMsg");
    const adminStatusMsg = document.getElementById("adminStatusMsg");

    const isAdmin = role === "admin";

    if (adminShell) {
        adminShell.classList.toggle("hidden", !isAdmin);
    }

    if (userShell) {
        userShell.classList.toggle("hidden", isAdmin);
    }

    if (roleTitle) {
        roleTitle.textContent = "Admin Login";
    }

    if (statusMsg) {
        statusMsg.textContent = "Login with your registered email and password.";
    }

    if (adminStatusMsg) {
        adminStatusMsg.textContent = "Authorized admins only.";
    }

    if (window.history?.replaceState) {
        const nextUrl = isAdmin ? "login.html?role=admin" : "login.html";
        window.history.replaceState({}, "", nextUrl);
    }

    if (isAdmin) {
        closeSignup();
    }
}

async function adminLogin(event) {
    event.preventDefault();

    const identity = document.getElementById("adminIdentity").value.trim();
    const password = document.getElementById("adminPassword").value.trim();

    if (!identity || !password) {
        alert("Please fill username/email and password");
        return;
    }

    try {
        const { response, data } = await postWithFallback("/api/login", {
            role: "admin",
            identity,
            password
        });
        if (!response.ok || data.success === false) {
            alert(data.message || "Invalid admin credentials");
            return;
        }

        localStorage.setItem("adminLoggedIn", "true");
        localStorage.setItem("adminIdentity", identity);
        ["userEmail", "userIdentity", "userName", "userMobile", "mobile", "userOTPVerified", "googleLogin"].forEach((key) => {
            localStorage.removeItem(key);
        });
        alert("Admin login successful");
        window.location.href = "index.html";
    } catch (error) {
        alert(`Admin login API error. Check backend availability at ${window.YUBUS_API?.describeTarget?.() || "http://localhost:8000"}.`);
    }
}

function adminForgotPassword() {
    alert("Admin password reset is not available here. Please contact system administrator.");
}

function normalizeEmail(email) {
    return (email || "").trim().toLowerCase();
}

function getRegisteredUsers() {
    try {
        const parsedUsers = JSON.parse(localStorage.getItem(REGISTERED_USERS_KEY) || "[]");
        if (!Array.isArray(parsedUsers)) {
            return [];
        }
        return parsedUsers
            .filter((user) => user && typeof user.email === "string" && typeof user.password === "string")
            .map((user) => ({
                name: typeof user.name === "string" ? user.name.trim() : "",
                mobile: typeof user.mobile === "string" ? user.mobile.replace(/\D/g, "").slice(-10) : "",
                email: normalizeEmail(user.email),
                password: user.password
            }));
    } catch (error) {
        return [];
    }
}

function saveRegisteredUsers(users) {
    localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(users));
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

function storeCurrentUserProfile(user) {
    const email = normalizeEmail(user?.email);
    const name = typeof user?.name === "string" ? user.name.trim() : "";
    const mobile = typeof user?.mobile === "string" ? user.mobile.replace(/\D/g, "").slice(-10) : "";

    localStorage.setItem("userEmail", email);
    localStorage.setItem("userIdentity", email);
    localStorage.setItem("userName", name);
    localStorage.setItem("userMobile", mobile);

    if (mobile) {
        localStorage.setItem("mobile", mobile);
        return;
    }

    localStorage.removeItem("mobile");
}

async function sendEmailOtpAndNavigate(email) {
    try {
        const { response, data } = await postWithFallback("/api/auth/send-otp", { email });
        if (!response.ok || data.success === false) {
            alert(data.message || "OTP send failed. Check backend email settings.");
            return false;
        }

        localStorage.removeItem("userOTPVerified");
        localStorage.removeItem("mockOTP");
        localStorage.removeItem("mockOTPExpiry");
        localStorage.removeItem("otpMode");
        localStorage.setItem("loginType", "email");
        alert(`OTP sent to ${email}. Please check your email inbox/spam.`);
        window.location.href = "otp.html";
        return true;
    } catch (error) {
        alert(`Backend not reachable. Check backend availability at ${window.YUBUS_API?.describeTarget?.() || "http://localhost:8000"}.`);
        return false;
    }
}

function seedLegacyUser() {
    const legacyEmail = normalizeEmail(localStorage.getItem("userEmail") || localStorage.getItem("userIdentity"));
    const legacyPassword = (localStorage.getItem("userPassword") || "").trim();

    if (!EMAIL_REGEX.test(legacyEmail) || !legacyPassword) {
        return;
    }

    const users = getRegisteredUsers();
    const alreadyRegistered = users.some((user) => user.email === legacyEmail);
    if (alreadyRegistered) {
        return;
    }

    users.push({ name: "", mobile: "", email: legacyEmail, password: legacyPassword });
    saveRegisteredUsers(users);
}

function openSignup() {
    const loginCard = document.getElementById("loginCard");
    const signupCard = document.getElementById("signupCard");
    const signupForm = document.getElementById("signupForm");
    if (!loginCard || !signupCard || !signupForm) {
        return;
    }

    switchRole("user");
    signupCard.setAttribute("aria-hidden", "false");
    loginCard.classList.add("hidden");
    signupCard.classList.remove("hidden");
    signupForm.reset();
    document.getElementById("signupEmail").value = normalizeEmail(document.getElementById("userIdentity").value);
    document.getElementById("signupName").focus();
}

function closeSignup() {
    const loginCard = document.getElementById("loginCard");
    const signupCard = document.getElementById("signupCard");
    if (!loginCard || !signupCard) {
        return;
    }
    loginCard.classList.remove("hidden");
    signupCard.classList.add("hidden");
    signupCard.setAttribute("aria-hidden", "true");
}

async function signupUser(event) {
    event.preventDefault();

    const name = document.getElementById("signupName").value.trim();
    const email = normalizeEmail(document.getElementById("signupEmail").value);
    const mobile = document.getElementById("signupMobile").value.replace(/\D/g, "").slice(-10);
    const password = document.getElementById("signupPassword").value.trim();
    const confirmPassword = document.getElementById("signupConfirmPassword").value.trim();
    const mobileRegex = /^[6-9]\d{9}$/;

    if (!name) {
        alert("Please enter full name.");
        return;
    }
    if (!EMAIL_REGEX.test(email)) {
        alert("Please enter a valid email.");
        return;
    }
    if (!mobileRegex.test(mobile)) {
        alert("Please enter a valid 10-digit Indian mobile number.");
        return;
    }
    if (password.length < 4) {
        alert("Password must be at least 4 characters.");
        return;
    }
    if (password !== confirmPassword) {
        alert("Password and confirm password must match.");
        return;
    }

    try {
        const { response, data } = await postWithFallback("/api/login", {
            action: "signup",
            role: "user",
            identity: email,
            password: password
        });

        if (!response.ok || data.success === false) {
            alert(data.message || "Signup failed on the backend");
            return;
        }

        const users = getRegisteredUsers();
        const alreadyRegistered = users.some((user) => user.email === email);
        if (!alreadyRegistered) {
            users.push({ name, mobile, email, password });
            saveRegisteredUsers(users);
        }

        localStorage.removeItem("adminLoggedIn");
        localStorage.removeItem("adminIdentity");
        localStorage.removeItem("googleLogin");
        localStorage.setItem("userPassword", password);
        storeCurrentUserProfile({ name, mobile, email });

        closeSignup();
        await sendEmailOtpAndNavigate(email);
    } catch (error) {
        alert(`Signup error. Backend not reachable.`);
    }
}

function forgotPassword() {
    const typedEmail = normalizeEmail(document.getElementById("userIdentity").value);
    if (EMAIL_REGEX.test(typedEmail)) {
        window.location.href = `reset-password.html?email=${encodeURIComponent(typedEmail)}`;
        return;
    }

    window.location.href = "reset-password.html";
}

async function loginUser(event) {
    if (event) {
        event.preventDefault();
    }

    const email = normalizeEmail(document.getElementById("userIdentity").value);
    const userPassword = document.getElementById("userPassword").value.trim();

    if (!EMAIL_REGEX.test(email)) {
        alert("Please enter a valid registered email.");
        return;
    }
    if (!userPassword) {
        alert("Please enter password");
        return;
    }

    try {
        const { response, data } = await postWithFallback("/api/login", {
            action: "login",
            role: "user",
            identity: email,
            password: userPassword
        });

        if (!response.ok || data.success === false) {
            alert(data.message || "Login failed on the backend");
            return;
        }

        const users = getRegisteredUsers();
        let matchedUser = users.find((user) => user.email === email);
        if (!matchedUser) {
            // Seed local storage with backend data if missing
            matchedUser = { name: "", mobile: "", email, password: userPassword };
            users.push(matchedUser);
            saveRegisteredUsers(users);
        }

        localStorage.removeItem("adminLoggedIn");
        localStorage.removeItem("adminIdentity");
        localStorage.removeItem("googleLogin");
        localStorage.setItem("userPassword", userPassword);
        storeCurrentUserProfile(matchedUser);
        await sendEmailOtpAndNavigate(email);
    } catch (error) {
        alert(`Login error. Backend not reachable.`);
    }
}

function googleLogin() {
    localStorage.setItem("googleLogin", "true");
    localStorage.setItem("userOTPVerified", "true");
    localStorage.removeItem("userName");
    localStorage.removeItem("userMobile");
    localStorage.removeItem("mobile");
    window.location.href = "index.html";
}

document.addEventListener("DOMContentLoaded", () => {
    seedLegacyUser();
    const params = new URLSearchParams(window.location.search);
    const role = params.get("role") === "admin" ? "admin" : "user";
    switchRole(role);

    const resetEmail = normalizeEmail(params.get("email"));
    if (EMAIL_REGEX.test(resetEmail)) {
        const userIdentityInput = document.getElementById("userIdentity");
        if (userIdentityInput) {
            userIdentityInput.value = resetEmail;
        }
    }
});
