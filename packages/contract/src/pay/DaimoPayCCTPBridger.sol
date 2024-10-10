// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.12;

import {Ownable2StepUpgradeable} from "openzeppelin-contracts-upgradeable/contracts/access/Ownable2StepUpgradeable.sol";
import "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import "openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";

import "../interfaces/IDaimoPayBridger.sol";
import "../../vendor/cctp/ITokenMinter.sol";
import "../../vendor/cctp/ICCTPTokenMessenger.sol";

/// @title Bridger implementation for Circle's Cross-Chain Transfer Protocol (CCTP)
/// @author The Daimo team
/// @custom:security-contact security@daimo.com
///
/// @dev Bridges assets from to a destination chain using CCTP. The only supported
/// bridge token is USDC.
contract DaimoPayCCTPBridger is IDaimoPayBridger, Ownable2StepUpgradeable {
    using SafeERC20 for IERC20;

    // CCTP TokenMinter for this chain. Used to identify the CCTP token on the
    // current chain.
    ITokenMinter public tokenMinter;
    // CCTP TokenMessenger for this chain. Used to initiate the CCTP bridge.
    ICCTPTokenMessenger public cctpMessenger;

    // Map chainId to CCTP domain. CCTP uses 0 as a domain. In order to use
    // 0 as a not-found value, store CCTP domain + 1 in the mapping.
    // 0 = not found, 1 = Ethereum, 2 = Avalanche, etc.
    mapping(uint256 chainId => uint32 domain) public cctpDomainMapping;

    event DomainAdded(uint256 indexed chainId, uint32 domain);

    constructor() {
        _disableInitializers();
    }

    // ----- ADMIN FUNCTIONS -----

    /// Initialize. Specify owner (not msg.sender) to allow CREATE3 deployment.
    /// Specify the CCTP chain IDs and domains that this bridger will support.
    function init(
        address _initialOwner,
        ITokenMinter _tokenMinter,
        ICCTPTokenMessenger _cctpMessenger,
        uint256[] memory _cctpChainIds,
        uint32[] memory _cctpDomains
    ) public initializer {
        __Ownable_init(_initialOwner);

        tokenMinter = _tokenMinter;
        cctpMessenger = _cctpMessenger;

        uint256 n = _cctpChainIds.length;
        require(n == _cctpDomains.length, "DPCCTPB: wrong cctpDomains length");

        for (uint256 i = 0; i < n; ++i) {
            _addDomain({chainId: _cctpChainIds[i], domain: _cctpDomains[i]});
        }
    }

    /// Add a new supported CCTP recipient chain.
    function addCCTPDomain(uint256 chainId, uint32 domain) public onlyOwner {
        _addDomain({chainId: chainId, domain: domain});
    }

    function _addDomain(uint256 chainId, uint32 domain) private {
        require(chainId != 0, "DPCCTPB: missing chainId");
        // CCTP uses 0 as a domain. In order to use 0 as a not-found value,
        // store CCTP domain + 1 in the mapping.
        cctpDomainMapping[chainId] = domain + 1;
        emit DomainAdded(chainId, domain);
    }

    function _getDomain(uint256 chainId) internal view returns (uint32) {
        uint32 domain = cctpDomainMapping[chainId];
        // The mapping stores CCTP domain + 1 and reserves 0 for not-found.
        require(domain != 0, "DPCCTPB: missing domain");
        return domain - 1;
    }

    function addressToBytes32(address addr) internal pure returns (bytes32) {
        return bytes32(uint256(uint160(addr)));
    }

    // ----- BRIDGER FUNCTIONS -----

    /// Get the CCTP token for the current chain corresponding to the
    /// destination chain's CCTP token.
    /// CCTP does 1 to 1 token bridging, so the amount of tokens to
    /// bridge is the same as toAmount.
    function getInputTokenAmount(
        uint256 toChainId,
        address toToken,
        uint256 toAmount
    ) public view returns (address inputToken, uint256 inputAmount) {
        uint32 toDomain = _getDomain(toChainId);
        inputToken = tokenMinter.getLocalToken(
            toDomain,
            addressToBytes32(toToken)
        );
        inputAmount = toAmount;
    }

    /// Initiate a bridge to a destination chain using CCTP.
    function sendToChain(
        uint256 toChainId,
        address toAddress,
        address toToken,
        uint256 toAmount,
        bytes calldata /* extraData */
    ) public {
        require(toChainId != block.chainid, "DPCCTPB: same chain");
        require(toAmount > 0, "DPCCTPB: zero amount");

        uint32 toDomain = _getDomain(toChainId);
        (address inputToken, uint256 inputAmount) = getInputTokenAmount({
            toChainId: toChainId,
            toToken: toToken,
            toAmount: toAmount
        });

        // Move input token from caller to this contract and approve CCTP.
        IERC20(inputToken).safeTransferFrom({
            from: msg.sender,
            to: address(this),
            value: inputAmount
        });
        IERC20(inputToken).forceApprove({
            spender: address(cctpMessenger),
            value: inputAmount
        });

        cctpMessenger.depositForBurn({
            amount: inputAmount,
            destinationDomain: toDomain,
            mintRecipient: addressToBytes32(toAddress),
            burnToken: address(inputToken)
        });

        emit BridgeInitiated({
            fromAddress: msg.sender,
            fromToken: inputToken,
            fromAmount: inputAmount,
            toChainId: toChainId,
            toAddress: toAddress,
            toToken: toToken,
            toAmount: toAmount
        });
    }
}
