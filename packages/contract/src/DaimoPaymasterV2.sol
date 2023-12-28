// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.12;

import "account-abstraction/core/BasePaymaster.sol";

import "./DaimoAccount.sol";

/// Coinbase MetaPaymaster
/// See https://github.com/base-org/paymaster/pull/22
interface IMetaPaymaster {
    function fund(address target, uint256 amount) external;
}

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
    IMetaPaymaster public immutable metaPaymaster;

    uint256 private constant POST_OP_OVERHEAD = 34982;

    event UserOperationSponsored(
        bytes32 indexed userOpHash,
        uint256 requiredPreFund
    );

    constructor(
        IEntryPoint _entryPoint,
        address _owner,
        IMetaPaymaster _metaPaymaster
    ) BasePaymaster(_entryPoint) {
        transferOwnership(_owner);
        metaPaymaster = _metaPaymaster;
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
        UserOperation calldata userOp,
        bytes32 userOpHash,
        uint256 requiredPreFund
    ) internal override returns (bytes memory context, uint256 validationData) {
        // Rely on bundler to provide
        bool isWhitelisted = bundlerWhitelist[tx.origin];
        require(isWhitelisted, "DaimoPaymaster: non-whitelisted tx.origin");

        emit UserOperationSponsored(userOpHash, requiredPreFund);
        return (
            abi.encode(userOp.maxFeePerGas, userOp.maxPriorityFeePerGas),
            0
        );
    }

    // From https://github.com/base-org/paymaster/pull/22
    function _postOp(
        PostOpMode mode,
        bytes calldata context,
        uint256 actualGasCost
    ) internal override {
        if (mode == PostOpMode.postOpReverted) {
            return;
        }
        (uint256 maxFeePerGas, uint256 maxPriorityFeePerGas) = abi.decode(
            context,
            (uint256, uint256)
        );
        uint256 gasPrice = min(
            maxFeePerGas,
            maxPriorityFeePerGas + block.basefee
        );
        metaPaymaster.fund(
            address(this),
            actualGasCost + POST_OP_OVERHEAD * gasPrice
        );
    }

    function min(uint256 a, uint256 b) internal pure returns (uint256) {
        return a < b ? a : b;
    }
}
