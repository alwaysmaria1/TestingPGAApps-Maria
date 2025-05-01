import { Octokit } from "octokit";
import { PRWebhookPayload } from "../utils/types.js";
import { CodeReviewAgent, FollowUpAgent } from "./ai-service.js";
import { aggregateASTReport, fetchChangedFilesData } from "./file-service.js";
import { githubBotApp, postComment, postInRepoFeedback } from "./github-service.js"
import { handleDocumentationAnalysisCommand } from "../graphiti/graphiti-event-handler.js";

/**
 * Handles a pull request event by fetching changed file data,
 * aggregating full file contents and their AST reports, preparing an AI prompt,
 * and posting AI-generated feedback as a comment on the PR.
 * @param payload - The pull request webhook payload.
 */
export async function handlePullRequestEvent(
  payload: PRWebhookPayload
): Promise<void> {
  const octokit: Octokit = await githubBotApp.getInstallationOctokit(payload.installation.id);
  const owner: string = payload.repository.owner.login;
  const repo: string = payload.repository.name;
  const pull_number: number = payload.pull_request?.number ?? 0;
  const branch: string = payload.pull_request?.head.ref ?? "COULD NOT EXTRACT";

  try {
    // Retrieve changed files data from the pull request.
    const changedFilesData = await fetchChangedFilesData(octokit, owner, repo, pull_number);

    // Aggregate raw code and AST report from changed files.
    const { rawCode, astReport } = await aggregateASTReport(octokit, owner, repo, changedFilesData);

    const reviewAgent = new CodeReviewAgent();
    let feedback: string = "";
    try {
      feedback = await reviewAgent.generateCommitReview(changedFilesData, rawCode, astReport);
      //GRAPHITI AGENT !!
      await handleDocumentationAnalysisCommand(payload);
    } catch (error) {
      // Log the error or handle it as needed.
    }

    // Post the generated feedback as a comment on the pull request.
    let typeOfFeedback = "pull_request"
    await postComment(octokit, owner, repo, pull_number, feedback);
    console.log(`Posted feedback comment on PR #${pull_number}`);
    console.log('Branch that we are trying to push feedback to: ', branch)
    await postInRepoFeedback(octokit, owner, repo, feedback, branch, typeOfFeedback)
    console.log('Posted feedback into Repo')
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error(`Error handling PR event: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Handles a pull request comment event by responding to the user's comment
 * with an AI-generated response that takes into account the context of the PR.
 * @param payload - The pull request comment webhook payload.
 */
export async function handlePullRequestCommentEvent(
  payload: PRWebhookPayload
): Promise<void> {
  console.log("Handling a pull request comment event.");
  const octokit: Octokit = await githubBotApp.getInstallationOctokit(payload.installation.id);
  const owner: string = payload.repository.owner.login;
  const repo: string = payload.repository.name;
  const pull_number: number = payload.issue?.number ?? 0;
  const userComment: string = payload.comment?.body ?? "";
  const branch: string = payload.refs;

  try {

    // Check if this is a summarize request
    if (userComment.toLowerCase().includes('@pga-github-app #summarize')) {
      await generateSuggestionSummary(octokit, owner, repo, pull_number);
      return;
    }

    // Retrieve pull request details and context.
    const { data: pullRequest } = await octokit.rest.pulls.get({
      owner,
      repo,
      pull_number,
    });
    const { data: comments } = await octokit.rest.issues.listComments({
      owner,
      repo,
      issue_number: pull_number,
    });
    const changedFilesData = await fetchChangedFilesData(octokit, owner, repo, pull_number);

    // Retrieve previous version of changed files using the PR's base ref.
    //const baseRef = pullRequest.base.sha; // or pullRequest.base.ref
    //const previousFilesData = await getAllMergedFilesContent(octokit,owner,repo, changedFilesData);

    // Aggregate raw code and AST report from changed files.
    const { rawCode, astReport } = await aggregateASTReport(octokit, owner, repo, changedFilesData);

    // Format previous comments for context.
    const previousComments = comments
      .slice(-30) // Include only the last 30 comments for brevity.
      .map((comment) => {
        const isBot = comment.user?.login === "pga-github-app[bot]";
        const prefix = isBot ? "[BOT RESPONSE]" : "[USER]";
        const username = comment.user?.login || "unknown";
        const body = comment.body?.substring(0, 500) || "";
        const ellipsis = comment.body && comment.body.length > 500 ? "..." : "";
        return `${prefix} ${username}: ${body}${ellipsis}`;
      })
      .join("\n\n");

    // Get AI-generated follow-up response.
    const followUpAgent = new FollowUpAgent();
    const followUpResponse = await followUpAgent.generateFollowUpResponse(
      pullRequest,
      userComment,
      previousComments,
      //previousFilesData,
      changedFilesData,
      rawCode,
      astReport
    );

    // Post the generated follow-up response as a comment.
    await postComment(octokit, owner, repo, pull_number, followUpResponse);
    console.log(`Posted follow-up comment on PR #${pull_number}`);
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error(`Error handling PR comment event: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Generates a summary of all suggestions made by the bot in a pull request.
 * @param octokit - Authenticated Octokit instance.
 * @param owner - Repository owner.
 * @param repo - Repository name.
 * @param pull_number - Pull request number.
 */
async function generateSuggestionSummary(
  octokit: Octokit,
  owner: string,
  repo: string,
  pull_number: number
): Promise<void> {
  console.log(`Generating suggestion summary for PR #${pull_number}`);

  // Get all comments on the PR
  const { data: comments } = await octokit.rest.issues.listComments({
    owner,
    repo,
    issue_number: pull_number,
    per_page: 100 // Increase if needed
  });



  // console.log(`Found ${comments.length} comments on PR #${pull_number}`);
  for (const comment of comments) {
    console.log(comment.body);
  }

  // Filter for bot comments only
  const botComments = comments.filter(comment =>
    comment.user?.login === "pga-github-app[bot]" &&
    !comment?.body?.includes('Here is a summary of all suggestions')
  );

  // console.log(`Found ${botComments.length} bot comments on PR #${pull_number}`);

  if (botComments.length === 0) {
    await postComment(octokit, owner, repo, pull_number,
      "I haven't made any suggestions on this pull request yet.");
    return;
  }

  // Extract all bot suggestions
  const allSuggestions = botComments.map(comment => comment.body).join('\n\n');

  // Get PR details for context
  const { data: pullRequest } = await octokit.rest.pulls.get({
    owner,
    repo,
    pull_number
  });

  // Create a prompt for the AI to summarize suggestions
  const prompt = `
You are an expert code reviewer assistant. I need you to analyze all the suggestions and feedback 
that have been provided on a pull request and create a concise, actionable summary.

PR TITLE: ${pullRequest.title}
PR DESCRIPTION: ${pullRequest.body || 'No description provided'}

ALL PREVIOUS SUGGESTIONS:
${allSuggestions}

Please create a summary of all the suggestions made so far, organized into the following categories:
1. Code Style Improvements
2. Potential Bugs and Logical Issues
3. Performance Considerations
4. Security Concerns (if any)
5. Most Critical Issues to Address

For each category, list the most important actionable items. Avoid repeating the same suggestion 
multiple times. Focus on concrete steps the developer can take to improve the code.
`;

  try {
    // Use the FollowUpAgent to generate the summary
    const followUpAgent = new FollowUpAgent();
    const summary = await followUpAgent.generateSuggestionSummary(prompt);

    // Post the summary as a comment
    const response = `# Here is a summary of all suggestions made on this PR

${summary}

*This summary was generated based on all my previous comments on this pull request.*`;

    await postComment(octokit, owner, repo, pull_number, response);
    console.log(`Posted suggestion summary on PR #${pull_number}`);

  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error(`Error generating suggestion summary: ${error.message}`);
      await postComment(octokit, owner, repo, pull_number,
        "I encountered an error while trying to summarize the suggestions. Please try again later.");
    }
    throw error;
  }
}
