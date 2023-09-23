// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import "openzeppelin-contracts/contracts/proxy/ERC1967/ERC1967Proxy.sol";

/// Proxy using the UUPSUpgradeable pattern. Named for Etherscan verification.
contract DaimoNameRegistryProxy is ERC1967Proxy {
    constructor(
        address _logic,
        bytes memory _data
    ) ERC1967Proxy(_logic, _data) {}
}
