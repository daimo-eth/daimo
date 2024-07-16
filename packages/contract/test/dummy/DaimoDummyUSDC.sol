// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import "openzeppelin-contracts/contracts/token/ERC20/ERC20.sol";

// Fake USDC for testnet and local development.
contract TestUSDC is ERC20 {
    constructor() ERC20("testUSDC", "USDC") {
        _mint(msg.sender, 1e12); // $1,000,000
    }

    // USDC has 6 decimals
    function decimals() public pure virtual override returns (uint8) {
        return 6;
    }
}
