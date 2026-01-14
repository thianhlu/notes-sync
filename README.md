# Notion → Dropbox Sync

Automatically sync your Notion meeting notes to Dropbox on a schedule using GitHub Actions.

## Features

- Fetches full page content (all blocks, not just properties)
- Converts Notion pages to Markdown
- Runs 2x daily via GitHub Actions (free)
- Manual trigger available anytime

## Setup

### 1. Create a Notion Integration

1. Go to [notion.so/my-integrations](https://www.notion.so/my-integrations)
2. Click **New integration**
3. Name it (e.g., "Dropbox Sync")
4. Select your workspace
5. Copy the **Internal Integration Token** (starts with `secret_`)

### 2. Share Your Database with the Integration

1. Open your meeting notes database in Notion
2. Click the **•••** menu in the top right
3. Click **Add connections** → select your integration
4. Copy the **Database ID** from the URL:
   ```
   https://notion.so/your-workspace/DATABASE_ID_HERE?v=...
                                    ^^^^^^^^^^^^^^^^
   ```

### 3. Create a Dropbox App

1. Go to [dropbox.com/developers/apps](https://www.dropbox.com/developers/apps)
2. Click **Create app**
3. Choose **Scoped access**
4. Choose **Full Dropbox** (or App folder if you prefer)
5. Name your app
6. Under **Permissions**, enable:
   - `files.content.write`
   - `files.content.read`
7. Go to **Settings** → **OAuth 2** → Generate access token
8. Copy the **Access Token**

### 4. Set Up GitHub Repository

1. Create a new GitHub repository
2. Push this code to the repo
3. Go to **Settings** → **Secrets and variables** → **Actions**
4. Add these **Repository secrets**:

   | Secret Name | Value |
   |-------------|-------|
   | `NOTION_API_KEY` | Your Notion integration token |
   | `NOTION_DATABASE_ID` | Your database ID |
   | `DROPBOX_ACCESS_TOKEN` | Your Dropbox access token |

5. (Optional) Add a **Repository variable**:
   
   | Variable Name | Value |
   |---------------|-------|
   | `DROPBOX_FOLDER` | Custom folder path (default: `/Meeting Notes`) |

### 5. Test It

1. Go to **Actions** tab in your GitHub repo
2. Select **Sync Notion to Dropbox**
3. Click **Run workflow** → **Run workflow**
4. Check the logs to verify it works

## Schedule

By default, the sync runs at:
- 9:00 AM UTC
- 5:00 PM UTC

To change the schedule, edit `.github/workflows/sync.yml`:

```yaml
schedule:
  - cron: '0 9 * * *'   # 9am UTC
  - cron: '0 17 * * *'  # 5pm UTC
```

Use [crontab.guru](https://crontab.guru) to help with cron syntax.

**Example: 9am and 5pm Pacific Time (UTC-8):**
```yaml
schedule:
  - cron: '0 17 * * *'  # 9am PT = 5pm UTC
  - cron: '0 1 * * *'   # 5pm PT = 1am UTC (next day)
```

## Local Development

```bash
# Install dependencies
npm install

# Set environment variables
export NOTION_API_KEY="secret_..."
export NOTION_DATABASE_ID="..."
export DROPBOX_ACCESS_TOKEN="..."
export DROPBOX_FOLDER="/Meeting Notes"

# Run sync
npm run sync
```

## Troubleshooting

**"Could not find database"**
- Make sure you've shared the database with your integration
- Verify the database ID is correct

**"Invalid token"**
- Regenerate your Notion or Dropbox token
- Update the GitHub secret

**Rate limits**
- The script includes delays between API calls
- If you have many pages, you may need to increase delays in `src/sync.ts`
