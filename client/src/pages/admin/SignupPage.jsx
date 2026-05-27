import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";
import api from "../../utils/api";
import { signupSchema } from "../../utils/schemas";
import ColorPicker, { WEDDING_COLORS } from "../../components/ColorPicker";
import CustomSelect from "../../components/CustomSelect";

const EyeIcon = ({ open }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-4 w-4"
  >
    {open ? (
      <>
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </>
    ) : (
      <>
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
        <line x1="1" y1="1" x2="23" y2="23" />
      </>
    )}
  </svg>
);

const inputBase =
  "w-full rounded-xl border bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 outline-none transition";
const inputOk =
  "border-white/10 focus:border-[#D8B76A]/60 focus:ring-1 focus:ring-[#D8B76A]/30";
const inputErr = "border-red-400/50 focus:border-red-400/70";
const cls = (err) => `${inputBase} ${err ? inputErr : inputOk}`;

const SignupPage = () => {
  const [show, setShow] = useState({ password: false, confirm: false });
  const [loading, setLoading] = useState(false);
  const [weddingColors, setWeddingColors] = useState([]);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    watch,
    control,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      partner1Name: "",
      partner2Name: "",
      email: "",
      password: "",
      confirmPassword: "",
      weddingDate: "",
      weddingTime: "",
      rsvpDeadline: "",
      venue: "",
      dressCode: "",
      plusOnePolicy: "invitation_only",
      kidsAllowed: true,
    },
  });

  const p1 = watch("partner1Name");
  const p2 = watch("partner2Name");
  const weddingDate = watch("weddingDate");
  const weddingTime = watch("weddingTime");
  const rsvpDeadline = watch("rsvpDeadline");
  const venue = watch("venue");
  const dressCode = watch("dressCode");

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const res = await api.post("/auth/signup", {
        partner1Name: data.partner1Name,
        partner2Name: data.partner2Name,
        email: data.email,
        password: data.password,
        weddingDate: data.weddingDate || null,
        weddingTime: data.weddingTime || "18:00",
        rsvpDeadline: data.rsvpDeadline || null,
        venue: data.venue || "",
        weddingColors,
        dressCode: data.dressCode || "",
        plusOnePolicy: data.plusOnePolicy,
        kidsAllowed: data.kidsAllowed,
      });
      localStorage.setItem("token", res.data.accessToken);
      localStorage.setItem("refreshToken", res.data.refreshToken);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      toast.success("Account created! Welcome to Vowlink 🎉");
      navigate("/admin/dashboard");
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Signup failed. Please try again.",
      );
      setLoading(false);
    }
  };

  const FieldError = ({ name }) =>
    errors[name] ? (
      <p className="mt-1 text-xs text-red-400">{errors[name].message}</p>
    ) : null;

  const formattedTime = weddingTime
    ? new Date(`1970-01-01T${weddingTime}:00`).toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <section className="flex min-h-screen items-center justify-center bg-[#070A13] bg-[url('/hero-bg2.png')] bg-cover bg-top bg-no-repeat px-6 py-10">
      <div className="w-full max-w-md rounded-[24px] border border-[#D8B76A]/40 bg-[#070A13]/85 px-8 py-12 shadow-2xl backdrop-blur-md max-h-[95vh] overflow-y-auto">
        <p className="mb-2 text-center text-xs uppercase tracking-[0.35em] text-[#D8B76A]">
          Create Your Account
        </p>
        <h1 className="mb-2 text-center font-serif text-3xl text-white">
          Start Your Journey
        </h1>
        <p className="mb-8 text-center text-sm text-white/40">
          Set up your wedding invitation portal
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Partner names */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="mb-2 block text-xs uppercase tracking-widest text-white/50">
                Partner 1 *
              </label>
              <input
                id="partner1-name"
                placeholder="e.g. Allen"
                {...register("partner1Name")}
                className={cls(errors.partner1Name)}
              />
              <FieldError name="partner1Name" />
            </div>
            <div>
              <label className="mb-2 block text-xs uppercase tracking-widest text-white/50">
                Partner 2 *
              </label>
              <input
                id="partner2-name"
                placeholder="e.g. Justina"
                {...register("partner2Name")}
                className={cls(errors.partner2Name)}
              />
              <FieldError name="partner2Name" />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="mb-2 block text-xs uppercase tracking-widest text-white/50">
              Email *
            </label>
            <input
              id="signup-email"
              type="email"
              placeholder="your@email.com"
              {...register("email")}
              className={cls(errors.email)}
            />
            <FieldError name="email" />
          </div>

          {/* Password */}
          <div>
            <label className="mb-2 block text-xs uppercase tracking-widest text-white/50">
              Password *
            </label>
            <div className="relative">
              <input
                id="signup-password"
                type={show.password ? "text" : "password"}
                placeholder="Min 6 characters"
                {...register("password")}
                className={`${cls(errors.password)} pr-11`}
              />
              <button
                type="button"
                onClick={() =>
                  setShow((s) => ({ ...s, password: !s.password }))
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition"
              >
                <EyeIcon open={show.password} />
              </button>
            </div>
            <FieldError name="password" />
          </div>

          {/* Confirm password */}
          <div>
            <label className="mb-2 block text-xs uppercase tracking-widest text-white/50">
              Confirm Password *
            </label>
            <div className="relative">
              <input
                id="signup-confirm-password"
                type={show.confirm ? "text" : "password"}
                placeholder="Repeat password"
                {...register("confirmPassword")}
                className={`${cls(errors.confirmPassword)} pr-11`}
              />
              <button
                type="button"
                onClick={() => setShow((s) => ({ ...s, confirm: !s.confirm }))}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition"
              >
                <EyeIcon open={show.confirm} />
              </button>
            </div>
            <FieldError name="confirmPassword" />
          </div>

          {/* Wedding date */}
          <div>
            <label className="mb-2 block text-xs uppercase tracking-widest text-white/50">
              Wedding Date
            </label>
            <input
              id="wedding-date"
              type="date"
              {...register("weddingDate")}
              className={`${cls(false)} [color-scheme:dark]`}
            />
          </div>

          {/* Wedding time */}
          <div>
            <label className="mb-2 block text-xs uppercase tracking-widest text-white/50">
              Wedding Time
            </label>
            <input
              id="signup-wedding-time"
              type="time"
              {...register("weddingTime")}
              className={`${cls(false)} [color-scheme:dark]`}
            />
            <p className="mt-1 text-xs text-white/30">
              Optional. You can update this later in settings.
            </p>
            {weddingTime && (
              <p className="mt-2 text-xs text-[#D8B76A]">
                Preview: {formattedTime}
              </p>
            )}
          </div>

          {/* RSVP Deadline */}
          <div>
            <label className="mb-2 block text-xs uppercase tracking-widest text-white/50">
              RSVP Deadline
            </label>
            <input
              id="signup-rsvp-deadline"
              type="date"
              {...register("rsvpDeadline")}
              max={weddingDate || undefined}
              className={`${cls(false)} [color-scheme:dark]`}
            />
            <p className="mt-1 text-xs text-white/30">
              Cut-off date for RSVPs. Optional.
            </p>
          </div>

          {/* Venue */}
          <div>
            <label className="mb-2 block text-xs uppercase tracking-widest text-white/50">
              Venue / Location
            </label>
            <input
              id="signup-venue"
              placeholder="e.g. The Grand Ballroom, Lagos"
              {...register("venue")}
              className={cls(false)}
            />
          </div>

          {/* Wedding Colours */}
          <div>
            <label className="mb-2 block text-xs uppercase tracking-widest text-white/50">
              Wedding Colours
            </label>
            <ColorPicker value={weddingColors} onChange={setWeddingColors} />
            <p className="mt-1 text-xs text-white/30">
              Pick up to 5 colours for your dress code &amp; invitation. You can
              update later.
            </p>
          </div>

          {/* Dress Code */}
          <div>
            <label className="mb-2 block text-xs uppercase tracking-widest text-white/50">
              Dress Code
            </label>
            <input
              id="signup-dress-code"
              placeholder="e.g. Black Tie, Smart Casual, White & Gold"
              {...register("dressCode")}
              className={cls(false)}
            />
            <p className="mt-1 text-xs text-white/30">
              Shown on every invitation card. You can update later.
            </p>
          </div>

          {/* Guest policies */}
          <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 space-y-4">
            <p className="text-xs uppercase tracking-widest text-white/40">
              Guest Policies
            </p>

            <div>
              <label className="mb-2 block text-xs uppercase tracking-widest text-white/50">
                Plus One
              </label>
              <Controller
                name="plusOnePolicy"
                control={control}
                render={({ field }) => (
                  <CustomSelect
                    name={field.name}
                    value={field.value}
                    onChange={(e) => field.onChange(e.target.value)}
                    options={[
                      {
                        value: "invitation_only",
                        label: "Strictly by invitation",
                      },
                      {
                        value: "plus_one_allowed",
                        label: "A plus one is welcome",
                      },
                    ]}
                  />
                )}
              />
              <p className="mt-1 text-xs text-white/30">
                If enabled, guests may RSVP for one extra person beyond what
                their invitation allows.
              </p>
              <FieldError name="plusOnePolicy" />
            </div>

            <div className="flex items-center justify-between gap-4">
              <div>
                <label className="block text-xs uppercase tracking-widest text-white/50">
                  Kids Allowed
                </label>
                <p className="mt-1 text-xs text-white/30">
                  Shown on invitations and in details.
                </p>
              </div>
              <label className="inline-flex items-center gap-2 text-sm text-white/70">
                <input
                  id="signup-kids-allowed"
                  type="checkbox"
                  {...register("kidsAllowed")}
                  className="h-4 w-4 rounded border-white/20 bg-white/10"
                  defaultChecked
                />
                Yes
              </label>
            </div>
          </div>

          {/* Preview */}
          {(p1 || p2) && (
            <div className="rounded-xl border border-[#D8B76A]/20 bg-[#D8B76A]/5 px-4 py-3 text-center space-y-1">
              <p className="text-xs text-white/40 uppercase tracking-widest">
                Preview
              </p>
              <p className="font-serif text-lg text-white">
                {p1 || "—"} <span className="text-[#D8B76A]">&</span>{" "}
                {p2 || "—"}
              </p>
              {weddingDate && (
                <p className="text-xs text-white/50">
                  {new Date(weddingDate).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              )}
              {weddingTime && (
                <p className="text-xs text-[#D8B76A]">⏰ {formattedTime}</p>
              )}
              {rsvpDeadline && (
                <p className="text-xs text-amber-400/70">
                  RSVP by{" "}
                  {new Date(rsvpDeadline).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              )}
              {venue && <p className="text-xs text-white/40">📍 {venue}</p>}
              {dressCode && (
                <p className="text-xs text-white/50">👔 {dressCode}</p>
              )}
              {weddingColors.length > 0 && (
                <div className="flex justify-center gap-1 pt-1">
                  {weddingColors.map((name, i) => {
                    const hex =
                      WEDDING_COLORS.find((c) => c.name === name)?.hex ||
                      "#999";
                    return (
                      <div
                        key={i}
                        title={name}
                        className="h-4 w-4 rounded-full border border-white/20"
                        style={{ background: hex }}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            id="signup-submit-btn"
            className="w-full rounded-full bg-linear-to-r from-[#D8B76A] to-[#F2D894] py-3 text-sm font-semibold uppercase tracking-widest text-[#070A13] transition hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(216,183,106,0.3)] disabled:opacity-60"
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-white/40">
          Already have an account?{" "}
          <Link to="/admin/login" className="text-[#D8B76A] hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </section>
  );
};

export default SignupPage;
