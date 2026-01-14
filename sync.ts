import { getDatabasePages, getPageBlocks, getPageTitle, getPageDate } from "./notion.js";
import { blocksToMarkdown } from "./markdown.js";
import { uploadFile, ensureFolderExists } from "./dropbox.js";

// Configuration
const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID!;
const DROPBOX_FOLDER = process.env.DROPBOX_FOLDER || "/Meeting Notes";

function sanitizeFilename(name: string): string {
  return name
    .replace(/[<>:"/\\|?*]/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 100);
}

async function syncNotionToDropbox() {
  console.log("Starting Notion → Dropbox sync...");
  console.log(`Database ID: ${NOTION_DATABASE_ID}`);
  console.log(`Dropbox folder: ${DROPBOX_FOLDER}`);

  // Validate environment variables
  if (!process.env.NOTION_API_KEY) {
    throw new Error("NOTION_API_KEY is required");
  }
  if (!process.env.DROPBOX_ACCESS_TOKEN) {
    throw new Error("DROPBOX_ACCESS_TOKEN is required");
  }
  if (!NOTION_DATABASE_ID) {
    throw new Error("NOTION_DATABASE_ID is required");
  }

  // Ensure Dropbox folder exists
  await ensureFolderExists(DROPBOX_FOLDER);

  // Fetch all pages from the Notion database
  console.log("\nFetching pages from Notion database...");
  const pages = await getDatabasePages(NOTION_DATABASE_ID);
  console.log(`Found ${pages.length} pages`);

  // Process each page
  let successCount = 0;
  let errorCount = 0;

  for (const page of pages) {
    try {
      const title = getPageTitle(page);
      const date = getPageDate(page);
      const filename = sanitizeFilename(`${date} - ${title}`);

      console.log(`\nProcessing: ${title}`);

      // Fetch all blocks (content) for this page
      const blocks = await getPageBlocks(page.id);

      // Convert to Markdown
      const markdown = [
        `# ${title}`,
        ``,
        `*Synced from Notion on ${new Date().toISOString()}*`,
        ``,
        `---`,
        ``,
        blocksToMarkdown(blocks),
      ].join("\n");

      // Upload to Dropbox
      const dropboxPath = `${DROPBOX_FOLDER}/${filename}.md`;
      await uploadFile(dropboxPath, markdown);

      successCount++;

      // Small delay to avoid rate limits
      await sleep(100);
    } catch (error) {
      console.error(`Error processing page ${page.id}:`, error);
      errorCount++;
    }
  }

  console.log(`\n✅ Sync complete!`);
  console.log(`   Success: ${successCount}`);
  console.log(`   Errors: ${errorCount}`);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Run the sync
syncNotionToDropbox().catch((error) => {
  console.error("Sync failed:", error);
  process.exit(1);
});
