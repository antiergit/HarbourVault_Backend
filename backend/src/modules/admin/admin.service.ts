import { ADMIN_VALIDATIONS, AUTH } from "./admin.enum";
import AdminHelper from "./admin.helper";
import adminRepository from "./admin.repository";
import speakeasy from 'speakeasy';
import qrcode from 'qrcode';
import bcrypt from "bcrypt";
import { Parser } from 'json2csv';
import { CoinsModel, TrnxHistoryModel, UsersModel, WalletModel } from "../../models";

class AdminService extends AdminHelper {
    private bcryptSalt = 10

    /**
     * Authenticates an admin user using their credentials and optionally verifies two-factor authentication.
     * 
     * @param credentials - An object containing the admin's login credentials.
     * @param credentials.email - The email address of the admin.
     * @param credentials.password - The password of the admin.
     * @param credentials.twoFACode - The two-factor authentication code, if 2FA is enabled.
     * 
     * @returns An object containing a token if authentication is successful and a flag indicating if 2FA is enabled.
     * @throws Will throw an error if credentials are missing or invalid, or if the 2FA code is incorrect.
     */
    public async login(credentials: { [key: string]: string }) {
        const { email, password, twoFACode } = credentials;

        if (!email || !password) throw AUTH.CREDENTIALS_REQUIRED;

        const admin = await adminRepository.findByEmail(email);
        if (!admin) throw AUTH.INVALID_CREDENTIALS;

        // Validate password
        await this.validatePassword(password, admin.password, true);

        const { twoFASecret, isTwoFAEnabled } = admin;

        // Handle 2FA validation
        if (isTwoFAEnabled) {
            if (!twoFACode) return { token: null, isTwoFAEnabled };

            if (!this.verifyTwoFACode(twoFASecret, twoFACode)) {
                throw AUTH.INVALID_2FA_CODE;
            }
        }

        return { token: this.createToken({ email, password }), isTwoFAEnabled };
    }


    /**
     * Sets up two-factor authentication (2FA) for an admin user by generating a secret and a QR code.
     * 
     * @param adminEmail - The email address of the admin for whom 2FA is being set up.
     * 
     * @returns An object containing the QR code URL and the 2FA secret in base32 format.
     * @throws Will throw an error if the admin with the provided email does not exist.
     */
    public async setupTwoFA(adminEmail: string) {
        const admin = await adminRepository.findByEmail(adminEmail);
        if (!admin) throw AUTH.INVALID_CREDENTIALS;

        // Generate a 2FA secret
        const secret: any = speakeasy.generateSecret({ name: `MyApp (${adminEmail})` });

        // Generate a QR code that the user can scan
        const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url);

        // Save the 2FA secret in the database (ensure to save it securely)
        admin.twoFASecret = secret.base32;

