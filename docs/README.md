# ST Rides API Documentation

This is the comprehensive API documentation for the ST Rides transportation platform. The system supports multiple vehicle types (KEKE, CAR, BUS) and provides ride-sharing services with real-time matching, scheduling, and payment processing.

## Table of Contents

1. [Authentication Endpoints](#authentication-endpoints)
2. [User Management](#user-management)
3. [Driver Endpoints](#driver-endpoints)
4. [Passenger Endpoints](#passenger-endpoints)
5. [Ride Management](#ride-management)
6. [Junction Management](#junction-management)
7. [Route Management](#route-management)
8. [Schedule Management](#schedule-management)
9. [Request Management](#request-management)
10. [Wallet Management](#wallet-management)
11. [Admin Endpoints](#admin-endpoints)
12. [Notification System](#notification-system)
13. [Data Models](#data-models)
14. [Error Handling](#error-handling)

## Base URL
\`\`\`
https://your-api-domain.com/api
\`\`\`

## Authentication
Most endpoints require JWT authentication. Include the token in the Authorization header:
\`\`\`
Authorization: Bearer <your-jwt-token>
\`\`\`

Public endpoints are marked with 🌐 and don't require authentication.
