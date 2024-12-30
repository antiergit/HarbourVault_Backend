import * as amqp from "amqplib/callback_api";
import { LogsConstants } from "../../constants/logs.constants";
import { config } from "../../config";
// import { ErrorMessages } from "../../constants";

class RabbitMq {
  public channel: amqp.Channel;

  constructor() {
    this.startServer();
  }

  public async startServer() {
    try {
      await this.connect();
    } catch (error: any) {
      console.error(error.message);
    }
  };
  async connect(): Promise<void> {
    try {
      const connectionUrl = config.RABBIT_MQ_CONN || "";
      if (!connectionUrl) {
        throw new Error("RabbitMQ connection URL is missing.");
      }

      amqp.connect(connectionUrl, (err, conn) => {
        if (err) {
          console.error("RabbitMQ connection failed:", err);
          return;
        }

        console.log("RabbitMQ connected successfully.".blue);

        conn.createChannel((err, channel) => {
          if (err) {
            console.error("Failed to create RabbitMQ channel:", err);
            return;
          }

          this.channel = channel;
          console.log("RabbitMQ channel created successfully.".blue);
        });
      });
    } catch (error) {
      console.error("RabbitMQ initialization error:", error);
    }
  }


  public async addToQueue(queueName: string, msg: Buffer) {
    this.assertQueue(queueName);
    this.sendToQueue(queueName, msg);
  };
  public async assertQueue(queueName: string) {
    this.channel.assertQueue(queueName, { durable: false }, (err, res) => {
      if (err) console.error(`${LogsConstants.ASSERT_QUEUE_FAILED} ${queueName}`);
    });
  };
  public async sendToQueue(queueName: string, msg: Buffer) {
    this.channel.sendToQueue(queueName, msg);
  };
  public async consumeQueue(
    queueName: string,
    cb: (data: any) => Promise<void>
  ) {
    this.channel.prefetch(1);
    this.channel.consume(queueName, async (msg) => {
      if (!msg) return;
      const data: any = JSON.parse(msg.content.toString());
      await cb(data);
      this.channel.ack(msg);
    });
  };
}

export default new RabbitMq();
