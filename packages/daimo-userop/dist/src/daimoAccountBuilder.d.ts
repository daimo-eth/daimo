import { UserOperationBuilder } from "userop";
import { UserOperationMiddlewareFn } from "userop";
import { SigningCallback } from "./util";
import "@ethersproject/shims";
import "text-encoding-polyfill";
export declare class DaimoAccountBuilder extends UserOperationBuilder {
    private provider;
    private entryPoint;
    private factory;
    private gasMiddleware;
    private initCode;
    address: `0x${string}`;
    private constructor();
    static init(pubKey: [`0x${string}`, `0x${string}`], paymasterMiddleware: UserOperationMiddlewareFn | undefined, signUserOperation: SigningCallback): Promise<DaimoAccountBuilder>;
    private resolveAccount;
    execute(to: `0x${string}`, value: bigint, data: `0x${string}`): this;
    executeBatch(to: Array<`0x${string}`>, data: Array<`0x${string}`>): this;
}
