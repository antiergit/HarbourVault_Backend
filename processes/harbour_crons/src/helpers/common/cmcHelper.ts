import axios from "axios";
import { config } from "../../config";
import { SettingsModel } from "../../models/model";

class CMCHelper {

    constructor() { }
    public async cmcInfoData(queryData: any) {
        try {
            console.log("Entered into cmcInfoDataUsingId", queryData)
            let url: string = 'null';
            let header: any = {};
            let result: any;
            let cmc_result: any = await SettingsModel.findOne({
                attributes: ["id", "title", "value", "created_at", "updated_at"],
                where: { title: "CMC" },
                raw: true
            })
            // 1 means Coin Market Cap, 2 means Cmc Product
            if (cmc_result) {
                if (Number(cmc_result.value) == 1) {
                    console.log("In use Coin Market Cap")

                    url = `${config.CMC.CMC_INFO_API_URL}${queryData}`;
                    header = { "X-CMC_PRO_API_KEY": `${config.CMC.CMC_KEY}` }
                    result = await axios({
                        method: "get",
                        url: url,
                        headers: header
                    });
                } else {
                    console.log("In use Antier Cmc Product")

                    url = `${config.CMC_PRODUCT.CMC_PRODUCT_INFO_API_URL}${queryData}`;
                    header = { "api_key": `${config.CMC_PRODUCT.CMC_PRODUCT_API_KEY}` }

                    result = await axios({
                        method: "get",
                        url: url,
                        headers: header,
                        // timeout: 5000,
                    });
                }
            } else {
                result = [];
            }
            console.log("url >>> ", url, "header", header)

            return result;
        } catch (err: any) {
            console.error("Error in cmcInfoDataUsingId >>>", err);
            await cmcHelper.cmcErrorThread(err);
            throw err;
        }
    }
    public async cmcQuotesLatest(id: any, fiatType: string) {
        try {
            console.log("Entered into cmcQuotesLatestApiWithId", fiatType, "id >>", id)
            let result: any;
            let url: string = 'null';
            let header: any = {};

            let cmc_result: any = await SettingsModel.findOne({
                attributes: ["id", "title", "value", "created_at", "updated_at"],
                where: { title: "CMC" },
                raw: true
            })
            // 1 means Coin Market Cap, 2 means Cmc Product
            if (cmc_result) {
                if (Number(cmc_result.value) == 1) {
                    console.log("In use Coin Market Cap")
                    url = `${config.CMC.CMC_QUOTE_LATEST_API_URL}?id=${id}&convert=${fiatType}`;
                    header = { "X-CMC_PRO_API_KEY": `${config.CMC.CMC_KEY}` }
                    result = await axios({
                        method: "get",
                        url: url,
                        headers: header
                    });
                } else {
                    console.log("In use Antier Cmc Product")
                    url = `${config.CMC_PRODUCT.CMC_PRODUCT_LATEST_API_URL}?id=${id}&convert=${fiatType}`;
                    header = { "api_key": `${config.CMC_PRODUCT.CMC_PRODUCT_API_KEY}` }

                    result = await axios({
                        method: "get",
                        url: url,
                        headers: header,
                        // timeout: 5000,
                    });
                }
            } else {
                result = [];
            }
            console.log("url >>> ", url, "header", header)

            return result;
        } catch (err: any) {
            console.error("Error in cmcQuotesLatestApiWithId>>", err);
            await cmcHelper.cmcErrorThread(err);
            throw err;
        }
    }
    public async cmcHistoricalData(ids: any, interval: any, codes: any, startDate: any, endDate: any) {
        try {
            console.log("Entered into cmcHistoricalData", ids, "interval >>", interval, "codes", codes, "startDate", startDate, "endDate", endDate)
            let result: any;
            let url: string = 'null';
            let header: any = {};

            let cmc_result: any = await SettingsModel.findOne({
                attributes: ["id", "title", "value", "created_at", "updated_at"],
                where: { title: "CMC" },
                raw: true
            })
            // 1 means Coin Market Cap, 2 means Cmc Product
            if (cmc_result) {
                if (Number(cmc_result.value) == 1) {
                    console.log("In use Coin Market Cap")
                    url = `${config.CMC.CMC_QUOTE_HISTORY_API_URL}?id=${ids}`;
                    header = { 'X-CMC_PRO_API_KEY': config.CMC.CMC_KEY }
                    result = {
                        method: 'GET',
                        uri: url,
                        qs: {
                            interval: interval,
                            skip_invalid: true,
                            convert: codes.toString(),
                            time_start: startDate,
                            time_end: endDate,
                        },
                        headers: header,
                        json: true,
                        gzip: true,
                    };
                } else {
                    console.log("In use Antier Cmc Product")
                    url = `${config.CMC_PRODUCT.CMC_PRODUCT_HISTORY_API_URL}?id=${ids}`;
                    header = { "api_key": `${config.CMC_PRODUCT.CMC_PRODUCT_API_KEY}` }
                    result = {
                        method: 'GET',
                        uri: url,
                        qs: {
                            interval: interval,
                            skip_invalid: true,
                            convert: codes.toString(),
                            time_start: startDate,
                            time_end: endDate,
                        },
                        headers: header,
                        json: true,
                        gzip: true,
                    };
                }
            } else {
                result = [];
            }
            console.log("url >>> ", url, "header", header)
            return result;
        } catch (err: any) {
            console.error("Error in cmcHistoricalData>>", err);
            await cmcHelper.cmcErrorThread(err);
            throw err;
        }
    }
    public async cmcErrorThread(error: any) {
        console.log("Entered into cmcErrorThread")
        try {
            const CURRENT_TIME = new Date(Date.now()).toUTCString();

            let errMessageWidget = [
                {
                    textParagraph: {
                        text: `<b>Timestamp</b>: ${CURRENT_TIME}`,
                    },
                },
                {
                    textParagraph: {
                        text: `<b>Project</b>: Triskel Wallet`,
                    },
                },
                {
                    textParagraph: {
                        text: `<b>Service</b>: Cronjob Service`,
                    },
                },
            ];

            if (error?.message) {
                errMessageWidget.push({
                    textParagraph: {
                        text: `<b>Message</b>: ${error.message}`,
                    },
                });
            }

            if (error?.response?.data?.status?.error_message) {
                errMessageWidget.push({
                    textParagraph: {
                        text: `<b>Data</b>: ${error.response.data.status.error_message}`,
                    },
                });
            }

            if (error?.config?.url) {
                errMessageWidget.push({
                    textParagraph: {
                        text: `<b>Url</b>: ${error?.config?.url}`,
                    },
                });
            }

            const errMessage: any = {
                cards: [
                    {
                        sections: [
                            {
                                widgets: [errMessageWidget],
                            },
                        ],
                    },
                ],
            };
            const url = `https://chat.googleapis.com/v1/spaces/AAAAEuFaePU/messages?key=AIzaSyDdI0hCZtE6vySjMm-WEfRq3CPzqKqqsHI&token=H_hoLGJYp17rYNYz3enWbx3ytsZijZoFdFF49hjHEbI`;

            if (url) {
                const headers = {
                    "Content-Type": "application/json",
                };
                axios
                    .post(url, errMessage, { headers })
                    .then((response) => { })
                    .catch((error) => {
                        console.error("GOOGLE_WEBHOOK CMC_ALERT error:", error);
                    });
            }
            return true;
        } catch (error: any) {
            console.log("::Error log:: cmcErrorThread :>> ", error);
            return false;
        }
    }
}

const cmcHelper = new CMCHelper();
export default cmcHelper;
