use num_derive::FromPrimitive;
use solana_program::{
    decode_error::DecodeError,
    msg,
    program_error::{PrintProgramError, ProgramError},
};
use thiserror::Error;

#[derive(Error, Debug, Copy, Clone, FromPrimitive)]
pub enum ZeroError {
    #[error("Invalid instruction data")]
    InvalidInstruction,

    #[error("Account not initialized")]
    UninitializedAccount,

    #[error("Account already initialized")]
    AlreadyInitialized,

    #[error("Invalid authority for this operation")]
    InvalidAuthority,

    #[error("Derived key does not match expected PDA")]
    InvalidPDA,

    #[error("Numerical overflow during calculation")]
    Overflow,

    #[error("Proposal is not in active voting state")]
    ProposalNotActive,
