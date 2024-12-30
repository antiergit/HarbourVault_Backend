import nodemailer from 'nodemailer';
import { config } from "../../config";

class MailService {
    private transporter;
    private defaultMailOptions;

    constructor() {
        const { USER, PASSWORD, FROM, HOST, PORT } = config.SMTP_CONFIG;

        this.transporter = nodemailer.createTransport({
            host: HOST,
            port: PORT || 587,
            secure: PORT === 465, // Automatically determine if SSL should be used
            auth: {
                user: USER,
                pass: PASSWORD,
            },
        });

        this.defaultMailOptions = {
            from: FROM,
        };
    }

    /**
     * Sends an email using the configured SMTP transporter.
     * 
     * @param to - The email address of the recipient.
     * @param subject - The subject line of the email.
     * @param text - The plain text content of the email.
     * @param html - Optional. The HTML content of the email. If provided, the email will be sent as a multipart message.
     * @returns A promise that resolves when the email is sent successfully, or rejects if there's an error.
     * @throws Will throw an error if the email sending process fails.
     */
    public async sendMail(to: string, subject: string, text: string, html?: string): Promise<void> {
        try {
            const mailOptions = {
                ...this.defaultMailOptions,
                to,
                subject,
                text,
                html,
            };

            await this.transporter.sendMail(mailOptions);
            console.log(`Email sent to ${to}`);
        } catch (error: any) {
            console.error(`Failed to send email: ${error.message}`);
            throw error;
        }
    }
}

export default new MailService();
