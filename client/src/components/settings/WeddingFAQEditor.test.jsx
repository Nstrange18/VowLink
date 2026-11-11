import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import WeddingFAQEditor from "./WeddingFAQEditor";
import api from "../../utils/api";
vi.mock("../../utils/api", () => ({ default: { get: vi.fn(), put: vi.fn() } }));
vi.mock("@iconify/react", () => ({ Icon: () => <span /> }));
const item = { question: "Parking?", answer: "At the venue." };
beforeEach(() => {
  api.get.mockReset().mockResolvedValue({ data: {} }); api.put.mockReset().mockResolvedValue({ data: {} });
  Object.defineProperty(HTMLDialogElement.prototype, "showModal", { configurable: true, value() { this.setAttribute("open", ""); } });
  Object.defineProperty(HTMLDialogElement.prototype, "close", { configurable: true, value() { this.removeAttribute("open"); } });
});
describe("Wedding FAQ editor", () => {
  it("loads legacy settings disabled, adds and trims an item, and saves only FAQ fields", async () => {
    const user = userEvent.setup(); render(<WeddingFAQEditor />);
    const toggle = await screen.findByRole("switch", { name: "Show FAQ on your invitation" });
    expect(toggle.getAttribute("aria-checked")).toBe("false");
    await user.click(toggle); await user.click(screen.getByRole("button", { name: "Add question" }));
    await user.type(screen.getByRole("textbox", { name: "Question 1" }), " Where? ");
    await user.type(screen.getByRole("textbox", { name: "Answer 1" }), " Here. ");
    await user.click(screen.getByRole("button", { name: "Save FAQ" }));
    expect(api.put).toHaveBeenCalledWith("/auth/me", { weddingSite: { faq: { enabled: true, items: [{ question: "Where?", answer: "Here." }] } } });
    expect((await screen.findByRole("status")).textContent).toContain("Wedding FAQ saved.");
  });
  it("edits and deletes without changing remaining array order", async () => {
    api.get.mockResolvedValue({ data: { weddingSite: { faq: { enabled: true, items: [item, { question: "Dress?", answer: "Formal." }] } } } });
    const user = userEvent.setup(); render(<WeddingFAQEditor />);
    await user.click(await screen.findByRole("button", { name: "Edit question 2" }));
    await user.clear(screen.getByRole("textbox", { name: "Answer 2" }));
    await user.type(screen.getByRole("textbox", { name: "Answer 2" }), "Casual.");
    await user.click(screen.getByRole("button", { name: "Delete question 1" }));
    await user.click(screen.getByRole("button", { name: "Remove question" }));
    await user.click(screen.getByRole("button", { name: "Save FAQ" }));
    expect(api.put).toHaveBeenCalledWith("/auth/me", { weddingSite: { faq: { enabled: true, items: [{ question: "Dress?", answer: "Casual." }] } } });
  });
  it("rejects incomplete items and exposes text limits", async () => {
    const user = userEvent.setup(); render(<WeddingFAQEditor />);
    await user.click(await screen.findByRole("button", { name: "Add question" }));
    expect(screen.getByRole("textbox", { name: "Question 1" }).maxLength).toBe(200);
    expect(screen.getByRole("textbox", { name: "Answer 1" }).maxLength).toBe(1500);
    await user.click(screen.getByRole("button", { name: "Save FAQ" }));
    expect(screen.getByRole("alert").textContent).toContain("Complete every question and answer");
    expect(api.put).not.toHaveBeenCalled();
  });
  it("caps the number of items", async () => {
    api.get.mockResolvedValue({ data: { weddingSite: { faq: { enabled: false, items: Array(10).fill(item) } } } });
    render(<WeddingFAQEditor />);
    expect((await screen.findByRole("button", { name: "Add question" })).disabled).toBe(true);
    expect(screen.getByText(/10 \/ 10 questions/)).not.toBeNull();
  });
  it("disables publishing without deleting saved draft content", async () => {
    api.get.mockResolvedValue({ data: { weddingSite: { faq: { enabled: true, items: [item] } } } });
    const user = userEvent.setup(); render(<WeddingFAQEditor />);
    await user.click(await screen.findByRole("switch", { name: "Show FAQ on your invitation" }));
    expect(api.put).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Save FAQ" }));
    expect(api.put).toHaveBeenCalledWith("/auth/me", { weddingSite: { faq: { enabled: false, items: [item] } } });
  });
  it("a failed load cannot save over existing content and can be retried", async () => {
    api.get.mockRejectedValueOnce(new Error("offline"));
    const user = userEvent.setup(); render(<WeddingFAQEditor />);
    await user.click(await screen.findByRole("button", { name: "Retry loading FAQ" }));
    expect(await screen.findByRole("button", { name: "Save FAQ" })).not.toBeNull();
    expect(api.put).not.toHaveBeenCalled();
  });
  it("keeps edits after failed saves", async () => {
    api.get.mockResolvedValue({ data: { weddingSite: { faq: { enabled: false, items: [item] } } } });
    api.put.mockRejectedValueOnce(new Error("offline"));
    const user = userEvent.setup(); render(<WeddingFAQEditor />);
    await user.click(await screen.findByRole("button", { name: "Save FAQ" }));
    await waitFor(() => expect(screen.getByRole("alert").textContent).toContain("Your edits are still here"));
    expect(screen.getByRole("heading", { name: item.question })).not.toBeNull();
  });
  it.each([
    ["", "At the venue.", "question", "Enter a question or remove this FAQ item."],
    ["Parking?", "", "answer", "Enter an answer or remove this FAQ item."],
    ["q".repeat(201), "Here.", "question", "Keep the question to 200 characters or fewer."],
    ["Parking?", "a".repeat(1501), "answer", "Keep the answer to 1500 characters or fewer."],
  ])("marks and focuses an invalid %s / %s item without sending", async (question, answer, field, message) => {
    api.get.mockResolvedValue({ data: { weddingSite: { faq: { enabled: false, items: [{ question, answer }] } } } });
    const user = userEvent.setup(); render(<WeddingFAQEditor />);
    await user.click(await screen.findByRole("button", { name: "Save FAQ" }));
    expect(screen.getByText(message)).not.toBeNull();
    expect(screen.getByRole("alert").textContent).toContain("highlighted fields");
    const input = screen.getByRole("textbox", { name: `${field === "question" ? "Question" : "Answer"} 1` });
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(document.activeElement).toBe(input);
    expect(api.put).not.toHaveBeenCalled();
  });
  it("marks all invalid fields and prevents browser native validation from hiding feedback", async () => {
    const user = userEvent.setup(); render(<WeddingFAQEditor />);
    await user.click(await screen.findByRole("button", { name: "Add question" }));
    await user.click(screen.getByRole("button", { name: "Save FAQ" }));
    expect(screen.getAllByRole("textbox").every((input) => input.getAttribute("aria-invalid") === "true")).toBe(true);
    expect(screen.getByRole("button", { name: "Save FAQ" }).form.noValidate).toBe(true);
    expect(api.put).not.toHaveBeenCalled();
  });
  it("shows dirty, saving and successful states and blocks duplicate submission", async () => {
    api.get.mockResolvedValue({ data: { weddingSite: { faq: { enabled: true, items: [item] } } } });
    let complete;
    api.put.mockImplementation(() => new Promise((resolve) => { complete = resolve; }));
    const user = userEvent.setup(); render(<WeddingFAQEditor />);
    await user.click(await screen.findByRole("button", { name: "Edit question 1" }));
    const input = screen.getByRole("textbox", { name: "Question 1" });
    expect(screen.queryByText(/Unsaved changes/)).toBeNull();
    expect(screen.queryByRole("status")).toBeNull();
    expect(screen.getByText("Published")).not.toBeNull();
    await user.type(input, " Updated");
    expect(screen.getByText(/Unsaved changes/)).not.toBeNull();
    await user.click(screen.getByRole("button", { name: "Save FAQ" }));
    expect(screen.getByRole("button", { name: "Saving…" }).disabled).toBe(true);
    fireEvent.submit(input.form);
    expect(api.put).toHaveBeenCalledTimes(1);
    complete({ data: {} });
    expect((await screen.findByRole("status")).textContent).toContain("Wedding FAQ saved.");
    expect(screen.queryByText(/Unsaved changes/)).toBeNull();
  });
  it("surfaces server validation errors while retaining edits", async () => {
    api.get.mockResolvedValue({ data: { weddingSite: { faq: { enabled: false, items: [item] } } } });
    api.put.mockRejectedValue({ response: { status: 400, data: { message: "Invalid Wedding FAQ. Use up to 10 questions." } } });
    const user = userEvent.setup(); render(<WeddingFAQEditor />);
    await user.click(await screen.findByRole("button", { name: "Save FAQ" }));
    expect((await screen.findByRole("alert")).textContent).toBe("Invalid Wedding FAQ. Use up to 10 questions.");
    expect(screen.getByText(item.answer)).not.toBeNull();
  });
  it("reports excess entries specifically", async () => {
    api.get.mockResolvedValue({ data: { weddingSite: { faq: { enabled: false, items: Array(11).fill(item) } } } });
    const user = userEvent.setup(); render(<WeddingFAQEditor />);
    await user.click(await screen.findByRole("button", { name: "Save FAQ" }));
    expect(screen.getByRole("alert").textContent).toContain("Remove extra items");
    expect(api.put).not.toHaveBeenCalled();
  });
  it("blocks malformed loaded data with a visible retry", async () => {
    api.get.mockResolvedValue({ data: { weddingSite: { faq: { enabled: true, items: [null] } } } });
    render(<WeddingFAQEditor />);
    expect(await screen.findByRole("button", { name: "Retry loading FAQ" })).not.toBeNull();
    expect(screen.getByRole("alert").textContent).toContain("valid FAQ data");
    expect(screen.queryByRole("button", { name: "Save FAQ" })).toBeNull();
  });
  it("shows compact previews, expands inline, and keeps Done editing separate from saving", async () => {
    api.get.mockResolvedValue({ data: { weddingSite: { faq: { enabled: false, items: [item] } } } });
    const user = userEvent.setup(); render(<WeddingFAQEditor />);
    await screen.findByRole("button", { name: "Edit question 1" });
    expect(screen.queryByRole("textbox")).toBeNull();
    expect(screen.getByText(item.answer)).not.toBeNull();
    await user.click(screen.getByRole("button", { name: "Edit question 1" }));
    const question = screen.getByRole("textbox", { name: "Question 1" });
    expect(document.activeElement).toBe(question);
    await user.clear(question);
    await user.type(question, "New question?");
    await user.click(screen.getByRole("button", { name: "Done editing" }));
    expect(screen.queryByRole("textbox")).toBeNull();
    expect(screen.getByRole("heading", { name: "New question?" })).not.toBeNull();
    expect(screen.getByText(/Unsaved changes/)).not.toBeNull();
    expect(api.put).not.toHaveBeenCalled();
  });
  it("reopens all invalid cards and focuses the first invalid field on Save", async () => {
    api.get.mockResolvedValue({ data: { weddingSite: { faq: { enabled: false, items: [{ question: "", answer: "Here" }, { question: "Dress?", answer: "" }] } } } });
    const user = userEvent.setup(); render(<WeddingFAQEditor />);
    await user.click(await screen.findByRole("button", { name: "Save FAQ" }));
    expect(screen.getAllByRole("textbox")).toHaveLength(4);
    expect(document.activeElement).toBe(screen.getByRole("textbox", { name: "Question 1" }));
    expect(screen.getByRole("textbox", { name: "Answer 2" }).getAttribute("aria-invalid")).toBe("true");
    expect(api.put).not.toHaveBeenCalled();
  });
  it("warns before removal, supports cancellation, and restores the original order with Undo", async () => {
    api.get.mockResolvedValue({ data: { weddingSite: { faq: { enabled: false, items: [item, { question: "Dress?", answer: "Formal" }] } } } });
    const user = userEvent.setup(); render(<WeddingFAQEditor />);
    await user.click(await screen.findByRole("button", { name: "Delete question 1" }));
    expect(screen.getByRole("dialog", { name: "Remove this question?" })).not.toBeNull();
    await user.click(screen.getByRole("button", { name: "Keep question" }));
    expect(screen.getByRole("heading", { name: item.question })).not.toBeNull();
    await user.click(screen.getByRole("button", { name: "Delete question 1" }));
    await user.click(screen.getByRole("button", { name: "Remove question" }));
    expect(screen.queryByRole("heading", { name: item.question })).toBeNull();
    expect(api.put).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Undo" }));
    await user.click(screen.getByRole("button", { name: "Undo" }));
    await user.click(screen.getByRole("button", { name: "Save FAQ" }));
    expect(api.put).toHaveBeenCalledWith("/auth/me", { weddingSite: { faq: { enabled: false, items: [item, { question: "Dress?", answer: "Formal" }] } } });
    expect(await screen.findByRole("dialog", { name: "FAQ saved" })).not.toBeNull();
    await user.click(screen.getByRole("button", { name: "Close", exact: true }));
    expect(screen.queryByRole("dialog")).toBeNull();
  });
  it("opens new questions immediately and focuses the question field", async () => {
    const user = userEvent.setup(); render(<WeddingFAQEditor />);
    expect(await screen.findByText("Make guests feel prepared")).not.toBeNull();
    await user.click(screen.getByRole("button", { name: "Add question" }));
    expect(document.activeElement).toBe(screen.getByRole("textbox", { name: "Question 1" }));
    expect(screen.getByRole("textbox", { name: "Answer 1" })).not.toBeNull();
    expect(screen.getByText("Edits still require Save FAQ.")).not.toBeNull();
  });
});
