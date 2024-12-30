import axios, { AxiosInstance } from 'axios';
import { config } from '../../config';
interface TokenInfo {
  id: number;
  name: string;
  symbol: string;
  slug: string;
  market_cap_usd?: number;
  price_usd?: number;
  circulating_supply?: number;
  total_supply?: number;
  max_supply?: number;
  [key: string]: any; // For additional optional fields
}

class CMCServices {
  private client: AxiosInstance;

  constructor(apiKey: string = config.CMC_KEY) {
    this.client = axios.create({
      baseURL: 'https://pro-api.coinmarketcap.com/',
      headers: {
        'X-CMC_PRO_API_KEY': apiKey,
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Get cryptocurrency price
   * @param id cmc id
   */
  async getCryptocurrencyPrice(cmcId: number) {
    try {
      if(!cmcId) {
        console.log("Cannot find cmc id");
        return;
      }
      const response = await this.client.get(`v2/cryptocurrency/quotes/latest?id=${cmcId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }


  async  fetchCoinData(cmcId: number): Promise<any> {
    try {

      const response = await this.client.get('v1/cryptocurrency/quotes/latest', {
        params: { id: cmcId },
      });
  
      const coinData = response.data.data[cmcId];
      return {
        coin_id: cmcId,
        coin_symbol: coinData.symbol,
        coin_name: coinData.name,
        coin_family: 'unknown', // Adjust as needed
        cmc_id: cmcId,
        value: coinData.quote.USD.price,
        price_change_24h: coinData.quote.USD.price_change_24h,
        price_change_percentage_24h: coinData.quote.USD.percent_change_24h,
        market_cap: coinData.quote.USD.market_cap,
        circulating: coinData.circulating_supply,
        total_supply: coinData.total_supply,
        rank: coinData.cmc_rank,
        volume_24h: coinData.quote.USD.volume_24h,
        max_supply: coinData.max_supply,
        latest_price: coinData.quote.USD.price,
        roi: null, // If available, adjust accordingly
        open: null, // Adjust based on your requirements
        high: null,
        average: null,
        close: null,
        low: null,
        change_price: null,
      };
    } catch (error) {
      console.error('Error fetching data from CoinMarketCap:', error);
      return null;
    }
  }
  


  /**
   * Fetch token information from CoinMarketCap using the contract address.
   * @param apiKey - Your CoinMarketCap API key.
   * @param contractAddress - The contract address of the token.
   * @returns A Promise resolving to token information.
   */
  public async getTokenInfo(contractAddress: string): Promise<any> {

    try {
      const response = await this.client.get('v1/cryptocurrency/info', {
        params: {
          address: contractAddress,
        }
      });


      if(!response?.data?.data) {
        console.log("no data found on CMC")
        return null
      }
      const data = response.data.data;
      // Extracting `logo` and `id`
      const values : any = Object.values(data)[0]; // Get the first (and only) value
      if(values) {
        const logo = values.logo;
        const id = values.id;
        const about = values.description;
        return {logo , id , about}
      } else {
        console.error("No data found in 'data.data' or the object is empty.");
        return null
      }

    } catch (error: any) {
      throw new Error(
        error.response?.data?.status?.error_message || 'Failed to fetch token info'
      );
    }
  }



  /**
   * Get metadata of a cryptocurrency
   * @param symbol Symbol of the cryptocurrency (e.g., BTC, ETH)
   */
  async getCryptocurrencyMetadata(symbol: string) {
    try {
      const response = await this.client.get('v1/cryptocurrency/info', {
        params: {
          symbol,
        },
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get the latest quotes for a cryptocurrency
   * @param symbol Symbol of the cryptocurrency (e.g., BTC, ETH)
   * @param convert Convert to specific currency (e.g., USD, EUR)
   */
  async getCryptocurrencyQuotes(symbol: string, convert = 'USD') {
    try {
      const response = await this.client.get('v1/cryptocurrency/quotes/latest', {
        params: {
          symbol,
          convert,
        },
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Handle errors from API responses
   * @param error Error object
   */
  private handleError(error: any): Error {
    if (axios.isAxiosError(error) && error.response) {
      return new Error(`CMC API Error: ${error.response.data.status.error_message}`);
    }
    return new Error('An unexpected error occurred');
  }
}

export default CMCServices;
