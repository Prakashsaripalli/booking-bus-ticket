package com.booking.backend.utils;

import jakarta.mail.Authenticator;
import jakarta.mail.Message;
import jakarta.mail.MessagingException;
import jakarta.mail.PasswordAuthentication;
import jakarta.mail.Session;
import jakarta.mail.Transport;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;

import java.util.Properties;

public final class EmailUtil {

    private static final String SMTP_HOST = "smtp.gmail.com";
    private static final String SMTP_PORT = "587";
    private static final String ENV_SMTP_USER = "SMTP_USER";
    private static final String ENV_SMTP_APP_PASSWORD = "SMTP_APP_PASSWORD";
    private static final String ENV_SMTP_FROM = "SMTP_FROM";
    private static final String ENV_OTP_DEBUG = "OTP_DEBUG";
    private static final String ENV_EMAIL_DEBUG = "EMAIL_DEBUG";

    private EmailUtil() {
    }

    public static void sendOtpEmail(String toEmail, String otp) throws MessagingException {
        Session session = createSession();
        String fromEmail = getFromEmail();

        Message message = new MimeMessage(session);
        message.setFrom(new InternetAddress(fromEmail));
        message.setRecipients(Message.RecipientType.TO, InternetAddress.parse(toEmail));
        message.setSubject("Yubus OTP Verification");
        message.setText("Your Yubus OTP is: " + otp + "\n\nValid for 5 minutes.");

        Transport.send(message);
    }

    public static void sendProfileUpdatedEmail(
            String toEmail,
            String name,
            String email,
            String mobile
    ) throws MessagingException {
        Session session = createSession();
        String fromEmail = getFromEmail();

        Message message = new MimeMessage(session);
        message.setFrom(new InternetAddress(fromEmail));
        message.setRecipients(Message.RecipientType.TO, InternetAddress.parse(toEmail));
        message.setSubject("Yubus Profile Updated");
        message.setContent(buildProfileUpdatedHtml(name, email, mobile), "text/html; charset=UTF-8");

        Transport.send(message);
    }

    public static void sendBookingConfirmationEmail(
            String toEmail,
            String bookingId,
            String passengerName,
            String from,
            String to,
            String busName,
            String departureTime,
            String journeyDate,
            String seats,
            String paymentMethod,
            int originalAmount,
            int discountAmount,
            int paidAmount,
            String transactionId
    ) throws MessagingException {
        Session session = createSession();
        String fromEmail = getFromEmail();

        Message message = new MimeMessage(session);
        message.setFrom(new InternetAddress(fromEmail));
        message.setRecipients(Message.RecipientType.TO, InternetAddress.parse(toEmail));
        message.setSubject("Yubus Booking Confirmation - " + bookingId);
        message.setContent(buildBookingConfirmationHtml(
                passengerName,
                bookingId,
                from,
                to,
                busName,
                journeyDate,
                departureTime,
                seats,
                paymentMethod,
                originalAmount,
                discountAmount,
                paidAmount,
                transactionId
        ), "text/html; charset=UTF-8");

        Transport.send(message);
    }

    public static void sendTicketCancellationEmail(
            String toEmail,
            String passengerName,
            String bookingId,
            String from,
            String to,
            String busName,
            String departureTime,
            String journeyDate,
            String seats,
            String paymentMethod,
            int amount,
            int discountAmount,
            String transactionId
    ) throws MessagingException {
        Session session = createSession();
        String fromEmail = getFromEmail();

        Message message = new MimeMessage(session);
        message.setFrom(new InternetAddress(fromEmail));
        message.setRecipients(Message.RecipientType.TO, InternetAddress.parse(toEmail));
        message.setSubject("Yubus Ticket Cancelled - " + safe(bookingId));
        message.setContent(buildTicketCancellationHtml(
                passengerName,
                bookingId,
                from,
                to,
                busName,
                departureTime,
                journeyDate,
                seats,
                paymentMethod,
                amount,
                discountAmount,
                transactionId
        ), "text/html; charset=UTF-8");

        Transport.send(message);
    }

