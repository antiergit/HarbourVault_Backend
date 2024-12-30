import { Request, Response } from "express";
import { config } from "../../config";
import { fiat_currency_ids, PriceAlertStatusEnum, RES_MSG, StatusEnum } from "../../constants/global_enum";
import redisClient from "../../helpers/common/redis";
import { PriceAlert } from "../../models/model/price_alert.table";
import response from "../../helpers/response/response.helpers";
import { CoinPriceInFiatModel, CoinsModel, WalletModel } from "../../models";
import { coin_price_in_fiat_queries, device_token_queries } from "../../helpers/dbHelper";
import { literal, Op, Sequelize } from "sequelize";


class PriceAlertController {
   private REDIS_PRICEALERT_LIST: any = config.PRICEALERT_LIST;

   constructor() { }

   AddNew = async (
      req: Request,
      res: Response
   ) => {
      try {
         const user_id: number = req.userId;
         const {
            wallet_address,
            fiat_type,
            coin_symbol,
            coin_name,
            percentage,
            price_in_usd_per_unit,
            alert_price,
            coin_family,
            token_address
         }: any = req.body;

         let amount = alert_price;

         let currency_fiat_short_code = (req.body.fiat_type ? req.body.fiat_type : 'usd');
         let currency_fiat_id: number = fiat_currency_ids[currency_fiat_short_code.toUpperCase()];

         let coin: any = await CoinsModel.findOne({
            where: {
               coin_symbol, coin_name, coin_family: coin_family, token_address: token_address ? token_address : null
            }, logging: false
         });

         if (!coin) {
            console.error(`PriceAlertController AddNew coin  not found >>>`);
            let resMsg = {
               status: false,
               message: RES_MSG.ERROR,
            };
            return response.error(res, {
               data: resMsg
            });
         }
         const coin_id: number = coin?.coin_id;

         // const fiat_currency: FiatCurrencyTable = req.user.fiat_currency;
         // const fiat_symbol: string = fiat_currency?.short_code.toLowerCase() || '';

         const checkOld: any = await PriceAlert.findOne({
            where: {
               user_id: user_id,
               coin_id: coin_id,
               amount: amount,
               status: StatusEnum.ENABLED,
               fiat_currency: currency_fiat_id,
               wallet_address
            }
         });
         if (checkOld) {
            console.log("where cond::", {
               user_id: user_id,
               coin_id: coin_id,
               amount: amount,
               status: StatusEnum.ENABLED,
               fiat_currency: currency_fiat_id
            })
            let resMsg = {
               status: false,
               message: 'Duplicate price alert.',
            };
            return response.error(res, {
               data: resMsg
            });
         }
         let alert_type: string = 'up';

         if (price_in_usd_per_unit > amount) {
            alert_type = 'down'
         }
         console.log("currency_fiat_id ++++", currency_fiat_id)

         PriceAlert.create({
            user_id: user_id,
            coin_id: coin_id,
            wallet_address,
            amount: amount,
            status: StatusEnum.ENABLED,
            fiat_currency: currency_fiat_id,
            current_price: price_in_usd_per_unit,
            alert_type: alert_type,
            percentage
         }, {
            raw: true
         });
         const resMsg = {
            status: true,
            message: RES_MSG.SUCCESS,
         };
         return response.success(res, {
            data: resMsg
         });
      } catch (error: any) {
         console.error(`PriceAlertController AddNew error >>>`, error);
         // Utility_Helper.CatchErrorHandling("PriceAlertController-AddNew", error);
         let resMsg = {
            status: false,
            message: RES_MSG.ERROR,
         };
         return response.error(res, {
            data: resMsg
         });
      }
   };

   ChangeStatus = async (
      req: Request,
      res: Response
   ) => {
      try {
         const user_id: number = req.userId;
         const price_id: number = req.body.price_id;
         const newStatus: StatusEnum = req.body.status;

         await PriceAlert.update({
            status: newStatus,
         }, {
            where: {
               id: price_id,
            },
         }).then(async (result: any) => {
            const price_data: any = await PriceAlert.findOne({
               where: {
                  id: price_id
               },
               raw: true
            })
            redisClient.set_hash_table(
               this.REDIS_PRICEALERT_LIST, // key
               `PriceAlert_${price_id}`, // data,
               JSON.stringify(price_data) // value
            );

            let resMsg = {
               status: true,
               message: RES_MSG.SUCCESS,
               data: price_data,
            };
            return response.success(res, {
               data: resMsg
            });
         }).catch((error: any) => {
            console.error(`PriceAlertController ChangeStatus error >>>`, error);
            let resMsg = {
               status: false,
               message: RES_MSG.ERROR,
               data: {},
            };
            return response.error(res, {
               data: resMsg
            });
         });
      } catch (error: any) {
         console.error(`PriceAlertController ChangeStatus error >>>`, error);
         //Utility_Helper.CatchErrorHandling("PriceAlertController-ChangeStatus", error);
         let resMsg = {
            status: false,
            message: RES_MSG.ERROR,
         };
         return response.error(res, {
            data: resMsg
         });
      }
   }

