import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Badge } from "./badge";

describe("Badge component", () => {
  it("should render badge text", () => {
    render(<Badge>Test Badge</Badge>);
    expect(screen.getByText("Test Badge")).toBeInTheDocument();
  });

  it("should apply default variant classes", () => {
    const { container } = render(<Badge>Test Badge</Badge>);
    expect(container.firstChild).toHaveClass("bg-primary");
  });

  it("should apply destructive variant classes", () => {
    const { container } = render(<Badge variant="destructive">Destructive</Badge>);
    expect(container.firstChild).toHaveClass("bg-destructive");
  });
});
