// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.13;

import "forge-std/Test.sol";
import "openzeppelin-contracts/contracts/proxy/transparent/TransparentUpgradeableProxy.sol";
import "../src/DaimoNameRegistry.sol";

// Does nothing. Used to test upgradability.
contract Brick {
    function resolveAddr(bytes32 name) external pure returns (address) {
        (name); // silence warning
        return address(0xdead);
    }
}

contract NameRegistryTest is Test {
    DaimoNameRegistry public registry;

    event Registered(bytes32 indexed name, address indexed addr);

    function setUp() public {
        registry = new DaimoNameRegistry();
    }

    function testRegister() public {
        bytes32 name = "foo";
        address addr = address(0x1234);

        vm.expectEmit(true, true, true, true);
        emit Registered(name, addr);
        registry.register(name, addr);
        assertEq(registry.resolveAddr(name), addr);
        assertEq(registry.resolveName(addr), name);
    }

    function testRegisterSelf() public {
        bytes32 name = "bar";
        address addr = address(0x12345);
        vm.startPrank(addr);
        registry.registerSelf(name);
        vm.stopPrank();
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

    function testNullAddrOrName() public {
        vm.expectRevert("NameRegistry: empty name");
        registry.register("", address(0x1234));
        vm.expectRevert("NameRegistry: empty addr");
        registry.register("foo", address(0));
    }

    function testForceRegister() public {
        registry.register("foo", address(0x123));
        assertEq(registry.resolveName(address(0x123)), bytes32(bytes("foo")));

        // nobody else can force register
        vm.prank(address(0x4337));
        vm.expectRevert("Ownable: caller is not the owner");
        registry.forceRegister("foo", address(0x999));

        // owner can force register
        vm.prank(address(this));
        registry.forceRegister("foo", address(0x999));

        // once done, the old name is deregistered
        assertEq(registry.resolveName(address(0x123)), bytes32(0));
        assertEq(registry.resolveName(address(0x999)), bytes32(bytes("foo")));
        assertEq(registry.resolveAddr(bytes32(bytes("foo"))), address(0x999));
    }

    function testUpgrade() public {
        // Construct proxy, same mechanism as the deploy script
        address initAdmin = address(0x777);
        TransparentUpgradeableProxy proxy = new TransparentUpgradeableProxy{
            salt: 0
        }(
            address(registry), // implementation
            initAdmin, // admin
            abi.encodeWithSelector(DaimoNameRegistry.init.selector, hex"")
        );
        DaimoNameRegistry proxyNameReg = DaimoNameRegistry(address(proxy));

        // Transparent: admin can ONLY upgrade, everyeone else can ONLY call
        vm.expectRevert(
            "TransparentUpgradeableProxy: admin cannot fallback to proxy target"
        );
        vm.prank(initAdmin);
        proxyNameReg.owner();

        // Call owner() to show it's correct
        address initOwner = address(this);
        assertEq(proxyNameReg.owner(), initOwner);

        // Transfer ownership
        address newOwner = address(0x5555);
        proxyNameReg.transferOwnership(newOwner);
        assertEq(proxyNameReg.owner(), newOwner);

        // Transparent proxy: any non-admin can't upgrade, not even the owner
        vm.expectRevert();
        vm.prank(initOwner);
        proxy.upgradeTo(address(0x123));

        vm.expectRevert();
        vm.prank(newOwner);
        proxy.upgradeTo(address(0x123));

        // Only the admin can upgrade. Using admin, brick the contract.
        Brick brick = new Brick();
        vm.prank(initAdmin);
        proxy.upgradeTo(address(brick));
        vm.prank(initAdmin);
        assertEq(proxy.implementation(), address(brick));

        // Confirm it's bricked
        assertEq(proxyNameReg.resolveAddr(bytes32("alice")), address(0xdead));

        // Unbruck the contract
        vm.prank(initAdmin);
        proxy.upgradeTo(address(registry));

        // Confirm unbricked
        assertEq(proxyNameReg.resolveAddr(bytes32("alice")), address(0));
    }
}
