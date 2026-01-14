import type { BlockObjectResponse, RichTextItemResponse } from "@notionhq/client/build/src/api-endpoints";

interface MarkdownOptions {
  isMeetingNote?: boolean;
}

export function blocksToMarkdown(blocks: BlockObjectResponse[], indent = 0, options: MarkdownOptions = {}): string {
  const lines: string[] = [];

  for (const block of blocks) {
    // For meeting notes, expand child_page content directly
    if (options.isMeetingNote && block.type === "child_page") {
      // Add section header for the meeting content
      lines.push(`\n## ${block.child_page.title}\n`);
      if ((block as any).children) {
        lines.push(blocksToMarkdown((block as any).children, 0, options));
      }
      continue;
    }

    const line = blockToMarkdown(block, indent);
    if (line !== null) {
      lines.push(line);
    }

    // Handle children
    if ((block as any).children) {
      lines.push(blocksToMarkdown((block as any).children, indent + 1, options));
    }
  }

  return lines.join("\n");
}

function blockToMarkdown(block: BlockObjectResponse, indent: number): string | null {
  const prefix = "  ".repeat(indent);

  switch (block.type) {
    case "paragraph":
      return prefix + richTextToMarkdown(block.paragraph.rich_text);

    case "heading_1":
      return `\n# ${richTextToMarkdown(block.heading_1.rich_text)}`;

    case "heading_2":
      return `\n## ${richTextToMarkdown(block.heading_2.rich_text)}`;

    case "heading_3":
      return `\n### ${richTextToMarkdown(block.heading_3.rich_text)}`;

    case "bulleted_list_item":
      return `${prefix}- ${richTextToMarkdown(block.bulleted_list_item.rich_text)}`;

    case "numbered_list_item":
      return `${prefix}1. ${richTextToMarkdown(block.numbered_list_item.rich_text)}`;

    case "to_do":
      const checkbox = block.to_do.checked ? "[x]" : "[ ]";
      return `${prefix}- ${checkbox} ${richTextToMarkdown(block.to_do.rich_text)}`;

    case "toggle":
      return `${prefix}<details>\n${prefix}<summary>${richTextToMarkdown(block.toggle.rich_text)}</summary>\n`;

    case "code":
      const lang = block.code.language || "";
      const code = richTextToMarkdown(block.code.rich_text);
      return `\n\`\`\`${lang}\n${code}\n\`\`\`\n`;

    case "quote":
      return `${prefix}> ${richTextToMarkdown(block.quote.rich_text)}`;

    case "callout":
      const icon = block.callout.icon?.type === "emoji" ? block.callout.icon.emoji + " " : "";
      return `${prefix}> ${icon}${richTextToMarkdown(block.callout.rich_text)}`;

    case "divider":
      return "\n---\n";

    case "table_of_contents":
      return "[Table of Contents]";

    case "bookmark":
      return `[Bookmark: ${block.bookmark.url}](${block.bookmark.url})`;

    case "image":
      const imageUrl = block.image.type === "external" 
        ? block.image.external.url 
        : block.image.file.url;
      const caption = block.image.caption.length > 0 
        ? richTextToMarkdown(block.image.caption) 
        : "image";
      return `![${caption}](${imageUrl})`;

    case "video":
      const videoUrl = block.video.type === "external"
        ? block.video.external.url
        : block.video.file.url;
      return `[Video: ${videoUrl}](${videoUrl})`;

    case "file":
      const fileUrl = block.file.type === "external"
        ? block.file.external.url
        : block.file.file.url;
      return `[File: ${fileUrl}](${fileUrl})`;

    case "pdf":
      const pdfUrl = block.pdf.type === "external"
        ? block.pdf.external.url
        : block.pdf.file.url;
      return `[PDF: ${pdfUrl}](${pdfUrl})`;

    case "equation":
      return `$${block.equation.expression}$`;

    case "table":
      // Tables need special handling - the rows come as children
      return null; // Will be handled by children

    case "table_row":
      const cells = block.table_row.cells.map(cell => richTextToMarkdown(cell));
      return `| ${cells.join(" | ")} |`;

    case "column_list":
    case "column":
      return null; // Handled by children

    case "synced_block":
      return null; // Content comes from children

    case "template":
      return null;

    case "link_to_page":
      return `[Link to page]`;

    case "child_page":
      return `📄 **${block.child_page.title}**`;

    case "child_database":
      return `📊 **${block.child_database.title}**`;

    case "embed":
      return `[Embed: ${block.embed.url}](${block.embed.url})`;

    case "link_preview":
      return `[Link: ${block.link_preview.url}](${block.link_preview.url})`;

    default:
      return null;
  }
}

function richTextToMarkdown(richText: RichTextItemResponse[]): string {
  return richText.map(text => {
    let content = text.plain_text;

    // Apply annotations
    if (text.annotations.bold) {
      content = `**${content}**`;
    }
    if (text.annotations.italic) {
      content = `*${content}*`;
    }
    if (text.annotations.strikethrough) {
      content = `~~${content}~~`;
    }
    if (text.annotations.code) {
      content = `\`${content}\``;
    }

    // Handle links
    if (text.href) {
      content = `[${content}](${text.href})`;
    }

    return content;
  }).join("");
}
