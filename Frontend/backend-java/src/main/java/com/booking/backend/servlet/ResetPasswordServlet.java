package com.booking.backend.servlet;

import com.booking.backend.dao.OtpDao;
import com.booking.backend.dao.UserDao;
import com.booking.backend.model.ResetPasswordRequest;
import com.booking.backend.model.User;
import com.booking.backend.utils.JsonUtil;
import com.booking.backend.utils.ResponseUtil;
import com.booking.backend.utils.ValidationUtil;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.util.Map;

public class ResetPasswordServlet extends HttpServlet {

    private final UserDao userDao;
    private final OtpDao otpDao;

    public ResetPasswordServlet(UserDao userDao, OtpDao otpDao) {
        this.userDao = userDao;
        this.otpDao = otpDao;
    }

    @Override
    protected void doOptions(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        ResponseUtil.json(resp, HttpServletResponse.SC_OK, Map.of("success", true));
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        ResetPasswordRequest payload = JsonUtil.mapper().readValue(req.getInputStream(), ResetPasswordRequest.class);
        String email = payload.email == null ? "" : payload.email.trim().toLowerCase();
        String otp = payload.otp == null ? "" : payload.otp.trim();
        String newPassword = payload.newPassword == null ? "" : payload.newPassword;

        if (!ValidationUtil.isValidEmail(email)) {
            ResponseUtil.json(resp, HttpServletResponse.SC_BAD_REQUEST, Map.of(
                    "success", false,
                    "message", "Valid email is required"
            ));
            return;
        }

        if (!ValidationUtil.isValidOtp(otp)) {
            ResponseUtil.json(resp, HttpServletResponse.SC_BAD_REQUEST, Map.of(
                    "success", false,
                    "message", "Enter a valid 6-digit OTP"
            ));
            return;
        }

        if (!ValidationUtil.isValidPassword(newPassword)) {
            ResponseUtil.json(resp, HttpServletResponse.SC_BAD_REQUEST, Map.of(
                    "success", false,
                    "message", "Password must be at least 4 characters"
            ));
            return;
        }

        User user = userDao.getUserByIdentity(email);
        if (user == null) {
            ResponseUtil.json(resp, HttpServletResponse.SC_NOT_FOUND, Map.of(
                    "success", false,
                    "message", "No account found for this email"
            ));
            return;
        }

        boolean verified = otpDao.verifyOtp(email, otp);
        if (!verified) {
            ResponseUtil.json(resp, HttpServletResponse.SC_UNAUTHORIZED, Map.of(
                    "success", false,
                    "message", "Invalid or expired OTP"
            ));
            return;
        }

        boolean updated = userDao.updatePassword(email, newPassword);
        ResponseUtil.json(resp, updated ? HttpServletResponse.SC_OK : HttpServletResponse.SC_INTERNAL_SERVER_ERROR, Map.of(
                "success", updated,
                "message", updated ? "Password reset successful" : "Failed to update password"
        ));
    }
}
