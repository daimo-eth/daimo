// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.12;

import "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import "openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";
import "openzeppelin-contracts/contracts/access/Ownable2Step.sol";
import "openzeppelin-contracts-upgradeable/contracts/proxy/utils/UUPSUpgradeable.sol";

import "./IDaimoBridger.sol";
import "./DaimoFastCCTP.sol";

/// CCTP uses 0 as a domain. Distinguish valid domains from the not-found case.
struct CCTPDomain {
    /** CCTP domain. 0 = Ethereum, 1 = Avalanche, etc. */
    uint32 domain;
    /** Token on the other chain. */
    IERC20 token;
}

/// Automatically bridges assets from foreign chains to home chain. Uses CCTP,
/// so the only supported bridge token in USDC.
contract DaimoCCTPBridger is IDaimoBridger, Ownable2Step, UUPSUpgradeable {
    using SafeERC20 for IERC20;

    // CCTP TokenMessenger for this chain.
    ICCTPTokenMessenger public cctpMessenger;

    // Map chainID
    mapping(uint256 => CCTPDomain) public cctpDomainMapping;

    // FastCCTP contract.
    DaimoFastCCTP public fastCCTP;

    // FastCCTP nonce.
    uint256 public fastCCTPNonce;

    constructor() {
        _disableInitializers();
    }

    // ----- ADMIN FUNCTIONS -----

    /// Initialize. Specify owner (not msg.sender) to allow CREATE3 deployment.
    function init(
        address _initialOwner,
        ICCTPTokenMessenger _cctpMessenger,
        DaimoFastCCTP _fastCCTP,
        uint256[] memory _cctpChainIDs,
        uint32[] memory _cctpDomains,
        IERC20[] memory _cctpTokens
    ) public initializer {
        _transferOwnership(_initialOwner);

        cctpMessenger = _cctpMessenger;
        fastCCTP = _fastCCTP;

        uint256 n = _cctpChainIDs.length;
        require(n == _cctpDomains.length, "DCCTPB: wrong cctpDomains length");
        require(n == _cctpTokens.length, "DCCTPB: wrong cctpTokens length");

        for (uint256 i = 0; i < n; i++) {
            _addDomain(_cctpChainIDs[i], _cctpDomains[i], _cctpTokens[i]);
        }
    }

    /// UUPSUpsgradeable: only allow owner to upgrade
    function _authorizeUpgrade(address) internal view override onlyOwner {}

    /// UUPSUpgradeable: expose implementation
    function implementation() public view returns (address) {
        return _getImplementation();
    }

    /// Adds a new supported CCTP recipient chain.
    function addCCTPDomain(
        uint256 chainID,
        uint32 domain,
        IERC20 token
    ) public onlyOwner {
        _addDomain(chainID, domain, token);
    }

    function _addDomain(uint256 chainID, uint32 domain, IERC20 token) private {
        require(chainID != 0, "DCCTPB: missing chainID");
        require(address(token) != address(0), "DCCTPB: missing token");
        CCTPDomain memory domainInfo = CCTPDomain(domain, token);
        cctpDomainMapping[chainID] = domainInfo;
    }

    // ----- PUBLIC FUNCTIONS -----

    /// Sends assets on the foreign chain to the account's home chain.
    function sendToChain(
        IERC20 tokenIn,
        uint256 amountIn,
        uint256 toChainID,
        bytes calldata /* extraData */
    ) public {
        // Move input token from caller to this contract and approve FastCCTP.
        tokenIn.safeTransferFrom({
            from: msg.sender,
            to: address(this),
            value: amountIn
        });
        tokenIn.safeApprove({spender: address(fastCCTP), value: amountIn});

        CCTPDomain memory domain = cctpDomainMapping[toChainID];
        bool valid = address(domain.token) != address(0);
        require(valid, "DCCTPB: unsupported toChainID");

        // Increment nonce, then send.
        fastCCTPNonce += 1;
        fastCCTP.startTransfer({
            cctpMessenger: cctpMessenger,
            fromToken: tokenIn,
            fromAmount: amountIn,
            toChainID: toChainID,
            toDomain: domain.domain,
            toAddr: msg.sender,
            toToken: domain.token,
            toAmount: amountIn,
            nonce: fastCCTPNonce
        });
    }
}
