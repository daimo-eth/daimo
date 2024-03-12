import dotenv from "dotenv";
import axios from "axios";
import { mnemonicToAccount } from "viem/accounts";
import { assert } from "@daimo/common";

// Codified version of steps in this guide:
// https://docs.neynar.com/docs/write-to-farcaster-with-neynar-managed-signers

// Step 0: Initial setup
// ! TODO: set up 1) FARCASTER_SEED_PHRASE, 2) FARCASTER_ID, 3) NEYNAR_API_KEY in .env
// Get FARCASTER_SEED_PHRASE from Warpcast on mobile app: Settings -> Advanced -> Reveal recovery phrase
// Get FARCASTER_ID from Warpcast on profile page -> About -> FID

dotenv.config();
assert(
  !!process.env.FARCASTER_SEED_PHRASE,
  "FARCASTER_SEED_PHRASE is not defined"
);
const FARCASTER_SEED_PHRASE = process.env.FARCASTER_SEED_PHRASE;
assert(!!process.env.FARCASTER_ID, "FARCASTER_ID is not defined");
const FARCASTER_ID = process.env.FARCASTER_ID;
const NEYNAR_BASE_URL = "https://api.neynar.com/v2/farcaster";

const generateSignature = async (publicKey: string) => {
  // DO NOT CHANGE ANY VALUES IN THIS CONSTANT
  const SIGNED_KEY_REQUEST_VALIDATOR_EIP_712_DOMAIN = {
    name: "Farcaster SignedKeyRequestValidator",
    version: "1",
    chainId: 10,
    verifyingContract:
      "0x00000000fc700472606ed4fa22623acf62c60553" as `0x${string}`,
  };

  // DO NOT CHANGE ANY VALUES IN THIS CONSTANT
  const SIGNED_KEY_REQUEST_TYPE = [
    { name: "requestFid", type: "uint256" },
    { name: "key", type: "bytes" },
    { name: "deadline", type: "uint256" },
  ];

  const account = mnemonicToAccount(FARCASTER_SEED_PHRASE);

  const deadline = Math.floor(Date.now() / 1000) + 86400; // t + 1 day

  const signature = await account.signTypedData({
    domain: SIGNED_KEY_REQUEST_VALIDATOR_EIP_712_DOMAIN,
    types: {
      SignedKeyRequest: SIGNED_KEY_REQUEST_TYPE,
    },
    primaryType: "SignedKeyRequest",
    message: {
      requestFid: BigInt(FARCASTER_ID),
      key: publicKey,
      deadline: BigInt(deadline),
    },
  });
  return { deadline, signature };
};

type SignedKeyData = {
  signer_uuid: string;
  public_key: string;
  status: string;
  signer_approval_url?: string;
  fid?: number;
};

(async () => {
  // Step 1: Create a signer
  const createSignerResponse = await axios.post(
    `${NEYNAR_BASE_URL}/signer`,
    {},
    {
      headers: {
        api_key: process.env.NEYNAR_API_KEY,
      },
    }
  );

  //   Step 2: Generate a signature
  const { deadline, signature } = await generateSignature(
    createSignerResponse.data.public_key
  );

  //   Step 3: Register signed key
  const signedKeyResponse = await axios.post(
    `${NEYNAR_BASE_URL}/signer/signed_key`,
    {
      signer_uuid: createSignerResponse.data.signer_uuid,
      app_fid: FARCASTER_ID,
      deadline,
      signature,
    },
    {
      headers: {
        api_key: process.env.NEYNAR_API_KEY,
      },
    }
  );
  const data: SignedKeyData = signedKeyResponse.data;
  console.log(data);

  //   Result will look something like:
  //   data: {
  //     signer_uuid: '<uuid>',
  //     public_key: '0x...',
  //     status: 'pending_approval',
  //     signer_approval_url: 'https://client.warpcast.com/deeplinks/signed-key-request?token=0x...'
  //   }

  //   Steps 4, 5, 6:
  // ! TODO: Run this file via `npm i; npx ts-node src/registerNeynarSigner.ts`
  // ! open the signer approval url from output, and approve.
  // Record the signer_uuid
  // Afterwards, daimobot is now registered with Neynar API and is able to cast programmatically

  // (Optional) Step 7: Send a test cast
  // SAMPLE:

  //   curl --request POST \
  //      --url https://api.neynar.com/v2/farcaster/cast \
  //      --header 'accept: application/json' \
  //!      --header 'api_key: <ENTER_API_KEY_HERE>' \
  //      --header 'content-type: application/json' \
  //      --data '
  // {
  //!   "signer_uuid": "<ENTER_SIGNER_UUID_HERE>",
  //   "text": "*Ahem* \n\n gm from daimobot 🪐"
  // }
})();
