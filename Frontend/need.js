const FEEDBACK_STORAGE_KEY = "supportFeedback";
const ADMIN_FEATURES_KEY = "adminFeatureModules";
const SUPPORT_UNAVAILABLE_MESSAGE = "Right now the Support Assistant is not working. Please try again after the module is active.";

const chatMessages = document.getElementById("chatMessages");
const chatForm = document.getElementById("chatForm");
const chatInput = document.getElementById("chatInput");
const routeQuickSelect = document.getElementById("routeQuickSelect");
const speechBtn = document.getElementById("speechBtn");
const speechLanguage = document.getElementById("speechLanguage");
const speechStatus = document.getElementById("speechStatus");
const quickHelp = document.getElementById("quickHelp");
const feedbackPanel = document.getElementById("feedbackPanel");
const feedbackButtons = document.querySelectorAll(".feedback-btn");
const feedbackNote = document.getElementById("feedbackNote");
const supportUnavailableBanner = document.getElementById("supportUnavailableBanner");
const chatStatusLabel = document.getElementById("chatStatusLabel");
const chatStatusDot = document.getElementById("chatStatusDot");
const chatStatus = chatStatusLabel?.closest(".chat-status");
const sendBtn = chatForm?.querySelector(".send-btn");
const quickHelpButtons = quickHelp?.querySelectorAll("[data-query]") || [];
const speechSupportAvailable = Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);

let lastBotReply = "";
let speechRecognition = null;
let speechRecognitionActive = false;
let supportPauseMessageShown = false;
const bookingChatState = {
    awaitingDate: false,
    route: null
};

const fallbackCities = [
    "Hyderabad",
    "Delhi",
    "Bangalore",
    "Chennai",
    "Goa",
    "Vijayawada",
    "Nellore",
    "Jaipur",
    "Mangalore",
    "Tirupati",
    "Visakhapatnam",
    "Madurai",
    "Lucknow"
];

const cityAliases = {
    hyderabad: "Hyderabad",
    hyderbad: "Hyderabad",
    hyderabed: "Hyderabad",
    hyberabad: "Hyderabad",
    hydrabad: "Hyderabad",
    "हैदराबाद": "Hyderabad",
    "హైదరాబాద్": "Hyderabad",
    "హైదరాబాదు": "Hyderabad",
    "ஹைதராபாத்": "Hyderabad",
    "ಹೈದರಾಬಾದ್": "Hyderabad",
    "ഹൈദരാബാദ്": "Hyderabad",
    "হায়দরাবাদ": "Hyderabad",
    delhi: "Delhi",
    "दिल्ली": "Delhi",
    "ఢిల్లీ": "Delhi",
    "டெல்லி": "Delhi",
    "ದೆಹಲಿ": "Delhi",
    "ഡൽഹി": "Delhi",
    "দিল্লি": "Delhi",
    bangalore: "Bangalore",
    bengaluru: "Bangalore",
    "बैंगलोर": "Bangalore",
    "बेंगलुरु": "Bangalore",
    "బెంగళూరు": "Bangalore",
    "பெங்களூரு": "Bangalore",
    "ಬೆಂಗಳೂರು": "Bangalore",
    "ബെംഗളൂരു": "Bangalore",
    "বেঙ্গালুরু": "Bangalore",
    chennai: "Chennai",
    "चेन्नई": "Chennai",
    "చెన్నై": "Chennai",
    "சென்னை": "Chennai",
    "ಚೆನ್ನೈ": "Chennai",
    "ചെന്നൈ": "Chennai",
    "চেন্নাই": "Chennai",
    goa: "Goa",
    "गोवा": "Goa",
    "గోవా": "Goa",
    "கோவா": "Goa",
    "ಗೋವಾ": "Goa",
    "ഗോവ": "Goa",
    "গোয়া": "Goa",
    vijayawada: "Vijayawada",
    "विजयवाड़ा": "Vijayawada",
    "విజయవాడ": "Vijayawada",
    "விஜயவாடா": "Vijayawada",
    "ವಿಜಯವಾಡ": "Vijayawada",
    "വിജയവാഡ": "Vijayawada",
    nellore: "Nellore",
    "नेल्लोर": "Nellore",
    "నెల్లూరు": "Nellore",
    "நெல்லூர்": "Nellore",
    "ನೆಲ್ಲೂರು": "Nellore",
    "നെല്ലൂർ": "Nellore",
    jaipur: "Jaipur",
    "जयपुर": "Jaipur",
    "జైపూర్": "Jaipur",
    "ஜெய்ப்பூர்": "Jaipur",
    "ಜೈಪುರ": "Jaipur",
    "ജയ്പൂർ": "Jaipur",
    "জয়পুর": "Jaipur",
    mangalore: "Mangalore",
    "मंगलुरु": "Mangalore",
    "మಂಗಳೂರು": "Mangalore",
    "மங்களூர்": "Mangalore",
    "ಮಂಗಳೂರು": "Mangalore",
    "മംഗളൂരു": "Mangalore",
    tirupati: "Tirupati",
    "तिरुपति": "Tirupati",
    "తిరుపతి": "Tirupati",
    "திருப்பதி": "Tirupati",
    "ತಿರುಪತಿ": "Tirupati",
    "തിരുപ്പതി": "Tirupati",
    visakhapatnam: "Visakhapatnam",
    vizag: "Visakhapatnam",
    "विशाखापट्टनम": "Visakhapatnam",
    "విశాఖపట్నం": "Visakhapatnam",
    "விசாகப்பட்டினம்": "Visakhapatnam",
    "ವಿಶಾಖಪಟ್ಟಣಂ": "Visakhapatnam",
    "വിശാഖപട്ടണം": "Visakhapatnam",
    madurai: "Madurai",
    "मदुरै": "Madurai",
    "மதுரை": "Madurai",
    "లక్నో": "Lucknow",
    lucknow: "Lucknow",
    "लखनऊ": "Lucknow",
    "லக்னோ": "Lucknow",
    "ಲಖನೌ": "Lucknow",
    "লখনউ": "Lucknow"
};

