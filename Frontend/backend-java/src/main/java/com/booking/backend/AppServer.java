package com.booking.backend;

import com.booking.backend.dao.BusDao;
import com.booking.backend.dao.LoginDao;
import com.booking.backend.dao.OtpDao;
import com.booking.backend.dao.PaymentDao;
import com.booking.backend.servlet.BusSearchServlet;
import com.booking.backend.servlet.LoginServlet;
import com.booking.backend.servlet.NotificationEmailServlet;
import com.booking.backend.servlet.PaymentServlet;
import com.booking.backend.servlet.PopularRoutesServlet;
import com.booking.backend.servlet.ProfileServlet;
import com.booking.backend.servlet.SendOtpServlet;
import com.booking.backend.servlet.VerifyOtpServlet;
import com.booking.backend.utils.JdbcUtil;
import org.eclipse.jetty.server.Server;
import org.eclipse.jetty.servlet.ServletContextHandler;
import org.eclipse.jetty.servlet.ServletHolder;

public class AppServer {

    private static int resolvePort() {
        String rawPort = System.getenv("PORT");
        if (rawPort == null || rawPort.isBlank()) {
            return 8081;
        }

        try {
            return Integer.parseInt(rawPort.trim());
        } catch (NumberFormatException ignored) {
            return 8081;
        }
    }

    public static void main(String[] args) throws Exception {
        int port = resolvePort();
        Server server = new Server(port);

        JdbcUtil.initSchema();

        BusDao busDao = new BusDao();
        LoginDao loginDao = new LoginDao();
        OtpDao otpDao = new OtpDao();
        PaymentDao paymentDao = new PaymentDao();

        ServletContextHandler context = new ServletContextHandler(ServletContextHandler.SESSIONS);
        context.setContextPath("/");

        context.addServlet(new ServletHolder(new BusSearchServlet(busDao)), "/api/buses/search");
        context.addServlet(new ServletHolder(new PopularRoutesServlet(busDao)), "/api/routes/popular");
        context.addServlet(new ServletHolder(new LoginServlet(loginDao)), "/api/login");
        context.addServlet(new ServletHolder(new ProfileServlet(loginDao)), "/api/profile");
        context.addServlet(new ServletHolder(new SendOtpServlet(otpDao)), "/api/auth/send-otp");
        context.addServlet(new ServletHolder(new VerifyOtpServlet(otpDao)), "/api/auth/verify-otp");
        context.addServlet(new ServletHolder(new PaymentServlet(paymentDao)), "/api/payment/process");
        context.addServlet(new ServletHolder(new NotificationEmailServlet()), "/api/notifications/email");

        server.setHandler(context);

        server.start();
        System.out.println("Java backend started on port " + port);
        server.join();
    }
}
