(function () {
    const routeImages = {
        "Bangalore-Hyderabad": "https://images.unsplash.com/photo-1593693397690-362cb9666fc2",
        "Bangalore-Chennai": "https://images.unsplash.com/photo-1589394815804-964ed0be2eb5",
        "Bangalore-Tirupati": "https://images.unsplash.com/photo-1589394815804-964ed0be2eb5",
        "Bangalore-Goa": "https://images.unsplash.com/photo-1516483638261-f4dbaf036963",
        "Bangalore-Mangalore": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e",
        "Hyderabad-Vijayawada": "https://images.unsplash.com/photo-1625225233840-695456021cde",
        "Hyderabad-Bangalore": "https://images.unsplash.com/photo-1593693397690-362cb9666fc2",
        "Hyderabad-Chennai": "https://images.unsplash.com/photo-1589394815804-964ed0be2eb5",
        "Hyderabad-Tirupati": "https://images.unsplash.com/photo-1593693397690-362cb9666fc2",
        "Hyderabad-Visakhapatnam": "https://images.unsplash.com/photo-1519046904884-53103b34b206",
        "Hyderabad-Nellore": "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee",
        "Hyderabad-Jaipur": "https://images.unsplash.com/photo-1477587458883-47145ed94245",
        "Hyderabad-Delhi": "https://images.unsplash.com/photo-1524492412937-b28074a5d7da",
        "Chennai-Hyderabad": "https://images.unsplash.com/photo-1593693397690-362cb9666fc2",
        "Chennai-Bangalore": "https://images.unsplash.com/photo-1589394815804-964ed0be2eb5",
        "Chennai-Madurai": "https://images.unsplash.com/photo-1524492412937-b28074a5d7da",
        "Chennai-Nellore": "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee",
        "Vijayawada-Hyderabad": "https://images.unsplash.com/photo-1625225233840-695456021cde",
        "Goa-Bangalore": "https://images.unsplash.com/photo-1516483638261-f4dbaf036963",
        "Nellore-Hyderabad": "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee",
        "Nellore-Chennai": "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee",
        "Jaipur-Hyderabad": "https://images.unsplash.com/photo-1477587458883-47145ed94245",
        "Delhi-Lucknow": "https://images.unsplash.com/photo-1524492412937-b28074a5d7da",
        "Delhi-Hyderabad": "https://images.unsplash.com/photo-1524492412937-b28074a5d7da",
        "Mangalore-Bangalore": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e"
    };

    const shortRouteKeys = new Set([
        "hyderabad-vijayawada",
        "vijayawada-hyderabad",
        "bangalore-chennai",
        "chennai-bangalore",
        "nellore-chennai",
        "chennai-nellore",
        "bangalore-mangalore",
        "mangalore-bangalore",
        "bangalore-tirupati",
        "tirupati-bangalore"
    ]);

    const buses = [
        { id: 101, name: "Yubus Express", fromCity: "Hyderabad", toCity: "Vijayawada", departureTime: "06:30 AM", price: 899, busType: "AC Sleeper" },
        { id: 102, name: "Yubus Deluxe", fromCity: "Hyderabad", toCity: "Vijayawada", departureTime: "10:00 PM", price: 699, busType: "Non-AC Seater" },
        { id: 103, name: "Yubus Sunrise", fromCity: "Hyderabad", toCity: "Vijayawada", departureTime: "11:30 PM", price: 849, busType: "AC Seater" },
        { id: 104, name: "Yubus Star", fromCity: "Vijayawada", toCity: "Hyderabad", departureTime: "07:00 AM", price: 799, busType: "AC Seater" },
        { id: 105, name: "Yubus Return", fromCity: "Vijayawada", toCity: "Hyderabad", departureTime: "03:45 PM", price: 949, busType: "Sleeper" },
        { id: 106, name: "Yubus Royal", fromCity: "Hyderabad", toCity: "Bangalore", departureTime: "05:30 PM", price: 1299, busType: "AC Sleeper" },
        { id: 107, name: "Yubus Luxury", fromCity: "Hyderabad", toCity: "Bangalore", departureTime: "09:00 PM", price: 1599, busType: "AC Volvo" },
        { id: 108, name: "Yubus Falcon", fromCity: "Hyderabad", toCity: "Bangalore", departureTime: "10:45 PM", price: 1399, busType: "Sleeper" },
        { id: 109, name: "Yubus Night Rider", fromCity: "Bangalore", toCity: "Hyderabad", departureTime: "06:15 PM", price: 1199, busType: "Sleeper" },
        { id: 110, name: "Yubus Sapphire", fromCity: "Bangalore", toCity: "Hyderabad", departureTime: "09:45 PM", price: 1349, busType: "AC Sleeper" },
        { id: 111, name: "Yubus Dawn", fromCity: "Bangalore", toCity: "Hyderabad", departureTime: "11:15 PM", price: 1499, busType: "AC Volvo" },
        { id: 112, name: "Yubus Comfort", fromCity: "Hyderabad", toCity: "Chennai", departureTime: "08:00 PM", price: 1499, busType: "AC Sleeper" },
        { id: 113, name: "Yubus Coastline", fromCity: "Hyderabad", toCity: "Chennai", departureTime: "09:30 PM", price: 1549, busType: "AC Volvo" },
        { id: 114, name: "Yubus Metro", fromCity: "Hyderabad", toCity: "Chennai", departureTime: "11:00 PM", price: 1249, busType: "Non-AC Sleeper" },
        { id: 115, name: "Yubus SuperFast", fromCity: "Chennai", toCity: "Hyderabad", departureTime: "06:00 AM", price: 999, busType: "Non-AC" },
        { id: 116, name: "Yubus Southern", fromCity: "Chennai", toCity: "Hyderabad", departureTime: "08:30 PM", price: 1399, busType: "AC Sleeper" },
        { id: 117, name: "Yubus Meridian", fromCity: "Chennai", toCity: "Hyderabad", departureTime: "10:15 PM", price: 1499, busType: "AC Volvo" },
        { id: 118, name: "Yubus Link", fromCity: "Bangalore", toCity: "Chennai", departureTime: "07:00 AM", price: 799, busType: "AC Seater" },
        { id: 119, name: "Yubus Corridor", fromCity: "Bangalore", toCity: "Chennai", departureTime: "01:30 PM", price: 949, busType: "Sleeper" },
        { id: 120, name: "Yubus Connect", fromCity: "Bangalore", toCity: "Chennai", departureTime: "10:30 PM", price: 1099, busType: "AC Sleeper" },
        { id: 121, name: "Yubus Bay", fromCity: "Chennai", toCity: "Bangalore", departureTime: "06:30 AM", price: 829, busType: "AC Seater" },
        { id: 122, name: "Yubus Velocity", fromCity: "Chennai", toCity: "Bangalore", departureTime: "09:45 PM", price: 999, busType: "Sleeper" },
        { id: 123, name: "Yubus Temple", fromCity: "Bangalore", toCity: "Tirupati", departureTime: "09:00 PM", price: 899, busType: "AC Sleeper" },
        { id: 124, name: "Yubus Pilgrim", fromCity: "Bangalore", toCity: "Tirupati", departureTime: "11:00 PM", price: 699, busType: "Non-AC Seater" },
        { id: 125, name: "Yubus Darshan", fromCity: "Hyderabad", toCity: "Tirupati", departureTime: "07:30 PM", price: 1199, busType: "AC Sleeper" },
        { id: 126, name: "Yubus Balaji", fromCity: "Hyderabad", toCity: "Tirupati", departureTime: "10:00 PM", price: 999, busType: "Sleeper" },
        { id: 127, name: "Yubus Coast", fromCity: "Hyderabad", toCity: "Visakhapatnam", departureTime: "05:45 PM", price: 1399, busType: "AC Sleeper" },
        { id: 128, name: "Yubus Seaside", fromCity: "Hyderabad", toCity: "Visakhapatnam", departureTime: "09:15 PM", price: 1599, busType: "AC Volvo" },
        { id: 129, name: "Yubus Heritage", fromCity: "Chennai", toCity: "Madurai", departureTime: "08:15 PM", price: 999, busType: "AC Sleeper" },
        { id: 130, name: "Yubus Lotus", fromCity: "Chennai", toCity: "Madurai", departureTime: "10:45 PM", price: 849, busType: "Sleeper" },
        { id: 131, name: "Yubus Capital", fromCity: "Delhi", toCity: "Lucknow", departureTime: "09:00 PM", price: 1499, busType: "AC Sleeper" },
        { id: 132, name: "Yubus Ganga", fromCity: "Delhi", toCity: "Lucknow", departureTime: "11:30 PM", price: 1699, busType: "AC Volvo" },
        { id: 133, name: "Yubus Beach", fromCity: "Goa", toCity: "Bangalore", departureTime: "08:00 PM", price: 1299, busType: "Sleeper" },
        { id: 134, name: "Yubus Konkan", fromCity: "Goa", toCity: "Bangalore", departureTime: "10:30 PM", price: 1499, busType: "AC Sleeper" },
        { id: 135, name: "Yubus Escape", fromCity: "Bangalore", toCity: "Goa", departureTime: "07:30 PM", price: 1399, busType: "AC Sleeper" },
        { id: 136, name: "Yubus Coastal", fromCity: "Bangalore", toCity: "Goa", departureTime: "10:00 PM", price: 1199, busType: "Sleeper" },
        { id: 137, name: "Yubus Pearl", fromCity: "Nellore", toCity: "Chennai", departureTime: "06:00 AM", price: 549, busType: "AC Seater" },
        { id: 138, name: "Yubus Gateway", fromCity: "Nellore", toCity: "Chennai", departureTime: "05:15 PM", price: 449, busType: "Non-AC Seater" },
        { id: 139, name: "Yubus Marina", fromCity: "Chennai", toCity: "Nellore", departureTime: "08:00 AM", price: 579, busType: "AC Seater" },
        { id: 140, name: "Yubus Shore", fromCity: "Chennai", toCity: "Nellore", departureTime: "06:45 PM", price: 649, busType: "Sleeper" },
        { id: 141, name: "Yubus Frontier", fromCity: "Hyderabad", toCity: "Nellore", departureTime: "08:45 PM", price: 999, busType: "AC Sleeper" },
        { id: 142, name: "Yubus Horizon", fromCity: "Hyderabad", toCity: "Nellore", departureTime: "10:20 PM", price: 899, busType: "Sleeper" },
        { id: 143, name: "Yubus Deccan", fromCity: "Nellore", toCity: "Hyderabad", departureTime: "07:10 PM", price: 949, busType: "AC Sleeper" },
        { id: 144, name: "Yubus Pink", fromCity: "Hyderabad", toCity: "Jaipur", departureTime: "04:30 PM", price: 1899, busType: "AC Sleeper" },
        { id: 145, name: "Yubus Desert", fromCity: "Hyderabad", toCity: "Jaipur", departureTime: "07:45 PM", price: 2099, busType: "AC Volvo" },
        { id: 146, name: "Yubus Royal Raj", fromCity: "Jaipur", toCity: "Hyderabad", departureTime: "05:00 PM", price: 1949, busType: "AC Sleeper" },
        { id: 147, name: "Yubus Capital Connect", fromCity: "Hyderabad", toCity: "Delhi", departureTime: "03:30 PM", price: 2199, busType: "AC Sleeper" },
        { id: 148, name: "Yubus North Star", fromCity: "Hyderabad", toCity: "Delhi", departureTime: "06:45 PM", price: 2399, busType: "AC Volvo" },
        { id: 149, name: "Yubus Red Fort", fromCity: "Hyderabad", toCity: "Delhi", departureTime: "09:15 PM", price: 1999, busType: "Sleeper" },
        { id: 150, name: "Yubus Deccan Return", fromCity: "Delhi", toCity: "Hyderabad", departureTime: "04:00 PM", price: 2149, busType: "AC Sleeper" },
        { id: 151, name: "Yubus Capital Return", fromCity: "Delhi", toCity: "Hyderabad", departureTime: "08:10 PM", price: 2349, busType: "AC Volvo" },
        { id: 152, name: "Yubus Western", fromCity: "Bangalore", toCity: "Mangalore", departureTime: "06:30 AM", price: 699, busType: "AC Seater" },
        { id: 153, name: "Yubus Coast Express", fromCity: "Bangalore", toCity: "Mangalore", departureTime: "10:00 PM", price: 899, busType: "Sleeper" },
        { id: 154, name: "Yubus Harbor", fromCity: "Mangalore", toCity: "Bangalore", departureTime: "07:30 AM", price: 749, busType: "AC Seater" },
        { id: 155, name: "Yubus Monsoon", fromCity: "Mangalore", toCity: "Bangalore", departureTime: "09:45 PM", price: 949, busType: "Sleeper" }
    ];

    function normalize(text) {
        return (text || "").trim().toLowerCase();
    }

    function getRouteKey(from, to) {
        return `${normalize(from)}-${normalize(to)}`;
    }

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

        return createStableHash(marker) % 4 === 0;
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

    const catalogBuses = buses.map(normalizeBusRecord);

    function getRouteImage(from, to) {
        return routeImages[`${from}-${to}`] || "https://images.unsplash.com/photo-1593693397690-362cb9666fc2";
    }

    function getBusesByRoute(from, to) {
        return catalogBuses.filter((bus) =>
            normalize(bus.fromCity) === normalize(from) &&
            normalize(bus.toCity) === normalize(to)
        );
    }

    function getPopularRoutes(limit) {
        const routeMap = new Map();

        catalogBuses.forEach((bus) => {
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
            .slice(0, limit || 16);
    }

    window.BUS_CATALOG = catalogBuses;
    window.BUS_ROUTE_IMAGES = routeImages;
    window.getCatalogRouteImage = getRouteImage;
    window.getCatalogBusesByRoute = getBusesByRoute;
    window.getCatalogPopularRoutes = getPopularRoutes;
    window.normalizeCatalogBus = normalizeBusRecord;
    window.resolveBusCoachType = resolveBusCoachType;
})();
