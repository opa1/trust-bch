import "server-only";
import axios from "axios";

// ─── Interfaces ────────────────────────────────────────────────────────────────

export interface BCHTransaction {
  txid: string;
  confirmations: number;
  value: number; // In BCH
  blockHeight?: number;
}

export interface AddressBalance {
  address: string;
  balance: number; // In BCH
  confirmed: number; // In BCH
  unconfirmed: number; // In BCH
}

export interface UTXO {
  tx_hash: string;
  tx_pos: number;
  value: number; // In satoshis
  height: number;
}

// ─── Multi-API Provider System ─────────────────────────────────────────────────

interface ApiProvider {
  name: string;
  testnet: boolean; // Whether this provider supports testnet
  getBalanceUrl: (address: string) => string;
  parseBalance: (data: any, address: string) => AddressBalance;
  getTransactionsUrl: (address: string) => string;
  parseTransactions: (data: any) => BCHTransaction[];
  getTxDetailsUrl: (txid: string) => string;
  parseTxDetails: (data: any) => BCHTransaction | null;
  getUtxosUrl: (address: string) => string;
  parseUtxos: (data: any) => UTXO[];
  getBroadcastUrl: () => string;
  buildBroadcastBody: (rawTxHex: string) => any;
  parseBroadcast: (data: any) => string;
}

const isTestnet = () => (process.env.BCH_NETWORK || "mainnet") === "testnet";

function getFullStackBaseUrl(): string {
  if (process.env.BCH_API_URL) return process.env.BCH_API_URL;
  return isTestnet()
    ? "https://testnet3.fullstack.cash/v5"
    : "https://api.fullstack.cash/v5";
}

/**
 * API providers with fallback support.
 * FullStack.cash is prioritized because it supports both testnet and mainnet.
 * Blockchain.info and Bitcoin.com are mainnet-only fallbacks.
 */
const providers: ApiProvider[] = [
  // ── FullStack.cash (testnet + mainnet) ──
  {
    name: "FullStack.cash",
    testnet: true,
    getBalanceUrl: (addr) =>
      `${getFullStackBaseUrl()}/electrumx/balance/${addr}`,
    parseBalance: (data, address) => {
      const confirmed = satoshisToBCH(data.balance?.confirmed || 0);
      const unconfirmed = satoshisToBCH(data.balance?.unconfirmed || 0);
      return {
        address,
        balance: confirmed + unconfirmed,
        confirmed,
        unconfirmed,
      };
    },
    getTransactionsUrl: (addr) =>
      `${getFullStackBaseUrl()}/electrumx/transactions/${addr}`,
    parseTransactions: (data) => {
      if (!data.transactions || !Array.isArray(data.transactions)) return [];
      return data.transactions.map((tx: any) => ({
        txid: tx.tx_hash,
        confirmations:
          tx.height > 0 ? (data.currentHeight || 0) - tx.height + 1 : 0,
        value: satoshisToBCH(tx.value || 0),
        blockHeight: tx.height > 0 ? tx.height : undefined,
      }));
    },
    getTxDetailsUrl: (txid) =>
      `${getFullStackBaseUrl()}/electrumx/tx/data/${txid}`,
    parseTxDetails: (data) => ({
      txid: data.txid,
      confirmations: data.confirmations || 0,
      value: satoshisToBCH(data.vout?.[0]?.value || 0),
      blockHeight: data.blockheight,
    }),
    getUtxosUrl: (addr) => `${getFullStackBaseUrl()}/electrumx/utxos/${addr}`,
    parseUtxos: (data) => {
      if (!data.utxos || !Array.isArray(data.utxos)) return [];
      return data.utxos;
    },
    getBroadcastUrl: () =>
      `${getFullStackBaseUrl()}/rawtransactions/sendRawTransaction`,
    buildBroadcastBody: (hex) => ({ hexes: [hex] }),
    parseBroadcast: (data) => data[0],
  },

  // ── Blockchain.info BCH (mainnet only) ──
  {
    name: "Blockchain.info",
    testnet: false,
    getBalanceUrl: (addr) => {
      const raw = addr.replace(/^bitcoincash:/, "");
      return `https://api.blockchain.info/bch/multiaddr?active=${raw}`;
    },
    parseBalance: (data, address) => {
      const wallet = data.wallet;
      const confirmed = satoshisToBCH(wallet?.final_balance || 0);
      return { address, balance: confirmed, confirmed, unconfirmed: 0 };
    },
    getTransactionsUrl: (addr) => {
      const raw = addr.replace(/^bitcoincash:/, "");
      return `https://api.blockchain.info/bch/multiaddr?active=${raw}`;
    },
    parseTransactions: (data) => {
      if (!data.txs || !Array.isArray(data.txs)) return [];
      return data.txs.map((tx: any) => ({
        txid: tx.hash,
        confirmations: tx.block_height
          ? (data.info?.latest_block?.height || 0) - tx.block_height + 1
          : 0,
        value: satoshisToBCH(Math.abs(tx.result || tx.out?.[0]?.value || 0)),
        blockHeight: tx.block_height || undefined,
      }));
    },
    getTxDetailsUrl: (txid) => `https://api.blockchain.info/bch/rawtx/${txid}`,
    parseTxDetails: (data) => ({
      txid: data.hash,
      confirmations: data.block_height
        ? Math.max(0, Date.now() / 1000 / 600 - data.block_height)
        : 0,
      value: satoshisToBCH(data.out?.[0]?.value || 0),
      blockHeight: data.block_height,
    }),
    getUtxosUrl: (addr) => {
      const raw = addr.replace(/^bitcoincash:/, "");
      return `https://api.blockchain.info/bch/unspent?active=${raw}`;
    },
    parseUtxos: (data) => {
      if (!data.unspent_outputs || !Array.isArray(data.unspent_outputs))
        return [];
      return data.unspent_outputs.map((utxo: any) => ({
        tx_hash: utxo.tx_hash_big_endian,
        tx_pos: utxo.tx_output_n,
        value: utxo.value,
        height: utxo.block_height || 0,
      }));
    },
    getBroadcastUrl: () => `https://api.blockchain.info/bch/pushtx`,
    buildBroadcastBody: (hex) => `tx=${hex}`,
    parseBroadcast: (data) => data,
  },

  // ── Bitcoin.com REST (mainnet only) ──
  {
    name: "Bitcoin.com",
    testnet: false,
    getBalanceUrl: (addr) =>
      `https://rest.bitcoin.com/v2/address/details/${addr}`,
    parseBalance: (data, address) => {
      const confirmed = satoshisToBCH(data.balanceSat || data.balance || 0);
      const unconfirmed = satoshisToBCH(
        data.unconfirmedBalanceSat || data.unconfirmedBalance || 0,
      );
      return {
        address,
        balance: confirmed + unconfirmed,
        confirmed,
        unconfirmed,
      };
    },
    getTransactionsUrl: (addr) =>
      `https://rest.bitcoin.com/v2/address/transactions/${addr}`,
    parseTransactions: (data) => {
      const txs = data.txs || data;
      if (!Array.isArray(txs)) return [];
      return txs.map((tx: any) => ({
        txid: tx.txid,
        confirmations: tx.confirmations || 0,
        value: satoshisToBCH(tx.valueOut || tx.value || 0),
        blockHeight: tx.blockheight || undefined,
      }));
    },
    getTxDetailsUrl: (txid) =>
      `https://rest.bitcoin.com/v2/transaction/details/${txid}`,
    parseTxDetails: (data) => ({
      txid: data.txid,
      confirmations: data.confirmations || 0,
      value: satoshisToBCH(data.valueOut || data.vout?.[0]?.value || 0),
      blockHeight: data.blockheight,
    }),
    getUtxosUrl: (addr) => `https://rest.bitcoin.com/v2/address/utxo/${addr}`,
    parseUtxos: (data) => {
      const utxos = data.utxos || data;
      if (!Array.isArray(utxos)) return [];
      return utxos.map((utxo: any) => ({
        tx_hash: utxo.txid,
        tx_pos: utxo.vout,
        value: utxo.satoshis || utxo.value,
        height: utxo.height || 0,
      }));
    },
    getBroadcastUrl: () =>
      `https://rest.bitcoin.com/v2/rawtransactions/sendRawTransaction`,
    buildBroadcastBody: (hex) => ({ hexes: [hex] }),
    parseBroadcast: (data) => data,
  },
];

