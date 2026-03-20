#!/bin/bash

# Bitcoin Identity Vault - Testnet Deployment Helper
# This script helps you deploy contracts to Stacks testnet

set -e

echo "🚀 Bitcoin Identity Vault - Testnet Deployment"
echo "=============================================="
echo ""

# Check if we're in the right directory
if [ ! -f "Clarinet.toml" ]; then
    echo "❌ Error: Clarinet.toml not found. Run this from project root."
    exit 1
fi

# Check if clarinet is installed
if ! command -v clarinet &> /dev/null; then
    echo "❌ Error: Clarinet not installed. Install with:"
    echo "   curl -L https://github.com/hirosystems/clarinet/releases/download/v2.14.1/clarinet-linux-x64.tar.gz | tar xz"
    exit 1
fi

echo "✅ Clarinet found: $(clarinet --version)"
echo ""

# Check testnet configuration
if grep -q "<YOUR PRIVATE TESTNET MNEMONIC HERE>" settings/Testnet.toml; then
    echo "⚠️  Testnet mnemonic not configured!"
    echo ""
    echo "Please follow these steps:"
    echo ""
    echo "1. Get testnet STX from faucet:"
    echo "   https://explorer.hiro.so/sandbox/faucet?chain=testnet"
    echo ""
    echo "2. Export your wallet's 24-word mnemonic (testnet only!)"
    echo ""
    echo "3. Encrypt it with:"
    echo "   clarinet deployments encrypt"
    echo ""
    echo "4. Update settings/Testnet.toml with encrypted mnemonic"
    echo ""
    echo "5. Run this script again"
    echo ""
    exit 1
fi

echo "✅ Testnet configuration found"
echo ""

# Generate deployment plan
echo "📝 Generating deployment plan..."
if clarinet deployments generate --testnet; then
    echo "✅ Deployment plan generated"
else
    echo "❌ Failed to generate deployment plan"
    exit 1
fi

echo ""
echo "📋 Deployment Plan:"
echo "-------------------"
cat deployments/default.testnet-plan.yaml
echo ""

# Ask for confirmation
read -p "🤔 Deploy these contracts to testnet? (y/N): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Deployment cancelled"
    exit 0
fi

# Deploy contracts
echo ""
echo "🚀 Deploying contracts to testnet..."
echo "⏳ This may take a few minutes..."
echo ""

if clarinet deployments apply --testnet; then
    echo ""
    echo "✅ Deployment successful!"
    echo ""
    echo "📝 Next steps:"
    echo "1. Copy the contract addresses from above"
    echo "2. Update frontend/.env with:"
    echo "   VITE_NETWORK=testnet"
    echo "   VITE_IDENTITY_REGISTRY_CONTRACT=<address>.identity-registry"
    echo "   VITE_CREDENTIAL_ISSUER_CONTRACT=<address>.credential-issuer"
    echo "   VITE_VERIFICATION_CONTRACT=<address>.verification"
    echo ""
    echo "3. Restart the dev server:"
    echo "   cd frontend && npm run dev"
    echo ""
    echo "4. Test the app at http://localhost:5173"
    echo ""
    echo "🔍 View on explorer:"
    echo "   https://explorer.hiro.so/?chain=testnet"
    echo ""
else
    echo ""
    echo "❌ Deployment failed"
    echo ""
    echo "Common issues:"
    echo "- Insufficient testnet STX (get more from faucet)"
    echo "- Invalid mnemonic (check settings/Testnet.toml)"
    echo "- Network issues (check internet connection)"
    echo ""
    exit 1
fi
