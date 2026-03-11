/**
 * Blue Cinis - Script de Backup Automatisé
 * Usage: npx tsx scripts/backup.ts [--keep-days=30]
 */

import { prisma } from '@/lib/prisma';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { mkdir, writeFile, rm } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

interface BackupOptions {
  keepDays?: number;
  uploadToS3?: boolean;
  compress?: boolean;
}

interface BackupResult {
  success: boolean;
  backupPath?: string;
  size?: number;
  error?: string;
}

/**
 * Effectue un backup complet de la base de données
 */
export async function performDatabaseBackup(options: BackupOptions = {}): Promise<BackupResult> {
  const { keepDays = 30 } = options;
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = join(process.cwd(), 'backups');
  const backupPath = join(backupDir, `blue-cinis-backup-${timestamp}.json`);

  console.log('📦 Début du backup...');

  try {
    // Créer le dossier si pas existant
    if (!existsSync(backupDir)) {
      await mkdir(backupDir, { recursive: true });
    }

    // Exporter toutes les données importantes
    const [users, artists, artworks, orders, categories] = await Promise.all([
      prisma.user.findMany({
        select: {
          id: true, email: true, name: true, role: true, isActive: true,
          createdAt: true, updatedAt: true, aiTokens: true,
        },
      }),
      prisma.artist.findMany({
        include: { user: { select: { email: true } } },
      }),
      prisma.artwork.findMany({
        include: { artist: { select: { name: true } }, category: true },
      }),
      prisma.order.findMany({
        include: { artwork: true, artist: true },
        orderBy: { createdAt: 'desc' },
        take: 1000,
      }),
      prisma.category.findMany(),
    ]);

    const backup = {
      version: '2.0.0',
      timestamp: new Date().toISOString(),
      data: {
        users,
        artists,
        artworks,
        orders,
        categories,
        stats: {
          users: users.length,
          artists: artists.length,
          artworks: artworks.length,
          orders: orders.length,
        },
      },
    };

    // Écrire le fichier
    await writeFile(backupPath, JSON.stringify(backup, null, 2));

    // Upload vers S3 si configuré
    if (options.uploadToS3) {
      await uploadToS3(backupPath, `backups/blue-cinis-${timestamp}.json`);
    }

    // Nettoyer les vieux backups
    await cleanupOldBackups(backupDir, keepDays);

    const size = JSON.stringify(backup).length;
    console.log(`✅ Backup créé: ${backupPath} (${(size / 1024 / 1024).toFixed(2)} MB)`);

    return { success: true, backupPath, size };
  } catch (error) {
    console.error('❌ Erreur backup:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Upload vers S3
 */
async function uploadToS3(filePath: string, key: string): Promise<void> {
  const s3Client = new S3Client({
    region: process.env.AWS_REGION || 'eu-west-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });

  const { readFile } = await import('fs/promises');
  const fileContent = await readFile(filePath);

  await s3Client.send(
    new PutObjectCommand({
      Bucket: process.env.AWS_BACKUP_BUCKET || 'blue-cinis-backups',
      Key: key,
      Body: fileContent,
      ContentType: 'application/json',
    })
  );

  console.log(`☁️ Uploadé vers S3: ${key}`);
}

/**
 * Supprime les backups vieux de X jours
 */
async function cleanupOldBackups(backupDir: string, keepDays: number): Promise<void> {
  const { readdir, stat } = await import('fs/promises');
  const files = await readdir(backupDir);
  const cutoff = Date.now() - keepDays * 24 * 60 * 60 * 1000;

  for (const file of files) {
    if (!file.startsWith('blue-cinis-backup-')) continue;
    
    const filePath = join(backupDir, file);
    const stats = await stat(filePath);
    
    if (stats.mtimeMs < cutoff) {
      await rm(filePath);
      console.log(`🗑️  Backup supprimé: ${file}`);
    }
  }
}

/**
 * Script CLI
 */
if (require.main === module) {
  const args = process.argv.slice(2);
  const options: BackupOptions = {
    uploadToS3: process.env.AWS_BACKUP_BUCKET !== undefined,
  };

  for (const arg of args) {
    if (arg.startsWith('--keep-days=')) {
      options.keepDays = parseInt(arg.split('=')[1], 10);
    }
  }

  performDatabaseBackup(options)
    .then((result) => {
      if (result.success) {
        console.log('✅ Backup terminé');
        process.exit(0);
      } else {
        console.error('❌ Backup échoué:', result.error);
        process.exit(1);
      }
    });
}
