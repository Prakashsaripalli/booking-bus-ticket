(function () {
    const routeImages = {
        "Hyderabad-Vijayawada": "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944",
        "Hyderabad-Visakhapatnam": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e",
        "Hyderabad-Tirupati": "https://images.unsplash.com/photo-1524492412937-b28074a5d7da",
        "Hyderabad-Bengaluru": "https://images.unsplash.com/photo-1596176530529-78163a4f7af2",
        "Hyderabad-Chennai": "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df",
        "Warangal-Vijayawada": "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944",
        "Vijayawada-Visakhapatnam": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e",
        "Vijayawada-Guntur": "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944",
        "Guntur-Tirupati": "https://images.unsplash.com/photo-1524492412937-b28074a5d7da",
        "Nellore-Chennai": "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df",
        "Kurnool-Bengaluru": "https://images.unsplash.com/photo-1548013146-72479768bada",
        "Bengaluru-Chennai": "Assets/bus-banner1.jpg",
        "Chennai-Bengaluru": "Assets/bus-banner1.jpg",
        "Bengaluru-Mysuru": "https://images.unsplash.com/photo-1599661046289-e31897846e41",
        "Bengaluru-Mangaluru": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e",
        "Bengaluru-Kochi": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e",
        "Chennai-Madurai": "https://images.unsplash.com/photo-1566552881560-0be862a7c445",
        "Chennai-Coimbatore": "https://images.unsplash.com/photo-1521295121783-8a321d551ad2",
        "Chennai-Tiruchirappalli": "https://images.unsplash.com/photo-1566552881560-0be862a7c445",
        "Chennai-Salem": "https://images.unsplash.com/photo-1521295121783-8a321d551ad2",
        "Chennai-Kochi": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e",
        "Coimbatore-Madurai": "https://images.unsplash.com/photo-1566552881560-0be862a7c445",
        "Madurai-Kochi": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e",
        "Bhubaneswar-Visakhapatnam": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e",
        "Bhubaneswar-Brahmapur": "https://images.unsplash.com/photo-1519046904884-53103b34b206",
        "Visakhapatnam-Brahmapur": "https://images.unsplash.com/photo-1519046904884-53103b34b206"
    };

    const cityAliases = {
        Bangalore: "Bengaluru",
        Bengaluru: "Bengaluru",
        Mysore: "Mysuru",
        Mysuru: "Mysuru",
        Mangalore: "Mangaluru",
        Mangaluru: "Mangaluru",
        Hubli: "Hubballi",
        Hubballi: "Hubballi",
        Belgaum: "Belagavi",
        Belagavi: "Belagavi",
        Berhampur: "Brahmapur",
        Brahmapur: "Brahmapur",
        Vizag: "Visakhapatnam",
        Visakhapatnam: "Visakhapatnam"
    };

    function normalizeRouteCity(city) {
        const value = String(city || "").trim();
        return cityAliases[value] || value;
    }

    function getRouteImageFallback(from, to) {
        const joined = `${from} ${to}`.toLowerCase();

        if (joined.includes("tirupati") || joined.includes("madurai")) {
            return "https://images.unsplash.com/photo-1524492412937-b28074a5d7da";
        }

        if (joined.includes("visakhapatnam") || joined.includes("kochi") || joined.includes("brahmapur") || joined.includes("bhubaneswar")) {
            return "https://images.unsplash.com/photo-1507525428034-b723cf961d3e";
        }

        if (joined.includes("bengaluru") || joined.includes("chennai") || joined.includes("hyderabad")) {
            return "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df";
        }

        return "https://images.unsplash.com/photo-1597047084897-51e81819a499";
    }

    const apCities = [
        "Visakhapatnam",
        "Anakapalle",
        "Bheemunipatnam",
        "Narsipatnam",
        "Vizianagaram",
        "Bobbili",
        "Salur",
        "Srikakulam",
        "Palasa",
        "Amadalavalasa",
        "Rajahmundry",
        "Kakinada",
        "Amalapuram",
        "Jaggampeta",
        "Peddapuram",
        "Samalkot",
        "Mandapeta",
        "Ramachandrapuram",
        "Tuni",
        "Eluru",
        "Bhimavaram",
        "Tadepalligudem",
        "Tanuku",
        "Narasapuram",
        "Vijayawada",
        "Machilipatnam",
        "Gudivada",
        "Nuzvid",
        "Avanigadda",
        "Guntur",
        "Tenali",
        "Mangalagiri",
        "Narasaraopet",
        "Sattenapalli",
        "Ongole",
        "Chirala",
        "Markapur",
        "Nellore",
        "Kavali",
        "Gudur",
        "Naidupeta",
        "Tirupati",
        "Chittoor",
        "Madanapalle",
        "Puttur",
        "Kadapa",
        "Proddatur",
        "Pulivendula",
        "Rayachoti",
        "Anantapur",
        "Dharmavaram",
        "Hindupur",
        "Kadiri",
        "Kurnool",
        "Nandyal",
        "Adoni",
        "Yemmiganur"
    ];

    const telanganaCities = [
        "Hyderabad",
        "Warangal",
        "Hanamkonda",
        "Karimnagar",
        "Nizamabad",
        "Khammam",
        "Ramagundam",
        "Mahabubnagar",
        "Nalgonda",
        "Adilabad",
        "Siddipet",
        "Mancherial",
        "Jagtial",
        "Miryalaguda",
        "Suryapet",
        "Kamareddy",
        "Bodhan",
        "Armoor",
        "Bellampalli",
        "Bhainsa",
        "Vikarabad",
        "Wanaparthy",
        "Gadwal",
        "Medak",
        "Sangareddy",
        "Zaheerabad",
        "Shadnagar",
        "Kodad"
    ];

    const tamilNaduCities = [
        "Chennai",
        "Coimbatore",
        "Madurai",
        "Tiruchirappalli",
        "Salem",
        "Tirunelveli",
        "Tiruppur",
        "Vellore",
        "Erode",
        "Thoothukudi",
        "Dindigul",
        "Thanjavur",
        "Karur",
        "Nagercoil",
        "Hosur",
        "Kanchipuram",
        "Kumbakonam",
        "Cuddalore",
        "Nagapattinam",
        "Tiruvannamalai",
        "Pollachi",
        "Sivakasi",
        "Virudhunagar",
        "Namakkal",
        "Dharmapuri",
        "Krishnagiri",
        "Ranipet",
        "Arakkonam",
        "Pudukkottai",
        "Mayiladuthurai",
        "Villupuram",
        "Tenkasi"
    ];

    const keralaCities = [
        "Thiruvananthapuram",
        "Kochi",
        "Kozhikode",
        "Thrissur",
        "Kollam",
        "Kannur",
        "Alappuzha",
        "Kottayam",
        "Palakkad",
        "Malappuram",
        "Kasaragod",
        "Pathanamthitta",
        "Idukki",
        "Perinthalmanna",
        "Ponnani",
        "Taliparamba",
        "Payyannur",
        "Kanhangad",
        "Chalakudy",
        "Kodungallur",
        "Guruvayur",
        "Paravur",
        "Aluva",
        "Angamaly"
    ];

    const karnatakaCities = [
        "Bengaluru",
        "Mysuru",
        "Mangaluru",
        "Hubballi",
        "Dharwad",
        "Belagavi",
        "Ballari",
        "Davanagere",
        "Shivamogga",
        "Tumakuru",
        "Udupi",
        "Bidar",
        "Hassan",
        "Kalaburagi",
        "Raichur",
        "Koppal",
        "Gadag",
        "Bagalkot",
        "Chitradurga",
        "Chikkamagaluru",
        "Mandya",
        "Ramanagara",
        "Karwar",
        "Sirsi",
        "Hospet",
        "Yadgir"
    ];

    const odishaCities = [
        "Bhubaneswar",
        "Cuttack",
        "Rourkela",
        "Brahmapur",
        "Sambalpur",
        "Puri",
        "Balasore",
        "Bhadrak",
        "Baripada",
        "Jharsuguda",
        "Jeypore",
        "Angul",
        "Dhenkanal",
        "Rayagada",
        "Kendrapara",
        "Jagatsinghpur",
        "Bargarh",
        "Paradeep",
        "Talcher",
        "Koraput",
        "Malkangiri",
        "Phulbani",
        "Nabarangpur",
        "Sonepur"
    ];

    const cityCatalog = {
        Telangana: telanganaCities,
        "Andhra Pradesh": apCities,
        "Tamil Nadu": tamilNaduCities,
        Kerala: keralaCities,
        Karnataka: karnatakaCities,
        Odisha: odishaCities
    };

    const baseRoutes = [];
    const routeKeySet = new Set();

    function addRoute(from, to, distanceKm) {
        const key = `${from}|${to}`.toLowerCase();
        if (routeKeySet.has(key)) {
            return;
        }
        routeKeySet.add(key);
        baseRoutes.push({ from, to, distanceKm });
    }

    function addRoutePair(from, to, distanceKm) {
        addRoute(from, to, distanceKm);
        addRoute(to, from, distanceKm);
    }

    addRoutePair("Hyderabad", "Vijayawada", 275);
    addRoutePair("Hyderabad", "Visakhapatnam", 620);
    addRoutePair("Hyderabad", "Tirupati", 560);
    addRoutePair("Hyderabad", "Kurnool", 210);
    addRoutePair("Hyderabad", "Warangal", 150);
    addRoutePair("Hyderabad", "Khammam", 200);
    addRoutePair("Hyderabad", "Karimnagar", 160);
    addRoutePair("Hyderabad", "Nizamabad", 175);
    addRoutePair("Vijayawada", "Visakhapatnam", 350);
    addRoutePair("Vijayawada", "Guntur", 40);
    addRoutePair("Visakhapatnam", "Rajahmundry", 200);
    addRoutePair("Tirupati", "Nellore", 140);
    addRoutePair("Warangal", "Vijayawada", 250);
    addRoutePair("Guntur", "Tirupati", 380);
    addRoutePair("Kurnool", "Bengaluru", 360);
    addRoutePair("Nellore", "Chennai", 175);
    addRoutePair("Bengaluru", "Mysuru", 150);
    addRoutePair("Bengaluru", "Mangaluru", 350);
    addRoutePair("Bengaluru", "Hubballi", 410);
    addRoutePair("Bengaluru", "Belagavi", 510);
    addRoutePair("Chennai", "Madurai", 460);
    addRoutePair("Chennai", "Coimbatore", 510);
    addRoutePair("Chennai", "Tiruchirappalli", 330);
    addRoutePair("Chennai", "Salem", 345);
    addRoutePair("Coimbatore", "Madurai", 215);
    addRoutePair("Kochi", "Thiruvananthapuram", 210);
    addRoutePair("Kochi", "Kozhikode", 180);
    addRoutePair("Kochi", "Thrissur", 85);
    addRoutePair("Kochi", "Kannur", 275);
    addRoutePair("Bengaluru", "Chennai", 350);
    addRoutePair("Bengaluru", "Hyderabad", 570);
    addRoutePair("Bengaluru", "Kochi", 550);
    addRoutePair("Chennai", "Kochi", 690);
    addRoutePair("Hyderabad", "Chennai", 625);
    addRoutePair("Chennai", "Bhubaneswar", 1240);
    addRoutePair("Hyderabad", "Bhubaneswar", 1040);
    addRoutePair("Visakhapatnam", "Bhubaneswar", 440);
    addRoutePair("Bhubaneswar", "Brahmapur", 170);
    addRoutePair("Bhubaneswar", "Rourkela", 340);
    addRoutePair("Bhubaneswar", "Sambalpur", 320);
    addRoutePair("Bhubaneswar", "Cuttack", 30);
    addRoutePair("Bhubaneswar", "Puri", 60);
    addRoutePair("Visakhapatnam", "Brahmapur", 280);
    addRoutePair("Madurai", "Kochi", 270);
    addRoutePair("Coimbatore", "Kochi", 200);
    addRoutePair("Mangaluru", "Kochi", 450);
    addRoutePair("Mysuru", "Coimbatore", 200);

    const apRegions = {
        northCoastal: [
            "Visakhapatnam",
            "Anakapalle",
            "Bheemunipatnam",
            "Narsipatnam",
            "Vizianagaram",
            "Bobbili",
            "Salur",
            "Srikakulam",
            "Palasa",
            "Amadalavalasa"
        ],
        eastCoastal: [
            "Rajahmundry",
            "Kakinada",
            "Amalapuram",
            "Jaggampeta",
            "Peddapuram",
            "Samalkot",
            "Mandapeta",
            "Ramachandrapuram",
            "Tuni"
        ],
        westCoastal: [
            "Eluru",
            "Bhimavaram",
            "Tadepalligudem",
            "Tanuku",
            "Narasapuram",
            "Machilipatnam",
            "Gudivada",
            "Nuzvid",
            "Avanigadda"
        ],
        central: [
            "Vijayawada",
            "Guntur",
            "Tenali",
            "Mangalagiri",
            "Narasaraopet",
            "Sattenapalli",
            "Ongole",
            "Chirala",
            "Markapur"
        ],
        southCoastal: [
            "Nellore",
            "Kavali",
            "Gudur",
            "Naidupeta",
            "Tirupati",
            "Puttur",
            "Chittoor",
            "Madanapalle"
        ],
        rayalaseema: [
            "Kadapa",
            "Proddatur",
            "Pulivendula",
            "Rayachoti",
            "Anantapur",
            "Dharmavaram",
            "Hindupur",
            "Kadiri",
            "Kurnool",
            "Nandyal",
            "Adoni",
            "Yemmiganur"
        ]
    };

    const apRegionLookup = Object.entries(apRegions).reduce((acc, [region, cities]) => {
        cities.forEach((city) => {
            acc[city] = region;
        });
        return acc;
    }, {});

    const apRegionAdjacency = {
        northCoastal: ["eastCoastal"],
        eastCoastal: ["northCoastal", "westCoastal"],
        westCoastal: ["eastCoastal", "central"],
        central: ["westCoastal", "southCoastal", "rayalaseema"],
        southCoastal: ["central", "rayalaseema"],
        rayalaseema: ["southCoastal", "central"]
    };

    function estimateApDistanceKm(from, to) {
        const regionFrom = apRegionLookup[from];
        const regionTo = apRegionLookup[to];
        let min = 120;
        let max = 620;

        if (regionFrom && regionTo) {
            if (regionFrom === regionTo) {
                min = 60;
                max = 220;
            } else if ((apRegionAdjacency[regionFrom] || []).includes(regionTo)) {
                min = 160;
                max = 380;
            } else {
                min = 320;
                max = 640;
            }
        }

        const range = Math.max(1, max - min);
        const seed = createStableHash(`${from}|${to}|ap`);
        return min + (seed % range);
    }

    for (let i = 0; i < apCities.length; i += 1) {
        for (let j = i + 1; j < apCities.length; j += 1) {
            const fromCity = apCities[i];
            const toCity = apCities[j];
            addRoutePair(fromCity, toCity, estimateApDistanceKm(fromCity, toCity));
        }
    }

    function estimateDistanceRange(from, to, min, max, tag) {
        const range = Math.max(1, max - min);
        const seed = createStableHash(`${from}|${to}|${tag}`);
        return min + (seed % range);
    }

    function addIntraStateRoutes(cities, min, max, tag) {
        for (let i = 0; i < cities.length; i += 1) {
            for (let j = i + 1; j < cities.length; j += 1) {
                const fromCity = cities[i];
                const toCity = cities[j];
                addRoutePair(fromCity, toCity, estimateDistanceRange(fromCity, toCity, min, max, tag));
            }
        }
    }

    addIntraStateRoutes(telanganaCities, 80, 420, "ts");
    addIntraStateRoutes(tamilNaduCities, 120, 680, "tn");
    addIntraStateRoutes(keralaCities, 60, 320, "kl");
    addIntraStateRoutes(karnatakaCities, 120, 620, "ka");
    addIntraStateRoutes(odishaCities, 120, 620, "od");

    function normalize(text) {
        return (text || "").trim().toLowerCase();
    }

    function getRouteKey(from, to) {
        return `${normalize(from)}-${normalize(to)}`;
    }

    const shortRouteKeys = new Set(
        baseRoutes
            .filter((route) => route.distanceKm <= 300)
            .map((route) => getRouteKey(route.from, route.to))
    );

    function createStableHash(value) {
        const source = String(value || "");
        let hash = 0;

        for (let index = 0; index < source.length; index += 1) {
            hash = ((hash << 5) - hash) + source.charCodeAt(index);
            hash |= 0;
        }

        return Math.abs(hash);
    }

    function shouldKeepStandard(bus) {
        const marker = [
            bus?.id || "",
            bus?.name || "",
            bus?.fromCity || "",
            bus?.toCity || "",
            bus?.departureTime || ""
        ].join("|");

        return createStableHash(marker) % 5 === 0;
    }

    function getSuggestedCoachType(bus) {
        return shortRouteKeys.has(getRouteKey(bus?.fromCity, bus?.toCity))
            ? "AC Seater"
            : "AC Sleeper";
    }

    function resolveBusCoachType(bus) {
        const explicitType = String(bus?.busType || "").trim();

        if (explicitType && normalize(explicitType) !== "standard") {
            return explicitType;
        }

        if (shouldKeepStandard(bus)) {
            return "Standard";
        }

        return getSuggestedCoachType(bus);
    }

    function normalizeBusRecord(bus) {
        if (!bus || typeof bus !== "object") {
            return bus;
        }

        return {
            ...bus,
            busType: resolveBusCoachType(bus)
        };
    }

    const ADMIN_BUSES_KEY = "adminManagedBuses";

    function readManagedAdminBuses() {
        try {
            const parsed = JSON.parse(localStorage.getItem(ADMIN_BUSES_KEY) || "[]");
            if (!Array.isArray(parsed)) {
                return [];
            }

            return parsed
                .filter((bus) => bus && typeof bus === "object")
                .map((bus) => ({
                    id: Number(bus.id) || createStableHash([
                        bus.name,
                        bus.fromCity,
                        bus.toCity,
                        bus.departureTime,
                        bus.price
                    ].join("|")),
                    name: String(bus.name || "").trim(),
                    fromCity: normalizeRouteCity(bus.fromCity),
                    toCity: normalizeRouteCity(bus.toCity),
                    departureTime: String(bus.departureTime || "").trim() || "09:00 PM",
                    price: Math.max(100, Number(bus.price || 0)),
                    busType: String(bus.busType || "").trim() || "AC Sleeper",
                    managedByAdmin: true,
                    createdAt: String(bus.createdAt || "")
                }))
                .filter((bus) => bus.name && bus.fromCity && bus.toCity);
        } catch (error) {
            return [];
        }
    }

    function writeManagedAdminBuses(buses) {
        const normalizedList = Array.isArray(buses)
            ? buses.map((bus) => ({
                id: Number(bus.id) || createStableHash([
                    bus.name,
                    bus.fromCity,
                    bus.toCity,
                    bus.departureTime,
                    bus.price
                ].join("|")),
                name: String(bus.name || "").trim(),
                fromCity: normalizeRouteCity(bus.fromCity),
                toCity: normalizeRouteCity(bus.toCity),
                departureTime: String(bus.departureTime || "").trim() || "09:00 PM",
                price: Math.max(100, Number(bus.price || 0)),
                busType: String(bus.busType || "").trim() || "AC Sleeper",
                managedByAdmin: true,
                createdAt: String(bus.createdAt || new Date().toISOString())
            })).filter((bus) => bus.name && bus.fromCity && bus.toCity)
            : [];

        localStorage.setItem(ADMIN_BUSES_KEY, JSON.stringify(normalizedList));
        refreshGlobalCatalog();
        return normalizedList;
    }

    const busNameSeeds = [
        "Express",
        "Swift",
        "Prime",
        "Connect",
        "Star",
        "Royal",
        "Metro",
        "Turbo",
        "Voyager",
        "Pulse"
    ];
    const departureSlots = ["06:00 AM", "09:30 AM", "01:00 PM", "06:00 PM", "10:00 PM"];
    const typeRates = {
        Standard: 1.0,
        "Non-AC Seater": 1.1,
        "AC Seater": 1.3,
        Sleeper: 1.6,
        "AC Sleeper": 1.8,
        "AC Volvo": 2.0
    };

    function pickType(distanceKm, index) {
        if (distanceKm <= 250) {
            const types = ["Non-AC Seater", "AC Seater", "AC Seater", "Standard", "Sleeper"];
            return types[index % types.length];
        }
        if (distanceKm <= 500) {
            const types = ["AC Seater", "Sleeper", "AC Sleeper", "Non-AC Seater", "Sleeper"];
            return types[index % types.length];
        }
        const types = ["Sleeper", "AC Sleeper", "AC Volvo", "Sleeper", "AC Volvo"];
        return types[index % types.length];
    }

    function calcPrice(distanceKm, type, index) {
        const rate = typeRates[type] || 1.25;
        let price = Math.round((distanceKm * rate) / 10) * 10;
        price += index * 40;
        return Math.max(299, price);
    }

    function toMinutes(timeStr) {
        const [time, period] = timeStr.split(" ");
        let [hours, minutes] = time.split(":").map(Number);
        if (period === "PM" && hours !== 12) {
            hours += 12;
        }
        if (period === "AM" && hours === 12) {
            hours = 0;
        }
        return (hours * 60) + minutes;
    }

    function fromMinutes(totalMinutes) {
        let minutes = totalMinutes % 1440;
        if (minutes < 0) {
            minutes += 1440;
        }
        let hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        const period = hours >= 12 ? "PM" : "AM";
        hours = hours % 12;
        if (hours === 0) {
            hours = 12;
        }
        const paddedHours = String(hours).padStart(2, "0");
        const paddedMinutes = String(mins).padStart(2, "0");
        return `${paddedHours}:${paddedMinutes} ${period}`;
    }

    function shiftTime(slot, offsetMinutes) {
        return fromMinutes(toMinutes(slot) + offsetMinutes);
    }

    let nextBusId = 1000;
    const buses = [];

    baseRoutes.forEach((route, routeIndex) => {
        for (let index = 0; index < 5; index += 1) {
            const type = pickType(route.distanceKm, index);
            const price = calcPrice(route.distanceKm, type, index);
            const timeOffset = (routeIndex * 7 + index * 3) % 40;
            const departureTime = shiftTime(departureSlots[index % departureSlots.length], timeOffset);

            buses.push({
                id: nextBusId += 1,
                name: `Yubus ${busNameSeeds[(routeIndex + index) % busNameSeeds.length]}`,
                fromCity: route.from,
                toCity: route.to,
                departureTime,
                price,
                busType: type
            });
        }
    });

    const catalogBuses = buses.map(normalizeBusRecord);

    function getMergedCatalogBuses() {
        return [
            ...catalogBuses,
            ...readManagedAdminBuses().map(normalizeBusRecord)
        ];
    }

    function refreshGlobalCatalog() {
        window.BUS_CATALOG = getMergedCatalogBuses();
    }

    function getRouteImage(from, to) {
        const normalizedFrom = normalizeRouteCity(from);
        const normalizedTo = normalizeRouteCity(to);
        const directKey = `${normalizedFrom}-${normalizedTo}`;
        const reverseKey = `${normalizedTo}-${normalizedFrom}`;

        return routeImages[directKey]
            || routeImages[reverseKey]
            || getRouteImageFallback(normalizedFrom, normalizedTo);
    }

    function getBusesByRoute(from, to) {
        return getMergedCatalogBuses().filter((bus) =>
            normalize(bus.fromCity) === normalize(from) &&
            normalize(bus.toCity) === normalize(to)
        );
    }

    function getRouteDistanceKm(from, to) {
        const matchedRoute = baseRoutes.find((route) =>
            getRouteKey(route.from, route.to) === getRouteKey(normalizeRouteCity(from), normalizeRouteCity(to))
        );

        if (matchedRoute?.distanceKm) {
            return matchedRoute.distanceKm;
        }

        const routeMarker = `${normalizeRouteCity(from)}-${normalizeRouteCity(to)}`;
        return 180 + (createStableHash(routeMarker) % 420);
    }

    function getPopularRoutes(limit) {
        const routeMap = new Map();

        getMergedCatalogBuses().forEach((bus) => {
            const key = `${bus.fromCity}-${bus.toCity}`;
            if (!routeMap.has(key)) {
                routeMap.set(key, {
                    from: bus.fromCity,
                    to: bus.toCity,
                    fromCity: bus.fromCity,
                    toCity: bus.toCity,
                    image: getRouteImage(bus.fromCity, bus.toCity),
                    busCount: 0
                });
            }

            routeMap.get(key).busCount += 1;
        });

        return Array.from(routeMap.values())
            .sort((a, b) => b.busCount - a.busCount || a.from.localeCompare(b.from) || a.to.localeCompare(b.to))
            .slice(0, limit || 24);
    }

    const cityPoints = {
        Hyderabad: ["Gachibowli", "Kukatpally", "Ameerpet", "LB Nagar", "MGBS"],
        Warangal: ["Hanamkonda", "Kazipet", "Warangal Bus Stand", "Narsampet", "Mulugu"],
        Karimnagar: ["Karimnagar Bus Stand", "Kothapalli", "Jagtial Road", "Karimnagar Bypass", "Manakondur"],
        Nizamabad: ["Nizamabad Bus Stand", "Bodhan Road", "Nizamabad Railway Station", "Armur", "Nizamsagar Road"],
        Khammam: ["Khammam Bus Stand", "Bypass Road", "Wyra Road", "Kothagudem", "Madhira"],
        Bhubaneswar: ["Baramunda", "Vani Vihar", "Master Canteen", "Patia", "Kharavel Nagar"],
        Cuttack: ["Badambadi", "Link Road", "College Square", "CDA", "Bypass"],
        Puri: ["Puri Bus Stand", "Grand Road", "Station Road", "Swargadwar", "Konark Road"],
        Rourkela: ["Rourkela Bus Stand", "Sector 2", "Panposh", "Chhend", "Bisra Road"],
        Sambalpur: ["Sambalpur Bus Stand", "Ainthapali", "Dhanupali", "Burla", "Hirakud"],
        Brahmapur: ["Brahmapur Bus Stand", "Gopalpur", "Ankuli", "Bada Bazar", "Lochapada"],
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
        Bengaluru: ["Majestic", "Silk Board", "Electronic City", "Hebbal", "KR Puram"],
        Mysuru: ["Mysuru Bus Stand", "Jayalakshmipuram", "Vijayanagar", "Hebbal", "Ramaswamy Circle"],
        Mangaluru: ["Hampankatta", "Lalbagh", "Kankanady", "Surathkal", "Kuloor"],
        Hubballi: ["Hubballi Bus Stand", "Gokul Road", "Keshwapur", "Unkal", "Bypass"],
        Belagavi: ["Belagavi Bus Stand", "Tilakwadi", "Udyambag", "Sambra", "Bypass"]
    };

    function addGenericPoints(city) {
        return [
            `${city} Bus Stand`,
            "Main Road",
            "Railway Station",
            "City Center",
            "Bypass"
        ];
    }

    Object.values(cityCatalog).flat().forEach((city) => {
        if (!cityPoints[city]) {
            cityPoints[city] = addGenericPoints(city);
        }
    });

    const stateOrder = [
        "Telangana",
        "Andhra Pradesh",
        "Tamil Nadu",
        "Kerala",
        "Karnataka",
        "Odisha"
    ];

    refreshGlobalCatalog();
    window.BUS_ROUTE_IMAGES = routeImages;
    window.CITY_CATALOG = cityCatalog;
    window.CITY_POINTS = cityPoints;
    window.CITY_STATE_ORDER = stateOrder;
    window.getCatalogRouteImage = getRouteImage;
    window.getCatalogBusesByRoute = getBusesByRoute;
    window.getCatalogRouteDistanceKm = getRouteDistanceKm;
    window.getCatalogPopularRoutes = getPopularRoutes;
    window.normalizeCatalogBus = normalizeBusRecord;
    window.resolveBusCoachType = resolveBusCoachType;
    window.getManagedAdminBuses = readManagedAdminBuses;
    window.saveManagedAdminBuses = writeManagedAdminBuses;
    window.refreshBusCatalog = refreshGlobalCatalog;
    window.CITY_CATALOG = cityCatalog;
})();
