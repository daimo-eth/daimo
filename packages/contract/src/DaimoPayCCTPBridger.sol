// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.12;

import "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import "openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";
import "openzeppelin-contracts-upgradeable/contracts/access/Ownable2StepUpgradeable.sol";
import "openzeppelin-contracts-upgradeable/contracts/proxy/utils/UUPSUpgradeable.sol";

import "./interfaces/IDaimoPayBridger.sol";
import "./DaimoFastCCTP.sol";

/// @title Bridger implementation for Circle's Cross-Chain Transfer Protocol (CCTP)
/// @author The Daimo team
/// @custom:security-contact security@daimo.com
///
/// Bridges assets from to a destination chain using CCTP. The only supported
/// bridge token is USDC.
contract DaimoPayCCTPBridger is
    IDaimoPayBridger,
    Ownable2StepUpgradeable,
    UUPSUpgradeable
{
    using SafeERC20 for IERC20;

    // CCTP TokenMessenger for this chain.
    ICCTPTokenMessenger public immutable cctpMessenger;

    // Map chainID to CCTP domain. CCTP uses 0 as a domain. In order to use
    // 0 as a not-found value, store CCTP domain + 1 in the mapping.
    // 0 = not found, 1 = Ethereum, 2 = Avalanche, etc.
    mapping(uint256 chainId => uint32 domain) public cctpDomainMapping;

    event DomainAdded(uint256 indexed chainID, uint32 domain);
    event BridgeInitiated(
        address indexed sender,
        IERC20 indexed tokenIn,
        uint256 amountIn,
        uint256 toChainID
    );

    constructor() {
        _disableInitializers();
    }

    // ----- ADMIN FUNCTIONS -----

    /// Initialize. Specify owner (not msg.sender) to allow CREATE3 deployment.
    function init(
        address _initialOwner,
        ICCTPTokenMessenger _cctpMessenger,
        uint256[] memory _cctpChainIDs,
        uint32[] memory _cctpDomains
    ) public initializer {
        __Ownable_init(_initialOwner);

        cctpMessenger = _cctpMessenger;

        uint256 n = _cctpChainIDs.length;
        require(n == _cctpDomains.length, "DPCCTPB: wrong cctpDomains length");

        for (uint256 i = 0; i < n; ++i) {
            _addDomain(_cctpChainIDs[i], _cctpDomains[i]);
        }
    }

    /// UUPSUpsgradeable: only allow owner to upgrade
    function _authorizeUpgrade(address) internal view override onlyOwner {}

    /// UUPSUpgradeable: expose implementation
    function implementation() public view returns (address) {
        return ERC1967Utils.getImplementation();
    }

    /// Adds a new supported CCTP recipient chain.
    function addCCTPDomain(
        uint256 chainID,
        uint32 domain
    ) public onlyOwner {
        _addDomain(chainID, domain);
    }

    function _addDomain(uint256 chainID, uint32 domain) private {
        require(chainID != 0, "DPCCTPB: missing chainID");
        // CCTP uses 0 as a domain. In order to use 0 as a not-found value,
        // store CCTP domain + 1 in the mapping.
        cctpDomainMapping[chainID] = domain + 1;
        emit DomainAdded(chainID, domain);
    }

    function _getDomain(uint256 chainID) internal view returns (uint32) {
        uint32 domain = cctpDomainMapping[chainID];
        // The mapping stores CCTP domain + 1 and reserves 0 for not-found.
        require(domain != 0, "DPCCTPB: missing domain");
        return domain - 1;
    }

    function addressToBytes32(address addr) internal pure returns (bytes32) {
        return bytes32(uint256(uint160(addr)));
    }

    // ----- PUBLIC FUNCTIONS -----

    /// Initiates a bridge to a destination chain using CCTP.
    function sendToChain(
        IERC20 tokenIn,
        uint256 amountIn,
        uint256 toChainID,
        bytes calldata /* extraData */
    ) public {
        // Move input token from caller to this contract and approve CCTP.
        tokenIn.safeTransferFrom({
            from: msg.sender,
            to: address(this),
            value: amountIn
        });
        tokenIn.forceApprove({spender: address(cctpMessenger), value: amountIn});

        uint32 domain = _getDomain(toChainID);

        cctpMessenger.depositForBurn({
            amount: amountIn,
            destinationDomain: domain,
            mintRecipient: addressToBytes32(address(this)),
            burnToken: address(tokenIn)
        });

        emit BridgeInitiated(msg.sender, tokenIn, amountIn, toChainID);
    }
}
