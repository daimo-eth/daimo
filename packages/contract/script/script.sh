#!/bin/bash
set -e

# Build
forge build

# Stablecoin, Base Goerli testnet USDC
# ADDR_TOKEN="0x1B85deDe8178E18CdE599B4C9d913534553C3dBf"

ADDR_TOKEN=0x833589fcd6edb6e08f4c7c32d4f71b54bda02913

# Deploy Account factory
# forge script script/DeployAccountFactory.s.sol --fork-url $RPC_URL --private-key $PRIVATE_KEY --broadcast --verify --etherscan-api-key $ETHERSCAN_API_KEY

# # Deploy name registry
# forge script script/DeployNameRegistry.s.sol --fork-url $RPC_URL --private-key $PRIVATE_KEY --broadcast --verify  --etherscan-api-key $ETHERSCAN_API_KEY

# # Deploy Ephemeral Notes using Test USDC
# forge script script/DeployEphemeralNotes.s.sol --sig "run(address)" $ADDR_TOKEN --fork-url $RPC_URL --private-key $PRIVATE_KEY --broadcast --verify  --etherscan-api-key $ETHERSCAN_API_KEY

# From DeployAccountFactory
ADDR_ACCOUNT_FACTORY="0xe5a1744d42a30c3bb87f16fbc4484b984594cd7c"

# Deploy test Account and verify it on Etherscan
forge script script/DeployTestAccount.s.sol --sig "run(address)" $ADDR_ACCOUNT_FACTORY --fork-url $RPC_URL --private-key $PRIVATE_KEY --broadcast --verify --etherscan-api-key $ETHERSCAN_API_KEY