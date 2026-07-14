import { Octokit } from "octokit";
import { GithubSourceRetriever } from "./infra/github/GithubSourceRetriever.js";
import { NotionSourceRetriever } from "./infra/NotionSourceRetriever.js";
import { Client } from "@notionhq/client";
import 'dotenv/config'
import { GithubPushEventMapper } from "./infra/github/GithubPushEventMapper.js";
import { GithubCreateRepoEventMapper } from "./infra/github/GithubCreateRepoEventMapper.js";

const today = new Date();
const userName = process.env.GITHUB_USERNAME || 'jorMiquis';
const octokit = new Octokit({auth: process.env.GITHUB_TOKEN});
const mappers = [new GithubPushEventMapper(), new GithubCreateRepoEventMapper];
const githubRetriever = new GithubSourceRetriever(octokit, userName, mappers);

const notion = new Client({ auth: process.env.NOTION_API_KEY! });
const notionRetriever = new NotionSourceRetriever(notion, process.env.NOTION_DATABASE_ID!);


const [ghActivities, notionActivities] = await Promise.all([
  githubRetriever.retrieve(today),
  notionRetriever.retrieve(today)
]);

const activities = [...ghActivities, ...notionActivities];

console.log(JSON.stringify(activities, null, 2));