    public static void sendForgotPasswordEmail(
            String toEmail,
            String name,
            String password
    ) throws MessagingException {
        Session session = createSession();
        String fromEmail = getFromEmail();

        Message message = new MimeMessage(session);
        message.setFrom(new InternetAddress(fromEmail));
        message.setRecipients(Message.RecipientType.TO, InternetAddress.parse(toEmail));
        message.setSubject("Yubus Password Information");
        message.setContent(buildForgotPasswordHtml(name, password), "text/html; charset=UTF-8");

        Transport.send(message);
    }

    public static void sendRefundSuccessEmail(
            String toEmail,
            String passengerName,
            String bookingId,
            String from,
            String to,
            String busName,
            String departureTime,
            String journeyDate,
            String seats,
            String paymentMethod,
            int refundAmount,
            String transactionId
    ) throws MessagingException {
        Session session = createSession();
        String fromEmail = getFromEmail();

        Message message = new MimeMessage(session);
        message.setFrom(new InternetAddress(fromEmail));
        message.setRecipients(Message.RecipientType.TO, InternetAddress.parse(toEmail));
        message.setSubject("Yubus Refund Successful - " + safe(bookingId));
        message.setContent(buildRefundSuccessHtml(
                passengerName,
                bookingId,
                from,
                to,
                busName,
                departureTime,
                journeyDate,
                seats,
                paymentMethod,
                refundAmount,
                transactionId
        ), "text/html; charset=UTF-8");

        Transport.send(message);
    }

    private static Session createSession() throws MessagingException {
        String smtpUser = requireEnv(ENV_SMTP_USER);
        String smtpPassword = requireEnv(ENV_SMTP_APP_PASSWORD);

        Properties props = new Properties();
        props.put("mail.smtp.host", SMTP_HOST);
        props.put("mail.smtp.port", SMTP_PORT);
        props.put("mail.smtp.auth", "true");
        props.put("mail.smtp.starttls.enable", "true");

        Session session = Session.getInstance(props, new Authenticator() {
            @Override
            protected PasswordAuthentication getPasswordAuthentication() {
                return new PasswordAuthentication(smtpUser, smtpPassword);
            }
        });
        return session;
    }

    private static String getFromEmail() {
        String smtpUser = System.getenv(ENV_SMTP_USER);
        return System.getenv().getOrDefault(ENV_SMTP_FROM, smtpUser);
    }

    public static boolean isSmtpConfigured() {
        return !isBlankEnv(ENV_SMTP_USER) && !isBlankEnv(ENV_SMTP_APP_PASSWORD);
    }

    public static boolean isOtpDebugEnabled() {
        return isTruthyEnv(ENV_OTP_DEBUG);
    }

    public static boolean isEmailDebugEnabled() {
        return isTruthyEnv(ENV_EMAIL_DEBUG);
    }

    public static String smtpMissingMessage() {
        return "SMTP is not configured. Set SMTP_USER and SMTP_APP_PASSWORD.";
    }

    private static String requireEnv(String name) throws MessagingException {
        String value = System.getenv(name);
        if (value == null || value.isBlank()) {
            throw new MessagingException(name + " is not configured");
        }
        return value.trim();
    }

    private static boolean isBlankEnv(String name) {
        String value = System.getenv(name);
        return value == null || value.isBlank();
    }

    private static boolean isTruthyEnv(String name) {
        return "true".equalsIgnoreCase(System.getenv().getOrDefault(name, "false"));
    }

