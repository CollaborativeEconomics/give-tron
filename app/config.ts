const config = {
  "title": "Give Tron",
  "description": "Make tax-deductible donations in crypto",
  "blockchain": {
    "chainId"     : "1001",
    "chainName"   : "Tron",
    "coinSymbol"  : "TRX",
    "decimals"    : 6,
    "network"     : "testnet",
    "rpcServer"   : "https://api.shasta.trongrid.io",
    "explorer"    : "https://shasta.tronscan.org",
    "adminWallet" : "TVMHHvhVD92Qm7uwpnhSDetQpKrjjM7zGW",
  },
  "datachain": {
    "chainName": "XinFin",
    "network": "testnet",
    "minterWallet": "0x1ac546d21473062f3c3b16b6392a2ec26f4539f0",
    "contracts": {
      "nft721": "0xa3a3d70ec57bc30472cd687f3d530b3431292989",
      "nft1155": "0xc917ff4128525a65639d18f1d240a788081f022d",
    }
  },
  "filechain": {
    "chainName" : "IPFS",
    "gateway": "https://ipfs.filebase.io/ipfs/",
    "endpoint": "https://s3.filebase.com/",
    "pinning": "https://api.filebase.io/v1/ipfs",
    "region": "us-east-1",
    "bucket": "kuyawa-test-ipfs"
  },
  "providers": {
    "chainRPC": "https://api.shasta.trongrid.io",
    "nextAuth": "http://localhost:3000",
    "registry": "https://registry.staging.cfce.io/api"
  }
}

export default config