# Wallet Management Endpoints

## Overview
Wallet management handles financial transactions, balance management, token rewards, and cashout requests for both passengers and drivers in the ST Rides platform.

## Endpoints

### 🔒 POST /wallet/:userId/credit
Credit money to a user's wallet.

**Parameters:**
- `userId` (path): User ID

**Request Body:**
\`\`\`json
{
  "amount": number,
  "description": "string",
  "reference": "string" // Optional transaction reference
}
\`\`\`

**Response:**
\`\`\`json
{
  "success": true,
  "transaction": {
    "id": "string",
    "userId": "string",
    "amount": number,
    "type": "CREDIT",
    "status": "COMPLETED",
    "description": "string",
    "reference": "string",
    "newBalance": number,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
\`\`\`

**Purpose:** Adds money to user's wallet (top-up, refunds, earnings).

---

### 🔒 POST /wallet/:userId/debit
Debit money from a user's wallet.

**Parameters:**
- `userId` (path): User ID

**Request Body:**
\`\`\`json
{
  "amount": number,
  "description": "string",
  "reference": "string" // Optional transaction reference
}
\`\`\`

**Response:**
\`\`\`json
{
  "success": true,
  "transaction": {
    "id": "string",
    "userId": "string",
    "amount": number,
    "type": "DEBIT",
    "status": "COMPLETED",
    "description": "string",
    "reference": "string",
    "newBalance": number,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
\`\`\`

**Purpose:** Deducts money from user's wallet (ride payments, fees).

---

### 🔒 POST /wallet/:userId/tokens
Award tokens to a user.

**Parameters:**
- `userId` (path): User ID

**Request Body:**
\`\`\`json
{
  "tokens": number,
  "description": "string"
}
\`\`\`

**Response:**
\`\`\`json
{
  "success": true,
  "tokenAward": {
    "userId": "string",
    "tokensAwarded": number,
    "totalTokens": number,
    "description": "string",
    "awardedAt": "2024-01-01T00:00:00.000Z"
  },
  "transaction": {
    "id": "string",
    "type": "TOKEN_REWARD",
    "status": "COMPLETED",
    "description": "string"
  }
}
\`\`\`

**Purpose:** Awards loyalty tokens for completed rides, referrals, or promotions.

---

### 🔒 POST /wallet/:driverId/cashout
Request cashout for driver earnings.

**Parameters:**
- `driverId` (path): Driver user ID

**Request Body:**
\`\`\`json
{
  "amount": number
}
\`\`\`

**Response:**
\`\`\`json
{
  "success": true,
  "cashoutRequest": {
    "id": "string",
    "driverId": "string",
    "amount": number,
    "status": "PENDING",
    "requestedAt": "2024-01-01T00:00:00.000Z",
    "estimatedProcessingTime": "24-48 hours",
    "minimumAmount": number,
    "availableBalance": number
  }
}
\`\`\`

**Purpose:** Allows drivers to request withdrawal of their earnings.

---

### 🔒 GET /wallet/:userId/balance
Get user's current wallet balance.

**Parameters:**
- `userId` (path): User ID

**Response:**
\`\`\`json
{
  "success": true,
  "balance": {
    "userId": "string",
    "walletBalance": number,
    "earnedTokens": number, // For passengers
    "totalEarnings": number, // For drivers
    "availableForCashout": number, // For drivers
    "pendingTransactions": number,
    "lastUpdated": "2024-01-01T00:00:00.000Z"
  }
}
\`\`\`

**Purpose:** Retrieves current wallet balance and token information.

---

### 🔒 GET /wallet/:userId/transactions
Get user's transaction history.

**Parameters:**
- `userId` (path): User ID

**Query Parameters:**
- `limit` (optional): Number of transactions to return (default: 50)

**Response:**
\`\`\`json
{
  "success": true,
  "transactions": [
    {
      "id": "string",
      "amount": number,
      "type": "CREDIT" | "DEBIT" | "COMMISSION" | "CASHOUT" | "TOKEN_REWARD",
      "status": "PENDING" | "COMPLETED" | "FAILED",
      "description": "string",
      "reference": "string",
      "rideId": "string", // If related to a ride
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "total": number,
    "limit": number,
    "hasMore": boolean
  }
}
\`\`\`

**Purpose:** Provides detailed transaction history for financial tracking.

## Transaction Types

### CREDIT
- **Wallet top-ups** from payment methods
- **Ride refunds** for cancelled trips
- **Driver earnings** from completed rides
- **Promotional credits** and bonuses

### DEBIT
- **Ride payments** for passengers
- **Platform fees** and commissions
- **Penalty charges** for violations
- **Cashout processing** fees

### COMMISSION
- **Platform commission** deducted from driver earnings
- **Service fees** for premium features
- **Processing fees** for transactions

### CASHOUT
- **Withdrawal requests** by drivers
- **Bank transfer** processing
- **Mobile money** transfers

### TOKEN_REWARD
- **Loyalty tokens** for completed rides
- **Referral bonuses** for new user invitations
- **Achievement rewards** for milestones

## Payment Methods

### Supported Methods
- **WALLET**: Platform wallet balance
- **CASH**: Cash payment to driver
- **TOKEN**: Loyalty token redemption

### Wallet Integration
- Automatic balance updates
- Real-time transaction processing
- Fraud detection and prevention
- Multi-currency support (if applicable)

## Error Responses

**400 Bad Request:**
\`\`\`json
{
  "success": false,
  "message": "Insufficient wallet balance"
}
\`\`\`

**404 Not Found:**
\`\`\`json
{
  "success": false,
  "message": "User not found"
}
\`\`\`

**422 Unprocessable Entity:**
\`\`\`json
{
  "success": false,
  "message": "Amount must be greater than minimum cashout limit"
}
\`\`\`

**429 Too Many Requests:**
\`\`\`json
{
  "success": false,
  "message": "Too many cashout requests. Please wait before requesting again."
}
\`\`\`

## Security Features

- **Transaction encryption** for sensitive data
- **Audit trails** for all financial operations
- **Balance verification** before transactions
- **Fraud detection** algorithms
- **Rate limiting** for high-value operations
