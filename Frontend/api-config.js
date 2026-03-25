(function initializeYubusApiConfig() {
    function normalizeBase(base) {
        return String(base || "").trim().replace(/\/+$/, "");
    }

    function getSameOriginBase() {
        if (typeof window === "undefined" || !window.location) {
            return "";
        }

        if (window.location.protocol !== "http:" && window.location.protocol !== "https:") {
            return "";
        }

        return normalizeBase(window.location.origin);
    }

    function getLocalOverride() {
        try {
            return normalizeBase(window.localStorage.getItem("yubusApiBase"));
        } catch (error) {
            return "";
        }
    }

    const configuredBase = normalizeBase(window.YUBUS_API_BASE);
    const sameOriginBase = getSameOriginBase();
    const fallbackBases = [
        getLocalOverride(),
        configuredBase,
        sameOriginBase,
        "http://localhost:8001",
        "http://127.0.0.1:8001",
        "http://localhost:8000",
        "http://127.0.0.1:8000"
    ].filter(Boolean);

    const bases = [...new Set(fallbackBases)];

    window.YUBUS_API = {
        getBases() {
            return bases.slice();
        },
        buildUrl(path, base) {
            const resolvedBase = normalizeBase(base) || bases[0] || "";
            const resolvedPath = String(path || "");
            return `${resolvedBase}${resolvedPath}`;
        },
        describeTarget() {
            return bases[0] || "http://localhost:8000";
        }
    };
})();
