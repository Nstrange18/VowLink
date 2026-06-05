import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "react-toastify";
import api from "../../utils/api";

const registerSchema = z.object({
  name: z.string().min(3, "Venue name must be at least 3 characters"),
  city: z.string().min(2, "City is required"),
  generalLocation: z.string().min(3, "General location is required (e.g. Lekki Phase 1)"),
  fullAddress: z.string().min(10, "Full address must be at least 10 characters"),
  capacity: z.string().min(2, "Capacity range is required (e.g. 200 - 400 guests)"),
  priceRange: z.string().min(2, "Price range is required (e.g. ₦800k - ₦1.5M)"),
  description: z.string().min(20, "Please write a brief description of at least 20 characters"),
  phone: z.string().min(7, "Contact phone number is required"),
  whatsapp: z.string().min(7, "WhatsApp number is required"),
  mapLink: z.string().url("Please enter a valid Google Maps URL"),
  style: z.enum(["Classic", "Modern", "Beach", "Rustic", "Garden"], {
    errorMap: () => ({ message: "Please select a valid venue style" }),
  }),
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

const VenueRegisterPage = () => {
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      style: "Classic",
    }
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const res = await api.post("/venues/auth/register", data);
      localStorage.setItem("venueToken", res.data.token);
      localStorage.setItem("venue", JSON.stringify(res.data.venue));
      toast.success(res.data.message || "Registration successful! Welcome to VowLink.");
      navigate("/venue/dashboard");
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Registration failed. Email might be in use."
      );
      setLoading(false);
    }
  };

  const inputBase =
    "w-full rounded-xl border bg-white/5 px-4 py-2.5 text-xs text-white placeholder-white/30 outline-none transition";
  const inputOk =
    "border-white/10 focus:border-[#D8B76A]/60 focus:ring-1 focus:ring-[#D8B76A]/30";
  const inputErr = "border-red-400/50 focus:border-red-400/70";
  const labelClass = "mb-1 block text-[10px] uppercase tracking-wider text-white/50 font-semibold";

  return (
    <section className="flex min-h-screen items-center justify-center bg-[#070A13] bg-[url('/hero-bg2.png')] bg-cover bg-top bg-no-repeat px-4 py-12">
      <Link
        to="/venue/login"
        className="absolute top-4 left-4 sm:top-6 sm:left-6 flex items-center gap-1 bg-[#070A13] rounded-full py-1.5 sm:py-2 px-2 sm:px-3 text-xs sm:text-sm text-[#D8B76A] hover:text-[#D8B76A]/70 hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(216,183,106,0.3)] transition whitespace-nowrap"
      >
        <span>←</span>
        <span>Back to Sign In</span>
      </Link>
      <div className="w-full max-w-2xl rounded-3xl border border-[#D8B76A]/30 bg-[#070A13]/90 px-8 py-10 shadow-2xl backdrop-blur-md animate-fade-in my-6">
        <p className="mb-1 text-center text-xs uppercase tracking-[0.35em] text-[#D8B76A] font-bold">
          Partnership Registration
        </p>
        <h1 className="mb-6 text-center font-serif text-3xl text-white">
          Register Your Venue
        </h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Venue Name */}
            <div>
              <label className={labelClass}>Venue Name *</label>
              <input
                type="text"
                placeholder="The Monarch Event Centre"
                {...register("name")}
                className={`${inputBase} ${errors.name ? inputErr : inputOk}`}
              />
              {errors.name && <p className="mt-1 text-[10px] text-red-400">{errors.name.message}</p>}
            </div>

            {/* Style */}
            <div>
              <label className={labelClass}>Venue Style/Theme *</label>
              <select
                {...register("style")}
                className="w-full rounded-xl border bg-[#070A13] border-white/10 px-4 py-2.5 text-xs text-white placeholder-white/30 outline-none focus:border-[#D8B76A]/60"
              >
                <option value="Classic">Classic Elegance</option>
                <option value="Modern">Sleek Modern</option>
                <option value="Beach">Waterfront / Beach</option>
                <option value="Rustic">Cozy Rustic Wood</option>
                <option value="Garden">Outdoor Garden</option>
              </select>
              {errors.style && <p className="mt-1 text-[10px] text-red-400">{errors.style.message}</p>}
            </div>

            {/* City */}
            <div>
              <label className={labelClass}>City *</label>
              <input
                type="text"
                placeholder="Lagos"
                {...register("city")}
                className={`${inputBase} ${errors.city ? inputErr : inputOk}`}
              />
              {errors.city && <p className="mt-1 text-[10px] text-red-400">{errors.city.message}</p>}
            </div>

            {/* General Location */}
            <div>
              <label className={labelClass}>General Location *</label>
              <input
                type="text"
                placeholder="Lekki Phase 1"
                {...register("generalLocation")}
                className={`${inputBase} ${errors.generalLocation ? inputErr : inputOk}`}
              />
              {errors.generalLocation && <p className="mt-1 text-[10px] text-red-400">{errors.generalLocation.message}</p>}
            </div>

            {/* Capacity */}
            <div>
              <label className={labelClass}>Capacity Range *</label>
              <input
                type="text"
                placeholder="300 - 600 guests"
                {...register("capacity")}
                className={`${inputBase} ${errors.capacity ? inputErr : inputOk}`}
              />
              {errors.capacity && <p className="mt-1 text-[10px] text-red-400">{errors.capacity.message}</p>}
            </div>

            {/* Price Range */}
            <div>
              <label className={labelClass}>Price Range *</label>
              <input
                type="text"
                placeholder="₦1.2M - ₦2.0M"
                {...register("priceRange")}
                className={`${inputBase} ${errors.priceRange ? inputErr : inputOk}`}
              />
              {errors.priceRange && <p className="mt-1 text-[10px] text-red-400">{errors.priceRange.message}</p>}
            </div>

            {/* Phone */}
            <div>
              <label className={labelClass}>Contact Phone *</label>
              <input
                type="text"
                placeholder="+234 812 345 6789"
                {...register("phone")}
                className={`${inputBase} ${errors.phone ? inputErr : inputOk}`}
              />
              {errors.phone && <p className="mt-1 text-[10px] text-red-400">{errors.phone.message}</p>}
            </div>

            {/* WhatsApp */}
            <div>
              <label className={labelClass}>WhatsApp Number *</label>
              <input
                type="text"
                placeholder="2348123456789"
                {...register("whatsapp")}
                className={`${inputBase} ${errors.whatsapp ? inputErr : inputOk}`}
              />
              {errors.whatsapp && <p className="mt-1 text-[10px] text-red-400">{errors.whatsapp.message}</p>}
            </div>
          </div>

          {/* Full Address */}
          <div>
            <label className={labelClass}>Full Address *</label>
            <input
              type="text"
              placeholder="Plot 12, Block 4, Admiralty Way, Lekki Phase 1, Lagos, Nigeria"
              {...register("fullAddress")}
              className={`${inputBase} ${errors.fullAddress ? inputErr : inputOk}`}
            />
            {errors.fullAddress && <p className="mt-1 text-[10px] text-red-400">{errors.fullAddress.message}</p>}
          </div>

          {/* Map Link */}
          <div>
            <label className={labelClass}>Google Maps Share Link *</label>
            <input
              type="text"
              placeholder="https://maps.google.com/?q=..."
              {...register("mapLink")}
              className={`${inputBase} ${errors.mapLink ? inputErr : inputOk}`}
            />
            {errors.mapLink && <p className="mt-1 text-[10px] text-red-400">{errors.mapLink.message}</p>}
          </div>

          <div className="bg-[#D8B76A]/5 border border-[#D8B76A]/20 p-3 rounded-xl flex items-start gap-2">
            <span className="text-xs mt-0.5">⚠️</span>
            <p className="text-[10px] text-white/70 leading-relaxed">
              <strong className="text-[#D8B76A]">Location Precision:</strong> Please make sure your address and Google Maps links are as precise and accurate as possible. Couples and their guests rely heavily on this information to reach your venue without navigation errors.
            </p>
          </div>

          {/* Description */}
          <div>
            <label className={labelClass}>Description *</label>
            <textarea
              placeholder="A luxurious, air-conditioned banquet hall with beautiful gardens, perfect lighting, and ample parking space for elegant events..."
              rows={3}
              {...register("description")}
              className="w-full rounded-xl border bg-white/5 px-4 py-2.5 text-xs text-white placeholder-white/30 outline-none resize-none focus:border-[#D8B76A]/60 transition"
            />
            {errors.description && <p className="mt-1 text-[10px] text-red-400">{errors.description.message}</p>}
          </div>

          <div className="border-t border-white/10 pt-4 mt-2">
            <h3 className="text-xs font-semibold text-[#D8B76A] uppercase tracking-wider mb-3">Owner Account Credentials</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Owner Email */}
              <div>
                <label className={labelClass}>Login Email *</label>
                <input
                  type="email"
                  placeholder="owner@mycentre.com"
                  {...register("ownerEmail")}
                  className={`${inputBase} ${errors.ownerEmail ? inputErr : inputOk}`}
                />
                {errors.ownerEmail && <p className="mt-1 text-[10px] text-red-400">{errors.ownerEmail.message}</p>}
              </div>

              {/* Password */}
              <div>
                <label className={labelClass}>Login Password *</label>
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
                {errors.ownerPassword && <p className="mt-1 text-[10px] text-red-400">{errors.ownerPassword.message}</p>}
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-linear-to-r from-[#D8B76A] to-[#F2D894] py-3 text-sm font-semibold uppercase tracking-widest text-[#070A13] transition hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(216,183,106,0.3)] disabled:opacity-60 cursor-pointer mt-4"
          >
            {loading ? "Registering..." : "Create Venue Account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-white/40">
          Already have an account?{" "}
          <Link to="/venue/login" className="text-[#D8B76A] hover:underline font-semibold">
            Sign in
          </Link>
        </p>
      </div>
    </section>
  );
};

export default VenueRegisterPage;