    private static String buildBookingConfirmationHtml(
            String passengerName,
            String bookingId,
            String from,
            String to,
            String busName,
            String journeyDate,
            String departureTime,
            String seats,
            String paymentMethod,
            int originalAmount,
            int discountAmount,
            int paidAmount,
            String transactionId
    ) {
        String greetingName = safe(passengerName).equals("-") ? "Customer" : safe(passengerName);
        String route = safe(from) + " -> " + safe(to);

        return """
                <html>
                <body style="margin:0;padding:24px;background:#f5f7fb;font-family:Arial,sans-serif;color:#1f2937;">
                  <table role="presentation" width="100%%" cellspacing="0" cellpadding="0" style="max-width:720px;margin:0 auto;">
                    <tr>
                      <td style="padding:0 0 18px 0;">
                        <div style="font-size:28px;font-weight:800;color:#d94f45;letter-spacing:0.4px;">Yubus</div>
                        <div style="font-size:14px;color:#6b7280;margin-top:6px;">Your booking card is ready.</div>
                      </td>
                    </tr>
                    <tr>
                      <td style="background:#ffffff;border:1px solid #ececf1;border-radius:18px;box-shadow:0 14px 30px rgba(16,24,40,0.07);overflow:hidden;">
                        <div style="height:4px;background:linear-gradient(90deg,#b7184a,#f97316,#f4b400);line-height:4px;font-size:4px;">&nbsp;</div>
                        <table role="presentation" width="100%%" cellspacing="0" cellpadding="0" style="padding:0;margin:0;">
                          <tr>
                            <td style="padding:22px 24px 10px 24px;">
                              <div style="font-size:16px;color:#6b7280;margin-bottom:10px;">Hello %s,</div>
                              <div style="font-size:32px;font-weight:800;line-height:1.2;color:#111827;margin-bottom:16px;">Booking Details</div>
                              <table role="presentation" width="100%%" cellspacing="0" cellpadding="0">
                                <tr>
                                  <td style="font-weight:700;color:#b7184a;letter-spacing:0.04em;font-size:14px;">%s</td>
                                  <td align="right">%s</td>
                                </tr>
                              </table>
                              <div style="margin:14px 0 0 0;">
                                <div style="font-size:18px;font-weight:800;color:#172033;line-height:1.35;">%s</div>
                                <div style="font-size:14px;font-weight:600;color:#667085;margin-top:4px;">%s</div>
                              </div>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding:0 24px 24px 24px;">
                              <table role="presentation" width="100%%" cellspacing="0" cellpadding="0">
                                <tr>
                                  <td width="50%%" style="padding:0 6px 12px 0;vertical-align:top;">%s</td>
                                  <td width="50%%" style="padding:0 0 12px 6px;vertical-align:top;">%s</td>
                                </tr>
                                <tr>
                                  <td width="50%%" style="padding:0 6px 12px 0;vertical-align:top;">%s</td>
                                  <td width="50%%" style="padding:0 0 12px 6px;vertical-align:top;">%s</td>
                                </tr>
                                <tr>
                                  <td width="50%%" style="padding:0 6px 12px 0;vertical-align:top;">%s</td>
                                  <td width="50%%" style="padding:0 0 12px 6px;vertical-align:top;">%s</td>
                                </tr>
                                <tr>
                                  <td colspan="2" style="padding:0 0 12px 0;vertical-align:top;">%s</td>
                                </tr>
                                <tr>
                                  <td width="50%%" style="padding:0 6px 0 0;vertical-align:top;">%s</td>
                                  <td width="50%%" style="padding:0 0 0 6px;vertical-align:top;">%s</td>
                                </tr>
                              </table>
                              <div style="margin-top:20px;padding-top:16px;border-top:1px solid #f0e5e9;font-size:13px;line-height:1.7;color:#6b7280;">
                                Thank you for booking with Yubus.
                              </div>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </body>
                </html>
                """.formatted(
                escapeHtml(greetingName),
                escapeHtml(safe(bookingId)),
                buildStatusBadge(),
                escapeHtml(route),
                escapeHtml(safe(busName)),
                buildDetailCard("Journey Date", safe(journeyDate), "default", false),
                buildDetailCard("Seat Number", safe(seats), "default", false),
                buildDetailCard("Departure Time", safe(departureTime), "default", false),
                buildDetailCard("Transaction Type", safe(paymentMethod), "default", false),
                buildDetailCard("Original Amount", formatMoney(originalAmount), "strong", false),
                buildDetailCard("Discount", formatMoney(discountAmount), "accent", false),
                buildDetailCard("Transaction ID", safe(transactionId), "default", true),
                buildDetailCard("Paid Amount", formatMoney(paidAmount), "strong", false),
                buildDetailCard("Passenger", safe(passengerName), "default", false)
        );
    }

