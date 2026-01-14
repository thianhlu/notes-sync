import { Client } from "@notionhq/client";
import type {
  BlockObjectResponse,
  PageObjectResponse,
  PartialBlockObjectResponse,
} from "@notionhq/client/build/src/api-endpoints";

const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

export async function getDatabasePages(databaseId: string): Promise<PageObjectResponse[]> {
  const pages: PageObjectResponse[] = [];
  let cursor: string | undefined;

  do {
    const response = await notion.databases.query({
      database_id: databaseId,
      start_cursor: cursor,
    });

    for (const page of response.results) {
      if ("properties" in page) {
        pages.push(page as PageObjectResponse);
      }
    }

    cursor = response.next_cursor ?? undefined;
  } while (cursor);

  return pages;
}

export async function getPageBlocks(pageId: string): Promise<BlockObjectResponse[]> {
  const blocks: BlockObjectResponse[] = [];
  let cursor: string | undefined;

  do {
    const response = await notion.blocks.children.list({
      block_id: pageId,
      start_cursor: cursor,
    });

    for (const block of response.results) {
      if ("type" in block) {
        const fullBlock = block as BlockObjectResponse;
        blocks.push(fullBlock);

        // Recursively fetch children if the block has them
        if (fullBlock.has_children) {
          const children = await getPageBlocks(fullBlock.id);
          (fullBlock as any).children = children;
        }
      }
    }

    cursor = response.next_cursor ?? undefined;
  } while (cursor);

  return blocks;
}

export function getPageTitle(page: PageObjectResponse): string {
  const titleProp = Object.values(page.properties).find(
    (prop) => prop.type === "title"
  );

  if (titleProp?.type === "title") {
    return titleProp.title.map((t) => t.plain_text).join("") || "Untitled";
  }

  return "Untitled";
}

export function getPageDate(page: PageObjectResponse): string {
  // Try to find a date property
  const dateProp = Object.values(page.properties).find(
    (prop) => prop.type === "date"
  );

  if (dateProp?.type === "date" && dateProp.date?.start) {
    return dateProp.date.start;
  }

  // Fall back to created time
  return page.created_time.split("T")[0];
}
