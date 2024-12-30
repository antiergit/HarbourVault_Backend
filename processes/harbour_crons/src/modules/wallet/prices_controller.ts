import { config } from "../../config";
import { CoinPriceInFiat, CurrencyFiat, Coins, CoinPriceInFiatGraph } from "../../models/model/index"
import redisClient from "../../helpers/common/redis";
import { Op } from "sequelize";
import rp from 'request-promise';
//import price_alerts_controller from "../price_alerts/price_alerts.controller";
import sequelize from "sequelize";
import reset_graph_data from "../../models/model/reset_graph_data";
import { CoinModel } from "../../models/interface/interface.coins";
import { coin_queries } from "../../helpers/dbHelper";
import { cmcHelper, globalHelper } from "../../helpers/common";
import axios from "axios";
import price_alerts_controller from "../price_alerts/price_alerts.controller";
import { CurrencyEnum } from "../../constants/currencyEnum";



const { current_price_coin_counter: CURRENT_PRICE_COIN_COUNTER, current_price_currency_counter: CURRENT_PRICE_CURRENCY_COUNTER, graph_data_coin_counter: GRAPH_DATA_COIN_COUNTER, graph_data_currency_counter: GRAPH_DATA_CURRENCY_COUNTER, fetch_cmc_ids_counter: FETCH_CMC_IDS_COIN_COUNTER, delete_graph_coin_counter: DELETE_GRAPH_COIN_COUNTER } = config.REDISKEYS.COIN_LIMIT_COUNT_FIELD;
const COIN_FAMILY = config.STATIC_COIN_FAMILY;

