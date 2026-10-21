import { Icon } from "@iconify/react";

import { Controller } from "react-hook-form";

const MEAL_OPTIONS = [
  "No Preference",
  "Chicken",
  "Fish",
  "Vegetarian",
  "Vegan",
];

const inputClass =
  "w-full rounded-xl border border-[#1A2E4A]/15 bg-white px-4 py-3 text-sm text-[#1A2E4A] placeholder-[#1A2E4A]/30 outline-none focus:border-[#B8963A]/60 focus:ring-1 focus:ring-[#B8963A]/30 transition";

// InvitePage owns form state, validation, submission, and navigation.
const RsvpModal = ({
  setShowForm,
  handleSubmit,
  onRsvpSubmit,
  setRsvpFormActive,
  register,
  errors,
  control,
  attending,
  invitedCount,
  isSubmitting,
  rsvpSubmitting,
}) => (
  <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 px-0 sm:px-4 backdrop-blur-sm">
    <div className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl border border-[#D8B76A]/20 bg-white p-6 sm:p-8 shadow-2xl max-h-[92vh] overflow-y-auto">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="font-serif text-2xl text-[#1A2E4A]">
          Your RSVP
        </h2>
        <button
          onClick={() => setShowForm(false)}
          className="text-[#1A2E4A]/40 hover:text-[#1A2E4A] transition text-lg"
        >
          <Icon icon="lucide:x" className="h-5 w-5" />
        </button>
      </div>

      <form
        onSubmit={handleSubmit(onRsvpSubmit)}
        onFocusCapture={() => setRsvpFormActive(true)}
        onBlurCapture={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) {
            setRsvpFormActive(false);
          }
        }}
        className="space-y-4"
      >
        {/* Name */}
        <div>
          <label className="mb-2 block text-xs uppercase tracking-widest text-[#1A2E4A]/50">
            Name *
          </label>
          <input
            id="rsvp-name"
            {...register("guestName")}
            className={`${inputClass} ${errors.guestName ? "border-red-400/50" : ""}`}
          />
          {errors.guestName && (
            <p className="mt-1 text-xs text-red-500">
              {errors.guestName.message}
            </p>
          )}
        </div>

        {/* Phone */}
        <div>
          <label className="mb-2 block text-xs uppercase tracking-widest text-[#1A2E4A]/50">
            Phone Number *
          </label>
          <input
            id="rsvp-phone"
            placeholder="+234 800 000 0000"
            {...register("phone")}
            className={`${inputClass} ${errors.phone ? "border-red-400/50" : ""}`}
          />
          {errors.phone && (
            <p className="mt-1 text-xs text-red-500">
              {errors.phone.message}
            </p>
          )}
        </div>

        {/* Optional Email for confirmation */}
        <div>
          <label className="mb-2 block text-xs uppercase tracking-widest text-[#1A2E4A]/50">
            Email{" "}
            <span className="text-[#1A2E4A]/30 normal-case">
              (optional — for confirmation)
            </span>
          </label>
          <input
            id="rsvp-email"
            type="email"
            placeholder="your@email.com"
            {...register("guestEmail")}
            className={`${inputClass} ${errors.guestEmail ? "border-red-400/50" : ""}`}
          />
          {errors.guestEmail && (
            <p className="mt-1 text-xs text-red-500">
              {errors.guestEmail.message}
            </p>
          )}
        </div>

        {/* Attending toggle */}
        <div>
          <label className="mb-2 block text-xs uppercase tracking-widest text-[#1A2E4A]/50">
            Will you attend? *
          </label>
          <Controller
            name="attending"
            control={control}
            render={({ field }) => (
              <div className="flex gap-3">
                {["Yes", "No"].map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => field.onChange(opt)}
                    className={`flex-1 rounded-xl border py-3 text-sm font-medium transition ${
                      field.value === opt
                        ? opt === "Yes"
                          ? "border-emerald-500/50 bg-emerald-50 text-emerald-700"
                          : "border-red-400/50 bg-red-50 text-red-600"
                        : "border-[#1A2E4A]/10 bg-[#F8F8F8] text-[#1A2E4A]/50 hover:border-[#1A2E4A]/20"
                    }`}
                  >
                    <span className="inline-flex items-center gap-1.5">
                      <Icon
                        icon={
                          opt === "Yes" ? "lucide:check" : "lucide:x"
                        }
                        className="h-3.5 w-3.5"
                      />
                      {opt}
                    </span>
                  </button>
                ))}
              </div>
            )}
          />
        </div>

        {attending === "Yes" && (
          <div className="rounded-xl border border-[#B8963A]/30 bg-[#D8B76A]/10 px-4 py-3">
            <p className="text-xs uppercase tracking-widest text-[#B8963A]/80 mb-1">
              Your invitation
            </p>
            <p className="text-sm text-[#1A2E4A]">
              Your invitation allows up to {invitedCount} guest{invitedCount === 1 ? "" : "s"}, including you. Confirm only the people who will attend.
            </p>
            <label htmlFor="rsvp-guest-count" className="mt-3 block text-sm text-[#1A2E4A]">How many people will attend, including you?</label>
            <select id="rsvp-guest-count" {...register("numberOfGuests")} className={`${inputClass} mt-2`}>
              {Array.from({ length: invitedCount }, (_, index) => <option key={index + 1} value={index + 1}>{index + 1}</option>)}
            </select>
          </div>
        )}

        {/* Meal preference */}
        <div>
          <label className="mb-2 block text-xs uppercase tracking-widest text-[#1A2E4A]/50">
            Meal Preference
          </label>
          <Controller
            name="mealPreference"
            control={control}
            render={({ field }) => (
              <div className="flex flex-wrap gap-2">
                {MEAL_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => field.onChange(opt)}
                    className={`rounded-full border px-4 py-1.5 text-xs font-medium transition ${
                      field.value === opt
                        ? "border-[#B8963A]/60 bg-[#D8B76A]/15 text-[#B8963A]"
                        : "border-[#1A2E4A]/10 bg-[#F8F8F8] text-[#1A2E4A]/50 hover:border-[#1A2E4A]/20"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}
          />
        </div>

        {/* Message */}
        <div>
          <label className="mb-2 block text-xs uppercase tracking-widest text-[#1A2E4A]/50">
            Message (optional)
          </label>
          <textarea
            id="rsvp-message"
            rows={3}
            placeholder="A note for the couple..."
            {...register("message")}
            className={`${inputClass} resize-none`}
          />
        </div>

        <button
          type="submit"
          id="rsvp-submit-btn"
          disabled={isSubmitting || rsvpSubmitting}
          className="w-full rounded-full bg-linear-to-r from-[#D8B76A] to-[#F2D894] py-4 text-sm font-bold uppercase tracking-widest text-[#1A2E4A] transition hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(216,183,106,0.4)] disabled:opacity-60 mt-2"
        >
          {isSubmitting || rsvpSubmitting
            ? "Sending..."
            : "Submit RSVP"}
        </button>
      </form>
    </div>
  </div>
);

export default RsvpModal;
