package com.booking.backend.servlet;

import com.booking.backend.dao.LoginDao;
import com.booking.backend.model.ProfileUpdateRequest;
import com.booking.backend.model.User;
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

    private final LoginDao loginDao;

    public ProfileServlet(LoginDao loginDao) {
        this.loginDao = loginDao;
    }

    @Override
    protected void doOptions(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        ResponseUtil.json(resp, HttpServletResponse.SC_OK, Map.of("success", true));
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        String identity = req.getParameter("identity");
        if (identity == null || identity.trim().isEmpty()) {
            ResponseUtil.json(resp, HttpServletResponse.SC_BAD_REQUEST, Map.of(
                    "success", false,
                    "message", "Identity is required"
            ));
            return;
        }

        User user = loginDao.getUserByIdentity(identity);
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
        ProfileUpdateRequest payload = JsonUtil.mapper().readValue(req.getInputStream(), ProfileUpdateRequest.class);

        String currentIdentity = payload.currentIdentity == null ? "" : payload.currentIdentity.trim().toLowerCase();
        String name = payload.name == null ? "" : payload.name.trim();
        String email = payload.email == null ? "" : payload.email.trim().toLowerCase();
        String mobile = payload.mobile == null ? "" : payload.mobile.trim();

        Map<String, Object> response = new HashMap<>();

        if (currentIdentity.isEmpty()) {
            response.put("success", false);
            response.put("message", "Current identity is required");
            ResponseUtil.json(resp, HttpServletResponse.SC_BAD_REQUEST, response);
            return;
        }

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
            updatedUser = loginDao.updateUserProfile(currentIdentity, name, email, mobile);
        } catch (IllegalStateException e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            ResponseUtil.json(resp, HttpServletResponse.SC_CONFLICT, response);
            return;
        }
        response.put("success", true);
        response.put("message", "Profile updated successfully");
        response.put("profile", toProfileMap(updatedUser));

        if (ValidationUtil.isValidEmail(updatedUser.getEmail())) {
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
