import * as express from 'express';
import PriceAlertController from './price_alert.controller';
import jwtVerification from '../../middlewares/verify.middleware';


class PriceAlerts {
   public path = '/priceAlert';
   public router = express.Router();
   constructor() {
      this.intializeRoutes();
   }
   public intializeRoutes() {
      this.router.all(
         `${this.path}*`,
         jwtVerification.verifyToken
      ).post(
         `${this.path}/addNew`,
         //ValidationMiddleware(AddPriceAlertDto, false),
         PriceAlertController.AddNew
      ).post(
         `${this.path}/changeStatus`,
         //ValidationMiddleware(ChangePriceAlertStatusDto, false),
         PriceAlertController.ChangeStatus
      ).post(
         `${this.path}/changeAmount`,
         //ValidationMiddleware(ChangePriceAlertAmountDto, false),
         PriceAlertController.ChangeAmount
      ).post(
         `${this.path}/delete`,
         //ValidationMiddleware(DeletePriceAlertDto, false),
         PriceAlertController.DeleteAlert
      )
      .post(
         `${this.path}/delete-all`,
         PriceAlertController.DeleteAllAlert
      ).post(
         `${this.path}/get`,
         // ValidationMiddleware(GetAlertsValidateDto, false),
         PriceAlertController.List
      ).post(
         `${this.path}/coins`,
         //ValidationMiddleware(CoinListDto, false),
         PriceAlertController.Coins
      ).post(
         `${this.path}/getList`,
        // ValidationMiddleware(GetAlertsListValidateDto, false),
         PriceAlertController.AllList
      );
   }
}
export let PriceAlertRouter = new PriceAlerts;
