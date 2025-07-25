// USDC token address (Ethereum mainnet and Optimism)
export const USDC_TOKEN_ADDRESS = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48";
// Zero address (ETH)
export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
// ckUSDC helper contract address
export const CKUSDC_HELPER_CONTRACT_ADDRESS = "0x18901044688D3756C35Ed2b36D93e6a5B8e00E68";

// ERC20 ABI fragment for approve
export const ERC20_APPROVE_ABI = [
  {
    "inputs": [
      { "internalType": "address", "name": "spender", "type": "address" },
      { "internalType": "uint256", "name": "amount", "type": "uint256" }
    ],
    "name": "approve",
    "outputs": [
      { "internalType": "bool", "name": "", "type": "bool" }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

// Helper contract ABI fragment for depositEth and depositErc20
export const CKUSDC_HELPER_ABI = [
  {
    inputs: [
      { internalType: "address", name: "_minterAddress", type: "address" },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    inputs: [{ internalType: "address", name: "target", type: "address" }],
    name: "AddressEmptyCode",
    type: "error",
  },
  {
    inputs: [{ internalType: "address", name: "account", type: "address" }],
    name: "AddressInsufficientBalance",
    type: "error",
  },
  { inputs: [], name: "FailedInnerCall", type: "error" },
  {
    inputs: [{ internalType: "address", name: "token", type: "address" }],
    name: "SafeERC20FailedOperation",
    type: "error",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "erc20ContractAddress",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "bytes32",
        name: "principal",
        type: "bytes32",
      },
      {
        indexed: false,
        internalType: "bytes32",
        name: "subaccount",
        type: "bytes32",
      },
    ],
    name: "ReceivedEthOrErc20",
    type: "event",
  },
  {
    inputs: [
      { internalType: "address", name: "erc20Address", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
      { internalType: "bytes32", name: "principal", type: "bytes32" },
      { internalType: "bytes32", name: "subaccount", type: "bytes32" },
    ],
    name: "depositErc20",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "bytes32", name: "principal", type: "bytes32" },
      { internalType: "bytes32", name: "subaccount", type: "bytes32" },
    ],
    name: "depositEth",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [],
    name: "getMinterAddress",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
];