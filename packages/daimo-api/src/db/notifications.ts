import { Client, ClientConfig } from "pg";
import EventEmitter from "node:events";

/**
 * Connects to Postgres and emits LISTEN/NOTIFY events.
 */
export class DBNotifications extends EventEmitter {
  client: Client;
  channels: Set<string>;
  isConnected = false;

  constructor(config: ClientConfig) {
    super();
    this.client = new Client(config);
    this.channels = new Set();

    this.on("newListener", (event, listener) => {
      if (!this.channels.has(event)) {
        this.#addChannel(event);
      }
    });

    this.on("removeListener", (event, listener) => {
      if (this.listenerCount(event) === 0) {
        this.#removeChannel(event);
      }
    });
  }

  async close() {
    if (this.client) {
      await this.client.end();

      this.channels.clear();
    }
  }

  async #setupListener() {
    if (!this.isConnected) {
      await this.client.connect();
    }

    this.client.on("notification", (msg) => {
      this.emit(msg.channel, msg.payload);
    });
  }

  async #addChannel(channel: string) {
    if (!this.client) {
      await this.#setupListener();
    }

    if (!this.channels.has(channel)) {
      await this.client.query(`LISTEN ${channel}`);
      this.channels.add(channel);
    }
  }

  async #removeChannel(channel: string) {
    if (this.channels.has(channel)) {
      await this.client.query(`UNLISTEN ${channel}`);
      this.channels.delete(channel);
    }
  }
}