/**
 * Get available providers (filter out testnet-only-unsupported on testnet)
 */
function getProviders(): ApiProvider[] {
  if (isTestnet()) {
    return providers.filter((p) => p.testnet);
  }
  return providers;
}

/**
 * Try an operation across multiple providers with automatic fallback
 */
async function withFallback<T>(
  operation: string,
  fn: (provider: ApiProvider) => Promise<T>,
): Promise<T> {
  const available = getProviders();
  let lastError: Error | null = null;

  for (const provider of available) {
    try {
      const result = await fn(provider);
      return result;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.warn(
        `[BCH Client] ${provider.name} failed for ${operation}: ${lastError.message}`,
      );
    }
  }

  throw lastError || new Error(`All providers failed for ${operation}`);
}

// ─── Utility Functions ─────────────────────────────────────────────────────────

export function bchToSatoshis(bch: number): number {
  return Math.floor(bch * 100000000);
}

export function satoshisToBCH(satoshis: number): number {
  return satoshis / 100000000;
}

// ─── Public API (with automatic fallback) ──────────────────────────────────────

/**
 * Gets the balance of a BCH address (with multi-API fallback)
 */
export async function getAddressBalance(
  address: string,
): Promise<AddressBalance> {
  return withFallback("getAddressBalance", async (provider) => {
    const url = provider.getBalanceUrl(address);
    const response = await axios.get(url, { timeout: 10_000 });
    return provider.parseBalance(response.data, address);
  });
}

/**
 * Gets transaction history for a BCH address (with multi-API fallback)
 */
export async function getAddressTransactions(
  address: string,
): Promise<BCHTransaction[]> {
  return withFallback("getAddressTransactions", async (provider) => {
    const url = provider.getTransactionsUrl(address);
    const response = await axios.get(url, { timeout: 10_000 });
    return provider.parseTransactions(response.data);
  });
}

/**
 * Gets details of a specific transaction (with multi-API fallback)
 */
export async function getTransactionDetails(
  txid: string,
): Promise<BCHTransaction | null> {
  return withFallback("getTransactionDetails", async (provider) => {
    const url = provider.getTxDetailsUrl(txid);
    const response = await axios.get(url, { timeout: 10_000 });
    return provider.parseTxDetails(response.data);
  });
}

/**
 * Gets UTXOs for a BCH address (with multi-API fallback)
 */
export async function getAddressUtxos(address: string): Promise<UTXO[]> {
  return withFallback("getAddressUtxos", async (provider) => {
    const url = provider.getUtxosUrl(address);
    const response = await axios.get(url, { timeout: 10_000 });
    return provider.parseUtxos(response.data);
  });
}

/**
 * Broadcasts a signed raw transaction (with multi-API fallback)
 */
export async function broadcastTransaction(rawTxHex: string): Promise<string> {
  return withFallback("broadcastTransaction", async (provider) => {
    const url = provider.getBroadcastUrl();
    const body = provider.buildBroadcastBody(rawTxHex);
    const response = await axios.post(url, body, { timeout: 15_000 });
    return provider.parseBroadcast(response.data);
  });
}