   ChangeAmount = async (
      req: Request,
      res: Response
   ) => {
      try {
         const user_id: number = req.userId;
         const price_id: number = req.body.price_id;
         const amount: number = req.body.amount;

         await PriceAlert.update({
            amount: amount,
         }, {
            where: {
               id: price_id,
               user_id: user_id
            },
         }).then(async (result: any) => {
            const price_data: any = await PriceAlert.findOne({
               where: {
                  id: price_id
               },
               raw: true
            })
            redisClient.set_hash_table(
               this.REDIS_PRICEALERT_LIST, // key
               `PriceAlert_${price_id}`, // data,
               JSON.stringify(price_data) // value
            );

            let resMsg = {
               status: true,
               message: RES_MSG.SUCCESS,
               data: price_data,
            };
            return response.success(res, {
               data: resMsg
            });
         }).catch((error: any) => {
            console.error(`PriceAlertController ChangeStatus error >>>`, error);
            let resMsg = {
               status: false,
               message: RES_MSG.ERROR,
               data: {},
            };
            return response.error(res, {
               data: resMsg
            });
         });
      } catch (error: any) {
         console.error(`PriceAlertController ChangeStatus error >>>`, error);
         //Utility_Helper.CatchErrorHandling("PriceAlertController-ChangeStatus", error);
         let resMsg = {
            status: false,
            message: RES_MSG.ERROR,
         };
         return response.error(res, {
            data: resMsg
         });
      }
   }

   DeleteAlert = async (
      req: Request,
      res: Response
   ) => {
      try {
         const user_id: number = req.userId;
         const price_id: string = req.body.price_id;

         const deleteDirectory: any = await PriceAlert.destroy({
            where: {
               user_id: user_id,
               id: price_id,
            }
         });
         if (deleteDirectory) {
            const resMsg = {
               status: true,
               message: RES_MSG.SUCCESS,
               data: {}
            };
            return response.success(res, {
               data: resMsg
            });
         } else {
            let resMsg = {
               status: false,
               message: "Oops! Something went wrong. Please try again"
            };
            return response.error(res, {
               data: resMsg
            });
         }
      } catch (error: any) {
         console.error(`PriceAlertController DeleteAlert error >>>`, error);
         //Utility_Helper.CatchErrorHandling("PriceAlertController-DeleteAlert", error);
         let resMsg = {
            status: false,
            message: "Oops! Something went wrong. Please try again"
         };
         return response.error(res, {
            data: resMsg
         });
      }
   }

   DeleteAllAlert = async (
      req: Request,
      res: Response
   ) => {
      try {
         const user_id: number = req.userId;
         const coin_id: string = req.body.coin_id;

         await PriceAlert.destroy({
            where: {
               user_id: user_id,
               coin_id: coin_id,
            }
         });
         const resMsg = {
            status: true,
            message: RES_MSG.SUCCESS,
            data: {}
         };
         return response.success(res, {
            data: resMsg
         });
      } catch (error: any) {
         console.error(`PriceAlertController DeleteAllAlert error >>>`, error);
         //Utility_Helper.CatchErrorHandling("PriceAlertController-DeleteAllAlert", error);
         let resMsg = {
            status: false,
            message: RES_MSG.ERROR
         };
         return response.success(res, {
            data: resMsg
         });
      }
   }


