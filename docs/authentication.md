# Authentication Endpoints

## Overview
The authentication system supports OTP-based login for users and traditional email/password for admin users. It handles user registration, profile completion, and driver creation.

## Endpoints

### 🌐 POST /auth/login
Login with OTP for users (passengers/drivers).

**Request Body:**
\`\`\`json
{
  "identifier": "string", // Phone number or email
  "role": "PASSENGER" | "DRIVER" | "ADMIN" | "SUPPORT_AGENT"
}
\`\`\`

**Response:**
\`\`\`json
{
  "success": true,
  "message": "OTP sent successfully",
  "userId": "string",
  "otpSent": true
}
\`\`\`

**Purpose:** Initiates the login process by sending an OTP to the user's phone/email.

---

### 🌐 POST /auth/register
Complete user profile after initial registration.

**Request Body:**
\`\`\`json
{
  "firstName": "string",
  "lastName": "string", 
  "userId": "string" // User ID from previous step
}
\`\`\`

**Response:**
\`\`\`json
{
  "success": true,
  "user": {
    "id": "string",
    "firstName": "string",
    "lastName": "string",
    "role": "PASSENGER" | "DRIVER",
    "isActive": true
  }
}
\`\`\`

**Purpose:** Completes user profile creation with personal information.

---

### 🌐 POST /auth/verify-otp
Verify OTP code and complete authentication.

**Request Body:**
\`\`\`json
{
  "userId": "string",
  "code": "string", // 6-digit OTP code
  "type": "login" | "registration" | "password_reset"
}
\`\`\`

**Response:**
\`\`\`json
{
  "success": true,
  "accessToken": "string",
  "user": {
    "id": "string",
    "firstName": "string",
    "lastName": "string",
    "role": "PASSENGER" | "DRIVER",
    "profile": {} // Driver or Passenger profile data
  }
}
\`\`\`

**Purpose:** Validates OTP and returns JWT token for authenticated requests.

---

### 🌐 POST /auth/admin/login
Admin login with email and password.

**Request Body:**
\`\`\`json
{
  "email": "string",
  "password": "string"
}
\`\`\`

**Response:**
\`\`\`json
{
  "success": true,
  "accessToken": "string",
  "admin": {
    "id": "string",
    "email": "string",
    "role": "ADMIN",
    "permissions": ["string"]
  }
}
\`\`\`

**Purpose:** Authenticates admin users with traditional credentials.

---

### 🌐 POST /auth/admin/create-driver
Create a new driver account (Admin function).

**Request Body:**
\`\`\`json
{
  "phone": "string",
  "firstName": "string",
  "lastName": "string",
  "vehicleType": "KEKE" | "CAR" | "BUS",
  "vehicleModel": "string",
  "plateNumber": "string",
  "licenseNumber": "string",
  "isCompanyVehicle": boolean
}
\`\`\`

**Response:**
\`\`\`json
{
  "success": true,
  "driver": {
    "id": "string",
    "user": {
      "firstName": "string",
      "lastName": "string",
      "phone": "string"
    },
    "vehicleType": "KEKE" | "CAR" | "BUS",
    "vehicleModel": "string",
    "plateNumber": "string"
  }
}
\`\`\`

**Purpose:** Allows admins to create driver accounts with vehicle information.

## Error Responses

All authentication endpoints may return these errors:

**400 Bad Request:**
\`\`\`json
{
  "success": false,
  "message": "Validation error",
  "errors": ["Property \"identifier\" is required, but missing"]
}
\`\`\`

**401 Unauthorized:**
\`\`\`json
{
  "success": false,
  "message": "Invalid credentials"
}
\`\`\`

**429 Too Many Requests:**
\`\`\`json
{
  "success": false,
  "message": "Too many OTP requests. Please wait before requesting again."
}
