# Error Handling

## Overview
The ST Rides API uses standard HTTP status codes and consistent error response formats to communicate issues to client applications.

## HTTP Status Codes

### Success Codes (2xx)
- **200 OK**: Request successful, data returned
- **201 Created**: Resource created successfully
- **204 No Content**: Request successful, no data returned

### Client Error Codes (4xx)
- **400 Bad Request**: Invalid request data or parameters
- **401 Unauthorized**: Authentication required or invalid
- **403 Forbidden**: Access denied for authenticated user
- **404 Not Found**: Resource not found
- **409 Conflict**: Resource conflict (duplicate, state mismatch)
- **422 Unprocessable Entity**: Validation errors
- **429 Too Many Requests**: Rate limit exceeded

### Server Error Codes (5xx)
- **500 Internal Server Error**: Unexpected server error
- **502 Bad Gateway**: External service unavailable
- **503 Service Unavailable**: Temporary service outage

## Error Response Format

All error responses follow this consistent structure:

\`\`\`json
{
  "success": false,
  "message": "string",
  "error": "string",
  "errors": ["string"],
  "timestamp": "2024-01-01T00:00:00.000Z",
  "path": "/api/endpoint",
  "statusCode": number
}
\`\`\`

### Fields Description
- **success**: Always `false` for errors
- **message**: Human-readable error description
- **error**: Error type or category
- **errors**: Array of specific validation errors
- **timestamp**: When the error occurred
- **path**: API endpoint that generated the error
- **statusCode**: HTTP status code

## Common Error Scenarios

### Authentication Errors

#### 401 Unauthorized - Missing Token
\`\`\`json
{
  "success": false,
  "message": "Authentication required",
  "error": "UNAUTHORIZED",
  "statusCode": 401,
  "timestamp": "2024-01-01T00:00:00.000Z",
  "path": "/api/drivers/me/location"
}
\`\`\`

#### 401 Unauthorized - Invalid Token
\`\`\`json
{
  "success": false,
  "message": "Invalid or expired token",
  "error": "INVALID_TOKEN",
  "statusCode": 401,
  "timestamp": "2024-01-01T00:00:00.000Z",
  "path": "/api/rides/123"
}
\`\`\`

#### 403 Forbidden - Insufficient Permissions
\`\`\`json
{
  "success": false,
  "message": "Admin access required",
  "error": "FORBIDDEN",
  "statusCode": 403,
  "timestamp": "2024-01-01T00:00:00.000Z",
  "path": "/api/admin/users"
}
\`\`\`

### Validation Errors

#### 400 Bad Request - Invalid Data
\`\`\`json
{
  "success": false,
  "message": "Validation failed",
  "error": "VALIDATION_ERROR",
  "errors": [
    "Property \"identifier\" is required, but missing",
    "Property \"role\" must be one of: PASSENGER, DRIVER, ADMIN"
  ],
  "statusCode": 400,
  "timestamp": "2024-01-01T00:00:00.000Z",
  "path": "/api/auth/login"
}
\`\`\`

#### 422 Unprocessable Entity - Business Logic Validation
\`\`\`json
{
  "success": false,
  "message": "Invalid ride request",
  "error": "BUSINESS_VALIDATION_ERROR",
  "errors": [
    "startJunctionId is required for KEKE rides",
    "rideType must be SHARED for KEKE vehicles"
  ],
  "statusCode": 422,
  "timestamp": "2024-01-01T00:00:00.000Z",
  "path": "/api/passengers/ride-requests"
}
\`\`\`

### Resource Errors

#### 404 Not Found
\`\`\`json
{
  "success": false,
  "message": "Ride not found",
  "error": "NOT_FOUND",
  "statusCode": 404,
  "timestamp": "2024-01-01T00:00:00.000Z",
  "path": "/api/rides/invalid-id"
}
\`\`\`

#### 409 Conflict
\`\`\`json
{
  "success": false,
  "message": "You already have a pending ride request",
  "error": "CONFLICT",
  "statusCode": 409,
  "timestamp": "2024-01-01T00:00:00.000Z",
  "path": "/api/passengers/ride-requests"
}
\`\`\`

### Rate Limiting Errors

#### 429 Too Many Requests
\`\`\`json
{
  "success": false,
  "message": "Too many OTP requests. Please wait 60 seconds before requesting again.",
  "error": "RATE_LIMIT_EXCEEDED",
  "retryAfter": 60,
  "statusCode": 429,
  "timestamp": "2024-01-01T00:00:00.000Z",
  "path": "/api/auth/login"
}
\`\`\`

### Business Logic Errors

#### Insufficient Balance
\`\`\`json
{
  "success": false,
  "message": "Insufficient wallet balance",
  "error": "INSUFFICIENT_BALANCE",
  "details": {
    "required": 500,
    "available": 250,
    "shortfall": 250
  },
  "statusCode": 400,
  "timestamp": "2024-01-01T00:00:00.000Z",
  "path": "/api/rides/123/confirm"
}
\`\`\`

#### Invalid Ride State
\`\`\`json
{
  "success": false,
  "message": "Cannot start ride that is already ongoing",
  "error": "INVALID_RIDE_STATE",
  "details": {
    "currentStatus": "ONGOING",
    "requiredStatus": "PENDING"
  },
  "statusCode": 409,
  "timestamp": "2024-01-01T00:00:00.000Z",
  "path": "/api/rides/123/start"
}
\`\`\`

### External Service Errors

#### Payment Service Error
\`\`\`json
{
  "success": false,
  "message": "Payment processing failed",
  "error": "PAYMENT_SERVICE_ERROR",
  "details": {
    "provider": "paystack",
    "providerMessage": "Card declined by issuer"
  },
  "statusCode": 502,
  "timestamp": "2024-01-01T00:00:00.000Z",
  "path": "/api/wallet/123/credit"
}
\`\`\`

#### SMS Service Error
\`\`\`json
{
  "success": false,
  "message": "Failed to send OTP SMS",
  "error": "SMS_SERVICE_ERROR",
  "details": {
    "provider": "twilio",
    "providerCode": "21211"
  },
  "statusCode": 502,
  "timestamp": "2024-01-01T00:00:00.000Z",
  "path": "/api/auth/login"
}
\`\`\`

## Error Codes Reference

### Authentication & Authorization
- `UNAUTHORIZED`: Missing or invalid authentication
- `FORBIDDEN`: Insufficient permissions
- `INVALID_TOKEN`: JWT token is invalid or expired
- `ACCOUNT_SUSPENDED`: User account is banned/suspended

### Validation
- `VALIDATION_ERROR`: Request data validation failed
- `BUSINESS_VALIDATION_ERROR`: Business rule validation failed
- `INVALID_COORDINATES`: GPS coordinates are invalid
- `INVALID_JUNCTION`: Junction ID doesn't exist

### Resource Management
- `NOT_FOUND`: Requested resource doesn't exist
- `CONFLICT`: Resource state conflict
- `DUPLICATE_RESOURCE`: Resource already exists
- `RESOURCE_LOCKED`: Resource is locked by another operation

### Business Logic
- `INSUFFICIENT_BALANCE`: Not enough wallet balance
- `INVALID_RIDE_STATE`: Ride is in wrong state for operation
- `CAPACITY_EXCEEDED`: Vehicle capacity exceeded
- `REQUEST_EXPIRED`: Ride request has expired
- `DRIVER_OFFLINE`: Driver is not online/available

### Rate Limiting
- `RATE_LIMIT_EXCEEDED`: Too many requests in time window
- `OTP_LIMIT_EXCEEDED`: Too many OTP requests
- `DAILY_LIMIT_EXCEEDED`: Daily operation limit reached

### External Services
- `PAYMENT_SERVICE_ERROR`: Payment provider error
- `SMS_SERVICE_ERROR`: SMS provider error
- `LOCATION_SERVICE_ERROR`: Geocoding service error
- `NOTIFICATION_SERVICE_ERROR`: Push notification error

## Client Error Handling

### Recommended Client Handling

\`\`\`javascript
async function handleApiCall(apiFunction) {
  try {
    const response = await apiFunction();
    return response.data;
  } catch (error) {
    if (error.response) {
      const { status, data } = error.response;
      
      switch (status) {
        case 401:
          // Redirect to login
          redirectToLogin();
          break;
          
        case 403:
          // Show access denied message
          showError("Access denied");
          break;
          
        case 422:
          // Show validation errors
          showValidationErrors(data.errors);
          break;
          
        case 429:
          // Show rate limit message with retry time
          showRateLimitError(data.retryAfter);
          break;
          
        case 500:
          // Show generic error message
          showError("Something went wrong. Please try again.");
          break;
          
        default:
          // Show specific error message
          showError(data.message);
      }
    } else {
      // Network error
      showError("Network error. Please check your connection.");
    }
  }
}
\`\`\`

### Retry Logic

\`\`\`javascript
async function apiCallWithRetry(apiFunction, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await apiFunction();
    } catch (error) {
      if (error.response?.status === 429) {
        // Rate limited - wait and retry
        const retryAfter = error.response.data.retryAfter || 60;
        await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
        continue;
      }
      
      if (error.response?.status >= 500 && attempt < maxRetries) {
        // Server error - exponential backoff
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      // Don't retry client errors (4xx)
      throw error;
    }
  }
}
\`\`\`

## Logging and Monitoring

### Error Logging
All errors are logged with:
- Request ID for tracing
- User ID (if authenticated)
- IP address and user agent
- Full stack trace (server-side only)
- Request payload (sanitized)

### Monitoring Alerts
Alerts are triggered for:
- High error rates (>5% in 5 minutes)
- Authentication failures spike
- Payment processing errors
- External service failures
- Database connection issues

### Error Analytics
Track error patterns by:
- Error type and frequency
- Affected endpoints
- User segments
- Geographic distribution
- Time patterns

This comprehensive error handling ensures reliable client integration and effective debugging capabilities.
