#!/bin/bash
set -e

source .env

# Build
forge build

# Deploy verifier with proxy
forge script script/DeployVerifier.s.sol --fork-url $RPC_URL --private-key $PRIVATE_KEY --broadcast --verify  --etherscan-api-key $ETHERSCAN_API_KEY

VERIFIER_PROXY_ADDRESS="0xa7284d3cc7d053fe7388401c1f31311baece1f6e"

# Deploy Account factory
forge script script/DeployAccountFactory.s.sol --sig "run(address)" $VERIFIER_PROXY_ADDRESS --fork-url $RPC_URL --private-key $PRIVATE_KEY --broadcast --verify --etherscan-api-key $ETHERSCAN_API_KEY

# Deploy name registry
forge script script/DeployNameRegistry.s.sol --fork-url $RPC_URL --private-key $PRIVATE_KEY --broadcast --verify  --etherscan-api-key $ETHERSCAN_API_KEY

# Deploy Ephemeral Notes using Test USDC
forge script script/DeployEphemeralNotes.s.sol --fork-url $RPC_URL --private-key $PRIVATE_KEY --broadcast --verify  --etherscan-api-key $ETHERSCAN_API_KEY

# From DeployAccountFactory
ADDR_ACCOUNT_FACTORY="0xd102Af345e3463DA0D0937861783fc64Dbf5c554"

# Deploy test Account and verify it on Etherscan
# forge script script/DeployTestAccount.s.sol --sig "run(address)" $ADDR_ACCOUNT_FACTORY --fork-url $RPC_URL --private-key $PRIVATE_KEY --broadcast --verify --etherscan-api-key $ETHERSCAN_API_KEY

# Deploy paymaster and verify it on Etherscan
forge script script/ManagePaymaster.s.sol --sig "deploy()" --fork-url $RPC_URL --private-key $PRIVATE_KEY --broadcast --verify --etherscan-api-key $ETHERSCAN_API_KEY

PAYMASTER_ADDR="0x9634d8b747fdfe5c4320dffff391c476322553f8"

# Start paymaster by depositing and whitelisting
forge script script/ManagePaymaster.s.sol --sig "start(address)" $PAYMASTER_ADDR --fork-url $RPC_URL --private-key $PRIVATE_KEY --broadcast --verify --etherscan-api-key $ETHERSCAN_API_KEY

# Add paymaster deposit
forge script script/ManagePaymaster.s.sol --sig "addDeposit(address)" $PAYMASTER_ADDR --fork-url $RPC_URL --private-key $PRIVATE_KEY --broadcast --verify --etherscan-api-key $ETHERSCAN_API_KEY

# Stop paymaster by clearing deposit
forge script script/ManagePaymaster.s.sol --sig "stop(address)" $PAYMASTER_ADDR --fork-url $RPC_URL --private-key $PRIVATE_KEY --broadcast --verify --etherscan-api-key $ETHERSCAN_API_KEY

# Upgrade verifier contract
forge script script/ManageVerifier.s.sol --sig "upgradeVerifier(bool)" <confirm> --fork-url $RPC_URL --private-key $PRIVATE_KEY

# Burn ownership of verifier contract
forge script script/ManageVerifier.s.sol --sig "burnOwnership(bool)" <confirm> --fork-url $RPC_URL --private-key $PRIVATE_KEY
