import {
  dollarsToAmount,
  encodeRequestId,
  generateRequestId,
} from "@daimo/common";
import { NeynarAPIClient } from "@neynar/nodejs-sdk";
import dotenv from "dotenv";
import { trpcClient } from "./trpcClient";

dotenv.config();

if (!process.env.FARCASTER_ID) {
  throw new Error("FARCASTER_ID is not set");
}

const FARCASTER_ID = Number(process.env.FARCASTER_ID);
(async () => {
  //   console.log("Calling trpcClient.lookupEthereumAccountByFid.query");
  //   const data = await trpcClient.lookupEthereumAccountByFid.query({
  //     fid: FARCASTER_ID,
  //   });
  //   console.log({ data });

  console.log("Calling trpcClient.createRequestSponsored.mutate");
  const data2 = await trpcClient.createRequestSponsored.mutate({
    recipient: "0xBc229a31581231414CE41779e9dFd51E7748CC5C",
    idString: encodeRequestId(generateRequestId()),
    amount: dollarsToAmount(0.1).toString(),
  });
  console.log({ data2 });

  //     signerUuid: string, text: string, options?: {
  //     embeds?: EmbeddedCast[] | undefined;
  //     replyTo?: string | undefined;
  //     channelId?: string | undefined;
  // } | undefined
  const signerUuid = "signerUuid";
  const text = "text";
  const neynarClient = new NeynarAPIClient(process.env.NEYNAR_API_KEY || "");

  await neynarClient
    .publishCast(signerUuid, text)
    .then((data) => console.log(data))
    .catch((err) => console.error(err));

  //   //   TODO need write access to hubble instance
  //   //   cast resources:
  //   // 1. https://docs.farcaster.xyz/developers/guides/writing/casts
  //   // 2. https://github.com/farcasterxyz/hub-monorepo/blob/main/packages/hub-nodejs/examples/write-data/index.ts
  //   const ACCOUNT_PRIVATE_KEY = "privateKey"; // TODO remove
  //   const FID = -1;
  //   const ed25519Signer = new NobleEd25519Signer(
  //     Buffer.from(ACCOUNT_PRIVATE_KEY, "hex")
  //   );
  //   const FC_NETWORK = FarcasterNetwork.MAINNET;
  //   const dataOptions = {
  //     fid: FID,
  //     network: FC_NETWORK,
  //   };
  //   const castResult = await makeCastAdd(
  //     {
  //       text: "Hello, from Hubble!",
  //       embeds: [{ url: "https://daimo.com" }], // todo craft embed links https://docs.farcaster.xyz/developers/guides/writing/casts#embeds
  //       embedsDeprecated: [],
  //       mentions: [], // todo will need to do mentions in response to messages https://docs.farcaster.xyz/developers/guides/writing/casts#mentions
  //       mentionsPositions: [], // The position in bytes (not characters)
  //       //   parentUrl: "https://www.farcaster.xyz/", // todo will need to get the parent url
  //     },
  //     dataOptions,
  //     ed25519Signer
  //   );
  //   // If your client uses SSL and requires authentication.
  //   // const client = getSSLHubRpcClient(HUB_URL);
  //   //   const authMetadata = getAuthMetadata("username", "password");
  //   //   castResult.map((castAdd) => client.submitMessage(castAdd, authMetadata));
  //   castResult.map(async (castAdd) => {
  //     const messageBody = Message.toJSON(castAdd) as object;

  //     console.log("Submitting message to the gRPC server,", { messageBody });
  //     neynarClient
  //       .publishMessageToFarcaster(messageBody)
  //       .then(({ data }) => console.log(data))
  //       .catch((err) => console.error(err));
  //     // const submitResult = await client.submitMessage(castAdd);
  //     // console.log(submitResult._unsafeUnwrapErr());
  //   });
})();
