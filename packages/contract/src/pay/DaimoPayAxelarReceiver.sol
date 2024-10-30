// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.12;

import "openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";

import "../../vendor/axelar/AxelarExecutableWithToken.sol";

/// @title Receiver contract for Axelar Protocol
/// @author The Daimo team
/// @custom:security-contact security@daimo.com
///
/// @dev Receives assets on the destination chain and transfers them to the
/// intended recipient. Axelar's 
contract DaimoPayAxelarReceiver is AxelarExecutableWithToken {
    using SafeERC20 for IERC20;

    constructor(address _gateway) AxelarExecutableWithToken(_gateway) {}

    function _execute(
        bytes32 /* commandId */,
        string calldata /* sourceChain */,
        string calldata /* sourceAddress */,
        bytes calldata /* payload */
    ) internal pure override {
        revert("DPAxR: _execute not supported");
    }

    /**
     * @notice logic to be executed on dest chain
     * @dev this is triggered automatically by relayer
     * @param payload encoded gmp message sent from src chain
     * @param tokenSymbol symbol of token sent from src chain
     * @param amount amount of tokens sent from src chain
     */
    function _executeWithToken(
        bytes32 /* commandId */,
        string calldata /* sourceChain */,
        string calldata /* sourceAddress */,
        bytes calldata payload,
        string calldata tokenSymbol,
        uint256 amount
    ) internal override {
        address recipient = abi.decode(payload, (address));
        address tokenAddress = gatewayWithToken().tokenAddresses(tokenSymbol);

        IERC20(tokenAddress).safeTransfer(recipient, amount);
    }
}
