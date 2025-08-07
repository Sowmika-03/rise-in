import React, { useState, useEffect } from 'react';
import { Wallet, Users, Split, CheckCircle, AlertCircle, Plus, Minus, Eye } from 'lucide-react';

const PaymentSplitter = () => {
  const [walletConnected, setWalletConnected] = useState(false);
  const [account, setAccount] = useState('');
  const [recipients, setRecipients] = useState([
    { address: '', percentage: 50 },
    { address: '', percentage: 50 }
  ]);
  const [splitName, setSplitName] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [splitId, setSplitId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [userSplits, setUserSplits] = useState([]);
  const [showSplits, setShowSplits] = useState(false);

  // CORRECT CONTRACT ADDRESS - Your deployed contract
  const CONTRACT_ADDRESS = '0x4ec1621b80805665e6d9d4c94531f7f0c9642315bf2c980eff07a5c6b1cbc4da';

  const connectWallet = async () => {
    try {
      if (window.aptos) {
        const response = await window.aptos.connect();
        setWalletConnected(true);
        setAccount(response.address);
        setMessage({ type: 'success', text: 'Wallet connected successfully!' });
        
        console.log('Petra Wallet Address:', response.address);
        console.log('Contract Address:', CONTRACT_ADDRESS);
      } else {
        setMessage({ type: 'error', text: 'Please install Petra wallet' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to connect wallet' });
    }
  };

  const addRecipient = () => {
    setRecipients([...recipients, { address: '', percentage: 0 }]);
  };

  const removeRecipient = (index) => {
    if (recipients.length > 2) {
      const newRecipients = recipients.filter((_, i) => i !== index);
      setRecipients(newRecipients);
    }
  };

  const updateRecipient = (index, field, value) => {
    const newRecipients = [...recipients];
    newRecipients[index][field] = value;
    setRecipients(newRecipients);
  };

  const getTotalPercentage = () => {
    return recipients.reduce((sum, recipient) => sum + (parseInt(recipient.percentage) || 0), 0);
  };

  // Initialize the splitter store (only needs to be called once per user)
  const initializeSplitterStore = async () => {
    if (!walletConnected) {
      setMessage({ type: 'error', text: 'Please connect your wallet first' });
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        type: "entry_function_payload",
        function: `${CONTRACT_ADDRESS}::payment_splitter::initialize`,
        arguments: [], // No arguments needed
        type_arguments: []
      };

      const response = await window.aptos.signAndSubmitTransaction(payload);
      await window.aptos.waitForTransaction(response.hash);
      
      setMessage({ 
        type: 'success', 
        text: `Splitter store initialized! Tx: ${response.hash.slice(0,8)}...` 
      });
    } catch (error) {
      console.error('Initialize error:', error);
      setMessage({ type: 'error', text: `Initialize failed: ${error.message || 'Unknown error'}` });
    }
    setIsLoading(false);
  };

  // Create a new split
  const createSplit = async () => {
    if (!walletConnected) {
      setMessage({ type: 'error', text: 'Please connect your wallet first' });
      return;
    }

    if (!splitName.trim()) {
      setMessage({ type: 'error', text: 'Please enter a split name' });
      return;
    }

    const totalPercentage = getTotalPercentage();
    if (totalPercentage !== 100) {
      setMessage({ type: 'error', text: 'Total percentage must equal 100%' });
      return;
    }

    // Validate addresses
    const validAddresses = recipients.filter(r => r.address.trim().length > 0);
    if (validAddresses.length !== recipients.length) {
      setMessage({ type: 'error', text: 'Please enter all recipient addresses' });
      return;
    }

    setIsLoading(true);
    try {
      const addresses = recipients.map(r => r.address.trim());
      const percentages = recipients.map(r => parseInt(r.percentage));

      const payload = {
        type: "entry_function_payload",
        function: `${CONTRACT_ADDRESS}::payment_splitter::create_split`,
        arguments: [splitName, addresses, percentages],
        type_arguments: []
      };

      const response = await window.aptos.signAndSubmitTransaction(payload);
      await window.aptos.waitForTransaction(response.hash);
      
      setMessage({ 
        type: 'success', 
        text: `Split created successfully! Tx: ${response.hash.slice(0,8)}...` 
      });
      
      // Reset form
      setSplitName('');
      setRecipients([{ address: '', percentage: 50 }, { address: '', percentage: 50 }]);
      
    } catch (error) {
      console.error('Create split error:', error);
      setMessage({ type: 'error', text: `Failed to create split: ${error.message || 'Unknown error'}` });
    }
    setIsLoading(false);
  };

  // Execute a split payment
  const executeSplit = async () => {
    if (!walletConnected || !paymentAmount || !splitId) {
      setMessage({ type: 'error', text: 'Please connect wallet, enter split ID and amount' });
      return;
    }

    setIsLoading(true);
    try {
      const amountInOctas = Math.floor(parseFloat(paymentAmount) * 100000000); // Convert APT to octas

      const payload = {
        type: "entry_function_payload",
        function: `${CONTRACT_ADDRESS}::payment_splitter::execute_split`,
        arguments: [parseInt(splitId), amountInOctas],
        type_arguments: []
      };

      const response = await window.aptos.signAndSubmitTransaction(payload);
      await window.aptos.waitForTransaction(response.hash);
      
      setMessage({ 
        type: 'success', 
        text: `Payment split executed! Tx: ${response.hash.slice(0,8)}...` 
      });
      setPaymentAmount('');
      setSplitId('');
    } catch (error) {
      console.error('Execute split error:', error);
      setMessage({ type: 'error', text: `Failed to execute split: ${error.message || 'Unknown error'}` });
    }
    setIsLoading(false);
  };

  // View user's splits
  const viewSplits = async () => {
    if (!walletConnected) {
      setMessage({ type: 'error', text: 'Please connect your wallet first' });
      return;
    }

    setIsLoading(true);
    try {
      // This would need to be implemented with a view function call
      // For now, we'll show a placeholder
      setShowSplits(!showSplits);
      setMessage({ type: 'success', text: 'View splits functionality - check console for details' });
      console.log('User address:', account);
      console.log('Contract address:', CONTRACT_ADDRESS);
    } catch (error) {
      console.error('View splits error:', error);
      setMessage({ type: 'error', text: `Failed to view splits: ${error.message || 'Unknown error'}` });
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-4">
              <Split className="inline-block mr-2 mb-1" />
              Payment Splitter
            </h1>
            <p className="text-gray-300 text-lg">
              Split payments automatically among multiple recipients on Aptos
            </p>
          </div>

          {/* Wallet Connection */}
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 mb-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Wallet className="w-6 h-6 text-white mr-3" />
                <div>
                  <h3 className="text-white font-semibold">Wallet Status</h3>
                  <p className="text-gray-300 text-sm">
                    {walletConnected ? `Connected: ${account.slice(0,6)}...${account.slice(-4)}` : 'Not connected'}
                  </p>
                </div>
              </div>
              {!walletConnected && (
                <button
                  onClick={connectWallet}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg transition-colors"
                >
                  Connect Petra
                </button>
              )}
            </div>
          </div>

          {/* Message Display */}
          {message.text && (
            <div className={`mb-6 p-4 rounded-lg flex items-center ${
              message.type === 'success' ? 'bg-green-500/20 border border-green-500/30' : 'bg-red-500/20 border border-red-500/30'
            }`}>
              {message.type === 'success' ? 
                <CheckCircle className="w-5 h-5 text-green-400 mr-2" /> : 
                <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
              }
              <span className="text-white">{message.text}</span>
            </div>
          )}

          {/* Initialize Store (One-time setup) */}
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 mb-6 border border-white/20">
            <h3 className="text-white text-xl font-semibold mb-4">Initialize Splitter (One-time setup)</h3>
            <button
              onClick={initializeSplitterStore}
              disabled={isLoading}
              className="bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 text-white px-6 py-2 rounded-lg transition-colors"
            >
              {isLoading ? 'Initializing...' : 'Initialize Store'}
            </button>
            <p className="text-gray-300 text-sm mt-2">
              Run this once to set up your payment splitter store
            </p>
          </div>

          {/* Create Split Section */}
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 mb-6 border border-white/20">
            <div className="flex items-center mb-4">
              <Users className="w-6 h-6 text-white mr-3" />
              <h3 className="text-white text-xl font-semibold">Create Payment Split</h3>
            </div>

            {/* Split Name */}
            <div className="mb-4">
              <label className="block text-gray-300 text-sm mb-2">
                Split Name
              </label>
              <input
                type="text"
                value={splitName}
                onChange={(e) => setSplitName(e.target.value)}
                placeholder="e.g., Team Payment, Project Split"
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
              />
            </div>

            {/* Recipients */}
            {recipients.map((recipient, index) => (
              <div key={index} className="flex gap-4 mb-4 items-end">
                <div className="flex-1">
                  <label className="block text-gray-300 text-sm mb-2">
                    Recipient Address {index + 1}
                  </label>
                  <input
                    type="text"
                    value={recipient.address}
                    onChange={(e) => updateRecipient(index, 'address', e.target.value)}
                    placeholder="0x..."
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div className="w-32">
                  <label className="block text-gray-300 text-sm mb-2">
                    Percentage
                  </label>
                  <input
                    type="number"
                    value={recipient.percentage}
                    onChange={(e) => updateRecipient(index, 'percentage', e.target.value)}
                    placeholder="50"
                    min="0"
                    max="100"
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                  />
                </div>
                {recipients.length > 2 && (
                  <button
                    onClick={() => removeRecipient(index)}
                    className="p-2 text-red-400 hover:text-red-300 transition-colors"
                  >
                    <Minus className="w-5 h-5" />
                  </button>
                )}
              </div>
            ))}

            <div className="flex justify-between items-center mt-4 pt-4 border-t border-white/20">
              <button
                onClick={addRecipient}
                className="flex items-center text-purple-400 hover:text-purple-300 transition-colors"
              >
                <Plus className="w-5 h-5 mr-1" />
                Add Recipient
              </button>
              <div className="text-white">
                Total: {getTotalPercentage()}%
                {getTotalPercentage() !== 100 && (
                  <span className="text-red-400 ml-2">⚠️ Must equal 100%</span>
                )}
              </div>
            </div>

            <button
              onClick={createSplit}
              disabled={isLoading || getTotalPercentage() !== 100 || !splitName.trim()}
              className="w-full mt-6 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white py-3 rounded-lg font-semibold transition-colors"
            >
              {isLoading ? 'Creating Split...' : 'Create Split'}
            </button>
          </div>

          {/* Execute Split Section */}
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 mb-6 border border-white/20">
            <h3 className="text-white text-xl font-semibold mb-4">Execute Split Payment</h3>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-gray-300 text-sm mb-2">
                  Split ID
                </label>
                <input
                  type="number"
                  value={splitId}
                  onChange={(e) => setSplitId(e.target.value)}
                  placeholder="0, 1, 2..."
                  min="0"
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-gray-300 text-sm mb-2">
                  Amount (APT)
                </label>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="0.01"
                  step="0.01"
                  min="0"
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <button
              onClick={executeSplit}
              disabled={isLoading || !paymentAmount || !splitId}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 text-white py-3 rounded-lg font-semibold transition-colors"
            >
              {isLoading ? 'Executing Split...' : 'Execute Split Payment'}
            </button>
          </div>

          {/* View Splits Section */}
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 mb-6 border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white text-xl font-semibold">Your Splits</h3>
              <button
                onClick={viewSplits}
                disabled={isLoading}
                className="flex items-center bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Eye className="w-5 h-5 mr-2" />
                {isLoading ? 'Loading...' : 'View Splits'}
              </button>
            </div>
            
            {showSplits && (
              <div className="text-gray-300">
                <p>Your splits will appear here. Check the browser console for debugging info.</p>
              </div>
            )}
          </div>

          {/* Contract Info */}
          <div className="mt-6 text-center">
            <p className="text-gray-400 text-sm">
              Contract: {CONTRACT_ADDRESS.slice(0,6)}...{CONTRACT_ADDRESS.slice(-4)}
            </p>
            <p className="text-gray-400 text-sm">
              Network: Devnet
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentSplitter;