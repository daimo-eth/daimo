// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.12;

import "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import "openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";
import "openzeppelin-contracts-upgradeable/contracts/access/Ownable2StepUpgradeable.sol";
import "openzeppelin-contracts-upgradeable/contracts/proxy/utils/UUPSUpgradeable.sol";

import "./interfaces/IDaimoPayBridger.sol";
import "../vendor/cctp/ITokenMinter.sol";
import "../vendor/cctp/ICCTPTokenMessenger.sol";

/// @title Bridger implementation for Circle's Cross-Chain Transfer Protocol (CCTP)
/// @author The Daimo team
/// @custom:security-contact security@daimo.com
///
/// Bridges assets from to a destination chain using CCTP. The only supported
/// bridge token is USDC.
contract DaimoPayCCTPBridger is IDaimoPayBridger {
    using SafeERC20 for IERC20;

    address public immutable owner;

    // CCTP TokenMinter for this chain. Used to identify the CCTP token on the
    // current chain.
    ITokenMinter public immutable tokenMinter;
    // CCTP TokenMessenger for this chain. Used to initiate the CCTP bridge.
    ICCTPTokenMessenger public immutable cctpMessenger;

    // Map chainId to CCTP domain. CCTP uses 0 as a domain. In order to use
    // 0 as a not-found value, store CCTP domain + 1 in the mapping.
    // 0 = not found, 1 = Ethereum, 2 = Avalanche, etc.
    mapping(uint256 chainId => uint32 domain) public cctpDomainMapping;

    event DomainAdded(uint256 indexed chainId, uint32 domain);

    /// Specify owner (not msg.sender) to allow CREATE3 deployment.
    constructor(
        address _initialOwner,
        ITokenMinter _tokenMinter,
        ICCTPTokenMessenger _cctpMessenger
    ) {
        owner = _initialOwner;
        tokenMinter = _tokenMinter;
        cctpMessenger = _cctpMessenger;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "DPCCTPB: caller is not the owner");
        _;
    }

    // ----- ADMIN FUNCTIONS -----

    /// Initialize. Specify the CCTP chain IDs and domains that this bridger
    /// will support.
    function init(
        uint256[] memory _cctpChainIds,
        uint32[] memory _cctpDomains
    ) public onlyOwner {
        uint256 n = _cctpChainIds.length;
        require(n == _cctpDomains.length, "DPCCTPB: wrong cctpDomains length");

        for (uint256 i = 0; i < n; ++i) {
            _addDomain(_cctpChainIds[i], _cctpDomains[i]);
        }
    }

    /// Add a new supported CCTP recipient chain.
    function addCCTPDomain(uint256 chainId, uint32 domain) public onlyOwner {
        _addDomain(chainId, domain);
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

    // ----- PUBLIC FUNCTIONS -----

    /// Get the CCTP token for the current chain corresponding to the
    /// destination chain's CCTP token.
    function getCurrentChainCCTPToken(
        uint32 toDomain,
        address toToken
    ) public view returns (IERC20) {
        return
            IERC20(
                tokenMinter.getLocalToken(toDomain, addressToBytes32(toToken))
            );
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
        IERC20 fromToken = getCurrentChainCCTPToken(toDomain, toToken);

        // Move input token from caller to this contract and approve CCTP.
        IERC20(fromToken).safeTransferFrom({
            from: msg.sender,
            to: address(this),
            value: toAmount
        });
        IERC20(fromToken).forceApprove({
            spender: address(cctpMessenger),
            value: toAmount
        });

        cctpMessenger.depositForBurn({
            amount: toAmount,
            destinationDomain: toDomain,
            mintRecipient: addressToBytes32(toAddress),
            burnToken: address(fromToken)
        });

        emit BridgeInitiated(
            msg.sender,
            toChainId,
            toAddress,
            toToken,
            toAmount
        );
    }
}
