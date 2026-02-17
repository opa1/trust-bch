// import "server-only";
import axios from "axios";
import http from "http";
import https from "https";

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

// ─── HTTP Agent Pooling ────────────────────────────────────────────────────────

const httpAgent = new http.Agent({
  keepAlive: true,
  maxSockets: 50,
  maxFreeSockets: 10,
  timeout: 60000, // 60s
});

const httpsAgent = new https.Agent({
  keepAlive: true,
  maxSockets: 50,
  maxFreeSockets: 10,
  timeout: 60000,
});

const apiClient = axios.create({
  httpAgent,
  httpsAgent,
  timeout: 10000,
  headers: {
    "User-Agent": "TrustBCH/1.0",
  },
});

// ─── Retry Logic ──────────────────────────────────────────────────────────────

async function fetchWithRetry(
  url: string,
  options: any = {},
  retries = 3,
): Promise<any> {
  let lastError;
  for (let i = 0; i < retries; i++) {
    try {
      return await apiClient.get(url, options);
    } catch (error: any) {
      lastError = error;
      const isRetryable =
        !error.response ||
        (error.response.status >= 500 && error.response.status < 600) ||
        error.code === "ECONNRESET" ||
        error.code === "ETIMEDOUT";
      if (!isRetryable) throw error;

      // Exponential backoff
      const delay = Math.pow(2, i) * 1000;
      if (i < retries - 1) {
        console.warn(
          `[BCH Client] Request failed, retrying in ${delay}ms... URL: ${url}`,
        );
        await new Promise((res) => setTimeout(res, delay));
      }
    }
  }
  throw lastError;
}

async function postWithRetry(
  url: string,
  body: any,
  options: any = {},
  retries = 3,
): Promise<any> {
  let lastError;
  for (let i = 0; i < retries; i++) {
    try {
      return await apiClient.post(url, body, options);
    } catch (error: any) {
      lastError = error;
      const isRetryable =
        !error.response ||
        (error.response.status >= 500 && error.response.status < 600) ||
        error.code === "ECONNRESET" ||
        error.code === "ETIMEDOUT";
      if (!isRetryable) throw error;

      const delay = Math.pow(2, i) * 1000;
      if (i < retries - 1) {
        console.warn(
          `[BCH Client] POST failed, retrying in ${delay}ms... URL: ${url}`,
        );
        await new Promise((res) => setTimeout(res, delay));
      }
    }
  }
  throw lastError;
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
export const providers: ApiProvider[] = [
  // ── FullStack.cash (testnet + mainnet) ──
  {
    name: "FullStack.cash",
    testnet: false,
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

  // ─── Blockchair (mainnet only) ───
  {
    name: "Blockchair",
    testnet: false,
    getBalanceUrl: (addr) =>
      `https://api.blockchair.com/bitcoin-cash/dashboards/address/${addr}`,
    parseBalance: (data, address) => {
      const addrKey = Object.keys(data.data || {})[0];
      const addrData = data.data?.[addrKey]?.address;
      const balance = satoshisToBCH(addrData?.balance || 0);
      return {
        address,
        balance: balance,
        confirmed: balance, // simplified
        unconfirmed: 0,
      };
    },
    getTransactionsUrl: (addr) =>
      `https://api.blockchair.com/bitcoin-cash/dashboards/address/${addr}?limit=10`,
    parseTransactions: (data) => {
      const addrKey = Object.keys(data.data || {})[0];
      const txs = data.data?.[addrKey]?.transactions;
      if (!Array.isArray(txs)) return [];
      return txs.map((tx: any) => ({
        txid: tx.hash,
        confirmations: 0,
        value: satoshisToBCH(tx.balance_change),
        blockHeight: tx.block_id > 0 ? tx.block_id : undefined,
      }));
    },
    getTxDetailsUrl: (txid) =>
      `https://api.blockchair.com/bitcoin-cash/dashboards/transaction/${txid}`,
    parseTxDetails: (data) => {
      const txKey = Object.keys(data.data || {})[0];
      const txData = data.data?.[txKey]?.transaction;
      return {
        txid: txData?.hash,
        confirmations: 0,
        value: satoshisToBCH(txData?.output_total || 0),
        blockHeight: txData?.block_id,
      };
    },
    getUtxosUrl: (addr) => "",
    parseUtxos: () => [],
    getBroadcastUrl: () =>
      "https://api.blockchair.com/bitcoin-cash/push/transaction",
    buildBroadcastBody: (hex) => ({ data: hex }),
    parseBroadcast: (data) => data.data?.transaction_hash,
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

  // ─── Paytaca (Watchtower) ───
  {
    name: "Paytaca",
    testnet: false,
    getBalanceUrl: (addr) =>
      `https://watchtower.paytaca.com/api/balance/${addr}`,
    parseBalance: (data, address) => {
      return {
        address,
        balance: satoshisToBCH((data.confirmed || 0) + (data.unconfirmed || 0)),
        confirmed: satoshisToBCH(data.confirmed || 0),
        unconfirmed: satoshisToBCH(data.unconfirmed || 0),
      };
    },
    getTransactionsUrl: (addr) =>
      `https://watchtower.paytaca.com/api/history/${addr}`,
    parseTransactions: (data) => {
      if (!Array.isArray(data)) return [];
      return data.map((tx: any) => ({
        txid: tx.tx_hash,
        confirmations: tx.height > 0 ? 1 : 0,
        value: 0,
        blockHeight: tx.height,
      }));
    },
    getTxDetailsUrl: (txid) => `https://watchtower.paytaca.com/api/tx/${txid}`,
    parseTxDetails: (data) => ({
      txid: data.txid,
      confirmations: 0,
      value: 0,
      blockHeight: 0,
    }),
    getUtxosUrl: (addr) => `https://watchtower.paytaca.com/api/utxo/${addr}`,
    parseUtxos: (data) => {
      if (!Array.isArray(data)) return [];
      return data.map((u: any) => ({
        tx_hash: u.tx_hash,
        tx_pos: u.tx_pos,
        value: u.value,
        height: u.height,
      }));
    },
    getBroadcastUrl: () => `https://watchtower.paytaca.com/api/broadcast`,
    buildBroadcastBody: (hex) => ({ tx_hex: hex }),
    parseBroadcast: (data) => data,
  },

  // ── Bitcoin.com REST (mainnet only) - DEPRECATED/OFFLINE ──
  // Removed as the API is no longer active.
];

/**
 * Get available providers (filter out testnet-only-unsupported on testnet)
 */
function getProviders(): ApiProvider[] {
  if (isTestnet()) {
    // Exclude mainnet only providers on testnet
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
  const errors: string[] = [];

  for (const provider of available) {
    try {
      const result = await fn(provider);

      if (operation === "getAddressBalance") {
        console.log(
          `[BCH Client] ${provider.name} returned balance for ${(result as any).address}: ${(result as any).balance} BCH`,
        );
      } else {
        console.log(`[BCH Client] ${provider.name} succeeded for ${operation}`);
      }

      return result;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      errors.push(`${provider.name}: ${lastError.message}`);

      console.warn(
        `[BCH Client] ${provider.name} failed for ${operation}: ${lastError.message}`,
      );
    }
  }

  console.error(
    `[BCH Client] All providers failed for ${operation}. Errors:`,
    errors,
  );
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
    const response = await fetchWithRetry(url);
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
    const response = await fetchWithRetry(url);
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
    const response = await fetchWithRetry(url);
    return provider.parseTxDetails(response.data);
  });
}

/**
 * Gets UTXOs for a BCH address (with multi-API fallback)
 */
export async function getAddressUtxos(address: string): Promise<UTXO[]> {
  return withFallback("getAddressUtxos", async (provider) => {
    const url = provider.getUtxosUrl(address);
    if (!url) throw new Error("Method not supported by this provider");

    const response = await fetchWithRetry(url);
    const utxos = provider.parseUtxos(response.data);

    // Integrity Check: If UTXOs are empty, check if balance > 0
    // This handles cases where indexer is behind or inconsistent
    if (utxos.length === 0) {
      try {
        const balanceUrl = provider.getBalanceUrl(address);
        if (balanceUrl) {
          const balanceRes = await fetchWithRetry(balanceUrl);
          const balance = provider.parseBalance(balanceRes.data, address);
          // If we have a balance but no UTXOs, something is wrong
          if (balance.balance > 0) {
            throw new Error(
              `Provider shows balance (${balance.balance}) but 0 UTXOs. Likely indexing lag.`,
            );
          }
        }
      } catch (err) {
        // If balance check fails, we can't be sure.
        // We log warnings but if the original error was "0 UTXOs", we might want to let it pass
        // OR we treat it as failure to force fallback.
        // Let's treat "Balance > 0 && UTXOs == 0" as failure.
        // If verify fails, simple fallback might be safer.
        if (
          err instanceof Error &&
          err.message.includes("Provider shows balance")
        ) {
          throw err;
        }
        console.warn(`[getAddressUtxos] Integrity check failed: ${err}`);
      }
    }

    return utxos;
  });
}

/**
 * Broadcasts a signed raw transaction (with multi-API fallback)
 */
export async function broadcastTransaction(rawTxHex: string): Promise<string> {
  return withFallback("broadcastTransaction", async (provider) => {
    const url = provider.getBroadcastUrl();
    const body = provider.buildBroadcastBody(rawTxHex);
    const response = await postWithRetry(url, body);
    return provider.parseBroadcast(response.data);
  });
}
