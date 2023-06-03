// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.13;

import "forge-std/Test.sol";
import "../src/NameRegistry.sol";

contract NameRegistryTest is Test {
    NameRegistry public registry;

    function setUp() public {
        registry = new NameRegistry();
    }

    function testRegister() public {
        bytes32 name = "foo";
        address addr = address(0x1234);
        registry.register(name, addr);
        assertEq(registry.resolveAddr(name), addr);
        assertEq(registry.resolveName(addr), name);
    }

    function testDuplicateName() public {
        registry.register("foo", address(0x1234));
        vm.expectRevert("NameRegistry: name taken");
        registry.register("foo", address(0x1111111111));
    }

    function testDuplicateAddr() public {
        registry.register("foo", address(0x1234));
        vm.expectRevert("NameRegistry: addr taken");
        registry.register("newname", address(0x1234));
    }
}
