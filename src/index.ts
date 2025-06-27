// Import Iconify icons
import javascriptIcon from '@iconify/icons-vscode-icons/file-type-js-official';
import typescriptIcon from '@iconify/icons-vscode-icons/file-type-typescript-official';
import pythonIcon from '@iconify/icons-vscode-icons/file-type-python';
import javaIcon from '@iconify/icons-vscode-icons/file-type-java';
import goIcon from '@iconify/icons-vscode-icons/file-type-go';
import rustIcon from '@iconify/icons-vscode-icons/file-type-rust';
import cppIcon from '@iconify/icons-vscode-icons/file-type-cpp3';
import cIcon from '@iconify/icons-vscode-icons/file-type-c3';
import htmlIcon from '@iconify/icons-vscode-icons/file-type-html';
import cssIcon from '@iconify/icons-vscode-icons/file-type-css';
import vueIcon from '@iconify/icons-vscode-icons/file-type-vue';
import reactIcon from '@iconify/icons-vscode-icons/file-type-reactjs';
import phpIcon from '@iconify/icons-vscode-icons/file-type-php3';
import rubyIcon from '@iconify/icons-vscode-icons/file-type-ruby';
import swiftIcon from '@iconify/icons-vscode-icons/file-type-swift';
import kotlinIcon from '@iconify/icons-vscode-icons/file-type-kotlin';
import folderOpenedIcon from '@iconify/icons-vscode-icons/default-folder-opened';
import gitIcon from '@iconify/icons-vscode-icons/file-type-git';

interface GitHubStats {
	topLanguages: Array<{ name: string; percentage: number }>;
	totalStars: number;
	recentCommits: number;
	lastUpdated: string;
}

interface GitHubRepo {
	name: string;
	language: string;
	stargazers_count: number;
}

interface GitHubCommit {
	commit: {
		author: {
			date: string;
		};
	};
}

// In-memory cache
const cache = new Map<string, { data: GitHubStats; expiry: number }>();

// Mock data
const MOCK_DATA: GitHubStats = {
	topLanguages: [
		{ name: 'TypeScript', percentage: 35 },
		{ name: 'JavaScript', percentage: 28 },
		{ name: 'Python', percentage: 20 }
	],
	totalStars: 1337,
	recentCommits: 42,
	lastUpdated: new Date().toISOString(),
};

// Check if it's a local development environment
function isLocalDevelopment(request: Request): boolean {
	const url = new URL(request.url);
	return url.hostname === 'localhost' || url.hostname === '127.0.0.1' || url.hostname.includes('localhost');
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const url = new URL(request.url);
		const username = url.searchParams.get('user');
		
		if (!username) {
			return new Response('Please provide a GitHub username: ?user=username', { status: 400 });
		}

		try {
			let stats: GitHubStats;
			
			// Use mock data in local development environment
			if (isLocalDevelopment(request)) {
				console.log('🚀 Using Mock data for local development');
				stats = {
					...MOCK_DATA,
					lastUpdated: new Date().toISOString(),
				};
			} else {
				// Use real data and cache in production environment
				const cacheKey = `github-stats-${username}`;
				const cached = cache.get(cacheKey);
				const now = Date.now();
				
				if (cached && now < cached.expiry) {
					stats = cached.data;
				} else {
					stats = await fetchGitHubStats(username);
					// Cache for 24 hours
					cache.set(cacheKey, {
						data: stats,
						expiry: now + 24 * 60 * 60 * 1000
					});
				}
			}

			const svg = generateSVG(stats, username);
			
			return new Response(svg, {
				headers: {
					'Content-Type': 'image/svg+xml',
					'Cache-Control': 'public, max-age=3600',
					'Access-Control-Allow-Origin': '*',
				},
			});
		} catch (error) {
			console.error('Error:', error);
			return new Response('Error fetching GitHub data', { status: 500 });
		}
	},
} satisfies ExportedHandler<Env>;

