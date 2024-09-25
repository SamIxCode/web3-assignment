var express = require('express');
var util = require('../config/util.js');
var router = express.Router();
const { ABI } = require('../config/smartContract/abi.js');
const dotenv = require('dotenv');
const { ethers } = require('ethers');


dotenv.config();

// Use local node URL if running locally (update accordingly)
const localNodeUrl = process.env.NODE_URL; // Replace this with your local node URL
const contractAddress = process.env.CONTRACT_ADDRESS;



router.get('/', function (req, res) {
    res.render('partials/play', {
        title: 'Chess Hub - Game',
        user: req.user,
        isPlayPage: true
    });
});

router.post('/', function (req, res) {
    var side = req.body.side;
    var token = util.randomString(20);
    res.redirect('/game/' + token + '/' + side);
});

// Route to get the balance of an address

router.get('/balanceof/:address', async (req, res) => {
    const address = req.params.address;

    console.log(`Request received for address: ${address}`); // Debug output

    try {
        const provider = new ethers.JsonRpcProvider(localNodeUrl); // Connect to the network
        const contract = new ethers.Contract(contractAddress, ABI, provider);

        // Fetch balance in tokens
        const balanceWei = await contract.balanceOf(address);

        // Convert the balance to human-readable format
        const balanceBNB = ethers.formatUnits(balanceWei, 9); // Adjust based on your decimals
        console.log('Balance in tokens: ', balanceBNB);

        res.json({
            address: address,
            balance: balanceBNB.toString()
        });
    } catch (error) {
        console.error('Error fetching balance:', error);
        res.status(500).send('Error retrieving balance');
    }
});



// Route to transfer tokens

router.post('/transfer', async (req, res) => {

    const { recipient, amount } = req.body; // Get recipient and amount from the request body

    if (!recipient || !amount) {
        return res.status(400).send('Recipient and amount are required');
    }

    const ownerPrivateKey = process.env.PRIVATE_KEY; // Private key of the sender

    try {
        // Connect to the local Ethereum network
        const provider = new ethers.JsonRpcProvider(localNodeUrl);
        const wallet = new ethers.Wallet(ownerPrivateKey, provider);
        const contract = new ethers.Contract(contractAddress, ABI, wallet);

        // Execute the transfer
        const tx = await contract.transfer(recipient, amount);
        await tx.wait(); // Wait for the transaction to be mined

        console.log('Transaction successful:', tx);
        res.json({ success: true, transactionHash: tx.hash });
    } catch (error) {
        console.error('Error making transfer:', error);
        res.status(500).json({ success: false, message: 'Error making transfer', error: error.message });
    }
});



module.exports = router;
