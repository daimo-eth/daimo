// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.13;

// Uniswap deployments
// https://docs.uniswap.org/contracts/v3/reference/deployments/

// Mainnet USDC deployments
// https://developers.circle.com/stablecoins/docs/usdc-on-main-networks

// Sepolia USDC deployments
// https://developers.circle.com/stablecoins/docs/usdc-on-test-networks

// CCTP Token Messenger deployments
// https://developers.circle.com/stablecoins/docs/evm-smart-contracts#tokenmessenger-mainnet
// https://developers.circle.com/stablecoins/docs/evm-smart-contracts#tokenmessenger-testnet

// CCTP Token Minter deployments
// https://developers.circle.com/stablecoins/docs/evm-smart-contracts#tokenminter-mainnet
// https://developers.circle.com/stablecoins/docs/evm-smart-contracts#tokenminter-testnet

// ----------------- Chain IDs ----------------- //
uint256 constant ETH_MAINNET = 1;
uint256 constant AVAX_MAINNET = 43114; // C-chain
uint256 constant OP_MAINNET = 10;
uint256 constant ARBITRUM_MAINNET = 42161;
uint256 constant BASE_MAINNET = 8453;
uint256 constant POLYGON_MAINNET = 137; // PoS

uint256 constant ETH_TESTNET = 11155111;
uint256 constant AVAX_TESTNET = 43113; // Fuji
uint256 constant OP_TESTNET = 11155420;
uint256 constant ARBITRUM_TESTNET = 421614;
uint256 constant BASE_TESTNET = 84532;
uint256 constant POLYGON_TESTNET = 80002; // Polygon Amoy

// ----------------- CCTP Domains ----------------- //
uint32 constant ETH_DOMAIN = 0;
uint32 constant AVAX_DOMAIN = 1;
uint32 constant OP_DOMAIN = 2;
uint32 constant ARBITRUM_DOMAIN = 3;
uint32 constant BASE_DOMAIN = 6;
uint32 constant POLYGON_DOMAIN = 7;

// ----------------- Flex Swapper ----------------- //

// Ethereum Mainnet Flex Swapper Constants
address constant ETH_MAINNET_USDC = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48;
address constant ETH_MAINNET_UNISWAP_ROUTER = 0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45;
address constant ETH_MAINNET_UNISWAP_FACTORY = 0x1F98431c8aD98523631AE4a59f267346ea31F984;

// Ethereum Sepolia Flex Swapper Constants
address constant ETH_TESTNET_USDC = 0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238;
address constant ETH_TESTNET_UNISWAP_ROUTER = 0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E;
address constant ETH_TESTNET_UNISWAP_FACTORY = 0x0227628f3F023bb0B980b67D528571c95c6DaC1c;

// Base Flex Swapper Constants
address constant BASE_MAINNET_USDC = 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913;
address constant BASE_MAINNET_UNISWAP_ROUTER = 0x2626664c2603336E57B271c5C0b26F421741e481;
address constant BASE_MAINNET_UNISWAP_FACTORY = 0x33128a8fC17869897dcE68Ed026d694621f6FDfD;

// Base Sepolia Flex Swapper Constants
address constant BASE_TESTNET_USDC = 0x036CbD53842c5426634e7929541eC2318f3dCF7e;
address constant BASE_TESTNET_UNISWAP_ROUTER = 0x94cC0AaC535CCDB3C01d6787D6413C739ae12bc4;
address constant BASE_TESTNET_UNISWAP_FACTORY = 0x4752ba5DBc23f44D87826276BF6Fd6b1C372aD24;

// Op Mainnet Flex Swapper Constants
address constant OP_MAINNET_USDC = 0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85;
address constant OP_MAINNET_UNISWAP_ROUTER = 0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45;
address constant OP_MAINNET_UNISWAP_FACTORY = 0x1F98431c8aD98523631AE4a59f267346ea31F984;

