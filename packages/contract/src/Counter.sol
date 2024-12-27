// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity >=0.8;

/**
 * @notice "Hello world" contract: a counter that costs 0.0001 ETH to increment.
 */
contract Counter {
    uint256 public counter;

    event Incremented(uint256 indexed count, string message);

    function increment(string calldata message) external payable {
        assert(msg.value == 0.0001 ether);

        // Tip Protocol Guild
        address recipient = 0x32e3C7fD24e175701A35c224f2238d18439C7dBC;
        (bool sent, ) = recipient.call{value: msg.value}("");
        require(sent);

        // Emit log
        counter++;
        emit Incremented(counter, message);
    }
}
