import OpenAI from "openai";

export interface ChangedFileData {
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  patch?: string;
  changes?: number;
  previousContent?: string;
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * CommitLogicAgent
 * Generates a summary of commit metadata from the changed files,
 * and explains the logic behind what happened in the commit.
 */
export class CommitLogicAgent {
  /**
   * Provides an explanation of the commit's logic by sending the summary to OpenAI.
   */
  async explainCommitLogic(
    changedFilesData: ChangedFileData[]
  ): Promise<string> {
    // Generate the commit summary first.
    const patchSummary = changedFilesData
      .map((file) => {
        const filename = file.filename || "Unknown file";
        const patch = file.patch ? file.patch : "No patch provided.";
        return `In file "${filename}":\n${patch}`;
      })
      .join("\n\n");

    // Prepare prompts for OpenAI.
    const systemPrompt = `
You are an expert commit analyzer.
Based on the following patch details, explain in detail the logic behind the code changes.
Describe what happened in the commit and why these changes might have been made with a focus on the logical reasons rather than code quality.
    `;
    const userPrompt = `Commit Patch Details:
${patchSummary}

Please explain the logic behind these changes. In terms of format I want you to provide a single short paragraph discussing the changes.
Make the paragraph as short as possible while getting all the important information through. Similar to how a junior engineer would explain their changes to a senior engineer.`;

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 300,
        temperature: 0.7,
      });
      return (
        completion.choices[0]?.message?.content?.trim() ||
        "No explanation generated."
      );
    } catch (error) {
      console.error("Error in explainCommitLogic:", error);
      return "Error generating commit logic explanation.";
    }
  }
}

/**
 * CodeStyleAgent
 * Provides a summary of how good a the code style is in a commit,
 * focuses on the code smells and poor practices.
 */
export class CodeStyleAgent {
  async analyzeCodeStyle(rawCode: string, astReport: string): Promise<string> {
    const systemPrompt = `
You are a code style expert.
Analyze the following code for formatting, naming conventions, and adherence to best practices.
In addition, consider the AST report to understand the code structure.
Provide concise, actionable feedback.
    `;
    const userPrompt = `Review the code below and provide your observations on its style.

--- Raw Code ---
${rawCode}

--- AST Report ---
${astReport}
`;
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 300,
        temperature: 0.7,
      });
      return (
        completion.choices[0]?.message?.content?.trim() ||
        "No code style feedback generated."
      );
    } catch (error) {
      console.error("Error in CodeStyleAgent:", error);
      return "Error generating code style feedback.";
    }
  }
}

/**
 * StaticAnalysisAgent
 * Reviews code for potential bugs, logical errors, and vulnerabilities.
 * Now accepts both raw code and the AST report for a deeper analysis.
 */
export class StaticAnalysisAgent {
  async performStaticAnalysis(
    rawCode: string,
    astReport: string
  ): Promise<string> {
    const systemPrompt = `
You are a code analysis expert.
Identify potential bugs, logical errors, and vulnerabilities in the code.
Use both the raw code and the AST report to provide a comprehensive analysis.
Provide actionable recommendations.
    `;
    const userPrompt = `Analyze the following code and its AST report:

--- Raw Code ---
${rawCode}

--- AST Report ---
${astReport}
`;
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 300,
        temperature: 0.7,
      });
      return (
        completion.choices[0]?.message?.content?.trim() ||
        "No static analysis feedback generated."
      );
    } catch (error) {
      console.error("Error in StaticAnalysisAgent:", error);
      return "Error generating static analysis feedback.";
    }
  }
}

