import com.booking.backend.dao.PaymentDao;
import com.booking.backend.utils.EmailUtil;

public class DebugPayment {
    public static void main(String[] args) {
        try {
            var dao = new PaymentDao();
            var payment = dao.save("Test User", "9876543210", "test@example.com", 100, "AB1234567890123456789012");
            System.out.println("PAYMENT_SAVE_OK " + payment.getPaymentId());
        } catch (Exception e) {
            System.out.println("PAYMENT_SAVE_FAIL");
            e.printStackTrace(System.out);
        }

        try {
            EmailUtil.sendBookingConfirmationEmail(
                    "test@example.com",
                    "BKTEST1234",
                    "Test User",
                    "Hyderabad",
                    "Vijayawada",
                    "Test Bus",
                    "10:00 AM",
                    "2026-03-10",
                    "A1",
                    "UPI",
                    100,
                    0,
                    100,
                    "AB1234567890123456789012"
            );
            System.out.println("EMAIL_OK");
        } catch (Exception e) {
            System.out.println("EMAIL_FAIL");
            e.printStackTrace(System.out);
        }
    }
}
