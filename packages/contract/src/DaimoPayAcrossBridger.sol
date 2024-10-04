// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.12;

import "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import "openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";
import "openzeppelin-contracts-upgradeable/contracts/access/Ownable2StepUpgradeable.sol";
import "openzeppelin-contracts-upgradeable/contracts/proxy/utils/UUPSUpgradeable.sol";

import "./interfaces/IDaimoPayBridger.sol";
import "./DaimoFastCCTP.sol";
import "../vendor/across/V3SpokePoolInterface.sol";

/// @title Bridger implementation for Across Protocol
/// @author The Daimo team
/// @custom:security-contact security@daimo.com
///
/// Bridges assets from to a destination chain using Across Protocol.
contract DaimoPayAcrossBridger is
    IDaimoPayBridger,
    Ownable2StepUpgradeable,
    UUPSUpgradeable
{
    using SafeERC20 for IERC20;

    // SpokePool contract address for this chain.
    V3SpokePoolInterface public immutable spokePool;

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
        V3SpokePoolInterface _spokePool
    ) public initializer {
        __Ownable_init(_initialOwner);

        spokePool = _spokePool;
    }

    /// UUPSUpsgradeable: only allow owner to upgrade
    function _authorizeUpgrade(address) internal view override onlyOwner {}

    /// UUPSUpgradeable: expose implementation
    function implementation() public view returns (address) {
        return ERC1967Utils.getImplementation();
    }

    // ----- PUBLIC FUNCTIONS -----

    /// Initiates a bridge to a destination chain using Across Protocol.
    function sendToChain(
        IERC20 tokenIn,
        uint256 amountIn,
        uint256 toChainID,
        bytes calldata extraData
    ) public {
        // Parse remaining arguments from extraData
        (
            address outputToken,
            uint256 outputAmount,
            address exclusiveRelayer,
            uint32 quoteTimestamp,
            uint32 fillDeadline,
            uint32 exclusivityDeadline,
            bytes memory message
        ) = abi.decode(extraData, (address, uint256, address, uint32, uint32, uint32, bytes));

        // Move input token from caller to this contract and approve the
        // SpokePool contract.
        tokenIn.safeTransferFrom({
            from: msg.sender,
            to: address(this),
            value: amountIn
        });
        tokenIn.forceApprove({spender: address(spokePool), value: amountIn});

        spokePool.depositV3({
            depositor: address(this),
            recipient: msg.sender,
            inputToken: address(tokenIn),
            outputToken: outputToken,
            inputAmount: amountIn,
            outputAmount: outputAmount,
            destinationChainId: toChainID,
            exclusiveRelayer: exclusiveRelayer,
            quoteTimestamp: quoteTimestamp,
            fillDeadline: fillDeadline,
            exclusivityDeadline: exclusivityDeadline,
            message: message
        });

        emit BridgeInitiated(msg.sender, tokenIn, amountIn, toChainID);
    }
}
