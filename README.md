# GitHub Profile Widget

A beautiful GitHub profile widget based on Cloudflare Worker, displaying your GitHub statistics with a black and white color scheme and TUI-like effect.

![GitHub Stats](https://zinc-profile.songraysmail.workers.dev/?user=ray-d-song) 

## Features

- 🎨 **Black & White Color Scheme + TUI-like Effect** - Clean and aesthetic terminal-style interface
- 📊 **Top 3 Most Used Programming Languages** - Statistics based on repository count
- ⭐ **Total Stars Count** - Shows all stars you have received
- 📈 **Recent 30-day Commits** - Displays your activity
- 🚀 **Fast Response** - In-memory caching mechanism, updates once every 24 hours
- 🔒 **No Authentication Required** - Uses GitHub public API, no token configuration needed

## Deployment Guide

### 1. Clone the Project

```bash
git clone <your-repo-url>
cd zinc-profile
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Local Development

```bash
pnpm dev
```

**Note**: Local development automatically uses mock data to avoid frequent GitHub API calls.

### 4. Deploy to Cloudflare

```bash
npx wrangler deploy
```

## Usage

After successful deployment, access your GitHub statistics widget via the following URL:

```
https://your-worker-domain.workers.dev/?user=your-github-username
```

For example:
```
https://your-worker-domain.workers.dev/?user=octocat
```

## Integrate into GitHub Profile

Embed the widget into your GitHub personal README:

```markdown
![GitHub Stats](https://your-worker-domain.workers.dev/?user=your-github-username)
```

Or use HTML:

```html
<img src="https://your-worker-domain.workers.dev/?user=your-github-username" alt="GitHub Stats" />
```

## Feature Details

### Caching Mechanism
- Uses in-memory cache to avoid frequent GitHub API calls
- Cache duration: 24 hours
- Automatically clears expired cache

### Data Statistics
- **Language Statistics**: Based on repository count, shows the top 3 most used programming languages
- **Star Statistics**: Counts the total number of stars received across all repositories
- **Commit Statistics**: Counts commits in the 5 most active repositories in the last 30 days

### API Limitations
- Uses GitHub public API, no authentication required
- Up to 60 requests per hour (per IP)
- Reduces API call frequency through in-memory caching

## Custom Configuration

### Modify Cache Time

Edit the cache time in `src/index.ts`:

```typescript
// Change 24 hours to another time (in milliseconds)
expiry: now + 24 * 60 * 60 * 1000  // 24 hours
```

### Modify Language Icons

Add or modify language icons in the `languageIcons` object within the `generateSVG` function:

```typescript
const languageIcons: Record<string, string> = {
  'JavaScript': '◉',
  'TypeScript': '◈',
  'Python': '●',
  // Add more language icons...
};
```

### Modify Styles

Modify CSS styles within the `<style>` tag in the `generateSVG` function:

```css
.container {
  font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
  font-size: 12px;
  fill: #e6e6e6;  /* Change text color */
}
```

## Tech Stack

- **Runtime**: Cloudflare Workers
- **Language**: TypeScript
- **Package Manager**: pnpm
- **API**: GitHub REST API v3
- **Icons**: @iconify/icons-vscode-icons (VS Code style language icons)
- **Output Format**: SVG

## File Structure

```
zinc-profile/
├── src/
│   └── index.ts          # Main logic
├── test/
│   └── index.spec.ts     # Test files
├── package.json          # Project configuration
├── wrangler.jsonc        # Cloudflare Worker configuration
├── tsconfig.json         # TypeScript configuration
└── vitest.config.mts     # Test configuration
```

## Development Notes

### Run Tests

```bash
pnpm test
```

### Type Checking

```bash
pnpm run cf-typegen
```

### Local Debugging

```bash
pnpm dev
```

Then visit: `http://localhost:8787/?user=your-github-username`

**Local Development Features**:
- Automatically detects localhost environment, uses mock data
- Avoids GitHub API rate limits
- Quick preview and debugging of the interface

## Important Notes

1. **API Limitations**: GitHub API has a limit of 60 requests per hour for unauthenticated requests
2. **Caching Strategy**: It is recommended to keep the 24-hour cache to avoid frequent requests
3. **Response Time**: The first request may be slower, subsequent requests will use the cache
4. **Data Update**: Statistics are updated every 24 hours

## Contributions

Welcome to submit Issues and Pull Requests!

## License

MIT License 