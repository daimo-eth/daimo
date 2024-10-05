// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.12;

import "account-abstraction/core/BasePaymaster.sol";

/// This paymaster sponsors userops efficiently. Normally, sponsoring paymasters
/// must sign tickets for each userop. This uses at minimum an extra 64 bytes
/// per op, nearly doubling the cost.
///
/// Here, we check tx.origin against a whitelist of bundlers, relying on the
/// bundler to validate and rate-limit transactions. No extra data needed!
///
/// The tradeoff is that sent this way are not compatible with the 4337 mempool,
/// where the ORIGIN opcode is banned. Wallets should implement as follows:
///
/// - First, try to submit an op as sponsored. If successful, great.
/// - If not--ratelimit reached, or cannot sponsor for anyy other reason--offer
///   to guarantee sending for a few-cent fee. Send to public mempool using the
///   ERC20Paymaster.
///
/// This way, we get efficient sponsored (free) transactions in the common case,
/// while still retaining strong censorship resistance for a reasonable price.
contract DaimoPaymasterV2 is BasePaymaster {
    mapping(address => bool) public bundlerWhitelist;

    uint256 private constant _POST_OP_OVERHEAD = 34982;

    event UserOperationSponsored(
        bytes32 indexed userOpHash,
        uint256 requiredPreFund
    );

    constructor(
        IEntryPoint _entryPoint,
        address _owner
    ) BasePaymaster(_entryPoint) {
        transferOwnership(_owner);
    }

    function setBundlerWhitelist(
        address[] calldata addresses,
        bool isWhitelisted
    ) public onlyOwner {
        for (uint256 i = 0; i < addresses.length; i++) {
            bundlerWhitelist[addresses[i]] = isWhitelisted;
        }
    }

    function _validatePaymasterUserOp(
        PackedUserOperation calldata /* userOp */,
        bytes32 userOpHash,
        uint256 requiredPreFund
    ) internal override returns (bytes memory context, uint256 validationData) {
        // Rely on bundler to provide
        bool isWhitelisted = bundlerWhitelist[tx.origin];
        require(isWhitelisted, "DaimoPaymaster: non-whitelisted tx.origin");

        emit UserOperationSponsored(userOpHash, requiredPreFund);
        return ("", 0);
    }

    function _min(uint256 a, uint256 b) internal pure returns (uint256) {
        return a < b ? a : b;
    }
}
