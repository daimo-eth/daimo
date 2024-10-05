// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.12;

import "openzeppelin-contracts/contracts/proxy/utils/Initializable.sol";
import "openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";

import "../vendor/cctp/ICCTPTokenMessenger.sol";
import "./CrepeUtils.sol";

// This contract is deployed as an ERC1967Proxy to save gas, then destroyed
// again in the same transaction.
// CCTP lets us pass just a few  pieces of information from chain A to chain B:
// sender, recipient, token, amount. This contract lets us encode all of the
// FastCCTP send parameters into the sender address via CREATE2.
contract CrepeHandoff is Initializable {
    using SafeERC20 for IERC20;

    address payable private creator;
    Destination private destination;

    /// Runs at deploy time. Singleton implementation contract = no init, no
    /// state. All other methods are called via proxy = initialized once, has
    /// state.
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address payable _creator,
        Destination calldata _destination
    ) public initializer {
        creator = _creator;
        destination = _destination;
    }

    function addressToBytes32(address addr) internal pure returns (bytes32) {
        return bytes32(uint256(uint160(addr)));
    }

    // Executes two steps: swap tokenIn to expectedBurnToken, and then burn it
    // if we are not on the destination chain.
    function sendAndSelfDestruct(
        ICCTPTokenMessenger cctpMessenger,
        TokenAmount[] calldata approvals,
        Call calldata swapCall,
        TokenAmount calldata expectedBurnToken
    ) public {
        require(msg.sender == creator, "FCCTP: only creator");

        if (swapCall.data.length > 0) {
            // Approve and swap any user inputs as required.
            for (uint256 i = 0; i < approvals.length; i++) {
                CrepeTokenUtils.approve(
                    approvals[i].addr,
                    address(swapCall.to),
                    approvals[i].amount
                );
            }

            (bool success, ) = swapCall.to.call{value: swapCall.value}(
                swapCall.data
            );
            require(success, "FCCTP: swap call failed");
        }

        // Redirect bridge token to FastCCTP to burn.
        uint256 burnBalance = CrepeTokenUtils.getBalanceOf(
            expectedBurnToken.addr,
            address(this)
        );
        require(
            burnBalance >= expectedBurnToken.amount,
            "FCCTP: insufficient burn token"
        );

        if (destination.chainId != block.chainid) {
            // Burn to CCTP. Recipient = EphemeralHandoff address on chain B.
            CrepeTokenUtils.approve(
                expectedBurnToken.addr,
                address(cctpMessenger),
                expectedBurnToken.amount
            );
            cctpMessenger.depositForBurn({
                amount: expectedBurnToken.amount,
                destinationDomain: destination.domain,
                mintRecipient: addressToBytes32(address(this)),
                burnToken: address(expectedBurnToken.addr)
            });
        }

        // This use of SELFDESTRUCT is compatible with EIP-6780. Handoff
        // contracts are deployed, then destroyed in the same transaction.
        // solhint-disable-next-line
        selfdestruct(creator);
    }

    // One step: receive mintToken and send to creator
    function receiveAndSelfDestruct() public {
        require(msg.sender == creator, "FCCTP: only creator");

        uint256 amount = CrepeTokenUtils.getBalanceOf(
            destination.mintToken.addr,
            address(this)
        );
        require(
            amount >= destination.mintToken.amount,
            "FCCTP: insufficient bridge mint token received"
        );

        // Send to FastCCTP, which will forward to current recipient
        CrepeTokenUtils.transfer(destination.mintToken.addr, creator, amount);

        // This use of SELFDESTRUCT is compatible with EIP-6780. Handoff
        // contracts are deployed, then destroyed in the same transaction.
        // solhint-disable-next-line
        selfdestruct(creator);
    }

    receive() external payable {}
}