const intentTerms = {
    latestBooking: ["latest booking", "my booking", "booking details", "नवीनतम बुकिंग", "मेरी बुकिंग", "నా బుకింగ్", "என் புக்கிங்", "ನನ್ನ ಬುಕಿಂಗ್", "আমার বুকিং"],
    cancelTicket: ["cancel ticket", "cancel my ticket", "टिकट रद्द", "టికెట్ రద్దు", "டிக்கெட் ரத்து", "ಟಿಕೆಟ್ ರದ್ದು", "টিকিট বাতিল"],
    removeTicket: ["remove", "delete booking", "बुकिंग हटाओ", "తొలగించు", "நீக்கு", "ಅಳಿಸಿ"],
    payment: ["payment", "upi", "transaction", "pay", "भुगतान", "पेमेंट", "చెల్లింపు", "పేమెంట్", "கட்டணம்", "ಪಾವತಿ", "পেমেন্ট"],
    tracking: ["track", "live location", "tracking", "ट्रैक", "లైవ్ లొకేషన్", "லைவ் லொகேஷன்", "ಟ್ರ್ಯಾಕ್", "ট্র্যাক"],
    profile: ["edit profile", "update profile", "profile", "प्रोफाइल", "ప్రొఫైల్", "சுயவிவரம்", "ಪ್ರೊಫೈಲ್", "প্রোফাইল"],
    offers: ["offer", "discount", "coupon", "ऑफर", "డిస్కౌంట్", "தள்ளுபடி", "ಆಫರ್", "অফার"],
    login: ["login", "sign up", "otp", "log in", "लॉगिन", "లాగిన్", "உள்நுழை", "ಲಾಗಿನ್", "লগইন"],
    routeSearch: ["bus route", "search buses", "view buses", "find buses", "बस रूट", "బస్ రూట్", "பஸ்", "ಬಸ್ ಮಾರ್ಗ", "বাস রুট"],
    refund: ["refund", "money back", "रिफंड", "వాపసు", "பணத்தை திரும்ப", "ರಿಫಂಡ್", "রিফান্ড"],
    help: ["help", "support", "agent", "human", "मदद", "సహాయం", "உதவி", "ಸಹಾಯ", "সহায়তা"],
    bookRoute: ["book", "ticket", "bus", "travel", "available", "search", "बुक", "टिकट", "बस", "బుక్", "టికెట్", "బస్", "புக்", "டிக்கெட்", "பஸ்", "ಬುಕ್", "ಟಿಕೆಟ್", "ಬಸ್", "বুক", "টিকিট", "বাস"]
};

const phraseAliases = [
    { canonical: "latest booking", variants: ["latest booking", "my latest booking", "booking details", "मेरी बुकिंग", "नवीनतम बुकिंग", "నా బుకింగ్", "என் புக்கிங்", "ನನ್ನ ಬುಕಿಂಗ್", "আমার বুকিং"] },
    { canonical: "payment help", variants: ["payment failed", "payment help", "payment issue", "upi issue", "transaction issue", "भुगतान", "पेमेंट", "చెల్లింపు", "கட்டணம்", "ಪಾವತಿ", "পেমেন্ট"] },
    { canonical: "track my bus", variants: ["track my bus", "live location", "tracking", "ट्रैक", "ట్రాక్", "லைவ் லொகேஷன்", "ಟ್ರ್ಯಾಕ್", "ট্র্যাক"] },
    { canonical: "edit profile", variants: ["edit profile", "update profile", "profile", "प्रोफाइल", "ప్రొఫైల్", "சுயவிவரம்", "ಪ್ರೊಫೈಲ್", "প্রোফাইল"] },
    { canonical: "cancel ticket", variants: ["cancel ticket", "cancel my ticket", "टिकट रद्द", "టికెట్ రద్దు", "டிக்கெட் ரத்து", "ಟಿಕೆಟ್ ರದ್ದು", "টিকিট বাতিল"] },
    { canonical: "offers", variants: ["offers", "discount", "coupon", "ऑफर", "డిస్కౌంట్", "தள்ளுபடி", "ಆಫರ್", "অফার"] },
    { canonical: "login help", variants: ["login", "sign up", "otp", "लॉगिन", "లాగిన్", "உள்நுழை", "ಲಾಗಿನ್", "লগইন"] },
    { canonical: "refund", variants: ["refund", "money back", "रिफंड", "వాపసు", "பணத்தை திரும்ப", "ರಿಫಂಡ್", "রিফান্ড"] },
    { canonical: "help", variants: ["help", "support", "agent", "human", "मदद", "సహాయం", "உதவி", "ಸಹಾಯ", "সহায়তা"] }
];

function normalizeText(value) {
    return (value || "").trim().toLowerCase();
}

