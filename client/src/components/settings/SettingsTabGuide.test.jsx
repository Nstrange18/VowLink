import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import SettingsTabGuide from "./SettingsTabGuide";
vi.mock("@iconify/react", () => ({ Icon: ({ icon }) => <span data-testid={icon} /> }));
const guide = { icon: "lucide:circle-help", eyebrow: "FAQ", title: "Guest questions", body: "Help guests prepare.", steps: ["Save your answers."] };
describe("Settings guide reminder", () => {
  it.each([undefined, "", "   "])("omits the info icon and banner for empty reminder %s", (reminder) => {
    render(<SettingsTabGuide guide={{ ...guide, reminder }} />);
    expect(screen.queryByTestId("lucide:info")).toBeNull();
    expect(screen.getByText(guide.body)).not.toBeNull();
  });
  it("renders a populated reminder", () => {
    render(<SettingsTabGuide guide={{ ...guide, reminder: "Save before sharing." }} />);
    expect(screen.getByTestId("lucide:info")).not.toBeNull();
    expect(screen.getByText("Save before sharing.")).not.toBeNull();
  });
});
