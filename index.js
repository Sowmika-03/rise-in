import React from 'react';
import ReactDOM from 'react-dom/client';
import { AptosWalletAdapterProvider } from '@aptos-labs/wallet-adapter-react';
import { Network } from '@aptos-labs/ts-sdk';
import App from './App';
import './index.css';

// The newer wallet adapter automatically detects available wallets
// No need to manually import individual wallet packages
const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <AptosWalletAdapterProvider 
      autoConnect={true}
      dappConfig={{
        network: Network.DEVNET,
        mizuwallet: {
          manifestURL: "https://assets.mz.xyz/static/config/mizuwallet-connect-manifest.json",
        },
      }}
      onError={(error) => {
        console.error("Wallet connection error:", error);
      }}
    >
      <App />
    </AptosWalletAdapterProvider>
  </React.StrictMode>
);