function cleanNaturalText(value) {
    return normalizeText(value)
        .replace(/[^\p{L}\p{N}\s/-]/gu, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function levenshteinDistance(source, target) {
    if (source === target) {
        return 0;
    }

    if (!source.length) {
        return target.length;
    }

    if (!target.length) {
        return source.length;
    }

    const matrix = Array.from({ length: source.length + 1 }, (_, row) => [row]);
    for (let col = 1; col <= target.length; col += 1) {
        matrix[0][col] = col;
    }

    for (let row = 1; row <= source.length; row += 1) {
        for (let col = 1; col <= target.length; col += 1) {
            const cost = source[row - 1] === target[col - 1] ? 0 : 1;
            matrix[row][col] = Math.min(
                matrix[row - 1][col] + 1,
                matrix[row][col - 1] + 1,
                matrix[row - 1][col - 1] + cost
            );
        }
    }

    return matrix[source.length][target.length];
}

function replaceKnownCityAliases(text) {
    const aliases = Object.keys(cityAliases).sort((a, b) => b.length - a.length);
    let normalized = text;

    aliases.forEach((alias) => {
        const pattern = new RegExp(`(^|\\s)${escapeRegex(normalizeText(alias))}($|\\s)`, "gu");
        normalized = normalized.replace(pattern, (match, leading, trailing) => `${leading}${normalizeText(cityAliases[alias])}${trailing}`);
    });

    return normalized.replace(/\s+/g, " ").trim();
}

function applyPhraseAliases(text) {
    let enriched = text;

    phraseAliases.forEach((entry) => {
        if (entry.variants.some((variant) => enriched.includes(normalizeText(variant)))) {
            enriched += ` ${entry.canonical}`;
        }
    });

    return enriched.trim();
}

function prepareSupportText(value) {
    const cleaned = cleanNaturalText(value);
    const withCities = replaceKnownCityAliases(cleaned);
    return applyPhraseAliases(withCities);
}

function hasIntent(text, intentKey) {
    const terms = intentTerms[intentKey] || [];
    const preparedText = prepareSupportText(text);
    return terms.some((term) => preparedText.includes(normalizeText(term)));
}

function getSpeechRecognitionLang() {
    if (!speechLanguage) {
        return "en-IN";
    }

    if (speechLanguage.value !== "auto") {
        return speechLanguage.value;
    }

    return navigator.languages?.[0] || navigator.language || "en-IN";
}

function getClosestCityToken(token) {
    const candidates = [...new Set(getCatalogCities().map((city) => normalizeText(city)))];
    let bestMatch = "";
    let bestDistance = Number.POSITIVE_INFINITY;

    candidates.forEach((candidate) => {
        const distance = levenshteinDistance(token, candidate);
        if (distance < bestDistance) {
            bestDistance = distance;
            bestMatch = candidate;
        }
    });

    return bestDistance <= 2 ? bestMatch : "";
}

function setSpeechStatus(message, isError = false) {
    if (!speechStatus) {
        return;
    }

    speechStatus.textContent = message;
    speechStatus.classList.toggle("error", isError);
}

function getAdminFeatureModules() {
    try {
        const parsedModules = JSON.parse(localStorage.getItem(ADMIN_FEATURES_KEY) || "[]");
        return Array.isArray(parsedModules) ? parsedModules : [];
    } catch (error) {
        return [];
    }
}

function isSupportAssistantActive() {
    const adminModules = getAdminFeatureModules();

    if (adminModules.length === 0) {
        return true;
    }

    const supportModule = adminModules.find((module) => module?.id === "support");
    return typeof supportModule?.active === "boolean" ? supportModule.active : true;
}

function ensureSupportPausedMessage() {
    if (supportPauseMessageShown || !chatMessages) {
        return;
    }

    addMessage("bot", SUPPORT_UNAVAILABLE_MESSAGE);
    supportPauseMessageShown = true;
}

function applySupportAssistantState() {
    const supportAssistantActive = isSupportAssistantActive();

    if (supportUnavailableBanner) {
        supportUnavailableBanner.hidden = supportAssistantActive;
    }

    if (chatStatus) {
        chatStatus.classList.toggle("paused", !supportAssistantActive);
    }

    if (chatStatusLabel) {
        chatStatusLabel.textContent = supportAssistantActive ? "Online" : "Paused";
    }

    if (chatStatusDot) {
        chatStatusDot.setAttribute("aria-hidden", "true");
    }

    if (chatInput) {
        chatInput.disabled = !supportAssistantActive;
        chatInput.placeholder = supportAssistantActive
            ? "Ask about booking, payment, cancellation, tracking, profile..."
            : "Right now the Support Assistant is not working";
    }

    if (sendBtn) {
        sendBtn.disabled = !supportAssistantActive;
    }

    if (routeQuickSelect) {
        routeQuickSelect.disabled = !supportAssistantActive;
        if (!supportAssistantActive) {
            routeQuickSelect.value = "";
        }
    }

    quickHelpButtons.forEach((button) => {
        button.disabled = !supportAssistantActive;
    });

    feedbackButtons.forEach((button) => {
        button.disabled = !supportAssistantActive;
    });

    if (speechLanguage) {
        speechLanguage.disabled = !supportAssistantActive || !speechSupportAvailable;
    }

    if (speechBtn) {
        speechBtn.disabled = !supportAssistantActive || !speechSupportAvailable;
    }

    if (!supportAssistantActive) {
        stopSpeechRecognition();
        setSpeechStatus("Support Assistant is paused right now.", true);
        ensureSupportPausedMessage();
        return;
    }

    supportPauseMessageShown = false;
    if (speechRecognition) {
        setSpeechStatus("Voice ready");
    } else if (!speechSupportAvailable) {
        setSpeechStatus("Voice input is not supported in this browser.", true);
    }
}

function syncSpeechButton() {
    if (!speechBtn) {
        return;
    }

    speechBtn.classList.toggle("active", speechRecognitionActive);
    speechBtn.innerHTML = speechRecognitionActive
        ? '<i class="fa-solid fa-microphone-lines"></i> Listening'
        : '<i class="fa-solid fa-microphone"></i> Speak';
}

function stopSpeechRecognition() {
    if (!speechRecognition || !speechRecognitionActive) {
        return;
    }

    speechRecognition.stop();
}

function initSpeechRecognition() {
    if (!speechBtn || !speechLanguage) {
        return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
        speechBtn.disabled = true;
        speechLanguage.disabled = true;
        setSpeechStatus("Voice input is not supported in this browser.", true);
        return;
    }

    speechRecognition = new SpeechRecognition();
    speechRecognition.lang = getSpeechRecognitionLang();
    speechRecognition.interimResults = true;
    speechRecognition.continuous = false;
    speechRecognition.maxAlternatives = 3;

    speechLanguage.addEventListener("change", () => {
        speechRecognition.lang = getSpeechRecognitionLang();
        setSpeechStatus(
            speechLanguage.value === "auto"
                ? `Voice language uses browser default: ${speechRecognition.lang}`
                : `Voice language set to ${speechLanguage.options[speechLanguage.selectedIndex]?.text || "selected language"}`
        );
    });

    speechRecognition.addEventListener("start", () => {
        speechRecognitionActive = true;
        syncSpeechButton();
        setSpeechStatus("Listening...");
    });

    speechRecognition.addEventListener("result", (event) => {
        let transcript = "";

        for (let i = event.resultIndex; i < event.results.length; i += 1) {
            transcript += event.results[i][0].transcript;
        }

        chatInput.value = transcript.trim();
        setSpeechStatus("Speech captured. Review the text and send.");
    });

    speechRecognition.addEventListener("end", () => {
        speechRecognitionActive = false;
        syncSpeechButton();
        if (!chatInput.value.trim()) {
            setSpeechStatus("Voice ready");
        }
    });

    speechRecognition.addEventListener("error", (event) => {
        speechRecognitionActive = false;
        syncSpeechButton();

        if (event.error === "not-allowed" || event.error === "service-not-allowed") {
            setSpeechStatus("Microphone permission is blocked.", true);
            return;
        }

        if (event.error === "no-speech") {
            setSpeechStatus("No speech detected. Try again.");
            return;
        }

        setSpeechStatus(`Voice input error: ${event.error}`, true);
    });

    speechBtn.addEventListener("click", () => {
        if (!speechRecognition) {
            return;
        }

        if (speechRecognitionActive) {
            stopSpeechRecognition();
            return;
        }

        speechRecognition.lang = getSpeechRecognitionLang();

        try {
            speechRecognition.start();
        } catch (error) {
            setSpeechStatus("Voice input could not start. Try again.", true);
        }
    });

    syncSpeechButton();
    setSpeechStatus("Voice ready");
}

function escapeRegex(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getTodayDateString() {
    return new Date().toISOString().split("T")[0];
}

function getTomorrowDateString() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
}

function formatDateToIso(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function createValidatedDate(year, month, day) {
    const date = new Date(year, month - 1, day);
    if (
        Number.isNaN(date.getTime()) ||
        date.getFullYear() !== year ||
        date.getMonth() !== month - 1 ||
        date.getDate() !== day
    ) {
        return null;
    }

    return date;
}

function resolveYearForMonthDay(month, day) {
    const today = new Date();
    let year = today.getFullYear();
    let candidate = createValidatedDate(year, month, day);

    if (!candidate) {
        return null;
    }

    const todayIso = formatDateToIso(today);
    if (formatDateToIso(candidate) < todayIso) {
        year += 1;
        candidate = createValidatedDate(year, month, day);
    }

    return candidate;
}

function parseWeekdayDate(normalized) {
    const weekdays = {
        sunday: 0,
        monday: 1,
        tuesday: 2,
        wednesday: 3,
        thursday: 4,
        friday: 5,
        saturday: 6
    };

    const match = normalized.match(/\b(?:next\s+)?(sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b/);
    if (!match) {
        return null;
    }

    const today = new Date();
    const currentDay = today.getDay();
    let offset = (weekdays[match[1]] - currentDay + 7) % 7;

    if (offset === 0 || normalized.includes("next")) {
        offset += 7;
    }

    const target = new Date(today);
    target.setDate(today.getDate() + offset);
    return target;
}

function parseMonthNameDate(normalized) {
    const monthMap = {
        jan: 1, january: 1,
        feb: 2, february: 2,
        mar: 3, march: 3,
        apr: 4, april: 4,
        may: 5,
        jun: 6, june: 6,
        jul: 7, july: 7,
        aug: 8, august: 8,
        sep: 9, sept: 9, september: 9,
        oct: 10, october: 10,
        nov: 11, november: 11,
        dec: 12, december: 12
    };

    const monthNames = Object.keys(monthMap).sort((a, b) => b.length - a.length).join("|");
    const dayFirstMatch = normalized.match(new RegExp(`\\b(\\d{1,2})(?:st|nd|rd|th)?\\s+(${monthNames})(?:\\s+(\\d{4}))?\\b`, "i"));
    if (dayFirstMatch) {
        const day = Number.parseInt(dayFirstMatch[1], 10);
        const month = monthMap[dayFirstMatch[2].toLowerCase()];
        const date = dayFirstMatch[3]
            ? createValidatedDate(Number.parseInt(dayFirstMatch[3], 10), month, day)
            : resolveYearForMonthDay(month, day);
        if (date) {
            return date;
        }
    }

    const monthFirstMatch = normalized.match(new RegExp(`\\b(${monthNames})\\s+(\\d{1,2})(?:st|nd|rd|th)?(?:\\s*,?\\s*(\\d{4}))?\\b`, "i"));
    if (monthFirstMatch) {
        const month = monthMap[monthFirstMatch[1].toLowerCase()];
        const day = Number.parseInt(monthFirstMatch[2], 10);
        const date = monthFirstMatch[3]
            ? createValidatedDate(Number.parseInt(monthFirstMatch[3], 10), month, day)
            : resolveYearForMonthDay(month, day);
        if (date) {
            return date;
        }
    }

    return null;
}

function parseNumericDate(normalized) {
    const yearFirstMatch = normalized.match(/\b(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})\b/);
    if (yearFirstMatch) {
        return createValidatedDate(
            Number.parseInt(yearFirstMatch[1], 10),
            Number.parseInt(yearFirstMatch[2], 10),
            Number.parseInt(yearFirstMatch[3], 10)
        );
    }

    const fullMatch = normalized.match(/\b(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})\b/);
    if (fullMatch) {
        const first = Number.parseInt(fullMatch[1], 10);
        const second = Number.parseInt(fullMatch[2], 10);
        const year = Number.parseInt(fullMatch[3], 10);

        const dayFirst = createValidatedDate(year, second, first);
        const monthFirst = createValidatedDate(year, first, second);

        if (first > 12 && dayFirst) {
            return dayFirst;
        }

        if (second > 12 && monthFirst) {
            return monthFirst;
        }

        return dayFirst || monthFirst;
    }

    const shortMatch = normalized.match(/\b(\d{1,2})[\/\-\.](\d{1,2})\b/);
    if (shortMatch) {
        const first = Number.parseInt(shortMatch[1], 10);
        const second = Number.parseInt(shortMatch[2], 10);

        if (first > 12) {
            return resolveYearForMonthDay(second, first);
        }

        if (second > 12) {
            return resolveYearForMonthDay(first, second);
        }

        return resolveYearForMonthDay(second, first) || resolveYearForMonthDay(first, second);
    }

    return null;
}

function getCatalogCities() {
    if (!Array.isArray(window.BUS_CATALOG) || window.BUS_CATALOG.length === 0) {
        return fallbackCities;
    }

    const unique = new Set();
    window.BUS_CATALOG.forEach((bus) => {
        unique.add(bus.fromCity);
        unique.add(bus.toCity);
    });
    return Array.from(unique);
}

function resolveCityName(rawText) {
    const cleaned = prepareSupportText(rawText);
    if (!cleaned) {
        return "";
    }

    if (cityAliases[cleaned]) {
        return cityAliases[cleaned];
    }

    return getCatalogCities().find((city) => normalizeText(city) === cleaned) || "";
}

function extractCityFromFragment(fragment) {
    const cleaned = prepareSupportText(fragment);
    if (!cleaned) {
        return "";
    }

    const variants = [
        ...Object.keys(cityAliases),
        ...getCatalogCities().map((city) => normalizeText(city))
    ].sort((a, b) => b.length - a.length);

    const matchedVariant = variants.find((variant) => {
        const tokenPattern = new RegExp(`(^|\\s)${escapeRegex(variant)}($|\\s)`, "u");
        return tokenPattern.test(cleaned);
    });
    if (matchedVariant) {
        return resolveCityName(matchedVariant);
    }

    const closestToken = cleaned
        .split(" ")
        .map((token) => getClosestCityToken(token))
        .find(Boolean);

    return closestToken ? resolveCityName(closestToken) : "";
}

function extractRouteFromText(query) {
    const cleaned = prepareSupportText(query);
    if (!cleaned) {
        return null;
    }

    const variants = [
        ...Object.keys(cityAliases),
        ...getCatalogCities().map((city) => normalizeText(city))
    ];

    const matches = variants
        .map((variant) => ({
            variant,
            index: cleaned.indexOf(variant),
            city: resolveCityName(variant)
        }))
        .filter((entry) => entry.index >= 0 && entry.city)
        .sort((a, b) => a.index - b.index);

    if (matches.length < 2) {
        return null;
    }

    const from = matches[0].city;
    const nextMatch = matches.find((entry) => entry.city !== from);
    if (!nextMatch) {
        return null;
    }

    return { from, to: nextMatch.city };
}

function parseJourneyDate(text) {
    const normalized = prepareSupportText(text);

    if (normalized.includes("day after tomorrow")) {
        const date = new Date();
        date.setDate(date.getDate() + 2);
        return formatDateToIso(date);
    }

    if (normalized.includes("today")) {
        return getTodayDateString();
    }

    if (normalized.includes("tomorrow")) {
        return getTomorrowDateString();
    }

    const weekdayDate = parseWeekdayDate(normalized);
    if (weekdayDate) {
        return formatDateToIso(weekdayDate);
    }

    const monthNameDate = parseMonthNameDate(normalized);
    if (monthNameDate) {
        return formatDateToIso(monthNameDate);
    }

    const numericDate = parseNumericDate(normalized);
    if (numericDate) {
        return formatDateToIso(numericDate);
    }

    return "";
}

function isPastDate(dateValue) {
    return !!dateValue && dateValue < getTodayDateString();
}

function buildChatReply(text, actions = []) {
    return { text, actions };
}

function buildDatePromptReply(route, text) {
    return buildChatReply(text, [{
        type: "date-picker",
        label: "Show Buses",
        min: getTodayDateString(),
        route
    }]);
}

function getSeatSelectionHref(bus, dateValue) {
    const resolvedBus = typeof window.normalizeCatalogBus === "function"
        ? window.normalizeCatalogBus(bus)
        : {
            ...bus,
            busType: String(bus?.busType || "Standard")
        };

    const query = new URLSearchParams({
        busId: String(resolvedBus.id || ""),
        name: resolvedBus.name || "",
        from: resolvedBus.fromCity || "",
        to: resolvedBus.toCity || "",
        price: String(resolvedBus.price || ""),
        busType: String(resolvedBus.busType || "Standard"),
        date: dateValue || "",
        departureTime: resolvedBus.departureTime || ""
    });

    return `booking.html?layoutRev=20260307-seatlayout-v28&${query.toString()}`;
}

function buildBusReply(route, dateValue, buses) {
    const lines = [`Available buses for ${route.from} to ${route.to} on ${dateValue}:`];
    const listedBuses = buses
        .map((bus) => typeof window.normalizeCatalogBus === "function" ? window.normalizeCatalogBus(bus) : bus)
        .slice(0, 6);

    listedBuses.forEach((bus, index) => {
        lines.push(`${index + 1}. ${bus.name} | ${bus.departureTime} | ${bus.busType || "Standard"} | Rs.${bus.price}`);
    });

    if (buses.length > 6) {
        lines.push(`+${buses.length - 6} more buses available on this route.`);
    }

    const query = new URLSearchParams({
        from: route.from,
        to: route.to,
        date: dateValue
    });

    const actions = listedBuses.map((bus, index) => ({
        label: `${index + 1}. ${bus.name}`,
        href: getSeatSelectionHref(bus, dateValue)
    }));

    actions.push({
        label: "Continue to Available Buses",
        href: `result.html?${query.toString()}`
    });

    return buildChatReply(lines.join("\n"), actions);
}

function getAllAvailableRoutes() {
    if (!Array.isArray(window.BUS_CATALOG) || window.BUS_CATALOG.length === 0) {
        return [];
    }

    const routeMap = new Map();
    window.BUS_CATALOG.forEach((bus) => {
        const key = `${bus.fromCity}|||${bus.toCity}`;
        if (!routeMap.has(key)) {
            routeMap.set(key, {
                from: bus.fromCity,
                to: bus.toCity
            });
        }
    });

    return Array.from(routeMap.values())
        .sort((a, b) => a.from.localeCompare(b.from) || a.to.localeCompare(b.to));
}

function getLatestBookingRecord(bookings) {
    if (!Array.isArray(bookings) || bookings.length === 0) {
        return null;
    }

    return bookings
        .slice()
        .sort((a, b) => new Date(b.bookedAt || 0) - new Date(a.bookedAt || 0))[0] || null;
}

function getTrackHrefFromBooking(booking) {
    if (!booking) {
        return "track.html";
    }

    const query = new URLSearchParams({
        from: booking.from || "",
        to: booking.to || "",
        date: booking.journeyDate || "",
        departureTime: booking.departureTime || "",
        busName: booking.busName || "",
        bookingId: booking.bookingId || ""
    });

    return `track.html?${query.toString()}`;
}

function getLatestBookingReply(bookings) {
    const latestBooking = getLatestBookingRecord(bookings);

    if (!latestBooking) {
        return buildChatReply(
            "I could not find any booking saved for your current login. Book a ticket first, then I can help with booking-specific actions.",
            [{ label: "Go to Home", href: "index.html" }]
        );
    }

    const status = latestBooking.status || "Booked";
    return buildChatReply(
        `Your latest booking is ${latestBooking.from || "-"} to ${latestBooking.to || "-"} on ${latestBooking.busName || "-"}.
Booking ID: ${latestBooking.bookingId || "-"}
Seats: ${latestBooking.seats || "-"}
Status: ${status}`,
        [
            { label: "Open My Bookings", href: "profile.html" },
            { label: "Track This Bus", href: getTrackHrefFromBooking(latestBooking) }
        ]
    );
}

function getBusesForRoute(route) {
    if (typeof window.getCatalogBusesByRoute === "function") {
        return window.getCatalogBusesByRoute(route.from, route.to);
    }

    return [];
}

function resetBookingChatState() {
    bookingChatState.awaitingDate = false;
    bookingChatState.route = null;
}

function getBookingSupportReply(text) {
    const preparedText = prepareSupportText(text);
    const route = extractRouteFromText(preparedText);
    const dateValue = parseJourneyDate(preparedText);
    const isBookingIntent = hasIntent(preparedText, "bookRoute");

    if (route && isBookingIntent) {
        bookingChatState.route = route;

        if (!dateValue) {
            bookingChatState.awaitingDate = true;
            return buildDatePromptReply(
                route,
                `I found the route ${route.from} to ${route.to}. Select your journey date below.`
            );
        }

        if (isPastDate(dateValue)) {
            bookingChatState.awaitingDate = true;
            return "Please send today or a future date for this booking request.";
        }

        const buses = getBusesForRoute(route);
        resetBookingChatState();

        if (!buses.length) {
            return `I could not find buses for ${route.from} to ${route.to} on the current route list. Try another route or search from the homepage.`;
        }

        return buildBusReply(route, dateValue, buses);
    }

    if (bookingChatState.awaitingDate && bookingChatState.route) {
        if (!dateValue) {
            return buildDatePromptReply(
                bookingChatState.route,
                `Select the journey date for ${bookingChatState.route.from} to ${bookingChatState.route.to}.`
            );
        }

        if (isPastDate(dateValue)) {
            return "Please send today or a future date for this booking request.";
        }

        const buses = getBusesForRoute(bookingChatState.route);
        const routeDetails = bookingChatState.route;
        resetBookingChatState();

        if (!buses.length) {
            return `I could not find buses for ${routeDetails.from} to ${routeDetails.to} on the current route list. Try another route or search from the homepage.`;
        }

        return buildBusReply(routeDetails, dateValue, buses);
    }

    if (hasIntent(preparedText, "bookRoute")) {
        return "Tell me the route like `book a ticket from Hyderabad to Delhi`, and I will ask for the date and show the available buses.";
    }

    return "";
}

function addMessage(role, content, extraClass = "") {
    const row = document.createElement("div");
    row.className = `message ${role}`;

    const bubble = document.createElement("div");
    bubble.className = `message-bubble ${extraClass}`.trim();
    const payload = typeof content === "string" ? { text: content, actions: [] } : (content || { text: "", actions: [] });
    bubble.textContent = payload.text || "";

    row.appendChild(bubble);

    if (Array.isArray(payload.actions) && payload.actions.length > 0) {
        const actionsRow = document.createElement("div");
        actionsRow.className = "message-actions";

        payload.actions.forEach((action) => {
            if (action.type === "date-picker") {
                const pickerRow = document.createElement("div");
                pickerRow.className = "message-date-picker";

                const dateInput = document.createElement("input");
                dateInput.className = "message-date-input";
                dateInput.type = "date";
                dateInput.min = action.min || getTodayDateString();
                dateInput.value = action.min || getTodayDateString();

                const submitButton = document.createElement("button");
                submitButton.type = "button";
                submitButton.className = "message-date-submit";
                submitButton.textContent = action.label || "Submit Date";
                submitButton.addEventListener("click", () => {
                    if (!dateInput.value) {
                        dateInput.focus();
                        return;
                    }

                    handleQuery(dateInput.value);
                });

                pickerRow.appendChild(dateInput);
                pickerRow.appendChild(submitButton);
                row.appendChild(pickerRow);
                return;
            }

            const actionLink = document.createElement("a");
            actionLink.className = "message-action";
            actionLink.href = action.href || "#";
            actionLink.textContent = action.label || "Open";
            actionsRow.appendChild(actionLink);
        });

        if (actionsRow.children.length > 0) {
            row.appendChild(actionsRow);
        }
    }

    chatMessages.appendChild(row);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function getCurrentUserContext() {
    const isAdmin = localStorage.getItem("adminLoggedIn") === "true";
    const email = normalizeText(localStorage.getItem("userEmail") || localStorage.getItem("userIdentity"));
    const name = (localStorage.getItem("userName") || "").trim();
    const mobile = (localStorage.getItem("userMobile") || localStorage.getItem("mobile") || "").replace(/\D/g, "").slice(-10);
    const bookings = JSON.parse(localStorage.getItem("bookingHistory") || "[]");

    if (isAdmin) {
        return { isAdmin: true, email: "", name: "Admin", mobile: "", bookings };
    }

    const userBookings = bookings.filter((booking) => {
        const ownerEmail = normalizeText(booking?.ownerEmail);
        const ownerMobile = (booking?.ownerMobile || "").replace(/\D/g, "").slice(-10);

        if (email && ownerEmail) {
            return ownerEmail === email;
        }

        if (!email && mobile && ownerMobile) {
            return ownerMobile === mobile;
        }

        return false;
    });

    return {
        isAdmin: false,
        email,
        name,
        mobile,
        bookings: userBookings
    };
}

function getLatestBookingText(bookings) {
    if (!bookings.length) {
        return "I could not find any booking saved for your current login. Book a ticket first, then I can help with booking-specific actions.";
    }

    const latestBooking = bookings
        .slice()
        .sort((a, b) => new Date(b.bookedAt || 0) - new Date(a.bookedAt || 0))[0];

    const status = latestBooking.status || "Booked";
    return `Your latest booking is ${latestBooking.from || "-"} to ${latestBooking.to || "-"} on ${latestBooking.busName || "-"}.
Booking ID: ${latestBooking.bookingId || "-"}
Seats: ${latestBooking.seats || "-"}
Status: ${status}`;
}

function getSupportReply(query) {
    const text = normalizeText(query);
    const preparedText = prepareSupportText(query);
    const context = getCurrentUserContext();

    if (!text) {
        return "Please type your question so I can help with booking, payment, profile, or tracking.";
    }

    if (bookingChatState.awaitingDate) {
        const bookingReply = getBookingSupportReply(preparedText);
        if (bookingReply) {
            return bookingReply;
        }
    }

    if (hasIntent(preparedText, "latestBooking")) {
        return getLatestBookingReply(context.bookings);
    }

    if (hasIntent(preparedText, "cancelTicket")) {
        return buildChatReply(
            "Open your profile page, find the booking under `My Booking Details`, and click `Cancel Ticket`. After cancellation, you can use `Remove` to hide it from the user booking list.",
            [{ label: "Open My Bookings", href: "profile.html" }]
        );
    }

    if (hasIntent(preparedText, "removeTicket")) {
        return buildChatReply(
            "The `Remove` button becomes available after the ticket is cancelled. Once cancelled, click `Remove` in the user profile booking card and it will no longer show there.",
            [{ label: "Open My Bookings", href: "profile.html" }]
        );
    }

    if (hasIntent(preparedText, "payment")) {
        return buildChatReply(
            "For payment issues, confirm that the transaction ID was entered correctly on the payment page. If payment succeeded but the ticket is missing, refresh your profile booking list. If it failed, try again after checking the backend connection.",
            [
                { label: "Open My Bookings", href: "profile.html" },
                { label: "Go to Home", href: "index.html" }
            ]
        );
    }

    if (hasIntent(preparedText, "tracking")) {
        return buildChatReply(
            "Use the live tracking page to check the current bus status from your saved booking details.",
            [{ label: "Open Tracking", href: getTrackHrefFromBooking(getLatestBookingRecord(context.bookings)) }]
        );
    }

    if (hasIntent(preparedText, "profile")) {
        return buildChatReply(
            "Open the profile page and use `Edit Details`. That flow updates the profile in both the frontend state and the Java backend profile API.",
            [{ label: "Go to Profile", href: "profile.html" }]
        );
    }

    if (hasIntent(preparedText, "offers")) {
        return buildChatReply(
            "Check the `Bus Booking Discount Offers` section on the homepage for current promotions. Valid coupon codes are applied on the payment page when available.",
            [{ label: "View Offers", href: "index.html#offers" }]
        );
    }

    if (hasIntent(preparedText, "login")) {
        return buildChatReply(
            "Use the login page for user sign-in, sign-up, and OTP verification. If OTP or profile save fails, confirm the Java backend is running on `http://localhost:8000`.",
            [{ label: "Go to Login", href: "login.html" }]
        );
    }

    if (hasIntent(preparedText, "routeSearch")) {
        return buildChatReply(
            "You can search from the homepage using `Leaving From`, `Going To`, and `Departure`, open a route from `Popular Bus Routes`, or type here `book a ticket from Hyderabad to Delhi` and I will ask the date and show available buses.",
            [{ label: "Open Home Search", href: "index.html" }]
        );
    }

    if (hasIntent(preparedText, "refund")) {
        return buildChatReply(
            "Refund handling is not fully automated on this page yet. Cancel the ticket first from profile, then verify the cancellation status. Full refund processing would need additional backend support.",
            [{ label: "Open My Bookings", href: "profile.html" }]
        );
    }

    if (hasIntent(preparedText, "help")) {
        return buildChatReply(
            "I can help with booking lookup, cancellation, remove flow, payment troubleshooting, route search, profile updates, and tracking instructions. Ask a direct question like `show my latest booking`.",
            [
                { label: "Open My Bookings", href: "profile.html" },
                { label: "Open Tracking", href: getTrackHrefFromBooking(getLatestBookingRecord(context.bookings)) },
                { label: "Go to Home", href: "index.html" }
            ]
        );
    }

    const bookingReply = getBookingSupportReply(preparedText);
    if (bookingReply) {
        return bookingReply;
    }

    return "I can help with booking details, cancellation, remove flow, payment issues, profile update, offers, tracking, and route search. Try asking `show my latest booking` or `payment failed during booking`.";
}

function clearFeedbackSelection() {
    feedbackButtons.forEach((button) => button.classList.remove("active"));
    feedbackNote.textContent = "Your feedback helps improve YUbus support.";
}

function storeFeedback(type) {
    const stored = JSON.parse(localStorage.getItem(FEEDBACK_STORAGE_KEY) || "[]");
    stored.unshift({
        type,
        reply: lastBotReply,
        createdAt: new Date().toISOString()
    });
    localStorage.setItem(FEEDBACK_STORAGE_KEY, JSON.stringify(stored.slice(0, 30)));
}

function sendBotReply(query) {
    const typingRow = document.createElement("div");
    typingRow.className = "message bot";
    typingRow.innerHTML = '<div class="message-bubble typing">YUbus assistant is typing...</div>';
    chatMessages.appendChild(typingRow);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    window.setTimeout(() => {
        typingRow.remove();
        const reply = getSupportReply(query);
        lastBotReply = typeof reply === "string" ? reply : (reply?.text || "");
        clearFeedbackSelection();
        addMessage("bot", reply);
    }, 450);
}

function handleQuery(query) {
    if (!isSupportAssistantActive()) {
        ensureSupportPausedMessage();
        return;
    }

    const cleanedQuery = (query || "").trim();
    if (!cleanedQuery) {
        return;
    }

    addMessage("user", cleanedQuery);
    sendBotReply(cleanedQuery);
}

chatForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!isSupportAssistantActive()) {
        ensureSupportPausedMessage();
        return;
    }

    const query = chatInput.value.trim();
    if (!query) {
        return;
    }

    handleQuery(query);
    chatInput.value = "";
    chatInput.focus();
});

