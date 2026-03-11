package com.booking.backend.servlet;

import com.booking.backend.dao.PaymentDao;
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
import java.util.HashMap;
import java.util.Map;

public class PaymentServlet extends HttpServlet {

    private final PaymentDao paymentDao;

    public PaymentServlet(PaymentDao paymentDao) {
        this.paymentDao = paymentDao;
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

            if (passengerName.isEmpty() || !ValidationUtil.isValidMobile(mobile) || !ValidationUtil.isValidEmail(email)
                    || payload.amount <= 0 || !ValidationUtil.isValidTransactionId(transactionId)) {
                ResponseUtil.json(resp, HttpServletResponse.SC_BAD_REQUEST, Map.of(
                        "success", false,
                        "message", "Transaction ID must have 1 to 4 starting letters and exactly 22 numbers after that"
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

            response.put("success", true);
            response.put("message", "Payment processed");
            response.put("payment", payment);

            String emailTarget = !notificationEmail.isBlank() ? notificationEmail : email;
            if (ValidationUtil.isValidEmail(emailTarget)) {
                if (!EmailUtil.isSmtpConfigured()) {
                    response.put("emailSent", false);
                    response.put("emailMessage", EmailUtil.smtpMissingMessage());
                } else {
                    try {
                        EmailUtil.sendBookingConfirmationEmail(
                                emailTarget,
                                bookingId,
                                passengerName,
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
