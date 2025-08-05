import React from 'react';
import ReactDOM from 'react-dom/client';
import { AptosWalletAdapterProvider } from '@aptos-labs/wallet-adapter-react';
import { PetraWallet } from 'petra-plugin-wallet-adapter';
import { MartianWallet } from '@martianwallet/aptos-wallet-adapter';
import { RiseWallet } from '@rise-wallet/wallet-adapter';
import { Network } from '@aptos-labs/ts-sdk';
import App from './App';
import './index.css';

// Wallet configuration
const wallets = [
  new PetraWallet(),
  new MartianWallet(),
  new RiseWallet(),
];

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <AptosWalletAdapterProvider 
      plugins={wallets} 
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
