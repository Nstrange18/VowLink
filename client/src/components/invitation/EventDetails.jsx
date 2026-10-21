import { Icon } from "@iconify/react";

import { getWeddingColorHex } from "../ColorPicker";
import { isDarkColor } from "../../utils/invitationColors";

const EventDetails = ({
  invitation,
  isFreeUser,
  venue,
  venueName,
  receptionLocation,
  receptionName,
  serif,
  weddingDate,
  formattedTimeWithFormat,
  dressCode,
  weddingColors,
  plusOnePolicy,
  kidsAllowed,
  setMapSelectAddress,
}) => (
  <section className="invite-section download-details-section px-4 sm:px-6 py-16 sm:py-20 text-center bg-[#070A13] relative z-10 border-t border-white/5">
    <p className="text-xs uppercase tracking-[0.35em] text-[#D8B76A] mb-4">
      The Details
    </p>
    <h2 className="font-serif text-3xl sm:text-4xl text-white mb-8 sm:mb-10">
      Wedding Day
    </h2>
    {!isFreeUser && (venue || receptionLocation) && (
      <p className="mx-auto -mt-5 mb-8 flex max-w-md items-center justify-center gap-1.5 rounded-full border border-[#D8B76A]/20 bg-[#D8B76A]/10 px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-[#D8B76A]">
        <Icon icon="lucide:map-pin" className="h-3.5 w-3.5" />
        Tap underlined locations for directions
      </p>
    )}
    <div className="mx-auto max-w-4xl grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
      {/* Date */}
      <div className="invite-detail-card rounded-2xl border border-white/10 bg-[#0D1220] px-6 py-8">
        <span className="text-2xl text-[#D8B76A]">◈</span>
        <p className="mt-4 text-xs uppercase tracking-widest text-white/40 mb-2">
          Date
        </p>
        <p className="text-white text-sm leading-6">
          {weddingDate
            ? new Date(weddingDate).toLocaleDateString("en-GB", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })
            : "To be announced"}
        </p>
      </div>

      {/* Time */}
      <div className="invite-detail-card rounded-2xl flex flex-col items-center border border-white/10 bg-[#0D1220] px-6 py-8">
        <Icon
          icon="mdi:clock-time-four-outline"
          className="h-7 w-7 text-[#D8B76A]"
        />
        <p className="mt-4 text-xs uppercase tracking-widest text-white/40 mb-2">
          Time
        </p>
        <p className="text-white text-sm leading-6">
          {formattedTimeWithFormat || "To be announced"}
        </p>
      </div>

      {/* Venue */}
      <div className="invite-detail-card rounded-2xl border border-white/10 bg-[#0D1220] px-6 py-8">
        <Icon
          icon="lucide:map-pin"
          className="mx-auto h-6 w-6 text-[#D8B76A]"
        />
        <p className="mt-4 text-xs uppercase tracking-widest text-white/40 mb-2">
          Venue
        </p>
        {venue ? (
          isFreeUser ? (
            <p className="text-white text-sm leading-6">
              {venueName || venue}
            </p>
          ) : (
            <button
              onClick={(e) => {
                e.preventDefault();
                setMapSelectAddress({
                  label: venueName || venue,
                  query: venue,
                });
              }}
              style={{
                ...serif,
                fontSize: "0.95rem",
                color: "inherit",
                textDecoration: "underline",
                textDecorationColor: "#B8963A55",
                textUnderlineOffset: "3px",
              }}
              className="invite-map-link cursor-pointer transition block w-full text-center"
            >
              {venueName || venue}
            </button>
          )
        ) : (
          <p className="text-white text-sm leading-6">To be announced</p>
        )}
      </div>

      {receptionLocation && (
        <div className="invite-detail-card rounded-2xl border border-white/10 bg-[#0D1220] px-6 py-8">
          <Icon
            icon="mdi:glass-cocktail"
            className="mx-auto h-6 w-6 text-[#D8B76A]"
          />
          <p className="mt-4 text-xs uppercase tracking-widest text-white/40 mb-2">
            Reception at
          </p>
          {isFreeUser ? (
            <p className="cursor-pointer text-white text-sm leading-6">
              {receptionName || receptionLocation}
            </p>
          ) : (
            <button
              onClick={(e) => {
                e.preventDefault();
                setMapSelectAddress({
                  label: receptionName || receptionLocation,
                  query: receptionLocation,
                });
              }}
              style={{
                ...serif,
                fontSize: "0.95rem",
                color: "inherit",
                textDecoration: "underline",
                textDecorationColor: "#B8963A55",
                textUnderlineOffset: "3px",
              }}
              className="invite-map-link cursor-pointer transition block w-full text-center"
            >
              {receptionName || receptionLocation}
            </button>
          )}
        </div>
      )}

      {/* Dress Code */}
      <div className="invite-detail-card rounded-2xl border border-white/10 bg-[#0D1220] px-6 py-8">
        <Icon icon="mdi:tie" className="mx-auto h-6 w-6 text-[#D8B76A]" />
        <p className="mt-4 text-xs uppercase tracking-widest text-white/40 mb-2">
          Dress Code
        </p>
        <p className="text-white text-sm leading-6">
          {dressCode || "To be announced"}
        </p>
      </div>

      {/* Colour of the Day */}
      <div className="invite-detail-card rounded-2xl border border-white/10 bg-[#0D1220] px-6 py-8">
        <Icon
          icon="lucide:palette"
          className="mx-auto h-6 w-6 text-[#D8B76A]"
        />
        <p className="mt-4 text-xs uppercase tracking-widest text-white/40 mb-3">
          Colour of the Day
        </p>
        {weddingColors.length > 0 ? (
          <div className="flex justify-center flex-wrap gap-2">
            {weddingColors.map((name, i) => {
              const hex = getWeddingColorHex(name);
              const isDark = isDarkColor(hex);
              return (
                <div
                  key={i}
                  className="flex items-center gap-2 rounded-full border px-3.5 py-1.5 shadow-sm"
                  style={{
                    borderColor: isDark
                      ? "rgba(255, 255, 255, 0.35)"
                      : `${hex}44`,
                    backgroundColor: isDark
                      ? "rgba(255, 255, 255, 0.08)"
                      : `${hex}11`,
                  }}
                >
                  <div
                    className={`h-5 w-5 rounded-full shrink-0 shadow-inner border ${isDark ? "border-white/60" : "border-white/20"}`}
                    style={{ background: hex }}
                  />
                  <span className="text-xs font-bold text-white tracking-wide">
                    {name}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-white text-sm">To be announced</p>
        )}
      </div>

      {/* Your Category */}
      <div className="invite-detail-card rounded-2xl border border-white/10 bg-[#0D1220] px-6 py-8">
        <Icon
          icon="lucide:sparkle"
          className="mx-auto h-6 w-6 text-[#D8B76A]"
        />
        <p className="mt-4 text-xs uppercase tracking-widest text-white/40 mb-2">
          Your Category
        </p>
        <p className="text-white text-sm leading-6">
          {invitation.category || "Guest"}
        </p>
      </div>

      {/* Additional guest policy */}
      <div className="invite-detail-card rounded-2xl border border-white/10 bg-[#0D1220] px-6 py-8">
        <Icon
          icon="lucide:user-plus"
          className="mx-auto h-6 w-6 text-[#D8B76A]"
        />
        <p className="mt-4 text-xs uppercase tracking-widest text-white/40 mb-2">
          Additional Guest
        </p>
        <p className="text-white text-sm leading-6">
          {plusOnePolicy === "plus_one_allowed"
            ? "Plus one allowed"
            : "Strictly by invitation"}
        </p>
      </div>

      {/* Children policy */}
      <div className="invite-detail-card rounded-2xl border border-white/10 bg-[#0D1220] px-6 py-8">
        <Icon
          icon="mdi:human-child"
          className="mx-auto h-6 w-6 text-[#D8B76A]"
        />
        <p className="mt-4 text-xs uppercase tracking-widest text-white/40 mb-2">
          Children
        </p>
        <p className="text-white text-sm leading-6">
          {kidsAllowed ? "Children are welcome" : "Adults only"}
        </p>
      </div>
    </div>
  </section>
);

export default EventDetails;
