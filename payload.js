/**
 * Handles a pull request event: fetches the diff, gets GPT feedback, and posts it as a comment.
 * @param payload - The pull request webhook payload.
 */
export async function handlePullRequestEvent(
  payload: PRWebhookPayload
): Promise<void> {

  // Authenticate as the installation for the repository.
  const octokit = await app.getInstallationOctokit(payload.installation.id);
  const owner: string = payload.repository.owner.login;
  const repo: string = payload.repository.name;
  const pull_number: number = payload.pull_request.number;

  try {
    // Retrieve the diff of the pull request.
    const diffText = await fetchPullRequestDiff(octokit, owner, repo, pull_number);

    // // Get AI-generated feedback from GPT-4.
    // const feedback = await analyzeDiffWithGPT(diffText);
    const feedback = diffText + "hey this is a fake ai telling you that your code looks good!";
    // console.log('GPT-4 Feedback:', feedback);

    // Post the GPT feedback as a comment on the pull request.
    await postComment(octokit, owner, repo, pull_number, feedback);
    
    console.log(`Posted feedback comment on PR #${pull_number}`);

  } catch (error: unknown) {

    if (error instanceof Error) {
      console.error(`Error handling PR event: ${error.message}`);
    }
    throw error;
  }
}
