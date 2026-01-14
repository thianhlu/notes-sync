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
  try {
    await dbx.filesCreateFolderV2({
      path: folderPath,
      autorename: false,
    });
    console.log(`Created folder: ${folderPath}`);
  } catch (error: any) {
    // Ignore if folder already exists
    if (error?.error?.error_summary?.includes("path/conflict/folder")) {
      return;
    }
    throw error;
  }
}
