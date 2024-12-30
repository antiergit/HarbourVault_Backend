/**
 * App Initialization Script
 * 
 * This script is responsible for setting up the application's initial state by:
 * - Loading environment configurations.
 * - Establishing a connection to the ZooKeeper client.
 * - Importing and initializing app configurations.
 * - Handling graceful shutdown.
 */
import 'colors';
import './config/envConfig';
import { config as loadEnvConfig } from 'dotenv';
import zkClient from './connections/zookeeperClient';

/**
 * Extending the Express Request interface to include custom properties.
 */
declare module "express-serve-static-core" {
  interface Request {
    device_token: string;
    userId: number;
    coininfo: {
      token_abi?: any;
      token_address: string | null | undefined;
      decimals: number;
      is_token: number | boolean;
      token_type: string | null;
      coin_id: number;
      cmc_id?: number;
      coin_symbol: string;
      coin_family: number;
    };
    loginUserId: number;
  }
}

/**
 * Application bootstrap function.
 * Encapsulates all initialization logic within an async IIFE for better structure.
 */
(async () => {
  try {
    // Dynamically import dotenv to ensure environment variables are loaded.
    await import('dotenv');

    // Load environment variables from .env file.
    loadEnvConfig();

    console.log("Environment variables loaded.".green);

    // Establish connection to ZooKeeper client.
    await zkClient.connect();

    // Verify ZooKeeper connection status.
    const isConnected = zkClient.checkConnection();

    if (!isConnected) {
      console.warn("ZooKeeper connection failed. Initializing graceful shutdown.".yellow);

      // Handle graceful process termination on SIGINT.
      process.on('SIGINT', () => {
        console.log("SIGINT received. Closing ZooKeeper client and exiting process.".red);
        zkClient.close();
        process.exit();
      });
    }

    // Load ZooKeeper configurations.
    await zkClient.connectAndLoadConfig();

    // Dynamically import and initialize app-specific configurations.
    await import('./config/index');
    // Dynamically import and start the main application logic.
    console.log("Starting application...".yellow);
    await import('./index');
    console.log("Application started successfully.".blue);

  } catch (error) {
    // Log any errors encountered during initialization.
    console.error("Error during application initialization:", error);
  }
})();

