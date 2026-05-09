#!/usr/bin/env node
/**
 * One-shot ETH transfer on Base Sepolia.
 *
 * Usage:
 *   TRANSFER_PK=0xab... node scripts/transfer-eth.mjs <to> [amountEth]
 *
 * Defaults to amountEth=0.005 — plenty for hundreds of typical txns.
 *
 * The key is read from env, never hard-coded. Don't paste your key into the
 * command line (it lands in shell history). Use `read -rs` to set TRANSFER_PK
 * interactively first:
 *
 *   read -rs -p "Private key: " TRANSFER_PK; export TRANSFER_PK; echo
 */

import {
  createWalletClient,
  createPublicClient,
  http,
  parseEther,
  formatEther,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia } from "viem/chains";

const pk = process.env.TRANSFER_PK;
const to = process.argv[2];
const amountEth = process.argv[3] ?? "0.005";

if (!pk) {
  console.error("✗ TRANSFER_PK env var required.");
  console.error("  Set it with: read -rs -p 'PK: ' TRANSFER_PK; export TRANSFER_PK");
  process.exit(1);
}
if (!to || !/^0x[a-fA-F0-9]{40}$/.test(to)) {
  console.error("✗ Usage: TRANSFER_PK=0x... node scripts/transfer-eth.mjs <to-address> [amount-eth]");
  process.exit(1);
}

const account = privateKeyToAccount(pk.startsWith("0x") ? pk : `0x${pk}`);

const transport = http("https://sepolia.base.org");
const wallet = createWalletClient({ account, chain: baseSepolia, transport });
const pub = createPublicClient({ chain: baseSepolia, transport });

console.log(`Source:    ${account.address}`);
console.log(`Recipient: ${to}`);
console.log(`Amount:    ${amountEth} ETH on Base Sepolia`);

const balance = await pub.getBalance({ address: account.address });
console.log(`Source balance: ${formatEther(balance)} ETH`);

if (balance < parseEther(amountEth)) {
  console.error(`✗ Insufficient balance to send ${amountEth} ETH (need that + a touch for gas).`);
  process.exit(1);
}

console.log("Broadcasting...");
const hash = await wallet.sendTransaction({
  to,
  value: parseEther(amountEth),
});
console.log(`txHash: ${hash}`);
console.log(`Basescan: https://sepolia.basescan.org/tx/${hash}`);

console.log("Waiting for 1 confirmation...");
const receipt = await pub.waitForTransactionReceipt({ hash });
console.log(`✓ Confirmed in block ${receipt.blockNumber}`);
console.log(`  Gas used: ${receipt.gasUsed} (cost ≈ ${formatEther(receipt.gasUsed * receipt.effectiveGasPrice)} ETH)`);

const newBalance = await pub.getBalance({ address: to });
console.log(`Recipient new balance: ${formatEther(newBalance)} ETH`);
