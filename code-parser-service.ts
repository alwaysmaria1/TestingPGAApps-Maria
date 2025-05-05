import * as espree from "espree";



/**
 * Parses the JavaScript code string using Espree and returns the AST.
 * @param code - The full source code of a file
 * @returns AST
 */
export function parseCode(code: string) {
  try {
    const ast = espree.parse(code, {
      ecmaVersion: "latest",
      sourceType: "module",
      ecmaFeatures: { jsx: true },
      loc: true,
      range: true,
    });
    return ast;
  } catch (error) {
    console.error("Error parsing code with Espree:", error);
    throw error;
  }
}

/**
 * Analyzes the AST to extract ASTMetrics.
 * @param ast - AST
 * @returns ASTMetrics
 */
export function analyzeAST(ast: any): ASTMetrics {
  let functionCount = 0;
  let totalFunctionLength = 0;
  let maxCyclomaticComplexity = 0;
  let maxNestingDepth = 0;
  let deepNestingCount = 0;
  let classCount = 0;
  let maxMethodsPerClass = 0;
  const problematicFunctions: string[] = [];
  const problematicClasses: string[] = [];

  // Set thresholds for complexity and nesting
  const DEEP_NESTING_THRESHOLD = 5;
  const COMPLEXITY_THRESHOLD = 5;

  // Function to traverse the AST and analyze nodes
  function traverse(node: any, currentDepth: number = 0) {
    maxNestingDepth = Math.max(maxNestingDepth, currentDepth);
    if (currentDepth > DEEP_NESTING_THRESHOLD) {
      deepNestingCount++;
    }

    // FUNCTIONS: Check for function declarations and their complexity
    if (
      node.type === "FunctionDeclaration" ||
      node.type === "FunctionExpression" ||
      node.type === "ArrowFunctionExpression"
    ) {
      functionCount++;
      const functionLength = node.loc.end.line - node.loc.start.line;
      totalFunctionLength += functionLength;

      let complexity = 1;
      if (node.body) {
        traverseFunctionBody(node.body, (childNode: any) => {
          if (
            [
              "IfStatement",
              "ForStatement",
              "WhileStatement",
              "DoWhileStatement",
              "ForInStatement",
              "ForOfStatement",
              "SwitchCase",
            ].includes(childNode.type)
          ) {
            complexity++;
          }
        });
      }
      maxCyclomaticComplexity = Math.max(maxCyclomaticComplexity, complexity);

      // If complexity exceeds threshold, add to problematic functions
      if (complexity > COMPLEXITY_THRESHOLD) {
        const functionName = node.id ? node.id.name : "<anonymous>";
        problematicFunctions.push(functionName);
      }
    }

    // CLASS: Check for class declarations and methods
    if (node.type === "ClassDeclaration") {
      classCount++;
      let methodCount = 0;
      if (node.body && Array.isArray(node.body.body)) {
        for (const element of node.body.body) {
          if (element.type === "MethodDefinition") {
            methodCount++;
          }
        }
      }
      maxMethodsPerClass = Math.max(maxMethodsPerClass, methodCount);

      // If method count exceeds threshold, add to problematic classes
      if (methodCount > 10 && node.id) {
        problematicClasses.push(node.id.name);
      }
    }

    for (const key in node) {
      if (node.hasOwnProperty(key)) {
        const child = node[key];
        if (child && typeof child === "object" && child.type) {
          traverse(child, currentDepth + 1);
        } else if (Array.isArray(child)) {
          child.forEach((c) => {
            if (c && typeof c === "object" && c.type) {
              traverse(c, currentDepth + 1);
            }
          });
        }
      }
    }
  }

  // Function to traverse the function body
  function traverseFunctionBody(body: any, callback: (node: any) => void) {
    function innerTraverse(node: any) {
      callback(node);
      for (const key in node) {
        if (node.hasOwnProperty(key)) {
          const child = node[key];
          if (child && typeof child === "object" && child.type) {
            innerTraverse(child);
          } else if (Array.isArray(child)) {
            child.forEach(innerTraverse);
          }
        }
      }
    }
    innerTraverse(body);
  }

  traverse(ast);

  return {
    functionCount,
    maxCyclomaticComplexity,
    averageFunctionLength:
      functionCount > 0 ? totalFunctionLength / functionCount : 0,
    maxNestingDepth,
    deepNestingCount,
    classCount,
    maxMethodsPerClass,
    problematicFunctions,
    problematicClasses,
  };
}
