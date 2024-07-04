// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.12;

import "@uniswap/v3-periphery/contracts/libraries/TransferHelper.sol";
import "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";

import "./IDaimoBridger.sol";

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

/// CCTP uses 0 as a domain. Distinguish valid domains from the not-found case.
struct CCTPDomain {
    bool valid;
    uint32 domain;
}

// todo: burnLimitsPerMessage
// todo: minterAllowance

/// Automatically bridges assets from foreign chains to home chain. Uses CCTP,
/// so the only supported bridge token in USDC.
contract DaimoCCTPBridger is IDaimoBridger {
    // Constants used for CCTP.
    ITokenMessenger public cctpMessenger;

    // Map chainID
    mapping(uint256 => CCTPDomain) public cctpDomainMapping;

    constructor(
        ITokenMessenger _cctpMessenger,
        uint256[] memory _cctpInputChainIds,
        uint32[] memory _cctpOutputDomains
    ) {
        cctpMessenger = _cctpMessenger;

        require(
            _cctpInputChainIds.length == _cctpOutputDomains.length,
            "DCCTPB: wrong input length"
        );
        for (uint256 i = 0; i < _cctpInputChainIds.length; i++) {
            CCTPDomain memory domain = CCTPDomain(true, _cctpOutputDomains[i]);
            cctpDomainMapping[_cctpInputChainIds[i]] = domain;
        }
    }

    function _addressToBytes32(address addr) internal pure returns (bytes32) {
        return bytes32(uint256(uint160(addr)));
    }

    /// Sends assets on the foreign chain to the account's home chain.
    function sendToChain(
        IERC20 tokenIn,
        uint256 amountIn,
        uint256 toChainID,
        bytes calldata /* extraData */
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

        CCTPDomain memory domain = cctpDomainMapping[toChainID];
        require(domain.valid, "DCCTPB: unsupported toChainID");

        cctpMessenger.depositForBurn(
            amountIn,
            domain.domain,
            _addressToBytes32(address(msg.sender)),
            address(tokenIn)
        );
    }
}