    private static String buildTicketCancellationHtml(
            String passengerName,
            String bookingId,
            String from,
            String to,
            String busName,
            String departureTime,
            String journeyDate,
            String seats,
            String paymentMethod,
            int amount,
            int discountAmount,
            String transactionId
    ) {
        String greetingName = safe(passengerName).equals("-") ? "Customer" : safe(passengerName);
        String route = safe(from) + " -> " + safe(to);

        return """
                <html>
                <body style="margin:0;padding:24px;background:#f8fafc;font-family:Arial,sans-serif;color:#1f2937;">
                  <table role="presentation" width="100%%" cellspacing="0" cellpadding="0" style="max-width:720px;margin:0 auto;">
                    <tr>
                      <td style="padding:0 0 18px 0;">
                        <div style="font-size:28px;font-weight:800;color:#d94f45;">Yubus</div>
                        <div style="font-size:14px;color:#6b7280;margin-top:6px;">Your cancelled ticket details.</div>
                      </td>
                    </tr>
                    <tr>
                      <td style="background:#ffffff;border:1px solid #ececf1;border-radius:18px;box-shadow:0 14px 30px rgba(16,24,40,0.07);overflow:hidden;">
                        <div style="height:4px;background:linear-gradient(90deg,#b42343,#ef4444,#f59e0b);line-height:4px;font-size:4px;">&nbsp;</div>
                        <table role="presentation" width="100%%" cellspacing="0" cellpadding="0" style="padding:0;margin:0;">
                          <tr>
                            <td style="padding:22px 24px 10px 24px;">
                              <div style="font-size:16px;color:#6b7280;margin-bottom:10px;">Hello %s,</div>
                              <div style="font-size:32px;font-weight:800;line-height:1.2;color:#111827;margin-bottom:16px;">Ticket Cancelled</div>
                              <table role="presentation" width="100%%" cellspacing="0" cellpadding="0">
                                <tr>
                                  <td style="font-weight:700;color:#b42343;letter-spacing:0.04em;font-size:14px;">%s</td>
                                  <td align="right">%s</td>
                                </tr>
                              </table>
                              <div style="margin:14px 0 0 0;">
                                <div style="font-size:18px;font-weight:800;color:#172033;line-height:1.35;">%s</div>
                                <div style="font-size:14px;font-weight:600;color:#667085;margin-top:4px;">%s</div>
                              </div>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding:0 24px 24px 24px;">
                              <table role="presentation" width="100%%" cellspacing="0" cellpadding="0">
                                <tr>
                                  <td width="50%%" style="padding:0 6px 12px 0;vertical-align:top;">%s</td>
                                  <td width="50%%" style="padding:0 0 12px 6px;vertical-align:top;">%s</td>
                                </tr>
                                <tr>
                                  <td width="50%%" style="padding:0 6px 12px 0;vertical-align:top;">%s</td>
                                  <td width="50%%" style="padding:0 0 12px 6px;vertical-align:top;">%s</td>
                                </tr>
                                <tr>
                                  <td width="50%%" style="padding:0 6px 12px 0;vertical-align:top;">%s</td>
                                  <td width="50%%" style="padding:0 0 12px 6px;vertical-align:top;">%s</td>
                                </tr>
                                <tr>
                                  <td colspan="2" style="padding:0 0 12px 0;vertical-align:top;">%s</td>
                                </tr>
                              </table>
                              <div style="margin-top:20px;padding-top:16px;border-top:1px solid #f0e5e9;font-size:13px;line-height:1.7;color:#6b7280;">
                                This ticket is now marked as cancelled in your Yubus account.
                              </div>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </body>
                </html>
                """.formatted(
                escapeHtml(greetingName),
                escapeHtml(safe(bookingId)),
                buildCancelledStatusBadge(),
                escapeHtml(route),
                escapeHtml(safe(busName)),
                buildDetailCard("Journey Date", safe(journeyDate), "default", false),
                buildDetailCard("Seat Number", safe(seats), "default", false),
                buildDetailCard("Departure Time", safe(departureTime), "default", false),
                buildDetailCard("Transaction Type", safe(paymentMethod), "default", false),
                buildDetailCard("Paid Amount", formatMoney(amount), "strong", false),
                buildDetailCard("Discount", formatMoney(discountAmount), "accent", false),
                buildDetailCard("Transaction ID", safe(transactionId), "default", true)
        );
    }

