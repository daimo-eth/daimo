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

    event CreateAccount(
        address addr,
        uint256 homeChain,
        address homeCoin,
        address swapper,
        address bridger,
        uint8 keySlot,
        bytes32[2] key,
        uint256 salt
    );

    /**
     * Create an account and return its address.
     * Returns the address even if the account is already deployed.
     * This method is called on userop execution if the account is not deployed.
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
        assert(address(ret) == addr);

        // Emit log, with all info needed to deploy on other chains
        emit CreateAccount({
            addr: addr,
            homeChain: homeChain,
            homeCoin: address(homeCoin),
            swapper: address(swapper),
            bridger: address(bridger),
            keySlot: keySlot,
            key: key,
            salt: salt
        });
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
