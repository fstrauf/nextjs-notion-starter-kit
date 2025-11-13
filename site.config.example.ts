import { siteConfig } from './lib/site-config'

/**
 * RECIPE BLOG CONFIGURATION
 * 
 * This is a pre-configured starter for a recipe blog.
 * Update the values below with your own details.
 * 
 * For detailed setup instructions, see RECIPE_SETUP.md
 */

export default siteConfig({
  // ========================================
  // REQUIRED CONFIGURATION
  // ========================================
  
  // Your recipe database root page ID from Notion
  // Get this by:
  // 1. Create a database page in Notion
  // 2. Copy the URL from your browser
  // 3. The last part (32 chars) is your page ID
  rootNotionPageId: '2aa54ce93c8281239538ea96996291f0', // 👈 UPDATE THIS
  
  // Basic site information
  name: 'My Recipe Blog',
  domain: 'myrecipeblog.com',
  author: 'Your Name',
  
  // ========================================
  // OPTIONAL CONFIGURATION
  // ========================================
  
  // Restrict pages to a single Notion workspace (optional)
  rootNotionSpaceId: null,
  
  // Site description for social media
  description: 'A collection of delicious recipes and cooking inspiration',
  
  // Social media profiles (used for sharing)
  twitter: 'yourhandle', // Your Twitter handle
  github: 'yourhandle', // Your GitHub username
  linkedin: 'yourprofile', // Your LinkedIn profile
  // mastodon: '#', // Optional mastodon profile URL
  // newsletter: '#', // Optional newsletter subscription URL
  // youtube: '#', // Optional youtube channel
  
  // ========================================
  // IMAGE & PERFORMANCE SETTINGS
  // ========================================
  
  // Default icon and cover for pages (can be overridden per-page in Notion)
  defaultPageIcon: null,
  defaultPageCover: null,
  defaultPageCoverPosition: 0.5,
  
  // Enable LQIP preview images for food photography
  // This creates smooth image loading with low-quality placeholders
  // Set to false if you want faster builds (skips LQIP generation)
  isPreviewImageSupportEnabled: true,
  
  // Enable Redis for caching preview images (optional, requires Redis setup)
  // Set to true and add REDIS_HOST and REDIS_PASSWORD environment variables
  isRedisEnabled: false,
  
  // ========================================
  // ADVANCED CONFIGURATION
  // ========================================
  
  // Map specific URLs to Notion page IDs (optional)
  // Use this to create custom URL paths for important pages
  // Example:
  // pageUrlOverrides: {
  //   '/about': '[NOTION_PAGE_ID]',
  //   '/contact': '[NOTION_PAGE_ID]',
  // }
  pageUrlOverrides: null,
  
  // Navigation style: 'default' uses Notion's built-in navigation
  // or 'custom' for manually defined navigation links
  navigationStyle: 'default',
  
  // Custom navigation links (only used if navigationStyle is 'custom')
  // Example:
  // navigationLinks: [
  //   { title: 'Blog', pageId: '[NOTION_PAGE_ID]' },
  //   { title: 'About', url: '/about' },
  //   { title: 'Contact', url: 'mailto:you@example.com' },
  // ]
  
  // ========================================
  // FEATURE FLAGS
  // ========================================
  
  // Enable/disable search functionality
  isSearchEnabled: true,
  
  // Enable tweet embeds within recipes
  isTweetEmbedSupportEnabled: true,
  
  // Include Notion IDs in URLs (helpful for debugging, enable in dev mode)
  includeNotionIdInUrls: false,
})
