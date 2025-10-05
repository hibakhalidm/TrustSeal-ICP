/**
 * TrustSeal Hedera Backend Service
 * 
 * A decentralized credential verification system built on Hedera Hashgraph.
 * Implements role-based access control (RBAC) for secure credential management.
 * 
 * Features:
 * - NFT-based digital credentials using Hedera Token Service (HTS)
 * - Role-based user management (Admin, Issuer, Checker)
 * - Credential issuance, verification, and revocation
 * - Audit trails and system statistics
 * 
 * @author TrustSeal Team
 * @version 1.0.0 - WCHL 2025 Submission
 */

const {
    Client,
    AccountId,
    PrivateKey,
    TokenCreateTransaction,
    TokenMintTransaction,
    TokenBurnTransaction,
    TokenInfoQuery,
    TokenNftInfoQuery,
    TransferTransaction,
    TokenAssociateTransaction,
    TopicCreateTransaction,
    TopicMessageSubmitTransaction,
    Hbar,
    Status,
    TransactionReceiptQuery,
    TokenType,
    TokenSupplyType,
    TokenMintTransaction
} = require('@hashgraph/sdk');

require('dotenv').config();

class TrustSealService {
    constructor() {
        this.client = null;
        this.operatorId = null;
        this.operatorKey = null;
        this.credentialTokenId = null;
        this.adminTopicId = null;
        
        // In-memory storage for demo purposes
        // In production, use a proper database
        this.users = new Map(); // AccountId -> UserProfile
        this.credentials = new Map(); // SerialNumber -> Credential
        this.verificationLog = [];
        
        this.initialize();
    }

    async initialize() {
        try {
            // Set up operator account from environment
            this.operatorId = AccountId.fromString(process.env.HEDERA_ACCOUNT_ID);
            this.operatorKey = PrivateKey.fromString(process.env.HEDERA_PRIVATE_KEY);

            // Configure client for testnet or mainnet
            if (process.env.HEDERA_NETWORK === 'mainnet') {
                this.client = Client.forMainnet();
            } else {
                this.client = Client.forTestnet();
            }
            
            this.client.setOperator(this.operatorId, this.operatorKey);

            // Initialize the credential token if not exists
            await this.initializeCredentialToken();
            
            // Initialize admin topic for audit logs
            await this.initializeAdminTopic();

            console.log(`✅ TrustSeal Hedera Service initialized on ${process.env.HEDERA_NETWORK}`);
            console.log(`📋 Credential Token ID: ${this.credentialTokenId}`);
            
        } catch (error) {
            console.error('❌ Failed to initialize TrustSeal Service:', error);
            throw error;
        }
    }

    async initializeCredentialToken() {
        try {
            // Check if token already exists in environment
            if (process.env.REACT_APP_CREDENTIAL_TOKEN_ID) {
                this.credentialTokenId = process.env.REACT_APP_CREDENTIAL_TOKEN_ID;
                console.log(`📋 Using existing credential token: ${this.credentialTokenId}`);
                return;
            }

            // Create new NFT token for credentials
            const tokenCreateTx = new TokenCreateTransaction()
                .setTokenName("TrustSeal Credential")
                .setTokenSymbol("TSC")
                .setTokenType(TokenType.NonFungibleUnique)
                .setDecimals(0)
                .setInitialSupply(0)
                .setMaxSupply(10000)
                .setSupplyType(TokenSupplyType.Finite)
                .setTreasuryAccountId(this.operatorId)
                .setAdminKey(this.operatorKey)
                .setSupplyKey(this.operatorKey)
                .setWipeKey(this.operatorKey)
                .setFreezeDefault(false)
                .freezeWith(this.client);

            const tokenCreateSign = await tokenCreateTx.sign(this.operatorKey);
            const tokenCreateSubmit = await tokenCreateSign.execute(this.client);
            const tokenCreateReceipt = await tokenCreateSubmit.getReceipt(this.client);
            
            this.credentialTokenId = tokenCreateReceipt.tokenId.toString();
            
            console.log(`🎯 Created new credential token: ${this.credentialTokenId}`);
            console.log(`💡 Add this to your .env file: REACT_APP_CREDENTIAL_TOKEN_ID=${this.credentialTokenId}`);
            
        } catch (error) {
            console.error('Failed to create credential token:', error);
            throw error;
        }
    }

