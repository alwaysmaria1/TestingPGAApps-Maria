import { GoogleGenAI } from "@google/genai";
import { ChangedFileData } from "../utils/types.js";
import MCPClient from "./mcp-client.js";
/**
 * GraphitiAgent class handles repository documentation analysis using a graph database.
 * It integrates with Graphiti through MCP client to analyze code and documentation relationships.
 */
export class GraphitiAgent {
    private mcpClient: MCPClient;
    private isInitialized: boolean = false;
    private groupId: string;
    private llm: GoogleGenAI;

    constructor(groupId?: string) {
        this.mcpClient = new MCPClient();
        this.groupId = groupId || "";
        this.llm = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    }
    /**
     * Initializes the Graphiti Agent by connecting to the MCP server.
     * @param groupId - Optional group ID to use for the connection
     * @returns Promise that resolves when connected
     */
    async initialize(): Promise<void> {
        try {
            await this.mcpClient.connectToServer();
            this.isInitialized = true;
            console.log("GraphitiAgent initialized successfully");
        } catch (error) {
            console.error("Failed to initialize GraphitiAgent:", error);
            throw new Error("GraphitiAgent initialization failed");
        }
    }

    /**
     * Handles analysis of code documentation for a pull request.
     * 
     * @param payload - Pull request webhook payload
     * @returns Promise resolving to a documentation analysis report
     */
    async analyzePRDocumentation(
        owner: string,
        repo: string,
        changedFilesData: ChangedFileData[]
    ): Promise<string> {

        const groupId = `${owner}/${repo}`

        try {
            // Initialize with repo-specific group ID
            this.groupId = groupId;
            this.initialize();

            // Only process relevant files for documentation analysis
            const docsAndCodeFiles = this.filterRelevantFiles(changedFilesData);

            if (docsAndCodeFiles.length === 0) {
                return "No documentation-related files found in this PR.";
            }

            // Send CODECOACH documentation to graphiti to build graph
            await this.buildGraph(docsAndCodeFiles);

            return "Your documentation is being ingested... Please give ~5 min for Graphiti to finish"
        } catch (error) {
            console.error("Error in analyzePRDocumentation:", error);
            return "Failed to analyze documentation. The graph database service might be unavailable.";
        }
    }

    /**
     * Filters files to only include documentation and related code files.
     * 
     * @param files - List of changed files
     * @returns Filtered list of documentation and related code files
     */
    private filterRelevantFiles(files: ChangedFileData[]): ChangedFileData[] {
        return files.filter(file => {
            const filename = file.filename.toLowerCase();

            // Match CodeCoach documentation files
            if (filename.endsWith('.md') &&
                (filename.includes('codecoach') || filename.includes('code-coach'))) {
                return true;
            }
            return false;
        });
    }
    /**
     * Builds a knowledge graph from CodeCoach documentation files.
     * 
     * @param files - CodeCoach documentation files
     * @param owner - Repository owner
     * @param repo - Repository name
     * @returns Promise resolving to graph build results
     */
    async buildGraph(
        files: ChangedFileData[],
    ): Promise<any> {
        const results: any[] = [];

        //right now: this only sifts through one codecoach.md file, but this allows for flexibility
        for (const file of files) {
            const fileContent = file.newContent ?? file.previousContent;
            if (!fileContent) continue;

            if (file.fileStatus === 'added' || file.fileStatus === 'modified') {
                console.log(`Processing CodeCoach documentation: ${file.filename}`);

                try {
                    // 1) Generate an array of MCP commands for this file
                    const mcpCommands = await this.createMCPQueries(fileContent);
                    //DEBUGGING: SEE THE ARRAY OF MCP CLIENT QUERIES
                    //console.log(mcpCommands)

                    // 2) Execute each command via the MCP client
                    for (const cmd of mcpCommands) {
                        const res = await this.mcpClient.processQuery(cmd);
                        results.push({
                            path: file.filename,
                            status: file.fileStatus,
                            command: cmd,
                            result: res.trim(),
                        });

                        // small pause to avoid rate‐limit or overloading the LLM
                        await new Promise((r) => setTimeout(r, 200));
                    }
                } catch (err) {
                    console.error(`Error processing ${file.filename}:`, err);
                    results.push({
                        path: file.filename,
                        status: file.fileStatus,
                        error: (err as Error).message,
                    });
                }
            }
        }

        return {
            success: true,
            processedFiles: results,
        };
    }