# Encryption and Privacy Setup Guide

This guide explains how to set up the encryption and privacy features implemented in task 6.3.

## Environment Variables

Add the following environment variables to your `.env.local` file:

```bash
# Encryption Configuration
ENCRYPTION_SECRET=your-32-character-or-longer-encryption-secret-key-here

# Cron Job Security (optional)
CRON_SECRET=your-cron-job-secret-for-data-retention-cleanup

# GDPR Compliance Settings
GDPR_RETENTION_ENABLED=true
GDPR_AUTO_CLEANUP=true
```

### Generating Encryption Secret

The `ENCRYPTION_SECRET` must be at least 32 characters long. You can generate a secure secret using:

```bash
# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Using OpenSSL
openssl rand -hex 32

# Using Python
python -c "import secrets; print(secrets.token_hex(32))"
```

## Database Schema Setup

Run the GDPR privacy schema to create the necessary tables:

```sql
-- Execute the SQL file
\i database/gdpr-privacy-schema.sql
```

This creates the following tables:
- `gdpr_consent_records` - User consent tracking
- `gdpr_processing_records` - Data processing registry
- `gdpr_privacy_requests` - Privacy rights requests
- `gdpr_erasure_log` - Data deletion audit trail
- `data_retention_policies` - Retention policy definitions
- `data_deletion_jobs` - Automated cleanup jobs
- `data_lifecycle_events` - Data lifecycle tracking
- `password_history` - Password reuse prevention
- `account_lockouts` - Account security

## Features Implemented

### 1. Data Encryption

- **Personal Data Encryption**: Names, phone numbers, addresses are encrypted using AES-256-GCM
- **Guest Information Encryption**: Reservation guest details are encrypted in the database
- **Payment Data Encryption**: Credit card and banking information encryption (existing feature enhanced)

### 2. Password Security

- **Secure Hashing**: bcrypt with 12 salt rounds
- **Password Strength Validation**: Enforces complexity requirements
- **Password History**: Prevents reuse of last 5 passwords
- **Account Lockout**: Protects against brute force attacks
- **Compromised Password Detection**: Basic check against common breached passwords

### 3. GDPR Compliance

- **Consent Management**: Track and manage user consent for different data categories
- **Data Processing Registry**: Log all data processing activities with legal basis
- **Privacy Rights**: Support for access, erasure, portability, rectification requests
- **Data Retention**: Automated cleanup based on retention policies
- **Audit Trails**: Comprehensive logging of all privacy-related activities

### 4. Data Retention Policies

- **Automated Cleanup**: Scheduled deletion of expired data
- **Retention Periods**: Different periods for different data categories
- **Deletion Methods**: Hard delete, soft delete, anonymization, archival
- **Lifecycle Tracking**: Monitor data from creation to deletion

## API Endpoints

### Privacy Management
- `POST /api/privacy` - Submit privacy requests
- `GET /api/privacy?action=requests` - Get user's privacy requests
- `GET /api/privacy?action=consents` - Get user's consent records
- `GET /api/privacy?action=export` - Export user data (GDPR Article 20)
- `PUT /api/privacy` - Update consent preferences
- `DELETE /api/privacy` - Delete account (Right to be Forgotten)

### Data Retention (Cron)
- `POST /api/cron/data-retention` - Run daily cleanup (requires CRON_SECRET)
- `GET /api/cron/data-retention?report=status` - Get retention status
- `GET /api/cron/data-retention?report=compliance` - Get GDPR compliance report

## Usage Examples

### Encrypting User Data

```typescript
import { EncryptedUserService } from '@/lib/services/encrypted-user-service';

// Create user with encrypted data
await EncryptedUserService.createUserProfile({
  id: userId,
  email: 'user@example.com',
  firstName: 'John',
  lastName: 'Doe',
  phone: '+1234567890',
  address: '123 Main St',
  role: 'client'
});

// Get user with decrypted data
const user = await EncryptedUserService.getUserProfile(userId);
```

### Managing Consent

