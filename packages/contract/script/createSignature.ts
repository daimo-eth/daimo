// This script generates a signature for a user operation hash using a hardcoded
// private key.
// The signature is in the format of [r, s] and is compatible with the ERC-4337 standard.
//
// Run the script with
// `npx ts-node script/createUserOpSignature.ts`

import { Buffer } from "buffer";
import * as crypto from "crypto";
import { createPrivateKey, createPublicKey } from "crypto";
import * as readline from "readline";
import { concatBytes } from "viem";

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

function hexEncodedString(buffer: Buffer): string {
    return buffer.toString("hex").toUpperCase();
}

function fromHexEncodedString(hexString: string): Buffer | null {
    if (hexString.startsWith("0x")) hexString = hexString.slice(2);
    const hexRegex = /^[0-9a-fA-F]+$/;
    if (!hexRegex.test(hexString) || hexString.length % 2 !== 0) {
        return null;
    }
    return Buffer.from(hexString, "hex");
}

function base64ToBase64url(base64: string): string {
    return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function generateEcdsaSignature(
    pemKey: string,
    message: Buffer
): { signature: string; r: string; s: string } {
    const privateKey = crypto.createPrivateKey(pemKey);
    const signatureBuffer = crypto.sign(null, message, {
        key: privateKey,
        dsaEncoding: "ieee-p1363", // This ensures we get [r, s] format
    });

    // Convert the entire signature to hex
    const signature = signatureBuffer.toString("hex");

    // Extract r and s values
    const r = signatureBuffer.subarray(0, 32).toString("hex");
    const s = signatureBuffer.subarray(32, 64).toString("hex");

    return {
        signature,
        r,
        s,
    };
}

function promptUser(question: string): Promise<string> {
    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            resolve(answer);
        });
    });
}

// Returns challenge to sign.
async function getUserInput(): Promise<Buffer> {
    let challenge: Uint8Array;

    const opSig = await promptUser("Enter 'op' for userop, 'sig' for 1271: ");
    if (opSig === "op") {
        const validUntil = await promptUser("Enter validUntil: ");
        const userOpHash = await promptUser("Enter userOpHash: ");

        const validUntilHex = validUntil
            ? parseInt(validUntil, 10).toString(16).padStart(12, "0")
            : "000000000000";
        const validBuf = fromHexEncodedString(validUntilHex);
        const opHashBuf = fromHexEncodedString(userOpHash);
        assert(validBuf?.length === 6);
        assert(opHashBuf?.length === 32);
        challenge = concatBytes([validBuf, opHashBuf]);
    } else if (opSig === "sig") {
        const addr = await promptUser("Enter account addr: ");
        const message = await promptUser("Enter bytes32 message: ");
        const addrBuf = fromHexEncodedString(addr);
        const msgBuf = fromHexEncodedString(message);
        assert(addrBuf?.length === 20);
        assert(msgBuf?.length === 32);
        challenge = concatBytes([addrBuf, msgBuf]);
    } else {
        throw new Error("invalid input, expected op or sig");
    }

    rl.close();
    return Buffer.from(challenge);
}

function assert(condition: boolean, msg?: string): asserts condition {
    if (!condition) throw new Error(msg || "Assertion failed");
}

const pemKeyString = `-----BEGIN PRIVATE KEY-----
MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgzgqPr1Hne1iJ0M+5
skB1cD+mDR5kM4C/potmFVHn46ihRANCAARlovpE2q1G6rAnhwPttsTc9eMLiprs
Cf3HGlb1KqOS5Ep6nkYEqjaJggmZcojpAqxUSlVeS14Knv7ytZIz8/Q3
-----END PRIVATE KEY-----`;

(async () => {
    const challengeBuf = await getUserInput();

    const challengeB64 = challengeBuf.toString("base64");
    const challengeB64URL = base64ToBase64url(challengeB64);
    const clientDataJSON = `{"type":"webauthn.get","challenge":"${challengeB64URL}","origin":"https://daimo.xyz"}`;
    console.log("clientDataJSON", clientDataJSON);

    const clientDataHash = crypto
        .createHash("sha256")
        .update(clientDataJSON)
        .digest();
    const clientDataHashString = clientDataHash.toString("hex");
    console.log("SHA256 digest of clientDataJSON:", clientDataHashString);

    const authenticatorData = Buffer.alloc(37, 0);
    authenticatorData[32] = 5; // flags: user present (1) + user verified (4)
    const messageData = Buffer.concat([authenticatorData, clientDataHash]);
    console.log("Data to sign:", hexEncodedString(messageData));
    console.log(
        "SHA256 digest of data to sign:",
        crypto.createHash("sha256").update(messageData).digest("hex")
    );

    const privateKey = createPrivateKey(pemKeyString);
    const publicKey = createPublicKey(privateKey);

    // For raw public key, we need to extract it from the DER format
    const derBuffer = publicKey.export({ type: "spki", format: "der" });
    console.log("pubkey DER", derBuffer.toString("hex").toUpperCase());

    // Extract the raw public key (last 65 bytes, excluding the first byte)
    const rawPublicKey = derBuffer.subarray(-65).subarray(1);
    console.log("pubkey raw", rawPublicKey.toString("hex").toLowerCase());

    console.log("\n--------------------------");
    console.log("Generating signature...");
    const signature = generateEcdsaSignature(pemKeyString, messageData);

    const N = BigInt(
        "0xFFFFFFFF00000000FFFFFFFFFFFFFFFFBCE6FAADA7179E84F3B9CAC2FC632551"
    );
    let sBigInt = BigInt(`0x${signature.s}`);
    console.log("s:", `0x${sBigInt.toString(16).padStart(64, "0")}`);
    console.log("N/2:", `0x${(N / BigInt(2)).toString(16).padStart(64, "0")}`);

    // If s > N/2, calculate N-s to avoid malleability
    if (sBigInt > N / BigInt(2)) {
        console.log("s > N/2, adjusting...");
        sBigInt = N - sBigInt;
    }

    // Final signature
    console.log("\n--------------------------");
    console.log("Raw signature:", signature.signature);
    console.log("r:", `0x${signature.r}`);
    console.log("s:", `0x${sBigInt.toString(16).padStart(64, "0")}`);
})();
