package com.booking.backend.utils;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import jakarta.mail.Authenticator;
import jakarta.mail.MessagingException;
import jakarta.mail.PasswordAuthentication;
import jakarta.mail.Session;
import jakarta.mail.Transport;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import java.util.Properties;

public final class EmailUtil {
    private static final String EMAIL_PAGE_BACKGROUND = "#f7fbff";

    private static final Logger LOGGER = LoggerFactory.getLogger(EmailUtil.class);

    private EmailUtil() {
    }

    public static void sendOtpEmail(String toEmail, String otp) throws MessagingException {
        if (Config.isOtpDebug()) {
            LOGGER.info("OTP DEBUG MODE: OTP {} for {}", otp, toEmail);
            throw new MessagingException("OTP debug mode is enabled. Disable OTP_DEBUG to send real emails.");
        }
        Session session = createSession();
        String fromEmail = getFromEmail();

        MimeMessage message = new MimeMessage(session);
        message.setFrom(new InternetAddress(fromEmail));
        message.setRecipients(MimeMessage.RecipientType.TO, InternetAddress.parse(toEmail));
        message.setSubject("Yubus OTP Verification");
        message.setText("Your Yubus OTP is: " + otp + "\n\nValid for 5 minutes.");

        try {
            Transport.send(message);
        } catch (MessagingException e) {
            LOGGER.error("Email send failed for {}: {}", toEmail, e.getMessage(), e);
            throw e;
        }
    }

    public static void sendProfileUpdatedEmail(String toEmail, String name, String email, String mobile) throws MessagingException {
        Session session = createSession();
        String fromEmail = getFromEmail();

        MimeMessage message = new MimeMessage(session);
        message.setFrom(new InternetAddress(fromEmail));
        message.setRecipients(MimeMessage.RecipientType.TO, InternetAddress.parse(toEmail));
        message.setSubject("Yubus Profile Updated");
        message.setContent(buildProfileUpdatedHtml(name, email, mobile), "text/html; charset=UTF-8");

        Transport.send(message);
    }

    public static void sendBookingConfirmationEmail(
            String toEmail, String bookingId, String passengerName, String passengerMobile, String passengerEmail, String from, String to,
            String busName, String departureTime, String journeyDate, String seats,
            String paymentMethod, int originalAmount, int discountAmount, int paidAmount,
            String transactionId) throws MessagingException {
        Session session = createSession();
        String fromEmail = getFromEmail();

        MimeMessage message = new MimeMessage(session);
        message.setFrom(new InternetAddress(fromEmail));
        message.setRecipients(MimeMessage.RecipientType.TO, InternetAddress.parse(toEmail));
        message.setSubject("Yubus Booking Confirmation - " + bookingId);
        message.setContent(buildBookingConfirmationHtml(passengerName, passengerMobile, passengerEmail, bookingId, from, to, busName, journeyDate, departureTime, seats, paymentMethod, originalAmount, discountAmount, paidAmount, transactionId), "text/html; charset=UTF-8");

        Transport.send(message);
    }

    public static void sendTicketCancellationEmail(String toEmail, String name, String bookingId, String fromCity, String toCity, String busName, String departureTime, String journeyDate, String seats, String paymentMethod, int amount, int discountAmount, String transactionId) throws MessagingException {
        Session session = createSession();
        String fromEmail = getFromEmail();

        MimeMessage message = new MimeMessage(session);
        message.setFrom(new InternetAddress(fromEmail));
        message.setRecipients(MimeMessage.RecipientType.TO, InternetAddress.parse(toEmail));
        message.setSubject("Yubus - Ticket Cancellation Notice - " + bookingId);
        message.setContent(buildCancellationHtml(name, bookingId, fromCity, toCity, busName, journeyDate, departureTime, seats, paymentMethod, amount, discountAmount, transactionId), "text/html; charset=UTF-8");
        Transport.send(message);
    }

