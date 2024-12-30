import { Response } from "express"
import * as InterFace from './admin.interface'

class AdminResponse {
    /**
     * @function sendSuccess
     * @param response
     * @param data
     * @returns Success Response
     */
    public sendSuccess(res: Response, data = {}) {
        return res.status(200).json({ ...data, status: 200 })
    }

    /**
    * @function sendError
    * @param response
    * @param errors
    * @returns Error Response
    */
    public sendError(res: Response, errors: InterFace.ApiError) {
        return res.status(400).json({ errors })
    }


    /**
    * @function sendAuthError
    * @param response
    * @param errors
    * @returns Error Response
    */
    public sendAuthError(res: Response, errors: InterFace.ApiError) {
        return res.status(401).json({ errors })
    }

    /**
     * @function createResponse
     * @param status (number | string)
     * @param message (string)
     * @param data {object: any}
     * @returns response object
     */
    public createResponse(
        status: number,
        message: string,
        data: unknown
    ): InterFace.ApiResponse {
        return { status, message, data: data ?? {} }
    }
}

export default new AdminResponse()