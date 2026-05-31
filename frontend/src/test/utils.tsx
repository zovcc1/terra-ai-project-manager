import React, { ReactNode } from "react";
import { render as rtlRender } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

export function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return rtlRender(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}