    public static void sendForgotPasswordEmail(String toEmail, String name, String password) throws MessagingException {
        Session session = createSession();
        String fromEmail = getFromEmail();

        MimeMessage message = new MimeMessage(session);
        message.setFrom(new InternetAddress(fromEmail));
        message.setRecipients(MimeMessage.RecipientType.TO, InternetAddress.parse(toEmail));
        message.setSubject("Yubus - Password Reset");
        message.setText("Dear " + name + ",\n\nYour new password is: " + password + "\n\nPlease change it after login.");
        Transport.send(message);
    }

    public static void sendRefundSuccessEmail(String toEmail, String name, String bookingId, String from, String to, String busName, String departureTime, String journeyDate, String seats, String paymentMethod, int amount, String transactionId) throws MessagingException {
        Session session = createSession();
        String fromEmail = getFromEmail();

        MimeMessage message = new MimeMessage(session);
        message.setFrom(new InternetAddress(fromEmail));
        message.setRecipients(MimeMessage.RecipientType.TO, InternetAddress.parse(toEmail));
        message.setSubject("Yubus - Refund Processed - " + bookingId);
        message.setContent(buildRefundHtml(name, bookingId, from, to, busName, journeyDate, departureTime, seats, paymentMethod, amount, transactionId), "text/html; charset=UTF-8");
        Transport.send(message);
    }

    private static String buildProfileUpdatedHtml(String name, String email, String mobile) {
        return "<html><body style=\"margin:0;padding:24px;background:" + EMAIL_PAGE_BACKGROUND + ";font-family:'Segoe UI',Arial,Helvetica,sans-serif;color:#1b1b1b;\">"
                + "<div style=\"max-width:640px;margin:0 auto;background:#ffffff;border-radius:18px;padding:24px;box-shadow:0 8px 20px rgba(28,89,132,0.08);\">"
                + "<h2 style=\"margin:0 0 12px;color:#1f4e9a;\">Profile Updated</h2>"
                + "<p style=\"margin:0 0 8px;\">Name: " + escapeHtml(name) + "</p>"
                + "<p style=\"margin:0 0 8px;\">Email: " + escapeHtml(email) + "</p>"
                + "<p style=\"margin:0;\">Mobile: " + escapeHtml(mobile) + "</p>"
                + "</div></body></html>";
    }