    private static String buildProfileUpdatedHtml(String name, String email, String mobile) {
        return """
                <html>
                <body style="margin:0;padding:24px;background:#f8fafc;font-family:Arial,sans-serif;color:#1f2937;">
                  <table role="presentation" width="100%%" cellspacing="0" cellpadding="0" style="max-width:640px;margin:0 auto;">
                    <tr>
                      <td style="padding:0 0 18px 0;">
                        <div style="font-size:28px;font-weight:800;color:#d94f45;">Yubus</div>
                        <div style="font-size:14px;color:#6b7280;margin-top:6px;">Your profile details were updated.</div>
                      </td>
                    </tr>
                    <tr>
                      <td style="background:#ffffff;border:1px solid #ececf1;border-radius:18px;box-shadow:0 14px 30px rgba(16,24,40,0.07);overflow:hidden;">
                        <div style="height:4px;background:linear-gradient(90deg,#b7184a,#f97316,#f4b400);line-height:4px;font-size:4px;">&nbsp;</div>
                        <div style="padding:22px 24px 24px 24px;">
                          <div style="font-size:16px;color:#6b7280;margin-bottom:10px;">Hello %s,</div>
                          <div style="font-size:32px;font-weight:800;color:#111827;margin-bottom:16px;">Profile Updated</div>
                          <div style="display:block;border-radius:14px;padding:12px 14px;background:#ffffff;border:1px solid #edf0f5;margin-bottom:12px;">
                            <div style="font-size:11px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;color:#98a2b3;margin-bottom:8px;">Name</div>
                            <div style="font-size:18px;font-weight:800;color:#101828;line-height:1.4;">%s</div>
                          </div>
                          <div style="display:block;border-radius:14px;padding:12px 14px;background:#ffffff;border:1px solid #edf0f5;margin-bottom:12px;">
                            <div style="font-size:11px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;color:#98a2b3;margin-bottom:8px;">Email</div>
                            <div style="font-size:18px;font-weight:800;color:#101828;line-height:1.4;word-break:break-word;overflow-wrap:anywhere;">%s</div>
                          </div>
                          <div style="display:block;border-radius:14px;padding:12px 14px;background:linear-gradient(180deg,#fff5f3,#fff0ee);border:1px solid #f4d2ca;">
                            <div style="font-size:11px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;color:#98a2b3;margin-bottom:8px;">Mobile Number</div>
                            <div style="font-size:18px;font-weight:800;color:#101828;line-height:1.4;">%s</div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  </table>
                </body>
                </html>
                """.formatted(
                escapeHtml(safe(name).equals("-") ? "Customer" : safe(name)),
                escapeHtml(safe(name)),
                escapeHtml(safe(email)),
                escapeHtml(safe(mobile))
        );
    }

