import AdminModel from "./admin.model";

class AdminRepository {

    // Find admin by email, including 2FA-related, maintenanceMode fields 
    public async findByEmail(email: string): Promise<any> {
        return await AdminModel.findOne({
            where: { email: email },
            attributes: ['email', 'password', 'isTwoFAEnabled', 'twoFASecret', 'maintenanceMode', 'otpCode', 'ivHex' ],  // Include 2FA-related fields
        });
    }

    // Save admin information (e.g., after enabling or disabling 2FA)
    public async save(admin: any): Promise<any> {
        return await AdminModel.update({...admin.dataValues}, {
            where: { email: admin.email },
        });
    }

}

export default new AdminRepository();