    async initializeAdminTopic() {
        try {
            const topicCreateTx = new TopicCreateTransaction()
                .setTopicMemo("TrustSeal Admin Logs")
                .setAdminKey(this.operatorKey)
                .setSubmitKey(this.operatorKey)
                .freezeWith(this.client);

            const topicCreateSign = await topicCreateTx.sign(this.operatorKey);
            const topicCreateSubmit = await topicCreateSign.execute(this.client);
            const topicCreateReceipt = await topicCreateSubmit.getReceipt(this.client);
            
            this.adminTopicId = topicCreateReceipt.topicId.toString();
            console.log(`📢 Created admin topic: ${this.adminTopicId}`);
            
        } catch (error) {
            console.error('Failed to create admin topic:', error);
            // Continue without topic - not critical for basic functionality
        }
    }

    // User Management Functions
    async registerUser(accountId, role, name, organization) {
        try {
            const userProfile = {
                accountId: accountId,
                role: role, // 'Admin', 'Issuer', 'Checker'
                name: name,
                organization: organization,
                verified: role === 'Checker', // Auto-verify checkers, manual for issuers
                registrationDate: Date.now(),
                lastLogin: null
            };

            this.users.set(accountId, userProfile);
            
            // Log to admin topic
            await this.logAdminAction('USER_REGISTERED', {
                accountId,
                role,
                name,
                organization
            });

            return { success: true, message: 'User registered successfully' };
        } catch (error) {
            console.error('Error registering user:', error);
            return { success: false, message: error.message };
        }
    }

