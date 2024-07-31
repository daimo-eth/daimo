// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.12;

import "openzeppelin-contracts/contracts/proxy/utils/UUPSUpgradeable.sol";
import "openzeppelin-contracts-upgradeable/contracts/access/OwnableUpgradeable.sol";

/// Basic name registry.
/// Uniquely and permanently associates addresses with a short name.
contract DaimoNameRegistry is OwnableUpgradeable, UUPSUpgradeable {
    // APPEND-ONLY storage slots.
    // This contract is used with upgradeable proxies. Future versions may add
    // new storage items at the end, but cannot change existing ones.
    mapping(bytes32 => address) private _addrs;
    mapping(address => bytes32) private _names;

    event Registered(bytes32 indexed name, address indexed addr);

    constructor() {
        _disableInitializers();
    }

    /// On proxy deployment, deployer becomes the owner.
    /// We specify the initial owner (rather than using msg.sender) so that we
    /// can deploy the proxy at a deterministic CREATE2 address.
    function init(address initialOwner) public initializer {
        _transferOwnership(initialOwner);
    }

    /// UUPSUpsgradeable: only allow owner to upgrade
    function _authorizeUpgrade(
        address newImplementation
    ) internal view override onlyOwner {
        (newImplementation); // No-op; silence unused parameter warning
    }

    /// UUPSUpgradeable: expose implementation
    function implementation() public view returns (address) {
        return ERC1967Utils.getImplementation();
    }

    /// Enforces uniqueness. Doesn't do any validation on name. The app
    /// validates names both for claiming and lookup, so there's no advantage
    /// to registering an invalid name onchain (will be ignored / unusable).
    function register(bytes32 name, address addr) public {
        require(name != bytes32(0), "NameRegistry: empty name");
        require(addr != address(0), "NameRegistry: empty addr");

        require(_addrs[name] == address(0), "NameRegistry: name taken");
        require(_names[addr] == bytes32(0), "NameRegistry: addr taken");
        _addrs[name] = addr;
        _names[addr] = name;
        emit Registered(name, addr);
    }

    /// Registers msg.sender under a given name.
    function registerSelf(bytes32 name) external {
        register(name, msg.sender);
    }

    /// Looks up the address for a given name, or address(0) if missing.
    function resolveAddr(bytes32 name) external view returns (address) {
        return _addrs[name];
    }

    /// Looks up the name for a given address, or bytes32(0) if missing.
    function resolveName(address addr) external view returns (bytes32) {
        return _names[addr];
    }

    /// Allow owner to override a claimed name.
    /// The purpose of this is to prevent name-squatting early on.
    /// Eventually, ownership of the NameRegistry will be burned to ossify.
    function forceRegister(bytes32 name, address addr) external onlyOwner {
        address prevAddr = _addrs[name];
        if (prevAddr != address(0)) {
            assert(_names[prevAddr] == name); // invariant
            _names[prevAddr] = bytes32(0);
            _addrs[name] = address(0);
        }
        register(name, addr);
    }
}
