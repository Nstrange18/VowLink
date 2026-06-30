import React from "react";
import { Icon } from "@iconify/react";

const VenuePhotosGallery = ({
  photos,
  isBasic,
  isListed,
  fileInputRef,
  handlePhotoUpload,
  removePhoto,
  handleSubmit,
  onUpdateDetails,
  saving,
}) => {
  return (
    <div className="rounded-3xl border border-white/10 bg-[#0D1220] p-6 sm:p-8 space-y-6">
      <div className="flex justify-between items-start flex-wrap gap-4">
        <div>
          <h2 className="font-serif text-2xl">Venue Image Gallery</h2>
          <p className="text-xs text-white/40 mt-1">Upload high-resolution shots to display to prospective couples.</p>
        </div>
        <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-xl text-center">
          <span className="text-[10px] text-white/40 block">Staged Slots</span>
          <span className="text-lg font-bold font-mono text-[#D8B76A]">{photos.length} / {isBasic ? 3 : isListed ? 8 : 15}</span>
        </div>
      </div>

      {/* Upload Controls */}
      <div className="p-6 rounded-2xl border border-dashed border-white/10 bg-white/3 text-center space-y-3">
        <Icon icon="mdi:folder-image" className="mx-auto h-8 w-8 text-[#D8B76A]" />
        <p className="text-xs text-white/60">Upload venue cover and hall details photos</p>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handlePhotoUpload}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="px-6 py-2 rounded-xl bg-[#D8B76A]/10 border border-[#D8B76A]/30 text-[#D8B76A] hover:bg-[#D8B76A]/20 text-xs font-semibold uppercase tracking-wider transition cursor-pointer"
        >
          Browse Device Photos
        </button>
        <p className="text-[9px] text-white/30">Select image files (.jpg, .png). Up to 5MB.</p>
      </div>

      {/* Photo Grid */}
      {photos.length === 0 ? (
        <p className="text-center text-xs text-white/30 py-8">No photos uploaded yet. Staged photos will be listed here.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {photos.map((photo, index) => (
            <div key={index} className="h-32 rounded-xl overflow-hidden border border-white/10 relative group bg-white/5">
              <img src={photo} alt={`Venue ${index + 1}`} className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removePhoto(index)}
                className="absolute inset-0 bg-black/75 flex items-center justify-center text-[10px] text-red-400 font-bold uppercase tracking-wider opacity-0 group-hover:opacity-100 transition"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Save changes wrapper */}
      <div className="flex justify-end pt-4 border-t border-white/5">
        <button
          type="button"
          onClick={handleSubmit(onUpdateDetails)}
          disabled={saving}
          className="px-8 py-3 rounded-full bg-linear-to-r from-[#D8B76A] to-[#F2D894] text-xs font-bold uppercase tracking-widest text-[#070A13] hover:-translate-y-0.5 transition hover:shadow-lg disabled:opacity-60 cursor-pointer"
        >
          {saving ? "Saving..." : "Save Staged Photos"}
        </button>
      </div>
    </div>
  );
};

export default VenuePhotosGallery;
