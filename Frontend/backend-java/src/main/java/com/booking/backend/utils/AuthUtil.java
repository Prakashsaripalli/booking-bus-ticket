package com.booking.backend.utils;

import com.booking.backend.model.AuthenticatedUser;
import com.booking.backend.model.User;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;

public final class AuthUtil {

    private static final String ATTR_ROLE = "auth.role";
    private static final String ATTR_IDENTITY = "auth.identity";
    private static final String ATTR_NAME = "auth.name";
    private static final String ATTR_EMAIL = "auth.email";
    private static final String ATTR_MOBILE = "auth.mobile";
    private static final String ATTR_PENDING_OTP_IDENTITY = "auth.pendingOtpIdentity";

    private AuthUtil() {
    }

    public static void beginOtpChallenge(HttpServletRequest req, String identity) {
        HttpSession session = renewSession(req);
        session.setMaxInactiveInterval(Math.max(300, Config.getSessionTimeoutMinutes() * 60));
        session.setAttribute(ATTR_PENDING_OTP_IDENTITY, normalize(identity));
    }

    public static boolean hasPendingOtpChallenge(HttpServletRequest req, String identity) {
        HttpSession session = req.getSession(false);
        if (session == null) {
            return false;
        }

        String pendingIdentity = normalize((String) session.getAttribute(ATTR_PENDING_OTP_IDENTITY));
        return !pendingIdentity.isBlank() && pendingIdentity.equals(normalize(identity));
    }

    public static void completeUserLogin(HttpServletRequest req, User user) {
        HttpSession session = renewSession(req);
        session.setMaxInactiveInterval(Config.getSessionTimeoutMinutes() * 60);
        session.setAttribute(ATTR_ROLE, "user");
        session.setAttribute(ATTR_IDENTITY, normalize(user == null ? "" : user.getIdentity()));
        session.setAttribute(ATTR_NAME, safe(user == null ? "" : user.getName()));
        session.setAttribute(ATTR_EMAIL, normalize(user == null ? "" : user.getEmail()));
        session.setAttribute(ATTR_MOBILE, safe(user == null ? "" : user.getMobile()));
    }

    public static void completeAdminLogin(HttpServletRequest req, String identity) {
        HttpSession session = renewSession(req);
        session.setMaxInactiveInterval(Config.getSessionTimeoutMinutes() * 60);
        session.setAttribute(ATTR_ROLE, "admin");
        session.setAttribute(ATTR_IDENTITY, normalize(identity));
        session.setAttribute(ATTR_NAME, safe(identity));
        session.setAttribute(ATTR_EMAIL, normalize(Config.getAdminEmail()));
        session.setAttribute(ATTR_MOBILE, "");
    }

    public static AuthenticatedUser getAuthenticatedUser(HttpServletRequest req) {
        HttpSession session = req.getSession(false);
        if (session == null) {
            return null;
        }

        String role = safe((String) session.getAttribute(ATTR_ROLE));
        if (role.isBlank()) {
            return null;
        }

        return new AuthenticatedUser(
                role,
                safe((String) session.getAttribute(ATTR_IDENTITY)),
                safe((String) session.getAttribute(ATTR_NAME)),
                safe((String) session.getAttribute(ATTR_EMAIL)),
                safe((String) session.getAttribute(ATTR_MOBILE))
        );
    }

    public static void logout(HttpServletRequest req) {
        HttpSession session = req.getSession(false);
        if (session != null) {
            session.invalidate();
        }
    }

    private static HttpSession renewSession(HttpServletRequest req) {
        HttpSession existing = req.getSession(false);
        if (existing != null) {
            existing.invalidate();
        }
        return req.getSession(true);
    }

    private static String normalize(String value) {
        return safe(value).toLowerCase();
    }

    private static String safe(String value) {
        return value == null ? "" : value.trim();
    }
}
