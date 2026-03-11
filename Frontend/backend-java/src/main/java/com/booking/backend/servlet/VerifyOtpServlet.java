package com.booking.backend.servlet;

import com.booking.backend.dao.OtpDao;
import com.booking.backend.model.VerifyOtpRequest;
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

    public VerifyOtpServlet(OtpDao otpDao) {
        this.otpDao = otpDao;
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
        ResponseUtil.json(resp, verified ? HttpServletResponse.SC_OK : HttpServletResponse.SC_UNAUTHORIZED, Map.of(
                "success", verified,
                "message", verified ? "OTP verified" : "Invalid or expired OTP"
        ));
    }
}