// Op Sepolia Flex Swapper Constants
address constant OP_TESTNET_USDC = 0x5fd84259d66Cd46123540766Be93DFE6D43130D7;
address constant OP_TESTNET_UNISWAP_ROUTER = 0x94cC0AaC535CCDB3C01d6787D6413C739ae12bc4;
address constant OP_TESTNET_UNISWAP_FACTORY = 0x4752ba5DBc23f44D87826276BF6Fd6b1C372aD24;

// Arbitrum Mainnet Flex Swapper Constants
address constant ARBITRUM_MAINNET_USDC = 0xaf88d065e77c8cC2239327C5EDb3A432268e5831;
address constant ARBITRUM_MAINNET_UNISWAP_ROUTER = 0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45;
address constant ARBITRUM_MAINNET_UNISWAP_FACTORY = 0x1F98431c8aD98523631AE4a59f267346ea31F984;

// Arbitrum Sepolia Flex Swapper Constants
address constant ARBITRUM_TESTNET_USDC = 0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d;
address constant ARBITRUM_TESTNET_UNISWAP_ROUTER = 0x101F443B4d1b059569D643917553c771E1b9663E;
address constant ARBITRUM_TESTNET_UNISWAP_FACTORY = 0x248AB79Bbb9bC29bB72f7Cd42F17e054Fc40188e;

// Polygon Mainnet Flex Swapper Constants
address constant POLYGON_MAINNET_USDC = 0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359;
address constant POLYGON_MAINNET_UNISWAP_ROUTER = 0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45;
address constant POLYGON_MAINNET_UNISWAP_FACTORY = 0x1F98431c8aD98523631AE4a59f267346ea31F984;

// Polygon Amoy Flex Swapper Constants
address constant POLYGON_TESTNET_USDC = 0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582;
address constant POLYGON_TESTNET_UNISWAP_ROUTER = address(0); // Not deployed on Amoy
address constant POLYGON_TESTNET_UNISWAP_FACTORY = address(0); // Not deployed on Amoy

// Avax C-Chain Flex Swapper Constants
address constant AVAX_MAINNET_USDC = 0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E;
address constant AVAX_MAINNET_UNISWAP_ROUTER = 0xbb00FF08d01D300023C629E8fFfFcb65A5a578cE;
address constant AVAX_MAINNET_UNISWAP_FACTORY = 0x740b1c1de25031C31FF4fC9A62f554A55cdC1baD;

// Avax Sepolia Flex Swapper Constants
address constant AVAX_TESTNET_USDC = 0x5425890298aed601595a70AB815c96711a31Bc65;
address constant AVAX_TESTNET_UNISWAP_ROUTER = address(0); // Not deployed
address constant AVAX_TESTNET_UNISWAP_FACTORY = address(0); // Not deployed

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

// Stablecoin Addresses
// DAI
address constant ETH_MAINNET_DAI = 0x6B175474E89094C44Da98b954EedeAC495271d0F;
address constant BASE_MAINNET_DAI = 0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb;
address constant OP_MAINNET_DAI = 0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1;
address constant ARBITRUM_MAINNET_DAI = 0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1;
address constant POLYGON_MAINNET_DAI = 0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063;
address constant AVAX_MAINNET_DAI = 0xd586E7F844cEa2F87f50152665BCbc2C279D8d70;

// USDT
address constant ETH_MAINNET_USDT = 0xdAC17F958D2ee523a2206206994597C13D831ec7;
address constant BASE_MAINNET_USDT = 0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2;
address constant OP_MAINNET_USDT = 0x94b008aA00579c1307B0EF2c499aD98a8ce58e58;
address constant ARBITRUM_MAINNET_USDT = 0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9;
address constant POLYGON_MAINNET_USDT = 0xc2132D05D31c914a87C6611C10748AEb04B58e8F;
address constant AVAX_MAINNET_USDT = 0xc7198437980c041c805A1EDcbA50c1Ce5db95118;

