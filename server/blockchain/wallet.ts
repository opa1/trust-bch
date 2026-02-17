// import "server-only";
import bchLib from "./bitcore";
import crypto from "crypto";

/**
 * BCH wallet interface
 */
export interface BCHWallet {
  address: string;
  privateKey: string;
  publicKey: string;
}

/**
 * Escrow wallet result with encrypted key
 */
export interface EscrowWallet {
  address: string;
  publicKey: string;
  encryptedPrivateKey: string;
}

/**
 * Get BCH network based on environment
 */
import { config } from "@/config";

// ... existing code ...

export function getNetwork():
  | typeof bchLib.Networks.mainnet
  | typeof bchLib.Networks.testnet {
  const networkEnv = config.bch.network;
  return networkEnv === "mainnet"
    ? bchLib.Networks.mainnet
    : bchLib.Networks.testnet;
}

/**
 * Generates a new BCH wallet (address + keys)
 *
 * @returns New BCH wallet with address and keys
 */
export function generateWallet(): BCHWallet {
  const network = getNetwork();
  console.log(
    `[Wallet] Generating wallet for network: ${network.name} (Env: ${process.env.BCH_NETWORK})`,
  );

  const privateKey = new bchLib.PrivateKey(null, network);
  const address = privateKey.toAddress();
  const publicKey = privateKey.toPublicKey();

  return {
    address: address.toString(),
    privateKey: privateKey.toString(),
    publicKey: publicKey.toString(),
  };
}

/**
 * Encrypts a private key using AES-256-CBC
 *
 * @param privateKey - Private key to encrypt
 * @returns Encrypted private key in format: iv:encryptedData
 */
export function encryptPrivateKey(privateKey: string): string {
  const secret = process.env.WALLET_ENCRYPTION_KEY;

  if (!secret || secret.length < 32) {
    throw new Error("WALLET_ENCRYPTION_KEY must be at least 32 characters");
  }

  const algorithm = "aes-256-cbc";
  const key = crypto.scryptSync(secret, "salt", 32);
  const iv = crypto.randomBytes(16);

  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(privateKey, "utf8", "hex");
  encrypted += cipher.final("hex");

  return `${iv.toString("hex")}:${encrypted}`;
}

/**
 * Decrypts an encrypted private key
 *
 * @param encryptedPrivateKey - Encrypted private key in format: iv:encryptedData
 * @returns Decrypted private key
 */
export function decryptPrivateKey(encryptedPrivateKey: string): string {
  const secret = process.env.WALLET_ENCRYPTION_KEY;

  if (!secret || secret.length < 32) {
    throw new Error("WALLET_ENCRYPTION_KEY must be at least 32 characters");
  }

  const [ivHex, encryptedData] = encryptedPrivateKey.split(":");

  if (!ivHex || !encryptedData) {
    throw new Error("Invalid encrypted private key format");
  }

  const algorithm = "aes-256-cbc";
  const key = crypto.scryptSync(secret, "salt", 32);
  const iv = Buffer.from(ivHex, "hex");

  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  let decrypted = decipher.update(encryptedData, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

/**
 * Validates a BCH address
 *
 * @param address - BCH address to validate
 * @returns True if address is valid, false otherwise
 */
export function validateAddress(address: string): boolean {
  // Basic BCH address validation - checks format only
  // BCH addresses start with 'bitcoincash:' prefix or legacy format
  const bchRegex = /^(bitcoincash:)?[qpzry9x8gf2tvdw0s3jn54khce6mua7l]{42}$/i;
  const legacyRegex = /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/;

  return bchRegex.test(address) || legacyRegex.test(address);
}

/**
 * Signs a raw transaction with a private key
 *
 * @param transaction - Bitcore transaction object
 * @param privateKeyWIF - Private key in WIF format
 * @returns Signed transaction
 */
export function signTransaction(transaction: any, privateKeyWIF: string): any {
  const privateKey = new bchLib.PrivateKey(privateKeyWIF);
  transaction.sign(privateKey);
  return transaction;
}

/**
 * Creates a new wallet with encrypted private key
 * High-level function for creating secure wallets
 *
 * @returns Wallet with address and encrypted private key
 */
export function generateEncryptedWallet(): EscrowWallet {
  const wallet = generateWallet();
  const encryptedPrivateKey = encryptPrivateKey(wallet.privateKey);

  return {
    address: wallet.address,
    publicKey: wallet.publicKey,
    encryptedPrivateKey,
  };
}
