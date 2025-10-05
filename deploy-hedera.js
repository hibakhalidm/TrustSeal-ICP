/**
 * TrustSeal Hedera Deployment Script
 * 
 * Deploys the TrustSeal credential system to Hedera testnet or mainnet
 */

const TrustSealService = require('./src/hedera_backend/trustseal.js');
const fs = require('fs');
const path = require('path');

async function deploy(network = 'testnet') {
    console.log(`🚀 Deploying TrustSeal to Hedera ${network}...`);
    
    try {
        // Validate environment variables
        if (!process.env.HEDERA_ACCOUNT_ID || !process.env.HEDERA_PRIVATE_KEY) {
            throw new Error('Missing required environment variables. Please set HEDERA_ACCOUNT_ID and HEDERA_PRIVATE_KEY');
        }

        // Set network
        process.env.HEDERA_NETWORK = network;
        
        // Initialize TrustSeal service
        const trustSeal = new TrustSealService();
        
        // Wait for initialization
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Initialize demo data
        await trustSeal.initializeDemoData();
        
        // Create deployment info file
        const deploymentInfo = {
            network: network,
            deployedAt: new Date().toISOString(),
            credentialTokenId: trustSeal.credentialTokenId,
            adminTopicId: trustSeal.adminTopicId,
            operatorAccountId: process.env.HEDERA_ACCOUNT_ID
        };
        
        const deploymentPath = path.join(__dirname, 'deployment-info.json');
        fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
        
        console.log('✅ Deployment completed successfully!');
        console.log(`📋 Credential Token ID: ${trustSeal.credentialTokenId}`);
        console.log(`📢 Admin Topic ID: ${trustSeal.adminTopicId}`);
        console.log(`📄 Deployment info saved to: ${deploymentPath}`);
        
        return deploymentInfo;
        
    } catch (error) {
        console.error('❌ Deployment failed:', error);
        process.exit(1);
    }
}

// Run deployment if called directly
if (require.main === module) {
    const network = process.argv[2] || 'testnet';
    deploy(network);
}

module.exports = { deploy };