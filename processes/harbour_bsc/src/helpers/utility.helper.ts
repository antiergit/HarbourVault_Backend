import BigNumber from "bignumber.js";
var FCM = require("fcm-node");
import { config } from "../config/config";
import { notificationQueries, userQueries } from "./dbHelper";
// import { global_helper } from "./global_helper";
import CMCNotificationService from '../service/service.fmc'

class UtilityHelper {
    public FCM_SERVER_KEY: any = config.KEYS.FCM_PUSH;

    public async bigNumberSafeMath(c: any, operation: any, d: any) {
        18;
        var a = new BigNumber(c);
        var b = new BigNumber(d);
        var rtn: any;
        switch (operation.toLowerCase()) {
            case "-":
                rtn = a.minus(b);
                break;
            case "+":
                rtn = a.plus(b);
                break;
            case "*":
            case "x":
                rtn = a.multipliedBy(b);
                break;
            case "÷":
            case "/":
                rtn = a.dividedBy(b);
                break;
            default:
                //operator = operation;
                break;
        }
        return rtn.toString();
    };
    bigNumberSafeConversion = async (val: number) => {
        const amount = val.toString();
        const value = new BigNumber(amount);
        return value.toFixed();
    };
    public async exponentialToDecimal(exponential: number) {
        let decimal: string = exponential.toString().toLowerCase();
        if (decimal.includes("e+")) {
            const exponentialSplitted = decimal.split("e+");
            let postfix: string = "";
            for (let i = 0; i < +exponentialSplitted[1] - (exponentialSplitted[0].includes(".") ? exponentialSplitted[0].split(".")[1].length : 0); i++) {
                postfix += "0";
            }
            const addCommas = (text: string) => {
                let j: number = 3;
                let textLength: number = text.length;
                while (j < textLength) {
                    text = `${text.slice(0, textLength - j)}${text.slice(textLength - j, textLength)}`;
                    textLength++;
                    j += 3 + 1;
                }
                return text;
            };
            decimal = addCommas(exponentialSplitted[0].replace(".", "") + postfix);
        }
        if (decimal.toLowerCase().includes("e-")) {
            const exponentialSplitted = decimal.split("e-");
            let prefix: string = "0.";
            for (let i = 0; i < +exponentialSplitted[1] - 1; i++) {
                prefix += "0";
            }
            decimal = prefix + exponentialSplitted[0].replace(".", "");
        }
        return decimal;
    }
    public async SendNotification(data: any) {
        try {
            let toUserId: number = data.to_user_id ? data.to_user_id : 0;

            console.log("toUserId toUserId", toUserId)
            // let deviceTokens: any = await deviceTokenQueries.findAll(
            //     ["device_token"],
            //     { user_id: toUserId, push: 1 },
            //     [["updated_at", "DESC"], ['id', 'DESC']]
            // )
            // console.log("deviceTokens deviceTokens", deviceTokens)
            // let device_tokens = [];

            // for await (let deviceToken of deviceTokens) {
            //     device_tokens.push(deviceToken.device_token);
            // }

            //===============================================================================
            let userData: any = await userQueries.userJoinDeviceTokenJoinMAkerWallets(
                ["user_id"],
                { user_id: toUserId },
                ["device_token"],
                { push: 1 },
                ["device_token"],
                { is_login: 1, status: 1 }
            )
            let device_tokens: any = [];

            // Check if user_device_token_data exists and is an array
            if (userData[0].user_device_token_data && Array.isArray(userData[0].user_device_token_data)) {
                device_tokens = device_tokens.concat(userData[0].user_device_token_data.map((item: any) => item.device_token));
            }

            // Check if user_maker_wallet_data exists and is an array
            if (userData[0].user_maker_wallet_data && Array.isArray(userData[0].user_maker_wallet_data)) {
                device_tokens = device_tokens.concat(userData[0].user_maker_wallet_data.map((item: any) => item.device_token));
            }

            let checkOldNotif: any = await notificationQueries.count({
                to_user_id: toUserId,
                notification_type: data.notification_type,
                tx_id: data.tx_id,
                tx_type: data.tx_type
            })

            console.log("CheckOld Notification count ", checkOldNotif,
                "toUserId >>", toUserId,
                "notification_type", data.notification_type,
                "tx_id>>", data.tx_id,
                "tx_type", data.tx_type)

            if (checkOldNotif == 0) {
                console.log("Insert Notification", data.message)
                let notificationData: any = {
                    message: data.message,
                    amount: data.amount,
                    from_user_id: data.from_user_id ? data.from_user_id : 0,
                    to_user_id: toUserId,
                    notification_type: data.notification_type,
                    tx_id: data.tx_id,
                    tx_type: data.notification_type,
                    coin_symbol: data.coin_symbol,
                    coin_id: data.coin_id,
                    view_status: 0,
                    state: "0",
                    wallet_address: data.wallet_address
                }
                await notificationQueries.create(notificationData);
            }


            //===============================================================================

            // if (device_tokens && this.FCM_SERVER_KEY) {
            if (device_tokens) {
                console.log("device_tokens device_tokens device_tokens >>>", device_tokens)
                let announcement_title: string = data.announcement_title == undefined ? "" : data.announcement_title;
                let announcement_message: string = data.announcement_message == undefined ? "" : data.announcement_message;
                // let fcm = new FCM(this.FCM_SERVER_KEY);
                let message;
                if (Array.isArray(device_tokens)) {
                    message = {
                        tokens: device_tokens,
                        collapse_key: "type_a",
                        notification: {
                            title: data.title,
                            body: data.message
                        },
                        data: {
                            body: data.message ? (data.message).toString() : "",
                            title: data.title ? (data.title).toString() : "",
                            notification_type: data.notification_type ? (data.notification_type).toString() : "",
                            tx_id: data.tx_id ? (data.tx_id).toString() : "",
                            tx_type: data.tx_type ? (data.tx_type).toString() : "",
                            from_user_id: data.from_user_id ? (data.from_user_id).toString() : "",
                            user_coin_id: data.coin_id ? (data.coin_id).toString() : "",
                            announcement_title: announcement_title ? (announcement_title).toString() : "",
                            announcement_message: announcement_message ? (announcement_message).toString() : "",
                        },
                    };
                } else {
                    message = {
                        tokens: device_tokens,
                        collapse_key: "type_a",
                        notification: {
                            title: data.title,
                            body: data.message
                        },
                        data: {
                            body: data.message ? (data.message).toString() : "",
                            title: data.title ? (data.title).toString() : "",
                            notification_type: data.notification_type ? (data.notification_type).toString() : "",
                            tx_id: data.tx_id ? (data.tx_id).toString() : "",
                            tx_type: data.tx_type ? (data.tx_type).toString() : "",
                            from_user_id: data.from_user_id ? (data.from_user_id).toString() : "",
                            user_coin_id: data.coin_id ? (data.coin_id).toString() : "",
                            announcement_title: announcement_title ? (announcement_title).toString() : "",
                            announcement_message: announcement_message ? (announcement_message).toString() : "",
                        },
                    };
                }

                await CMCNotificationService.sendNotification(message)

                // await global_helper.addingCoinsToQueue(config.PUSH_NOTIFICATION_QUEUE, message)

                // fcm.send(message, function (err: any, messageId: number) {
                //     if (err) {
                //         console.error("Something has gone wrong!", err);
                //     }
                //     console.debug(`fcm push notification >>`, messageId);
                // });
            }
            //===========================================================================
            return true;
        } catch (error: any) {
            console.error(`SendNotification error >>>`, error);
            return false;
        }
    };


}
export let Utility_Helper = new UtilityHelper();