    async verifyUser(accountId) {
        try {
            const user = this.users.get(accountId);
            if (!user) {
                return { success: false, message: 'User not found' };
            }

            user.verified = true;
            this.users.set(accountId, user);

            await this.logAdminAction('USER_VERIFIED', { accountId });
            
            return { success: true, message: 'User verified successfully' };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    getUserProfile(accountId) {
        return this.users.get(accountId) || null;
    }

    getAllUsers() {
        return Array.from(this.users.values());
    }

    // Credential Management Functions
    async mintCredential(studentAccountId, studentName, credentialType, institution, issueDate, issuerAccountId) {
        try {
            const issuer = this.users.get(issuerAccountId);
            if (!issuer || !issuer.verified || issuer.role !== 'Issuer') {
                return { success: false, message: 'Only verified issuers can mint credentials' };
            }

            // Create metadata for the NFT
            const metadata = JSON.stringify({
                studentName,
                credentialType,
                institution,
                issueDate,
                issuer: issuerAccountId,
                issuedAt: Date.now(),
                revoked: false,
                revocationReason: null
            });

            // Mint NFT
            const mintTx = new TokenMintTransaction()
                .setTokenId(this.credentialTokenId)
                .addMetadata(Buffer.from(metadata))
                .freezeWith(this.client);

            const mintTxSign = await mintTx.sign(this.operatorKey);
            const mintTxSubmit = await mintTxSign.execute(this.client);
            const mintTxReceipt = await mintTxSubmit.getReceipt(this.client);

            const serialNumber = mintTxReceipt.serials[0].toString();
            
            // Store credential information
            const credential = {
                tokenId: this.credentialTokenId,
                serialNumber: serialNumber,
                owner: studentAccountId,
                issuer: issuerAccountId,
                metadata: JSON.parse(metadata),
                issueTimestamp: Date.now()
            };

            this.credentials.set(serialNumber, credential);

            // Associate token with student account (if needed)
            // In production, this should be done by the student
            
            await this.logAdminAction('CREDENTIAL_MINTED', {
                serialNumber,
                studentAccountId,
                issuer: issuerAccountId,
                credentialType
            });

            return { 
                success: true, 
                message: 'Credential minted successfully',
                tokenId: this.credentialTokenId,
                serialNumber: serialNumber
            };

        } catch (error) {
            console.error('Error minting credential:', error);
            return { success: false, message: error.message };
        }
    }

    async revokeCredential(serialNumber, reason, revokerAccountId) {
        try {
            const credential = this.credentials.get(serialNumber);
            if (!credential) {
                return { success: false, message: 'Credential not found' };
            }

            const revoker = this.users.get(revokerAccountId);
            if (!revoker || (revoker.role !== 'Admin' && revokerAccountId !== credential.issuer)) {
                return { success: false, message: 'Only issuer or admin can revoke credentials' };
            }

            // Update metadata
            credential.metadata.revoked = true;
            credential.metadata.revocationReason = reason;
            credential.metadata.revokedAt = Date.now();
            credential.metadata.revokedBy = revokerAccountId;

            this.credentials.set(serialNumber, credential);

            await this.logAdminAction('CREDENTIAL_REVOKED', {
                serialNumber,
                reason,
                revokedBy: revokerAccountId
            });

            return { success: true, message: 'Credential revoked successfully' };
            
        } catch (error) {
            console.error('Error revoking credential:', error);
            return { success: false, message: error.message };
        }
    }

    // Verification Functions
    async verifyCredential(tokenId, serialNumber) {
        try {
            const credential = this.credentials.get(serialNumber);
            if (!credential) {
                return { success: false, message: 'Credential not found' };
            }

            if (credential.tokenId !== tokenId) {
                return { success: false, message: 'Token ID mismatch' };
            }

            // Query the actual NFT from Hedera to ensure it exists and hasn't been transferred
            const nftInfo = await new TokenNftInfoQuery()
                .setTokenId(tokenId)
                .setNftId(serialNumber)
                .execute(this.client);

            const verification = {
                isValid: !credential.metadata.revoked,
                credential: credential,
                verificationTimestamp: Date.now(),
                onChainOwner: nftInfo.accountId?.toString(),
                metadata: credential.metadata
            };

            // Log verification
            this.verificationLog.push({
                tokenId,
                serialNumber,
                timestamp: Date.now(),
                result: verification.isValid
            });

            return { success: true, verification };
            
        } catch (error) {
            console.error('Error verifying credential:', error);
            return { success: false, message: error.message };
        }
    }

    getCredentialsByIssuer(issuerAccountId) {
        return Array.from(this.credentials.values())
            .filter(cred => cred.issuer === issuerAccountId);
    }

    getCredentialsByOwner(ownerAccountId) {
        return Array.from(this.credentials.values())
            .filter(cred => cred.owner === ownerAccountId && !cred.metadata.revoked);
    }

    getAllCredentials() {
        return Array.from(this.credentials.values());
    }

    // System Statistics
    getSystemStats() {
        const allUsers = this.getAllUsers();
        const allCredentials = this.getAllCredentials();
        
        return {
            totalCredentials: allCredentials.length,
            totalUsers: allUsers.length,
            totalIssuers: allUsers.filter(u => u.role === 'Issuer').length,
            totalCheckers: allUsers.filter(u => u.role === 'Checker').length,
            revokedCredentials: allCredentials.filter(c => c.metadata.revoked).length,
            verifications: this.verificationLog.length
        };
    }

    // Admin Logging
    async logAdminAction(action, data) {
        if (!this.adminTopicId) return;
        
        try {
            const logEntry = {
                timestamp: Date.now(),
                action: action,
                data: data
            };

            const submitTx = new TopicMessageSubmitTransaction()
                .setTopicId(this.adminTopicId)
                .setMessage(JSON.stringify(logEntry))
                .freezeWith(this.client);

            const submitTxSign = await submitTx.sign(this.operatorKey);
            await submitTxSign.execute(this.client);
            
        } catch (error) {
            console.error('Error logging admin action:', error);
        }
    }

    // Utility Functions
    updateLastLogin(accountId) {
        const user = this.users.get(accountId);
        if (user) {
            user.lastLogin = Date.now();
            this.users.set(accountId, user);
            return { success: true, message: 'Login updated' };
        }
        return { success: false, message: 'User not found' };
    }

    // Initialize with demo data for presentation
    async initializeDemoData() {
        console.log('🎭 Initializing demo data...');
        
        // Create demo admin
        await this.registerUser('0.0.1001', 'Admin', 'System Administrator', 'TrustSeal Hedera');
        
        // Create demo issuers (universities)
        await this.registerUser('0.0.1002', 'Issuer', 'MIT', 'Massachusetts Institute of Technology');
        await this.registerUser('0.0.1003', 'Issuer', 'Stanford University', 'Stanford University');
        await this.registerUser('0.0.1004', 'Issuer', 'Harvard University', 'Harvard University');
        
        // Verify issuers
        await this.verifyUser('0.0.1002');
        await this.verifyUser('0.0.1003');
        await this.verifyUser('0.0.1004');
        
        // Create demo checkers (employers)
        await this.registerUser('0.0.1005', 'Checker', 'Google', 'Google LLC');
        await this.registerUser('0.0.1006', 'Checker', 'Microsoft', 'Microsoft Corporation');
        await this.registerUser('0.0.1007', 'Checker', 'Apple', 'Apple Inc');
        
        // Create demo credentials
        await this.mintCredential('0.0.2001', 'John Doe', 'Bachelor of Computer Science', 'MIT', '2024-05-15', '0.0.1002');
        await this.mintCredential('0.0.2002', 'Jane Smith', 'Master of Business Administration', 'Stanford University', '2024-06-20', '0.0.1003');
        await this.mintCredential('0.0.2003', 'Bob Johnson', 'Doctor of Philosophy in Physics', 'Harvard University', '2024-07-10', '0.0.1004');
        
        console.log('✅ Demo data initialized successfully');
    }
}

module.exports = TrustSealService;