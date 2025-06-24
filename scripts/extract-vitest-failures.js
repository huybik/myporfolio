// scripts/extract-vitest-failures.js
import fs from "fs";

const inputFile = "vitest-report.json";
const outputFile = "vitest-report.json";

const data = JSON.parse(fs.readFileSync(inputFile, "utf-8"));
const failedSuites = [];

for (const suite of data.testResults) {
  const failedTests = suite.assertionResults.filter(
    (t) => t.status === "failed"
  );
  if (failedTests.length > 0) {
    failedSuites.push({
      file: suite.name,
      failures: failedTests.map((t) => ({
        title: t.title,
        fullName: t.fullName,
        failureMessages: t.failureMessages,
        status: t.status,
      })),
    });
  }
}

fs.writeFileSync(outputFile, JSON.stringify(failedSuites, null, 2));
console.log(`Exported only failures to ${outputFile}`);
