package com.booking.backend;

import com.booking.backend.dao.BookingDao;
import com.booking.backend.dao.BusDao;
import com.booking.backend.dao.LoginDao;
import com.booking.backend.dao.OtpDao;
import com.booking.backend.dao.PaymentDao;
import com.booking.backend.dao.UserDao;
import com.booking.backend.servlet.BookingServlet;
import com.booking.backend.servlet.BusRoutesServlet;
import com.booking.backend.servlet.BusSearchServlet;
import com.booking.backend.servlet.LoginServlet;
import com.booking.backend.servlet.NotificationEmailServlet;
import com.booking.backend.servlet.PaymentServlet;
import com.booking.backend.servlet.PopularRoutesServlet;
import com.booking.backend.servlet.ProfileServlet;
import com.booking.backend.servlet.ResetPasswordServlet;
import com.booking.backend.servlet.SendOtpServlet;
import com.booking.backend.servlet.VerifyOtpServlet;
import com.booking.backend.utils.JdbcUtil;
import org.eclipse.jetty.servlet.DefaultServlet;
import org.eclipse.jetty.server.Server;
import org.eclipse.jetty.servlet.ServletContextHandler;
import org.eclipse.jetty.servlet.ServletHolder;
import org.eclipse.jetty.util.resource.Resource;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

public class AppServer {

    private static int resolvePort() {
        String rawPort = System.getenv("PORT");
        if (rawPort == null || rawPort.isBlank()) {
            return 8000;
        }

        try {
            return Integer.parseInt(rawPort.trim());
        } catch (NumberFormatException ignored) {
            return 8000;
        }
    }

    private static Resource resolveFrontendBase() {
        String configured = System.getenv("FRONTEND_DIR");
        Path candidate = null;

        if (configured != null && !configured.isBlank()) {
            candidate = Paths.get(configured.trim());
            if (Files.exists(candidate.resolve("index.html"))) {
                try {
                    return Resource.newResource(candidate.toUri());
                } catch (Exception e) {
                    return null;
                }
            }
        }

        Path cwd = Paths.get("").toAbsolutePath();
        if (Files.exists(cwd.resolve("index.html"))) {
            try {
                return Resource.newResource(cwd.toUri());
            } catch (Exception e) {
                return null;
            }
        }

        Path parent = cwd.resolve("..").normalize().toAbsolutePath();
        if (Files.exists(parent.resolve("index.html"))) {
            try {
                return Resource.newResource(parent.toUri());
            } catch (Exception e) {
                return null;
            }
        }

        return null;
    }

    public static void main(String[] args) throws Exception {
        int port = resolvePort();
        Server server = new Server(port);

        JdbcUtil.initSchema();

        BusDao busDao = new BusDao();
        LoginDao loginDao = new LoginDao();
        UserDao userDao = new UserDao();
        OtpDao otpDao = new OtpDao();
        PaymentDao paymentDao = new PaymentDao();
        BookingDao bookingDao = new BookingDao();

        ServletContextHandler context = new ServletContextHandler(ServletContextHandler.SESSIONS);
        context.setContextPath("/");
        context.setWelcomeFiles(new String[]{"index.html"});

        context.addServlet(new ServletHolder(new BusSearchServlet(busDao)), "/api/buses/search");
        context.addServlet(new ServletHolder(new BusRoutesServlet(busDao)), "/api/buses/routes");
        context.addServlet(new ServletHolder(new PopularRoutesServlet(busDao)), "/api/routes/popular");
        context.addServlet(new ServletHolder(new LoginServlet(loginDao, userDao)), "/api/login");
        context.addServlet(new ServletHolder(new ProfileServlet(userDao)), "/api/profile");
        context.addServlet(new ServletHolder(new SendOtpServlet(otpDao)), "/api/auth/send-otp");
        context.addServlet(new ServletHolder(new VerifyOtpServlet(otpDao)), "/api/auth/verify-otp");
        context.addServlet(new ServletHolder(new ResetPasswordServlet(userDao, otpDao)), "/api/auth/reset-password");
        context.addServlet(new ServletHolder(new PaymentServlet(paymentDao, bookingDao)), "/api/payment/process");
        context.addServlet(new ServletHolder(new BookingServlet(bookingDao)), "/api/bookings");
        context.addServlet(new ServletHolder(new NotificationEmailServlet()), "/api/notifications/email");

        Resource frontendBase = resolveFrontendBase();
        if (frontendBase != null) {
            context.setBaseResource(frontendBase);
            ServletHolder staticHolder = new ServletHolder("static", DefaultServlet.class);
            staticHolder.setInitParameter("dirAllowed", "true");
            context.addServlet(staticHolder, "/");
        } else {
            System.out.println("Frontend directory not found. Set FRONTEND_DIR to enable static hosting.");
        }

        server.setHandler(context);

        server.start();
        System.out.println("Java backend started on port " + port);
        server.join();
    }
}
