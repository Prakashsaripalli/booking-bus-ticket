package com.booking.backend.servlet;

import com.booking.backend.dao.LoginDao;
import com.booking.backend.dao.UserDao;
import com.booking.backend.model.LoginRequest;
import com.booking.backend.utils.JsonUtil;
import com.booking.backend.utils.ResponseUtil;
import com.booking.backend.utils.ValidationUtil;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

public class LoginServlet extends HttpServlet {

    private final LoginDao loginDao;
    private final UserDao userDao;

    public LoginServlet(LoginDao loginDao, UserDao userDao) {
        this.loginDao = loginDao;
        this.userDao = userDao;
    }

    @Override
    protected void doOptions(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        ResponseUtil.json(resp, HttpServletResponse.SC_OK, Map.of("success", true));
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        LoginRequest payload = JsonUtil.mapper().readValue(req.getInputStream(), LoginRequest.class);

        String action = payload.action == null ? "login" : payload.action.trim().toLowerCase();
        String role = payload.role == null ? "user" : payload.role.trim().toLowerCase();
        String identity = payload.identity == null ? "" : payload.identity.trim();
        String password = payload.password == null ? "" : payload.password;

        Map<String, Object> response = new HashMap<>();

        if (identity.isEmpty()) {
            response.put("success", false);
            response.put("message", "Identity is required");
            ResponseUtil.json(resp, HttpServletResponse.SC_BAD_REQUEST, response);
            return;
        }

        if ("admin".equals(role)) {
            boolean ok = loginDao.validateAdmin(identity, password);
            response.put("success", ok);
            response.put("message", ok ? "Admin login successful" : "Invalid admin credentials");
            ResponseUtil.json(resp, ok ? HttpServletResponse.SC_OK : HttpServletResponse.SC_UNAUTHORIZED, response);
            return;
        }

        String normalizedIdentity = identity.toLowerCase();
        if (!ValidationUtil.isValidEmail(normalizedIdentity)) {
            response.put("success", false);
            response.put("message", "Valid email is required");
            ResponseUtil.json(resp, HttpServletResponse.SC_BAD_REQUEST, response);
            return;
        }

        if (!ValidationUtil.isValidPassword(password)) {
            response.put("success", false);
            response.put("message", "Password must be at least 4 characters");
            ResponseUtil.json(resp, HttpServletResponse.SC_BAD_REQUEST, response);
            return;
        }

        if ("signup".equals(action)) {
            boolean created = userDao.createUserOrInitializePassword(normalizedIdentity, password);
            response.put("success", created);
            response.put("message", created ? "Signup successful" : "Account already exists. Please log in.");
            ResponseUtil.json(resp, created ? HttpServletResponse.SC_OK : HttpServletResponse.SC_CONFLICT, response);
            return;
        }

        boolean authenticated = userDao.validateUserPassword(normalizedIdentity, password);
        if (!authenticated && userDao.userExists(normalizedIdentity)) {
            authenticated = userDao.createUserOrInitializePassword(normalizedIdentity, password);
        }

        response.put("success", authenticated);
        response.put("message", authenticated ? "Login successful" : "Invalid email or password");
        ResponseUtil.json(resp, authenticated ? HttpServletResponse.SC_OK : HttpServletResponse.SC_UNAUTHORIZED, response);
    }
}
