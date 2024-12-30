import { DataTypes, Model } from "sequelize";
import db from "../../helpers/common/db";
import { PriceAlertTable } from "../interface";


interface PriceAlertInstance extends Model<PriceAlertTable>, PriceAlertTable {}

const table_name = 'price_alerts';

const table_data = {
  id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  coin_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  wallet_address: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  amount: {
    type: DataTypes.DOUBLE,
    allowNull: true,
  },
  percentage: {
    type: DataTypes.DOUBLE,
    allowNull: true,
  },
  fiat_currency: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  current_price: {
    type: DataTypes.DOUBLE,
    allowNull: true,
  },
  alert_type: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  status: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: true,
    validate: {},
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: true,
    validate: {},
  },
};
const tbl_price_alert = db.db_write.define<PriceAlertInstance>(table_name, table_data);

// tbl_price_alert.sync({ alter: true })
export const PriceAlerts = tbl_price_alert;

