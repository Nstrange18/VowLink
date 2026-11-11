import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import FAQSection from "./FAQSection";

const item = { question: "Is parking available?", answer: "Yes, beside the venue." };
describe("guest Wedding FAQ", () => {
  it.each([undefined, { enabled: false, items: [item] }, { enabled: true, items: [] },
    { enabled: true, items: [null, { question: " ", answer: "x" }] }])("hides unpublished or invalid content: %j", (faq) => {
    const { container } = render(<FAQSection faq={faq} />);
    expect(container.childElementCount).toBe(0);
  });
  it("supports mouse and keyboard expand/collapse with accessible state", async () => {
    const user = userEvent.setup();
    render(<FAQSection faq={{ enabled: true, items: [item] }} />);
    const button = screen.getByRole("button", { name: item.question });
    const answer = screen.getByText(item.answer);
    expect(button.getAttribute("aria-controls")).toBe(answer.id);
    expect(button.getAttribute("aria-expanded")).toBe("false"); expect(answer.hidden).toBe(true);
    await user.tab(); expect(document.activeElement).toBe(button);
    await user.keyboard("{Enter}"); expect(answer.hidden).toBe(false);
    await user.keyboard(" "); expect(answer.hidden).toBe(true);
    await user.click(button); expect(answer.hidden).toBe(false);
  });
  it("keeps questions independent and renders text safely with mobile wrapping", async () => {
    const user = userEvent.setup();
    const { container } = render(<FAQSection faq={{ enabled: true, items: [item, { question: "<script>test</script>", answer: "a".repeat(1000) }] }} />);
    await user.click(screen.getByRole("button", { name: item.question }));
    expect(screen.getAllByRole("button")[1].getAttribute("aria-expanded")).toBe("false");
    expect(container.querySelector("script")).toBeNull();
    expect(screen.getByText("a".repeat(1000)).classList.contains("[overflow-wrap:anywhere]")).toBe(true);
    expect(screen.getByRole("region", { name: "Wedding FAQ" }).classList.contains("download-exclude")).toBe(true);
  });
});