    private static String buildForgotPasswordHtml(String name, String password) {
        return """
                <html>
                <body style="margin:0;padding:24px;background:#f8fafc;font-family:Arial,sans-serif;color:#1f2937;">
                  <table role="presentation" width="100%%" cellspacing="0" cellpadding="0" style="max-width:640px;margin:0 auto;">
                    <tr>
                      <td style="padding:0 0 18px 0;">
                        <div style="font-size:28px;font-weight:800;color:#d94f45;">Yubus</div>
                        <div style="font-size:14px;color:#6b7280;margin-top:6px;">Your requested password information.</div>
                      </td>
                    </tr>
                    <tr>
                      <td style="background:#ffffff;border:1px solid #ececf1;border-radius:18px;box-shadow:0 14px 30px rgba(16,24,40,0.07);overflow:hidden;">
                        <div style="height:4px;background:linear-gradient(90deg,#1f3da9,#3b82f6,#38bdf8);line-height:4px;font-size:4px;">&nbsp;</div>
                        <div style="padding:22px 24px 24px 24px;">
                          <div style="font-size:16px;color:#6b7280;margin-bottom:10px;">Hello %s,</div>
                          <div style="font-size:32px;font-weight:800;color:#111827;margin-bottom:16px;">Password Details</div>
                          <div style="display:block;border-radius:14px;padding:12px 14px;background:#ffffff;border:1px solid #edf0f5;">
                            <div style="font-size:11px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;color:#98a2b3;margin-bottom:8px;">Password</div>
                            <div style="font-size:20px;font-weight:800;color:#101828;line-height:1.4;word-break:break-word;overflow-wrap:anywhere;">%s</div>
                          </div>
                          <div style="margin-top:16px;font-size:13px;line-height:1.7;color:#6b7280;">
                            If you did not request this email, please update your password and review your account access.
                          </div>
                        </div>
                      </td>
                    </tr>
                  </table>
                </body>
                </html>
                """.formatted(
                escapeHtml(safe(name).equals("-") ? "Customer" : safe(name)),
                escapeHtml(safe(password))
        );
    }

    private static String buildRefundSuccessHtml(
            String passengerName,
            String bookingId,
            String from,
            String to,
            String busName,
            String departureTime,
            String journeyDate,
            String seats,
            String paymentMethod,
            int refundAmount,
            String transactionId
    ) {
        String greetingName = safe(passengerName).equals("-") ? "Customer" : safe(passengerName);
        String route = safe(from) + " -> " + safe(to);

        return """
                <html>
                <body style="margin:0;padding:24px;background:#f8fafc;font-family:Arial,sans-serif;color:#1f2937;">
                  <table role="presentation" width="100%%" cellspacing="0" cellpadding="0" style="max-width:720px;margin:0 auto;">
                    <tr>
                      <td style="padding:0 0 18px 0;">
                        <div style="font-size:28px;font-weight:800;color:#d94f45;">Yubus</div>
                        <div style="font-size:14px;color:#6b7280;margin-top:6px;">Your refund has been processed.</div>
                      </td>
                    </tr>
                    <tr>
                      <td style="background:#ffffff;border:1px solid #ececf1;border-radius:18px;box-shadow:0 14px 30px rgba(16,24,40,0.07);overflow:hidden;">
                        <div style="height:4px;background:linear-gradient(90deg,#1f3da9,#3b82f6,#38bdf8);line-height:4px;font-size:4px;">&nbsp;</div>
                        <table role="presentation" width="100%%" cellspacing="0" cellpadding="0" style="padding:0;margin:0;">
                          <tr>
                            <td style="padding:22px 24px 10px 24px;">
                              <div style="font-size:16px;color:#6b7280;margin-bottom:10px;">Hello %s,</div>
                              <div style="font-size:32px;font-weight:800;line-height:1.2;color:#111827;margin-bottom:16px;">Refund Successful</div>
                              <table role="presentation" width="100%%" cellspacing="0" cellpadding="0">
                                <tr>
                                  <td style="font-weight:700;color:#1f3da9;letter-spacing:0.04em;font-size:14px;">%s</td>
                                  <td align="right">%s</td>
                                </tr>
                              </table>
                              <div style="margin:14px 0 0 0;">
                                <div style="font-size:18px;font-weight:800;color:#172033;line-height:1.35;">%s</div>
                                <div style="font-size:14px;font-weight:600;color:#667085;margin-top:4px;">%s</div>
                              </div>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding:0 24px 24px 24px;">
                              <table role="presentation" width="100%%" cellspacing="0" cellpadding="0">
                                <tr>
                                  <td width="50%%" style="padding:0 6px 12px 0;vertical-align:top;">%s</td>
                                  <td width="50%%" style="padding:0 0 12px 6px;vertical-align:top;">%s</td>
                                </tr>
                                <tr>
                                  <td width="50%%" style="padding:0 6px 12px 0;vertical-align:top;">%s</td>
                                  <td width="50%%" style="padding:0 0 12px 6px;vertical-align:top;">%s</td>
                                </tr>
                                <tr>
                                  <td colspan="2" style="padding:0 0 12px 0;vertical-align:top;">%s</td>
                                </tr>
                              </table>
                              <div style="margin-top:20px;padding-top:16px;border-top:1px solid #f0e5e9;font-size:13px;line-height:1.7;color:#6b7280;">
                                The refund amount has been marked successful for this ticket.
                              </div>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </body>
                </html>
                """.formatted(
                escapeHtml(greetingName),
                escapeHtml(safe(bookingId)),
                buildRefundedStatusBadge(),
                escapeHtml(route),
                escapeHtml(safe(busName)),
                buildDetailCard("Journey Date", safe(journeyDate), "default", false),
                buildDetailCard("Seat Number", safe(seats), "default", false),
                buildDetailCard("Departure Time", safe(departureTime), "default", false),
                buildDetailCard("Transaction Type", safe(paymentMethod), "default", false),
                buildDetailCard("Refund Amount", formatMoney(refundAmount), "refund", false),
                buildDetailCard("Transaction ID", safe(transactionId), "default", true)
        );
    }

