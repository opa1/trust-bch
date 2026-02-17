/**
 * Error code type definition
 * All possible error codes in the application
 */
export type ErrorCode =
  // Authentication & Authorization
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "INVALID_TOKEN"
  | "TOKEN_EXPIRED"
  | "INVALID_CREDENTIALS"

  // Escrow
  | "ESCROW_NOT_FOUND"
  | "ESCROW_ALREADY_FUNDED"
  | "ESCROW_NOT_FUNDED"
  | "ESCROW_EXPIRED"
  | "ESCROW_ALREADY_COMPLETED"
  | "INVALID_STATE_TRANSITION"

  // Payment & Blockchain
  | "INSUFFICIENT_FUNDS"
  | "PAYMENT_FAILED"
  | "TRANSACTION_NOT_FOUND"
  | "CONFIRMATIONS_TOO_LOW"
  | "BLOCKCHAIN_ERROR"
  | "INVALID_ADDRESS"
  | "WALLET_NOT_FOUND"
  | "TRANSACTION_TIMEOUT"

  // Dispute
  | "DISPUTE_NOT_FOUND"
  | "DISPUTE_ALREADY_EXISTS"
  | "DISPUTE_RESOLVED"
  | "DISPUTE_CANNOT_BE_OPENED"

  // User
  | "USER_NOT_FOUND"
  | "USER_ALREADY_EXISTS"
  | "EMAIL_IN_USE"

  // Validation
  | "VALIDATION_ERROR"
  | "INVALID_EMAIL"
  | "INVALID_AMOUNT"
  | "INVALID_INPUT"
  | "MISSING_REQUIRED_FIELD"

  // General
  | "INTERNAL_ERROR"
  | "DATABASE_ERROR"
  | "DATABASE_UPDATE_FAILED"
  | "NETWORK_ERROR"
  | "NOT_FOUND"
  | "DUPLICATE_ERROR"
  | "RATE_LIMIT_EXCEEDED";

/**
 * Error definition with message, action, and status code
 */
export interface ErrorDefinition {
  message: string;
  action?: string;
  statusCode: number;
}

/**
 * Error code to definition mapping
 * Maps error codes to user-friendly messages and HTTP status codes
 */