```typescript
import { ConsentManager, DataCategory, LegalBasis } from '@/lib/security/gdpr-compliance';

// Record user consent
await ConsentManager.recordConsent({
  userId: 'user-id',
  dataCategory: DataCategory.PERSONAL_IDENTITY,
  legalBasis: LegalBasis.CONSENT,
  purpose: 'Account management',
  consentGiven: true,
  version: '1.0'
});

// Check if user has consent
const hasConsent = await ConsentManager.hasConsent(userId, DataCategory.PERSONAL_IDENTITY);
```

### Password Security

```typescript
import { hashPassword, verifyPassword, validatePasswordStrength } from '@/lib/security/password-security';

// Hash password
const hashedPassword = await hashPassword('userPassword123!');

// Verify password
const isValid = await verifyPassword('userPassword123!', hashedPassword);

// Validate password strength
const validation = validatePasswordStrength('userPassword123!');
if (!validation.isValid) {
  console.log('Password errors:', validation.errors);
}
```

## Scheduled Jobs

Set up a cron job to run daily data retention cleanup:

### Vercel Cron (vercel.json)
```json
{
  "crons": [
    {
      "path": "/api/cron/data-retention",
      "schedule": "0 2 * * *"
    }
  ]
}
```

### GitHub Actions
```yaml
name: Data Retention Cleanup
on:
  schedule:
    - cron: '0 2 * * *'
jobs:
  cleanup:
    runs-on: ubuntu-latest
    steps:
      - name: Run cleanup
        run: |
          curl -X POST "${{ secrets.APP_URL }}/api/cron/data-retention" \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

## Privacy Settings UI

The privacy settings component is available at `/components/privacy/privacy-settings.tsx` and provides:

- Consent management interface
- Privacy rights request submission
- Data export functionality
- Account deletion
- Request history tracking

## Compliance Features

### GDPR Articles Supported

- **Article 6**: Legal basis for processing
- **Article 7**: Conditions for consent
- **Article 13-14**: Information to be provided
- **Article 15**: Right of access
- **Article 16**: Right to rectification
- **Article 17**: Right to erasure
- **Article 18**: Right to restriction
- **Article 20**: Right to data portability
- **Article 21**: Right to object

### Data Categories

1. **Personal Identity**: Names, IDs, biometric data (7 years retention)
2. **Contact Information**: Email, phone, address (3 years retention)
3. **Financial Data**: Payment info, transactions (7 years retention)
4. **Behavioral Data**: Usage logs, preferences (1 year retention)
5. **Technical Data**: IP addresses, cookies (3 months retention)
6. **Special Category**: Health, biometric data (1 year retention)

## Security Considerations

1. **Encryption Keys**: Store encryption secrets securely, rotate regularly
2. **Access Control**: Implement proper RLS policies in database
3. **Audit Logging**: All privacy operations are logged for compliance
4. **Data Minimization**: Only collect and process necessary data
5. **Purpose Limitation**: Use data only for stated purposes
6. **Storage Limitation**: Automatic deletion based on retention policies

## Monitoring and Alerts

Monitor the following metrics:
- Failed encryption/decryption operations
- Privacy request processing times
- Data retention cleanup success rates
- Consent withdrawal rates
- Account lockout incidents

## Troubleshooting

### Common Issues

1. **Encryption Errors**: Check ENCRYPTION_SECRET is set and >= 32 characters
2. **Database Errors**: Ensure GDPR schema is properly installed
3. **Permission Errors**: Verify RLS policies are correctly configured
4. **Cleanup Failures**: Check cron job authentication and database connectivity

### Validation

Test the encryption setup:

```typescript
import { validateEncryptionSetup } from '@/lib/security/encryption';

const validation = validateEncryptionSetup();
if (!validation.isValid) {
  console.error('Encryption setup errors:', validation.errors);
}
```

## Legal Disclaimer

This implementation provides technical tools for GDPR compliance but does not constitute legal advice. Consult with legal experts to ensure full compliance with applicable privacy laws and regulations.