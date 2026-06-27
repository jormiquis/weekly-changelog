import { Octokit } from "octokit";
import { GithubSourceRetriever } from "./infra/GithubSourceRetriever.js";

const userName = process.env.GITHUB_USERNAME || 'jorMiquis';
const octokit = new Octokit()
const retriever = new GithubSourceRetriever(octokit, userName)

const activities = await retriever.retrieve(new Date());
console.log(JSON.stringify(activities, null, 2));