// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.13;

// Uniswap deployments
// https://docs.uniswap.org/contracts/v3/reference/deployments/

// Mainnet USDC deployments
// https://developers.circle.com/stablecoins/docs/usdc-on-main-networks

// Sepolia USDC deployments
// https://developers.circle.com/stablecoins/docs/usdc-on-test-networks

// CCTP Token Messenger deployments
// https://developers.circle.com/stablecoins/docs/evm-smart-contracts

// ----------------- Chain IDs ----------------- //
uint256 constant ETH_MAINNET = 1;
uint256 constant AVAX_MAINNET = 43114;
uint256 constant OP_MAINNET = 10;
uint256 constant ARBITRUM_MAINNET = 42161;
uint256 constant BASE_MAINNET = 8453;
uint256 constant POLYGON_MAINNET = 137;

uint256 constant ETH_TESTNET = 11155111;
uint256 constant AVAX_TESTNET = 43113;
uint256 constant OP_TESTNET = 11155420;
uint256 constant ARBITRUM_TESTNET = 421614;
uint256 constant BASE_TESTNET = 84532;
uint256 constant POLYGON_TESTNET = 80002;

// ----------------- CCTP Domains ----------------- //
uint32 constant ETH_DOMAIN = 0;
uint32 constant AVAX_DOMAIN = 1;
uint32 constant OP_DOMAIN = 2;
uint32 constant ARBITRUM_DOMAIN = 3;
uint32 constant BASE_DOMAIN = 6;
uint32 constant POLYGON_DOMAIN = 7;

// ----------------- USDC Swapper ----------------- //

// Ethereum USDC Swapper Constants
address constant ETH_MAINNET_USDC = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48;
address constant ETH_MAINNET_UNISWAP_ROUTER = 0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45;
address constant ETH_MAINNET_UNISWAP_FACTORY = 0x1F98431c8aD98523631AE4a59f267346ea31F984;

// Sepolia USDC Swapper Constants
address constant ETH_TESTNET_USDC = 0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238;
address constant ETH_TESTNET_UNISWAP_ROUTER = 0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E;
address constant ETH_TESTNET_UNISWAP_FACTORY = 0x0227628f3F023bb0B980b67D528571c95c6DaC1c;

// Base USDC Swapper Constants
address constant BASE_MAINNET_USDC = 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913;
address constant BASE_MAINNET_UNISWAP_ROUTER = 0x2626664c2603336E57B271c5C0b26F421741e481;
address constant BASE_MAINNET_UNISWAP_FACTORY = 0x33128a8fC17869897dcE68Ed026d694621f6FDfD;

// Base Sepolia USDC Swapper Constants
address constant BASE_TESTNET_USDC = 0x036CbD53842c5426634e7929541eC2318f3dCF7e;
address constant BASE_TESTNET_UNISWAP_ROUTER = 0x94cC0AaC535CCDB3C01d6787D6413C739ae12bc4;
address constant BASE_TESTNET_UNISWAP_FACTORY = 0x4752ba5DBc23f44D87826276BF6Fd6b1C372aD24;

// Op Mainnet USDC Swapper Constants
address constant OP_MAINNET_USDC = 0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85;
address constant OP_MAINNET_UNISWAP_ROUTER = 0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45;
address constant OP_MAINNET_UNISWAP_FACTORY = 0x1F98431c8aD98523631AE4a59f267346ea31F984;

// Op Sepolia USDC Swapper Constants
address constant OP_TESTNET_USDC = 0x5fd84259d66Cd46123540766Be93DFE6D43130D7;
address constant OP_TESTNET_UNISWAP_ROUTER = 0x94cC0AaC535CCDB3C01d6787D6413C739ae12bc4;
address constant OP_TESTNET_UNISWAP_FACTORY = 0x4752ba5DBc23f44D87826276BF6Fd6b1C372aD24;

