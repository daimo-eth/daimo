import EventEmitter from "node:events";
import { Client, ClientConfig } from "pg";
import { chainConfig } from "../env";

export const DB_EVENT_DAIMO_TRANSFERS =
  chainConfig.daimoChain + "-daimo-transfers";

const IGNORED_EVENTS = new Set(["newListener", "removeListener"]);

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
      if (IGNORED_EVENTS.has(event)) {
        return;
      }

      if (!this.channels.has(event)) {
        this.addChannel(event);
      }
    });

    this.on("removeListener", (event, listener) => {
      if (IGNORED_EVENTS.has(event)) {
        return;
      }

      if (this.listenerCount(event) === 0) {
        this.removeChannel(event);
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
    if (this.isConnected) {
      return;
    }

    this.client.on("notification", (msg) => {
      this.emit(msg.channel, msg.payload);
    });

    await this.client.connect();

    this.isConnected = true;
  }

  private async addChannel(channel: string) {
    if (!this.isConnected) {
      await this.#setupListener();
    }

    if (!this.channels.has(channel)) {
      this.channels.add(channel);

      try {
        await this.client.query(`LISTEN "${channel}"`);
      } catch (e) {
        this.channels.delete(channel);

        throw e;
      }
    }
  }

  private async removeChannel(channel: string) {
    if (this.channels.has(channel)) {
      await this.client.query(`UNLISTEN "${channel}"`);
      this.channels.delete(channel);
    }
  }
}
