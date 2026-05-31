import { Reporter, TestCase, TestResult, FullResult } from "@playwright/test/reporter";
import fs from "fs";
import path from "path";

export interface ApiValidationError {
  endpoint: string;
  method: string;
  type: "Request" | "Response";
  expectedSchemaName: string;
  actualPayload: any;
  zodError: any;
}

// Global store for API validation errors to be collected during tests
export const apiErrors: ApiValidationError[] = [];

class MarkdownReporter implements Reporter {
  private reportPath: string;

  constructor() {
    this.reportPath = path.join(process.cwd(), "ui_api_test_report.md");
  }

  onBegin() {
    // Clear previous report
    if (fs.existsSync(this.reportPath)) {
      fs.unlinkSync(this.reportPath);
    }
    // Clear in-memory errors
    apiErrors.length = 0;
  }

  onEnd(result: FullResult) {
    let content = `# UI and API Automated Testing Report\n\n`;
    content += `**Test Run Status:** ${result.status}\n\n`;

    if (apiErrors.length === 0) {
      content += `> [!NOTE]\n> All UI interactions successfully triggered correct API requests and received expected responses. No schema mismatches found.\n`;
    } else {
      content += `> [!WARNING]\n> Found ${apiErrors.length} API Schema mismatches during UI testing.\n\n`;
      content += `## Detected Errors\n\n`;

      apiErrors.forEach((error, index) => {
        content += `### Error #${index + 1}: ${error.method} ${error.endpoint}\n`;
        content += `- **Validation Type:** ${error.type} Body\n`;
        content += `- **Expected Schema:** \`${error.expectedSchemaName}\`\n\n`;

        content += `#### Zod Validation Error\n\`\`\`json\n${JSON.stringify(error.zodError, null, 2)}\n\`\`\`\n\n`;
        content += `#### Actual Payload Sent/Received\n\`\`\`json\n${JSON.stringify(error.actualPayload, null, 2)}\n\`\`\`\n\n`;
        content += `---\n`;
      });
    }

    fs.writeFileSync(this.reportPath, content, "utf8");
    console.log(`Markdown report generated at ${this.reportPath}`);
  }
}

export default MarkdownReporter;
