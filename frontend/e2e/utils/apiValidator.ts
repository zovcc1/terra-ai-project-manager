import { Page } from "@playwright/test";
import { ZodSchema } from "zod";
import { apiErrors } from "./markdownReporter";

interface EndpointSchema {
  pathPattern: RegExp;
  method: string;
  requestSchema?: ZodSchema<any>;
  responseSchema?: ZodSchema<any>;
  schemaName: string; // Used for reporting
}

export class ApiValidator {
  private schemas: EndpointSchema[] = [];

  constructor(private page: Page) {}

  registerSchema(config: EndpointSchema) {
    this.schemas.push(config);
  }

  async startListening() {
    this.page.on("request", async (request) => {
      const url = request.url();
      const method = request.method();

      const matchedConfig = this.schemas.find(
        (s) => s.pathPattern.test(url) && s.method === method,
      );

      if (matchedConfig && matchedConfig.requestSchema) {
        const postData = request.postData();
        if (postData) {
          try {
            const json = JSON.parse(postData);
            const result = matchedConfig.requestSchema.safeParse(json);
            if (!result.success) {
              apiErrors.push({
                endpoint: url,
                method,
                type: "Request",
                expectedSchemaName: matchedConfig.schemaName + "Request",
                actualPayload: json,
                zodError: result.error.format(),
              });
              console.error(`[Validation Failed] Request schema mismatch for ${method} ${url}`);
            }
          } catch (e) {
            console.error(`Failed to parse request JSON for ${url}`);
          }
        }
      }
    });

    this.page.on("response", async (response) => {
      const request = response.request();
      const url = request.url();
      const method = request.method();

      // Only validate OK responses (or you could adjust to validate error schemas too)
      if (response.ok()) {
        const matchedConfig = this.schemas.find(
          (s) => s.pathPattern.test(url) && s.method === method,
        );

        if (matchedConfig && matchedConfig.responseSchema) {
          try {
            const json = await response.json();
            const result = matchedConfig.responseSchema.safeParse(json);
            if (!result.success) {
              apiErrors.push({
                endpoint: url,
                method,
                type: "Response",
                expectedSchemaName: matchedConfig.schemaName + "Response",
                actualPayload: json,
                zodError: result.error.format(),
              });
              console.error(`[Validation Failed] Response schema mismatch for ${method} ${url}`);
            }
          } catch (e) {
            console.error(`Failed to parse response JSON for ${url}`);
          }
        }
      }
    });
  }
}
