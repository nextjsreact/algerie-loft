/**
 * Secure file storage utilities for verification documents and sensitive files
 * Provides encrypted file storage with access control and audit logging
 */

import { createClient } from '@/utils/supabase/server';
import { encryptSensitiveData, decryptSensitiveData, generateSecureToken } from './encryption';
import { createAuditLog } from '@/lib/services/audit';
import { logger } from '@/lib/logger';

export interface SecureFileMetadata {
  id: string;
  originalName: string;
  mimeType: string;
  size: number;
  uploadedBy: string;
  uploadedAt: string;
  encryptionKey: string;
  accessLevel: 'private' | 'partner' | 'admin';
  documentType: 'identity' | 'business_license' | 'tax_document' | 'bank_statement' | 'other';
  relatedEntityId?: string; // partner_id, booking_id, etc.
  relatedEntityType?: string; // 'partner', 'booking', etc.
}

export interface FileUploadOptions {
  documentType: SecureFileMetadata['documentType'];
  accessLevel: SecureFileMetadata['accessLevel'];
  relatedEntityId?: string;
  relatedEntityType?: string;
}

/**
 * Upload and encrypt a file securely
 */
export async function uploadSecureFile(
  file: Buffer,
  originalName: string,
  mimeType: string,
  uploadedBy: string,
  options: FileUploadOptions
): Promise<{ success: boolean; fileId?: string; error?: string }> {
  try {
    const supabase = await createClient();
    const fileId = generateSecureToken(16);
    const encryptionKey = generateSecureToken(32);

    // Encrypt file content
    const encryptedContent = await encryptSensitiveData(file.toString('base64'));

    // Store encrypted file in Supabase Storage
    const fileName = `secure/${fileId}`;
    const { error: uploadError } = await supabase.storage
      .from('verification-documents')
      .upload(fileName, Buffer.from(encryptedContent, 'base64'), {
        contentType: 'application/octet-stream',
        upsert: false
      });

    if (uploadError) {
      logger.error('File upload failed', uploadError);
      return { success: false, error: 'File upload failed' };
    }

    // Store file metadata
    const metadata: Omit<SecureFileMetadata, 'id'> = {
      originalName,
      mimeType,
      size: file.length,
      uploadedBy,
      uploadedAt: new Date().toISOString(),
      encryptionKey: await encryptSensitiveData(encryptionKey),
      accessLevel: options.accessLevel,
      documentType: options.documentType,
      relatedEntityId: options.relatedEntityId,
      relatedEntityType: options.relatedEntityType
    };

    const { error: metadataError } = await supabase
      .from('secure_file_metadata')
      .insert({ id: fileId, ...metadata });

    if (metadataError) {
      // Clean up uploaded file if metadata insertion fails
      await supabase.storage
        .from('verification-documents')
        .remove([fileName]);
      
      logger.error('File metadata storage failed', metadataError);
      return { success: false, error: 'File metadata storage failed' };
    }

    // Create audit log
    await createAuditLog(
      uploadedBy,
      'create',
      'secure_file',
      fileId,
      undefined,
      {
        originalName,
        documentType: options.documentType,
        accessLevel: options.accessLevel,
        size: file.length
      }
    );

    logger.info('Secure file uploaded successfully', {
      fileId,
      originalName,
      uploadedBy,
      documentType: options.documentType
    });

    return { success: true, fileId };
  } catch (error) {
    logger.error('Secure file upload error', error);
    return { success: false, error: 'Internal server error' };
  }
}

/**
 * Download and decrypt a secure file
 */
export async function downloadSecureFile(
  fileId: string,
  requestedBy: string
): Promise<{ success: boolean; file?: Buffer; metadata?: SecureFileMetadata; error?: string }> {
  try {
    const supabase = await createClient();

    // Get file metadata
    const { data: metadata, error: metadataError } = await supabase
      .from('secure_file_metadata')
      .select('*')
      .eq('id', fileId)
      .single();

    if (metadataError || !metadata) {
      return { success: false, error: 'File not found' };
    }

    // Check access permissions
    const hasAccess = await checkFileAccess(fileId, requestedBy, metadata.accessLevel);
    if (!hasAccess) {
      await createAuditLog(
        requestedBy,
        'view',
        'secure_file',
        fileId,
        undefined,
        { action: 'access_denied' }
      );
      return { success: false, error: 'Access denied' };
    }

    // Download encrypted file
    const fileName = `secure/${fileId}`;
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('verification-documents')
      .download(fileName);

    if (downloadError || !fileData) {
      logger.error('File download failed', downloadError);
      return { success: false, error: 'File download failed' };
    }

    // Decrypt file content
    const encryptedContent = await fileData.text();
    const decryptedBase64 = await decryptSensitiveData(encryptedContent);
    const decryptedFile = Buffer.from(decryptedBase64, 'base64');

    // Create audit log
    await createAuditLog(
      requestedBy,
      'view',
      'secure_file',
      fileId,
      undefined,
      {
        originalName: metadata.originalName,
        documentType: metadata.documentType
      }
    );

    logger.info('Secure file downloaded successfully', {
      fileId,
      requestedBy,
      originalName: metadata.originalName
    });

    return {
      success: true,
      file: decryptedFile,
      metadata: metadata as SecureFileMetadata
    };
  } catch (error) {
    logger.error('Secure file download error', error);
    return { success: false, error: 'Internal server error' };
  }
}

/**
 * Delete a secure file
 */
