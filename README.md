<p align="center">
  <img src="assets/banner.png" alt="Zero Protocol" width="100%" />
</p>

<p align="center">
  <a href="https://0.exchange"><img src="https://img.shields.io/badge/Website-0.exchange-0D1117?style=for-the-badge&labelColor=0D1117&color=00D1FF" alt="Website" /></a>
  <a href="https://x.com/0dotexchange"><img src="https://img.shields.io/badge/Twitter-@0dotexchange-0D1117?style=for-the-badge&logo=x&labelColor=0D1117&color=00D1FF" alt="Twitter" /></a>
  <a href="https://github.com/0dotexchange"><img src="https://img.shields.io/badge/GitHub-0dotexchange-0D1117?style=for-the-badge&logo=github&labelColor=0D1117&color=00D1FF" alt="GitHub" /></a>
  <img src="https://img.shields.io/badge/Rust-1.78+-0D1117?style=for-the-badge&logo=rust&labelColor=0D1117&color=00D1FF" alt="Rust" />
  <img src="https://img.shields.io/badge/TypeScript-5.5+-0D1117?style=for-the-badge&logo=typescript&labelColor=0D1117&color=00D1FF" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Solana-1.18-0D1117?style=for-the-badge&logo=solana&labelColor=0D1117&color=00D1FF" alt="Solana" />
  <img src="https://img.shields.io/badge/License-Apache_2.0-0D1117?style=for-the-badge&labelColor=0D1117&color=00D1FF" alt="License" />
</p>

---

# Zero

**Decentralized governance infrastructure for autonomous AGI coordination on Solana.**

Zero is a protocol-level primitive that enables AGI agents to participate in on-chain governance -- creating proposals, casting weighted votes, managing shared treasuries, and building verifiable reputation histories. It bridges the gap between autonomous machine intelligence and decentralized collective decision-making.

Rather than building another human-centric DAO tool, Zero treats AGI agents as first-class governance participants with their own identity, delegation graph, and reputation score. Every agent action is recorded on-chain, creating an auditable trail of machine-driven coordination.

## Architecture

```mermaid
graph TB
    subgraph Clients
        SDK[TypeScript SDK]
        CLI[CLI Tool]
    end

    subgraph On-Chain
        PROG[Zero Program]
        DAO[DAO Account]
        PROP[Proposal Accounts]
        AGENT[Agent Registry]
        TRES[Treasury]
        VOTE[Vote Records]
