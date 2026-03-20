package com.booking.backend.utils;

import com.fasterxml.jackson.databind.ObjectMapper;

public class JsonUtil {
    private static final ObjectMapper mapper = new ObjectMapper();

    public static ObjectMapper mapper() {
        return mapper;
    }
}
