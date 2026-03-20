package com.booking.backend.utils;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;

public class ResponseUtil {
    private static final ObjectMapper mapper = new ObjectMapper();

    public static void json(HttpServletResponse resp, int status, Object data) throws IOException {
        resp.setStatus(status);
        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");
        setCorsHeaders(resp);
        mapper.writeValue(resp.getWriter(), data);
    }

    private static void setCorsHeaders(HttpServletResponse resp) {
        String allowedOrigin = Config.getAllowedOrigin();
        resp.setHeader("Access-Control-Allow-Origin", allowedOrigin);
        resp.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
        resp.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
        resp.setHeader("Access-Control-Max-Age", "86400");
    }
}