// USDC.e or USDbC (bridged USDC)
address constant BASE_MAINNET_BRIDGED_USDC = 0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA;
address constant OP_MAINNET_BRIDGED_USDC = 0x7F5c764cBc14f9669B88837ca1490cCa17c31607;
address constant ARBITRUM_MAINNET_BRIDGED_USDC = 0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8;
address constant POLYGON_MAINNET_BRIDGED_USDC = 0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174;
address constant AVAX_MAINNET_BRIDGED_USDC = 0xA7D7079b0FEaD91F3e65f86E8915Cb59c1a4C664;

function _getUSDCAddress(uint256 chainId) pure returns (address) {
    // Mainnets
    if (chainId == ETH_MAINNET) return ETH_MAINNET_USDC;
    if (chainId == BASE_MAINNET) return BASE_MAINNET_USDC;
    if (chainId == OP_MAINNET) return OP_MAINNET_USDC;
    if (chainId == ARBITRUM_MAINNET) return ARBITRUM_MAINNET_USDC;
    if (chainId == POLYGON_MAINNET) return POLYGON_MAINNET_USDC;
    if (chainId == AVAX_MAINNET) return AVAX_MAINNET_USDC;

    // Testnets
    if (chainId == ETH_TESTNET) return ETH_TESTNET_USDC;
    if (chainId == BASE_TESTNET) return BASE_TESTNET_USDC;
    if (chainId == OP_TESTNET) return OP_TESTNET_USDC;
    if (chainId == ARBITRUM_TESTNET) return ARBITRUM_TESTNET_USDC;
    if (chainId == POLYGON_TESTNET) return POLYGON_TESTNET_USDC;
    if (chainId == AVAX_TESTNET) return AVAX_TESTNET_USDC;

    revert("Unsupported chainID");
}

