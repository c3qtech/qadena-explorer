#!/usr/bin/env bash
set -euo pipefail

# Ask for Qadena IP address
read -p "Enter the IP address of Qadena: " QADENA_IP

# Fetch genesis data from Qadena node
echo "Fetching genesis data from Qadena node at $QADENA_IP..."
curl http://$QADENA_IP:26657/genesis | jq .result.genesis > callisto_data/genesis.json
echo "Genesis data saved to callisto_data/genesis.json"
