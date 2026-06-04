import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "react-toastify";
import api from "../../utils/api";

const loginSchema = z.object({
  ownerEmail: z.string().email("Please enter a valid email address"),
  ownerPassword: z.string().min(6, "Password must be at least 6 characters"),
});

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

const VenueLoginPage = () => {
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const res = await api.post("/venues/auth/login", data);
      localStorage.setItem("venueToken", res.data.token);
      localStorage.setItem("venue", JSON.stringify(res.data.venue));
      toast.success(res.data.message || "Logged in successfully!");
      navigate("/venue/dashboard");
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Login failed. Please verify credentials."
      );
      setLoading(false);
    }
  };

  const inputBase =
    "w-full rounded-xl border bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 outline-none transition";
  const inputOk =
    "border-white/10 focus:border-[#D8B76A]/60 focus:ring-1 focus:ring-[#D8B76A]/30";
  const inputErr = "border-red-400/50 focus:border-red-400/70";

  return (
    <section className="flex min-h-screen items-center justify-center bg-[#070A13] bg-[url('/hero-bg2.png')] bg-cover bg-top bg-no-repeat px-6">
      <Link
        to="/admin/login"
        className="absolute top-4 left-4 sm:top-6 sm:left-6 flex items-center gap-1 bg-[#070A13] rounded-full py-1.5 sm:py-2 px-2 sm:px-3 text-xs sm:text-sm text-[#D8B76A] hover:text-[#D8B76A]/70 hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(216,183,106,0.3)] transition whitespace-nowrap"
      >
        <span>←</span>
        <span>Back to Couple Login</span>
      </Link>
      <div className="w-full max-w-sm rounded-3xl border border-[#D8B76A]/40 bg-[#070A13]/85 px-8 py-12 shadow-2xl backdrop-blur-md animate-fade-in">
        <p className="mb-2 text-center text-xs uppercase tracking-[0.35em] text-[#D8B76A] font-bold">
          Venue Partner Portal
        </p>
        <h1 className="mb-8 text-center font-serif text-3xl text-white">
          Venue Sign In
        </h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="mb-2 block text-xs uppercase tracking-widest text-white/50 font-semibold">
              Owner Email
            </label>
            <input
              type="email"
              placeholder="owner@venue.com"
              {...register("ownerEmail")}
              className={`${inputBase} ${errors.ownerEmail ? inputErr : inputOk}`}
            />
            {errors.ownerEmail && (
              <p className="mt-1 text-xs text-red-400">
                {errors.ownerEmail.message}
              </p>
            )}
          </div>

          <div>
            <label className="mb-2 block text-xs uppercase tracking-widest text-white/50 font-semibold">
              Password
            </label>
            <div className="relative">
              <input
                type={showPw ? "text" : "password"}
                placeholder="••••••••"
                {...register("ownerPassword")}
                className={`${inputBase} ${errors.ownerPassword ? inputErr : inputOk} pr-11`}
              />
              <button
                type="button"
                onClick={() => setShowPw((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition"
              >
                <EyeIcon open={showPw} />
              </button>
            </div>
            {errors.ownerPassword && (
              <p className="mt-1 text-xs text-red-400">
                {errors.ownerPassword.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-linear-to-r from-[#D8B76A] to-[#F2D894] py-3 text-sm font-semibold uppercase tracking-widest text-[#070A13] transition hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(216,183,106,0.3)] disabled:opacity-60 cursor-pointer"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-white/40">
          Want to list your venue?{" "}
          <Link to="/venue/register" className="text-[#D8B76A] hover:underline font-semibold">
            Register now
          </Link>
        </p>
      </div>
    </section>
  );
};

export default VenueLoginPage;