    private static String buildCancellationHtml(String passengerName, String bookingId, String from, String to, String busName,
            String journeyDate, String departureTime, String seats, String paymentMethod, int amount, int discountAmount, String transactionId) {
        String safePassenger = escapeHtml(passengerName);
        String safeBookingId = escapeHtml(bookingId);
        String safeFrom = escapeHtml(from);
        String safeTo = escapeHtml(to);
        String safeBus = escapeHtml(busName);
        String safeJourneyDate = escapeHtml(journeyDate);
        String safeDeparture = escapeHtml(departureTime);
        String safeSeats = escapeHtml(seats);
        String safePayment = escapeHtml(paymentMethod);
        String safeTransaction = escapeHtml(transactionId);

        StringBuilder html = new StringBuilder();
        html.append("<html><body style=\"margin:0;padding:0;background:").append(EMAIL_PAGE_BACKGROUND).append(";font-family:'Segoe UI',Arial,Helvetica,sans-serif;color:#1b1b1b;\">");
        html.append("<div style=\"max-width:640px;margin:20px auto;padding:18px;\">");
        html.append("<div style=\"font-size:26px;font-weight:700;color:#d25b5b;letter-spacing:0.4px;\">Yubus</div>");
        html.append("<div style=\"color:#6b6b6b;margin-top:4px;font-size:14px;\">Your cancelled ticket details.</div>");
        html.append("<div style=\"margin-top:16px;background:#ffffff;border-radius:22px;box-shadow:0 8px 20px rgba(60,27,27,0.08);overflow:hidden;\">");
        html.append(colourLine("#e24b4b", "#f39c3d", "#f39c3d"));
        html.append("<div style=\"padding:22px 24px;\">");
        html.append("<div style=\"color:#8a8a8a;font-size:13px;margin-bottom:6px;\">Hello ").append(safePassenger).append(",</div>");
        html.append("<div style=\"font-size:26px;font-weight:800;margin-bottom:12px;\">Ticket Cancelled</div>");
        html.append("<div style=\"display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;\">");
        html.append("<div style=\"font-weight:700;color:#b13434;\">").append(safeBookingId).append("</div>");
        html.append("<div style=\"padding:6px 14px;border-radius:999px;background:#fde9e9;color:#b13434;font-weight:700;font-size:12px;letter-spacing:0.5px;\">CANCELLED</div>");
        html.append("</div>");
        html.append("<div style=\"margin-top:12px;font-size:18px;font-weight:700;\">").append(safeFrom).append(" -> ").append(safeTo).append("</div>");
        html.append("<div style=\"margin-top:4px;color:#6c6c6c;font-size:14px;\">").append(safeBus).append("</div>");
        html.append("<table style=\"width:100%;border-collapse:separate;border-spacing:12px 12px;margin-top:14px;\">");
        html.append("<tr>");
        html.append(cardCell("JOURNEY DATE", safeJourneyDate, "#f9fafb", "#1f1f1f"));
        html.append(cardCell("SEAT NUMBER", safeSeats, "#f9fafb", "#1f1f1f"));
        html.append("</tr>");
        html.append("<tr>");
        html.append(cardCell("DEPARTURE TIME", safeDeparture, "#f9fafb", "#1f1f1f"));
        html.append(cardCell("TRANSACTION TYPE", safePayment, "#f9fafb", "#1f1f1f"));
        html.append("</tr>");
        html.append("<tr>");
        html.append(cardCell("PAID AMOUNT", "Rs." + amount, "#fff3f2", "#b13434"));
        html.append(cardCell("DISCOUNT", "Rs." + discountAmount, "#ecfaf1", "#1f7a4b"));
        html.append("</tr>");
        html.append("<tr>");
        html.append(wideCardCell("TRANSACTION ID", safeTransaction));
        html.append("</tr>");
        html.append("</table>");
        html.append("</div>");
        html.append("</div>");
        html.append("</div>");
        html.append("</body></html>");
        return html.toString();
    }

