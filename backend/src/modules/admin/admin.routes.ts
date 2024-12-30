import express from "express";
import adminController from "./admin.controller";
import * as InterFace from './admin.interface'
import validateJWT, { paginationMiddleware, rateLimiter } from "./admin.middleware";


class AdminRoutes implements InterFace.ControllerInterface {
    public path = "/admin";
    public router = express.Router();

    constructor() {
        this.initializeRoutes();
        adminController.syncAdminTable()
    }

    public initializeRoutes() {
        this.router.post(`${this.path}/login`,
            adminController.login),

        this.router.post(`${this.path}/forgot-password`,
            rateLimiter(),
            adminController.forgotPassword);

        this.router.post(`${this.path}/verify-otp`,
            rateLimiter(),
            adminController.verifyOtp);

        this.router.post(`${this.path}/reset-password`,
            rateLimiter(),
            adminController.resetPassword);

        this.router.get(`${this.path}/users-list`,
            validateJWT,
            paginationMiddleware,
            adminController.userList);

        this.router.get(`${this.path}/export-users-list`,
            validateJWT,
            adminController.exportUserlist);

        this.router.get(`${this.path}/export-transactions-list`,
            validateJWT,
            adminController.exportTransactionList);

        this.router.get(`${this.path}/user-wallets/:id`,
            validateJWT,
            adminController.userWalletList);

        this.router.get(`${this.path}/transactions-list`,
            validateJWT,
            paginationMiddleware,
            adminController.userTransactionsList);
    
        
        this.router.get(`${this.path}/dashboard-data`,
            validateJWT,
            adminController.dashboardData);
        

        this.router.get(`${this.path}/settings`,
            validateJWT,
            adminController.settings);
        
        this.router.patch(`${this.path}/settings`,
            validateJWT,
            adminController.updateSettings);
    }
    

}

export default AdminRoutes;
