#!/usr/bin/env bash
set -euo pipefail

# get parameter from command line
if [ -z "$1" ]; then
    echo "Usage: $0 <qadena_ip>"
    exit 1
fi

QADENA_IP=$1

# Fetch genesis data from Qadena node
echo "Fetching genesis data from Qadena node at $QADENA_IP..."
curl http://$QADENA_IP:26657/genesis | jq .result.genesis > callisto_data/genesis.json
echo "Genesis data saved to callisto_data/genesis.json"
