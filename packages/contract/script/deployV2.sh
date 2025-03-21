#!/bin/bash
set -e


# If necessary, run `npm run fetch` first in daimo-contract
# cp ../daimo-contract/script/chainlink/4-valid-feeds.jsonl chainlink-feeds.jsonl

# Requirements:
# ALCHEMY_API_KEY
# PRIVATE_KEY for the deployer
# ETHERSCAN_API_KEY_... for each target chain

SCRIPTS=(
    # Utils
    # "script/DeployCreate3Factory.s.sol"
    # "script/pay/DeployDaimoPayBatchReadUtils.s.sol"

    # Daimo Pay
    # "script/pay/DeployDaimoPayAcrossBridger.s.sol"
    # "script/pay/DeployDaimoPayCCTPBridger.s.sol"
    # "script/pay/DeployDaimoPayAxelarBridger.s.sol"
    # "script/pay/DeployDaimoPayBridger.s.sol"
    # "script/pay/DeployPayIntentFactory.s.sol"
    # "script/pay/DeployDaimoPay.s.sol"
    # "script/pay/DeployDaimoPayRelayer.s.sol" # The deployer must be the LP that calls this contract.

    # DAv2
    # "script/DeployFlexSwapperUniOnly.s.sol"
    # "script/DeployFlexSwapper.s.sol"
    # "script/DeployCCTPBridger.s.sol"
    # "script/DeployAccountFactoryV2.s.sol"
    # "script/DeployTestAccountV2.s.sol"

    # SWAPBOT (ensure private key is swapbot EOA)
    # "script/DeploySwapbotLP.s.sol" 
)
CHAINS=(
    # MAINNETS
    # "$ETHERSCAN_API_KEY_BASE,https://base-mainnet.g.alchemy.com/v2/$ALCHEMY_API_KEY"
    # "$ETHERSCAN_API_KEY_OP,https://opt-mainnet.g.alchemy.com/v2/$ALCHEMY_API_KEY"
    # "$ETHERSCAN_API_KEY_ARB,https://arb-mainnet.g.alchemy.com/v2/$ALCHEMY_API_KEY"
    # "$ETHERSCAN_API_KEY_POLYGON,https://polygon-mainnet.g.alchemy.com/v2/$ALCHEMY_API_KEY"
    # "$ETHERSCAN_API_KEY_LINEA,https://linea-mainnet.g.alchemy.com/v2/$ALCHEMY_API_KEY"
    # "$ETHERSCAN_API_KEY_BSC,https://bnb-mainnet.g.alchemy.com/v2/$ALCHEMY_API_KEY"
    # "$ETHERSCAN_API_KEY_WORLD,https://worldchain-mainnet.g.alchemy.com/v2/$ALCHEMY_API_KEY"
    # "$ETHERSCAN_API_KEY_BLAST,https://blast-mainnet.g.alchemy.com/v2/$ALCHEMY_API_KEY"
    # "$ETHERSCAN_API_KEY_MANTLE,https://mantle-rpc.publicnode.com"
    # "$ETHERSCAN_API_KEY_L1,https://eth-mainnet.g.alchemy.com/v2/$ALCHEMY_API_KEY" # Expensive, deploy last

    # Not supporting Avalanche, skip.
    # No Alchemy for Avalanche, Etherscan key is "verifyContract"
    # "verifyContract,https://avalanche-c-chain-rpc.publicnode.com"  

    # TESTNETS
    # "$ETHERSCAN_API_KEY_L1,https://eth-sepolia.g.alchemy.com/v2/$ALCHEMY_API_KEY"
    # "$ETHERSCAN_API_KEY_BASE,https://sepolia.base.org"
 
)

for SCRIPT in "${SCRIPTS[@]}"; do
    for CHAIN in "${CHAINS[@]}"; do
        IFS=',' read -r ETHERSCAN_API_KEY RPC_URL <<< "$CHAIN"
        echo ""
        echo "======= RUNNING $SCRIPT ========" 
        echo "ETHERSCAN_API_KEY: $ETHERSCAN_API_KEY"
        echo "RPC_URL          : $RPC_URL"

        FORGE_CMD="forge script $SCRIPT --sig run --fork-url $RPC_URL --private-key $PRIVATE_KEY --verify --etherscan-api-key $ETHERSCAN_API_KEY --broadcast"

        echo $FORGE_CMD
        echo ""
        $FORGE_CMD || exit 1
    done
done
