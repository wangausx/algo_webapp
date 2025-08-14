# Security Implementation Plan for Home Development

## 🔐 **Security Implementation Plan for Home Development**

### **Current Architecture**
```
Frontend (React) → Backend (Express TS + SQLite) → Broker API (Alpaca)
                                    ↓
                            Prediction Service (ZMQ)
```

## 📋 **Phase 1: Home Development Security (Current Priority)**

### **1.1 Backend Credential Encryption System**

#### **Step 1: Install Required Dependencies**
```bash
# In your backend directory
npm install crypto-js @types/crypto-js
npm install dotenv
npm install express-rate-limit
npm install helmet
npm install cors
```

#### **Step 2: Environment Configuration**
```bash
# .env file in backend
NODE_ENV=development
PORT=3001
CREDENTIAL_ENCRYPTION_KEY=your-generated-32-byte-key
CREDENTIAL_ENCRYPTION_ALGORITHM=AES-256
DATABASE_PATH=./trading.db
ZMQ_PREDICTION_PORT=5555
ALPACA_BASE_URL=https://paper-api.alpaca.markets
```

#### **Step 3: Generate Encryption Key**
```bash
# Generate a strong encryption key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### **1.2 Backend Security Middleware**

#### **Security Headers and CORS**
```typescript
// backend/src/middleware/security.ts
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

export const securityMiddleware = [
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "ws:", "wss:", "http:", "https:"]
      }
    }
  }),
  cors({
    origin: ['http://localhost:3000', 'http://192.168.1.143:3000'],
    credentials: true
  }),
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP'
  })
];
```

#### **Credential Encryption Utility**
```typescript
// backend/src/utils/credentialEncryption.ts
import CryptoJS from 'crypto-js';

export class CredentialEncryption {
  private encryptionKey: string;

  constructor() {
    this.encryptionKey = process.env.CREDENTIAL_ENCRYPTION_KEY!;
    if (!this.encryptionKey) {
      throw new Error('CREDENTIAL_ENCRYPTION_KEY environment variable is required');
    }
  }

  encryptCredentials(apiKey: string, secretKey: string): {
    encryptedApiKey: string;
    encryptedSecretKey: string;
    iv: string;
  } {
    const iv = CryptoJS.lib.WordArray.random(16);
    
    const encryptedApiKey = CryptoJS.AES.encrypt(apiKey, this.encryptionKey, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    }).toString();

