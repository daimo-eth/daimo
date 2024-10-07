// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.12;

import "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import "openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";

import "./TokenUtils.sol";
import "../interfaces/IDaimoPayBridger.sol";

/// @title Bridger which multiplexes between different bridging protocols
/// @author The Daimo team
/// @custom:security-contact security@daimo.com
///
/// Bridges assets from to a supported destination chain. Multiplexes between
/// different bridging protocols by destination chain.
contract DaimoPayBridger is IDaimoPayBridger {
    using SafeERC20 for IERC20;

    address public immutable owner;

    // Map chainId to the contract address of an IDaimoPayBridger implementation
    mapping(uint256 chainId => IDaimoPayBridger bridger)
        public chainIdToBridger;

    event BridgeAdded(uint256 indexed chainId, address bridger);
    event BridgeRemoved(uint256 indexed chainId);

    /// Specify owner (not msg.sender) to allow CREATE3 deployment.
    constructor(address _initialOwner) {
        owner = _initialOwner;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "DPB: caller is not the owner");
        _;
    }

    // ----- ADMIN FUNCTIONS -----

    /// Initialize. Specify the bridger implementation to use for each chain.
    function init(
        uint256[] memory _chainIds,
        IDaimoPayBridger[] memory _bridgers
    ) public onlyOwner {
        uint256 n = _chainIds.length;
        require(n == _bridgers.length, "DPB: wrong bridgers length");

        for (uint256 i = 0; i < n; ++i) {
            _addBridger(_chainIds[i], _bridgers[i]);
        }
    }

    /// Add a new bridger for a destination chain.
    function addBridger(
        uint256 chainId,
        IDaimoPayBridger bridger
    ) public onlyOwner {
        _addBridger(chainId, bridger);
    }

    function _addBridger(uint256 chainId, IDaimoPayBridger bridger) private {
        require(chainId != 0, "DPB: missing chainId");
        chainIdToBridger[chainId] = bridger;
        emit BridgeAdded(chainId, address(bridger));
    }

    function removeBridger(uint256 chainId) public onlyOwner {
        delete chainIdToBridger[chainId];
        emit BridgeRemoved(chainId);
    }

    // ----- BRIDGER FUNCTIONS -----

    function getInputToken(
        uint256 toChainId,
        address toToken
    ) public view returns (address) {
        IDaimoPayBridger bridger = chainIdToBridger[toChainId];
        require(address(bridger) != address(0), "DPB: missing bridger");

        return bridger.getInputToken(toChainId, toToken);
    }

    function getInputAmount(
        uint256 toChainId,
        address toToken,
        uint256 toAmount
    ) public view returns (uint256) {
        IDaimoPayBridger bridger = chainIdToBridger[toChainId];
        require(address(bridger) != address(0), "DPB: missing bridger");

        return bridger.getInputAmount(toChainId, toToken, toAmount);
    }

    /// Initiate a bridge to a supported destination chain.
    function sendToChain(
        uint256 toChainId,
        address toAddress,
        address toToken,
        uint256 toAmount,
        bytes calldata extraData
    ) public {
        require(toAmount > 0, "DPB: zero amount");

        if (toChainId == block.chainid) {
            // Same chain. Move tokens from caller to toAddress.
            IERC20(toToken).safeTransferFrom({
                from: msg.sender,
                to: payable(toAddress),
                value: toAmount
            });
        } else {
            // Different chains. Get the specific bridger implementation for
            // toChain (CCTP, etc)
            IDaimoPayBridger bridger = chainIdToBridger[toChainId];
            require(address(bridger) != address(0), "DPB: missing bridger");

            // Move input token from caller to this contract and initiate bridging.
            address inputToken = bridger.getInputToken(toChainId, toToken);
            require(inputToken != address(0), "DPB: missing input token");

            uint256 inputAmount = bridger.getInputAmount(
                toChainId,
                toToken,
                toAmount
            );
            IERC20(inputToken).safeTransferFrom({
                from: msg.sender,
                to: address(this),
                value: inputAmount
            });

            // Approve tokens to the bridge contract and intiate bridging.
            IERC20(inputToken).forceApprove({
                spender: address(bridger),
                value: inputAmount
            });
            bridger.sendToChain(
                toChainId,
                toAddress,
                toToken,
                toAmount,
                extraData
            );
        }
    }
}
