import { NotificationInterface } from '../../models/interface';
import { DeviceTokenModel, NotificationModel } from '../../models/model';

export { default as gasPriceQueries } from './gasPrice';
export { default as coinQueries } from "./coins";
export { default as walletQueries } from "./wallets";
export { default as currencyQueries } from './currencies';
export { default as coinPriceInFiatQueries } from './coinPriceInFiat';
export { default as makerWalletQueries } from './makerWallets';
export { default as makerTrnxRequestQueries } from './makerTrnxRequests';
export { default as trnxHistoryQueries } from './trnxHistory';
export { default as changellyCrossChainCoinQueries } from './changellySupportedCrossChainCoins';
export { default as notificationQueries } from './notifications';
export { default as userQueries } from './users';
export { default as coin_queries } from "./coins";

class DbHelper {
    public async getUserDeviceToken(
        userId: number
    ): Promise<{ device_token: Array<string> }> {
        var deviceTokensData = await DeviceTokenModel.DeviceTokenModelRead.findAll({
            where: { user_id: userId, status: 1 },
            attributes: ["device_token"],
        });
        let newValue = [];
        for await (let deviceToken of deviceTokensData) {
            // console.log("deviceToken:", deviceToken.device_token);
            newValue.push(deviceToken.device_token);
        }
        if (newValue.length > 0) return { device_token: newValue as string[] };
        else return { device_token: [] };
    }

    public async save_notification(object: NotificationInterface) {
        try {
            await NotificationModel.NotificationModelWrite.create(object)
            return true;
        } catch (err: any) {
            console.error("Error in save_notification>>>>", err)
            return false;
        }
    }
}

const dbHelper = new DbHelper();
export default dbHelper;