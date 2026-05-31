import "@testing-library/jest-dom";
import { afterEach, beforeAll, afterAll } from "vitest";
import { cleanup } from "@testing-library/react";
import { server } from "../mocks/server";

// Start MSW server before all tests
beforeAll(() => server.listen());

// Reset handlers after each test
afterEach(() => {
  cleanup();
  server.resetHandlers();
});

// Close MSW server after all tests
afterAll(() => server.close());
