import { Octokit } from "octokit";
import { PRWebhookPayload } from "../utils/types.js";
import { githubBotApp, pollMergeableStatus, postComment } from "./github-service.js";

/**
 * Handles a user-requested mergeability check.
 * This function uses a dedicated module to poll for the mergeable status.
 */
export async function handleMergeabilityRequest(payload: PRWebhookPayload) {
    //metadata setup
    const octokit: Octokit = await githubBotApp.getInstallationOctokit(payload.installation.id);
    const owner: string = payload.repository.owner.login;
    const repo: string = payload.repository.name;
    const pull_number: number = payload.issue?.number ?? 0;

    console.log(`Checking mergeability for PR #${pull_number} in ${owner}/${repo}...`);

    try {
        const mergeable = await pollMergeableStatus(octokit, owner, repo, pull_number);
        let message = '';

        if (mergeable === true) {
            message = "This pull request is mergeable with no conflicts.";
        } else if (mergeable === false) {
            message = "This pull request has merge conflicts.";
            //At this point, handle merge issues
        } else {
            message = "Mergeable status remains undetermined after polling.";
        }

        // For example, post a comment back to the pull request.
        await postComment(octokit, owner, repo, pull_number, message);
        console.log("Mergeability check completed and response commented.");
    } catch (error) {
        console.error("Error during mergeability check:", error);
    }
}