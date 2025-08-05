import React from 'react';
import { WalletSelector } from '@aptos-labs/wallet-adapter-ant-design';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import PaymentSplitter from './PaymentSplitter';
import './App.css';

function App() {
  const { connected, account, network } = useWallet();

  return (
    <div className="App">
      <header className="App-header">
        <div className="header-content">
          <h1>🔄 Aptos Payment Splitter</h1>
          <p>Split payments automatically to multiple recipients</p>
          <div className="wallet-section">
            <WalletSelector />
            {connected && (
              <div className="wallet-info">
                <p>Connected: {account?.address?.slice(0, 6)}...{account?.address?.slice(-4)}</p>
                <p>Network: {network?.name || 'devnet'}</p>
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