export async function deleteSecureFile(
  fileId: string,
  deletedBy: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    // Get file metadata for audit
    const { data: metadata, error: metadataError } = await supabase
      .from('secure_file_metadata')
      .select('*')
      .eq('id', fileId)
      .single();

    if (metadataError || !metadata) {
      return { success: false, error: 'File not found' };
    }

    // Check if user has permission to delete
    const hasAccess = await checkFileAccess(fileId, deletedBy, 'admin');
    if (!hasAccess && metadata.uploadedBy !== deletedBy) {
      return { success: false, error: 'Access denied' };
    }

    // Delete file from storage
    const fileName = `secure/${fileId}`;
    const { error: storageError } = await supabase.storage
      .from('verification-documents')
      .remove([fileName]);

    if (storageError) {
      logger.error('File storage deletion failed', storageError);
      return { success: false, error: 'File deletion failed' };
    }

    // Delete metadata
    const { error: metadataDeleteError } = await supabase
      .from('secure_file_metadata')
      .delete()
      .eq('id', fileId);

    if (metadataDeleteError) {
      logger.error('File metadata deletion failed', metadataDeleteError);
      return { success: false, error: 'File metadata deletion failed' };
    }

    // Create audit log
    await createAuditLog(
      deletedBy,
      'delete',
      'secure_file',
      fileId,
      {
        originalName: metadata.originalName,
        documentType: metadata.documentType,
        uploadedBy: metadata.uploadedBy
      },
      undefined
    );

    logger.info('Secure file deleted successfully', {
      fileId,
      deletedBy,
      originalName: metadata.originalName
    });

    return { success: true };
  } catch (error) {
    logger.error('Secure file deletion error', error);
    return { success: false, error: 'Internal server error' };
  }
}

/**
 * List secure files for a user or entity
 */
export async function listSecureFiles(
  requestedBy: string,
  filters?: {
    documentType?: SecureFileMetadata['documentType'];
    relatedEntityId?: string;
    relatedEntityType?: string;
  }
): Promise<{ success: boolean; files?: SecureFileMetadata[]; error?: string }> {
  try {
    const supabase = await createClient();

    let query = supabase
      .from('secure_file_metadata')
      .select('*')
      .order('uploadedAt', { ascending: false });

    // Apply filters
    if (filters?.documentType) {
      query = query.eq('documentType', filters.documentType);
    }
    if (filters?.relatedEntityId) {
      query = query.eq('relatedEntityId', filters.relatedEntityId);
    }
    if (filters?.relatedEntityType) {
      query = query.eq('relatedEntityType', filters.relatedEntityType);
    }

    const { data: files, error } = await query;

    if (error) {
      logger.error('File listing failed', error);
      return { success: false, error: 'File listing failed' };
    }

    // Filter files based on access permissions
    const accessibleFiles: SecureFileMetadata[] = [];
    for (const file of files || []) {
      const hasAccess = await checkFileAccess(file.id, requestedBy, file.accessLevel);
      if (hasAccess || file.uploadedBy === requestedBy) {
        accessibleFiles.push(file as SecureFileMetadata);
      }
    }

    return { success: true, files: accessibleFiles };
  } catch (error) {
    logger.error('Secure file listing error', error);
    return { success: false, error: 'Internal server error' };
  }
}

/**
 * Check if a user has access to a file based on access level
 */
async function checkFileAccess(
  fileId: string,
  userId: string,
  accessLevel: SecureFileMetadata['accessLevel']
): Promise<boolean> {
  try {
    const supabase = await createClient();

    // Get user role
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();

    if (error || !profile) {
      return false;
    }

    const userRole = profile.role;

    switch (accessLevel) {
      case 'private':
        // Only the uploader can access private files
        return false; // This will be checked separately in the calling function
      
      case 'partner':
        // Partners and admins can access partner-level files
        return ['partner', 'admin', 'manager'].includes(userRole);
      
      case 'admin':
        // Only admins and managers can access admin-level files
        return ['admin', 'manager'].includes(userRole);
      
      default:
        return false;
    }
  } catch (error) {
    logger.error('File access check error', error);
    return false;
  }
}

/**
 * Get file access URL with temporary token
 */
export async function getSecureFileUrl(
  fileId: string,
  requestedBy: string,
  expiresIn: number = 3600 // 1 hour default
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const supabase = await createClient();

    // Check if file exists and user has access
    const { data: metadata, error: metadataError } = await supabase
      .from('secure_file_metadata')
      .select('*')
      .eq('id', fileId)
      .single();

    if (metadataError || !metadata) {
      return { success: false, error: 'File not found' };
    }

    const hasAccess = await checkFileAccess(fileId, requestedBy, metadata.accessLevel);
    if (!hasAccess && metadata.uploadedBy !== requestedBy) {
      return { success: false, error: 'Access denied' };
    }

    // Generate temporary access token
    const accessToken = generateSecureToken(32);
    const expiresAt = new Date(Date.now() + expiresIn * 1000);

    // Store temporary access token
    const { error: tokenError } = await supabase
      .from('file_access_tokens')
      .insert({
        token: accessToken,
        fileId,
        userId: requestedBy,
        expiresAt: expiresAt.toISOString()
      });

    if (tokenError) {
      logger.error('Access token creation failed', tokenError);
      return { success: false, error: 'Access token creation failed' };
    }

    // Create audit log
    await createAuditLog(
      requestedBy,
      'view',
      'secure_file',
      fileId,
      undefined,
      { action: 'url_generated', expiresAt: expiresAt.toISOString() }
    );

    const url = `/api/secure-files/${fileId}?token=${accessToken}`;
    return { success: true, url };
  } catch (error) {
    logger.error('Secure file URL generation error', error);
    return { success: false, error: 'Internal server error' };
  }
}