import { OnlyControllerInterface } from "../../interfaces/controller.interface";
import { Request, Response } from "express";
import { rocketx_helper } from "./helper";
import response from "../../helpers/response/response.helpers";
import commonHelper from "../../helpers/common/common.helpers";
import { language } from "../../constants";

class rocketxController implements OnlyControllerInterface {
    constructor() {
        this.initialize();
    }

    public initialize() {

    }

    public getConfig = async (req: Request, res: Response) => {
        let lang: any = req.headers["content-language"] || "en";
        try {
            let result = await rocketx_helper.getConfig(req.params);

            if (result.status) {
                return response.success(res, {
                    data: {
                        status: true,
                        data: result.data,
                    },
                });
            } else {
                return response.error(res, {
                    data: {
                        status: false,
                        data: result.data,
                    },
                });
            }
        } catch (error: any) {
            console.error("Error in getConfig", error);
            await commonHelper.save_error_logs("getConfig", error.message);
            return response.error(res, {
                data: { message: error.message || language[lang].CATCH_MSG, data: {} },
            });
        }
    };

    public getTokens = async (req: Request, res: Response) => {
        let lang: any = req.headers["content-language"] || "en";
        try {
            let result = await rocketx_helper.getTokens(req.params);

            if (result.status) {
                return response.success(res, {
                    data: {
                        status: true,
                        data: result.data,
                    },
                });
            } else {
                return response.error(res, {
                    data: {
                        status: false,
                        data: result.data,
                    },
                });
            }
        } catch (error: any) {
            console.error("Error in oxChain > oxChainQuotesApi.", error);
            await commonHelper.save_error_logs("oxChainQuotesApi", error.message);
            return response.error(res, {
                data: { message: error.message || language[lang].CATCH_MSG, data: {} },
            });
        }
    };

    public getAllTokens = async (req: Request, res: Response) => {
        let lang: any = req.headers["content-language"] || "en";
        try {
            const data: any = {
                params: req?.params,
                body: req?.body
            };

            let result = await rocketx_helper.getAllTokens(data);

            if (result.status) {
                return response.success(res, {
                    data: {
                        status: true,
                        data: result.data,
                    },
                });
            } else {
                return response.error(res, {
                    data: {
                        status: false,
                        data: result.data,
                    },
                });
            }
        } catch (error: any) {
            console.error("Error in getAllTokens", error);
            await commonHelper.save_error_logs("getAllTokens", error.message);
            return response.error(res, {
                data: { message: error.message || language[lang].CATCH_MSG, data: {} },
            });
        }
    };

    public getQuotation = async (req: Request, res: Response) => {
        let lang: any = req.headers["content-language"] || "en";
        try {
            let result = await rocketx_helper.getQuotation(req.query);

            if (result.status) {
                return response.success(res, {
                    data: {
                        status: true,
                        data: result.data,
                    },
                });
            } else {
                return response.error(res, {
                    data: {
                        status: false,
                        data: result.data,
                    },
                });
            }
        } catch (error: any) {
            console.error("Error in getQuotation", error);
            await commonHelper.save_error_logs("getQuotation", error.message);
            return response.error(res, {
                data: { message: error.message || language[lang].CATCH_MSG, data: {} },
            });
        }
    };

    public swapTrxn = async (req: Request, res: Response) => {
        let lang: any = req.headers["content-language"] || "en";
        try {
            const data: any = {
                body: req?.body
            };

            let result = await rocketx_helper.swapTrxn(data);

            if (result.status) {
                return response.success(res, {
                    data: {
                        status: true,
                        data: result.data,
                    },
                });
            } else {
                return response.error(res, {
                    data: {
                        status: false,
                        data: result.data,
                    },
                });
            }
        } catch (error: any) {
            console.error("Error in swapTrxn", error);
            await commonHelper.save_error_logs("swapTrxn", error.message);
            return response.error(res, {
                data: { message: error.message || language[lang].CATCH_MSG, data: {} },
            });
        }
    };

    public getStatus = async (req: Request, res: Response) => {
        let lang: any = req.headers["content-language"] || "en";
        try {
            let result = await rocketx_helper.getStatus(req.query);

            if (result.status) {
                return response.success(res, {
                    data: {
                        status: true,
                        data: result.data,
                    },
                });
            } else {
                return response.error(res, {
                    data: {
                        status: false,
                        data: result.data,
                    },
                });
            }
        } catch (error: any) {
            console.error("Error in getStatus", error);
            await commonHelper.save_error_logs("getStatus", error.message);
            return response.error(res, {
                data: { message: error.message || language[lang].CATCH_MSG, data: {} },
            });
        }
    };

}
export const rocketx_Controller = new rocketxController();