async function fetchGitHubStats(username: string): Promise<GitHubStats> {
	const headers: Record<string, string> = {
		'User-Agent': 'GitHub-Profile-Widget',
	};

	// Get all user repositories
	const reposResponse = await fetch(`https://api.github.com/users/${username}/repos?per_page=100&sort=updated`, {
		headers,
	});
	
	if (!reposResponse.ok) {
		throw new Error(`GitHub API error: ${reposResponse.status}`);
	}
	
	const repos: GitHubRepo[] = await reposResponse.json();
	
	// Calculate language statistics and total stars
	const languageStats: Record<string, number> = {};
	let totalStars = 0;
	
	for (const repo of repos) {
		if (repo.language) {
			languageStats[repo.language] = (languageStats[repo.language] || 0) + 1;
		}
		totalStars += repo.stargazers_count;
	}
	
	// Get commits from the last month
	const oneMonthAgo = new Date();
	oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
	const since = oneMonthAgo.toISOString();
	
	let recentCommits = 0;
	
	// Get commit history for recently active repositories
	const activeRepos = repos.slice(0, 5); // Only check the 5 most recently updated repositories to reduce API calls
	
	for (const repo of activeRepos) {
		try {
			const commitsResponse = await fetch(
				`https://api.github.com/repos/${username}/${repo.name}/commits?author=${username}&since=${since}&per_page=50`,
				{ headers }
			);
			
			if (commitsResponse.ok) {
				const commits: GitHubCommit[] = await commitsResponse.json();
				recentCommits += commits.length;
			}
		} catch (error) {
			// Skip repositories with errors
			console.error(`Error fetching commits for repository ${repo.name}:`, error);
		}
	}
	
	// Sort language statistics and take the top three
	const topLanguages = Object.entries(languageStats)
		.sort((a, b) => b[1] - a[1])
		.slice(0, 3)
		.map(([name, count]) => ({
			name,
			percentage: Math.round((count / repos.length) * 100),
		}));
	
	return {
		topLanguages,
		totalStars,
		recentCommits,
		lastUpdated: new Date().toISOString(),
	};
}

