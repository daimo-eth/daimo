// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.12;

import "@uniswap/v3-periphery/contracts/libraries/TransferHelper.sol";

import "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";

/// TokenMessenger interface for CCTP.
/// See https://github.com/circlefin/evm-cctp-contracts/blob/master/src/TokenMessenger.sol
interface ITokenMessenger {
    function depositForBurn(
        uint256 amount,
        uint32 destinationDomain,
        bytes32 mintRecipient,
        address burnToken
    ) external returns (uint64 _nonce);
}

interface IDaimoBridger {
    function sendToHomeChain(
        uint256 homeChain,
        IERC20 tokenIn,
        uint128 amountIn
    ) external;
}

// todo: burnLimitsPerMessage
// todo: minterAllowance

contract DaimoCCTPBridger is IDaimoBridger {
    // Constants used for CCTP.
    ITokenMessenger public cctpMessenger;
    mapping(uint256 => uint32) public cctpDomainMapping; // chainId => domain.

    constructor(
        ITokenMessenger _cctpMessenger,
        uint256[] memory _cctpInputChainIds,
        uint32[] memory _cctpOutputDomains
    ) {
        cctpMessenger = _cctpMessenger;

        require(_cctpInputChainIds.length == _cctpOutputDomains.length);
        for (uint256 i = 0; i < _cctpInputChainIds.length; i++) {
            cctpDomainMapping[_cctpInputChainIds[i]] = _cctpOutputDomains[i];
        }
    }

    function _addressToBytes32(address addr) internal pure returns (bytes32) {
        return bytes32(uint256(uint160(addr)));
    }

    /// Sendsa assets on the foreign chain to the account's home chain.
    function sendToHomeChain(
        uint256 homeChain,
        IERC20 tokenIn,
        uint128 amountIn
    ) public {
        // Move input token from caller to this contract and approve
        // CCTP TokenMessenger to spend it.
        TransferHelper.safeTransferFrom(
            address(tokenIn),
            msg.sender,
            address(this),
            amountIn
        );
        TransferHelper.safeApprove(
            address(tokenIn),
            address(cctpMessenger),
            amountIn
        );

        cctpMessenger.depositForBurn(
            amountIn,
            cctpDomainMapping[homeChain],
            _addressToBytes32(address(msg.sender)),
            address(tokenIn)
        );
    }
}
