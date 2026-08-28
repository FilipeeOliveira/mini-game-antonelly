import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { App } from "./App";

describe("App (fundação)", () => {
  it("renderiza sem quebrar", () => {
    render(<App />);
    expect(screen.getByText("Desafio do Rio")).toBeInTheDocument();
  });
});
