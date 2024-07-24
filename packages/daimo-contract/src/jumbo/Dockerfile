FROM indexsupply/shovel:2096

COPY mainnet/config.json ./mainnet-config.json
COPY testnet/config.json ./testnet-config.json

# must specify which config to use (mainnet or testnet)
CMD shovel -config ${NETWORK}-config.json -l :$PORT