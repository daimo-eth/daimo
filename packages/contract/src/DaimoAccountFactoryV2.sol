// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.12;

import "openzeppelin-contracts/contracts/utils/Create2.sol";
import "openzeppelin-contracts/contracts/proxy/ERC1967/ERC1967Proxy.sol";

import "./DaimoAccountV2.sol";

/**
 * This factory deploys ERC-4337 DaimoAccountV2 contracts using CREATE2.
 *
 * The factory's createAccount returns the target account address even if
 * it's already deployed. This way, the entryPoint.getSenderAddress() can be
 * called either before or after the account is created.
 */
contract DaimoAccountFactoryV2 {
    DaimoAccountV2 public immutable accountImplementation;
    IEntryPoint public immutable entryPoint;

    constructor(IEntryPoint _entryPoint) {
        entryPoint = _entryPoint;
        accountImplementation = new DaimoAccountV2(_entryPoint);
    }

    /**
     * Create an account, and return its address.
     * Returns the address even if the account is already deployed.
     * Note that during UserOperation execution, this method is called only if
     * the account is not deployed. This method returns an existing account
     * address so that entryPoint.getSenderAddress() would work even after
     * account creation.
     */
    function createAccount(
        uint256 homeChain,
        IERC20 homeCoin,
        IDaimoSwapper swapper,
        IDaimoBridger bridger,
        uint8 keySlot,
        bytes32[2] calldata key,
        uint256 salt
    ) public payable returns (DaimoAccountV2 ret) {
        address addr = getAddress(
            homeChain,
            homeCoin,
            swapper,
            bridger,
            keySlot,
            key,
            salt
        );

        // Prefund the account with msg.value
        if (msg.value > 0) {
            entryPoint.depositTo{value: msg.value}(addr);
        }

        // Otherwise, no-op if the account is already deployed
        uint codeSize = addr.code.length;
        if (codeSize > 0) {
            return DaimoAccountV2(payable(addr));
        }

        ret = DaimoAccountV2(
            payable(
                new ERC1967Proxy{salt: bytes32(salt)}(
                    address(accountImplementation),
                    abi.encodeCall(
                        DaimoAccountV2.initialize,
                        (homeChain, homeCoin, swapper, bridger, keySlot, key)
                    )
                )
            )
        );
    }

    /// Calculate the counterfactual address of this account as it would be
    /// returned by createAccount().
    function getAddress(
        uint256 homeChain,
        IERC20 homeCoin,
        IDaimoSwapper swapper,
        IDaimoBridger bridger,
        uint8 keySlot,
        bytes32[2] calldata key,
        uint256 salt
    ) public view returns (address) {
        return
            Create2.computeAddress(
                bytes32(salt),
                keccak256(
                    abi.encodePacked(
                        type(ERC1967Proxy).creationCode,
                        abi.encode(
                            address(accountImplementation),
                            abi.encodeCall(
                                DaimoAccountV2.initialize,
                                (
                                    homeChain,
                                    homeCoin,
                                    swapper,
                                    bridger,
                                    keySlot,
                                    key
                                )
                            )
                        )
                    )
                )
            );
    }
}
