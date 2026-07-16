import React from "react";
import { toast } from "react-toastify";
import { useSettings } from "../../context/SettingsContext";
import { Icon } from "@iconify/react";

const MusicSelector = () => {
  const {
    galleryPhotos,
    musicUrl,
    setMusicUrl,
    localAudioUrl,
    localAudioName,
    isFree,
    isPlus,
    isPro,
    galleryInputRef,
    localAudioInputRef,
    handlePhotoUpload,
    removePhoto,
    handleLocalAudioUpload,
    clearLocalAudio,
    getSpotifyEmbedUrl,
  } = useSettings();
  const handleCuratedSelect = (url) => {
    const curatedUrls = [
      "https://archive.org/download/20-piano-guys-lord-of-the-rings-the-hobbit/20%20Piano%20Guys%20-%20Christina%20Perri%20-%20A%20Thousand%20Years.mp3",
      "https://archive.org/download/fave2/Ed%20Sheeran%20-%20Perfect.mp3",
      "https://archive.org/download/fave2/Haley%20Reinhart%20-%20Cant%20Help%20Falling%20In%20Love%20With%20You.mp3",
      "https://archive.org/download/AlsPlaylistMixedGenre/John%20Legend%20-%20All%20of%20Me.mp3",
      "https://archive.org/download/AlsPlaylistMixedGenre/Ed%20Sheeran%20-%20Thinking%20Out%20Loud.mp3",
      "https://archive.org/download/wedding-march/Wedding%20March.mp3"
    ];
    const isCustom = localAudioUrl || (musicUrl && !curatedUrls.includes(musicUrl));
    if (isCustom) {
      toast.dismiss();
      toast.info(
        ({ closeToast }) => (
          <div className="space-y-3 p-1">
            <p className="text-xs font-semibold text-white leading-relaxed">
              Selecting a curated soundtrack will replace your custom uploaded or linked song. Proceed?
            </p>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => {
                  clearLocalAudio();
                  setMusicUrl(url);
                  closeToast();
                  toast.success("Switched to curated soundtrack!");
                }}
                className="px-3 py-1.5 rounded-lg bg-[#D8B76A] text-[#070A13] text-[10px] font-bold uppercase tracking-wider hover:opacity-90 active:scale-95 transition"
              >
                Confirm
              </button>
              <button
                type="button"
                onClick={closeToast}
                className="px-3 py-1.5 rounded-lg bg-white/10 text-white text-[10px] font-bold uppercase tracking-wider hover:bg-white/20 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        ),
        {
          position: "top-center",
          autoClose: false,
          closeOnClick: false,
          draggable: false,
          closeButton: false,
        }
      );
    } else {
      setMusicUrl(url);
    }
  };

  return (
    <div className="space-y-6">
      {/* Photo Gallery */}
      <div className="p-5 rounded-2xl border border-white/10 bg-[#0D1220] space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-semibold uppercase tracking-widest text-[#D8B76A]">5. Love Story Photo Gallery</h3>
          {isFree && (
            <span className="text-[9px] uppercase font-bold tracking-wider text-white/30 bg-white/5 px-2 py-0.5 rounded">
              Locked
            </span>
          )}
        </div>

        <div>
          <label className="block text-[10px] text-white/50 uppercase mb-2">
            Upload Gallery Photos ({galleryPhotos.length} / {isPro ? 15 : isPlus ? 5 : 0})
          </label>
          <input
            ref={galleryInputRef}
            disabled={isFree}
            type="file"
            multiple
            accept="image/*"
            onChange={handlePhotoUpload}
            className="w-full text-xs text-white/40 file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-[#D8B76A]/10 file:text-[#D8B76A] hover:file:bg-[#D8B76A]/20 disabled:opacity-30 disabled:cursor-not-allowed"
          />
          <p className="text-[9px] text-white/30 mt-1">
            {isPro ? "Upload up to 15 high-res photos." : isPlus ? "Upload up to 5 photos." : "Gallery is locked. Upgrade to Plus/Pro."}
          </p>

          {/* Photos grid */}
          {galleryPhotos.length > 0 && (
            <div className="grid grid-cols-3 gap-3 mt-4">
              {galleryPhotos.map((photo, index) => (
                <div key={index} className="h-16 rounded-xl border border-white/10 overflow-hidden relative group">
                  <img src={photo} alt={`Couple ${index + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removePhoto(index)}
                    className="absolute top-1.5 right-1.5 z-10 w-5 h-5 rounded-full bg-black/70 text-red-200 hover:bg-red-300 flex items-center justify-center transition shadow-lg md:opacity-0 md:group-hover:opacity-100 cursor-pointer text-[10px] font-bold"
                    title="Delete photo"
                  >
                    <Icon icon="lucide:trash-2" className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Background Music */}
      <div className="min-w-0 rounded-2xl border border-white/10 bg-[#0D1220] p-3 sm:p-5 space-y-4">
        <div className="flex min-w-0 items-start justify-between gap-3">
          <h3 className="min-w-0 text-sm font-semibold uppercase tracking-widest text-[#D8B76A] leading-snug">6. Background Music (Plus / Pro)</h3>
          {isFree && (
            <span className="shrink-0 rounded bg-white/5 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white/30">
              Locked
            </span>
          )}
        </div>

        <div className="space-y-4">
          {/* Curated MP3 Soundtracks */}
          <div>
            <label className="block text-[10px] text-white/50 uppercase mb-2">Curated Background Soundtracks (Autoplays)</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                { name: "A Thousand Years (Piano)", url: "https://archive.org/download/20-piano-guys-lord-of-the-rings-the-hobbit/20%20Piano%20Guys%20-%20Christina%20Perri%20-%20A%20Thousand%20Years.mp3", icon: "mdi:piano" },
                { name: "Perfect (Acoustic Guitar)", url: "https://archive.org/download/fave2/Ed%20Sheeran%20-%20Perfect.mp3", icon: "mdi:guitar-acoustic" },
                { name: "Can't Help Falling in Love", url: "https://archive.org/download/fave2/Haley%20Reinhart%20-%20Cant%20Help%20Falling%20In%20Love%20With%20You.mp3", icon: "mdi:violin" },
                { name: "All of Me (Piano Solo)", url: "https://archive.org/download/AlsPlaylistMixedGenre/John%20Legend%20-%20All%20of%20Me.mp3", icon: "lucide:music" },
                { name: "Thinking Out Loud", url: "https://archive.org/download/AlsPlaylistMixedGenre/Ed%20Sheeran%20-%20Thinking%20Out%20Loud.mp3", icon: "lucide:heart" },
                { name: "Wedding March (Classical)", url: "https://archive.org/download/wedding-march/Wedding%20March.mp3", icon: "lucide:church" }
              ].map((p) => {
                const isSelected = musicUrl === p.url;
                return (
                  <button
                    key={p.name}
                    type="button"
                    disabled={isFree}
                    onClick={() => handleCuratedSelect(p.url)}
                    className={`flex min-w-0 items-center gap-2 rounded-xl border p-2.5 text-left transition ${isSelected
                      ? "border-[#D8B76A] bg-[#D8B76A]/10 text-white"
                      : "border-white/10 bg-white/3 text-white/70 hover:border-white/20"
                      } disabled:opacity-30 disabled:cursor-not-allowed`}
                  >
                    <Icon icon={p.icon} className="text-lg text-[#D8B76A] shrink-0" />
                    <div className="min-w-0 truncate">
                      <p className="text-xs font-semibold truncate">{p.name}</p>
                      <p className="text-[8px] text-white/40 truncate font-mono">wedding cover</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Upload from Device */}
          <div className="rounded-xl border border-[#D8B76A]/20 bg-[#D8B76A]/5 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-1.5 text-[10px] text-[#D8B76A] uppercase font-bold tracking-wider">
                <Icon icon="mdi:cellphone-arrow-down" className="h-3.5 w-3.5" />
                Upload from Your Device
              </label>
              {localAudioUrl && (
                <button type="button" onClick={clearLocalAudio} className="text-[9px] uppercase tracking-wider text-red-400 hover:underline">Remove</button>
              )}
            </div>
            <input
              ref={localAudioInputRef}
              type="file"
              accept="audio/*,.mp3,.m4a,.wav,.ogg,.flac"
              disabled={isFree}
              onChange={handleLocalAudioUpload}
              className="w-full text-xs text-white/50 file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-[10px] file:font-semibold file:bg-[#D8B76A]/15 file:text-[#D8B76A] hover:file:bg-[#D8B76A]/25 disabled:opacity-30 disabled:cursor-not-allowed"
            />
            {localAudioName && (
              <p className="flex items-center gap-1.5 text-[9px] text-[#D8B76A]/80 font-semibold truncate">
                <Icon icon="lucide:music" className="h-3 w-3 shrink-0" />
                <span className="truncate">{localAudioName}</span>
              </p>
            )}
            <div className="bg-emerald-950/20 border border-emerald-500/20 rounded-lg p-2">
              <p className="flex items-start gap-1.5 text-[8px] text-emerald-200/70 leading-relaxed">
                <Icon icon="lucide:cloud" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
                <span><strong>Cloudinary Cloud Hosting:</strong> Your uploaded song is securely saved in the cloud. Unlike Spotify widgets, uploaded soundtracks **will automatically play** for guests as soon as they open the welcome envelope!</span>
              </p>
            </div>
          </div>

          {/* Custom Input */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-[10px] text-white/50 uppercase">Or Enter Custom Soundtrack Link</label>
              {musicUrl && !localAudioUrl && (
                <button
                  type="button"
                  onClick={() => setMusicUrl("")}
                  className="text-[9px] uppercase tracking-wider text-red-400 hover:underline"
                >
                  Clear Music
                </button>
              )}
            </div>
            <input
              type="text"
              disabled={isFree}
              placeholder="e.g. Spotify playlist link or direct MP3 URL"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs text-white placeholder-white/30 outline-none focus:border-[#D8B76A]/60 disabled:opacity-40"
              value={localAudioUrl ? "" : musicUrl}
              onChange={(e) => setMusicUrl(e.target.value)}
              readOnly={!!localAudioUrl}
            />
            <p className="text-[8px] text-white/30 mt-1">
              Supports Spotify URLs or direct audio file URLs ending in .mp3, .m4a.
            </p>
            {musicUrl && musicUrl.includes("res.cloudinary.com") && (
              <div className="mt-2 flex items-center gap-1.5 text-[9px] font-bold text-emerald-400 bg-emerald-950/30 border border-emerald-500/20 px-2 py-1 rounded-lg w-fit">
                <Icon icon="lucide:cloud" className="w-3.5 h-3.5 text-emerald-400" />
                <span>Securely hosted on Cloudinary (Enables guest autoplay!)</span>
              </div>
            )}
            {musicUrl && getSpotifyEmbedUrl(musicUrl) && (
              <div className="mt-2 flex items-center gap-1.5 text-[9px] font-semibold text-amber-300 bg-amber-950/30 border border-amber-500/20 px-2 py-1 rounded-lg w-fit">
                <Icon icon="lucide:alert-triangle" className="w-3.5 h-3.5 text-amber-400" />
                <span>Spotify Widget: Autoplay blocked by browsers. Guests must manually tap Play. Upload an MP3 above for automated playback.</span>
              </div>
            )}
          </div>

          {/* Real-time Music Preview */}
          {musicUrl && (
            <div className="pt-2 border-t border-white/5 space-y-2">
              <p className="text-[8px] text-white/40 uppercase tracking-widest mb-1.5">Preview Player</p>
              {getSpotifyEmbedUrl(musicUrl) ? (
                <>
                  <iframe
                    src={getSpotifyEmbedUrl(musicUrl)}
                    width="100%"
                    height="80"
                    frameBorder="0"
                    allowFullScreen=""
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                    loading="lazy"
                    className="rounded-xl border border-white/10"
                    referrerPolicy="no-referrer-when-downgrade"
                  ></iframe>
                  <p className="flex items-start gap-1.5 text-[8px] text-white/40 leading-relaxed italic bg-white/3 p-2 rounded-lg border border-white/5">
                    <Icon icon="lucide:lightbulb" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#D8B76A]" />
                    <span>Tip: If Spotify preview says "Page not found", it is a known Spotify security conflict with your logged-in browser session. Try viewing in an Incognito window or logging out of Spotify.</span>
                  </p>
                </>
              ) : (
                <audio
                  src={musicUrl}
                  controls
                  className="w-full h-8 rounded-lg bg-white/5 text-xs focus:outline-none"
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MusicSelector;
