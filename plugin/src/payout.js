/**
 * USDC payout layer.
 *
 * Three modes (gated by config.payoutMode):
 *   - 'dry-run'  : log the transfer payload, no transaction
 *   - 'testnet'  : sign + broadcast on Base Sepolia
 *   - 'mainnet'  : sign + broadcast on Base, hard-capped at $5/payout
 *
 * The plugin is responsible for funding the wallet — this module only signs
 * and broadcasts. Keys come from PAYOUT_PRIVATE_KEY in the runtime env so
 * the Franklin wallet (used by the runtime for x402) and the bounty payout
 * wallet can be the same OR different — caller's choice.
 */

import { createWalletClient, createPublicClient, http, fallback, parseUnits, encodeFunctionData } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { base, baseSepolia } from "viem/chains";

// Circle-deployed USDC contracts. These are immutable canonical addresses.
const USDC = {
  base: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  "base-sepolia": "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
};

// Hard cap: never sign a mainnet payout above this regardless of bounty config.
const MAINNET_HARD_CAP_USD = 5;

// Public RPC fallback chains. viem's `fallback` transport tries them in order
// and skips to the next on failure, so a single endpoint outage doesn't break
// the payout. Override the primary via env var if you have a paid RPC
// (Alchemy/QuickNode/Infura) — those are way more reliable than public.
const TESTNET_RPCS = [
  process.env.BASE_SEPOLIA_RPC_URL,
  "https://base-sepolia-rpc.publicnode.com",
  "https://base-sepolia.drpc.org",
  "https://sepolia.base.org",
].filter(Boolean);

const MAINNET_RPCS = [
  process.env.BASE_RPC_URL,
  "https://base-rpc.publicnode.com",
  "https://base.drpc.org",
  "https://mainnet.base.org",
].filter(Boolean);

function buildTransport(mode, override) {
  if (override) return http(override);
  const urls = mode === "mainnet" ? MAINNET_RPCS : TESTNET_RPCS;
  return fallback(urls.map((url) => http(url)));
}

const ERC20_TRANSFER_ABI = [
  {
    type: "function",
    name: "transfer",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ type: "bool" }],
  },
];

function chainFor(mode) {
  if (mode === "mainnet") return { chain: base, key: "base" };
  if (mode === "testnet") return { chain: baseSepolia, key: "base-sepolia" };
  throw new Error(`Unsupported payout mode: ${mode}`);
}

/**
 * Sign and broadcast (or simulate) a USDC payout.
 * @param {Object} args
 * @param {'dry-run'|'testnet'|'mainnet'} args.mode
 * @param {string} args.to        recipient address (0x...)
 * @param {string} args.amountUsd amount in USD as a decimal string (e.g. "5.00")
 * @param {string} [args.privateKey] override; defaults to PAYOUT_PRIVATE_KEY env
 * @param {string} [args.rpcUrl]  override; defaults to public Base RPC
 * @returns {Promise<{txHash?: string, settledAt?: string, gasUsedEth?: string, mode: string, chain: string, amount: string}>}
 */
export async function signPayout({ mode, to, amountUsd, privateKey, rpcUrl }) {
  const amount = String(amountUsd);

  if (mode === "dry-run") {
    return {
      mode: "dry-run",
      chain: "base", // arbitrary — no chain interaction
      amount,
      // No txHash, no settledAt — caller knows it didn't broadcast
    };
  }

  // Hard cap enforcement (mainnet only — testnet is unrestricted for testing)
  if (mode === "mainnet" && Number(amount) > MAINNET_HARD_CAP_USD) {
    throw new Error(
      `Mainnet payout ${amount} USDC exceeds hard cap of $${MAINNET_HARD_CAP_USD}`
    );
  }

  const pk = privateKey ?? process.env.PAYOUT_PRIVATE_KEY;
  if (!pk) throw new Error("PAYOUT_PRIVATE_KEY env var not set");

  const { chain, key: chainKey } = chainFor(mode);
  const account = privateKeyToAccount(pk.startsWith("0x") ? pk : `0x${pk}`);

  const transport = buildTransport(mode, rpcUrl);
  const walletClient = createWalletClient({ account, chain, transport });
  const publicClient = createPublicClient({ chain, transport });

  // USDC has 6 decimals
  const amountInWei = parseUnits(amount, 6);
  const usdcAddress = USDC[chainKey];

  const data = encodeFunctionData({
    abi: ERC20_TRANSFER_ABI,
    functionName: "transfer",
    args: [to, amountInWei],
  });

  const txHash = await walletClient.sendTransaction({
    to: usdcAddress,
    data,
  });

  const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
  const gasCostWei = receipt.gasUsed * receipt.effectiveGasPrice;
  // 1 ETH = 1e18 wei
  const gasUsedEth = (Number(gasCostWei) / 1e18).toFixed(7);

  return {
    mode,
    chain: chainKey,
    amount,
    txHash,
    settledAt: new Date().toISOString(),
    gasUsedEth,
  };
}
