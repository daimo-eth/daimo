import EventEmitter from "node:events";
import { Client, ClientConfig } from "pg";

export const DB_EVENT_NEW_BLOCK = "indexdb-new-block";

const IGNORED_EVENTS = new Set(["newListener", "removeListener"]);

/**
 * Connects to IndexDB and emits LISTEN/NOTIFY events.
 */
export class DBNotifier extends EventEmitter {
  /// Postgres client
  client: Client;
  /// Postgres notification channels that we are listening to.
  channels: Set<string>;
  isConnected = false;

  constructor(config: ClientConfig) {
    super();
    this.client = new Client(config);
    this.channels = new Set();

    this.on("newListener", (event) => {
      if (IGNORED_EVENTS.has(event)) {
        return;
      }

      if (!this.channels.has(event)) {
        this.addChannel(event);
      }
    });

    this.on("removeListener", (event) => {
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

  private async setupListener() {
    if (this.isConnected) {
      return;
    }

    this.client.on("notification", (msg) => {
      console.log(`[DB] notify ${msg.channel} ${msg.payload}`);
      this.emit(msg.channel, msg.payload);
    });

    await this.client.connect();

    this.isConnected = true;
  }

  private async addChannel(channel: string) {
    if (!this.isConnected) {
      await this.setupListener();
    }

    if (!this.channels.has(channel)) {
      this.channels.add(channel);
      try {
        console.log(`[DB] notifications: listen ${channel}`);
        await this.client.query(`LISTEN "${channel}"`);
      } catch (e) {
        this.channels.delete(channel);
        throw e;
      }
    }
  }

  private async removeChannel(channel: string) {
    if (this.channels.has(channel)) {
      console.log(`[DB] notifications: unlisten ${channel}`);
      await this.client.query(`UNLISTEN "${channel}"`);
      this.channels.delete(channel);
    }
  }
}