    const encryptedSecretKey = CryptoJS.AES.encrypt(secretKey, this.encryptionKey, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    }).toString();

    return {
      encryptedApiKey,
      encryptedSecretKey,
      iv: iv.toString()
    };
  }

  decryptCredentials(encryptedApiKey: string, encryptedSecretKey: string, iv: string): {
    apiKey: string;
    secretKey: string;
  } {
    const ivWordArray = CryptoJS.enc.Hex.parse(iv);
    
    const apiKey = CryptoJS.AES.decrypt(encryptedApiKey, this.encryptionKey, {
      iv: ivWordArray,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    }).toString(CryptoJS.enc.Utf8);

    const secretKey = CryptoJS.AES.decrypt(encryptedSecretKey, this.encryptionKey, {
      iv: ivWordArray,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    }).toString(CryptoJS.enc.Utf8);

    return { apiKey, secretKey };
  }
}
```

### **1.3 Database Schema Updates**

#### **SQLite Credentials Table**
```sql
-- backend/database/migrations/001_create_credentials_table.sql
CREATE TABLE IF NOT EXISTS user_credentials (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    encrypted_api_key TEXT NOT NULL,
    encrypted_secret_key TEXT NOT NULL,
    encryption_iv TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_user_credentials_user_id ON user_credentials(user_id);
CREATE UNIQUE INDEX idx_user_credentials_unique_user ON user_credentials(user_id);
```

#### **Database Utility Functions**
```typescript
// backend/src/utils/database.ts
import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';

export class DatabaseManager {
  private db: Database | null = null;

  async initialize(): Promise<void> {
    this.db = await open({
      filename: process.env.DATABASE_PATH || './trading.db',
      driver: sqlite3.Database
    });

    // Run migrations
    await this.runMigrations();
  }

  private async runMigrations(): Promise<void> {
    const migrations = [
      // Add your migration SQL files here
    ];

    for (const migration of migrations) {
      await this.db!.exec(migration);
    }
  }

  async storeCredentials(userId: number, encryptedData: any): Promise<void> {
    const { encryptedApiKey, encryptedSecretKey, iv } = encryptedData;
    
    await this.db!.run(`
      INSERT OR REPLACE INTO user_credentials 
      (user_id, encrypted_api_key, encrypted_secret_key, encryption_iv, updated_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    `, [userId, encryptedApiKey, encryptedSecretKey, iv]);
  }

  async getCredentials(userId: number): Promise<any> {
    return await this.db!.get(`
      SELECT encrypted_api_key, encrypted_secret_key, encryption_iv
      FROM user_credentials 
      WHERE user_id = ?
    `, [userId]);
  }

  async removeCredentials(userId: number): Promise<void> {
    await this.db!.run(`
      DELETE FROM user_credentials WHERE user_id = ?
    `, [userId]);
  }
}
```

### **1.4 Credential Management API Endpoints**

#### **Express Routes**
```typescript
// backend/src/routes/credentials.ts
import { Router } from 'express';
import { CredentialEncryption } from '../utils/credentialEncryption';
import { DatabaseManager } from '../utils/database';

const router = Router();
const credentialEncryption = new CredentialEncryption();
const dbManager = new DatabaseManager();

// Store credentials
router.post('/store', async (req, res) => {
  try {
    const { username, apiKey, secretKey } = req.body;
    
    // Validate input
    if (!username || !apiKey || !secretKey) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get user ID from username
    const user = await dbManager.getUserByUsername(username);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Encrypt credentials
    const encryptedData = credentialEncryption.encryptCredentials(apiKey, secretKey);
    
    // Store in database
    await dbManager.storeCredentials(user.id, encryptedData);
    
    res.json({ success: true, message: 'Credentials stored successfully' });
  } catch (error) {
    console.error('Error storing credentials:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Check credentials status
router.get('/status/:username', async (req, res) => {
  try {
    const { username } = req.params;
    
    const user = await dbManager.getUserByUsername(username);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const credentials = await dbManager.getCredentials(user.id);
    const hasCredentials = !!credentials;
    
    res.json({ 
      hasCredentials,
      lastUpdated: credentials?.updated_at || null
    });
  } catch (error) {
    console.error('Error checking credentials:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update credentials
router.put('/update/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const { apiKey, secretKey } = req.body;
    
    if (!apiKey || !secretKey) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const user = await dbManager.getUserByUsername(username);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const encryptedData = credentialEncryption.encryptCredentials(apiKey, secretKey);
    await dbManager.storeCredentials(user.id, encryptedData);
    
    res.json({ success: true, message: 'Credentials updated successfully' });
  } catch (error) {
    console.error('Error updating credentials:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Remove credentials
router.delete('/remove/:username', async (req, res) => {
  try {
    const { username } = req.params;
    
    const user = await dbManager.getUserByUsername(username);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await dbManager.removeCredentials(user.id);
    
    res.json({ success: true, message: 'Credentials removed successfully' });
  } catch (error) {
    console.error('Error removing credentials:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
```

### **1.5 Broker API Integration**

#### **Alpaca API Service**
```typescript
// backend/src/services/alpacaService.ts
import { CredentialEncryption } from '../utils/credentialEncryption';
import { DatabaseManager } from '../utils/database';

export class AlpacaService {
  private credentialEncryption: CredentialEncryption;
  private dbManager: DatabaseManager;

  constructor() {
    this.credentialEncryption = new CredentialEncryption();
    this.dbManager = new DatabaseManager();
  }

  async makeApiCall(username: string, endpoint: string, method: string = 'GET', data?: any): Promise<any> {
    try {
      // Get user credentials
      const user = await this.dbManager.getUserByUsername(username);
      if (!user) {
        throw new Error('User not found');
      }

      const encryptedCredentials = await this.dbManager.getCredentials(user.id);
      if (!encryptedCredentials) {
        throw new Error('No credentials found for user');
      }

      // Decrypt credentials
      const { apiKey, secretKey } = this.credentialEncryption.decryptCredentials(
        encryptedCredentials.encrypted_api_key,
        encryptedCredentials.encrypted_secret_key,
        encryptedCredentials.encryption_iv
      );

      // Make API call to Alpaca
      const baseUrl = process.env.ALPACA_BASE_URL;
      const url = `${baseUrl}${endpoint}`;
      
      const response = await fetch(url, {
        method,
        headers: {
          'APCA-API-KEY-ID': apiKey,
          'APCA-API-SECRET-KEY': secretKey,
          'Content-Type': 'application/json'
        },
        body: data ? JSON.stringify(data) : undefined
      });

      if (!response.ok) {
        throw new Error(`Alpaca API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error making Alpaca API call:', error);
      throw error;
    }
  }
}
```

## 📋 **Phase 2: Frontend Updates**

### **2.1 Remove Client-Side Encryption**
- Delete `src/utils/secureStorage.ts`
- Remove master password logic from `AccountSettings.tsx`
- Simplify credentials modal

### **2.2 Update Credential Management**
```typescript
// src/services/credentialService.ts
export class CredentialService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001';
  }

  async storeCredentials(username: string, apiKey: string, secretKey: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/credentials/store`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, apiKey, secretKey })
    });

    if (!response.ok) {
      throw new Error('Failed to store credentials');
    }
  }

  async checkCredentialsStatus(username: string): Promise<{ hasCredentials: boolean; lastUpdated?: string }> {
    const response = await fetch(`${this.baseUrl}/api/credentials/status/${username}`);
    
    if (!response.ok) {
      throw new Error('Failed to check credentials status');
    }

    return await response.json();
  }

  async updateCredentials(username: string, apiKey: string, secretKey: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/credentials/update/${username}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey, secretKey })
    });

    if (!response.ok) {
      throw new Error('Failed to update credentials');
    }
  }

  async removeCredentials(username: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/credentials/remove/${username}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      throw new Error('Failed to remove credentials');
    }
  }
}
```

## 🔒 **Security Considerations for Home Development**

### **1. Network Security**
- Use strong WiFi passwords
- Enable WPA3 encryption if available
- Consider VLAN isolation for IoT devices
- Regular router firmware updates

### **2. Backend Security**
- Store encryption keys in environment variables
- Use strong random generation for keys
- Implement rate limiting
- Log all credential access

### **3. Database Security**
- SQLite file permissions (readable only by backend)
- Regular backups
- Monitor file access

### **4. API Security**
- Validate all input data
- Implement proper error handling
- Log all API calls
- Monitor for suspicious activity

## 🚀 **Deployment Steps**

### **Step 1: Backend Setup**
```bash
# 1. Install dependencies
npm install crypto-js @types/crypto-js dotenv helmet cors express-rate-limit

# 2. Generate encryption key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# 3. Update .env file
# 4. Run database migrations
# 5. Test endpoints
```

### **Step 2: Frontend Updates**
```bash
# 1. Remove secureStorage.ts
# 2. Update AccountSettings.tsx
# 3. Add credentialService.ts
# 4. Test credential flow
```

### **Step 3: Integration Testing**
```bash
# 1. Test credential storage
# 2. Test broker API calls
# 3. Test credential updates
# 4. Verify security measures
```

## 🔮 **Future Production Considerations**

### **1. HTTPS/SSL Implementation**
- SSL certificates (Let's Encrypt)
- Nginx reverse proxy
- HSTS headers
- Perfect Forward Secrecy

### **2. Advanced Security**
- Multi-factor authentication
- Session management
- Audit logging
- Intrusion detection

### **3. Infrastructure Security**
- Container security
- Network segmentation
- Monitoring and alerting
- Regular security audits

## 📝 **Implementation Notes**

### **Priority Order**
1. **Backend encryption system** - Core security foundation
2. **Database schema updates** - Store encrypted credentials
3. **API endpoints** - Credential management
4. **Frontend updates** - Remove client-side encryption
5. **Integration testing** - Verify complete flow

### **Testing Strategy**
- Unit tests for encryption/decryption
- Integration tests for API endpoints
- End-to-end tests for credential flow
- Security tests for input validation

### **Rollback Plan**
- Keep original code in git branches
- Test each component individually
- Have fallback to original implementation
- Monitor for any issues during transition

---

**Document Version**: 1.0  
**Last Updated**: December 2024  
**Status**: Planning Phase  
**Next Steps**: Backend encryption system implementation