   List = async (
      req: Request,
      res: Response
   ) => {
      try {
         const user_id: number = req.userId;
         const { wallet_address }: any = req.body;

         let per_page: number = req.body.limit == undefined ? 25 : Number(req.body.limit);
         let page: number = Number(req.body.page == undefined ? (req.body.page = '1') : req.body.page);
         let offset: number = (page - 1) * per_page;
         let currency_fiat_short_code = (req.body.fiat_type ? req.body.fiat_type : 'usd');
         let currency_fiat_id: number = fiat_currency_ids[currency_fiat_short_code.toUpperCase()];

         console.log("currency_fiat_id::", currency_fiat_id);

         const alertPriceList = await PriceAlert.findAndCountAll({
            attributes: {
               include: [
                  ["amount", "price"],
                  ["current_price", "price_in_usd_per_unit"],
                  ["alert_type", "type"],
                  [literal(`
                     CASE 
                       WHEN price_alerts.fiat_currency = '${fiat_currency_ids['AUD']}' THEN 'AUD'
                       WHEN price_alerts.fiat_currency = '${fiat_currency_ids['GBP']}' THEN 'GBP'
                       WHEN price_alerts.fiat_currency = '${fiat_currency_ids['CAD']}' THEN 'CAD'
                       WHEN price_alerts.fiat_currency = '${fiat_currency_ids['EUR']}' THEN 'EUR'
                       WHEN price_alerts.fiat_currency = '${fiat_currency_ids['INR']}' THEN 'INR'
                       WHEN price_alerts.fiat_currency = '${fiat_currency_ids['JPY']}' THEN 'JPY'
                       WHEN price_alerts.fiat_currency = '${fiat_currency_ids['KRW']}' THEN 'KRW'
                       WHEN price_alerts.fiat_currency = '${fiat_currency_ids['NZD']}' THEN 'NZD'
                       WHEN price_alerts.fiat_currency = '${fiat_currency_ids['USD']}' THEN "USD"
                       ELSE 'USD'
                     END`), 'fiat_type'],
               ]
            },
            where: {
               wallet_address: wallet_address,
               status: PriceAlertStatusEnum.ENABLED
            },
            include: [
               {
                  model: CoinsModel,
                  as: "coin_data",
                  attributes: [
                     "coin_name",
                     "coin_image",
                     "coin_symbol",
                     "coin_family",
                     ["token_type", "token_type"]
                  ],
                  required: false,
                  include: [
                     {
                        model: CoinPriceInFiatModel,
                        as: "fiat_price_data",
                        attributes: ['value'],
                        where: { fiat_type: currency_fiat_short_code },
                        required: false,
                     }
                  ]
               }
            ],
            order: [["created_at", "desc"]],
            logging: false
         });
         console.log("per_page:", per_page);
         console.log("req.body.limit:", req.body.limit);
         const resMsg = {
            status: true,
            message: RES_MSG.SUCCESS,
            data: alertPriceList.rows,
            meta: {
               page: page,
               pages: Math.ceil(alertPriceList.count / per_page),
               perPage: per_page,
               total: alertPriceList.count,
            },
         };
         return response.success(res, {
            data: resMsg
         });

      } catch (error: any) {
         console.error(`PriceAlertController List error >>>`, error);
         // Utility_Helper.CatchErrorHandling("PriceAlertController-List", error);
         let resMsg = {
            status: false,
            message: RES_MSG.ERROR,
            data: {}
         };
         return response.error(res, {
            data: resMsg
         });
      }
   }


   Coins = async (
      req: Request,
      res: Response
   ) => {
      try {
         const {
            page,
            limit,
            fiat_type,
         }: {
            page: number | string;
            limit: number | string;
            fiat_type: string;
         } = req.body;
         let search: any = req.body.search == undefined ? (req.body.search = "%%") : (req.body.search = "%" + req.body.search + "%");
         let coin_family_arr: [] = req.body.coin_family == undefined ? (req.body.coin_family = []) : req.body.coin_family;;
         console.log("🚀 ~ PriceAlertController ~ coin_family_arr:", coin_family_arr)

         // let coin_family_short_code = coin_family_arr.map((el) => {
         //    return `${CoinFamilyEnum_2[el]}`
         // });
         let pageNo: any = parseInt(page as string) || 1;
         let limitNo: any = parseInt(limit as string) || 10;
         let offset: number = 0;
         if (pageNo != 1) {
            offset = (pageNo - 1) * limitNo;
         }
         let userId: any = req.userId;
         const balanceSubQuery = `(SELECT COALESCE(MAX(balance), 0) FROM wallets AS w WHERE w.coin_id = coins.coin_id AND w.user_id =${userId})`;
         let data: any =
            await CoinsModel.findAndCountAll({
               attributes: ["coin_id", "coin_image", "coin_name", "coin_symbol", "coin_family", "decimals", "is_token", "token_address"],
               include: [
                  {
                     model: CoinPriceInFiatModel,
                     as: "fiat_price_data",
                     attributes: ["value", "price_change_percentage_24h"],
                     where: {
                        fiat_type,
                        value: { [Op.ne]: 0 }
                     },
                     required: false,
                  },
                  {
                     model: WalletModel,
                     // as: "wallets_price_data",
                     attributes: ["user_id", "coin_id", "balance"],
                     where: {
                        coin_id: Sequelize.col('coins.coin_id'),
                        user_id: userId,
                        status: 1
                     },
                     required: true,
                  }
               ],
               where: {
                  coin_status: 1,
                  coin_family: coin_family_arr,
                  [Op.or]: [{ coin_name: { [Op.like]: search } }, { coin_symbol: { [Op.like]: search } }],
                  [Op.and]: [
                     literal(`(token_type IN ('ERC20', 'BEP20', 'TRC20') OR token_type IS NULL)`),  // Raw SQL for token_type
                     literal(`(IF(added_by='admin',1=1,coins.coin_id IN(SELECT coin_id FROM custom_tokens WHERE user_id=${userId})))`)
                  ],
               },
               order: [
                  [literal(`
                     CASE 
                       WHEN (${balanceSubQuery}) > 0 THEN 0
                       ELSE 1
                     END
                   `), 'ASC'], // Primary sorting: coins with non-zero balance first
                  ['coin_name', 'ASC'] // Secondary sorting: alphabetical by coin name
               ],
               limit: limitNo,
               offset: offset,
               logging: true

            });
         let objData: any = {
            status: true,
            data: data.rows,
            meta: {
               page: pageNo,
               pages: Math.ceil(data.count / limitNo),
               perPage: limitNo,
               total: data.count,
            },
         };
         return response.success(res, {
            data: objData
         });
      } catch (err: any) {
         console.error("ERROR IN coins under pricealert >>>>>>", err)
         return response.error(res, {
            data: {
               status: false,
               message: RES_MSG.ERROR
            }
         });
      }
   }

