import React, { useState, useEffect } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { Aptos, AptosConfig, Network } from 'aptos';

const PaymentSplitter = () => {
  const { account, signAndSubmitTransaction } = useWallet();
  const [activeTab, setActiveTab] = useState('create');
  const [balance, setBalance] = useState('0');
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState('');
  
  // Create split form state
  const [splitName, setSplitName] = useState('');
  const [recipients, setRecipients] = useState([{ address: '', percentage: '' }]);
  
  // Execute payment state
  const [splitId, setSplitId] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [splitDetails, setSplitDetails] = useState(null);

  const aptos = new Aptos(new AptosConfig({ network: Network.DEVNET }));
  const MODULE_ADDRESS = "YOUR_MODULE_ADDRESS"; // Replace with your deployed module address

  useEffect(() => {
    if (account) {
      fetchBalance();
    }
  }, [account]);

  const fetchBalance = async () => {
    try {
      const balance = await aptos.getAccountAPTAmount({
        accountAddress: account.address
      });
      setBalance((balance / 100000000).toFixed(4)); // Convert from Octas to APT
    } catch (error) {
      console.error('Error fetching balance:', error);
    }
  };

  const addRecipient = () => {
    setRecipients([...recipients, { address: '', percentage: '' }]);
  };

  const removeRecipient = (index) => {
    const newRecipients = recipients.filter((_, i) => i !== index);
    setRecipients(newRecipients);
  };

  const updateRecipient = (index, field, value) => {
    const newRecipients = [...recipients];
    newRecipients[index][field] = value;
    setRecipients(newRecipients);
  };

  const validateSplit = () => {
    const totalPercentage = recipients.reduce((sum, r) => sum + parseInt(r.percentage || 0), 0);
    const validAddresses = recipients.every(r => r.address.match(/^0x[a-fA-F0-9]{1,64}$/));
    const validPercentages = recipients.every(r => r.percentage && parseInt(r.percentage) > 0);
    
    return totalPercentage === 100 && validAddresses && validPercentages && splitName.trim();
  };

  const createSplit = async () => {
    if (!validateSplit()) {
      alert('Please ensure all fields are filled correctly and percentages sum to 100%');
      return;
    }

    setLoading(true);
    try {
      const addresses = recipients.map(r => r.address);
      const percentages = recipients.map(r => parseInt(r.percentage));

      const transaction = {
        type: "entry_function_payload",
        function: `${MODULE_ADDRESS}::payment_splitter::create_split`,
        arguments: [addresses, percentages, splitName],
        type_arguments: []
      };

      const response = await signAndSubmitTransaction(transaction);
      setTxHash(response.hash);
      alert('Payment split created successfully!');
      
      // Reset form
      setSplitName('');
      setRecipients([{ address: '', percentage: '' }]);
    } catch (error) {
      console.error('Error creating split:', error);
      alert('Failed to create split: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchSplitDetails = async () => {
    if (!splitId) return;
    
    setLoading(true);
    try {
      const details = await aptos.view({
        function: `${MODULE_ADDRESS}::payment_splitter::get_split`,
        arguments: [splitId]
      });
      
      setSplitDetails({
        creator: details[0],
        recipients: details[1],
        percentages: details[2],
        name: details[3],
        isActive: details[4]
      });
    } catch (error) {
      console.error('Error fetching split details:', error);
      alert('Split not found or error occurred');
      setSplitDetails(null);
    } finally {
      setLoading(false);
    }
  };

  const executePayment = async () => {
    if (!splitDetails || !paymentAmount) {
      alert('Please enter payment amount and ensure split details are loaded');
      return;
    }

    setLoading(true);
    try {
      const amountInOctas = Math.floor(parseFloat(paymentAmount) * 100000000); // Convert APT to Octas

      const transaction = {
        type: "entry_function_payload",
        function: `${MODULE_ADDRESS}::payment_splitter::execute_payment`,
        arguments: [splitId, amountInOctas.toString()],
        type_arguments: []
      };

      const response = await signAndSubmitTransaction(transaction);
      setTxHash(response.hash);
      alert('Payment executed successfully!');
      fetchBalance(); // Refresh balance
    } catch (error) {
      console.error('Error executing payment:', error);
      alert('Failed to execute payment: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const totalPercentage = recipients.reduce((sum, r) => sum + parseInt(r.percentage || 0), 0);

  return (
    <div className="payment-splitter">
      <div className="balance-card">
        <h3>💰 Account Balance</h3>
        <p>{balance} APT</p>
        <button onClick={fetchBalance} disabled={loading}>
          {loading ? '⟳' : '🔄'} Refresh
        </button>
      </div>

      <div className="tabs">
        <button 
          className={activeTab === 'create' ? 'active' : ''} 
          onClick={() => setActiveTab('create')}
        >
          Create Split
        </button>
        <button 
          className={activeTab === 'execute' ? 'active' : ''} 
          onClick={() => setActiveTab('execute')}
        >
          Execute Payment
        </button>
      </div>

      {activeTab === 'create' && (
        <div className="create-split">
          <h3>Create New Payment Split</h3>
          
          <div className="form-group">
            <label>Split Name:</label>
            <input
              type="text"
              value={splitName}
              onChange={(e) => setSplitName(e.target.value)}
              placeholder="e.g., Content Revenue Split"
            />
          </div>

          <div className="recipients-section">
            <h4>Recipients ({recipients.length})</h4>
            
            {recipients.map((recipient, index) => (
              <div key={index} className="recipient-row">
                <input
                  type="text"
                  placeholder="0x... (Recipient Address)"
                  value={recipient.address}
                  onChange={(e) => updateRecipient(index, 'address', e.target.value)}
                />
                <input
                  type="number"
                  placeholder="% (1-100)"
                  value={recipient.percentage}
                  onChange={(e) => updateRecipient(index, 'percentage', e.target.value)}
                  min="1"
                  max="100"
                />
                {recipients.length > 1 && (
                  <button 
                    onClick={() => removeRecipient(index)}
                    className="remove-btn"
                  >
                    ❌
                  </button>
                )}
              </div>
            ))}

            <div className="recipients-controls">
              <button onClick={addRecipient} className="add-btn">
                ➕ Add Recipient
              </button>
              <div className={`percentage-total ${totalPercentage === 100 ? 'valid' : 'invalid'}`}>
                Total: {totalPercentage}%
              </div>
            </div>
          </div>

          <button 
            onClick={createSplit} 
            disabled={loading || !validateSplit()}
            className="create-btn"
          >
            {loading ? '⟳ Creating...' : '🚀 Create Split'}
          </button>
        </div>
      )}

      {activeTab === 'execute' && (
        <div className="execute-payment">
          <h3>Execute Payment Split</h3>
          
          <div className="form-group">
            <label>Split ID:</label>
            <div className="split-id-row">
              <input
                type="number"
                value={splitId}
                onChange={(e) => setSplitId(e.target.value)}
                placeholder="Enter split ID"
              />
              <button onClick={fetchSplitDetails} disabled={loading || !splitId}>
                {loading ? '⟳' : '🔍'} Load
              </button>
            </div>
          </div>

          {splitDetails && (
            <div className="split-details">
              <h4>📋 Split Details</h4>
              <div className="detail-item">
                <strong>Name:</strong> {splitDetails.name}
              </div>
              <div className="detail-item">
                <strong>Creator:</strong> {splitDetails.creator}
              </div>
              <div className="detail-item">
                <strong>Status:</strong> {splitDetails.isActive ? '✅ Active' : '❌ Inactive'}
              </div>
              <div className="detail-item">
                <strong>Recipients:</strong>
                <div className="recipients-list">
                  {splitDetails.recipients.map((addr, idx) => (
                    <div key={idx} className="recipient-detail">
                      <span className="address">{addr.slice(0, 6)}...{addr.slice(-4)}</span>
                      <span className="percentage">{splitDetails.percentages[idx]}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="form-group">
            <label>Payment Amount (APT):</label>
            <input
              type="number"
              step="0.0001"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              placeholder="0.0000"
              min="0"
            />
          </div>

          {splitDetails && paymentAmount && (
            <div className="payment-preview">
              <h4>💸 Payment Preview</h4>
              {splitDetails.recipients.map((addr, idx) => {
                const amount = (parseFloat(paymentAmount) * splitDetails.percentages[idx]) / 100;
                return (
                  <div key={idx} className="preview-item">
                    <span>{addr.slice(0, 6)}...{addr.slice(-4)}</span>
                    <span>{amount.toFixed(4)} APT ({splitDetails.percentages[idx]}%)</span>
                  </div>
                );
              })}
            </div>
          )}

          <button 
            onClick={executePayment} 
            disabled={loading || !splitDetails || !paymentAmount || !splitDetails.isActive}
            className="execute-btn"
          >
            {loading ? '⟳ Processing...' : '💸 Execute Payment'}
          </button>
        </div>
      )}

      {txHash && (
        <div className="transaction-result">
          <h4>✅ Transaction Successful</h4>
          <p>Hash: {txHash}</p>
          <a 
            href={`https://explorer.aptoslabs.com/txn/${txHash}?network=devnet`}
            target="_blank"
            rel="noopener noreferrer"
          >
            View on Explorer 🔗
          </a>
        </div>
      )}
    </div>
  );
};

export default PaymentSplitter;