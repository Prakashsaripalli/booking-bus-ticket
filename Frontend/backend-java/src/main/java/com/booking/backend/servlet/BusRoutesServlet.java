package com.booking.backend.servlet;

import com.booking.backend.dao.BusDao;
import com.booking.backend.model.BusRoute;
import com.booking.backend.utils.ResponseUtil;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.util.List;
import java.util.Map;

public class BusRoutesServlet extends HttpServlet {

    private final BusDao busDao;

    public BusRoutesServlet(BusDao busDao) {
        this.busDao = busDao;
    }

    @Override
    protected void doOptions(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        ResponseUtil.json(resp, HttpServletResponse.SC_OK, Map.of("success", true));
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        List<BusRoute> routes = busDao.getBusRoutes();
        ResponseUtil.json(resp, HttpServletResponse.SC_OK, Map.of(
                "success", true,
                "data", routes
        ));
    }
}