// WETH and wrapped native tokens
address constant ETH_MAINNET_WETH = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;
address constant ETH_TESTNET_WETH = 0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9;
address constant OP_STACK_WETH = 0x4200000000000000000000000000000000000006;
address constant ARB_MAINNET_WETH = 0x82aF49447D8a07e3bd95BD0d56f35241523fBab1;
address constant ARB_TESTNET_WETH = 0x980B62Da83eFf3D4576C647993b0c1D7faf17c73;
address constant POLYGON_WETH = 0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619;
address constant AVAX_WETH = 0x49D5c2BdFfac6CE2BFdB6640F4F80f226bc10bAB;

address constant POLYGON_WMATIC = 0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270;
address constant AVAX_WAVAX = 0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7;

function _getUSDCAddress(uint256 chainId) pure returns (address) {
    // Mainnets
    if (chainId == ETH_MAINNET) return ETH_MAINNET_USDC;
    if (chainId == BASE_MAINNET) return BASE_MAINNET_USDC;
    if (chainId == OP_MAINNET) return OP_MAINNET_USDC;

    // Testnets
    if (chainId == ETH_TESTNET) return ETH_TESTNET_USDC;
    if (chainId == BASE_TESTNET) return BASE_TESTNET_USDC;
    if (chainId == OP_TESTNET) return OP_TESTNET_USDC;

    revert("Unsupported chainID");
}

function _getUniswapSwapRouterAddress(uint256 chainId) pure returns (address) {
    // Mainnets
    if (chainId == ETH_MAINNET) return ETH_MAINNET_UNISWAP_ROUTER;
    if (chainId == BASE_MAINNET) return BASE_MAINNET_UNISWAP_ROUTER;
    if (chainId == OP_MAINNET) return OP_MAINNET_UNISWAP_ROUTER;

    // Testnets
    if (chainId == ETH_TESTNET) return ETH_TESTNET_UNISWAP_ROUTER;
    if (chainId == BASE_TESTNET) return BASE_TESTNET_UNISWAP_ROUTER;
    if (chainId == OP_TESTNET) return OP_TESTNET_UNISWAP_ROUTER;

    revert("Unsupported chainID");
}

function _getUniswapFactoryAddress(uint256 chainId) pure returns (address) {
    // Mainnets
    if (chainId == ETH_MAINNET) return ETH_MAINNET_UNISWAP_FACTORY;
    if (chainId == BASE_MAINNET) return BASE_MAINNET_UNISWAP_FACTORY;
    if (chainId == OP_MAINNET) return OP_MAINNET_UNISWAP_FACTORY;

    // Testnets
    if (chainId == ETH_TESTNET) return ETH_TESTNET_UNISWAP_FACTORY;
    if (chainId == BASE_TESTNET) return BASE_TESTNET_UNISWAP_FACTORY;
    if (chainId == OP_TESTNET) return OP_TESTNET_UNISWAP_FACTORY;

    revert("Unsupported chainID");
}

function _getWETH(uint256 chainId) pure returns (address) {
    // Mainnets
    if (chainId == ETH_MAINNET) return ETH_MAINNET_WETH;
    if (chainId == BASE_MAINNET) return OP_STACK_WETH;
    if (chainId == OP_MAINNET) return OP_STACK_WETH;
    if (chainId == ARBITRUM_MAINNET) return ARB_MAINNET_WETH;
    if (chainId == POLYGON_MAINNET) return POLYGON_WETH;
    if (chainId == AVAX_MAINNET) return AVAX_WETH;

    // Testnets
    if (chainId == ETH_TESTNET) return ETH_TESTNET_WETH;
    if (chainId == BASE_TESTNET) return OP_STACK_WETH;
    if (chainId == OP_TESTNET) return OP_STACK_WETH;
    if (chainId == ARBITRUM_TESTNET) return ARB_TESTNET_WETH;
    if (chainId == POLYGON_TESTNET) return POLYGON_WETH;
    if (chainId == AVAX_TESTNET) return AVAX_WETH;

    revert("Unsupported chainID");
}

