#!/bin/bash
set -e

# Requirements:
# ALCHEMY_API_KEY
# PRIVATE_KEY for the deployer
# ETHERSCAN_API_KEY_... for each target chain

SCRIPTS=(
    "script/DeployFastCCTP.s.sol"
    "script/DeployFlexSwapper.s.sol"
    "script/DeployCCTPBridger.s.sol"
    "script/DeployAccountFactoryV2.s.sol"
    "script/DeployTestAccountV2.s.sol"
)
CHAINS=(
    # MAINNETS
    # "$ETHERSCAN_API_KEY_BASE,https://base-mainnet.g.alchemy.com/v2/$ALCHEMY_API_KEY"
    "$ETHERSCAN_API_KEY_OP,https://opt-mainnet.g.alchemy.com/v2/$ALCHEMY_API_KEY"
    # "$ETHERSCAN_API_KEY_ARB,https://arb-mainnet.g.alchemy.com/v2/$ALCHEMY_API_KEY"
    "$ETHERSCAN_API_KEY_POLYGON,https://polygon-mainnet.g.alchemy.com/v2/$ALCHEMY_API_KEY"
    # "verifyContract,https://avalanche-c-chain-rpc.publicnode.com"  # No Alchemy for Avalanche, Etherscan key is "verifyContract"
    # "$ETHERSCAN_API_KEY_L1,https://eth-mainnet.g.alchemy.com/v2/$ALCHEMY_API_KEY" # Expensive, deploy last

    # TESTNETS
    # "$ETHERSCAN_API_KEY_L1,wss://ethereum-sepolia-rpc.publicnode.com"
    # "$ETHERSCAN_API_KEY_BASE,https://sepolia.base.org"
 
)

for SCRIPT in "${SCRIPTS[@]}"; do
    for CHAIN in "${CHAINS[@]}"; do
        IFS=',' read -r ETHERSCAN_API_KEY RPC_URL <<< "$CHAIN"
        echo ""
        echo "======= RUNNING $SCRIPT ========" 
        echo "ETHERSCAN_API_KEY: $ETHERSCAN_API_KEY"
        echo "RPC_URL          : $RPC_URL"
        echo forge script $SCRIPT --sig "run" --fork-url $RPC_URL --private-key $PRIVATE_KEY --verify --etherscan-api-key $ETHERSCAN_API_KEY --broadcast
        echo ""
        forge script $SCRIPT --sig "run" --fork-url $RPC_URL --private-key $PRIVATE_KEY --verify --broadcast  || exit 1
    done
done
