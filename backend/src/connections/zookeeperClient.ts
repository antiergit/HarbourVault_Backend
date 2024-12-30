import * as zookeeper from 'node-zookeeper-client';

/**
 * ZooKeeperClient
 * A class for managing connections and operations with a ZooKeeper server.
 * @author akhil choudhary
 */
class ZooKeeperClient {
    private client: zookeeper.Client; // The ZooKeeper client instance
    private isConnected: boolean = false; // Connection status flag
    public config: any = {}; // Configuration data fetched from ZooKeeper
    private zkPATH: string = process.env.ZOOKEEPER_PATH || 'harbour-vault'; // ZooKeeper path to configuration

    /**
     * Constructor
     * Initializes the ZooKeeper client and sets up event listeners for connection and disconnection.
     * 
     * @param connectionString - The connection string for the ZooKeeper server.
     */
    constructor(private connectionString: string) {
        this.client = zookeeper.createClient(this.connectionString);

        // Event listener for successful connection
        this.client.on('connected', () => {
            console.log('ZooKeeper client connected.'.blue);
            this.isConnected = true;
        });

        // Event listener for disconnection
        this.client.on('disconnected', () => {
            console.log('ZooKeeper client disconnected.');
            this.isConnected = false;
        });
    }

    /**
     * Connect to ZooKeeper
     * Establishes a connection to the ZooKeeper server and waits for the connection to be established.
     * 
     * @returns A promise that resolves when the connection is successful or rejects on error.
     */
    public async connect(): Promise<void> {
        console.log('Connecting to ZooKeeper...');
        return new Promise((resolve, reject) => {
            this.client.connect(); // Initiates the connection
            this.client.once('connected', resolve); // Resolves on successful connection
            this.client.once('error', reject); // Rejects on connection error
            setTimeout(() => {
                if (!this.isConnected) {
                    console.error('ZooKeeper connection timeout.'.red);
                    this.client.close(); // Close the client to prevent hanging
                    reject(new Error('ZooKeeper connection timeout.'));
                }
            }, 10000); // Timeout duration in milliseconds (e.g., 10 seconds)
        });
    }

    /**
     * Check Connection Status
     * 
     * @returns A boolean indicating if the client is connected to ZooKeeper.
     */
    public checkConnection(): boolean {
        return this.isConnected;
    }

    /**
     * Close the Connection
     * Closes the connection to the ZooKeeper server.
     */
    public close(): void {
        console.log('Closing ZooKeeper client...');
        this.client.close();
    }

    /**
     * Connect and Load Configuration
     * Connects to the ZooKeeper server and retrieves the configuration from the specified path.
     * 
     * @returns A promise that resolves with the parsed configuration object or null if no data is found.
     * @throws An error if the client is not connected or if fetching/parsing the data fails.
     */
    public async connectAndLoadConfig(): Promise<Record<string, any> | null> {
        return new Promise((resolve, reject) => {
            // Ensure the client is connected before attempting to fetch data
            if (!this.isConnected) {
                return reject(new Error('ZooKeeper client is not connected.'));
            }

            console.log('Fetching configuration from ZooKeeper...'.yellow);

            // Fetch data from the specified ZooKeeper path
            this.client.getData(this.zkPATH, (err, data) => {
                if (err) {
                    console.error('Error fetching configuration:', err);
                    return reject(err);
                }

                try {
                    // Parse the retrieved data as JSON
                    const config = data ? JSON.parse(data.toString('utf8')) : null;
                    this.config = config; // Store the configuration
                    console.log('Configuration loaded'.yellow);
                    resolve(config);
                } catch (parseError) {
                    console.error('Error parsing configuration:', parseError);
                    reject(parseError);
                }
            });
        });
    }
}

// Instantiate the ZooKeeperClient with the server address from environment variables or a default value
const zkClient = new ZooKeeperClient(process.env.ZOOKEEPER_HOST || 'localhost:2181');

// Export the ZooKeeper client instance for use in other parts of the application
export default zkClient;
