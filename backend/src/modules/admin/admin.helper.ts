import jwt, { SignOptions } from 'jsonwebtoken';
import * as InterFace from './admin.interface'
import AdminModel from './admin.model'
import { config } from '../../config';
import MailService from '../../services/mail/service.mail'
import { randomBytes, createCipheriv, createDecipheriv } from "crypto";
import bcrypt from "bcrypt";

class AdminHelper {
  private algorithm: string
  private secretKey: Buffer
  private iv: Buffer

  constructor() {
    this.algorithm = "aes-256-cbc"; // AES algorithm
    this.secretKey = randomBytes(32); // 32 bytes key for AES-256
    this.iv = randomBytes(16); // Initialization vector
  }

  /**
   * Creates a JSON Web Token (JWT) for a given payload.
   *
   * @param payload - The payload to encode within the token, typically containing user information.
   * @param expiresIn - Optional. The duration for which the token is valid. Defaults to '2h'.
   * @returns A string representing the signed JWT.
   */
  createToken(payload: InterFace.Payload, expiresIn: string = '2h'): string {
    // console.log("config", config)
    const options: SignOptions = {
      expiresIn, // Set token expiration time (default is 2 hour)
    };
    const token: string = jwt.sign(payload, config.JWT_SECRET, options);
    return token;
  }

  /**
   * Verifies a JSON Web Token (JWT) and decodes its payload.
   *
   * @param token - The JWT to be verified and decoded.
   * @returns The decoded payload if the token is valid, or a string message indicating an invalid or expired token.
   */
  verifyToken(token: string): InterFace.Payload | string {
    try {
      const decoded = jwt.verify(token, config.JWT_SECRET) as InterFace.Payload;
      return decoded; // If the token is valid, return the decoded payload
    } catch (error) {
      return 'Invalid or expired token'; // Return error message if token is invalid or expired
    }
  }

  /**
   * @function syncTablesInter
   * @description Syncs the Admin table schema with the current database schema
   */
  public async syncTablesInter() {
    try {
      // Ensure the database connection is established
      console.log("Database connection has been established successfully.");
      // Sync only the Admin table
      await AdminModel.sync({ alter: true }); // Sync changes to the Admin table schema
      console.log("Admin table synced successfully.");
    } catch (error) {
      console.error("Error syncing the Admin table:", error);
    } finally {
      // Close the database connection
      console.log("Database syncing closed.");
    }
  }

  /**
   * @function sendEmail
   * @description SMTP function to send an email
   */
  public async sendEmail(to: string, otp: string) {
    try {
      // Directly send the email with the subject, text, and HTML template
      await MailService.sendMail(
        to,
        "Forgot Password | Admin",
        '',
        this.getForgotPasswordTemplate(otp)
      );
    } catch (error) {
      console.error('Error sending email:', error);
    }
  }

  /**
   * @function getForgotPasswordTemplate
   * @description HTML function for password template
   */
  public getForgotPasswordTemplate(otp: string) {
    return `
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body {
                font-family: Arial, sans-serif;
                background-color: #f4f4f4;
                margin: 0;
                padding: 0;
              }
              .container {
                width: 100%;
                max-width: 600px;
                margin: 20px auto;
                background-color: #ffffff;
                padding: 20px;
                border-radius: 8px;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
                text-align: center;
              }
              h2 {
                color: #333333;
                font-size: 24px;
                margin-bottom: 20px;
              }
              p {
                color: #666666;
                font-size: 16px;
                line-height: 1.5;
              }
              .temp-password {
                font-size: 18px;
                font-weight: bold;
                color: #007bff;
                margin: 20px 0;
              }
              .footer {
                text-align: center;
                font-size: 12px;
                color: #aaaaaa;
                margin-top: 40px;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <h2>Forgot Your Password?</h2>
              <p>We received a request to reset your password. If you didn’t make this request, you can safely ignore this email.</p>
              <p>To reset your password, please use the one time password provided below:</p>
              <div class="temp-password">${otp}</div>
            </div>
            <div class="footer">
              <p>&copy; 2024 Harbour Vault. All rights reserved.</p>
            </div>
          </body>
        </html>
        `
  }

  /**
   * @function generateOtp
   * @returns generate OTP password
   */
  public generateOtp(): string {
    const otp = Math.floor(100000 + Math.random() * 900000); // Generates a 6-digit number
    return otp.toString();
  }


  /**
   * @function encryptOtp
   * @returns encrypt OTP password
   */
  public encryptOtp(otp: string): { encryptedOtp: string; iv: string } {
    const cipher = createCipheriv(this.algorithm, this.secretKey, this.iv);
    let encrypted = cipher.update(otp, "utf8", "hex");
    encrypted += cipher.final("hex");
    return { encryptedOtp: encrypted, iv: this.iv.toString("hex") };
  }

  /**
   * @function decryptOtp
   * @returns decrypted OTP password
   */
  public decryptOtp(encryptedOtp: string, ivHex: string) {
    try {
      const decipher = createDecipheriv(this.algorithm, this.secretKey, Buffer.from(ivHex, "hex"));
      let decrypted = decipher.update(encryptedOtp, "hex", "utf8");
      decrypted += decipher.final("utf8");
      return decrypted;
    } catch (error) {
      return null
    }
  }

  // Function to encrypt a password using bcrypt
  /**
   * @function encryptPassword
   * @description Function to encrypt a password using bcrypt
   * @returns decrypted OTP password
   */
  public async encryptPassword(password: string): Promise<string> {
    const saltRounds = 10; // You can adjust the cost factor
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    return hashedPassword;
  }

  /**
   * Generate a token for OTP verification.
   * @param email - The email address to include in the token.
   * @returns The generated token.
   */
  public generateOtpToken(email: string): string {
    const payload = {
      email,
      exp: Math.floor(Date.now() / 1000) + 5 * 60, // Set expiry time to 5 minutes
    };
    return jwt.sign(payload, config.JWT_SECRET);
  }

  /**
   * Verify the OTP token.
   * @param token - The token to verify.
   * @returns The decoded payload if valid, or throws an error if invalid or expired.
   */
  public verifyOtpToken(token: string): { email: string } {
    try {
      const decoded = jwt.verify(token, config.JWT_SECRET) as { email: string };
      return decoded;
    } catch (error) {
      throw new Error("Invalid or expired token");
    }
  }
}

export default AdminHelper