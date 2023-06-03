// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.12;

/**
 * Basic name registry.
 * Uniquely and permanently associates addresses with a short name.
 */
contract NameRegistry {
    mapping(bytes32 => address) private _addrs;
    mapping(address => bytes32) private _names;

    event Registered(bytes32 indexed name, address indexed addr);

    /**
     * Enforces uniqueness. Doesn't do any validation on name. The app
     * validates names both for claiming and lookup, so there's no advantage
     * to registering an invalid name onchain (will be ignored / unusable).
     */
    function register(bytes32 name, address addr) external {
        require(_addrs[name] == address(0), "NameRegistry: name taken");
        require(_names[addr] == bytes32(0), "NameRegistry: addr taken");
        _addrs[name] = addr;
        _names[addr] = name;
        emit Registered(name, addr);
    }

    function resolveAddr(bytes32 name) external view returns (address) {
        return _addrs[name];
    }

    function resolveName(address addr) external view returns (bytes32) {
        return _names[addr];
    }
}
