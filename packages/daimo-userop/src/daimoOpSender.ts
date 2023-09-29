import { assert, derKeytoContractFriendlyKey } from "@daimo/common";
import * as Contracts from "@daimo/contract";
import { BundlerJsonRpcProvider, Constants, Utils } from "userop";
import {
  Address,
  Hex,
  encodeFunctionData,
  getAddress,
  isHex,
  parseUnits,
} from "viem";

import { DaimoOpBuilder, DaimoOpMetadata } from "./daimoOpBuilder";
import { SigningCallback } from "./signingCallback";
import config from "../config.json";

// DaimoOpSender is a wrapper that simplifies making user ops on behalf of a Daimo account.
export class DaimoOpSender {
  /** Connection to the chain */
  private provider: BundlerJsonRpcProvider;

  private opBuilder: DaimoOpBuilder;

  private tokenAddress: Address;
  private tokenDecimals: number;

  private notesAddress: `0x${string}`;

  constructor(
    _opBuilder: DaimoOpBuilder,
    _tokenAddress: `0x${string}`,
    _tokenDecimals: number,
    _notesAddress: `0x${string}`
  ) {
    this.provider = new BundlerJsonRpcProvider(config.bundlerRpcUrl);
    this.opBuilder = _opBuilder;

    this.tokenAddress = _tokenAddress;
    this.tokenDecimals = _tokenDecimals;

    this.notesAddress = _notesAddress;
  }

  public static async init(
    deployedAddress: Address,
    signer: SigningCallback
  ): Promise<DaimoOpSender> {
    const daimoBuilder = await DaimoOpBuilder.init(deployedAddress, signer);

    console.log(
      `[OP] init. token ${Contracts.tokenMetadata.address}, decimals ${Contracts.tokenMetadata.decimals}`
    );

    return new DaimoOpSender(
      daimoBuilder,
      Contracts.tokenMetadata.address,
      Contracts.tokenMetadata.decimals,
      Contracts.ephemeralNotesAddress
    );
  }

  public getAddress(): Address {
    return getAddress(this.opBuilder.getSender());
  }

  /** Submits a user op to bundler. Returns userOpHash. */
  public async sendUserOp(opBuilder: DaimoOpBuilder): Promise<Hex> {
    const builtOp = await opBuilder.buildOp(
      Constants.ERC4337.EntryPoint,
      Contracts.tokenMetadata.chainId
    );

    console.log("[OP] built userOp:", builtOp);

    const res: Hex = await this.provider.send("eth_sendUserOperation", [
      Utils.OpToJSON(builtOp),
      Constants.ERC4337.EntryPoint,
    ]);
    assert(isHex(res));

    console.log(`[OP] submitted userOpHash: ${res}`);

    return res;
  }

  /** Adds an account signing key. Returns userOpHash. */
  public async addSigningKey(
    slot: number,
    derPublicKey: Hex,
    opMetadata: DaimoOpMetadata
  ) {
    const contractFriendlyKey = derKeytoContractFriendlyKey(derPublicKey);

    const op = this.opBuilder.executeBatch(
      [
        {
          dest: this.getAddress(),
          value: 0n,
          data: encodeFunctionData({
            abi: Contracts.daimoAccountABI,
            functionName: "addSigningKey",
            args: [slot, contractFriendlyKey],
          }),
        },
      ],
      opMetadata
    );

    return this.sendUserOp(op);
  }

  /** Removes an account signing key. Returns userOpHash. */
  public async removeSigningKey(slot: number, opMetadata: DaimoOpMetadata) {
    const op = this.opBuilder.executeBatch(
      [
        {
          dest: this.getAddress(),
          value: 0n,
          data: encodeFunctionData({
            abi: Contracts.daimoAccountABI,
            functionName: "removeSigningKey",
            args: [slot],
          }),
        },
      ],
      opMetadata
    );

    return this.sendUserOp(op);
  }

  /** Sends an ERC20 transfer. Returns userOpHash. */
  public async erc20transfer(
    to: Address,
    amount: `${number}`, // in the native unit of the token
    opMetadata: DaimoOpMetadata
  ) {
    const parsedAmount = parseUnits(amount, this.tokenDecimals);
    console.log(`[OP] transfer ${parsedAmount} ${this.tokenAddress} to ${to}`);

    const op = this.opBuilder.executeBatch(
      [
        {
          dest: this.tokenAddress,
          value: 0n,
          data: encodeFunctionData({
            abi: Contracts.erc20ABI,
            functionName: "transfer",
            args: [to, parsedAmount],
          }),
        },
      ],
      opMetadata
    );

    return this.sendUserOp(op);
  }

  /** Creates an ephemeral note with given value. Returns userOpHash. */
  public async createEphemeralNote(
    ephemeralOwner: `0x${string}`,
    amount: `${number}`,
    opMetadata: DaimoOpMetadata
  ) {
    const parsedAmount = parseUnits(amount, this.tokenDecimals);
    console.log(`[OP] create ${parsedAmount} note for ${ephemeralOwner}`);

    const op = this.opBuilder.executeBatch(
      [
        {
          dest: this.notesAddress,
          value: 0n,
          data: encodeFunctionData({
            abi: Contracts.ephemeralNotesABI,
            functionName: "createNote",
            args: [ephemeralOwner, parsedAmount],
          }),
        },
      ],
      opMetadata
    );

    return this.sendUserOp(op);
  }

  /** Claims an ephemeral note. Returns userOpHash. */
  public async claimEphemeralNote(
    ephemeralOwner: `0x${string}`,
    signature: `0x${string}`,
    opMetadata: DaimoOpMetadata
  ) {
    console.log(`[OP] claim ephemeral note ${ephemeralOwner}`);

    const op = this.opBuilder.executeBatch(
      [
        {
          dest: this.notesAddress,
          value: 0n,
          data: encodeFunctionData({
            abi: Contracts.ephemeralNotesABI,
            functionName: "claimNote",
            args: [ephemeralOwner, signature],
          }),
        },
      ],
      opMetadata
    );

    return this.sendUserOp(op);
  }
}
