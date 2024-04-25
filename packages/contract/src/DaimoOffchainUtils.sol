// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

// Off chain utils for Daimo -- used to work around RPC limitations.
contract DaimoOffchainUtils {
  // Get the ETH balance of a list of addresses in a single call.
  function batchGetETHBalances(
    address[] calldata addrs
  ) external view returns (uint256[] memory) {
    uint256[] memory ret = new uint256[](addrs.length);
    for (uint256 i = 0; i < addrs.length; i++) {
      ret[i] = addrs[i].balance;
    }
    return ret;
  }
}
