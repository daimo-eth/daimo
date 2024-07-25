FROM indexsupply/shovel:2096
ARG NETWORK
RUN if [ "$NETWORK" != "mainnet" ] && [ "$NETWORK" != "testnet" ]; then echo "NETWORK must be mainnet or testnet" && exit 1; fi
COPY ${NETWORK}/config.json ./config.json
CMD shovel -config config.json -l :$PORT