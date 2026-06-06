/**
 * Optional: delete legacy AI questions with no generatedForStudentId (global leak rows).
 * Run: npx tsx scripts/migrate-ai-questions-student-scope.ts
 * Add --dry-run to list only.
 */
import { getDb } from "../backend/firebase/admin";

const dryRun = process.argv.includes("--dry-run");

async function main() {
  const snap = await getDb().collection("questions").where("isAIGenerated", "==", true).get();
  const orphans = snap.docs.filter((d) => !d.data().generatedForStudentId);

  console.log(`Found ${orphans.length} orphan AI question(s) without generatedForStudentId`);

  if (dryRun) {
    orphans.slice(0, 20).forEach((d) => {
      const data = d.data();
      console.log(`  ${d.id} context=${data.contextType}:${data.contextId}`);
    });
    if (orphans.length > 20) console.log(`  ... and ${orphans.length - 20} more`);
    return;
  }

  const batch = getDb().batch();
  orphans.forEach((d) => batch.delete(d.ref));
  if (orphans.length > 0) await batch.commit();
  console.log(dryRun ? "Dry run only" : `Deleted ${orphans.length} orphan(s)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
