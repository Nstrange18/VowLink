import { Icon } from "@iconify/react";

import { getSpotifyEmbedUrl } from "../../utils/spotify";

const MusicControls = ({
  musicUrl,
  showSpotifyPlayer,
  setShowSpotifyPlayer,
  isDirectAudio,
  isOpen,
  handleAudioToggle,
  isPlaying,
  accentColor,
}) => (
  <>
    {musicUrl && getSpotifyEmbedUrl(musicUrl) && (
      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3">
        {showSpotifyPlayer && (
          <div className="w-72 sm:w-80 p-3.5 rounded-2xl bg-[#0D1220]/90 backdrop-blur-md border border-[#D8B76A]/20 shadow-2xl animate-fade-in transition-all duration-300">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] uppercase tracking-widest text-[#D8B76A] font-semibold">
                Soundtrack Player
              </span>
              <button
                onClick={() => setShowSpotifyPlayer(false)}
                className="text-white/60 hover:text-white text-xs px-1.5 py-0.5 rounded hover:bg-white/10"
              >
                <Icon icon="lucide:x" className="h-3.5 w-3.5" />
              </button>
            </div>
            <iframe
              src={getSpotifyEmbedUrl(musicUrl)}
              width="100%"
              height="80"
              frameBorder="0"
              allowFullScreen=""
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
              className="rounded-xl border border-white/5"
            ></iframe>
          </div>
        )}
        <button
          onClick={() => setShowSpotifyPlayer(!showSpotifyPlayer)}
          className={`invite-audio-toggle h-12 w-12 rounded-full bg-[#1A2E4A] border border-[#D8B76A]/40 flex items-center justify-center text-lg text-[#D8B76A] shadow-xl hover:scale-110 active:scale-95 transition ${showSpotifyPlayer ? "ring-2 ring-[#D8B76A]" : ""}`}
          title="Play background soundtrack"
        >
          <Icon icon="lucide:music" className="h-5 w-5" />
        </button>
      </div>
    )}

    {/* Floating Direct Audio Play/Pause Button */}
    {isDirectAudio && isOpen && (
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={handleAudioToggle}
          className={`invite-audio-toggle h-12 w-12 rounded-full bg-[#1A2E4A] border flex items-center justify-center text-lg text-[#D8B76A] shadow-xl hover:scale-110 active:scale-95 transition-all duration-300 ${
            isPlaying ? "animate-pulse" : ""
          }`}
          style={{
            borderColor: isPlaying ? accentColor : "rgba(255,255,255,0.2)",
          }}
          title={isPlaying ? "Pause music" : "Play music"}
        >
          <Icon
            icon={isPlaying ? "lucide:pause" : "lucide:play"}
            className="h-5 w-5"
            style={{ color: accentColor || "#D8B76A" }}
          />
        </button>
      </div>
    )}
  </>
);

export default MusicControls;
