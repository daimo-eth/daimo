import {
  AppClient,
  createAppClient,
  viemConnector,
} from "@farcaster/auth-client";

class FarcasterConnector {
  appClient: AppClient | undefined;

  private init(): AppClient {
    if (this.appClient != null) return this.appClient;

    console.log(`[FARCASTER] initializing`);
    this.appClient = createAppClient({
      relay: "https://relay.farcaster.xyz",
      ethereum: viemConnector({
        rpcUrl: "https://mainnet.optimism.io",
      }),
    });

    return this.appClient;
  }

  async connect() {
    const appClient = this.init();

    const { data } = await appClient.createChannel({
      siweUri: "https://daimo.com/connect/farcaster",
      domain: "daimo.com",
    });

    const status = await appClient.watchStatus({
      channelToken,
    });

    // Example response:
    // {
    //   "state": "completed",
    //   "nonce": "AMXoFHQLhxFUMhIFI",
    //   "message": "daimo.com wants you to sign in with your Ethereum account:\n0x3c4a60a928aBCc556250E5aE36dc587231e6B7e8\n\nFarcaster Connect\n\nURI: https://daimo.com/connect/farcaster\nVersion: 1\nChain ID: 10\nNonce: AMXoFHQLhxFUMhIFI\nIssued At: 2024-02-16T20:55:27.360Z\nResources:\n- farcaster://fid/56",
    //   "signature": "0x74f54cc5f10d4abc7d4b4e6a410dc9ceb208923ae48763564ae7236b2c5a356c6a52de6c3b4cb42080483cc5f2c071e88b0f043d1a205428edce26689cf722a21b",
    //   "fid": 56,
    //   "username": "dcposch.eth",
    //   "displayName": "dcposch.eth",
    //   "bio": "real world ethereum\ngithub.com/daimo-eth/daimo",
    //   "pfpUrl": "https://i.seadn.io/gae/JUbGP1Idb08BeW4f7PQ3hp5PVk8DRCqzlh5ygxHdoSCUWMSNplJxoZBUJkMlPXx7FacPo3V2GA0SwD9NmBzekGejaNpCr9HJ_cwUlZI?w=500&auto=format",
    //   "custody": "0x3c4a60a928aBCc556250E5aE36dc587231e6B7e8",
    //   "verifications": [
    //     "0xc60a0a0e8bbc32dac2e03030989ad6bee45a874d"
    //   ]
    // }
  }
}
