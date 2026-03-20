package com.booking.backend.servlet;

import com.booking.backend.dao.BusDao;
import com.booking.backend.model.Bus;
import com.booking.backend.utils.ResponseUtil;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.util.List;
import java.util.Map;

public class BusSearchServlet extends HttpServlet {

    private final BusDao busDao;

    public BusSearchServlet(BusDao busDao) {
        this.busDao = busDao;
    }

    @Override
    protected void doOptions(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        ResponseUtil.json(resp, HttpServletResponse.SC_OK, Map.of("success", true));
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        String from = firstNonBlank(req.getParameter("from"), req.getParameter("source"));
        String to = firstNonBlank(req.getParameter("to"), req.getParameter("destination"));

        if (from == null || from.trim().isEmpty() || to == null || to.trim().isEmpty()) {
            ResponseUtil.json(resp, HttpServletResponse.SC_BAD_REQUEST, Map.of(
                    "success", false,
                    "message", "Both source/from and destination/to are required"
            ));
            return;
        }

        List<Bus> buses = busDao.searchByRoute(from.trim(), to.trim());
        ResponseUtil.json(resp, HttpServletResponse.SC_OK, Map.of(
                "success", true,
                "data", buses
        ));
    }

    private String firstNonBlank(String primary, String secondary) {
        if (primary != null && !primary.trim().isEmpty()) {
            return primary;
        }
        if (secondary != null && !secondary.trim().isEmpty()) {
            return secondary;
        }
        return null;
    }
}
