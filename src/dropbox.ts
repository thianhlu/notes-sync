import { Dropbox } from "dropbox";

const dbx = new Dropbox({
  accessToken: process.env.DROPBOX_ACCESS_TOKEN,
});

export async function uploadFile(
  path: string,
  content: string
): Promise<void> {
  const encoder = new TextEncoder();
  const contents = encoder.encode(content);

  await dbx.filesUpload({
    path,
    contents,
    mode: { ".tag": "overwrite" },
  });

  console.log(`Uploaded: ${path}`);
}

export async function ensureFolderExists(folderPath: string): Promise<void> {
  // Create parent folders if needed
  const parts = folderPath.split("/").filter(Boolean);
  let currentPath = "";
  
  for (const part of parts) {
    currentPath = currentPath ? `${currentPath}/${part}` : `/${part}`;
    try {
      await dbx.filesCreateFolderV2({
        path: currentPath,
        autorename: false,
      });
      console.log(`Created folder: ${currentPath}`);
    } catch (error: any) {
      // Ignore if folder already exists
      if (error?.error?.error_summary?.includes("path/conflict/folder")) {
        continue;
      }
      // If it's a different error and we're not at the final path, throw it
      if (currentPath !== folderPath) {
        throw error;
      }
      // For the final path, ignore "already exists" errors
      if (!error?.error?.error_summary?.includes("path/conflict/folder")) {
        throw error;
      }
    }
  }
}
