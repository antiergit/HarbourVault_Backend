import { cleanEnv, str, bool } from 'envalid';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Validate the environment variables
const envConfig = cleanEnv(process.env, {
  APP_ENV: str({ choices: ['dev', 'production', 'staging'] }), // Ensures APP_ENV is either 'dev', 'production', or 'staging'
  APP_DEBUG: bool(), // Validates that APP_DEBUG is a boolean value
  ZOOKEEPER_HOST: str(), // Ensures ZOOKEEPER_HOST is a string (e.g., localhost or an IP address)
  ZOOKEEPER_PATH: str(), // Ensures ZOOKEEPER_PATH is a string (e.g., /harbour)
  ENVIRONMENT: str({ choices: ['ZOOKEEPER', 'OTHER'] }), // Ensures ENVIRONMENT is either 'ZOOKEEPER' or 'OTHER'
});

export default envConfig;