   AllList = async (
      req: Request,
      res: Response
   ) => {
      try {

         let currency_fiat_short_code = req.body.fiat_type
            ? req.body.fiat_type
            : "usd";

         let WalletAddresses: any = req.body?.addressList;
         console.log("🚀 ~ PriceAlertController ~ WalletAddresses:", WalletAddresses)
         let finalObj = [];

         for await (let singleWalletByAddress of WalletAddresses) {

            let alertPriceList: any = await PriceAlert.findAll({
               attributes: {
                  include: [
                     ["amount", "price"],
                     ["current_price", "price_in_usd_per_unit"],
                     ["alert_type", "type"],
                     [literal(`
                           CASE 
                             WHEN price_alerts.fiat_currency = '${fiat_currency_ids['AUD']}' THEN 'AUD'
                             WHEN price_alerts.fiat_currency = '${fiat_currency_ids['GBP']}' THEN 'GBP'
                             WHEN price_alerts.fiat_currency = '${fiat_currency_ids['CAD']}' THEN 'CAD'
                             WHEN price_alerts.fiat_currency = '${fiat_currency_ids['EUR']}' THEN 'EUR'
                             WHEN price_alerts.fiat_currency = '${fiat_currency_ids['INR']}' THEN 'INR'
                             WHEN price_alerts.fiat_currency = '${fiat_currency_ids['JPY']}' THEN 'JPY'
                             WHEN price_alerts.fiat_currency = '${fiat_currency_ids['KRW']}' THEN 'KRW'
                             WHEN price_alerts.fiat_currency = '${fiat_currency_ids['NZD']}' THEN 'NZD'
                             WHEN price_alerts.fiat_currency = '${fiat_currency_ids['USD']}' THEN "USD"
                             ELSE 'USD'
                           END`), 'fiat_type'],
                  ]
               },
               where: {
                  wallet_address: singleWalletByAddress.address,
                  status: PriceAlertStatusEnum.ENABLED
               },
               include: [
                  {
                     model: CoinsModel,
                     as: "coin_data",
                     attributes: ["coin_name", "coin_image", "coin_symbol", "coin_family", ["token_type", "token_type"]],
                     required: true,
                     where: { coin_family: singleWalletByAddress.coin_family },
                     include: [
                        {
                           model: CoinPriceInFiatModel,
                           as: "fiat_price_data",
                           attributes: ['value'],
                           where: { fiat_type: currency_fiat_short_code },
                           required: false,
                        }
                     ]
                  },
               ],
               order: [["created_at", "desc"]],
               logging: false
            });

            if (alertPriceList.length > 0) {
               for (let i: number = 0; i < alertPriceList.length; i++) {
                  finalObj.push(alertPriceList[i])
               }
            }
         }

         const resMsg = {
            status: true,
            message: RES_MSG.SUCCESS,
            data: finalObj,
            meta: {
               total: finalObj.length
            },
         };
         return response.success(res, {
            data: resMsg
         });

      } catch (error: any) {
         console.error(`PriceAlertController AllList error >>>`, error);
         //Utility_Helper.CatchErrorHandling("PriceAlertController-AllList", error);
         let resMsg = {
            status: false,
            message: RES_MSG.ERROR,
            data: {}
         };
         return response.error(res, {
            data: resMsg
         });
      }
   }
}
export default new PriceAlertController();
