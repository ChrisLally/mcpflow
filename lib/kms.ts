import { KeyManagementServiceClient } from '@google-cloud/kms';

let kmsClient: KeyManagementServiceClient;

try {
  // Try to initialize with explicit credentials if provided
  const credentials = process.env.GOOGLE_CREDENTIALS 
    ? JSON.parse(process.env.GOOGLE_CREDENTIALS)
    : undefined;

  kmsClient = new KeyManagementServiceClient({
    projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
    credentials
  });
} catch (error) {
  console.error('Error initializing KMS client:', error);
  throw new Error('Failed to initialize KMS client. Please check your Google Cloud credentials.');
}

const keyName = process.env.GOOGLE_CLOUD_KMS_KEY!;

export async function encryptCredential(plaintext: string): Promise<string> {
  if (!kmsClient) {
    throw new Error('KMS client not initialized');
  }

  const [result] = await kmsClient.encrypt({
    name: keyName,
    plaintext: Buffer.from(plaintext, 'utf8'),
    additionalAuthenticatedData: Buffer.from('mcpflow', 'utf8'),
  });
  return result.ciphertext!.toString('base64');
}

export async function decryptCredential(encrypted: string): Promise<string> {
  if (!kmsClient) {
    throw new Error('KMS client not initialized');
  }

  const [result] = await kmsClient.decrypt({
    name: keyName,
    ciphertext: Buffer.from(encrypted, 'base64'),
    additionalAuthenticatedData: Buffer.from('mcpflow', 'utf8'),
  });
  return result.plaintext!.toString('utf8');
} 