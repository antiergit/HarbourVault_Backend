import UserRoute from "./user/route";
import WalletRoute from "./wallet/walletRoute";
import BtcRoute from "./btc/btcRoute";
import EthModule from "./eth/ethRoute";
import authRoute from "./auth/authRoute";
import DappRoute from "./dapp/dappRoute";
import TronRoute from "./tron/routes";
import BnbRoute from "./bsc/bscRoute";
import OnChainRoute from "./on-chain/routes";
import oxChainRoute from "./matcha/routes";
import AdminRoute from "./admin/admin.routes"
import PolRoute from "./polygon/polRoute";
import { PriceAlertRouter } from "./price_alert";

const controllers = [
  new UserRoute(),
  new WalletRoute(),
  new BtcRoute(),
  new EthModule(),
  new DappRoute(),
  new authRoute(),
  new TronRoute(),
  new BnbRoute(),
  new OnChainRoute(),
  new oxChainRoute(),
  new AdminRoute(),
  new PolRoute(),
  PriceAlertRouter
]

export default controllers;
