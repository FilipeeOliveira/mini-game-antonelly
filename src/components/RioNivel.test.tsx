import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { RioNivel } from "./RioNivel";

describe("RioNivel", () => {
  it("aplica o nível como variável CSS --nivel", () => {
    const { container } = render(<RioNivel nivelPercent={42} marcas={[]} />);
    const rio = container.querySelector(".rio") as HTMLElement;
    expect(rio.style.getPropertyValue("--nivel")).toBe("42%");
  });

  it("não mostra a régua quando não há marcas", () => {
    const { container } = render(<RioNivel nivelPercent={10} marcas={[]} />);
    expect(container.querySelector(".regua")).not.toHaveClass("regua--visivel");
  });

  it("renderiza uma marca por item, com a ativa destacada", () => {
    render(
      <RioNivel
        nivelPercent={20}
        marcas={[
          { valor: 0, rotulo: "00", posPercent: 8, ativa: false },
          { valor: 1, rotulo: "01", posPercent: 20, ativa: true },
        ]}
      />
    );
    expect(screen.getByText("00")).toBeInTheDocument();
    expect(screen.getByText("01").closest(".regua__marca")).toHaveClass("regua__marca--ativa");
  });
});
