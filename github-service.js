import { App } from "octokit";
import fs from "fs";
import { config } from "../config/index.js";
// Read the private key for GitHub App authentication.
const privateKey = fs.readFileSync(config.privateKeyPath, "utf8");
// Create an instance of the GitHub App.
export const githubBotApp = new App({
    appId: config.appId,
    privateKey: privateKey,
    webhooks: {
        secret: config.webhookSecret,
    },
});
/**
 * Polls the pull request to check its mergeable status.
 * The function will continue polling until the mergeable attribute becomes non-null,
 * indicating that GitHub has finished evaluating whether the PR can be merged.
 *
 * @param octokit - Authenticated Octokit instance.
 * @param owner - Repository owner.
 * @param repo - Repository name.
 * @param pull_number - Pull request number.
 * @param pollInterval - Interval between polls in milliseconds (default: 2000ms).
 * @param timeout - Timeout period in milliseconds (default: 30000ms).
 * @returns Promise that resolves to `true` (mergeable), `false` (has conflicts), or `null` (status undetermined within timeout).
 */
export async function pollMergeableStatus(octokit, owner, repo, pull_number, pollInterval = 2000, timeout = 30000) {
    const startTime = Date.now();
    let mergeable = null;
    while (Date.now() - startTime < timeout) {
        const { data: pr } = await octokit.rest.pulls.get({
            owner,
            repo,
            pull_number,
        });
        // The mergeable attribute can be `true`, `false`, or `null`.
        mergeable = pr.mergeable;
        // If mergeable is determined (not null), break out of the loop.
        if (mergeable !== null) {
            console.log(`Mergeable status determined: ${mergeable}`);
            return mergeable;
        }
        // Wait for the specified interval before polling again.
        console.log("Mergeable status is pending; polling again...");
        await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }
    console.warn("Timeout reached while polling for mergeable status.");
    return mergeable;
}
/**
 * Posts a comment on a pull request.
 * @param octokit - Authenticated Octokit instance.
 * @param owner - Repository owner.
 * @param repo - Repository name.
 * @param issue_number - Issue or pull request number.
 * @param body - Comment body.
 */
export async function postComment(octokit, owner, repo, issue_number, body) {
    await octokit.rest.issues.createComment({
        owner,
        repo,
        issue_number,
        body,
        headers: {
            "x-github-api-version": "2022-11-28",
        },
    });
}
/**
 * Posts a comment on a pull request.
 * @param octokit - Authenticated Octokit instance.
 * @param owner - Repository owner.
 * @param repo - Repository name.
 * @param body - Comment body.
 * @param branch - Optional Branch name.
 * @param typeOfFeedback - Indicates whether the feedback is
 * for a push or a pull request.
 */
export async function postInRepoFeedback(octokit, owner, repo, body, branch, typeOfFeedback) {
    let committer = {
        name: "Code Coach",
        email: "CodeCoach@gmail.com",
    };
    let path = "code_coach_" + typeOfFeedback + ".md";
    let sha = await getFileSHA(octokit, owner, repo, path, branch);
    console.log(`Retrieved SHA for ${path}:`, sha);
    await octokit.rest.repos.createOrUpdateFileContents({
        owner,
        repo,
        path,
        branch,
        message: "Code Coach: Feedback on " + typeOfFeedback,
        content: Buffer.from(body, 'utf8').toString('base64'),
        committer,
        author: committer,
        ...(sha ? { sha } : {})
    });
}
/**
 * Retrieves the SHA for a file if it exists, or returns null.
 * @param octokit - Authenticated Octokit instance.
 * @param owner - Repository owner.
 * @param repo - Repository name.
 * @param path - File path in the repository.
 * @param branch - Branch name or ref.
 * @returns The SHA string if found, otherwise null.
 */
async function getFileSHA(octokit, owner, repo, path, branch) {
    try {
        const { data } = await octokit.rest.repos.getContent({
            owner,
            repo,
            path,
            ref: branch,
        });
        // Make sure data is a file object (and not an array, which would be for directories)
        if (!Array.isArray(data) && typeof data.sha === "string") {
            return data.sha;
        }
        return null;
    }
    catch (error) {
        // If the file does not exist, getContent will throw a 404 error.
        return null;
    }
}
