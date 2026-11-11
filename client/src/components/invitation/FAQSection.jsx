import { useId, useState } from "react";

function FAQItem({ question, answer }) {
  const id = useId();
  const [open, setOpen] = useState(false);
  return (
    <div className="invite-feature-card min-w-0 rounded-2xl border border-white/10 bg-[#0D1220] text-left">
      <h3>
        <button type="button" aria-expanded={open} aria-controls={id} onClick={() => setOpen(!open)}
          className="flex w-full min-w-0 items-center justify-between gap-4 rounded-2xl p-5 text-left text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#D8B76A]">
          <span className="min-w-0 [overflow-wrap:anywhere]">{question}</span>
          <span aria-hidden="true" className="shrink-0 text-[#D8B76A]">{open ? "−" : "+"}</span>
        </button>
      </h3>
      <div id={id} hidden={!open} className="whitespace-pre-wrap px-5 pb-5 text-white/70 [overflow-wrap:anywhere]">{answer}</div>
    </div>
  );
}

export default function FAQSection({ faq }) {
  if (faq?.enabled !== true || !Array.isArray(faq.items)) return null;
  const items = faq.items.filter((item) => typeof item?.question === "string" && item.question.trim() &&
    item.question.trim().length <= 200 && typeof item.answer === "string" && item.answer.trim() && item.answer.trim().length <= 1500).slice(0, 10);
  if (!items.length) return null;
  return (
    <section aria-label="Wedding FAQ" className="invite-section download-exclude relative z-10 border-t border-white/5 bg-[#070A13] px-4 py-16 sm:px-6">
      <div className="mx-auto w-full min-w-0 max-w-3xl space-y-3">
        <h2 className="mb-6 text-center font-serif text-3xl text-[#D8B76A]">Wedding FAQ</h2>
        {items.map((item, index) => <FAQItem key={index} question={item.question.trim()} answer={item.answer.trim()} />)}
      </div>
    </section>
  );
}
