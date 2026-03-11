package com.booking.backend.utils;

import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.util.Map;

public final class ResponseUtil {

    private static final String DEFAULT_ALLOWED_ORIGIN = "*";

    private ResponseUtil() {
    }

    public static void json(HttpServletResponse response, int status, Map<String, Object> body) throws IOException {
        String allowedOrigin = System.getenv().getOrDefault("ALLOWED_ORIGIN", DEFAULT_ALLOWED_ORIGIN);

        response.setStatus(status);
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        response.setHeader("Access-Control-Allow-Origin", allowedOrigin);
        response.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,OPTIONS");
        response.setHeader("Access-Control-Allow-Headers", "Content-Type");
        response.setHeader("Vary", "Origin");
        JsonUtil.mapper().writeValue(response.getWriter(), body);
    }
}
