import { Octokit } from "octokit";
import { writeFileSync } from "fs";
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

const today = new Date();
const weekLabel = `Week of ${today.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;

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

const cardData = buildCardData(activities, { week: weekLabel });
const png = await renderCard(cardData);

writeFileSync('docs/card.png', png);
console.log('Card generated at docs/card.png');

const dashboardData = buildDashboardData(activities, { week: weekLabel });
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
  `Weekly Changelog - ${weekLabel}`
);

if (approved) {
  console.log('approved ✅ — publishing...');

} else {
  console.log('rejected ❌ — not published');
}

await checker.sendForApproval('docs/card.png', `Weekly Changelog - ${weekLabel}\n\n${dashboardUrl}\n\n¿Publicar?`)