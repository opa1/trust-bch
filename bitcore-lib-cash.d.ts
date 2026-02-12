declare module "bitcore-lib-cash" {
  export class PrivateKey {
    constructor(key?: string | null, network?: any);
    toString(): string;
    toAddress(): Address;
    toPublicKey(): PublicKey;
  }

  export class PublicKey {
    toString(): string;
  }

  export class Address {
    toString(): string;
  }

  export class Transaction {
    constructor();
    from(utxo: any): Transaction;
    to(address: string, amount: number): Transaction;
    change(address: string): Transaction;
    sign(privateKey: PrivateKey): Transaction;
    serialize(): string;
  }

  export class Script {
    static buildPublicKeyHashOut(address: Address): Script;
    toHex(): string;
  }

  export const Networks: {
    mainnet: any;
    testnet: any;
  };
}
