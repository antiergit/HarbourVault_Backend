import axios from "axios";
import { config } from "../config";
import { GasPrice } from "../models/model";

class GasEstimationService {

    private isGasPriceValid(gasPrices: Record<string, number>): boolean {
        return Object.values(gasPrices).every((price: any) => Math.floor(price) > 0);
    }

    public updatePOLYGasPrice = async (coinFamily: number | string): Promise<void> => {
        try {
            console.log("updating... POLYGasPrice")
            const url = `https://gas.api.infura.io/v3/${config.MATIC_INFURA_GAS_PRICE_KEY}/networks/137/suggestedGasFees`;
            const response = await axios.get(url);

            if (response.status === 200) {
                const { low, medium, high } = response.data;
                const gasPrices = {
                    safe: low.suggestedMaxFeePerGas,
                    propose: medium.suggestedMaxFeePerGas,
                    fast: high.suggestedMaxFeePerGas,
                };

                if (this.isGasPriceValid(gasPrices)) {
                    await GasPrice.GasPriceWrite.update(
                        {
                            safe_gas_price: Math.floor(gasPrices.safe),
                            propose_gas_price: Math.floor(gasPrices.propose),
                            fast_gas_price: Math.floor(gasPrices.fast),
                        },
                        { where: { coin_family: coinFamily } }
                    );
                }
            }
        } catch (error) {
            console.log("Error:: updatePOLYGasPrice func() GasEstimation Service", error)
        }
    };
}

export default new GasEstimationService();
