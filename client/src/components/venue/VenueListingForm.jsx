import React from "react";

const inputBase =
  "w-full rounded-xl border bg-white/5 px-4 py-2.5 text-xs text-white placeholder-white/30 outline-none transition";
const inputOk =
  "border-white/10 focus:border-[#D8B76A]/60 focus:ring-1 focus:ring-[#D8B76A]/30";
const inputErr = "border-red-400/50 focus:border-red-400/70";
const labelClass = "mb-1.5 block text-[10px] uppercase tracking-wider text-white/50 font-semibold";

const VenueListingForm = ({
  register,
  errors,
  handleSubmit,
  onUpdateDetails,
  saving,
}) => {
  return (
    <div className="rounded-3xl border border-white/10 bg-[#0D1220] p-6 sm:p-8 space-y-6">
      <div>
        <h2 className="font-serif text-2xl">Manage Listing</h2>
        <p className="text-xs text-white/40 mt-1">Keep your wedding venue specifications accurate and up to date.</p>
      </div>

      <form onSubmit={handleSubmit(onUpdateDetails)} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Name */}
          <div>
            <label className={labelClass}>Venue Name *</label>
            <input
              type="text"
              {...register("name")}
              className={`${inputBase} ${errors.name ? inputErr : inputOk}`}
            />
            {errors.name && <p className="mt-1 text-[10px] text-red-400">{errors.name.message}</p>}
          </div>

          {/* Style */}
          <div>
            <label className={labelClass}>Style Category *</label>
            <select
              {...register("style")}
              className="w-full rounded-xl border bg-[#070A13] border-white/10 px-4 py-2.5 text-xs text-white outline-none focus:border-[#D8B76A]/60"
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
              {...register("generalLocation")}
              className={`${inputBase} ${errors.generalLocation ? inputErr : inputOk}`}
            />
            {errors.generalLocation && <p className="mt-1 text-[10px] text-red-400">{errors.generalLocation.message}</p>}
          </div>

          {/* Capacity */}
          <div>
            <label className={labelClass}>Guest Capacity *</label>
            <input
              type="text"
              {...register("capacity")}
              className={`${inputBase} ${errors.capacity ? inputErr : inputOk}`}
            />
            {errors.capacity && <p className="mt-1 text-[10px] text-red-400">{errors.capacity.message}</p>}
          </div>

          {/* Price Range */}
          <div>
            <label className={labelClass}>Price Range / Cost *</label>
            <input
              type="text"
              {...register("priceRange")}
              className={`${inputBase} ${errors.priceRange ? inputErr : inputOk}`}
            />
            {errors.priceRange && <p className="mt-1 text-[10px] text-red-400">{errors.priceRange.message}</p>}
          </div>

          {/* Phone */}
          <div>
            <label className={labelClass}>Phone Contact *</label>
            <input
              type="text"
              {...register("phone")}
              className={`${inputBase} ${errors.phone ? inputErr : inputOk}`}
            />
            {errors.phone && <p className="mt-1 text-[10px] text-red-400">{errors.phone.message}</p>}
          </div>

          {/* WhatsApp */}
          <div>
            <label className={labelClass}>WhatsApp Contact (intl format, no +)*</label>
            <input
              type="text"
              {...register("whatsapp")}
              className={`${inputBase} ${errors.whatsapp ? inputErr : inputOk}`}
            />
            {errors.whatsapp && <p className="mt-1 text-[10px] text-red-400">{errors.whatsapp.message}</p>}
          </div>

          {/* Email */}
          <div>
            <label className={labelClass}>Public Email *</label>
            <input
              type="email"
              {...register("email")}
              className={`${inputBase} ${errors.email ? inputErr : inputOk}`}
            />
            {errors.email && <p className="mt-1 text-[10px] text-red-400">{errors.email.message}</p>}
          </div>

          {/* Website */}
          <div>
            <label className={labelClass}>Website Link (Optional)</label>
            <input
              type="text"
              {...register("website")}
              className={`${inputBase} ${errors.website ? inputErr : inputOk}`}
            />
            {errors.website && <p className="mt-1 text-[10px] text-red-400">{errors.website.message}</p>}
          </div>
        </div>

        {/* Address */}
        <div>
          <label className={labelClass}>Full Address *</label>
          <input
            type="text"
            {...register("fullAddress")}
            className={`${inputBase} ${errors.fullAddress ? inputErr : inputOk}`}
          />
          {errors.fullAddress && <p className="mt-1 text-[10px] text-red-400">{errors.fullAddress.message}</p>}
        </div>

        {/* Map Link */}
        <div>
          <label className={labelClass}>Google Maps URL *</label>
          <input
            type="text"
            {...register("mapLink")}
            className={`${inputBase} ${errors.mapLink ? inputErr : inputOk}`}
          />
          {errors.mapLink && <p className="mt-1 text-[10px] text-red-400">{errors.mapLink.message}</p>}
        </div>

        {/* Warning Badge for Precision Location */}
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
            rows={4}
            {...register("description")}
            className="w-full rounded-xl border bg-white/5 px-4 py-3 text-xs text-white placeholder-white/30 outline-none resize-none focus:border-[#D8B76A]/60 transition"
          />
          {errors.description && <p className="mt-1 text-[10px] text-red-400">{errors.description.message}</p>}
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={saving}
            className="px-8 py-3 rounded-full bg-linear-to-r from-[#D8B76A] to-[#F2D894] text-xs font-bold uppercase tracking-widest text-[#070A13] hover:-translate-y-0.5 transition hover:shadow-lg disabled:opacity-60 cursor-pointer"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default VenueListingForm;
