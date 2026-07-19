package com.booking.backend.servlet;

import com.booking.backend.dao.BookingDao;
import com.booking.backend.model.AuthenticatedUser;
import com.booking.backend.model.BookingRecord;
import com.booking.backend.model.BookingUpdateRequest;
import com.booking.backend.utils.AuthUtil;
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
        AuthenticatedUser actor = AuthUtil.getAuthenticatedUser(req);
        if (actor == null) {
            ResponseUtil.json(resp, HttpServletResponse.SC_UNAUTHORIZED, Map.of(
                    "success", false,
                    "message", "Please log in to view bookings"
            ));
            return;
        }

        List<BookingRecord> bookings = actor.isAdmin()
                ? bookingDao.listAll()
                : bookingDao.listByOwner(actor.loginIdentity(), actor.normalizedMobile());

        ResponseUtil.json(resp, HttpServletResponse.SC_OK, Map.of(
                "success", true,
                "data", bookings
        ));
    }

    @Override
    protected void doPut(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        try {
            AuthenticatedUser actor = AuthUtil.getAuthenticatedUser(req);
            if (actor == null) {
                ResponseUtil.json(resp, HttpServletResponse.SC_UNAUTHORIZED, Map.of(
                        "success", false,
                        "message", "Please log in to update bookings"
                ));
                return;
            }

            BookingUpdateRequest payload = JsonUtil.mapper().readValue(req.getInputStream(), BookingUpdateRequest.class);

            if (payload.bookingId == null || payload.bookingId.trim().isEmpty()) {
                ResponseUtil.json(resp, HttpServletResponse.SC_BAD_REQUEST, Map.of(
                        "success", false,
                        "message", "Booking ID is required"
                ));
                return;
            }

            BookingRecord existingBooking = bookingDao.findByBookingId(payload.bookingId);
            if (existingBooking == null) {
                ResponseUtil.json(resp, HttpServletResponse.SC_NOT_FOUND, Map.of(
                        "success", false,
                        "message", "Booking not found"
                ));
                return;
            }

            if (!actor.isAdmin() && !ownsBooking(actor, existingBooking)) {
                ResponseUtil.json(resp, HttpServletResponse.SC_FORBIDDEN, Map.of(
                        "success", false,
                        "message", "You can only update your own bookings"
                ));
                return;
            }

            String requestedStatus = payload.status == null ? "" : payload.status.trim();
            if (!actor.isAdmin() && !"Cancelled".equalsIgnoreCase(requestedStatus)) {
                ResponseUtil.json(resp, HttpServletResponse.SC_FORBIDDEN, Map.of(
                        "success", false,
                        "message", "Passenger accounts can only cancel bookings"
                ));
                return;
            }

            BookingRecord booking = bookingDao.updateStatus(
                    payload.bookingId,
                    actor.isAdmin() ? payload.status : "Cancelled",
                    payload.cancelledAt,
                    actor.isAdmin() ? payload.refundStatus : "",
                    actor.isAdmin() ? payload.refundAmount : 0,
                    actor.isAdmin() ? payload.refundedAt : ""
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
        } catch (Exception e) {
            e.printStackTrace();
            ResponseUtil.json(resp, HttpServletResponse.SC_INTERNAL_SERVER_ERROR, Map.of(
                    "success", false,
                    "message", e.getMessage() == null || e.getMessage().isBlank()
                            ? "Failed to update booking in database"
                            : e.getMessage()
            ));
        }
    }

    private boolean ownsBooking(AuthenticatedUser actor, BookingRecord booking) {
        String actorEmail = actor.loginIdentity();
        String actorMobile = actor.normalizedMobile().toLowerCase();
        String ownerEmail = normalize(booking.getOwnerEmail());
        String ownerMobile = normalize(booking.getOwnerMobile());

        return (!actorEmail.isBlank() && actorEmail.equals(ownerEmail))
                || (!actorMobile.isBlank() && actorMobile.equals(ownerMobile));
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim().toLowerCase();
    }
}
