import React from "react";
import { Icon } from "@iconify/react";

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
  watch,
  uploadingProof,
  handleProofUpload,
  proofUrls = [],
  removeProofUrl,
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
            <label className={labelClass}>Public Contact Email (Optional)</label>
            <input
              type="email"
              {...register("email")}
              placeholder="venue@email.com (shown to couples, not your login email)"
              className={`${inputBase} ${errors.email ? inputErr : inputOk}`}
            />
            <p className="mt-1 text-[9px] text-white/30">This is the email couples see on your listing. Leave blank to hide it.</p>
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
          <label className={labelClass}>Full Address * <span className="text-white/30 font-normal normal-case">(physical street address)</span></label>
          <input
            type="text"
            {...register("fullAddress")}
            placeholder="Plot 12, Block 4, Admiralty Way, Lekki Phase 1, Lagos"
            className={`${inputBase} ${errors.fullAddress ? inputErr : inputOk}`}
          />
          <p className="mt-1 text-[9px] text-white/30">Enter the physical street address — not an email address or website.</p>
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
          <Icon icon="lucide:alert-triangle" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#D8B76A]" />
          <p className="text-[10px] text-white/70 leading-relaxed">
            <strong className="text-[#D8B76A]">Location Precision:</strong> Please make sure your address and Google Maps links are as precise and accurate as possible. Couples and their guests rely heavily on this information to reach your venue without navigation errors.
          </p>
        </div>

        {/* Trust & Safety Checklist */}
        <div className="border-t border-white/10 pt-6 mt-6 space-y-4">
          <div>
            <h3 className="text-xs font-semibold text-[#D8B76A] uppercase tracking-wider flex items-center gap-1.5">
              <Icon icon="mdi:shield-check-outline" className="h-3.5 w-3.5 shrink-0" />
              Trust & Safety Verification Checklist
            </h3>
            <p className="text-[10px] text-white/40 mt-1">
              Select all safety standards that your venue currently holds. You will need to present proof of these declarations to the site administrator for verification before they are published to couples.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-white/5 border border-white/10 p-4 rounded-2xl">
            <label className="flex items-start gap-2.5 cursor-pointer py-1">
              <input
                type="checkbox"
                {...register("claimedFireExits")}
                className="accent-[#D8B76A] mt-0.5"
              />
              <div>
                <span className="font-semibold block text-white/80">Certified Fire Extinguishers & Exit Signage</span>
                <span className="text-[9px] text-white/40">We have fully functional certified fire extinguishers and clear exit signs in all halls.</span>
              </div>
            </label>

            <label className="flex items-start gap-2.5 cursor-pointer py-1">
              <input
                type="checkbox"
                {...register("claimedSecurity")}
                className="accent-[#D8B76A] mt-0.5"
              />
              <div>
                <span className="font-semibold block text-white/80">24/7 Professional Guard Security Personnel</span>
                <span className="text-[9px] text-white/40">Our premises are guarded 24/7 by trained, professional security guards.</span>
              </div>
            </label>

            <label className="flex items-start gap-2.5 cursor-pointer py-1">
              <input
                type="checkbox"
                {...register("claimedStructural")}
                className="accent-[#D8B76A] mt-0.5"
              />
              <div>
                <span className="font-semibold block text-white/80">Structural Integrity and Safety Certification</span>
                <span className="text-[9px] text-white/40">Our buildings have undergone professional structural integrity tests and have active certifications.</span>
              </div>
            </label>

            <label className="flex items-start gap-2.5 cursor-pointer py-1">
              <input
                type="checkbox"
                {...register("claimedInsurance")}
                className="accent-[#D8B76A] mt-0.5"
              />
              <div>
                <span className="font-semibold block text-white/80">Public Liability and Venue Insurance Coverage</span>
                <span className="text-[9px] text-white/40">We hold active public liability insurance coverage for any accidents/damages on site.</span>
              </div>
            </label>

            <label className="flex items-start gap-2.5 cursor-pointer py-1 sm:col-span-2">
              <input
                type="checkbox"
                {...register("claimedCctv")}
                className="accent-[#D8B76A] mt-0.5"
              />
              <div>
                <span className="font-semibold block text-white/80">Full CCTV Coverage in Public/Parking Areas</span>
                <span className="text-[9px] text-white/40">All common areas, entry points, and vehicle parking zones are covered by 24/7 active CCTV recording.</span>
              </div>
            </label>
          </div>

          {/* Verification Proof Upload — Multi-File (Max 5) */}
          <div className="border-t border-white/10 pt-4 mt-4 space-y-3">
            <div>
              <h4 className="text-[10px] font-semibold text-[#D8B76A] uppercase tracking-wider">
                <span className="inline-flex items-center gap-1.5">
                  <Icon icon="mdi:folder-open-outline" className="h-3.5 w-3.5 shrink-0" />
                  Verification Proof Documents
                </span>{" "}
                <span className="text-white/40 normal-case font-normal">(PDF or Image, max 5 files · 5MB each)</span>
              </h4>
              <p className="text-[9px] text-white/40 mt-0.5">
                Upload certificates, structural test results, or insurance policy documents as proof for the Super Admin to review.
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 p-4 rounded-xl space-y-3">
              {/* Uploaded proofs list */}
              {proofUrls.length > 0 ? (
                <div className="space-y-2">
                  {proofUrls.map((url, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between gap-3 bg-white/5 border border-white/10 px-3 py-2 rounded-xl"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Icon icon="mdi:file-document-outline" className="h-4 w-4 shrink-0 text-[#D8B76A]" />
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] text-[#D8B76A] hover:underline truncate"
                        >
                          Document {idx + 1} - Open / View
                          <Icon icon="lucide:arrow-right" className="ml-1 inline h-3 w-3" />
                        </a>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeProofUrl(idx)}
                        className="shrink-0 text-[10px] text-red-400 hover:text-red-300 border border-red-400/20 hover:border-red-400/50 px-2 py-1 rounded-lg transition"
                      >
                        <span className="inline-flex items-center gap-1">
                          <Icon icon="lucide:x" className="h-3 w-3" />
                          Remove
                        </span>
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[10px] text-white/40 italic text-center py-1">
                  No proof documents uploaded yet.
                </p>
              )}

              {/* Upload button — only show if under limit */}
              {proofUrls.length < 5 && (
                <div className="flex items-center justify-between flex-wrap gap-3 pt-2 border-t border-white/5">
                  <span className="text-[10px] text-white/50">
                    {proofUrls.length}/5 documents uploaded
                  </span>
                  <label
                    htmlFor="verification-proof-upload"
                    className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition cursor-pointer ${
                      uploadingProof
                        ? "opacity-50 cursor-not-allowed bg-white/5 text-white/40"
                        : "bg-[#D8B76A] hover:opacity-90 text-[#070A13]"
                    }`}
                  >
                    {uploadingProof ? "Uploading..." : proofUrls.length > 0 ? "Add More Documents" : "Upload Proof Documents"}
                  </label>
                </div>
              )}

              {proofUrls.length >= 5 && (
                <p className="text-[10px] text-amber-400 italic text-center pt-2 border-t border-white/5">
                  <span className="inline-flex items-center justify-center gap-1">
                    <Icon icon="lucide:check" className="h-3 w-3" />
                    Maximum of 5 proof documents reached.
                  </span>
                </p>
              )}
            </div>

            {/* Hidden multi-file input */}
            <input
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              multiple
              onChange={handleProofUpload}
              className="hidden"
              id="verification-proof-upload"
              disabled={uploadingProof}
            />

            {uploadingProof && (
              <div className="flex items-center gap-2">
                <div className="animate-spin h-3.5 w-3.5 border-2 border-[#D8B76A] border-t-transparent rounded-full" />
                <span className="text-[10px] text-white/50">Uploading documents to Cloudinary...</span>
              </div>
            )}

            {/* Admin Verification Notes view for Venue Owners */}
            {watch("verificationNotes") && (
              <div className="bg-[#D8B76A]/5 border border-[#D8B76A]/20 p-3.5 rounded-xl space-y-1 text-xs">
                <span className="font-bold text-[#D8B76A] block text-[9px] uppercase tracking-wider">Message from Super Admin:</span>
                <p className="text-white/80 text-[11px] leading-relaxed italic">"{watch("verificationNotes")}"</p>
              </div>
            )}
          </div>
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