    private static String buildStatusBadge() {
        return """
                <span style="display:inline-block;padding:4px 10px;border-radius:999px;background:#e7f8ef;color:#0f8a4b;font-size:12px;font-weight:700;letter-spacing:0.03em;text-transform:uppercase;">
                  Booked
                </span>
                """;
    }

    private static String buildCancelledStatusBadge() {
        return """
                <span style="display:inline-block;padding:4px 10px;border-radius:999px;background:#ffe6ea;color:#b42343;font-size:12px;font-weight:700;letter-spacing:0.03em;text-transform:uppercase;">
                  Cancelled
                </span>
                """;
    }

    private static String buildRefundedStatusBadge() {
        return """
                <span style="display:inline-block;padding:4px 10px;border-radius:999px;background:#eef4ff;color:#1f3da9;font-size:12px;font-weight:700;letter-spacing:0.03em;text-transform:uppercase;">
                  Refunded
                </span>
                """;
    }

    private static String buildDetailCard(String label, String value, String variant, boolean wideValue) {
        String backgroundStyle = switch (variant) {
            case "strong" -> "background:linear-gradient(180deg,#fff5f3,#fff0ee);border:1px solid #f4d2ca;";
            case "accent" -> "background:linear-gradient(180deg,#f2fff7,#ebfbf1);border:1px solid #cbead6;";
            case "refund" -> "background:linear-gradient(180deg,#eef4ff,#e8f0ff);border:1px solid #cfdcff;";
            default -> "background:#ffffff;border:1px solid #edf0f5;";
        };
        String valueStyle = wideValue
                ? "font-size:16px;font-weight:700;color:#111827;line-height:1.5;word-break:break-word;overflow-wrap:anywhere;"
                : ("accent".equals(variant)
                ? "font-size:18px;font-weight:800;color:#137a45;line-height:1.4;"
                : ("refund".equals(variant)
                ? "font-size:18px;font-weight:800;color:#1f3da9;line-height:1.4;"
                : "font-size:18px;font-weight:800;color:#101828;line-height:1.4;"));

        return """
                <div style="display:block;border-radius:14px;padding:12px 14px;min-height:84px;box-sizing:border-box;%s">
                  <div style="font-size:11px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;color:#98a2b3;margin-bottom:8px;">%s</div>
                  <div style="%s">%s</div>
                </div>
                """.formatted(
                backgroundStyle,
                escapeHtml(label),
                valueStyle,
                escapeHtml(value)
        );
    }

    private static String formatMoney(int amount) {
        return "Rs." + amount;
    }

    private static String safe(String value) {
        return value == null || value.isBlank() ? "-" : value.trim();
    }

    private static String escapeHtml(String value) {
        return safe(value)
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }
}