    private static String buildRefundHtml(String passengerName, String bookingId, String from, String to, String busName,
            String journeyDate, String departureTime, String seats, String paymentMethod, int refundAmount, String transactionId) {
        String safePassenger = escapeHtml(passengerName);
        String safeBookingId = escapeHtml(bookingId);
        String safeFrom = escapeHtml(from);
        String safeTo = escapeHtml(to);
        String safeBus = escapeHtml(busName);
        String safeJourneyDate = escapeHtml(journeyDate);
        String safeDeparture = escapeHtml(departureTime);
        String safeSeats = escapeHtml(seats);
        String safePayment = escapeHtml(paymentMethod);
        String safeTransaction = escapeHtml(transactionId);

        StringBuilder html = new StringBuilder();
        html.append("<html><body style=\"margin:0;padding:0;background:").append(EMAIL_PAGE_BACKGROUND).append(";font-family:'Segoe UI',Arial,Helvetica,sans-serif;color:#1b1b1b;\">");
        html.append("<div style=\"max-width:640px;margin:20px auto;padding:18px;\">");
        html.append("<div style=\"font-size:26px;font-weight:700;color:#d25b5b;letter-spacing:0.4px;\">Yubus</div>");
        html.append("<div style=\"color:#6b6b6b;margin-top:4px;font-size:14px;\">Your refund has been processed.</div>");
        html.append("<div style=\"margin-top:16px;background:#ffffff;border-radius:22px;box-shadow:0 8px 20px rgba(60,27,27,0.08);overflow:hidden;\">");
        html.append(colourLine("#2a5bd7", "#6db7ff", "#9bd3ff"));
        html.append("<div style=\"padding:22px 24px;\">");
        html.append("<div style=\"color:#8a8a8a;font-size:13px;margin-bottom:6px;\">Hello ").append(safePassenger).append(",</div>");
        html.append("<div style=\"font-size:26px;font-weight:800;margin-bottom:12px;\">Refund Successful</div>");
        html.append("<div style=\"display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;\">");
        html.append("<div style=\"font-weight:700;color:#1f4e9a;\">").append(safeBookingId).append("</div>");
        html.append("<div style=\"padding:6px 14px;border-radius:999px;background:#e9f1ff;color:#1f4e9a;font-weight:700;font-size:12px;letter-spacing:0.5px;\">REFUNDED</div>");
        html.append("</div>");
        html.append("<div style=\"margin-top:12px;font-size:18px;font-weight:700;\">").append(safeFrom).append(" -> ").append(safeTo).append("</div>");
        html.append("<div style=\"margin-top:4px;color:#6c6c6c;font-size:14px;\">").append(safeBus).append("</div>");
        html.append("<table style=\"width:100%;border-collapse:separate;border-spacing:12px 12px;margin-top:14px;\">");
        html.append("<tr>");
        html.append(cardCell("JOURNEY DATE", safeJourneyDate, "#f9fafb", "#1f1f1f"));
        html.append(cardCell("SEAT NUMBER", safeSeats, "#f9fafb", "#1f1f1f"));
        html.append("</tr>");
        html.append("<tr>");
        html.append(cardCell("DEPARTURE TIME", safeDeparture, "#f9fafb", "#1f1f1f"));
        html.append(cardCell("TRANSACTION TYPE", safePayment, "#f9fafb", "#1f1f1f"));
        html.append("</tr>");
        html.append("<tr>");
        html.append(cardCell("REFUND AMOUNT", "Rs." + refundAmount, "#edf4ff", "#1f4e9a"));
        html.append(cardCell("PASSENGER", safePassenger, "#f9fafb", "#1f1f1f"));
        html.append("</tr>");
        html.append("<tr>");
        html.append(wideCardCell("TRANSACTION ID", safeTransaction));
        html.append("</tr>");
        html.append("</table>");
        html.append("</div>");
        html.append("</div>");
        html.append("</div>");
        html.append("</body></html>");
        return html.toString();
    }

