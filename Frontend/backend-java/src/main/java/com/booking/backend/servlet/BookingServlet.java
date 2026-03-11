package com.booking.backend.servlet;

import com.booking.backend.dao.BookingDao;
import com.booking.backend.model.BookingRecord;
import com.booking.backend.model.BookingUpdateRequest;
import com.booking.backend.utils.JsonUtil;
import com.booking.backend.utils.ResponseUtil;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.util.List;
import java.util.Map;

public class BookingServlet extends HttpServlet {

    private final BookingDao bookingDao;

    public BookingServlet(BookingDao bookingDao) {
        this.bookingDao = bookingDao;
    }

    @Override
    protected void doOptions(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        ResponseUtil.json(resp, HttpServletResponse.SC_OK, Map.of("success", true));
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        String ownerEmail = req.getParameter("ownerEmail");
        String ownerMobile = req.getParameter("ownerMobile");
        String admin = req.getParameter("admin");

        List<BookingRecord> bookings = "true".equalsIgnoreCase(admin)
                ? bookingDao.listAll()
                : bookingDao.listByOwner(ownerEmail, ownerMobile);

        ResponseUtil.json(resp, HttpServletResponse.SC_OK, Map.of(
                "success", true,
                "data", bookings
        ));
    }

    @Override
    protected void doPut(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        BookingUpdateRequest payload = JsonUtil.mapper().readValue(req.getInputStream(), BookingUpdateRequest.class);

        if (payload.bookingId == null || payload.bookingId.trim().isEmpty()) {
            ResponseUtil.json(resp, HttpServletResponse.SC_BAD_REQUEST, Map.of(
                    "success", false,
                    "message", "Booking ID is required"
            ));
            return;
        }

        BookingRecord booking = bookingDao.updateStatus(
                payload.bookingId,
                payload.status,
                payload.cancelledAt,
                payload.refundStatus,
                payload.refundAmount,
                payload.refundedAt
        );

        if (booking == null) {
            ResponseUtil.json(resp, HttpServletResponse.SC_NOT_FOUND, Map.of(
                    "success", false,
                    "message", "Booking not found"
            ));
            return;
        }

        ResponseUtil.json(resp, HttpServletResponse.SC_OK, Map.of(
                "success", true,
                "booking", booking
        ));
    }
}
