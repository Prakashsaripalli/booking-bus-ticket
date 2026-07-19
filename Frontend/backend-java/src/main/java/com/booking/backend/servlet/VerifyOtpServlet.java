package com.booking.backend.servlet;

import com.booking.backend.dao.OtpDao;
import com.booking.backend.dao.UserDao;
import com.booking.backend.model.User;
import com.booking.backend.model.VerifyOtpRequest;
import com.booking.backend.utils.AuthUtil;
import com.booking.backend.utils.JsonUtil;
import com.booking.backend.utils.ResponseUtil;
import com.booking.backend.utils.ValidationUtil;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.util.Map;

public class VerifyOtpServlet extends HttpServlet {

    private final OtpDao otpDao;
    private final UserDao userDao;

    public VerifyOtpServlet(OtpDao otpDao, UserDao userDao) {
        this.otpDao = otpDao;
        this.userDao = userDao;
    }

    @Override
    protected void doOptions(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        ResponseUtil.json(resp, HttpServletResponse.SC_OK, Map.of("success", true));
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        VerifyOtpRequest payload = JsonUtil.mapper().readValue(req.getInputStream(), VerifyOtpRequest.class);
        String mobile = payload.mobile == null ? "" : payload.mobile.trim();
        String email = payload.email == null ? "" : payload.email.trim().toLowerCase();
        String otp = payload.otp == null ? "" : payload.otp.trim();

        if (!ValidationUtil.isValidOtp(otp)) {
            ResponseUtil.json(resp, HttpServletResponse.SC_BAD_REQUEST, Map.of(
                    "success", false,
                    "message", "Invalid input"
            ));
            return;
        }

        String target;
        if (!email.isEmpty()) {
            if (!ValidationUtil.isValidEmail(email)) {
                ResponseUtil.json(resp, HttpServletResponse.SC_BAD_REQUEST, Map.of(
                        "success", false,
                        "message", "Invalid input"
                ));
                return;
            }
            target = email;
        } else if (!mobile.isEmpty() && ValidationUtil.isValidMobile(mobile)) {
            target = mobile;
        } else {
            ResponseUtil.json(resp, HttpServletResponse.SC_BAD_REQUEST, Map.of(
                    "success", false,
                    "message", "Invalid input"
            ));
            return;
        }

        boolean verified = otpDao.verifyOtp(target, otp);
        if (!verified) {
            ResponseUtil.json(resp, HttpServletResponse.SC_UNAUTHORIZED, Map.of(
                    "success", false,
                    "message", "Invalid or expired OTP"
            ));
            return;
        }

        if (!AuthUtil.hasPendingOtpChallenge(req, target)) {
            ResponseUtil.json(resp, HttpServletResponse.SC_UNAUTHORIZED, Map.of(
                    "success", false,
                    "message", "Your login session expired. Please sign in again."
            ));
            return;
        }

        User user = !email.isEmpty() ? userDao.getUserByIdentity(email) : userDao.getUserByMobile(mobile);
        if (user == null) {
            ResponseUtil.json(resp, HttpServletResponse.SC_NOT_FOUND, Map.of(
                    "success", false,
                    "message", "User account not found for the verified OTP"
            ));
            return;
        }

        AuthUtil.completeUserLogin(req, user);

        ResponseUtil.json(resp, HttpServletResponse.SC_OK, Map.of(
                "success", true,
                "message", "OTP verified",
                "profile", Map.of(
                        "identity", user.getIdentity(),
                        "name", user.getName() == null ? "" : user.getName(),
                        "email", user.getEmail() == null ? "" : user.getEmail(),
                        "mobile", user.getMobile() == null ? "" : user.getMobile()
                )
        ));
    }
}