    private static String buildBookingConfirmationHtml(String passengerName, String passengerMobile, String passengerEmail, String bookingId, String from, String to, String busName,
            String journeyDate, String departureTime, String seats, String paymentMethod, int originalAmount, int discountAmount,
            int paidAmount, String transactionId) {
        String safePassenger = escapeHtml(passengerName);
        String safeBookingId = escapeHtml(bookingId);
        String safeFrom = escapeHtml(from);
        String safeTo = escapeHtml(to);
        String safeBus = escapeHtml(busName);
        String safeJourneyDate = escapeHtml(journeyDate);
        String safeDeparture = escapeHtml(departureTime);
        String safeSeats = escapeHtml(seats);
        String safePayment = escapeHtml(paymentMethod);
        String safeTransaction = escapeHtml(transactionId);

        StringBuilder html = new StringBuilder();
        html.append("<html><body style=\"margin:0;padding:0;background:").append(EMAIL_PAGE_BACKGROUND).append(";font-family:'Segoe UI',Arial,Helvetica,sans-serif;color:#1b1b1b;\">");
        html.append("<div style=\"max-width:640px;margin:20px auto;padding:18px;\">");
        html.append("<div style=\"font-size:26px;font-weight:700;color:#d25b5b;letter-spacing:0.4px;\">Yubus</div>");
        html.append("<div style=\"color:#6b6b6b;margin-top:4px;font-size:14px;\">Your booking card is ready.</div>");
        html.append("<div style=\"margin-top:16px;background:#ffffff;border-radius:22px;box-shadow:0 8px 20px rgba(60,27,27,0.08);overflow:hidden;\">");
        html.append(colourLine("#e24b4b", "#f39c3d", "#f39c3d"));
        html.append("<div style=\"padding:22px 24px;\">");
        html.append("<div style=\"color:#8a8a8a;font-size:13px;margin-bottom:6px;\">Hello ").append(safePassenger).append(",</div>");
        html.append("<div style=\"font-size:26px;font-weight:800;margin-bottom:12px;\">Booking Details</div>");
        html.append("<div style=\"display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;\">");
        html.append("<div style=\"font-weight:700;color:#b13434;\">").append(safeBookingId).append("</div>");
        html.append("<div style=\"padding:6px 14px;border-radius:999px;background:#e9f8ef;color:#1f7a4b;font-weight:700;font-size:12px;letter-spacing:0.5px;\">BOOKED</div>");
        html.append("</div>");
        html.append("<div style=\"margin-top:12px;font-size:18px;font-weight:700;\">").append(safeFrom).append(" -> ").append(safeTo).append("</div>");
        html.append("<div style=\"margin-top:4px;color:#6c6c6c;font-size:14px;\">").append(safeBus).append("</div>");
        html.append("<table style=\"width:100%;border-collapse:separate;border-spacing:12px 12px;margin-top:14px;\">");
        html.append("<tr>");
        html.append(cardCell("JOURNEY DATE", safeJourneyDate, "#f9fafb", "#1f1f1f"));
        html.append(cardCell("SEAT NUMBER", safeSeats, "#f9fafb", "#1f1f1f"));
        html.append("</tr>");
        html.append("<tr>");
        html.append(cardCell("DEPARTURE TIME", safeDeparture, "#f9fafb", "#1f1f1f"));
        html.append(cardCell("TRANSACTION TYPE", safePayment, "#f9fafb", "#1f1f1f"));
        html.append("</tr>");
        html.append("<tr>");
        html.append(cardCell("ORIGINAL AMOUNT", "Rs." + originalAmount, "#fff3f2", "#b13434"));
        html.append(cardCell("DISCOUNT", "Rs." + discountAmount, "#ecfaf1", "#1f7a4b"));
        html.append("</tr>");
        html.append("<tr>");
        html.append(cardCell("PAID AMOUNT", "Rs." + paidAmount, "#edf4ff", "#1f4e9a"));
        html.append(cardCell("PASSENGER", safePassenger, "#f9fafb", "#1f1f1f"));
        html.append("</tr>");
        html.append("<tr>");
        html.append(wideCardCell("TRANSACTION ID", safeTransaction));
        html.append("</tr>");
        html.append("</table>");
        html.append("</div>");
        html.append("</div>");
        html.append("</div>");
        html.append("</body></html>");
        return html.toString();
    }

    private static String cardCell(String label, String value, String background, String valueColor) {
        StringBuilder cell = new StringBuilder();
        cell.append("<td style=\"width:50%;padding:14px 16px;background:").append(background).append(";border-radius:14px;\">");
        cell.append("<div style=\"font-size:11px;color:#8c8c8c;text-transform:uppercase;letter-spacing:1px;font-weight:700;\">").append(label).append("</div>");
        cell.append("<div style=\"margin-top:6px;font-size:16px;font-weight:800;color:").append(valueColor).append(";\">").append(value).append("</div>");
        cell.append("</td>");
        return cell.toString();
    }

    private static String wideCardCell(String label, String value) {
        StringBuilder cell = new StringBuilder();
        cell.append("<td colspan=\"2\" style=\"padding:14px 16px;background:#f9fafb;border-radius:14px;\">");
        cell.append("<div style=\"font-size:11px;color:#8c8c8c;text-transform:uppercase;letter-spacing:1px;font-weight:700;\">").append(label).append("</div>");
        cell.append("<div style=\"margin-top:6px;font-size:14px;font-weight:700;word-break:break-all;\">").append(value).append("</div>");
        cell.append("</td>");
        return cell.toString();
    }

