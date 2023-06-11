import { Client } from "userop";
import { DaimoAccountBuilder } from "./daimoAccountBuilder";
import { SigningCallback } from "./util";
export { SigningCallback } from "./util";
import "@ethersproject/shims";
import "text-encoding-polyfill";
export declare class DaimoAccount {
    private dryRun;
    private client;
    private daimoAccountBuilder;
    constructor(_dryRun: boolean, _client: Client, _daimoAccountBuilder: DaimoAccountBuilder);
    static init(derPublicKey: string, signer: SigningCallback, dryRun: boolean): Promise<DaimoAccount>;
    getAddress(): `0x${string}`;
    transfer(to: `0x${string}`, amount: `${number}`): Promise<string | undefined>;
    private parseErc20Amount;
    erc20transfer(tokenAddress: `0x${string}`, to: `0x${string}`, amount: `${number}`): Promise<string | undefined>;
    erc20approve(tokenAddress: `0x${string}`, spender: `0x${string}`, amount: `${number}`): Promise<string | undefined>;
}
