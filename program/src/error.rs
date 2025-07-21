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

    #[error("Voting period has not ended yet")]
    VotingPeriodNotEnded,

    #[error("Voting period has already ended")]
    VotingPeriodEnded,

    #[error("Voter has already cast a vote on this proposal")]
    AlreadyVoted,

    #[error("Agent is not registered with this DAO")]
    AgentNotRegistered,

    #[error("Agent is already registered")]
    AgentAlreadyRegistered,

    #[error("Insufficient token balance for this action")]
    InsufficientBalance,

    #[error("Maximum active proposal limit reached")]
    MaxProposalsReached,

    #[error("Quorum has not been reached")]
    QuorumNotReached,

    #[error("Treasury has insufficient funds for withdrawal")]
    InsufficientTreasuryFunds,

    #[error("Invalid vote weight provided")]
    InvalidVoteWeight,

    #[error("Proposal execution payload is invalid")]
    InvalidExecutionPayload,

    #[error("Agent reputation is below the required threshold")]
    ReputationTooLow,

    #[error("Delegation target is invalid or circular")]
    InvalidDelegation,
}

impl From<ZeroError> for ProgramError {
    fn from(e: ZeroError) -> Self {
        ProgramError::Custom(e as u32)
    }
}

impl<T> DecodeError<T> for ZeroError {
    fn type_of() -> &'static str {
        "ZeroError"
    }
}

impl PrintProgramError for ZeroError {
    fn print<E>(&self)
    where
        E: 'static
            + std::error::Error
            + DecodeError<E>
            + PrintProgramError
            + num_traits::FromPrimitive,
    {
        msg!(&self.to_string());
    }
}
