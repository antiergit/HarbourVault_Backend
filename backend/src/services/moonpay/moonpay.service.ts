import axios, { AxiosInstance } from 'axios';

class MoonpayService {
  private apiKey: string;
  private baseURL: string;
  private httpClient: AxiosInstance;

  constructor(apiKey: string, baseURL: string = 'https://api.moonpay.io/v3') {
    this.apiKey = apiKey;
    this.baseURL = baseURL;
    this.httpClient = axios.create({
      baseURL: this.baseURL,
      params: {
        apiKey: this.apiKey,
      },
    });
  }

  /**
   * Buy crypto.
   * @param {Object} data - Data for the buy request.
   * @returns {Promise<any>} - Response from the Moonpay API.
   */
  async buyCrypto(data: {
    cryptoCurrency: string;
    fiatCurrency: string;
    fiatAmount: number;
    walletAddress: string;
    customerEmail: string;
  }): Promise<any> {
    try {
      const response = await this.httpClient.post('/transactions', {
        cryptoCurrency: data.cryptoCurrency,
        fiatCurrency: data.fiatCurrency,
        fiatAmount: data.fiatAmount,
        walletAddress: data.walletAddress,
        customerEmail: data.customerEmail,
      });
      return response.data;
    } catch (error: any) {
      this.handleError(error);
    }
  }

  /**
   * Sell crypto.
   * @param {Object} data - Data for the sell request.
   * @returns {Promise<any>} - Response from the Moonpay API.
   */
  async sellCrypto(data: {
    cryptoCurrency: string;
    cryptoAmount: number;
    walletAddress: string;
    bankAccount: string;
  }): Promise<any> {
    try {
      const response = await this.httpClient.post('/sell_transfers', {
        cryptoCurrency: data.cryptoCurrency,
        cryptoAmount: data.cryptoAmount,
        walletAddress: data.walletAddress,
        bankAccount: data.bankAccount,
      });
      return response.data;
    } catch (error: any) {
      this.handleError(error);
    }
  }

  /**
   * Handle errors from API requests.
   * @param {any} error - The error object.
   */
  private handleError(error: any): void {
    if (error.response) {
      console.error('Error Response:', error.response.data);
      throw new Error(`API Error: ${error.response.data.message || 'Unknown error'}`);
    } else if (error.request) {
      console.error('Error Request:', error.request);
      throw new Error('No response received from the API.');
    } else {
      console.error('Error Message:', error.message);
      throw new Error(`Unexpected Error: ${error.message}`);
    }
  }
}

export default MoonpayService;

// Example usage:
// const moonpay = new MoonpayService('your-api-key');
// moonpay.buyCrypto({
//   cryptoCurrency: 'BTC',
//   fiatCurrency: 'USD',
//   fiatAmount: 100,
//   walletAddress: 'your-wallet-address',
//   customerEmail: 'customer@example.com',
// }).then(console.log).catch(console.error);
