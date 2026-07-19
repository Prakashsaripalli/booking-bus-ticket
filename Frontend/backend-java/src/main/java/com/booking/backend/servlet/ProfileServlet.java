package com.booking.backend.servlet;

import com.booking.backend.dao.UserDao;
import com.booking.backend.model.AuthenticatedUser;
import com.booking.backend.model.ProfileUpdateRequest;
import com.booking.backend.model.User;
import com.booking.backend.utils.AuthUtil;
import com.booking.backend.utils.EmailUtil;
import com.booking.backend.utils.JsonUtil;
import com.booking.backend.utils.ResponseUtil;
import com.booking.backend.utils.ValidationUtil;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

public class ProfileServlet extends HttpServlet {

    private final UserDao userDao;

    public ProfileServlet(UserDao userDao) {
        this.userDao = userDao;
    }

    @Override
    protected void doOptions(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        ResponseUtil.json(resp, HttpServletResponse.SC_OK, Map.of("success", true));
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        AuthenticatedUser actor = AuthUtil.getAuthenticatedUser(req);
        if (actor == null) {
            ResponseUtil.json(resp, HttpServletResponse.SC_UNAUTHORIZED, Map.of(
                    "success", false,
                    "message", "Please log in to view your profile"
            ));
            return;
        }

        if (actor.isAdmin()) {
            ResponseUtil.json(resp, HttpServletResponse.SC_FORBIDDEN, Map.of(
                    "success", false,
                    "message", "Admin accounts do not use the passenger profile API"
            ));
            return;
        }

        User user;
        try {
            user = userDao.getUserByIdentity(actor.loginIdentity());
        } catch (RuntimeException e) {
            ResponseUtil.json(resp, HttpServletResponse.SC_INTERNAL_SERVER_ERROR, Map.of(
                    "success", false,
                    "message", "Failed to load profile from database"
            ));
            return;
        }

        if (user == null) {
            ResponseUtil.json(resp, HttpServletResponse.SC_NOT_FOUND, Map.of(
                    "success", false,
                    "message", "User not found"
            ));
            return;
        }

        ResponseUtil.json(resp, HttpServletResponse.SC_OK, Map.of(
                "success", true,
                "profile", toProfileMap(user)
        ));
    }

    @Override
    protected void doPut(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        AuthenticatedUser actor = AuthUtil.getAuthenticatedUser(req);
        if (actor == null) {
            ResponseUtil.json(resp, HttpServletResponse.SC_UNAUTHORIZED, Map.of(
                    "success", false,
                    "message", "Please log in to update your profile"
            ));
            return;
        }

        if (actor.isAdmin()) {
            ResponseUtil.json(resp, HttpServletResponse.SC_FORBIDDEN, Map.of(
                    "success", false,
                    "message", "Admin accounts do not use the passenger profile API"
            ));
            return;
        }

        ProfileUpdateRequest payload = JsonUtil.mapper().readValue(req.getInputStream(), ProfileUpdateRequest.class);

        String name = payload.name == null ? "" : payload.name.trim();
        String email = payload.email == null ? "" : payload.email.trim().toLowerCase();
        String mobile = payload.mobile == null ? "" : payload.mobile.trim();

        Map<String, Object> response = new HashMap<>();

        if (name.isEmpty()) {
            response.put("success", false);
            response.put("message", "Name is required");
            ResponseUtil.json(resp, HttpServletResponse.SC_BAD_REQUEST, response);
            return;
        }

        if (!ValidationUtil.isValidEmail(email)) {
            response.put("success", false);
            response.put("message", "Valid email is required");
            ResponseUtil.json(resp, HttpServletResponse.SC_BAD_REQUEST, response);
            return;
        }

        if (!mobile.isEmpty() && !ValidationUtil.isValidMobile(mobile)) {
            response.put("success", false);
            response.put("message", "Valid mobile number is required");
            ResponseUtil.json(resp, HttpServletResponse.SC_BAD_REQUEST, response);
            return;
        }

        User updatedUser;
        try {
            updatedUser = userDao.updateUserProfile(actor.loginIdentity(), name, email, mobile);
        } catch (IllegalStateException e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            ResponseUtil.json(resp, HttpServletResponse.SC_CONFLICT, response);
            return;
        } catch (RuntimeException e) {
            response.put("success", false);
            response.put("message", "Failed to update profile in database");
            ResponseUtil.json(resp, HttpServletResponse.SC_INTERNAL_SERVER_ERROR, response);
            return;
        }
        AuthUtil.completeUserLogin(req, updatedUser);
        response.put("success", true);
        response.put("message", "Profile updated successfully");
        response.put("profile", toProfileMap(updatedUser));

        if (ValidationUtil.isValidEmail(updatedUser.getEmail())) {
            if (!EmailUtil.isEmailDeliveryEnabled()) {
                response.put("emailSent", false);
                response.put("emailMessage", EmailUtil.shouldSkipEmail()
                        ? "Profile updated, but email delivery skipped for local testing."
                        : EmailUtil.smtpMissingMessage());
            } else {
                try {
                    EmailUtil.sendProfileUpdatedEmail(
                            updatedUser.getEmail(),
                            updatedUser.getName(),
                            updatedUser.getEmail(),
                            updatedUser.getMobile()
                    );
                    response.put("emailSent", true);
                } catch (Exception e) {
                    response.put("emailSent", false);
                    response.put("emailMessage", "Profile updated, but email delivery failed");
                }
            }
        } else {
            response.put("emailSent", false);
            response.put("emailMessage", "Profile updated, but no valid email was available");
        }

        ResponseUtil.json(resp, HttpServletResponse.SC_OK, response);
    }

    private Map<String, Object> toProfileMap(User user) {
        Map<String, Object> profile = new HashMap<>();
        profile.put("identity", user.getIdentity());
        profile.put("name", user.getName());
        profile.put("email", user.getEmail());
        profile.put("mobile", user.getMobile());
        return profile;
    }
}
