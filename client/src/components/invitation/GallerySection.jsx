import { Icon } from "@iconify/react";

// Keep carousel state and interval ownership in InvitePage.
const GallerySection = ({
  galleryPhotos,
  galleryIndex,
  setGalleryIndex,
}) => (
  <section className="invite-section px-4 py-16 bg-[#090D19] border-t border-white/5 relative z-10 flex flex-col items-center download-exclude">
    <p className="text-xs uppercase tracking-[0.35em] text-[#D8B76A] mb-2 text-center">
      Love Story
    </p>
    <h2 className="font-serif text-3xl sm:text-4xl text-white mb-8 text-center">
      Our Gallery
    </h2>

    <div className="invite-feature-card invite-gallery-card w-full max-w-2xl rounded-3xl overflow-hidden border border-white/10 bg-[#070A13] p-3 sm:p-4 flex flex-col items-center">
      {/* Big slide */}
      <div className="invite-gallery-frame w-full aspect-4/5 sm:aspect-16/11 rounded-2xl overflow-hidden bg-white/5 relative">
        {galleryPhotos.map((photo, i) => (
          <img
            key={i}
            src={photo}
            alt={`Couple photo ${i + 1}`}
            className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ${
              i === galleryIndex
                ? "opacity-100 scale-100 z-10"
                : "opacity-0 scale-105 z-0 pointer-events-none"
            }`}
          />
        ))}
        {/* Carousel controls — SVG chevron arrows */}
        <div className="absolute inset-x-0 top-0 z-20 h-28 bg-linear-to-b from-black/50 to-transparent pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 z-20 h-32 bg-linear-to-t from-black/65 to-transparent pointer-events-none" />
        <div className="absolute left-4 top-4 z-30 inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/45 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white/90 backdrop-blur-md">
          <Icon
            icon="lucide:images"
            className="h-3.5 w-3.5 text-[#D8B76A]"
          />
          {galleryIndex + 1} / {galleryPhotos.length}
        </div>
        <button
          onClick={() =>
            setGalleryIndex((prev) =>
              prev === 0 ? galleryPhotos.length - 1 : prev - 1,
            )
          }
          className="invite-gallery-control absolute left-3 top-1/2 -translate-y-1/2 h-11 w-11 rounded-full bg-black/60 border border-white/15 flex items-center justify-center hover:bg-[#D8B76A]/20 hover:border-[#D8B76A]/40 transition-all duration-200 group z-30"
          aria-label="Previous photo"
        >
          <Icon
            icon="lucide:chevron-left"
            className="h-5 w-5 text-white/70 group-hover:text-[#D8B76A] transition-colors"
          />
        </button>
        <button
          onClick={() =>
            setGalleryIndex((prev) =>
              prev === galleryPhotos.length - 1 ? 0 : prev + 1,
            )
          }
          className="invite-gallery-control absolute right-3 top-1/2 -translate-y-1/2 h-11 w-11 rounded-full bg-black/60 border border-white/15 flex items-center justify-center hover:bg-[#D8B76A]/20 hover:border-[#D8B76A]/40 transition-all duration-200 group z-30"
          aria-label="Next photo"
        >
          <Icon
            icon="lucide:chevron-right"
            className="h-5 w-5 text-white/70 group-hover:text-[#D8B76A] transition-colors"
          />
        </button>
        <div className="absolute bottom-4 left-4 right-4 z-30">
          <div className="flex gap-1.5">
            {galleryPhotos.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setGalleryIndex(i)}
                className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${i === galleryIndex ? "bg-[#D8B76A]" : "bg-white/30 hover:bg-white/55"}`}
                aria-label={`Go to photo ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Thumbnails list */}
      <div className="invite-gallery-thumbs flex gap-2.5 mt-4 w-full overflow-x-auto pb-1 justify-start sm:justify-center no-scrollbar">
        {galleryPhotos.map((photo, i) => (
          <button
            key={i}
            onClick={() => setGalleryIndex(i)}
            className={`h-14 w-14 shrink-0 rounded-xl overflow-hidden border transition-all duration-200 ${
              i === galleryIndex
                ? "border-[#D8B76A] opacity-100 shadow-[0_0_0_3px_rgba(216,183,106,0.16)]"
                : "border-white/10 opacity-55 hover:opacity-90 hover:border-white/30"
            }`}
            aria-label={`Show gallery photo ${i + 1}`}
          >
            <img
              src={photo}
              alt=""
              className="w-full h-full object-cover"
            />
          </button>
        ))}
      </div>
    </div>
  </section>
);

export default GallerySection;
