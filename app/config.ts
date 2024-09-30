const config = {
  "title": "Give Tron",
  "description": "Make tax-deductible donations in crypto",
  "blockchain": {
    "chainName"   : "Tron",
    "coinSymbol"  : "TRX",
    "decimals"    : 18,
    "network"     : "testnet",
    "rpcServer"   : "https://api.shasta.trongrid.io",
    "explorer"    : "https://shasta.tronscan.org",
    "adminWallet" : "TVMHHvhVD92Qm7uwpnhSDetQpKrjjM7zGW",
  },
  "datachain": {
    "chainname": "XinFin",
    "network": "testnet",
    "minterWallet": "0x1ac546d21473062f3c3b16b6392a2ec26f4539f0",
    "contracts": {
      "nft721": "0xa3a3d70ec57bc30472cd687f3d530b3431292989",
      "nft1155": "0xc917ff4128525a65639d18f1d240a788081f022d",
    }
  },
  "filechain": {
    "chainname" : "IPFS",
    "gateway": "https://ipfs.filebase.io/ipfs/",
    "endpoint": "https://s3.filebase.com/",
    "pinning": "https://api.filebase.io/v1/ipfs",
    "region": "us-east-1",
    "bucket": "kuyawa-test-ipfs"
  },
  "providers": {
    "chainrpc": "https://something.alchemy.com",
    "nextauth": "http://localhost:3000",
    "registry": "https://registry.staging.cfce.io/api"
  }
}

export default config as Const