import { MongoClient } from 'mongodb';

const ATLAS_URI = 'mongodb+srv://aivora_admin:AivoraDbPass2026Secure99@cluster0.s2g48sz.mongodb.net/aivora?retryWrites=true&w=majority&appName=Cluster0';

async function main() {
  const client = new MongoClient(ATLAS_URI);
  try {
    await client.connect();
    const db = client.db();
    
    // Get all valid file IDs
    const fileDocs = await db.collection('uploads.files').find({}).project({ _id: 1 }).toArray();
    const validFileIds = fileDocs.map(f => f._id);
    console.log(`Found ${validFileIds.length} valid file documents in uploads.files.`);

    // Delete chunks that don't belong to any valid file document
    // NOTE: Keep chunks for currently streaming files if they were just opened
    // Or only delete chunks older than 1 hour or with files_id not in uploads.files
    const delResult = await db.collection('uploads.chunks').deleteMany({
      files_id: { $nin: validFileIds }
    });
    console.log(`Deleted ${delResult.deletedCount} orphaned chunks from uploads.chunks.`);

    // Clean up abandoned uploadchunks documents
    const delUploadChunks = await db.collection('uploadchunks').deleteMany({});
    console.log(`Cleaned ${delUploadChunks.deletedCount} temporary documents from uploadchunks.`);

    const stats = await db.stats();
    console.log(`New DB dataSize: ${(stats.dataSize / (1024 * 1024)).toFixed(2)} MB`);
  } finally {
    await client.close();
  }
}

main().catch(err => {
  console.error('Error cleaning orphaned chunks:', err);
  process.exit(1);
});
