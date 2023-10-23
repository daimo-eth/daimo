#!/bin/bash
set -e

# Build
forge build

# Deploy Account factory
forge script script/DeployAccountFactory.s.sol --fork-url $RPC_URL --private-key $PRIVATE_KEY --broadcast --verify --etherscan-api-key $ETHERSCAN_API_KEY

# Deploy name registry
forge script script/DeployNameRegistry.s.sol --fork-url $RPC_URL --private-key $PRIVATE_KEY --broadcast --verify  --etherscan-api-key $ETHERSCAN_API_KEY

# Deploy Ephemeral Notes using Test USDC
forge script script/DeployEphemeralNotes.s.sol --fork-url $RPC_URL --private-key $PRIVATE_KEY --broadcast --verify  --etherscan-api-key $ETHERSCAN_API_KEY

# From DeployAccountFactory
ADDR_ACCOUNT_FACTORY="0xED5F5066de0c177729Eb0D5FECEC4BF87CA6Bf3C"

# Deploy test Account and verify it on Etherscan
forge script script/DeployTestAccount.s.sol --sig "run(address)" $ADDR_ACCOUNT_FACTORY --fork-url $RPC_URL --private-key $PRIVATE_KEY --broadcast --verify --etherscan-api-key $ETHERSCAN_API_KEY

# Deploy paymaster and verify it on Etherscan
forge script script/ManagePaymaster.s.sol --sig "deploy()" --fork-url $RPC_URL --private-key $PRIVATE_KEY --broadcast --verify --etherscan-api-key $ETHERSCAN_API_KEY

PAYMASTER_ADDR="0x5B746BE4D3aC8702dc01fBfDFD8818fC9F8C8F79"

# Start paymaster by depositing and whitelisting
forge script script/ManagePaymaster.s.sol --sig "start(address)" $PAYMASTER_ADDR --fork-url $RPC_URL --private-key $PRIVATE_KEY --broadcast --verify --etherscan-api-key $ETHERSCAN_API_KEY

# Add paymaster deposit
forge script script/ManagePaymaster.s.sol --sig "addDeposit(address)" $PAYMASTER_ADDR --fork-url $RPC_URL --private-key $PRIVATE_KEY --broadcast --verify --etherscan-api-key $ETHERSCAN_API_KEY

# Stop paymaster by clearing deposit
forge script script/ManagePaymaster.s.sol --sig "stop(address)" $PAYMASTER_ADDR --fork-url $RPC_URL --private-key $PRIVATE_KEY --broadcast --verify --etherscan-api-key $ETHERSCAN_API_KEY
