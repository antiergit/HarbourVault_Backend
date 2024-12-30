import { Coins } from "../../models/model/index"

class CoinQueries {

    public coin: any = Coins;

    public async update(setClause: any, whereClause: any) {
        try {
            await this.coin.CoinsWrite.update(setClause, { where: whereClause })
        } catch (err: any) {
            console.error("Error in update in coinQueries update 🔥 ~ ~", err.message)
        }
    }

    public async findAndCountAll(attr: any, whereClause: any, order: any, limit: any, offset: any) {
        try {
            let data: any = await this.coin.CoinsRead.findAndCountAll({
                attributes: attr,
                where: whereClause,
                order: order,
                limit: limit,
                offset: offset
            })
            return data;
        } catch (err: any) {
            console.error("Error in coinQueries findAndCountAll 🔥 ~ ~", err.message)
        }
    }

    public async findOne(attr: any, whereClause: any) {
        try {
            let data: any = await this.coin.CoinsRead.findOne({
                attributes: attr,
                where: whereClause,
                raw: true
            })
            return data;
        } catch (err: any) {
            console.error("Error in coinQueries findOne 🔥 ~ ~", err.message)
        }
    }

    public async coin_find_and_count_all(attr: any, where_clause: any, limit: any, coin_limit_count: any) {
        try {
            let data: any = await Coins.CoinsRead.findAndCountAll({
                attributes: attr,
                where: where_clause,
                raw: true,
                limit: limit,
                offset: coin_limit_count,
            });
            return data;
        } catch (err: any) {
            console.error("Error in coin_find_one >>", err)
            throw err;
        }
    }

    public async coin_update(set: any, where_clause: any) {
        try {
            let data: any = await Coins.CoinsWrite.update(set, { where: where_clause })
            return data;
        } catch (err: any) {
            console.error("Error in coin_update>>", err)
            throw err;
        }
    }

}
const coinQueries = new CoinQueries();
export default coinQueries;