function generateSVG(stats: GitHubStats, username: string): string {
	const width = 400;
	const height = 280;
	const padding = 20;
	const contentWidth = width - padding * 2;
	const contentHeight = height - padding * 2;
	
	// Language icon mapping
	const languageIcons: Record<string, any> = {
		'JavaScript': javascriptIcon,
		'TypeScript': typescriptIcon,
		'Python': pythonIcon,
		'Java': javaIcon,
		'Go': goIcon,
		'Rust': rustIcon,
		'C++': cppIcon,
		'C': cIcon,
		'HTML': htmlIcon,
		'CSS': cssIcon,
		'Vue': vueIcon,
		'React': reactIcon,
		'PHP': phpIcon,
		'Ruby': rubyIcon,
		'Swift': swiftIcon,
		'Kotlin': kotlinIcon,
	};
	
	// Get language icon SVG path
	const getLanguageIcon = (lang: string, x: number, y: number): string => {
		const icon = languageIcons[lang];
		if (!icon || !icon.body) {
			return `<circle cx="${x + 8}" cy="${y}" r="6" fill="#666666"/>`;
		}
		
		return `<g transform="translate(${x}, ${y - 8}) scale(0.8)">
			<svg width="16" height="16" viewBox="0 0 ${icon.width || 24} ${icon.height || 24}">
				${icon.body}
			</svg>
		</g>`;
	};

	// Get folder icon
	const getFolderIcon = (x: number, y: number): string => {
		if (!folderOpenedIcon || !folderOpenedIcon.body) {
			return `<circle cx="${x + 8}" cy="${y}" r="6" fill="#666666"/>`;
		}
		
		return `<g transform="translate(${x}, ${y - 8}) scale(0.8)">
			<svg width="22" height="22" viewBox="0 0 ${folderOpenedIcon.width || 24} ${folderOpenedIcon.height || 24}">
				${folderOpenedIcon.body}
			</svg>
		</g>`;
	};

	// Get git icon
	const getGitIcon = (x: number, y: number): string => {
		if (!gitIcon || !gitIcon.body) {
			return `<circle cx="${x + 10}" cy="${y}" r="8" fill="#666666"/>`;
		}
		
		return `<g transform="translate(${x}, ${y - 10}) scale(1.2)">
			<svg width="15" height="15" viewBox="0 0 ${gitIcon.width || 24} ${gitIcon.height || 24}">
				${gitIcon.body}
			</svg>
		</g>`;
	};
	
	return `
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
	<defs>
		<style>
			.container {
				font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
				font-size: 12px;
				fill: #e6e6e6;
				shape-rendering: crispEdges;
				text-rendering: optimizeLegibility;
			}
			.title {
				font-size: 16px;
				font-weight: bold;
				fill: #ffffff;
				text-rendering: optimizeLegibility;
			}
			.username {
				font-size: 14px;
				fill: #cccccc;
				text-rendering: optimizeLegibility;
			}
			.section-title {
				font-size: 13px;
				font-weight: bold;
				fill: #ffffff;
				text-rendering: optimizeLegibility;
			}
			.value {
				font-size: 14px;
				font-weight: bold;
				fill: #ffffff;
				text-rendering: optimizeLegibility;
			}
			.percentage {
				font-size: 11px;
				fill: #cccccc;
				text-rendering: optimizeLegibility;
			}
			.border-line {
				stroke: #444444;
				stroke-width: 1;
				fill: none;
				shape-rendering: crispEdges;
			}
			.bar {
				fill: #ffffff;
				shape-rendering: crispEdges;
			}
			.bar-bg {
				fill: #333333;
				shape-rendering: crispEdges;
			}
			.lang-icon {
				fill: currentColor;
				opacity: 0.9;
				shape-rendering: optimizeQuality;
			}
			.update-time {
				font-size: 10px;
				fill: #666666;
				text-rendering: optimizeLegibility;
			}
		</style>
	</defs>
	
	<!-- Background -->
	<rect width="${width}" height="${height}" fill="#1a1a1a" rx="8"/>
	
	<!-- Main border -->
	<rect x="${padding}" y="${padding}" width="${contentWidth}" height="${contentHeight - 10}" 
			class="border-line" rx="6" stroke-dasharray="2,2"/>
	
	<!-- Title area -->
	<text x="${width / 2}" y="45" class="title" text-anchor="middle">GitHub Profile Stats</text>
	<text x="${width / 2}" y="65" class="username" text-anchor="middle">${username}</text>
	
	<!-- Separator line 1 -->
	<line x1="${padding + 10}" y1="80" x2="${width - padding - 10}" y2="80" class="border-line"/>
	
	<!-- Language statistics area -->
	<g class="lang-icon">
		${getFolderIcon(padding + 15, 95)}
	</g>
	<text x="${padding + 40}" y="100" class="section-title">Top Languages</text>
	
	${stats.topLanguages.map((lang, i) => {
		const yPos = 120 + i * 20;
		const barX = padding + 200;
		const barWidth = 120;
		const barHeight = 8;
		
		return `
		<!-- Language icon -->
		<g class="lang-icon">
			${getLanguageIcon(lang.name, padding + 15, yPos)}
		</g>
		
		<!-- Language name -->
		<text x="${padding + 40}" y="${yPos + 3}" class="container">${lang.name}</text>
		
		<!-- Progress bar background -->
		<rect x="${barX}" y="${yPos - 3}" width="${barWidth}" height="${barHeight}" 
				class="bar-bg" rx="4"/>
		
		<!-- Progress bar -->
		<rect x="${barX}" y="${yPos - 3}" width="${(lang.percentage / 100) * barWidth}" height="${barHeight}" 
				class="bar" rx="4"/>
		
		<!-- Percentage -->
		<text x="${barX + barWidth + 10}" y="${yPos + 3}" class="percentage">${lang.percentage}%</text>`;
	}).join('')}
	
	<!-- Separator line 2 -->
	<line x1="${padding + 10}" y1="${135 + stats.topLanguages.length * 20}" 
			x2="${width - padding - 10}" y2="${135 + stats.topLanguages.length * 20}" class="border-line"/>
	
	<!-- Stars statistics -->
	<text x="${padding + 15}" y="${155 + stats.topLanguages.length * 20}" class="section-title">⭐ Total Stars</text>
	<text x="${padding + 15}" y="${175 + stats.topLanguages.length * 20}" class="value">${stats.totalStars.toLocaleString()}</text>
	
	<!-- Commits statistics -->
	<g class="lang-icon">
		${getGitIcon(padding + 200, 152 + stats.topLanguages.length * 20)}
	</g>
	<text x="${padding + 222}" y="${155 + stats.topLanguages.length * 20}" class="section-title">Recent Commits</text>
	<text x="${padding + 200}" y="${175 + stats.topLanguages.length * 20}" class="value">${stats.recentCommits}</text>
	
	<!-- Update time - below border -->
	<text x="${width / 2}" y="${height - 12}" class="update-time" text-anchor="middle">
		Updated ${new Date(stats.lastUpdated).toLocaleDateString()}
	</text>
</svg>`.trim();
}
