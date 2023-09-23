// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.13;

import "forge-std/Test.sol";
import "openzeppelin-contracts/contracts/proxy/utils/UUPSUpgradeable.sol";
import "openzeppelin-contracts-upgradeable/contracts/access/OwnableUpgradeable.sol";
import "../src/DaimoNameRegistry.sol";
import "../src/DaimoNameRegistryProxy.sol";

// Does nothing. Used to test upgradability.
contract Brick {
    function resolveAddr(bytes32 name) external pure returns (address) {
        (name); // silence warning
        return address(0xdead);
    }

    /// Test contract, exclude from coverage
    function test() public {}
}

contract UpgradeableBrick is UUPSUpgradeable, OwnableUpgradeable {
    /// UUPSUpsgradeable: only allow owner to upgrade
    function _authorizeUpgrade(
        address newImplementation
    ) internal view override onlyOwner {
        (newImplementation); // No-op; silence unused parameter warning
    }

    function resolveAddr(bytes32 name) external pure returns (address) {
        (name); // silence warning
        return address(0xdead);
    }

    /// Test contract, exclude from coverage
    function test() public {}
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
        DaimoNameRegistryProxy proxy = new DaimoNameRegistryProxy{salt: 0}(
            address(registry), // implementation
            abi.encodeWithSelector(DaimoNameRegistry.init.selector, hex"")
        );
        DaimoNameRegistry proxyNameReg = DaimoNameRegistry(address(proxy));

        // Call owner() to show it's correct
        address initOwner = address(this);
        assertEq(proxyNameReg.owner(), initOwner);

        // Transfer ownership
        address newOwner = address(0x5555);
        proxyNameReg.transferOwnership(newOwner);
        assertEq(proxyNameReg.owner(), newOwner);

        // Old owner can't upgrade
        vm.expectRevert("Ownable: caller is not the owner");
        vm.prank(initOwner);
        proxyNameReg.upgradeTo(address(0x123));

        // Using new owner, try bricking the contract. Can't, not UUPS.
        Brick brick = new Brick();
        vm.expectRevert("ERC1967Upgrade: new implementation is not UUPS");
        vm.prank(newOwner);
        proxyNameReg.upgradeTo(address(brick));

        // Brick the contract
        UpgradeableBrick upBrick = new UpgradeableBrick();
        vm.prank(newOwner);
        proxyNameReg.upgradeTo(address(upBrick));

        // Confirm it's bricked
        assertEq(proxyNameReg.resolveAddr(bytes32("alice")), address(0xdead));

        // Unbrick the contract
        vm.prank(newOwner);
        proxyNameReg.upgradeTo(address(registry));

        // Confirm unbricked
        assertEq(proxyNameReg.resolveAddr(bytes32("alice")), address(0));
        assertEq(proxyNameReg.implementation(), address(registry));
    }
}