export const ERROR_MESSAGES: Record<ErrorCode, ErrorDefinition> = {
  // Authentication & Authorization
  UNAUTHORIZED: {
    message: "You must be logged in to perform this action.",
    action: "Please sign in and try again.",
    statusCode: 401,
  },
  FORBIDDEN: {
    message: "You don't have permission to perform this action.",
    action: "Contact the administrator if you believe this is an error.",
    statusCode: 403,
  },
  INVALID_TOKEN: {
    message: "Your session is invalid.",
    action: "Please sign in again.",
    statusCode: 401,
  },
  TOKEN_EXPIRED: {
    message: "Your session has expired.",
    action: "Please sign in again to continue.",
    statusCode: 401,
  },
  INVALID_CREDENTIALS: {
    message: "Invalid email or password.",
    action: "Please check your credentials and try again.",
    statusCode: 401,
  },

  // Escrow
  ESCROW_NOT_FOUND: {
    message:
      "Escrow not found. It may not exist or you may not have permission to view it.",
    action: "Verify the escrow ID or contact the creator.",
    statusCode: 404,
  },
  ESCROW_ALREADY_FUNDED: {
    message: "This escrow has already been funded.",
    action: "No further action needed. The escrow is active.",
    statusCode: 400,
  },
  ESCROW_NOT_FUNDED: {
    message: "This escrow has not been funded yet.",
    action: "Please wait for the buyer to fund the escrow.",
    statusCode: 400,
  },
  ESCROW_EXPIRED: {
    message: "This escrow has expired.",
    action: "The escrow can no longer be funded or completed.",
    statusCode: 400,
  },
  ESCROW_ALREADY_COMPLETED: {
    message: "This escrow has already been completed.",
    action: "No further action can be taken.",
    statusCode: 400,
  },
  INVALID_STATE_TRANSITION: {
    message: "This action is not allowed at the current stage of the escrow.",
    action: "Check the escrow status and try the appropriate action.",
    statusCode: 400,
  },

  // Payment & Blockchain
  INSUFFICIENT_FUNDS: {
    message: "Payment could not be completed because funds are insufficient.",
    action: "Please fund your wallet and try again.",
    statusCode: 402,
  },
  PAYMENT_FAILED: {
    message: "Payment transaction failed.",
    action: "Please try again or contact support if the issue persists.",
    statusCode: 400,
  },
  TRANSACTION_NOT_FOUND: {
    message: "Transaction not found on the blockchain.",
    action: "Please verify the transaction hash and try again.",
    statusCode: 404,
  },
  CONFIRMATIONS_TOO_LOW: {
    message: "Transaction does not have enough confirmations yet.",
    action: "Please wait for more blockchain confirmations.",
    statusCode: 400,
  },
  BLOCKCHAIN_ERROR: {
    message: "Unable to communicate with the blockchain network.",
    action: "Please try again later.",
    statusCode: 503,
  },
  INVALID_ADDRESS: {
    message: "Invalid Bitcoin Cash address.",
    action: "Please check the address format and try again.",
    statusCode: 400,
  },
  WALLET_NOT_FOUND: {
    message: "User wallet not found.",
    action: "Please contact support to resolve this issue.",
    statusCode: 404, // or 500 if it should always exist
  },
  TRANSACTION_TIMEOUT: {
    message: "Transaction broadcasted but not detected on network.",
    action: "Please verify the transaction on a block explorer.",
    statusCode: 408,
  },

  // Dispute
  DISPUTE_NOT_FOUND: {
    message: "Dispute not found.",
    action: "Verify the dispute ID or check if you have permission to view it.",
    statusCode: 404,
  },
  DISPUTE_ALREADY_EXISTS: {
    message: "A dispute already exists for this escrow.",
    action: "You can add evidence to the existing dispute.",
    statusCode: 400,
  },
  DISPUTE_RESOLVED: {
    message: "This dispute has already been resolved.",
    action: "No further action can be taken.",
    statusCode: 400,
  },
  DISPUTE_CANNOT_BE_OPENED: {
    message: "Dispute cannot be opened for this escrow at this time.",
    action: "Disputes can only be opened for active, funded escrows.",
    statusCode: 400,
  },

  // User
  USER_NOT_FOUND: {
    message: "User account not found.",
    action: "Please check the email address or sign up for a new account.",
    statusCode: 404,
  },
  USER_ALREADY_EXISTS: {
    message: "An account with this email already exists.",
    action: "Please sign in or use a different email address.",
    statusCode: 409,
  },
  EMAIL_IN_USE: {
    message: "This email address is already registered.",
    action: "Please sign in or use the forgot password feature.",
    statusCode: 409,
  },

  // Validation
  VALIDATION_ERROR: {
    message: "Invalid input data provided.",
    action: "Please check your input and try again.",
    statusCode: 400,
  },
  INVALID_EMAIL: {
    message: "Invalid email address format.",
    action: "Please enter a valid email address.",
    statusCode: 400,
  },
  INVALID_AMOUNT: {
    message: "Invalid amount specified.",
    action: "Amount must be a positive number within the allowed range.",
    statusCode: 400,
  },
  INVALID_INPUT: {
    message: "The provided input is invalid.",
    action: "Please check your data and try again.",
    statusCode: 400,
  },
  MISSING_REQUIRED_FIELD: {
    message: "Required field is missing.",
    action: "Please provide all required information.",
    statusCode: 400,
  },

  // General
  INTERNAL_ERROR: {
    message: "An unexpected error occurred.",
    action: "Please try again later or contact support if the issue persists.",
    statusCode: 500,
  },
  DATABASE_ERROR: {
    message: "A database error occurred.",
    action: "Please try again later.",
    statusCode: 500,
  },
  DATABASE_UPDATE_FAILED: {
    message:
      "Critical Error: Database update failed after successful transaction.",
    action: "Please contact support immediately with your transaction details.",
    statusCode: 500,
  },
  NETWORK_ERROR: {
    message: "Network connection error.",
    action: "Please check your internet connection and try again.",
    statusCode: 503,
  },
  NOT_FOUND: {
    message: "The requested resource was not found.",
    action: "Please verify the ID or URL and try again.",
    statusCode: 404,
  },
  DUPLICATE_ERROR: {
    message: "This resource already exists.",
    action:
      "Please use a different identifier or update the existing resource.",
    statusCode: 409,
  },
  RATE_LIMIT_EXCEEDED: {
    message: "Too many requests. Please slow down.",
    action: "Wait a few moments before trying again.",
    statusCode: 429,
  },
};
