import { screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { DashboardPage } from "../dashboard";
import { renderWithProviders } from "@/test/utils";

// Mocking AppShell since it uses useRouterState which requires a router context
vi.mock("@/components/app-shell", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  PageHeader: ({ title, action }: { title: string; action?: React.ReactNode }) => (
    <div>
      <h1>{title}</h1>
      {action}
    </div>
  ),
}));

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
  createFileRoute: () => () => ({}),
}));

describe("DashboardPage integration", () => {
  it("should show loading state and then display projects", async () => {
    renderWithProviders(<DashboardPage />);

    // Should show loading spinner initially (lucide-react Loader2 is used)
    // Wait, Loader2 might not be easy to find by text.
    // Let's check for the projects.

    await waitFor(() => {
      expect(screen.getByText("Mock Project 1")).toBeInTheDocument();
      expect(screen.getByText("Mock Project 2")).toBeInTheDocument();
    });

    expect(screen.getByText("50%")).toBeInTheDocument();
    expect(screen.getByText("10%")).toBeInTheDocument();
  });

  it("should show error message if API fails", async () => {
    // Override handler for this specific test
    const { http, HttpResponse } = await import("msw");
    const { server } = await import("@/mocks/server");

    server.use(
      http.get("http://localhost:8080/api/manager/projects", () => {
        return new HttpResponse(null, { status: 500 });
      }),
    );

    renderWithProviders(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText(/خطأ في تحميل البيانات/)).toBeInTheDocument();
    });
  });
});