function _getWrappedNativeToken(uint256 chainId) pure returns (address) {
    if (chainId == POLYGON_MAINNET) return POLYGON_WMATIC;
    if (chainId == AVAX_MAINNET) return AVAX_WAVAX;

    if (chainId == POLYGON_TESTNET) return POLYGON_WMATIC;
    if (chainId == AVAX_TESTNET) return AVAX_WAVAX;

    return _getWETH(chainId);
}

// ----------------- CCTP Bridger ----------------- //

address constant ETH_MAINNET_TOKEN_MESSENGER = 0xBd3fa81B58Ba92a82136038B25aDec7066af3155;

address constant AVAX_MAINNET_TOKEN_MESSENGER = 0x6B25532e1060CE10cc3B0A99e5683b91BFDe6982;

address constant OP_MAINNET_TOKEN_MESSENGER = 0x2B4069517957735bE00ceE0fadAE88a26365528f;

address constant ARBITRUM_MAINNET_TOKEN_MESSENGER = 0x19330d10D9Cc8751218eaf51E8885D058642E08A;

address constant BASE_MAINNET_TOKEN_MESSENGER = 0x1682Ae6375C4E4A97e4B583BC394c861A46D8962;

address constant POLYGON_MAINNET_TOKEN_MESSENGER = 0x9daF8c91AEFAE50b9c0E69629D3F6Ca40cA3B3FE;

// Same on all except Avax.
address constant TESTNET_TOKEN_MESSENGER = 0x9f3B8679c73C2Fef8b59B4f3444d4e156fb70AA5;

address constant AVAX_TESTNET_TOKEN_MESSENGER = 0xeb08f243E5d3FCFF26A9E38Ae5520A669f4019d0;

// Retrieve the token messenger address for a given chainId.
function _getTokenMessengerAddress(uint256 chainId) pure returns (address) {
    // Mainnets
    if (chainId == ETH_MAINNET) return ETH_MAINNET_TOKEN_MESSENGER;
    if (chainId == AVAX_MAINNET) return AVAX_MAINNET_TOKEN_MESSENGER;
    if (chainId == OP_MAINNET) return OP_MAINNET_TOKEN_MESSENGER;
    if (chainId == ARBITRUM_MAINNET) return ARBITRUM_MAINNET_TOKEN_MESSENGER;
    if (chainId == BASE_MAINNET) return BASE_MAINNET_TOKEN_MESSENGER;
    if (chainId == POLYGON_MAINNET) return POLYGON_MAINNET_TOKEN_MESSENGER;

    // Testnets
    if (chainId == AVAX_TESTNET) return AVAX_TESTNET_TOKEN_MESSENGER;
    if (
        chainId == ETH_TESTNET ||
        chainId == OP_TESTNET ||
        chainId == ARBITRUM_TESTNET ||
        chainId == BASE_TESTNET ||
        chainId == POLYGON_TESTNET
    ) return TESTNET_TOKEN_MESSENGER;

    revert("Unsupported chainID");
}

// Get whether the chain is a testnet.
function _isTestnet(uint256 chainId) pure returns (bool) {
    return
        chainId == ETH_TESTNET ||
        chainId == AVAX_TESTNET ||
        chainId == OP_TESTNET ||
        chainId == ARBITRUM_TESTNET ||
        chainId == BASE_TESTNET ||
        chainId == POLYGON_TESTNET;
}

// ----------------- Deployment ----------------- //

ICREATE3Factory constant CREATE3 = ICREATE3Factory(
    0x9fBB3DF7C40Da2e5A0dE984fFE2CCB7C47cd0ABf
);

/// @title Factory for deploying contracts to deterministic addresses via CREATE3
/// @author zefram.eth
/// @notice Enables deploying contracts using CREATE3. Each deployer (msg.sender) has
/// its own namespace for deployed addresses.
interface ICREATE3Factory {
    /// @notice Deploys a contract using CREATE3
    /// @dev The provided salt is hashed together with msg.sender to generate the final salt
    /// @param salt The deployer-specific salt for determining the deployed contract's address
    /// @param creationCode The creation code of the contract to deploy
    /// @return deployed The address of the deployed contract
    function deploy(
        bytes32 salt,
        bytes memory creationCode
    ) external payable returns (address deployed);
}