class PricesController {
    public fetchCmcIds = async () => {
        try {
            console.log("Entered into fetchCmcIds")
            let coin_limit_count: number = 0;
            let limit: number = 10;
            let findCoinCounter: any = await redisClient.getKeyValuePair(config.REDISKEYS.COIN_LIMIT_COUNTS, FETCH_CMC_IDS_COIN_COUNTER);
            if (findCoinCounter) {
                coin_limit_count = Number(findCoinCounter);
            }

            let data: any = await coin_queries.coin_find_and_count_all(
                ['coin_id', 'mainnet_token_address', 'token_address', 'coin_symbol'],
                { coin_status: 1, is_on_cmc: 1, cmc_id: { [Op.eq]: 0 } },
                limit, coin_limit_count
            )

            if (data?.count > 0) {
                for await (const iterator of data.rows) {
                    let query_data: string = `?symbol=${iterator.coin_symbol}`;

                    try {

                        let result: any = await cmcHelper.cmcInfoData(query_data)

                        if (result && result.data) {

                            let cmc_data: any = result.data.data[(iterator.coin_symbol).toUpperCase() as keyof typeof String];
                            let cmcId: number = cmc_data[0].id;
                            let db_token_address: string = (iterator.token_address).toUpperCase();
                            let contract_address_from_cmc: any = cmc_data[0].contract_address;
                            let exists: boolean = false;

                            if (contract_address_from_cmc && contract_address_from_cmc.length > 0) {
                                for (const item of contract_address_from_cmc) {
                                    if (item.contract_address.toUpperCase() == db_token_address.toUpperCase()) {
                                        exists = true;
                                        break;
                                    }
                                }
                            }
                            if (exists) {
                                await coin_queries.coin_update(
                                    { cmc_id: +cmcId, is_on_cmc: 1 },
                                    { coin_id: iterator.coin_id }
                                )
                            } else {
                                await coin_queries.coin_update(
                                    { is_on_cmc: 0 },
                                    { coin_id: iterator.coin_id }
                                )
                            }
                        }
                    } catch (err: any) {
                        console.error("Error in getting cmc data>>", err.message)
                        await coin_queries.coin_update(
                            { is_on_cmc: 0 },
                            { coin_id: iterator.coin_id }
                        )
                    }
                }
            }

            /** update coins pagination */
            coin_limit_count = coin_limit_count + limit;

            let counter: any = coin_limit_count >= data?.count ? 0 : coin_limit_count;

            await redisClient.setKeyValuePair(config.REDISKEYS.COIN_LIMIT_COUNTS, FETCH_CMC_IDS_COIN_COUNTER, counter.toString());

        } catch (err: any) {
            console.error('err in fetchCmcIds >> ', err);
        }
    };
    public fetchCmcPrice = async () => {
        try {
            console.log("fetchCmcPrice >>>>>>>>>>>>>>>>>>>>>>>>>>")
            // let family_data: any = Object.keys(COIN_FAMILY).find(key => COIN_FAMILY[key] === coin_family);
            // console.log('********* fetchCmcPrice *************', family_data);
            /** coins pagination */
            let coin_limit_count: number = 0;
            // let limit: number = 5; // CoinMArket cap
            let limit: number = 50;

            let findCoinCounter: any = await redisClient.getKeyValuePair(config.REDISKEYS.COIN_LIMIT_COUNTS, `${CURRENT_PRICE_COIN_COUNTER}`);
            if (findCoinCounter) {
                coin_limit_count = Number(findCoinCounter);
            }

            /** currencies pagination */
            let currency_limit_count: number = 0;
            // let currency_limit: number = 3;  // CoinMArket cap
            let currency_limit: number = 10;

            let findCurrencyCounter: any = await redisClient.getKeyValuePair(config.REDISKEYS.COIN_LIMIT_COUNTS, `${CURRENT_PRICE_CURRENCY_COUNTER}`);
            if (findCurrencyCounter) {
                currency_limit_count = Number(findCurrencyCounter);
            }

            let currency_data: any = await CurrencyFiat.CurrencyFiatWrite.findAndCountAll({
                attributes: ['currency_code'],
                raw: true,
                offset: currency_limit_count,
                limit: currency_limit,
                order: [['currency_id', 'asc']],
                logging: true
            });
            let coin_data_count: number = 0;
            if (currency_data.count > 0) {
                //const codes = currency_data.rows.map((el: any) => el.currency_code);
                const codes = ['USD'];
                const cmcIds: number[] = [];

                let data: any = await Coins.CoinsRead.findAndCountAll({
                    attributes: ['cmc_id'], // You can include aggregated fields here if needed
                    where: { cmc_id: { [Op.ne]: 0 }, is_on_cmc: { [Op.ne]: 0 } },
                    order: [['coin_id', 'asc']],
                    limit,
                    offset: coin_limit_count,
                    //group: ['cmc_id'], // Add the group by clause
                });

                coin_data_count = data.count;
                if (data.count > 0) {
                    for await (const iterator of data.rows) {
                        cmcIds.push(iterator?.cmc_id as number);
                    }
                }

                // Inserting cmc_ids in reset graph data table
                // if (cmcIds.length > 0) {
                //     for (let i: number = 0; i < cmcIds.length; i++) {
                //         let id_exist: any = await reset_graph_data.ResetGraphRead.findOne({
                //             attributes: ["id"],
                //             where: { cmc_id: cmcIds[i] },
                //             raw: true
                //         })
                //         if (id_exist == null) {
                //             let currentUTCDate: string = new Date().toISOString().replace(/T/, " ").replace(/\..+/, "");
                //             await reset_graph_data.ResetGraphWrite.create({ cmc_id: cmcIds[i], graph_type: '1d', created_at: currentUTCDate, updated_at: null })
                //         }
                //     }
                // }


                // Fetch Prices from cmc and update in db
                if (cmcIds.length > 0) {
                    const tokenFormat = cmcIds.toString().replace(/[\[\]']+/g, '');
                    const currencyFormat = codes.toString().replace(/[\[\]']+/g, '');
                    console.log("Entered into condition whether cmc 1 or 2")
                    let result: any = await cmcHelper.cmcQuotesLatest(tokenFormat, currencyFormat)
                    const cmcData = result.data.data;
                    for (const property in cmcData) {
                        const obj = cmcData[property];
                        if (!obj)
                            return false;
                        for await (let code of codes) {
                            if (obj.quote[code] != null) {
                                let latest_price: any = {
                                    price: obj.quote[code].price,
                                    timestamp: obj.quote[code].last_updated,
                                    price_change_24h: obj.quote[code].percent_change_24h,
                                    volume_24h: obj.quote[code].volume_24h
                                };
                                if (latest_price !== null && latest_price !== 'null') {

                                    let where: any = { cmc_id: obj.id, fiat_type: code }

                                    let checkIfCoinExist: any = await CoinPriceInFiat.CoinPriceInFiatWrite.findOne({
                                        attributes: ['id', 'coin_id'],
                                        where: {
                                            fiat_type: code,
                                            cmc_id: obj.id,
                                        },
                                        raw: true
                                    });
                                    /** check by cmc id */

                                    if (!checkIfCoinExist) {
                                        /** if by cmc id not exist then check by coin id */
                                        let coin_data: CoinModel | null = await Coins.CoinsRead.findOne({
                                            attributes: ['coin_id'],
                                            where: {
                                                cmc_id: obj.id,
                                            },
                                        });
                                        if (coin_data) {
                                            where.coin_id = coin_data?.coin_id;
                                            delete where.cmc_id;
                                            checkIfCoinExist =
                                                await CoinPriceInFiat.CoinPriceInFiatWrite.findOne({
                                                    attributes: ['id', 'coin_id'],
                                                    where: {
                                                        fiat_type: code,
                                                        coin_id: coin_data?.coin_id
                                                    },
                                                    raw: true
                                                });
                                        }
                                    }
                                    let coin_id: number = 0;
                                    if (checkIfCoinExist) {
                                        coin_id = checkIfCoinExist.coin_id;
                                        await CoinPriceInFiat.CoinPriceInFiatWrite.update(
                                            {
                                                cmc_id: obj.id,
                                                coin_id: coin_id,
                                                value: obj?.quote[code]?.price || 0,
                                                price_change_24h: obj.quote[code].percent_change_24h,
                                                price_change_percentage_24h:
                                                    obj.quote[code].percent_change_24h,
                                                volume_24h: obj.quote[code].volume_24h,
                                                total_supply: obj.total_supply,
                                                latest_price: latest_price,
                                                latest_price_source: 'current'
                                            },
                                            {
                                                where: where,
                                            }
                                        );

                                        this.setFiatPricesForAllFiats(
                                            "toUpdate",
                                            obj.id, //cmcId
                                            obj?.quote[code] //dataObj
                                        );

                                    } else {
                                        let coin = await Coins.CoinsRead.findOne({
                                            attributes: ['coin_id', 'coin_family', 'cmc_id', 'token_address', 'coin_gicko_id'],
                                            where: {
                                                cmc_id: obj.id,
                                            },
                                        });
                                        if (coin) {
                                            coin_id = coin.coin_id;
                                            let crypto = await CoinPriceInFiat.CoinPriceInFiatWrite.create({
                                                coin_id: coin.coin_id,
                                                coin_name: obj.name,
                                                coin_family: coin.coin_family,
                                                max_supply: obj.max_supply,
                                                cmc_id: coin.cmc_id || 0,
                                                circulating: obj.circulating_supply,
                                                total_supply: obj.total_supply,
                                                rank: obj.cmc_rank,
                                                market_cap: obj?.quote[code]?.market_cap,
                                                fiat_type: code.toLowerCase(),
                                                coin_symbol: obj.symbol,
                                                value: obj?.quote[code].price || 0,
                                                price_change_24h: obj.quote[code].percent_change_24h,
                                                price_change_percentage_24h:
                                                    obj.quote[code].percent_change_24h,
                                                volume_24h: obj.quote[code].volume_24h,
                                                token_address: coin.token_address,
                                                latest_price: latest_price,
                                                latest_price_source: 'current',
                                                coin_gicko_id: coin?.coin_gicko_id || ''
                                            });

                                            if (coin?.cmc_id)
                                                this.setFiatPricesForAllFiats(
                                                    "toCreate",
                                                    coin.cmc_id, //cmcId
                                                    crypto?.dataValues //dataObj
                                                );
                                        }
                                    }
                                    if (coin_id > 0) {
                                        await price_alerts_controller.sendPriceAlerts(coin_id, CurrencyEnum[code.toUpperCase()], latest_price.price);
                                    }
                                    /** update latest record in history candle */
                                    // if (coin_id > 0) {
                                    //     await this.update_history_last_price(latest_price, obj.id, code, coin_id, where);
                                    // }
                                } else {
                                    console.log("latest_price null >>", latest_price)
                                }
                            } else {
                                console.log("no price for this >>", code, obj.id)
                            }
                        }
                    }
                }

            }
            currency_limit_count = currency_limit_count + currency_limit
            let currency_counter = currency_limit_count >= currency_data.count ? 0 : currency_limit_count;
            //console.log('currency_counter >>>', currency_counter, ' >>>>>>', family_data);

            if (currency_counter == 0) {
                /** update coins pagination */
                coin_limit_count = coin_limit_count + limit;
                let counter = coin_limit_count >= coin_data_count ? 0 : coin_limit_count;
                //console.log('coin counter >>>', counter, ' >>>>>>', family_data);
                await redisClient.setKeyValuePair(config.REDISKEYS.COIN_LIMIT_COUNTS, `${CURRENT_PRICE_COIN_COUNTER}`, counter.toString());

            }
            /** update currencies pagination */
            await redisClient.setKeyValuePair(config.REDISKEYS.COIN_LIMIT_COUNTS, `${CURRENT_PRICE_CURRENCY_COUNTER}`, currency_counter.toString());
        } catch (err: any) {
            console.error('Error in  fetchCMCPrice >>', err);
        }
    };

    public setFiatPricesForAllFiats = async (action: string, cmcId: number, dataObj: any) => {
        try {
            let rateVal: any = await redisClient.getRedisSting(
                `conversion_rates`, // key
            );
            if (rateVal) {
                rateVal = JSON.parse(rateVal);
                for (let fiatObj of rateVal) {
                    if (action == "toCreate") {
                        await CoinPriceInFiat.CoinPriceInFiatWrite.create({
                            coin_id: dataObj.coin_id,
                            coin_name: dataObj.coin_name,
                            coin_family: dataObj.coin_family,
                            max_supply: dataObj.max_supply,
                            cmc_id: dataObj.cmc_id || 0,
                            circulating: dataObj.circulating,
                            total_supply: dataObj.total_supply,
                            rank: dataObj.rank,
                            market_cap: dataObj.market_cap * +fiatObj?.fiat_value,
                            fiat_type: fiatObj?.fiat_currency.toLowerCase(),
                            coin_symbol: dataObj.coin_symbol,
                            value: dataObj.value * +fiatObj?.fiat_value,
                            price_change_24h: dataObj.price_change_24h * +fiatObj?.fiat_value,
                            price_change_percentage_24h:
                                dataObj.price_change_percentage_24h * +fiatObj?.fiat_value,
                            volume_24h: dataObj.volume_24h * +fiatObj?.fiat_value,
                            token_address: dataObj.token_address,
                            latest_price_source: 'current',
                            coin_gicko_id: dataObj?.coin_gicko_id || ''
                        })
                    }
                    else if (action == "toUpdate") {
                        await CoinPriceInFiat.CoinPriceInFiatWrite.update({
                            value: dataObj.price * +fiatObj?.fiat_value,
                            price_change_24h: dataObj.percent_change_24h * +fiatObj?.fiat_value,
                            price_change_percentage_24h: dataObj.percent_change_24h * +fiatObj?.fiat_value,
                            market_cap: dataObj.market_cap * +fiatObj?.fiat_value,
                            volume_24h: dataObj.volume_24h * +fiatObj?.fiat_value
                        },
                            {
                                where: {
                                    cmc_id: cmcId,
                                    fiat_type: fiatObj?.fiat_currency.toLowerCase()
                                }
                            }
                        )
                    }
                }
            }
            return;
        } catch (error) {
            console.log("🚀 ~ createFiatPricesForAllFiats= ~ error:", (error as Error).message)
            return;
        }
    }

    public getConversionRates = async () => {
        try {
            const res = await axios.get(
                'https://api.exchangerate-api.com/v4/latest/USD'
            );

            let fiatCurrency: any = await CurrencyFiat.CurrencyFiatWrite.findAndCountAll({
                attributes: ['currency_code'],
                raw: true,
                order: [['currency_id', 'asc']],
                logging: true
            });

            if (fiatCurrency.rows.length > 0) {
                let arr = [];
                for (let fiat of fiatCurrency.rows) {
                    let fiat_currency = fiat.currency_code;
                    if (fiat_currency != "USD") {
                        let fiat_value = res.data.rates[fiat_currency];

                        arr.push({
                            "fiat_currency": fiat_currency,
                            "fiat_value": fiat_value
                        });
                    }
                }

                redisClient.client_write.set(
                    `conversion_rates`, // key
                    JSON.stringify(arr)
                );
            }
            return true;
        } catch (error) {
            console.log("🚀 ~ getConversionRates= ~ error:", (error as Error).message);
            return false;
        }
    }

    // private update_history_last_price = async (latest_price: any, id: number, code: string, coin_id: number, where: any) => {
    //     console.log('---------------------update history last price--------------', id, '------', code, 'where >>>>>', where);
    //     try {
    //         const historyExistData = await CoinPriceInFiatGraph.CoinPriceInFiatGraphRead.findAndCountAll(
    //             {
    //                 attributes: [`id`, `sparkline`, `type`],
    //                 where: where
    //             });

    //         console.log("latest_price under update_history_last_price >>>", latest_price)
    //         if (latest_price !== null) {

    //             console.log("ABCDEFGHIJKL latest_price", latest_price)

    //             if (historyExistData.count > 0) {
    //                 for (let history of historyExistData.rows) {
    //                     let history_sparkline: any = history.sparkline !== null ? history.sparkline : [];
    //                     // console.log('sparkline >>>>', sparkline);
    //                     if (history_sparkline.length > 0) {
    //                         let last_record = history_sparkline[history_sparkline?.length - 1];
    //                         console.log("ABCDEFGHIJKL last_record", last_record)

    //                         console.log('sparkline333 >>>>', (new Date(latest_price?.timestamp).getTime()) > (new Date(last_record?.timestamp).getTime()));
    //                         if ((new Date(latest_price?.timestamp).getTime()) > (new Date(last_record?.timestamp).getTime())) {
    //                             history_sparkline.push(latest_price)

    //                             let getGraphData: any = await globalHelper.setGraphData(history_sparkline);
    //                             if (getGraphData.status) {

    //                                 await CoinPriceInFiatGraph.CoinPriceInFiatGraphWrite.update(
    //                                     {
    //                                         sparkline: getGraphData.graphData,
    //                                         cmc_id: id
    //                                     }
    //                                     , { where: { id: history.id } });
    //                             }
    //                         }
    //                     } else {
    //                         history_sparkline.push(latest_price)

    //                         let getGraphData: any = await globalHelper.setGraphData(history_sparkline);
    //                         if (getGraphData.status) {
    //                             await CoinPriceInFiatGraph.CoinPriceInFiatGraphWrite.update(
    //                                 {
    //                                     sparkline: getGraphData.graphData,
    //                                     cmc_id: id
    //                                 },
    //                                 { where: { id: history.id } });
    //                         }
    //                     }
    //                 }
    //             } else {
    //                 let types = ['1d']
    //                 for (let i = 0; i < types.length; i++) {
    //                     let create_data: any = {
    //                         coin_id: coin_id, cmc_id: id, type: types[i], fiat_type: code, volume_24h: latest_price.volume_24h,
    //                         price_change_24h: latest_price.price_change_24h,
    //                         price_change_percentage_24h: latest_price.price_change_24h,
    //                         sparkline: [latest_price]
    //                     }
    //                     await CoinPriceInFiatGraph.CoinPriceInFiatGraphWrite.create(create_data);
    //                 }
    //             }
    //         } else {
    //             console.log("ABCDEFGH latest_price", latest_price)
    //         }
    //     } catch (err: any) {
    //         console.error("Error in update_history_last_price >>", err)
    //     }

    // }
    // public getCoinGraphData = async (
    //     startDate: string,
    //     endDate: string,
    //     interval: string,
    //     type: '1d' | '1w' | '1m' | '1y',
    //     coin_limit: number,
    //     coin_family: number
    // ) => {
    //     try {
    //         console.log("data in getCoinGraphData")
    //         // let currencyCount = await modelCounter.CounterRead.count();
    //         let family_data = Object.keys(COIN_FAMILY).find(key => COIN_FAMILY[key] === coin_family);

    //         console.log('********* fetch graph data *************', family_data);
    //         /** coins pagination */
    //         let coin_limit_count = 0;
    //         let limit = coin_limit;
    //         let findCoinCounter = await redisClient.getKeyValuePair(config.REDISKEYS.COIN_LIMIT_COUNTS, `${family_data}_${type}_${GRAPH_DATA_COIN_COUNTER}`);

    //         // let findCoinCounter = await redisClient.getKeyValuePair(config.REDISKEYS.COIN_LIMIT_COUNTS, `${type}_${GRAPH_DATA_COIN_COUNTER}`);
    //         if (findCoinCounter) {
    //             coin_limit_count = Number(findCoinCounter);
    //         }

    //         console.log("endDate>>>>>>>>>>>", endDate)

    //         let dbCoinrecords = await Coins.CoinsRead.findAndCountAll({
    //             attributes: ['cmc_id'],
    //             where: {
    //                 cmc_id: { [Op.ne]: 0 },
    //                 // coin_family: coin_family
    //             },
    //             include: [{
    //                 model: reset_graph_data.ResetGraphRead,
    //                 attributes: ['graph_type', 'updated_at'],
    //                 as: 'reset_graph_data',
    //                 where: sequelize.literal(`(reset_graph_data.updated_at IS NULL OR DATE(reset_graph_data.updated_at) != CURRENT_DATE)`),
    //                 required: true
    //             }],
    //             // raw: true,
    //             order: [['coin_id', 'asc']],
    //             limit: limit,
    //             offset: coin_limit_count,
    //             logging: true
    //         });
    //         let ids: any[] = [];
    //         if (dbCoinrecords.count > 0) {
    //             ids = dbCoinrecords.rows
    //                 .filter((item: any) => item.cmc_id != 999999999)
    //                 .map((item: any) => item.cmc_id);
    //             console.log('cmc ids from reset graph data and coins table>>>', ids);
    //         }


    //         /** currencies pagination */
    //         let currency_limit_count = 0;
    //         let findCurrencyCounter = await redisClient.getKeyValuePair(config.REDISKEYS.COIN_LIMIT_COUNTS, `${family_data}_${type}_${GRAPH_DATA_CURRENCY_COUNTER}`);
    //         //let findCurrencyCounter = await redisClient.getKeyValuePair(config.REDISKEYS.COIN_LIMIT_COUNTS, `${type}_${GRAPH_DATA_CURRENCY_COUNTER}`);

    //         if (findCurrencyCounter) {
    //             currency_limit_count = Number(findCurrencyCounter);
    //         }
    //         let currencylimit = 3;
    //         let currencies_data_count = 0;
    //         if (dbCoinrecords.count > 0 && ids.length > 0) {
    //             const currencies_data = await CurrencyFiat.CurrencyFiatWrite.findAndCountAll({
    //                 attributes: ['currency_code'],
    //                 raw: true,
    //                 order: [['currency_id', 'asc']],
    //                 limit: currencylimit,
    //                 offset: currency_limit_count,
    //             });
    //             currencies_data_count = currencies_data.count;
    //             if (currencies_data.count > 0) {
    //                // let codes = [];
    //                 const codes: string[] = [];
    //                 for await (let fiat_currency of currencies_data.rows) {
    //                     let currencyInFiat = fiat_currency.currency_code;
    //                     codes.push(currencyInFiat.toLowerCase());
    //                 }

    //                 console.log(" ids type >>>>>", ids)
    //                 const requestOptionsForListing = await cmcHelper.cmcHistoricalData(ids, interval, codes, startDate, endDate)
    //                 let data: any = await rp(requestOptionsForListing);
    //                 if (data) {
    //                     for (let id of ids as any) {
    //                         console.log("id=====================", id)
    //                         for await (let code of codes) {
    //                             console.log("code=====================", code)

    //                             let created_at;
    //                             let fiat_type = code;
    //                             let sparkline: any = [];
    //                             let circulating_supply: any;
    //                             let price: any;
    //                             if (data?.data[id]?.quotes && data?.data[id]?.quotes.length > 0) {
    //                                 sparkline = data?.data[id]?.quotes.map(
    //                                     (data: any, index: number) => {
    //                                         console.log("Checking in Quote fiat Type is there or not", code.toUpperCase())
    //                                         if (data.quote[code.toUpperCase()]) {
    //                                             console.log("In Quote fiat Type is present", code.toUpperCase())
    //                                             created_at = new Date(data.quote[code.toUpperCase()].timestamp)
    //                                                 .toISOString()
    //                                                 .replace(/T/, ' ')
    //                                                 .replace(/\..+/, '');
    //                                             return {
    //                                                 price: data.quote[code.toUpperCase()].price,
    //                                                 timestamp: data.quote[code.toUpperCase()].timestamp,
    //                                                 percent_change_24h: data.quote[code.toUpperCase()].percent_change_24h,
    //                                                 volume_24h: data.quote[code.toUpperCase()].volume_24h,
    //                                             };

    //                                         } else {
    //                                             console.log("In Quote fiat Type is not present >>", code.toUpperCase())
    //                                         }
    //                                     }
    //                                 );
    //                                 if (data?.data[id].quotes[0].quote[code.toUpperCase()]) {
    //                                     circulating_supply = data?.data[id].quotes[0].quote[code.toUpperCase()].circulating_supply;
    //                                     price = data?.data[id].quotes[0].quote[code.toUpperCase()].price;
    //                                     console.log(" if circulating_supply price>>>", circulating_supply, price)
    //                                 } else {
    //                                     console.log("In Quote fiat Type is not present 2 >>", code.toUpperCase())
    //                                 }



    //                             } else if (data?.data?.quotes && data?.data?.quotes.length > 0) {
    //                                 sparkline = data?.data?.quotes.map(
    //                                     (data: any, index: number) => {
    //                                         if (data.quote[code.toUpperCase()]) {
    //                                             console.log("Checking in Quote fiat Type is there or not", code.toUpperCase())
    //                                             created_at = new Date(data.quote[code.toUpperCase()].timestamp)
    //                                                 .toISOString()
    //                                                 .replace(/T/, ' ')
    //                                                 .replace(/\..+/, '');
    //                                             return {
    //                                                 price: data.quote[code.toUpperCase()].price,
    //                                                 timestamp: data.quote[code.toUpperCase()].timestamp,
    //                                                 percent_change_24h: data.quote[code.toUpperCase()].percent_change_24h,
    //                                                 volume_24h: data.quote[code.toUpperCase()].volume_24h,
    //                                             };
    //                                         } else {
    //                                             console.log("In Quote fiat Type is not present >>", code.toUpperCase())
    //                                         }
    //                                     }
    //                                 );
    //                                 if (data?.data?.quotes[0].quote[code.toUpperCase()]) {
    //                                     circulating_supply = data?.data?.quotes[0].quote[code.toUpperCase()].circulating_supply;
    //                                     price = data?.data?.quotes[0].quote[code.toUpperCase()].price;
    //                                     console.log(" else if circulating_supply price>>>", circulating_supply, price)
    //                                 } else {
    //                                     console.log("In Quote fiat Type is not present 3 >>", code.toUpperCase())
    //                                 }
    //                             }
    //                             console.log(" sparkline sparkline sparkline length =====================", sparkline.length)
    //                             if (sparkline.length > 0) {
    //                                 let where: any = {
    //                                     cmc_id: id,
    //                                     fiat_type: code,
    //                                     type: type,
    //                                 }
    //                                 let recordExist: any =
    //                                     await CoinPriceInFiatGraph.CoinPriceInFiatGraphRead.findOne(
    //                                         {
    //                                             attributes: [
    //                                                 `id`,
    //                                                 'sparkline'
    //                                             ],
    //                                             where: where,
    //                                             // logging: true
    //                                         }
    //                                     );

    //                                 if (!recordExist) {
    //                                     /** if by cmc id not exist then check by coin id */
    //                                     let coin_data: CoinModel | null = await Coins.CoinsRead.findOne({
    //                                         attributes: ['coin_id'],
    //                                         where: {
    //                                             cmc_id: id,
    //                                         },
    //                                     });
    //                                     if (coin_data) {
    //                                         where.coin_id = coin_data?.coin_id;
    //                                         delete where.cmc_id;
    //                                         recordExist =
    //                                             await CoinPriceInFiatGraph.CoinPriceInFiatGraphRead.findOne(
    //                                                 {
    //                                                     attributes: [
    //                                                         `id`,
    //                                                         'sparkline'
    //                                                     ],
    //                                                     where: where,
    //                                                     // logging: true
    //                                                 }
    //                                             );
    //                                     }
    //                                 }
    //                                 console.log('recordExist >>>>', 'where', where);
    //                                 if (recordExist) {

    //                                     console.log("type>>>>>>>>>>>>>>>>>>>>>>>>33333", id, type, code)
    //                                     sparkline = await this.compare_update_prices(sparkline, recordExist, id, code, type);

    //                                     // console.log('sparkline return >>>>>>>>', sparkline);

    //                                     // ;
    //                                     let getGraphData: any = await globalHelper.setGraphData(sparkline);
    //                                     if (getGraphData.status) {


    //                                         await CoinPriceInFiatGraph.CoinPriceInFiatGraphWrite.update(
    //                                             {
    //                                                 sparkline: getGraphData.graphData,
    //                                                 cmc_id: id
    //                                             },
    //                                             {
    //                                                 where: where,
    //                                             }
    //                                         );
    //                                     }


    //                                 } else {
    //                                     let coin_data: any = await Coins.CoinsRead.findOne({
    //                                         attributes: ["coin_id"],
    //                                         where: {
    //                                             cmc_id: id
    //                                         }
    //                                     })
    //                                     await CoinPriceInFiatGraph.CoinPriceInFiatGraphWrite.create(
    //                                         {
    //                                             coin_id: coin_data.coin_id,
    //                                             sparkline: sparkline,
    //                                             cmc_id: id,
    //                                             fiat_type: fiat_type.toUpperCase(),
    //                                             type: type,
    //                                             // created_at,
    //                                         }
    //                                     );
    //                                 }

    //                             }

    //                         }
    //                         console.log("==================================")
    //                         console.log("currecncy-limit_count == 9 checking", currency_limit_count)
    //                         if (currency_limit_count == 9) {
    //                             console.log('currency_limit_count >>>>>>>>>>>>>>>', currency_limit_count);

    //                             let reset_data_exist: any = await reset_graph_data.ResetGraphWrite.findOne({
    //                                 where: { cmc_id: id, graph_type: type }
    //                             })
    //                             let currentUTCDate: string = new Date().toISOString().replace(/T/, " ").replace(/\..+/, "");
    //                             if (!reset_data_exist) {
    //                                 await reset_graph_data.ResetGraphWrite.create({
    //                                     cmc_id: id,
    //                                     graph_type: type,
    //                                     created_at: currentUTCDate,
    //                                     updated_at: currentUTCDate
    //                                 });
    //                             } else {
    //                                 await reset_graph_data.ResetGraphWrite.update({
    //                                     graph_type: type,
    //                                     updated_at: currentUTCDate
    //                                 }, {
    //                                     where: { cmc_id: id }
    //                                 });
    //                             }
    //                         }
    //                     }
    //                 }
    //             }
    //         }
    //         console.log('graph currency_limit_count >>>', currency_limit_count, ' >>>>>>', family_data);

    //         currency_limit_count = currency_limit_count + currencylimit

    //         console.log('graph total currency_data.count >>>', currencies_data_count, ' >>>>>>', family_data);

    //         let currency_counter = currency_limit_count >= currencies_data_count ? 0 : currency_limit_count;
    //         console.log('graph currency_counter >>>', currency_counter, ' >>>>>>', family_data);

    //         if (currency_counter == 0) {
    //             /** update coins pagination */
    //             coin_limit_count = coin_limit_count + limit;
    //             console.log('graph coin_limit_count >>>', coin_limit_count, ' >>>>>>', family_data);

    //             console.log('graph total_count >>>', dbCoinrecords.count, ' >>>>>>', family_data);

    //             let counter = coin_limit_count >= dbCoinrecords.count ? 0 : coin_limit_count;
    //             console.log('graph coin counter >>>', counter, ' >>>>>>', family_data);

    //             await redisClient.setKeyValuePair(config.REDISKEYS.COIN_LIMIT_COUNTS, `${family_data}_${type}_${GRAPH_DATA_COIN_COUNTER}`, counter.toString());

    //             //await redisClient.setKeyValuePair(config.REDISKEYS.COIN_LIMIT_COUNTS, `${type}_${GRAPH_DATA_COIN_COUNTER}`, counter.toString());
    //         }
    //         /** update currencies pagination */
    //         await redisClient.setKeyValuePair(config.REDISKEYS.COIN_LIMIT_COUNTS, `${family_data}_${type}_${GRAPH_DATA_CURRENCY_COUNTER}`, currency_counter.toString());

    //         //await redisClient.setKeyValuePair(config.REDISKEYS.COIN_LIMIT_COUNTS, `${type}_${GRAPH_DATA_CURRENCY_COUNTER}`, currency_counter.toString());
    //     } catch (err: any) {
    //         console.error(`err historical data type >>`, type, err);
    //     }
    // };

    // public compare_update_prices = async (sparkline: any, recordExist: any, id: number, code: string, type: string) => {
    //     try {
    //         if (sparkline?.length > 0) {

    //             console.log("sparkline length >>>>>", sparkline?.length)

    //             let sparkline_latest_record = sparkline[sparkline?.length - 1];
    //             console.log("sparkline length >>>>>", sparkline_latest_record)


    //             let existing_last_record: any = recordExist.sparkline !== null && recordExist.sparkline.length > 0 ? recordExist?.sparkline[recordExist.sparkline.length - 1] : '';
    //             console.log("existing_last_record>>>>>>>>>>>>>>>>>>>>>>>>", existing_last_record)

    //             if (existing_last_record !== '' && existing_last_record != null && existing_last_record != 'null') {

    //                 if ((new Date(existing_last_record?.timestamp).getTime()) > (new Date(sparkline_latest_record?.timestamp).getTime())) {
    //                     // console.log('sparkline_latest_record22 >>>>>>>>', sparkline_latest_record);
    //                     // if (existing_last_record != null) {
    //                     sparkline.push(existing_last_record);
    //                     // }
    //                 } else {
    //                     let coin_data: CoinModel | null = await Coins.CoinsRead.findOne({
    //                         attributes: ['coin_id'],
    //                         where: {
    //                             cmc_id: id,
    //                         },
    //                     });
    //                     await CoinPriceInFiat.CoinPriceInFiatWrite.update(
    //                         {
    //                             coin_id: coin_data?.coin_id,
    //                             value: sparkline_latest_record?.price || 0,
    //                             price_change_24h: sparkline_latest_record.percent_change_24h,
    //                             price_change_percentage_24h:
    //                                 sparkline_latest_record.percent_change_24h,
    //                             volume_24h: sparkline_latest_record.volume_24h,
    //                             latest_price: sparkline_latest_record,
    //                             latest_price_source: type
    //                         },
    //                         {
    //                             where: {
    //                                 cmc_id: id,
    //                                 fiat_type: code,
    //                             },
    //                         }
    //                     );
    //                 }
    //             }
    //         }
    //         return sparkline;

    //     } catch (err: any) {
    //         console.error(" sparkline sparkline sparkline length  Error in compare_update_prices=====================", sparkline)
    //     }

    // }
}

const third_party_controller = new PricesController();
export default third_party_controller;