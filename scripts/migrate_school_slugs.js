/**
 * Migration script: canonicalize `slug` field on all documents in `schools` collection.
 *
 * Usage (locally):
 * 1. Install firebase-admin: npm install firebase-admin
 * 2. Place a service account JSON at scripts/serviceAccountKey.json (downloaded from Firebase Console)
 * 3. Run dry-run to preview changes:
 *    node scripts/migrate_school_slugs.js --dry
 * 4. Run to apply changes:
 *    node scripts/migrate_school_slugs.js
 *
 * The canonical slug format produced by `generateSlug` below is: join words, capitalize first letter, lower rest
 * Example: "Little Angels Public School" -> "Littleangelspublicschool"
 */

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');
if (!fs.existsSync(serviceAccountPath)) {
  console.error('Missing service account JSON at scripts/serviceAccountKey.json. See script header for usage.');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(require(serviceAccountPath))
});

const db = admin.firestore();

function generateSlug(name) {
  const words = (name || '').replace(/[^A-Za-z0-9\s]/g, '').split(/\s+/).filter(Boolean);
  // Generate a consistent, all-lowercase slug.
  return words.join('').toLowerCase();
}

async function migrate({ dryRun = false } = {}) {
  console.log('Starting migration. dryRun=', dryRun);
  const schoolsRef = db.collection('schools');
  const snapshot = await schoolsRef.get();
  console.log('Found', snapshot.size, 'school documents');

  const batchSize = 500;
  let batch = db.batch();
  let counter = 0;
  let commitCount = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const name = data.name || '';
    const desiredSlug = generateSlug(name);
    const currentSlug = data.slug || null;

    if (currentSlug !== desiredSlug) {
      console.log(`Will update ${doc.id}: slug '${currentSlug}' -> '${desiredSlug}'`);
      if (!dryRun) {
        batch.update(doc.ref, { slug: desiredSlug });
        counter++;
      }
    }

    if (counter >= batchSize) {
      await batch.commit();
      commitCount++;
      console.log('Committed batch', commitCount, 'of size', counter);
      batch = db.batch();
      counter = 0;
    }
  }

  if (!dryRun && counter > 0) {
    await batch.commit();
    commitCount++;
    console.log('Committed final batch', commitCount, 'of size', counter);
  }

  console.log('Migration finished. dryRun=', dryRun);
}

const args = process.argv.slice(2);
const dry = args.includes('--dry') || args.includes('-d');

migrate({ dryRun: dry }).catch(err => {
  console.error('Migration error', err);
  process.exit(1);
});
