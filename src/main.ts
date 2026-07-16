import { Octokit } from "octokit";
import { writeFileSync, appendFileSync } from "fs";
import { GithubSourceRetriever } from "./infra/github/GithubSourceRetriever.js";
import { NotionSourceRetriever } from "./infra/notion/NotionSourceRetriever.js";
import { Client } from "@notionhq/client";
import 'dotenv/config';
import { GithubPushEventMapper } from "./infra/github/GithubPushEventMapper.js";
import { GithubCreateRepoEventMapper } from "./infra/github/GithubCreateRepoEventMapper.js";
import { NotionEventMapper } from './infra/notion/NotionEventMapper.js';
import { renderCard } from "./ui/card/renderCard.js";
import { buildCardData } from "./ui/card/toCardData.js";
import { buildDashboardData } from "./ui/dashboard/toDashboardData.js";
import { renderDashboard } from "./ui/dashboard/renderDashboard.js";
import { TelegramCheker } from "./infra/telegram/TelegramChecker.js";
import type { Checker } from "./domain/Checker.js";
import { GroqSourceSynthesizer } from "./infra/groq/GroqSourceSynthesizer.js";
import { MistralSourceSynthesizer } from "./infra/mistral/MistralSourceSynthesizer.js";
import { FallbackSourceSynthesizer } from "./domain/FallbackSourceSynthesizer.js";
import type { SourceSynthesizer } from "./domain/SourceSynthesizer.js";
import type { SynthesizedDigest } from "./domain/SynthesizedDigest.js";
import { buildPost } from "./ui/post/buildPost.js";
import { LinkedInSender } from "./infra/linkedin/LinkedInSender.js";
import type { Sender } from "./domain/Sender.js";

const today = new Date();
const weekLabel = `Week of ${today.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;

function isoWeekVersion(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((d.getTime() - yearStart.getTime()) / 86_400_000) + 1) / 7);
  return `v${d.getUTCFullYear()}.W${String(week).padStart(2, '0')}`;
}

const version = isoWeekVersion(today);

const userName = process.env.GITHUB_USERNAME || '';
const octokit = new Octokit({auth: process.env.GITHUB_TOKEN});
const mappers = [new GithubPushEventMapper(), new GithubCreateRepoEventMapper];
const githubRetriever = new GithubSourceRetriever(octokit, userName, mappers);

const notion = new Client({ auth: process.env.NOTION_API_KEY! });
const notionRetriever = new NotionSourceRetriever(notion, process.env.NOTION_DATABASE_ID!, [new NotionEventMapper()]);


const [ghActivities, notionActivities] = await Promise.all([
  githubRetriever.retrieve(today),
  notionRetriever.retrieve(today)
]);

const activities = [...ghActivities, ...notionActivities];

const synthesizer: SourceSynthesizer = new FallbackSourceSynthesizer([
  new MistralSourceSynthesizer(process.env.MISTRAL_API_KEY!),
  new GroqSourceSynthesizer(process.env.GROQ_API_KEY!)
]);

let digest: SynthesizedDigest | undefined;
try {
  digest = await synthesizer.synthesize(activities, weekLabel);
} catch (error) {
  console.log('AI digest unavailable, continuing without it:', error);
}

const cardData = buildCardData(activities, { week: weekLabel, version });
const png = await renderCard(cardData);

writeFileSync('docs/card.png', png);
console.log('Card generated at docs/card.png');

const dashboardData = buildDashboardData(activities, { week: weekLabel, ...(digest ? { digest } : {}) });
const dashboardHtml = renderDashboard(dashboardData);

writeFileSync('docs/index.html', dashboardHtml);
console.log('Dashboard generated at docs/index.html');

const dashboardUrl = process.env.DASHBOARD_URL || `https://${userName.toLowerCase()}.github.io/weekly-changelog/`;

const checker: Checker = new TelegramCheker(
  process.env.TELEGRAM_BOT_TOKEN!,
  process.env.TELEGRAM_CHAT_ID!
);

const approved = await checker.sendForApproval(
  'docs/card.png',
  `Weekly Changelog - ${weekLabel}\n\n${dashboardUrl}\n\n¿Publicar?`
);

if (approved) {
  console.log('approved ✅ — publishing...');

  // Signal the CI workflow to deploy the freshly generated docs/ to GitHub Pages.
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, 'published=true\n');

  const post = buildPost({
    week: weekLabel,
    dashboardUrl,
    imagePath: 'docs/card.png',
    ...(digest ? { digest } : {})
  });

  const sender: Sender = new LinkedInSender(
    process.env.LINKEDIN_ACCESS_TOKEN!,
    process.env.LINKEDIN_AUTHOR_URN!
  );

  try {
    await sender.publish(post);
    console.log('Published to LinkedIn ✅');
  } catch (error) {
    console.log('LinkedIn publish failed:', error);
  }
} else {
  console.log('rejected ❌ — not published');
}