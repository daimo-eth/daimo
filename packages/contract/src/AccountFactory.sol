// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.12;

import "openzeppelin-contracts/contracts/utils/Create2.sol";
import "openzeppelin-contracts/contracts/proxy/ERC1967/ERC1967Proxy.sol";

import "./Account.sol";

/**
 * A sample factory contract for Account
 * A UserOperations "initCode" holds the address of the factory, and a method call (to createAccount, in this sample factory).
 * The factory's createAccount returns the target account address even if it is already installed.
 * This way, the entryPoint.getSenderAddress() can be called either before or after the account is created.
 */
contract AccountFactory {
    Account public immutable accountImplementation;
    IEntryPoint public immutable entryPoint;

    constructor(IEntryPoint _entryPoint, P256SHA256 _sigVerifier) {
        entryPoint = _entryPoint;
        accountImplementation = new Account(_entryPoint, _sigVerifier);
    }

    /**
     * create an account, and return its address.
     * returns the address even if the account is already deployed.
     * Note that during UserOperation execution, this method is called only if the account is not deployed.
     * This method returns an existing account address so that entryPoint.getSenderAddress() would work even after account creation
     */
    function createAccount(
        uint8 slot,
        bytes32[2] memory key,
        Call[] calldata initCalls,
        uint256 salt
    ) public payable returns (Account ret) {
        address addr = getAddress(slot, key, initCalls, salt);
        uint codeSize = addr.code.length;
        if (codeSize > 0) {
            return Account(payable(addr));
        }

        // Prefund the account with msg.value
        if (msg.value > 0) entryPoint.depositTo{value: msg.value}(addr);

        ret = Account(
            payable(
                new ERC1967Proxy{salt: bytes32(salt)}(
                    address(accountImplementation),
                    abi.encodeCall(Account.initialize, (slot, key, initCalls))
                )
            )
        );
    }

    /**
     * calculate the counterfactual address of this account as it would be returned by createAccount()
     */
    function getAddress(
        uint8 slot,
        bytes32[2] memory key,
        Call[] calldata initCalls,
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
                                Account.initialize,
                                (slot, key, initCalls)
                            )
                        )
                    )
                )
            );
    }
}
