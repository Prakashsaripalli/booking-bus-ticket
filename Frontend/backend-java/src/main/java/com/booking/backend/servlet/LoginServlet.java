package com.booking.backend.servlet;

import com.booking.backend.dao.LoginDao;
import com.booking.backend.model.LoginRequest;
import com.booking.backend.utils.JsonUtil;
import com.booking.backend.utils.ResponseUtil;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

public class LoginServlet extends HttpServlet {

    private final LoginDao loginDao;

    public LoginServlet(LoginDao loginDao) {
        this.loginDao = loginDao;
    }

    @Override
    protected void doOptions(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        ResponseUtil.json(resp, HttpServletResponse.SC_OK, Map.of("success", true));
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        LoginRequest payload = JsonUtil.mapper().readValue(req.getInputStream(), LoginRequest.class);

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

        loginDao.createOrGetUser(identity);
        response.put("success", true);
        response.put("message", "User identity accepted");
        ResponseUtil.json(resp, HttpServletResponse.SC_OK, response);
    }
}