function _getUniswapFactoryAddress(uint256 chainId) pure returns (address) {
    // Mainnets
    if (chainId == ETH_MAINNET) return ETH_MAINNET_UNISWAP_FACTORY;
    if (chainId == BASE_MAINNET) return BASE_MAINNET_UNISWAP_FACTORY;
    if (chainId == OP_MAINNET) return OP_MAINNET_UNISWAP_FACTORY;
    if (chainId == ARBITRUM_MAINNET) return ARBITRUM_MAINNET_UNISWAP_FACTORY;
    if (chainId == POLYGON_MAINNET) return POLYGON_MAINNET_UNISWAP_FACTORY;
    if (chainId == AVAX_MAINNET) return AVAX_MAINNET_UNISWAP_FACTORY;

    // Testnets
    if (chainId == ETH_TESTNET) return ETH_TESTNET_UNISWAP_FACTORY;
    if (chainId == BASE_TESTNET) return BASE_TESTNET_UNISWAP_FACTORY;
    if (chainId == OP_TESTNET) return OP_TESTNET_UNISWAP_FACTORY;
    if (chainId == ARBITRUM_TESTNET) return ARBITRUM_TESTNET_UNISWAP_FACTORY;
    if (chainId == POLYGON_TESTNET) return POLYGON_TESTNET_UNISWAP_FACTORY;
    if (chainId == AVAX_TESTNET) return AVAX_TESTNET_UNISWAP_FACTORY;

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

// Note: There is no swapping liquidity on testnets so no need for
// stablecoin options.
function _getDAIAddress(uint256 chainId) pure returns (address) {
    if (chainId == ETH_MAINNET) return ETH_MAINNET_DAI;
    if (chainId == BASE_MAINNET) return BASE_MAINNET_DAI;
    if (chainId == OP_MAINNET) return OP_MAINNET_DAI;
    if (chainId == ARBITRUM_MAINNET) return ARBITRUM_MAINNET_DAI;
    if (chainId == POLYGON_MAINNET) return POLYGON_MAINNET_DAI;
    if (chainId == AVAX_MAINNET) return AVAX_MAINNET_DAI;

    if (_isTestnet(chainId)) return address(0);

    revert("Unsupported chainID");
}

function _getUSDTAddress(uint256 chainId) pure returns (address) {
    if (chainId == ETH_MAINNET) return ETH_MAINNET_USDT;
    if (chainId == BASE_MAINNET) return BASE_MAINNET_USDT;
    if (chainId == OP_MAINNET) return OP_MAINNET_USDT;
    if (chainId == ARBITRUM_MAINNET) return ARBITRUM_MAINNET_USDT;
    if (chainId == POLYGON_MAINNET) return POLYGON_MAINNET_USDT;
    if (chainId == AVAX_MAINNET) return AVAX_MAINNET_USDT;

    if (_isTestnet(chainId)) return address(0);

    revert("Unsupported chainID");
}

function _getBridgedUSDCAddress(uint256 chainId) pure returns (address) {
    if (chainId == BASE_MAINNET) return BASE_MAINNET_BRIDGED_USDC;
    if (chainId == OP_MAINNET) return OP_MAINNET_BRIDGED_USDC;
    if (chainId == ARBITRUM_MAINNET) return ARBITRUM_MAINNET_BRIDGED_USDC;
    if (chainId == POLYGON_MAINNET) return POLYGON_MAINNET_BRIDGED_USDC;
    if (chainId == AVAX_MAINNET) return AVAX_MAINNET_BRIDGED_USDC;

    revert("Unsupported chainID");
}

// Chainlink DataFeed aggregator addresses (tokenIn --> USD)
address constant ETH_MAINNET_AAVE_USD_AGGREGATOR = 0x547a514d5e3769680Ce22B2361c10Ea13619e8a9;

address constant BASE_MAINNET_AAVE_USD_AGGREGATOR = 0x72484B12719E23115761D5DA1646945632979bB6;
address constant BASE_MAINNET_DOGE_USD_AGGREGATOR = 0xbaf9327b6564454F4a3364C33eFeEf032b4b4444;
address constant BASE_MAINNET_ETH_USD_AGGREGATOR = 0xF9680D99D6C9589e2a93a78A04A279e509205945;
address constant BASE_MAINNET_MKR_USD_AGGREGATOR = 0xa070427bF5bA5709f70e98b94Cb2F435a242C46C;
address constant BASE_MAINNET_MATIC_USD_AGGREGATOR = 0xAB594600376Ec9fD91F8e885dADF0CE036862dE0;
address constant BASE_MAINNET_UNI_USD_AGGREGATOR = 0xdf0Fb4e4F928d2dCB76f438575fDD8682386e13C;
address constant BASE_MAINNET_WBTC_USD_AGGREGATOR = 0xDE31F8bFBD8c84b5360CFACCa3539B938dd78ae6;

address constant AVAX_MAINNET_AAVE_USD_AGGREGATOR = 0x3CA13391E9fb38a75330fb28f8cc2eB3D9ceceED;
address constant AVAX_MAINNET_AVAX_USD_AGGREGATOR = 0x0A77230d17318075983913bC2145DB16C7366156;
address constant AVAX_MAINNET_DOT_USD_AGGREGATOR = 0xD73a74314AcCb53b30cAfDA0cb61c9772B57C4a2;
address constant AVAX_MAINNET_MATIC_USD_AGGREGATOR = 0x1db18D41E4AD2403d9f52b5624031a2D9932Fd73;
address constant AVAX_MAINNET_MKR_USD_AGGREGATOR = 0x3E54eB0475051401D093702A5DB84EFa1Ab77b14;
address constant AVAX_MAINNET_UNI_USD_AGGREGATOR = 0x9a1372f9b1B71B3A5a72E092AE67E172dBd7Daaa;

// ----------------- CCTP Bridger ----------------- //

address constant ETH_MAINNET_TOKEN_MESSENGER = 0xBd3fa81B58Ba92a82136038B25aDec7066af3155;
address constant AVAX_MAINNET_TOKEN_MESSENGER = 0x6B25532e1060CE10cc3B0A99e5683b91BFDe6982;
address constant OP_MAINNET_TOKEN_MESSENGER = 0x2B4069517957735bE00ceE0fadAE88a26365528f;
address constant ARBITRUM_MAINNET_TOKEN_MESSENGER = 0x19330d10D9Cc8751218eaf51E8885D058642E08A;
address constant BASE_MAINNET_TOKEN_MESSENGER = 0x1682Ae6375C4E4A97e4B583BC394c861A46D8962;
address constant POLYGON_MAINNET_TOKEN_MESSENGER = 0x9daF8c91AEFAE50b9c0E69629D3F6Ca40cA3B3FE;

// Same on all testnets except Avax.
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

// Check whether the chain is a testnet.
function _isTestnet(uint256 chainId) pure returns (bool) {
    return
        chainId == ETH_TESTNET ||
        chainId == AVAX_TESTNET ||
        chainId == OP_TESTNET ||
        chainId == ARBITRUM_TESTNET ||
        chainId == BASE_TESTNET ||
        chainId == POLYGON_TESTNET;
}

// Check whether the chain is L1.
function _isL1(uint256 chainId) pure returns (bool) {
    return chainId == ETH_MAINNET;
}

// ----------------- Fast CCTP ----------------- //
address constant ETH_MAINNET_TOKEN_MINTER = 0xc4922d64a24675E16e1586e3e3Aa56C06fABe907;
address constant AVAX_MAINNET_TOKEN_MINTER = 0x420F5035fd5dC62a167E7e7f08B604335aE272b8;
address constant OP_MAINNET_TOKEN_MINTER = 0x33E76C5C31cb928dc6FE6487AB3b2C0769B1A1e3;
address constant ARBITRUM_MAINNET_TOKEN_MINTER = 0xE7Ed1fa7f45D05C508232aa32649D89b73b8bA48;
address constant BASE_MAINNET_TOKEN_MINTER = 0xe45B133ddc64bE80252b0e9c75A8E74EF280eEd6;
address constant POLYGON_MAINNET_TOKEN_MINTER = 0x10f7835F827D6Cf035115E10c50A853d7FB2D2EC;

// Same on all testnets except Avax.
address constant TESTNET_TOKEN_MINTER = 0xE997d7d2F6E065a9A93Fa2175E878Fb9081F1f0A;
address constant AVAX_TESTNET_TOKEN_MINTER = 0x4ED8867f9947A5fe140C9dC1c6f207F3489F501E;

// Retrieve the token messenger address for a given chainId.
function _getTokenMinterAddress(uint256 chainId) pure returns (address) {
    // Mainnets
    if (chainId == ETH_MAINNET) return ETH_MAINNET_TOKEN_MINTER;
    if (chainId == AVAX_MAINNET) return AVAX_MAINNET_TOKEN_MINTER;
    if (chainId == OP_MAINNET) return OP_MAINNET_TOKEN_MINTER;
    if (chainId == ARBITRUM_MAINNET) return ARBITRUM_MAINNET_TOKEN_MINTER;
    if (chainId == BASE_MAINNET) return BASE_MAINNET_TOKEN_MINTER;
    if (chainId == POLYGON_MAINNET) return POLYGON_MAINNET_TOKEN_MINTER;

    // Testnets
    if (chainId == AVAX_TESTNET) return AVAX_TESTNET_TOKEN_MINTER;
    if (
        chainId == ETH_TESTNET ||
        chainId == OP_TESTNET ||
        chainId == ARBITRUM_TESTNET ||
        chainId == BASE_TESTNET ||
        chainId == POLYGON_TESTNET
    ) return TESTNET_TOKEN_MINTER;

    revert("Unsupported chainID");
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
