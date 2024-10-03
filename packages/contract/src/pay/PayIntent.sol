// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.12;

import "openzeppelin-contracts/contracts/proxy/utils/Initializable.sol";
import "openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";

import "./TokenUtils.sol";
import "../interfaces/IDaimoBridger.sol";

/// @dev Asset amount, eg $100 USDC or 0.1 ETH
struct TokenAmount {
    /// @dev Zero address = native asset, eg ETH
    IERC20 addr;
    uint256 amount;
}

/// @dev Represents a destination address + optional arbitrary contract call
struct Call {
    /// @dev Destination receiving address or contract
    address to;
    /// @dev Native token amount for call, or 0
    uint256 value;
    /// @dev Calldata for call, or empty = no contract call
    bytes data;
}

/// @dev Represents an intended call: "make X of token Y show up on chain Z, then
///      use it to do an arbitrary contract call".
struct PayIntent {
    /// @dev Intent only executes on given target chain.
    uint256 chainId;
    /// @dev Expected token after bridging to the destination chain.
    TokenAmount bridgeToken;
    /// @dev Expected token amount after swapping on the destination chain.
    TokenAmount finalCallToken;
    /// @dev Destination on target chain. If dest.data != "" specifies a call,
    ///     (token, amount) is approved. Otherwise, it's transferred to dest.to
    Call finalCall;
    /// @dev Escrow contract for fast-finish.
    address escrow;
    /// @dev Address to refund tokens if call fails, or zero.
    address refundAddress;
    /// @dev Nonce. PayIntent receiving addresses are one-time use.
    uint256 nonce;
}

IDaimoBridger bridger = IDaimoBridger(address(0)); // TODO

/// @dev This is an ephemeral intent contract. Any supported tokens sent to this
///      address on any supported chain are forwarded, via a combination of
///      bridging and swapping, into a specified call on a destination chain.
contract PayIntentContract is Initializable {
    using SafeERC20 for IERC20;

    /// @dev Save gas by minimizing storage to a single word. This makes intents
    ///      usable on L1. intentHash = keccak(abi.encode(PayIntent))
    bytes32 intentHash;

    /// @dev Runs at deploy time. Singleton implementation contract = no init,
    ///      no state. All other methods are called via proxy.
    constructor() {
        _disableInitializers();
    }

    function initialize(bytes32 _intentHash) public initializer {
        intentHash = _intentHash;
    }

    /// Can only be called on foreign chains. Sends funds to dest chain.
    function sendAndSelfDestruct(
        PayIntent calldata intent,
        Call[] calldata swapCalls,
        bytes calldata bridgeExtraData
    ) public {
        require(msg.sender == intent.escrow, "FCCTP: only escrow");
        require(block.chainid != intent.chainId, "FCCTP: only foreign chain");
        require(keccak256(abi.encode(intent)) == intentHash, "FCCTP: intent");

        // Run arbitrary calls provided by the LP. These will generally swap if
        // necessary, then approve tokens to the bridger.
        for (uint256 i = 0; i < swapCalls.length; ++i) {
            Call calldata call = swapCalls[i];
            (bool success, ) = call.to.call{value: call.value}(call.data);
            require(success, "FCCTP: swap call failed");
        }

        // Bridge (via CCTP, etc)
        bridger.sendToChain({
            toChainId: intent.chainId,
            toAddress: address(this),
            toToken: address(intent.bridgeToken.addr),
            toAmount: intent.bridgeToken.amount,
            extraData: bridgeExtraData
        });

        // This use of SELFDESTRUCT is compatible with EIP-6780. Ephemeral
        // contracts are deployed, then destroyed in the same transaction.
        // solhint-disable-next-line
        selfdestruct(creator);
    }

    /// One step: receive mintToken and send to creator
    function receiveAndSelfDestruct(PayIntent calldata intent) public {
        require(msg.sender == creator, "FCCTP: only creator");
        require(block.chainid == intent.chainId, "FCCTP: only dest chain");
        require(keccak256(abi.encode(intent)) == intentHash, "FCCTP: intent");

        IERC20 bridgeTok = intent.bridgeToken.addr;
        uint256 amount = TokenUtils.getBalanceOf(bridgeTok, address(this));
        require(
            amount >= intent.bridgeToken.amount,
            "FCCTP: insufficient bridge token received"
        );

        // Send to escrow contract, which will forward to current recipient
        TokenUtils.transfer(intent.bridgeToken.addr, intent.escrow, amount);

        // This use of SELFDESTRUCT is compatible with EIP-6780. Handoff
        // contracts are deployed, then destroyed in the same transaction.
        // solhint-disable-next-line
        selfdestruct(intent.escrow);
    }

    /// Accept native-token (eg ETH) inputs
    fallback() external payable {}
}
