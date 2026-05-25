import { http, HttpResponse } from "msw";

export const handlers = [
  http.get("http://localhost:8080/api/manager/projects", () => {
    return HttpResponse.json([
      {
        id: 1,
        name: "Mock Project 1",
        description: "Mock Description 1",
        progress: 50,
        dueDate: "2026-12-31",
        status: "ACTIVE",
        priority: "HIGH",
      },
      {
        id: 2,
        name: "Mock Project 2",
        description: "Mock Description 2",
        progress: 10,
        dueDate: "2026-11-30",
        status: "ACTIVE",
        priority: "MEDIUM",
      },
    ]);
  }),
];
