// src/hooks/useEthersSigner.ts
import { useMemo } from "react";
import { BrowserProvider, JsonRpcSigner } from "ethers";
import type { Account, Chain, Client, Transport } from "viem";
import { useConnectorClient } from "wagmi";

/**
 * Convert a Viem Wallet Client into an ethers.js JsonRpcSigner.
 */
function clientToSigner(
  client: Client<Transport, Chain, Account>
): JsonRpcSigner {
  const { account, chain, transport } = client;
  const network = {
    chainId: chain.id,
    name: chain.name,
    ensAddress: chain.contracts?.ensRegistry?.address,
  };
  // Wrap the Viem transport in an ethers BrowserProvider
  const provider = new BrowserProvider(transport, network);
  // Get the JsonRpcSigner for the connected account
  return new JsonRpcSigner(provider, account.address);
}

/**
 * Hook that returns an ethers.js JsonRpcSigner, or undefined if not connected.
 */
export function useEthersSigner({ chainId }: { chainId?: number } = {}) {
  const { data: client } = useConnectorClient({ chainId });
  return useMemo(() => (client ? clientToSigner(client) : undefined), [client]);
}
