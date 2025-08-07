import React from 'react';
import { WalletSelector } from '@aptos-labs/wallet-adapter-ant-design';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import PaymentSplitter from './PaymentSplitter';
import './App.css';

function App() {
  const { connected, account, network, connect, disconnect, wallets } = useWallet();

  const handleConnect = async () => {
    try {
      // Specifically try to connect to Petra
      const petraWallet = wallets.find(wallet => 
        wallet.name.toLowerCase().includes('petra') || 
        wallet.name.toLowerCase().includes('aptos')
      );
      
      if (petraWallet) {
        await connect(petraWallet.name);
      } else if (wallets && wallets.length > 0) {
        // Fallback to first available wallet
        await connect(wallets[0].name);
      }
    } catch (error) {
      console.error('Connection failed:', error);
      console.log('Available wallets:', wallets);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <div className="header-content">
          <h1>🔄 Aptos Payment Splitter</h1>
          <p>Split payments automatically to multiple recipients</p>
          <div className="wallet-section">
            <WalletSelector />
            {/* Backup manual connect button */}
            {!connected && (
              <div>
                <button 
                  onClick={handleConnect}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: '#1890ff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    marginTop: '10px'
                  }}
                >
                  Connect Wallet (Manual)
                </button>
                <button 
                  onClick={() => console.log('Available wallets:', wallets)}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#52c41a',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    marginTop: '10px',
                    marginLeft: '10px'
                  }}
                >
                  Debug Wallets
                </button>
              </div>
            )}
            {connected && (
              <div className="wallet-info">
                <p>Connected: {account?.address?.slice(0, 6)}...{account?.address?.slice(-4)}</p>
                <p>Network: {network?.name || 'devnet'}</p>
                <button 
                  onClick={disconnect}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#ff4d4f',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    marginTop: '10px'
                  }}
                >
                  Disconnect
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
      <main className="App-main">
        {connected ? (
          <PaymentSplitter />
        ) : (
          <div className="connect-wallet">
            <h2>🔗 Connect Your Wallet</h2>
            <p>Please connect your Aptos wallet to use the Payment Splitter</p>
            <div className="features">
              <div className="feature">
                <h3>✨ Create Payment Splits</h3>
                <p>Define how payments should be distributed among recipients</p>
              </div>
              <div className="feature">
                <h3>⚡ Instant Transfers</h3>
                <p>Execute payments with a single transaction</p>
              </div>
              <div className="feature">
                <h3>🎯 Content Creator Friendly</h3>
                <p>Perfect for revenue sharing and collaboration</p>
              </div>
            </div>
          </div>
        )}
      </main>
      <footer className="App-footer">
        <p>Built on Aptos Blockchain | Devnet</p>
      </footer>
    </div>
  );
}

export default App;