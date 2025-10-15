#!/bin/zsh
set -euo pipefail

source .env

# get parameter from command line or prompt for it
if [ -z "${1:-}" ]; then
    echo "Usage: $0 <qadena_ip>"
    exit 1
else
    QADENA_IP=$1
fi

# Fetch genesis data from Qadena node
echo "Fetching genesis data from Qadena node at $QADENA_IP..."
curl http://$QADENA_IP:26657/genesis | jq .result.genesis > callisto_data/genesis.json
echo "Genesis data saved to callisto_data/genesis.json"

# set up callisto
cd callisto_data

# check if config.yaml exists, otherwise copy config.yaml.sample
if [ ! -f config.yaml ]; then
    echo "Creating config.yaml from sample..."
    cp config.yaml.sample config.yaml
    # Update the port number to use PORT from .env
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS (BSD sed)
        sed -i "" "s|port: 3000|port: $PORT|g" config.yaml
    else
        # Linux (GNU sed)
        sed -i "s|port: 3000|port: $PORT|g" config.yaml
    fi
    echo "✅ config.yaml created and updated with port $PORT"
fi

cd ..
