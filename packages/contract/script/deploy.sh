#!/bin/bash
set -e

# Requirements
# RPC_URL for the target chain
# PRIVATE_KEY for the deployer
# ETHERSCAN_API_KEY

# Build
forge build

# Deploy verifier with proxy
forge script script/DeployVerifier.s.sol --fork-url $RPC_URL --private-key $PRIVATE_KEY --broadcast --verify  --etherscan-api-key $ETHERSCAN_API_KEY

VERIFIER_PROXY_ADDRESS="0x471F13fAEa731C6687239ac287e5953e65a059B2"

# Deploy Account factory
forge script script/DeployAccountFactory.s.sol --sig "run(address)" $VERIFIER_PROXY_ADDRESS --fork-url $RPC_URL --private-key $PRIVATE_KEY --broadcast --verify --etherscan-api-key $ETHERSCAN_API_KEY

# Deploy name registry
forge script script/DeployNameRegistry.s.sol --fork-url $RPC_URL --private-key $PRIVATE_KEY --broadcast --verify  --etherscan-api-key $ETHERSCAN_API_KEY

# Deploy Ephemeral Notes using Test USDC
forge script script/DeployEphemeralNotes.s.sol --fork-url $RPC_URL --private-key $PRIVATE_KEY --broadcast --verify  --etherscan-api-key $ETHERSCAN_API_KEY

# Deploy Ephemeral Notes V2 using Test USDC
forge script script/DeployEphemeralNotesV2.s.sol --fork-url $RPC_URL --private-key $PRIVATE_KEY --broadcast --verify  --etherscan-api-key $ETHERSCAN_API_KEY

# From DeployAccountFactory
ADDR_ACCOUNT_FACTORY="0xF9D643f5645C6140b8EEb7eF42878b71eBfEe40b"

# Deploy test Account and verify it on Etherscan
forge script script/DeployTestAccount.s.sol --sig "run(address)" $ADDR_ACCOUNT_FACTORY --fork-url $RPC_URL --private-key $PRIVATE_KEY --broadcast --verify --etherscan-api-key $ETHERSCAN_API_KEY

# Deploy paymaster and verify it on Etherscan
forge script script/ManagePaymaster.s.sol --sig "deploy()" --fork-url $RPC_URL --private-key $PRIVATE_KEY --broadcast --verify --etherscan-api-key $ETHERSCAN_API_KEY

PAYMASTER_ADDR="0xedb395b8BD78788A57e3C8eD9b748f9CC29C2864"

# Start paymaster by depositing and whitelisting
forge script script/ManagePaymaster.s.sol --sig "start(address)" $PAYMASTER_ADDR --fork-url $RPC_URL --private-key $PRIVATE_KEY --broadcast --verify --etherscan-api-key $ETHERSCAN_API_KEY

# # Add paymaster deposit
# forge script script/ManagePaymaster.s.sol --sig "addDeposit(address)" $PAYMASTER_ADDR --fork-url $RPC_URL --private-key $PRIVATE_KEY --broadcast --verify --etherscan-api-key $ETHERSCAN_API_KEY

# # Stop paymaster by clearing deposit
# forge script script/ManagePaymaster.s.sol --sig "stop(address)" $PAYMASTER_ADDR --fork-url $RPC_URL --private-key $PRIVATE_KEY --broadcast --verify --etherscan-api-key $ETHERSCAN_API_KEY

# # Upgrade verifier contract
# forge script script/ManageVerifier.s.sol --sig "upgradeVerifier(bool)" <confirm> --fork-url $RPC_URL --private-key $PRIVATE_KEY

# # Burn ownership of verifier contract
# forge script script/ManageVerifier.s.sol --sig "burnOwnership(bool)" <confirm> --fork-url $RPC_URL --private-key $PRIVATE_KEY
