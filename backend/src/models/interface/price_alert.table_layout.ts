export interface PriceAlertTable {
   id?: number,
   user_id: number,
   coin_id: number,
   wallet_address?: string,
   amount: number,
   percentage?: number,
   fiat_currency: number
   current_price: number
   alert_type: string
   status: string,
   created_at?: string,
   updated_at?: string
}