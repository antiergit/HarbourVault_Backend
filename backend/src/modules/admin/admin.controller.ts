import { Request, Response, } from 'express'; // Import Request and Response from express
import AdminHelper from './admin.helper';
import adminResponse from './admin.response';
import { API_RESPONSE, AUTH, STATUS_CODE } from './admin.enum';
import adminService from './admin.service';
import * as InterFace from './admin.interface'

const { sendSuccess, sendError, createResponse } = adminResponse;
class AdminController extends AdminHelper {

    /**
    * @api syncAdminTable 
    * @dev syncing admin table
    */
    public async syncAdminTable(): Promise<void> {
        await this.syncTablesInter();
    }

    /**
    * @api login 
    * @dev login as admin
    */
    public async login(req: Request, res: Response) {
        try {
            const response = await adminService.login(req.body)
            return sendSuccess(res, createResponse(STATUS_CODE.OK, AUTH.SUCCESS, response));
        } catch (error) {
            console.log(error);
            return sendError(res, { message: String(error) });
        }
    }

    /**
    * @api login 
    * @dev login as admin
    */
    public async forgotPassword(req: Request, res: Response) {
        try {
            const response = await adminService.forgotPassword(req.body)
            return sendSuccess(res, createResponse(STATUS_CODE.OK, API_RESPONSE.EMAIL_SENT, response));
        } catch (error) {
            console.log(error);
            return sendError(res, { message: String(error) });
        }
    }


    /**
    * @api verifyOTP 
    * @dev verify Otp
    */
    public async verifyOtp(req: Request, res: Response) {
        try {
            const response = await adminService.verifyOtp(req.body)
            return sendSuccess(res, createResponse(STATUS_CODE.OK, AUTH.OPT_VERIFIED, response));
        } catch (error) {
            console.log(error);
            return sendError(res, { message: String(error) });
        }
    }

    /**
    * @api resetPassword 
    * @dev reset admin Password api
    */
    public async resetPassword(req: Request, res: Response) {
        try {
            const response = await adminService.resetPassword(req.body)
            return sendSuccess(res, createResponse(STATUS_CODE.OK, AUTH.PASSWORD_RESET, response));
        } catch (error) {
            console.log(error);
            return sendError(res, { message: String(error) });
        }
    }

    /**
    * @api userlist 
    * @dev fetch user list api
    */
    public async userList(req: InterFace.AuthRequest, res: Response) {
        try {
            const response = await adminService.userList(req.pagination, req.query)
            return sendSuccess(res, createResponse(STATUS_CODE.OK, API_RESPONSE.SUCCESS, response));
        } catch (error) {
            console.log(error);
            return sendError(res, { message: String(error) });
        }
    }

    /**
    * @api exportUserlist 
    * @dev export user list api
    */
     public async exportUserlist(req: InterFace.AuthRequest, res: Response) {
        try {
            const response = await adminService.exportUserList(req.query);
            // Set headers and send CSV
            res.header('Content-Type', 'text/csv');
            res.attachment('userList.csv');
            res.send(response); // Send the CSV response directly
        } catch (error) {
            console.log(error);
            return sendError(res, { message: String(error) });
        }
    }

    /**
    * @api exportUserlist 
    * @dev export user list api
    */
    public async exportTransactionList(req: InterFace.AuthRequest, res: Response) {
        try {
            const response = await adminService.exportTransactionList(req.query);
            // Set headers and send CSV
            res.header('Content-Type', 'text/csv');
            res.attachment('transactionList.csv');
            res.send(response); // Send the CSV response directly
        } catch (error) {
            console.log(error);
            return sendError(res, { message: String(error) });
        }
    }

    /**
    * @api userWalletList
    * @dev fetch user wallet list api
    */
    public async userWalletList(req: InterFace.AuthRequest, res: Response) {
        try {
            console.log("req.params", req.params)
            const response = await adminService.userWalletList(req.params)
            return sendSuccess(res, createResponse(STATUS_CODE.OK, API_RESPONSE.SUCCESS, response));
        } catch (error) {
            console.log(error);
            return sendError(res, { message: String(error) });
        }
    }

    /**
    * @api userTransactionsList
    * @dev fetch user transactions list api
    */
     public async userTransactionsList(req: InterFace.AuthRequest, res: Response) {
        try {
            const response = await adminService.userTransactionList(req.pagination , req.query)
            return sendSuccess(res, createResponse(STATUS_CODE.OK, API_RESPONSE.SUCCESS, response));
        } catch (error) {
            console.log(error);
            return sendError(res, { message: String(error) });
        }
    }

    /**
    * @api dashboardData
    * @dev fetch all dashboard data
    */
      public async dashboardData(req: InterFace.AuthRequest, res: Response) {
        try {
            const response = await adminService.dashboardData()
            return sendSuccess(res, createResponse(STATUS_CODE.OK, API_RESPONSE.SUCCESS, response));
        } catch (error) {
            console.log(error);
            return sendError(res, { message: String(error) });
        }
    }


    /**
    * @api settings 
    * @dev settings as admin
    */
      public async settings(req: InterFace.AuthRequest, res: Response) {
        try {
            const response = await adminService.settings(req.user)
            return sendSuccess(res, createResponse(STATUS_CODE.OK, API_RESPONSE.SUCCESS, response));
        } catch (error) {
            console.log(error);
            return sendError(res, { message: String(error) });
        }
    }


    /**
    * @api settings 
    * @dev settings as admin
    */
    public async updateSettings(req: InterFace.AuthRequest, res: Response) {
        try {
            const response = await adminService.updateSettings(req.user , req.body)
            return sendSuccess(res, createResponse(STATUS_CODE.OK, API_RESPONSE.SETTINGS_UPDATES, {message : response}));
        } catch (error) {
            console.log(error);
            return sendError(res, { message: String(error) });
        }
    }


}

export default new AdminController();
