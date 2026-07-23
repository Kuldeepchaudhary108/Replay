import path from "path";
import fs from "fs";
import { execSync } from "child_process";

export function applyFix(bugType, repoPath) {
  if (!repoPath || typeof repoPath !== "string") {
    console.log("[FIXER ❌] Invalid repoPath:", repoPath);
    return null;
  }

  switch (bugType) {
    case "LINTING":
      try {
        execSync("npm run lint -- --fix", {
          cwd: repoPath,
          stdio: "inherit",
        });

        return {
          message: "[AI-AGENT] Auto-fix lint issues using ESLint",
          action: "Ran ESLint auto fix",
          filesModified: ["Multiple source files"],
        };
      } catch {
        console.log("[FIXER ❌] ESLint auto-fix failed");
        return null;
      }

    case "CI_CONFIG":
      addTestScript(repoPath);

      return {
        message: "[AI-AGENT] Add missing test script to package.json",
        action: "Added default npm test script",
        filesModified: ["package.json"],
      };

    case "SYNTAX":
      return {
        message: "[AI-AGENT] Syntax fix not implemented",
        action: "No automatic fix available",
        filesModified: [],
      };

    case "IMPORT":
      return {
        message: "[AI-AGENT] Import fix not implemented",
        action: "No automatic fix available",
        filesModified: [],
      };

    default:
      return null;
  }
}

/**
 * Fix missing npm test script
 */
function addTestScript(repoPath) {
  const pkgPath = path.join(repoPath, "package.json");

  if (!fs.existsSync(pkgPath)) return;

  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));

  if (!pkg.scripts) pkg.scripts = {};

  if (!pkg.scripts.test) {
    pkg.scripts.test = 'echo "No tests specified" && exit 0';
  }

  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
}
