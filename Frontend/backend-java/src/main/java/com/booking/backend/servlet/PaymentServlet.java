package com.booking.backend.servlet;

import com.booking.backend.dao.BookingDao;
import com.booking.backend.dao.PaymentDao;
import com.booking.backend.model.BookingRecord;
import com.booking.backend.model.PaymentRecord;
import com.booking.backend.model.PaymentRequest;
import com.booking.backend.utils.EmailUtil;
import com.booking.backend.utils.JsonUtil;
import com.booking.backend.utils.ResponseUtil;
import com.booking.backend.utils.ValidationUtil;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

public class PaymentServlet extends HttpServlet {

    private final PaymentDao paymentDao;
    private final BookingDao bookingDao;

    public PaymentServlet(PaymentDao paymentDao, BookingDao bookingDao) {
        this.paymentDao = paymentDao;
        this.bookingDao = bookingDao;
    }

    @Override
    protected void doOptions(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        ResponseUtil.json(resp, HttpServletResponse.SC_OK, Map.of("success", true));
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        try {
            PaymentRequest payload = JsonUtil.mapper().readValue(req.getInputStream(), PaymentRequest.class);

            String passengerName = payload.passengerName == null ? "" : payload.passengerName.trim();
            String mobile = payload.mobile == null ? "" : payload.mobile.trim();
            String email = payload.email == null ? "" : payload.email.trim();
            String notificationEmail = payload.notificationEmail == null ? "" : payload.notificationEmail.trim();
            String transactionId = payload.transactionId == null ? "" : payload.transactionId.trim();
            String bookingId = payload.bookingId == null ? "" : payload.bookingId.trim();
            String from = payload.from == null ? "" : payload.from.trim();
            String to = payload.to == null ? "" : payload.to.trim();
            String busName = payload.busName == null ? "" : payload.busName.trim();
            String seats = payload.seats == null ? "" : payload.seats.trim();
            String journeyDate = payload.journeyDate == null ? "" : payload.journeyDate.trim();
            String departureTime = payload.departureTime == null ? "" : payload.departureTime.trim();
            String paymentMethod = payload.paymentMethod == null ? "" : payload.paymentMethod.trim();

            String validationError = null;
            if (passengerName.isEmpty()) {
                validationError = "Passenger name is required";
            } else if (!ValidationUtil.isValidMobile(mobile)) {
                validationError = "Invalid mobile number. Expected 10 digits or +91XXXXXXXXXX";
            } else if (!ValidationUtil.isValidEmail(email)) {
                validationError = "Valid email is required";
            } else if (payload.amount <= 0) {
                validationError = "Payment amount must be greater than 0";
            } else if (!ValidationUtil.isValidTransactionId(transactionId)) {
                validationError = "Transaction ID must have 1 to 4 starting letters and exactly 22 numbers after that";
            }

            if (validationError != null) {
                ResponseUtil.json(resp, HttpServletResponse.SC_BAD_REQUEST, Map.of(
                        "success", false,
                        "message", validationError
                ));
                return;
            }

            Map<String, Object> response = new HashMap<>();
            PaymentRecord payment;
            try {
                payment = paymentDao.save(passengerName, mobile, email, payload.amount, transactionId);
            } catch (IllegalStateException e) {
                ResponseUtil.json(resp, HttpServletResponse.SC_CONFLICT, Map.of(
                        "success", false,
                        "message", e.getMessage()
                ));
                return;
            }

            // Save the booking record to the database
            String resolvedNotificationEmail = ValidationUtil.isValidEmail(notificationEmail) ? notificationEmail : "";

            BookingRecord booking = new BookingRecord(
                    bookingId,
                    from,
                    to,
                    busName,
                    seats,
                    journeyDate,
                    departureTime,
                    payload.originalAmount,
                    payload.amount,
                    payload.discountAmount,
                    passengerName,
                    mobile,
                    email,
                    resolvedNotificationEmail.isBlank() ? email : resolvedNotificationEmail,
                    "", // owner_mobile can be empty if not provided
                    paymentMethod,
                    transactionId,
                    "Booked",
                    Instant.now().toString(),
                    null,
                    null,
                    0,
                    null
            );
            bookingDao.save(booking);

            response.put("success", true);
            response.put("message", "Payment processed and booking created");
            response.put("payment", payment);
            response.put("booking", booking);

            String emailTarget = ValidationUtil.isValidEmail(resolvedNotificationEmail)
                    ? resolvedNotificationEmail
                    : email;

            if (ValidationUtil.isValidEmail(emailTarget)) {
                if (!EmailUtil.isEmailDeliveryEnabled()) {
                    response.put("emailSent", false);
                    response.put("emailMessage", EmailUtil.shouldSkipEmail()
                            ? "Booking confirmed, but email delivery skipped for local testing."
                            : EmailUtil.smtpMissingMessage());
                } else {
                    try {
                        EmailUtil.sendBookingConfirmationEmail(
                                emailTarget,
                                bookingId,
                                passengerName,
                                mobile,
                                email,
                                from,
                                to,
                                busName,
                                departureTime,
                                journeyDate,
                                seats,
                                paymentMethod,
                                payload.originalAmount,
                                payload.discountAmount,
                                payload.amount,
                                transactionId
                        );
                        response.put("emailSent", true);
                    } catch (Exception e) {
                        e.printStackTrace();
                        response.put("emailSent", false);
                        response.put("emailMessage", e.getMessage() == null || e.getMessage().isBlank()
                                ? "Booking confirmed, but email delivery failed"
                                : e.getMessage());
                    }
                }
            } else {
                response.put("emailSent", false);
                response.put("emailMessage", "Booking confirmed, but no valid email was available for confirmation");
            }

            ResponseUtil.json(resp, HttpServletResponse.SC_OK, response);
        } catch (Exception e) {
            e.printStackTrace();
            ResponseUtil.json(resp, HttpServletResponse.SC_INTERNAL_SERVER_ERROR, Map.of(
                    "success", false,
                    "message", "Payment processing failed on the backend"
            ));
        }
    }
}
