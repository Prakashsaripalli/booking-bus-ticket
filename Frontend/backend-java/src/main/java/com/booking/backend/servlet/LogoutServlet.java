package com.booking.backend.servlet;

import com.booking.backend.utils.AuthUtil;
import com.booking.backend.utils.ResponseUtil;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.util.Map;

public class LogoutServlet extends HttpServlet {

    @Override
    protected void doOptions(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        ResponseUtil.json(resp, HttpServletResponse.SC_OK, Map.of("success", true));
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        AuthUtil.logout(req);
        ResponseUtil.json(resp, HttpServletResponse.SC_OK, Map.of(
                "success", true,
                "message", "Logged out successfully"
        ));
    }
}