    private static String colourLine(String start, String middle, String end) {
        return "<div style=\"height:4px;background-color:" + start +
                ";background-image:linear-gradient(90deg," + start + "," + middle + "," + end + ");" +
                "border-radius:18px 18px 0 0;\"></div>";
    }

    private static String escapeHtml(String value) {
        if (value == null) {
            return "";
        }
        return value.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }

    private static Session createSession() throws MessagingException {
        String smtpUser = Config.getSmtpUser();
        String smtpPassword = Config.getSmtpPassword();

        if (smtpUser.isEmpty() || smtpPassword.isEmpty()) {
            throw new MessagingException("SMTP_USER or SMTP_APP_PASSWORD is not configured");
        }

        Properties props = new Properties();
        props.put("mail.smtp.host", Config.getSmtpHost());
        props.put("mail.smtp.port", Config.getSmtpPort());
        props.put("mail.smtp.auth", "true");
        props.put("mail.smtp.starttls.enable", "true");

        return Session.getInstance(props, new Authenticator() {
            @Override
            protected PasswordAuthentication getPasswordAuthentication() {
                return new PasswordAuthentication(smtpUser, smtpPassword);
            }
        });
    }

    private static String getFromEmail() {
        return Config.getSmtpFrom();
    }

    public static boolean isSmtpConfigured() {
        String user = Config.getSmtpUser();
        String pass = Config.getSmtpPassword();
        return !user.isEmpty() && !pass.isEmpty() && !hasPlaceholderSmtpConfig();
    }

    public static boolean isEmailDebugEnabled() {
        return Config.isEmailDebug();
    }

    public static boolean isEmailDeliveryEnabled() {
        return isSmtpConfigured() && !isEmailDebugEnabled();
    }

    public static boolean shouldSkipEmail() {
        return isEmailDebugEnabled() || hasPlaceholderSmtpConfig();
    }

    public static boolean hasPlaceholderSmtpConfig() {
        String user = Config.getSmtpUser();
        String pass = Config.getSmtpPassword();
        return isPlaceholderValue(user) || isPlaceholderValue(pass);
    }

    public static String smtpMissingMessage() {
        return "SMTP is not configured (or still using placeholder values). " +
                "Set SMTP_USER and SMTP_APP_PASSWORD in backend-java/smtp.env.bat " +
                "or enable OTP_DEBUG/EMAIL_DEBUG for local testing.";
    }

    public static String smtpFailureMessage(Exception e) {
        String message = e == null ? "" : String.valueOf(e.getMessage()).trim();
        if (message.contains("Username and Password not accepted") || message.contains("BadCredentials")) {
            return "SMTP login failed. Gmail rejected the SMTP username or app password. " +
                    "Generate a fresh Gmail App Password, update backend-java/smtp.env.bat, and restart the backend.";
        }
        if (message.contains("Could not connect to SMTP host") || message.contains("ConnectException")) {
            return "SMTP connection failed. Check internet access, SMTP host/port, and firewall settings.";
        }
        if (message.isBlank()) {
            return "Failed to send OTP email.";
        }
        return "Failed to send OTP email: " + message.replace('\n', ' ').replace('\r', ' ');
    }

    public static boolean isOtpDebugEnabled() {
        return Config.isOtpDebug();
    }

    private static boolean isPlaceholderValue(String value) {
        if (value == null) return false;
        String v = value.trim();
        return "your.email@gmail.com".equalsIgnoreCase(v)
                || "your_gmail_app_password".equals(v)
                || "REPLACE_WITH_NEW_APP_PASSWORD".equalsIgnoreCase(v)
                || "REPLACE_ME".equalsIgnoreCase(v);
    }
}
