# CodeCoach Documentation
 
 Welcome to **CodeCoach**, your per‑repo guide for architecture decisions, style rules, and best practices. Treat this as your “single source of truth” for anything non‑code.
 
 ---
 
 ## 1. Project Overview

**DesignSage** is a design ops tool that

-   🎨 Parses Figma tokens + design system docs into a structured store
    
-   🤖 Offers AI‑backed suggestions for consistency and usability
    
-   🔁 Keeps up with evolving components via versioned snapshots
    

----------

## 2. Architecture Snapshot

[ Figma Plugin ] → [ DesignSage Sync Service ] → [ Postgres Metadata Store ] ↓ [ AI Advisor ]

yaml Copy Edit

-   **Sync** runs on Node.js 20+, uses Cheerio for parsing + metadata extraction.
    
-   **Postgres** stores component metadata: tables = components, props, styles.
    
-   **Advisor** reads this data to guide design decisions with context-aware prompts.
    

----------

## 3. File Structure

/ ├── sync_designs.ts # main sync script ├── designsage.md # this file ├── package.json # npm dependencies └── README.md # project overview + setup

markdown  
Copy  
Edit

----------

## 4. Coding Standards

-   **TypeScript**
    
    -   Use **Prettier** with default settings.
        
    -   Enforce strict mode; use interfaces/types generously.
        
-   **Markdown**
    
    -   Use ATX headings (`## Title`).
        
    -   Soft wrap lines at ~100 characters.
        
-   **Git**
    
    -   Use Conventional Commits:
        
        -   `chore: …`, `feat: …`, `fix: …`, `style: …`
            

----------

## 5. Syncing New Snapshots

1.  Update the latest design tokens or Figma notes.
    
2.  Run:
    
    bash
    
    CopyEdit
    
    `node sync_designs.ts <team/project> designsage.md`
