# Changelog

All notable changes to the OpenLibx402 Chatbot project.

## [Unreleased]

### Added

#### OpenLibx402 Core Integration
- ✅ Integrated `@openlibx402/core` package for standardized X402 protocol support
- ✅ Adopted `PaymentRequest` model for standardized HTTP 402 responses
- ✅ Added standardized error classes (`PaymentVerificationError`, `PaymentExpiredError`, `InsufficientFundsError`)
- ✅ Implemented payment expiration validation (5-minute expiration)
- ✅ Added nonce generation for replay attack prevention
- ✅ Created unique payment IDs for payment tracking

#### Payment Protocol Enhancement
- ✅ Implemented X-Payment-Authorization header support (standardized format)
- ✅ Added backward compatibility with legacy POST body method
- ✅ Supports both header-based and body-based payment submission
- ✅ Enhanced payment validation with standardized error handling

#### Rate Limiting
- ✅ Updated 402 responses to use standardized `PaymentRequest` format
- ✅ Payment requests now include payment_id, nonce, expiration, and resource details
- ✅ Improved logging with payment ID tracking

#### Backend API Configuration
- ✅ Fixed backend API URL configuration in MkDocs template
- ✅ Changed from hardcoded placeholder to environment-based configuration
- ✅ Updated `docs/mkdocs.yml` to use `extra.chatbot.api_url` correctly
- ✅ Added support for configurable backend URLs in development/production

#### Documentation Updates
- ✅ Updated API documentation with new X402 standardized responses
- ✅ Added X-Payment-Authorization header method to payment submission examples
- ✅ Updated base URL examples for Deno (localhost:8000)
- ✅ Enhanced payment info endpoint documentation
- ✅ Added X402 Integration section to payments documentation
- ✅ Created comprehensive Backend API Configuration guide
- ✅ Created OpenLibx402 Integration summary document

### Changed

#### API Response Format
- **Before**: Simple JSON payment info
- **After**: Standardized `PaymentRequest` format with X402 fields
  - Added `max_amount_required`
  - Added `asset_type` (SPL)
  - Added `asset_address` (USDC mint)
  - Added `payment_address` (recipient wallet)
  - Added `network` (solana-devnet/solana-mainnet)
  - Added `expires_at` (payment expiration timestamp)
  - Added `nonce` (replay attack prevention)
  - Added `payment_id` (unique request identifier)
  - Added `resource` (request path)
  - Added `description` (payment reason)

#### Payment Submission
- Now supports X-Payment-Authorization header with base64-encoded JSON
- Maintains backward compatibility with POST body format
- Enhanced logging to show which method was used

#### Error Handling
- Replaced generic error messages with standardized openlibx402 errors
- Better error context and categorization
- Improved error logging with standardized error types

#### Documentation
- Updated all API examples to use localhost:8000 (Deno)
- Added dual-method examples for payment submission
- Enhanced configuration documentation
- Added references to X402 standard throughout

### Fixed

- ✅ Fixed MkDocs template looking for wrong config key (`chatbot_api_url` → `chatbot.api_url`)
- ✅ Fixed hardcoded placeholder domain in chatbot widget (`https://your-deno-deploy-url.deno.dev`)
- ✅ Fixed backend API URL not being picked up from environment configuration
- ✅ Added console logging to verify API URL configuration

### Dependencies

#### Added
- `@openlibx402/core@^0.1.2` - Core X402 protocol implementation

#### Updated
- `deno.json` - Added openlibx402 import mapping

### Files Modified

**Backend**:
- `chatbot/deno.json` - Added @openlibx402/core dependency
- `chatbot/src/middleware/rateLimit.ts` - Integrated PaymentRequest for 402 responses
- `chatbot/src/handlers/payment.ts` - Added X-Payment-Authorization header support, error handling
- `chatbot/src/services/solana.ts` - Integrated PaymentVerificationError
- `chatbot/scripts/derive-wallet.ts` - Updated to read public key from env directly

**Frontend**:
- `docs/overrides/main.html` - Fixed API URL configuration from mkdocs.yml
- `docs/mkdocs.yml` - Updated chatbot.api_url configuration and added comments

**Documentation**:
- `docs/docs/chatbot/api.md` - Updated for new X402 format and payment methods
- `docs/docs/chatbot/payments.md` - Added X402 integration section
- Created `docs/BACKEND_API_CONFIGURATION.md` - New configuration guide
- Created `chatbot/OPENLIBX402_INTEGRATION.md` - Integration summary

### Documentation Added

1. **OPENLIBX402_INTEGRATION.md** - Comprehensive integration guide
   - Overview of integration approach
   - Features added and retained
   - Files modified
   - Configuration details
   - Troubleshooting guide

2. **BACKEND_API_CONFIGURATION.md** - Backend URL configuration guide
   - Problem explanation
   - Root cause analysis
   - Solution details
   - Configuration examples
   - Verification steps
   - Troubleshooting

### Backward Compatibility

- ✅ All existing clients continue to work
- ✅ Legacy POST body payment submission still supported
- ✅ Existing rate limiting logic preserved
- ✅ All existing features retained

### Testing

- Manual verification of 402 responses with new PaymentRequest format
- X-Payment-Authorization header parsing tested
- Backward compatibility with POST body tested
- Backend URL configuration verified
- All endpoints returning correct API URLs

### Known Issues

None known at this time.

### Future Improvements

- [ ] Add rate limiting to payment endpoint
- [ ] Implement payment webhooks
- [ ] Add payment history/receipts
- [ ] Support subscription plans
- [ ] Multi-wallet support
- [ ] Contribute Hono middleware to openlibx402
- [ ] Create JavaScript/TypeScript client library for X402

---

## [1.0.0] - Previous Release

See git history for details of the initial release.

---

**Last Updated**: 2025-11-05
**Status**: In Development
**Compatibility**: Fully backward compatible
