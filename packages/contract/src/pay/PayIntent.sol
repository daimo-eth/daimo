// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.12;

import "openzeppelin-contracts/contracts/proxy/utils/Initializable.sol";
import "openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";

import "./TokenRefund.sol";
import "./TokenUtils.sol";
import "../interfaces/IDaimoPayBridger.sol";

/// @dev Represents an intended call: "make X of token Y show up on chain Z, then
///      use it to do an arbitrary contract call".
struct PayIntent {
    /// @dev Intent only executes on given target chain.
    uint256 toChainId;
    /// @dev Expected token after bridging to the destination chain.
    TokenAmount bridgeTokenOut;
    /// @dev Expected token amount after swapping on the destination chain.
    TokenAmount finalCallToken;
    /// @dev Destination on target chain. If dest.data != "" specifies a call,
    ///     (token, amount) is approved. Otherwise, it's transferred to dest.to
    Call finalCall;
    /// @dev Escrow contract for fast-finish. Will typically be the DaimoPay
    ///      contract.
    address payable escrow;
    /// @dev Address to refund tokens if call fails, or zero.
    address refundAddress;
    /// @dev Nonce. PayIntent receiving addresses are one-time use.
    uint256 nonce;
}

/// @dev Calculates the intent hash of a PayIntent struct
/// @param intent The PayIntent struct to hash
/// @return The keccak256 hash of the encoded PayIntent
function calcIntentHash(PayIntent calldata intent) pure returns (bytes32) {
    return keccak256(abi.encode(intent));
}

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

    /// Called on the source chain to initiate the intent. Sends funds to dest
    /// chain.
    function sendAndSelfDestruct(
        PayIntent calldata intent,
        IDaimoPayBridger bridger,
        address payable caller,
        Call[] calldata calls,
        bytes calldata bridgeExtraData
    ) public {
        require(calcIntentHash(intent) == intentHash, "PI: intent");
        require(msg.sender == intent.escrow, "PI: only escrow");
        require(intent.toChainId != block.chainid, "PI: same chain");

        // Run arbitrary calls provided by the relayer. These will generally approve
        // the swap contract and swap if necessary, then approve tokens to the
        // bridger.
        for (uint256 i = 0; i < calls.length; ++i) {
            Call calldata call = calls[i];
            (bool success, ) = call.to.call{value: call.value}(call.data);
            require(success, "PI: swap call failed");
        }

        if (intent.toChainId != block.chainid) {
            // Different chains. Get the input token and amount for the bridge
            (address inputToken, uint256 inputAmount) = bridger
                .getInputTokenAmount({
                    toChainId: intent.toChainId,
                    toToken: address(intent.bridgeTokenOut.token),
                    toAmount: intent.bridgeTokenOut.amount
                });

            // Approve bridger and initiate bridge
            IERC20(inputToken).forceApprove({
                spender: address(bridger),
                value: inputAmount
            });
            bridger.sendToChain({
                toChainId: intent.toChainId,
                toAddress: address(this),
                toToken: address(intent.bridgeTokenOut.token),
                toAmount: intent.bridgeTokenOut.amount,
                extraData: bridgeExtraData
            });

            // Refund any leftover tokens in the contract to caller
            TokenRefund.refundLeftoverTokens({
                token: IERC20(inputToken),
                recipient: caller
            });
        }

        // This use of SELFDESTRUCT is compatible with EIP-6780. Ephemeral
        // contracts are deployed, then destroyed in the same transaction.
        // solhint-disable-next-line
        selfdestruct(intent.escrow);
    }

    /// One step: receive  bridgeTokenOut and send to creator
    function receiveAndSelfDestruct(PayIntent calldata intent) public {
        require(keccak256(abi.encode(intent)) == intentHash, "PI: intent");
        require(msg.sender == intent.escrow, "PI: only creator");
        require(block.chainid == intent.toChainId, "PI: only dest chain");

        IERC20 bridgeTok = intent.bridgeTokenOut.token;
        uint256 amount = TokenUtils.getBalanceOf({
            token: bridgeTok,
            addr: address(this)
        });
        require(
            amount >= intent.bridgeTokenOut.amount,
            "PI: insufficient bridge token received"
        );

        // Send to escrow contract, which will forward to current recipient
        TokenUtils.transfer({
            token: bridgeTok,
            recipient: intent.escrow,
            amount: amount
        });

        // This use of SELFDESTRUCT is compatible with EIP-6780. Intent
        // contracts are deployed, then destroyed in the same transaction.
        // solhint-disable-next-line
        selfdestruct(intent.escrow);
    }

    /// Accept native-token (eg ETH) inputs
    receive() external payable {}
}
