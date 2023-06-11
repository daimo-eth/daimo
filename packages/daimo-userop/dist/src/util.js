"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dummySignature = exports.publicClient = void 0;
const viem_1 = require("viem");
const chains_1 = require("viem/chains");
exports.publicClient = (0, viem_1.createPublicClient)({
    chain: chains_1.baseGoerli,
    transport: (0, viem_1.http)(),
});
// Random signature of correct length
exports.dummySignature = "0xdeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddead";
//# sourceMappingURL=util.js.map