        // admin.isTwoFAEnabled = true;
        await adminRepository.save(admin);
        return { qrCodeUrl, secret: secret.base32 };  // Return the QR code URL and secret to setup 2FA
    }

    /**
     * Disables two-factor authentication (2FA) for an admin user.
     *
     * @param adminEmail - The email address of the admin for whom 2FA is being disabled.
     * @returns An object containing a message indicating that 2FA has been successfully disabled.
     * @throws Will throw an error if the admin with the provided email does not exist.
     */
    public async disableTwoFA(adminEmail: string): Promise<{ message: string }> {
        const admin = await adminRepository.findByEmail(adminEmail);
        if (!admin) throw AUTH.INVALID_CREDENTIALS;

        // Disable 2FA by removing the secret and updating the status
        admin.twoFASecret = null;
        admin.isTwoFAEnabled = false;
        await adminRepository.save(admin);

        return { message: "Two-factor authentication has been disabled." };
    }

    // Helper function to verify 2FA code
    /**
     * Verifies the two-factor authentication (2FA) code provided by the admin.
     *
     * @param secret - The base32-encoded secret generated for the admin's 2FA.
     * @param code - The 2FA code entered by the admin.
     *
     * @returns A boolean value indicating whether the provided 2FA code is valid.
     * @throws Will throw an error if the secret or code is invalid.
     */
    public verifyTwoFACode(secret: string, code: string): boolean {
        return speakeasy.totp.verify({
            secret: secret,
            encoding: 'base32',
            token: code
        });
    }


    /**
     * Retrieves the settings for an admin user, including maintenance mode status and two-factor authentication (2FA) status.
     * If 2FA is not enabled, it also sets up 2FA and returns the necessary information.
     *
     * @param user - An object containing the user's information.
     * @param user.email - The email address of the admin user.
     *
     * @returns An object containing the admin's settings:
     *          - maintenanceMode: A boolean indicating whether maintenance mode is enabled.
     *          - isTwoFAEnabled: A boolean indicating whether 2FA is enabled for the admin.
     *          - qrCodeUrl: (Only if 2FA is not enabled) A string containing the URL for the 2FA QR code.
     *          - secret: (Only if 2FA is not enabled) A string containing the 2FA secret in base32 format.
     *
     * @throws Will throw an error if the admin with the provided email does not exist.
     */
    public async settings(user: any) {
        const admin = await adminRepository.findByEmail(user.email);
        const { maintenanceMode, isTwoFAEnabled } = admin;
        if (!isTwoFAEnabled) {
            const qrInfo = await this.setupTwoFA(user.email);
            return { maintenanceMode, isTwoFAEnabled, ...qrInfo };
        }
        return { maintenanceMode, isTwoFAEnabled };
    }

    /**
     * Updates the settings for an admin user, including maintenance mode status, two-factor authentication (2FA) status, and password.
     *
     * @param user - An object containing the user's information.
     * @param user.email - The email address of the admin user.
     **/
    public async updateSettings(user: any, data: any) {
        if (!data || Object.keys(data).length === 0) throw 'Field data Required';
        const admin = await adminRepository.findByEmail(user.email);
        const { isTwoFAEnabled, twoFASecret, password } = admin;

        // Validate and toggle 2FA
        if (data?.password && data?.twoFACode) {
            await this.validatePassword(data.password, password);
            this.validateTwoFA(twoFASecret, data.twoFACode);
            admin.isTwoFAEnabled = !isTwoFAEnabled;
            if (!admin.isTwoFAEnabled) {
                await this.disableTwoFA(user.email);
            }
            await adminRepository.save(admin);
            return '2faEnabled successfully updated'
        }

        // Update maintenance mode
        if ('maintenanceMode' in data) {
            admin.maintenanceMode = Boolean(data.maintenanceMode);
            await adminRepository.save(admin);
            return `maintenanceMode ${admin.maintenanceMode ? 'enabled' : 'disabled'} successfully`;
        }

        // Update password 
        if (data?.oldPassword && data?.newPassword) {
            await this.validatePassword(data.oldPassword, password);
            // Hash the new password before saving it to the database
            admin.password = await bcrypt.hash(data.newPassword, this.bcryptSalt);
            await adminRepository.save(admin);
            return 'password changed successfully';
        }
    }

    /**
     * Validates the provided password against the stored password hash.
     * 
     * @param inputPassword - The password provided by the user for validation.
     * @param storedPassword - The hashed password stored in the database.
     * @param cred - A flag to determine which error to throw if validation fails. Defaults to false.
     * @throws {AUTH.INVALID_CREDENTIALS} If validation fails and cred is true.
     * @throws {AUTH.INVALID_PASSWORD} If validation fails and cred is false.
     * @returns {Promise<void>} Resolves if the password is valid, otherwise throws an error.
     */
    private async validatePassword(inputPassword: string, storedPassword: string, cred = false) {
        const isPasswordValid = await bcrypt.compare(inputPassword, storedPassword);
        if (!isPasswordValid) throw cred ? AUTH.INVALID_CREDENTIALS : AUTH.INVALID_PASSWORD;
    }

    /**
     * Validates the 2FA code provided by the admin.
     * 
     * @param secret - The base32-encoded secret generated for the admin's 2FA.
     * @param code - The 2FA code entered by the admin.
     **/
    private validateTwoFA(secret: string, code: string) {
        if (!this.verifyTwoFACode(secret, code)) throw AUTH.INVALID_2FA_CODE;
    }


    /**
     * forgotPassword .
     * 
     * @param forgotPassword - code sent to admin email.
     * @param code - email address of admin.
     **/
    public async forgotPassword(user: { email: string }) {
        if (!user.email) throw 'email Required';
        const admin = await adminRepository.findByEmail(user.email);
        if (!admin) throw AUTH.INVALID_EMAIL
        const otp = this.generateOtp()
        await this.sendEmail(user.email, otp);
        const { encryptedOtp, iv: ivHex } = this.encryptOtp(otp)
        console.log("encryptedOtp", encryptedOtp)
        admin.otpCode = encryptedOtp;
        admin.ivHex = ivHex;
        await adminRepository.save(admin);
    }


    /**
     * verifyOtp .
     * 
     * @param verifyOtp - code sent to admin email.
     * @param code - email address of admin.
     **/
    public async verifyOtp({ otp, email }: { otp: string, email: string }) {
        if (!email) throw AUTH.EMAIL_REQUIRED;
        if (!otp) throw AUTH.OPT_REQUIRED;
        const admin = await adminRepository.findByEmail(email);
        if (!admin) throw AUTH.INVALID_EMAIL
        console.log(" admin.ivHex", admin.ivHex);
        const decodeOTP = this.decryptOtp(admin.otpCode, admin.ivHex);
        if (!decodeOTP || decodeOTP !== otp) throw AUTH.OPT_INVALID
        admin.otpCode = null;
        admin.ivHex = null;
        const token = this.generateOtpToken(email)
        return { token };
    }

    /**
     * resetPassword .
     * 
     * @param resetPassword - password , token.
     * @param code - email address of admin.
     **/
    public async resetPassword({ password, token }: { password: string, token: string }) {
        if (!password) throw AUTH.PASSWORD_REQUIRED;
        if (!token) throw AUTH.TOKEN_REQUIRED;
        const { email } = this.verifyOtpToken(token)
        const admin = await adminRepository.findByEmail(email);
        if (!admin) throw AUTH.INVALID_EMAIL
        admin.password = await bcrypt.hash(password, this.bcryptSalt);
        await adminRepository.save(admin);
    }

    /**
     * userList .
     * 
     * @param pagination - limit , offset.
     * @param code - userList.
     **/
    public async userList({ limit, offset }: any, filters: any) {
        const { order, user_name } = filters
        const whereCondition: any = {}
        if (user_name) whereCondition["user_name"] = user_name
        const orderType = order === 'ASC' ? 'ASC' : 'DESC';
        const { count, rows }: any = await UsersModel.findAndCountAll({
            attributes: ['user_id', 'user_name', 'createdAt'],
            limit,
            offset,
            where: whereCondition, // Pass the built where condition
            order: [['createdAt', orderType]] // Order by 'createdAt' in descending order
        });
        return { count, users: rows }
    }

    /**
   * exportUserList .
   * 
   * @param pagination - limit , offset.
   * @param code - exportUserList.
   **/
    public async exportUserList(filters: any) {
        const { order, user_name } = filters
        const whereCondition: any = {}
        if (user_name) whereCondition["user_name"] = user_name
        const orderType = order === 'ASC' ? 'ASC' : 'DESC';
        const data: any = await UsersModel.findAll({
            attributes: ['user_id', 'user_name', 'device_id', 'createdAt'],
            where: whereCondition, // Pass the built where condition
            order: [['createdAt', orderType]], // Order by 'createdAt' in descending order
            raw: true, // This ensures the returned data is plain JSON
        });
        // Convert data to CSV
        const json2csvParser = new Parser();
        return json2csvParser.parse(data);
    }

    /**
    * userWalletList .
    * 
    * @param id - user id.
    **/
    public async userWalletList(param: any) {
        const { id } = param
        if (!id) throw ADMIN_VALIDATIONS.ID_REQUIRED;
        const user: any = await UsersModel.findOne({ where: { user_id: id } });
        if (!user) throw AUTH.INVALID_EMAIL;
        const wallets: any = await WalletModel.findAll({ where: { user_id: id } });
        if (wallets.length > 0) {
            for (const wallet of wallets) {
                const coin: any = await CoinsModel.findOne({ where: { coin_id: wallet.coin_id } })
                wallet.dataValues.coins = {}
                wallet.dataValues.coins.coin_name = coin?.coin_name || null;
                wallet.dataValues.coins.coin_image = coin?.coin_image || null;
            }
        }
        return wallets;
    }

    /**
    * userTransactionList .
    * 
    * @param pagination , limit, offset
    * @param filters
    **/
    public async userTransactionList({ limit, offset }: any, filters: any) {
        const { order, type, status, from_address, to_address, hash } = filters
        const whereCondition: any = {}
        const orderType = order === 'ASC' ? 'ASC' : 'DESC';
        if (type) whereCondition["type"] = type;
        if (status) whereCondition["status"] = status;
        if (from_address) whereCondition["from_adrs"] = from_address;
        if (to_address) whereCondition["to_adrs"] = to_address;
        if (hash) whereCondition["tx_id"] = hash;
        const transactions: any = await TrnxHistoryModel.findAndCountAll({
            limit,
            offset,
            where: whereCondition,  // Pass the built where condition
            order: [['created_at', orderType]]
        });
        if (transactions.rows.length > 0) {
            for (const wallet of transactions.rows) {
                const coin: any = await CoinsModel.findOne({ where: { coin_id: wallet.coin_id } })
                wallet.dataValues.coins = {}
                wallet.dataValues.coins.coin_name = coin?.coin_name || null;
                wallet.dataValues.coins.coin_image = coin?.coin_image || null;
            }
        }
        return transactions;
    }


    /**
    * exportTransactionList .
    * 
    * @param filters
    **/
    public async exportTransactionList(filters: any) {
        const { order, type, status, from_address, to_address, hash } = filters
        const whereCondition: any = {}
        const orderType = order === 'ASC' ? 'ASC' : 'DESC';
        if (type) whereCondition["type"] = type;
        if (status) whereCondition["status"] = status;
        if (from_address) whereCondition["from_adrs"] = from_address;
        if (to_address) whereCondition["to_adrs"] = to_address;
        if (hash) whereCondition["tx_id"] = hash;
        const transactions: any = await TrnxHistoryModel.findAll({
            attributes : {
                exclude: ['is_maker'] // Add the field names you want to exclude here, e.g., ['fieldName1', 'fieldName2']
            },
            where: whereCondition,  // Pass the built where condition
            order: [['created_at', orderType]],
            raw: true, // This ensures the returned data is plain JSON
        });
        if (transactions.length > 0) {
            for (const wallet of transactions) {
                const coin: any = await CoinsModel.findOne({ where: { coin_id: wallet.coin_id } })
                wallet.coin = coin?.coin_name || null
            }
        }
         // Convert data to CSV
         const json2csvParser = new Parser();
         return json2csvParser.parse(transactions);
    }


    /**
     * dashboard data .
     **/
    public async dashboardData() {
        const totalUsers = await UsersModel.count();
        const totalWallets = await WalletModel.count();
        const totalTransactions = await TrnxHistoryModel.count();
        const totalCoins = await CoinsModel.count();
        return { totalUsers, totalWallets, totalTransactions, totalCoins };
    }

}
export default new AdminService()