import React from "react";
import { Controller } from "react-hook-form";
import ColorPicker from "../../components/ColorPicker";
import CustomSelect from "../../components/CustomSelect";
import { SettingsProvider, useSettings } from "../../context/SettingsContext";
import InvitationCardPreview from "../../components/settings/InvitationCardPreview";
import ThemeSelector from "../../components/settings/ThemeSelector";
import MusicSelector from "../../components/settings/MusicSelector";

const inputBase =
  "w-full rounded-xl border bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 outline-none transition";
const inputOk =
  "border-white/10 focus:border-[#D8B76A]/60 focus:ring-1 focus:ring-[#D8B76A]/30";
const inputErr = "border-red-400/50";
const cls = (err) => `${inputBase} ${err ? inputErr : inputOk}`;

const AdminSettingsPageContent = () => {
  const {
    storedUser,
    tier,
    isFree,
    isPlus,
    isPro,
    isFreeUser,

    galleryInputRef,
    customBgInputRef,
    couplePhotoInputRef,
    localAudioInputRef,

    weddingColors, setWeddingColors,
    cardTheme, setCardTheme,
    pageBgTemplate, setPageBgTemplate,
    customCardBg, setCustomCardBg,
    customTextColor, setCustomTextColor,
    customFontFamily, setCustomFontFamily,
    customVerticalOffset, setCustomVerticalOffset,
    customHorizontalOffset, setCustomHorizontalOffset,
    smartLayoutEnabled, setSmartLayoutEnabled,
    customTextSize, setCustomTextSize,
    customTextAlign, setCustomTextAlign,
    couplePhotoUrl, setCouplePhotoUrl,
    coupleOverlayOpacity, setCoupleOverlayOpacity,
    musicUrl, setMusicUrl,
    galleryPhotos, setGalleryPhotos,
    localAudioUrl, setLocalAudioUrl,
    localAudioName, setLocalAudioName,

    aiVibe, setAiVibe,
    aiGenerating, setAiGenerating,
    handleAiVibeGenerate,

    currentPassword, setCurrentPassword,
    newPassword, setNewPassword,
    confirmNewPassword, setConfirmNewPassword,
    submittingPassword, setSubmittingPassword,
    handleChangePassword,

    showDeleteConfirm, setShowDeleteConfirm,
    deletePassword, setDeletePassword,
    submittingDelete, setSubmittingDelete,
    handleDeleteAccount,

    activeTab, setActiveTab,
    showResetConfirm, setShowResetConfirm,
    showCurrentPassword, setShowCurrentPassword,
    showNewPassword, setShowNewPassword,
    showConfirmNewPassword, setShowConfirmNewPassword,

    register,
    handleSubmit,
    watch,
    control,
    errors,
    isSubmitting,
    onSubmit,

    handlePhotoUpload,
    removePhoto,
    handleCustomCardBgUpload,
    handleCouplePhotoUpload,
    handleLocalAudioUpload,
    clearLocalAudio,
    handleResetAll,
    handleResetConfirm,
    getSmartTextColor,
    checkSmartAlignment,
    uploadToCloudinary,

    p1, p2, weddingDate, rsvpDeadline, venue, receptionLocation, dressCode, weddingTime,
    formattedTime,
    activeFont,
    priHex, secHex, terHex, selectedBgHex,
    cardStyles,
    primaryTextColor,
    accentColor,
    formattedDate,
  } = useSettings();

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto text-white">
      <div className="mb-6">
        <p className="text-xs uppercase tracking-[0.3em] text-[#D8B76A] mb-1">Account</p>
        <h2 className="font-serif text-3xl sm:text-4xl">Settings & Customization</h2>
        <p className="text-white/40 text-sm mt-1">
          Customize your wedding invitation card appearance, photo gallery, dress code, and venue preferences.
        </p>
      </div>

      {/* Glassmorphic Tabs Selector */}
      <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-8 border-b border-white/10 pb-4">
        {[
          { id: "details", label: "💍 Details", fullLabel: "💍 Wedding Details" },
          { id: "design", label: "🎨 Design", fullLabel: "🎨 Design & Theme" },
          { id: "media", label: "🎵 Music", fullLabel: "🎵 Media & Music" },
          { id: "security", label: "🔒 Security", fullLabel: "🔒 Security & Danger Zone" }
        ].map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              setActiveTab(tab.id);
              if (tab.id !== "security") {
                setShowDeleteConfirm(false);
              }
            }}
            className={`px-3 py-2 sm:px-5 sm:py-2.5 rounded-xl text-[10px] sm:text-xs font-semibold uppercase tracking-wider transition-all duration-300 ${activeTab === tab.id
              ? "bg-[#D8B76A] text-[#070A13] shadow-[0_8px_20px_rgba(216,183,106,0.25)]"
              : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
              }`}
          >
            <span className="sm:hidden">{tab.label}</span>
            <span className="hidden sm:inline">{tab.fullLabel}</span>
          </button>
        ))}
      </div>

      {/* Mobile Live Preview Indicator */}
      {activeTab !== "security" && (
        <div className="lg:hidden flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-[#D8B76A]/20 bg-[#D8B76A]/5 mb-6 text-xs text-white/80 animate-pulse">
          <div className="flex items-center gap-2">
            <span className="text-[#D8B76A] text-sm">👁️</span>
            <span>Live changes are updating on the card below</span>
          </div>
          <button
            type="button"
            onClick={() => {
              document.getElementById("live-card-preview")?.scrollIntoView({ behavior: "smooth" });
            }}
            className="text-[10px] uppercase font-bold text-[#D8B76A] hover:underline shrink-0 flex items-center gap-1"
          >
            Scroll to Preview ↓
          </button>
        </div>
      )}

      {/* Hidden file input for quick custom card design triggers from the preview */}
      <input
        ref={customBgInputRef}
        type="file"
        accept="image/*"
        onChange={handleCustomCardBgUpload}
        className="hidden"
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: Tabs/Forms container */}
        <div className={`col-span-12 ${activeTab === "security" ? "lg:col-span-12" : "lg:col-span-7"} space-y-6`}>

          {/* Main Form for Details, Design, and Media settings */}
          {(activeTab === "details" || activeTab === "design" || activeTab === "media") && (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 animate-fade-in">

              {/* TAB 1: Wedding Details */}
              {activeTab === "details" && (
                <div className="w-full">
                  <div className="p-3 sm:p-5 rounded-2xl border border-white/10 bg-[#0D1220] space-y-6">
                    <h3 className="text-sm font-semibold uppercase tracking-widest text-[#D8B76A]">1. Wedding Metadata</h3>

                    {/* Partner names */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="mb-1.5 block text-[10px] uppercase tracking-widest text-white/50">Partner 1 *</label>
                        <input id="settings-p1" {...register("partner1Name")} className={cls(errors.partner1Name)} />
                        {errors.partner1Name && <p className="mt-1 text-xs text-red-400">{errors.partner1Name.message}</p>}
                      </div>
                      <div>
                        <label className="mb-1.5 block text-[10px] uppercase tracking-widest text-white/50">Partner 2 *</label>
                        <input id="settings-p2" {...register("partner2Name")} className={cls(errors.partner2Name)} />
                        {errors.partner2Name && <p className="mt-1 text-xs text-red-400">{errors.partner2Name.message}</p>}
                      </div>
                    </div>

                    {/* Date / Time */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="mb-1.5 block text-[10px] uppercase tracking-widest text-white/50">Wedding Date</label>
                        <input
                          id="settings-wedding-date"
                          type="date"
                          {...register("weddingDate")}
                          className={`${cls(false)} scheme-dark text-xs`}
                        />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-[10px] uppercase tracking-widest text-white/50">Wedding Time</label>
                        <input
                          id="settings-wedding-time"
                          type="time"
                          {...register("weddingTime")}
                          className={`${cls(false)} scheme-dark text-xs`}
                        />
                        {weddingTime && (
                          <p className="mt-1.5 text-xs text-[#D8B76A] font-semibold">
                            Formatted Display: {new Date(`1970-01-01T${weddingTime}:00`).toLocaleTimeString("en-US", {
                              hour: "numeric",
                              minute: "2-digit",
                              hour12: true,
                            })}
                          </p>
                        )}
                        <p className="mt-1 text-[9px] text-white/30">Invitations display time in 12-hr format (e.g. 2:00 PM)</p>
                      </div>
                    </div>

                    {/* RSVP Deadline */}
                    <div>
                      <label className="mb-1.5 block text-[10px] uppercase tracking-widest text-white/50">RSVP Deadline</label>
                      <input
                        id="settings-rsvp-deadline"
                        type="date"
                        {...register("rsvpDeadline")}
                        max={weddingDate || undefined}
                        className={`${cls(false)} scheme-dark text-xs`}
                      />
                    </div>

                    {/* Venue Location */}
                    <div>
                      <label className="mb-1.5 block text-[10px] uppercase tracking-widest text-white/50">Ceremony Venue</label>
                      <input id="settings-venue" placeholder="e.g. The Grand Ballroom, Lekki" {...register("venue")} className={cls(false)} />
                    </div>

                    {/* Reception Location */}
                    <div>
                      <label className="mb-1.5 block text-[10px] uppercase tracking-widest text-white/50">Reception Venue</label>
                      <input
                        id="settings-reception-location"
                        placeholder="e.g. Reception Gardens, Lekki"
                        {...register("receptionLocation")}
                        className={cls(false)}
                      />
                    </div>

                    <div className="sm:col-span-2 bg-[#D8B76A]/5 border border-[#D8B76A]/20 p-3 rounded-xl flex items-start gap-2">
                      <span className="text-xs mt-0.5">⚠️</span>
                      <p className="text-[10px] text-white/70 leading-relaxed">
                        <strong className="text-[#D8B76A]">Location Precision:</strong> When adding locations, please be as precise as possible (include specific hall name, street address, or major landmarks). Guests will use these descriptions to look up routes and direct maps.
                      </p>
                    </div>

                    {/* Wedding Colours Selector */}
                    <div>
                      <label className="mb-1.5 block text-[10px] uppercase tracking-widest text-white/50 font-semibold">Wedding Colours</label>
                      <ColorPicker value={weddingColors} onChange={setWeddingColors} />
                      <p className="mt-1 text-[9px] text-white/30">
                        Pick up to 5 colours for your dress code & invitation. You can update later.
                      </p>
                    </div>

                    {/* Dress Code */}
                    <div>
                      <label className="mb-1.5 block text-[10px] uppercase tracking-widest text-white/50">Dress Code</label>
                      <input id="settings-dress-code" placeholder="e.g. Black Tie / Emerald Gold" {...register("dressCode")} className={cls(false)} />
                    </div>

                    {/* Guest Policies */}
                    <div className="space-y-4 border-t border-white/5 pt-4">
                      <div>
                        <label className="mb-1.5 block text-[10px] uppercase tracking-widest text-[#D8B76A]">Plus One Limit</label>
                        <Controller
                          name="plusOnePolicy"
                          control={control}
                          render={({ field }) => (
                            <CustomSelect
                              name={field.name}
                              value={field.value}
                              onChange={(e) => field.onChange(e.target.value)}
                              options={[
                                { value: "invitation_only", label: "Strictly by invitation" },
                                { value: "plus_one_allowed", label: "Plus one allowed" },
                              ]}
                            />
                          )}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <label className="text-[10px] uppercase tracking-widest text-white/50">Kids Allowed</label>
                        <input
                          type="checkbox"
                          {...register("kidsAllowed")}
                          className="h-4 w-4 rounded border-white/20 bg-white/10"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: Design & Theme */}
              {activeTab === "design" && (
                <div className="space-y-6">
                  <ThemeSelector />

                  {/* AI Theme suggestion tool (Pro Only) */}
                  <div className="p-3 sm:p-5 rounded-2xl border border-white/10 bg-[#0D1220] space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-sm font-semibold uppercase tracking-widest text-[#D8B76A]">3. AI Intelligent Theme Matcher</h3>
                      {isFree && (
                        <span className="text-[9px] uppercase font-bold tracking-wider text-white/30 bg-white/5 px-2 py-0.5 rounded">
                          Locked
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-white/40 leading-relaxed">
                      Select your desired wedding aesthetic/vibe, and our AI matcher will automatically coordinate corresponding themes, backgrounds, fonts, and colors for your invitation cards.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                      <div className="flex-1">
                        <select
                          disabled={!isPro}
                          className="w-full rounded-xl border border-white/10 bg-[#070A13] px-3 py-2 text-xs text-white outline-none focus:border-[#D8B76A]/60"
                          value={aiVibe}
                          onChange={(e) => setAiVibe(e.target.value)}
                        >
                          <option value="Royal Velvet">👑 Royal Velvet (Navy, Gold & Burgundy)</option>
                          <option value="Vintage Rose">🌹 Vintage Rose (Blush Pink, Sage & Serif)</option>
                          <option value="Starry Midnight">✨ Starry Midnight (Midnight Black & Silver)</option>
                          <option value="Emerald Garden">🌿 Emerald Garden (Emerald Green & Gold)</option>
                        </select>
                      </div>
                      <button
                        type="button"
                        onClick={handleAiVibeGenerate}
                        disabled={aiGenerating || !isPro}
                        className="px-5 py-2.5 rounded-xl bg-[#D8B76A] hover:bg-[#D8B76A]/90 text-xs font-bold uppercase tracking-wider text-[#070A13] transition disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {aiGenerating ? (
                          <>
                            <span className="animate-spin">🌀</span>
                            <span>Styling Vibe...</span>
                          </>
                        ) : (
                          <>
                            <span>🪄</span>
                            <span>Auto-Coordinate</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Couple Portrait Image (Autoplays as card backdrop) */}
                  <div className="p-3 sm:p-5 rounded-2xl border border-white/10 bg-[#0D1220] space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-sm font-semibold uppercase tracking-widest text-[#D8B76A]">4. Couple Portrait Page Background</h3>
                      {isFree && (
                        <span className="text-[9px] uppercase font-bold tracking-wider text-white/30 bg-white/5 px-2 py-0.5 rounded">
                          Locked
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-white/40 leading-relaxed">
                      Upload a romantic photo of the couple. It will serve as the fullscreen background backdrop behind your elegant invitation card.
                    </p>

                    <div className="space-y-4">
                      <div>
                        <input
                          ref={couplePhotoInputRef}
                          type="file"
                          accept="image/*"
                          disabled={isFree}
                          onChange={handleCouplePhotoUpload}
                          className="w-full text-xs text-white/40 file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-[#D8B76A]/10 file:text-[#D8B76A] hover:file:bg-[#D8B76A]/20 disabled:opacity-30"
                        />
                      </div>

                      {couplePhotoUrl && (
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <img src={couplePhotoUrl} alt="Couple portrait" className="h-16 w-16 rounded-xl object-cover border border-white/10" />
                            <button
                              type="button"
                              onClick={() => setCouplePhotoUrl("")}
                              className="px-3 py-1.5 rounded-lg border border-red-500/30 bg-red-500/10 text-[10px] font-semibold text-red-400 hover:bg-red-500/20 transition"
                            >
                              Delete Photo
                            </button>
                          </div>

                          <div>
                            <div className="flex justify-between text-[9px] text-white/50 uppercase mb-1">
                              <span>Overlay darkening opacity</span>
                              <span className="font-mono text-[#D8B76A]">{Math.round(coupleOverlayOpacity * 100)}%</span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="0.9"
                              step="0.05"
                              disabled={isFree}
                              className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-[#D8B76A] disabled:opacity-40"
                              value={coupleOverlayOpacity}
                              onChange={(e) => setCoupleOverlayOpacity(Number(e.target.value))}
                            />
                            <p className="text-[8px] text-white/30 mt-1">Darker overlay enhances the contrast and readability of your card overlay text.</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: Music & Photos */}
              {activeTab === "media" && (
                <MusicSelector />
              )}

              {/* BOTTOM SAVE BAR */}
              <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
                <button
                  type="button"
                  onClick={handleResetAll}
                  className="w-full sm:w-auto rounded-full bg-red-600/10 border border-red-500/30 px-6 py-3 text-xs font-semibold uppercase tracking-wider text-red-200 hover:bg-red-600/20 transition text-center"
                >
                  ↺ Reset Defaults
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  id="save-settings-btn"
                  className="w-full sm:w-auto rounded-full bg-linear-to-r from-[#D8B76A] to-[#F2D894] px-6 sm:px-10 py-3.5 text-xs font-semibold uppercase tracking-widest text-[#070A13] transition hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(216,183,106,0.3)] disabled:opacity-60 text-center"
                >
                  {isSubmitting ? "Saving Config..." : "Save Customizations"}
                </button>
              </div>
            </form>
          )}

          {/* TAB 4: Security & Danger Zone */}
          {activeTab === "security" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start animate-fade-in">
              {/* Change Password Card */}
              <div className="p-3 sm:p-5 rounded-2xl border border-white/10 bg-[#0D1220] space-y-4">
                <h3 className="text-sm font-semibold uppercase tracking-widest text-[#D8B76A]">7. Change Password</h3>
                <p className="text-[10px] text-white/40">Securely update your VowLink account password.</p>

                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-[9px] uppercase tracking-widest text-white/50 font-semibold">Current Password</label>
                    <div className="relative">
                      <input
                        type={showCurrentPassword ? "text" : "password"}
                        className="w-full rounded-xl border border-white/10 bg-white/5 pl-4 pr-10 py-2 text-xs text-white placeholder-white/30 outline-none focus:border-[#D8B76A]/60"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition text-xs select-none"
                      >
                        {showCurrentPassword ? "🙈" : "👁️"}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-[9px] uppercase tracking-widest text-white/50 font-semibold">New Password</label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? "text" : "password"}
                        className="w-full rounded-xl border border-white/10 bg-white/5 pl-4 pr-10 py-2 text-xs text-white placeholder-white/30 outline-none focus:border-[#D8B76A]/60"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Min 6 characters"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition text-xs select-none"
                      >
                        {showNewPassword ? "🙈" : "👁️"}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-[9px] uppercase tracking-widest text-white/50 font-semibold font-semibold">Confirm New Password</label>
                    <div className="relative">
                      <input
                        type={showConfirmNewPassword ? "text" : "password"}
                        className="w-full rounded-xl border border-white/10 bg-white/5 pl-4 pr-10 py-2 text-xs text-white placeholder-white/30 outline-none focus:border-[#D8B76A]/60"
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition text-xs select-none"
                      >
                        {showConfirmNewPassword ? "🙈" : "👁️"}
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleChangePassword}
                    disabled={submittingPassword}
                    className="w-full rounded-xl bg-[#D8B76A] py-2.5 text-xs font-semibold text-[#070A13] transition hover:opacity-90 disabled:opacity-50 mt-2"
                  >
                    {submittingPassword ? "Updating Password..." : "Update Password"}
                  </button>
                </div>
              </div>

              {/* Danger Zone Card */}
              <div className="p-3 sm:p-5 rounded-2xl border border-red-500/20 bg-[#1A0A0F] space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-widest text-red-400">8. Danger Zone</h3>
                    <p className="text-[10px] text-red-200/50 mt-1 max-w-xs leading-relaxed">
                      Permanently purge your VowLink account, invitations, and guest RSVPs. This action is irreversible.
                    </p>
                  </div>

                  {!showDeleteConfirm && (
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(true)}
                      className="px-4 py-2 rounded-xl bg-red-600/20 border border-red-500/30 text-xs font-semibold text-red-200 hover:bg-red-600/30 transition shrink-0 self-start sm:self-center"
                    >
                      Delete Account
                    </button>
                  )}
                </div>

                {showDeleteConfirm && (
                  <div className="space-y-3 pt-3 border-t border-red-500/10 animate-fade-in">
                    <div>
                      <label className="mb-1 block text-[9px] uppercase tracking-widest text-red-200/60 font-semibold">
                        Enter Password to Confirm Deletion
                      </label>
                      <input
                        type="password"
                        className="w-full rounded-xl border border-red-500/30 bg-white/5 px-4 py-2 text-xs text-white outline-none focus:border-red-500/60"
                        value={deletePassword}
                        onChange={(e) => setDeletePassword(e.target.value)}
                        placeholder="••••••••"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setShowDeleteConfirm(false)}
                        className="flex-1 rounded-xl bg-white/5 py-2 text-xs font-semibold text-white/70 hover:bg-white/10 transition"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleDeleteAccount}
                        disabled={submittingDelete}
                        className="flex-1 rounded-xl bg-red-600 py-2 text-xs font-semibold text-white hover:bg-red-700 transition disabled:opacity-50"
                      >
                        {submittingDelete ? "Deleting..." : "Confirm Delete"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Live Card Preview & Quick Upload Design (Pro Only) */}
        {activeTab !== "security" && (
          <InvitationCardPreview />
        )}
      </div>

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md animate-fade-in p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0D1220] p-6 shadow-2xl space-y-6">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <h3 className="text-lg font-semibold text-white">Reset Customizations?</h3>
                <p className="text-white/60 text-xs">
                  Are you sure you want to reset all design customizations to default? This will clear your custom background, couple photo, colors, fonts, and music selections.
                </p>
              </div>
            </div>
            
            <p className="text-[10px] text-[#D8B76A]/80 bg-[#D8B76A]/5 p-3 rounded-lg border border-[#D8B76A]/10">
              💡 Note: Make sure to click "Save Customizations" after resetting to apply these changes to your live cards.
            </p>
            
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider bg-white/5 text-white hover:bg-white/10 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResetConfirm}
                className="px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/35 transition"
              >
                Reset Customizations
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const AdminSettingsPage = () => {
  return (
    <SettingsProvider>
      <AdminSettingsPageContent />
    </SettingsProvider>
  );
};

export default AdminSettingsPage;
