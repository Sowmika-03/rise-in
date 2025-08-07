
const express = require('express');
const cors = require('cors');
const { Aptos, AptosConfig, Network } = require('@aptos-labs/ts-sdk');

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize Aptos client
const config = new AptosConfig({ network: Network.DEVNET });
const aptos = new Aptos(config);

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'Server is running', network: 'devnet' });
});

// Get account balance
app.get('/balance/:address', async (req, res) => {
    try {
        const { address } = req.params;
        const balance = await aptos.getAccountAPTAmount({
            accountAddress: address
        });
        res.json({ balance: balance.toString() });
    } catch (error) {
        console.error('Error fetching balance:', error);
        res.status(500).json({ error: 'Failed to fetch balance' });
    }
});

// Get payment split details
app.get('/split/:splitId', async (req, res) => {
    try {
        const { splitId } = req.params;
        const moduleAddress = process.env.MODULE_ADDRESS || "0x1"; // Replace with your deployed module address
        
        const splitDetails = await aptos.view({
            function: `${moduleAddress}::payment_splitter::get_split`,
            arguments: [splitId]
        });
        
        res.json({
            creator: splitDetails[0],
            recipients: splitDetails[1],
            percentages: splitDetails[2],
            name: splitDetails[3],
            isActive: splitDetails[4]
        });
    } catch (error) {
        console.error('Error fetching split details:', error);
        res.status(500).json({ error: 'Failed to fetch split details' });
    }
});

// Get total splits count
app.get('/splits/count', async (req, res) => {
    try {
        const moduleAddress = process.env.MODULE_ADDRESS || "0x1"; // Replace with your deployed module address
        
        const count = await aptos.view({
            function: `${moduleAddress}::payment_splitter::get_splits_count`,
            arguments: []
        });
        
        res.json({ count: count[0] });
    } catch (error) {
        console.error('Error fetching splits count:', error);
        res.status(500).json({ error: 'Failed to fetch splits count' });
    }
});

// Get transaction details
app.get('/transaction/:txHash', async (req, res) => {
    try {
        const { txHash } = req.params;
        const transaction = await aptos.getTransactionByHash({
            transactionHash: txHash
        });
        res.json(transaction);
    } catch (error) {
        console.error('Error fetching transaction:', error);
        res.status(500).json({ error: 'Failed to fetch transaction' });
    }
});

// Get account transactions
app.get('/transactions/:address', async (req, res) => {
    try {
        const { address } = req.params;
        const limit = req.query.limit || 10;
        
        const transactions = await aptos.getAccountTransactions({
            accountAddress: address,
            options: { limit: parseInt(limit) }
        });
        
        res.json(transactions);
    } catch (error) {
        console.error('Error fetching transactions:', error);
        res.status(500).json({ error: 'Failed to fetch transactions' });
    }
});

// Get events for a specific event type
app.get('/events/:eventType', async (req, res) => {
    try {
        const { eventType } = req.params;
        const moduleAddress = process.env.MODULE_ADDRESS || "0x1";
        
        const events = await aptos.getEvents({
            eventType: `${moduleAddress}::payment_splitter::${eventType}`
        });
        
        res.json(events);
    } catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).json({ error: 'Failed to fetch events' });
    }
});

// Validate address format
app.get('/validate/:address', (req, res) => {
    try {
        const { address } = req.params;
        // Basic validation for Aptos address format
        const isValid = /^0x[a-fA-F0-9]{1,64}$/.test(address);
        res.json({ isValid, address });
    } catch (error) {
        console.error('Error validating address:', error);
        res.status(500).json({ error: 'Failed to validate address' });
    }
});

// Get network info
app.get('/network', async (req, res) => {
    try {
        const chainId = await aptos.getChainId();
        const ledgerInfo = await aptos.getLedgerInfo();
        
        res.json({
            network: 'devnet',
            chainId,
            ledgerVersion: ledgerInfo.ledger_version,
            ledgerTimestamp: ledgerInfo.ledger_timestamp
        });
    } catch (error) {
        console.error('Error fetching network info:', error);
        res.status(500).json({ error: 'Failed to fetch network info' });
    }
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Connected to Aptos ${config.network}`);
    console.log('Available endpoints:');
    console.log('  GET /health - Health check');
    console.log('  GET /balance/:address - Get account balance');
    console.log('  GET /split/:splitId - Get split details');
    console.log('  GET /splits/count - Get total splits count');
    console.log('  GET /transaction/:txHash - Get transaction details');
    console.log('  GET /transactions/:address - Get account transactions');
    console.log('  GET /events/:eventType - Get events by type');
    console.log('  GET /validate/:address - Validate address format');
    console.log('  GET /network - Get network information');
});