quickHelp.addEventListener("click", (event) => {
    if (!isSupportAssistantActive()) {
        ensureSupportPausedMessage();
        return;
    }

    const chip = event.target.closest("[data-query]");
    if (!chip) {
        return;
    }

    handleQuery(chip.dataset.query || "");
});

if (routeQuickSelect) {
    routeQuickSelect.addEventListener("change", () => {
        if (!isSupportAssistantActive()) {
            ensureSupportPausedMessage();
            routeQuickSelect.value = "";
            return;
        }

        const selectedRoute = routeQuickSelect.value;
        if (!selectedRoute) {
            return;
        }

        const [from, to] = selectedRoute.split("|||");
        if (!from || !to) {
            return;
        }

        handleQuery(`book a ticket from ${from} to ${to}`);
        routeQuickSelect.value = "";
    });
}

feedbackPanel.addEventListener("click", (event) => {
    const feedbackButton = event.target.closest("[data-feedback]");
    if (!feedbackButton || !lastBotReply) {
        return;
    }

    const feedbackType = feedbackButton.dataset.feedback || "";
    feedbackButtons.forEach((button) => button.classList.toggle("active", button === feedbackButton));
    storeFeedback(feedbackType);
    feedbackNote.textContent = feedbackType === "helpful"
        ? "Thanks. Your helpful feedback was saved."
        : "Thanks. We saved your feedback and can improve this reply.";
});

window.addEventListener("DOMContentLoaded", () => {
    const context = getCurrentUserContext();
    const userName = context.name || "traveler";
    initSpeechRecognition();
    applySupportAssistantState();

    if (routeQuickSelect) {
        getAllAvailableRoutes().forEach((route) => {
            const option = document.createElement("option");
            option.value = `${route.from}|||${route.to}`;
            option.textContent = `${route.from} to ${route.to}`;
            routeQuickSelect.appendChild(option);
        });
    }

    if (isSupportAssistantActive()) {
        addMessage(
            "bot",
            `Hello ${userName}. I can help with booking status, ticket cancellation, payment issues, profile updates, route search, and tracking.
Ask a question or tap one of the quick help options above.
You can also type something like: book a ticket from Hyderabad to Delhi.`
        );
        return;
    }

    ensureSupportPausedMessage();
});

window.addEventListener("focus", applySupportAssistantState);
window.addEventListener("storage", (event) => {
    if (!event.key || event.key === ADMIN_FEATURES_KEY) {
        applySupportAssistantState();
    }
});
