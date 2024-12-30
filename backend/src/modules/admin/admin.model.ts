import { DataTypes, Model, Optional } from "sequelize";
import db from "../../helpers/common/db";

// Define the interface for the Admin model fields
interface AdminInterface {
  id: number;
  username: string;
  email: string;
  password: string;
  role: string;
  status: number;
  createdAt?: Date;
  updatedAt?: Date;
}

// Optional fields during creation (e.g., `id`, `createdAt`, `updatedAt`)
interface AdminCreationModel extends Optional<AdminInterface, "id" | "createdAt" | "updatedAt"> {}

// Extend Model for type safety
interface AdminInstance
  extends Model<AdminInterface, AdminCreationModel>,
  AdminInterface {}

// Define the Admin table schema
const adminSchema = {
  id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true,
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isEmail: true,
    },
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  role: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: "admin",
  },
  status: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 1, // Active by default
  },
  isTwoFAEnabled: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: 0, // Active by default 
  },
  twoFASecret: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  otpCode: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  ivHex: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  maintenanceMode: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: 0, // Active by default 
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: DataTypes.NOW,
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
};

// Define the Admin model
const AdminModel = db.db_write.define<AdminInstance>("admin", adminSchema, {
  tableName: "admins", // Name of the database table
  timestamps: true,    // Enable timestamps for createdAt and updatedAt
});

export default AdminModel;
