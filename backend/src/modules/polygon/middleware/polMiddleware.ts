import { NextFunction, Request, Response } from "express";
import { config } from "../../../config";
import response from "../../../helpers/response/response.helpers";
import * as Models from '../../../models/model/index';
import { language } from "../../../constants";
import commonHelper from "../../../helpers/common/common.helpers";

let polMiddleware = {
  requestInfo: async (req: Request, res: Response, next: NextFunction) => {
    let lang: any = req.headers['content-language'] || 'en';
    try {
      let coinData: any;
      if (req.params.coin === "pol" || req.params.coin === "POL") {
        coinData = await Models.CoinsModel.findOne({
          where: {
            coin_symbol: req.params.coin,
            coin_family: config.STATIC_COIN_FAMILY.POL,
          },
          attributes: [
            "coin_family",
            "token_abi",
            "token_address",
            "decimals",
            "is_token",
            "token_type",
            "coin_id",
            "coin_symbol",
            "coin_name"
          ],
        });
        console.log("🚀 ~ requestInfo: ~ coinData:", coinData)
      } else {
        coinData = await Models.CoinsModel.findOne({
          where: {
            token_address: req.params.coin,
            coin_family: config.STATIC_COIN_FAMILY.POL,
          },
          attributes: [
            "coin_family",
            "token_abi",
            "token_address",
            "decimals",
            "is_token",
            "token_type",
            "coin_id",
            "coin_symbol",
            "coin_name",
          ],
        });
        console.log("🚀 ~ requestInfo: ~ coinData:", coinData)
      }

      if (coinData) {
        req.coininfo = {
          token_abi: coinData.is_token == 1 ? config.CONTRACT_ABI : "",
          token_address: coinData.token_address,
          decimals: coinData.decimals,
          is_token: coinData.is_token == 1 ? true : false,
          token_type: coinData.token_type,
          coin_id: coinData.coin_id,
          // coin_symbol: req.params.coin,d
          coin_symbol: coinData.coin_symbol,
          coin_family: coinData.coin_family,
        };
        next();
      } else {
        return response.error(res, {
          data: { status: false, message: language[lang].INVALID_COIN_SYMBOL },
        });
      }
    } catch (err: any) {
      console.error("ERROR IN POL REQUEST INFO::::", err)
      await commonHelper.save_error_logs("pol_middleware", err.message);
      return response.error(res, {
        data: {
          status: false,
          message: language[lang].CATCH_MSG,
          data: `${err}`,
        },
      });
    }
  },
};

export default polMiddleware;