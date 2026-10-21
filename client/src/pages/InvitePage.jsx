import { useEffect, useMemo, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";
import { toPng } from "html-to-image";
import QRCode from "qrcode";
import { getTemplateLayout, getBlockStyles } from "../utils/templateLayouts";
import { normalizePublicImageUrl } from "../utils/publicAssets";
import api from "../utils/api";
import { rsvpSchema } from "../utils/schemas";
import {
  WEDDING_COLORS,
  getWeddingColorHex,
} from "../components/ColorPicker";
import { Icon } from "@iconify/react";
import { buildPublicUrl } from "../utils/siteUrl";
import MapSelector from "../components/invitation/MapSelector";
import MusicControls from "../components/invitation/MusicControls";
import Countdown from "../components/invitation/Countdown";
import { WISHES_PAGE_SIZE, getUniqueWishes } from "../utils/invitationWishes";
import WishWall from "../components/invitation/WishWall";
import RegistrySection from "../components/invitation/RegistrySection";
import RsvpModal from "../components/invitation/RsvpModal";
import EventDetails from "../components/invitation/EventDetails";
import ScheduleSection from "../components/invitation/ScheduleSection";
import GallerySection from "../components/invitation/GallerySection";
import { getSpotifyEmbedUrl } from "../utils/spotify";
import { isDarkColor, getReadableTextColor, resolveWeddingColors } from "../utils/invitationColors";
import { getInvitationCardStyles } from "../utils/invitationCardStyles";
import useCountdown from "../hooks/useCountdown";
import ThemeOrnaments from "../components/invitation/ThemeOrnaments";
import WeddingDayParticles from "../components/invitation/WeddingDayParticles";
import FrameBorder from "../components/invitation/FrameBorder";
import OrnamentDivider from "../components/invitation/OrnamentDivider";
import TemplateBackgroundGraphics from "../components/invitation/TemplateBackgroundGraphics";

const getGuestThemeStorageKey = (slug) => `vowlink_guest_theme_${slug}`;

const resolveGuestDefaultTheme = (defaultGuestTheme) => {
  if (defaultGuestTheme === "light") return "light";
  if (defaultGuestTheme === "system") {
    const prefersLight = window.matchMedia?.(
      "(prefers-color-scheme: light)",
    )?.matches;
    return prefersLight ? "light" : "dark";
  }
  return "dark";
};

const getInvitedGuestCount = (invitation, plusOnePolicy) => {
  const base = invitation?.allowedGuests || 1;
  if (plusOnePolicy === "plus_one_allowed") {
    return Math.min(base + 1, 10);
  }
  return base;
};

const InvitePage = ({ setThemePreference }) => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const cardRef = useRef(null);
  const [invitation, setInvitation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const downloadingRef = useRef(false);
  const [rsvpSubmitting, setRsvpSubmitting] = useState(false);
  const rsvpSubmittingRef = useRef(false);
  const [showScrollIndicator, setShowScrollIndicator] = useState(true);
  const [rsvpFormActive, setRsvpFormActive] = useState(false);
  const [scale, setScale] = useState(1);
  const [cardHeight, setCardHeight] = useState(0);

  // Premium state features
  const [showSpotifyPlayer, setShowSpotifyPlayer] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [audioReady, setAudioReady] = useState(false); // true once browser can start playing
  const [hiddenOverlay, setHiddenOverlay] = useState(false);
  const [mapSelectAddress, setMapSelectAddress] = useState(null);
  const [wishes, setWishes] = useState([]);
  const [visibleWishCount, setVisibleWishCount] = useState(WISHES_PAGE_SIZE);
  const audioRef = useRef(null);
  const wasPlayingRef = useRef(false);
  const pendingPlayRef = useRef(false); // tracks a play request made before audio was ready

  // Entry QR state
  const [showCheckInQr, setShowCheckInQr] = useState(false);
  const [checkInQrDataUrl, setCheckInQrDataUrl] = useState("");
  const [checkInQrLoading, setCheckInQrLoading] = useState(false);

  // Declare variables unconditionally at the very top of the render scope
  // to completely eliminate any Temporal Dead Zone (TDZ) reference errors.
  let musicUrl = "";
  let isDirectAudio = false;
  const galleryPhotos = useMemo(
    () => invitation?.userId?.galleryPhotos || [],
    [invitation?.userId?.galleryPhotos],
  );
  const customTextSize = invitation?.userId?.customTextSize || 1.0;
  const customTextSizeTitle = invitation?.userId?.customTextSizeTitle || 1.0;
  const visibleWishes = useMemo(
    () => wishes.slice(0, visibleWishCount),
    [visibleWishCount, wishes],
  );
  const checkInUrl = useMemo(
    () =>
      invitation?.checkInToken
        ? buildPublicUrl(`/check-in/${invitation.checkInToken}`)
        : "",
    [invitation?.checkInToken],
  );
  const hasMoreWishes = wishes.length > visibleWishCount;
  const canShowLessWishes = visibleWishCount > WISHES_PAGE_SIZE;
  const customTextSizeSubtitle =
    invitation?.userId?.customTextSizeSubtitle || 1.0;
  const customTextSizeCoupleNames =
    invitation?.userId?.customTextSizeCoupleNames || 1.0;
  const customTextSizeGreeting =
    invitation?.userId?.customTextSizeGreeting || 1.0;
  const customTextSizeMessage =
    invitation?.userId?.customTextSizeMessage || 1.0;
  const customTextSizeDetails =
    invitation?.userId?.customTextSizeDetails || 1.0;
  const customTextSizeReception =
    invitation?.userId?.customTextSizeReception || 1.0;
  const customTextSizeColors = invitation?.userId?.customTextSizeColors || 1.0;

  // Populate/re-assign variables once invitation details are asynchronously loaded.
  if (invitation?.userId) {
    musicUrl = invitation.userId.musicUrl || "";
    // Check if the couple has uploaded local device audio (stored in localStorage)
    // This only applies when viewing on the same device/browser where the audio was uploaded
    const ownerUserId = invitation.userId._id;
    if (ownerUserId) {
      try {
        const localAudio = localStorage.getItem(
          `vowlink_local_audio_url_${ownerUserId}`,
        );
        if (localAudio && localAudio.startsWith("data:audio")) {
          musicUrl = localAudio;
        }
      } catch {}
    }
    // Map old placeholder/commercial preset URLs to royalty-free public-domain style tracks.
    if (
      musicUrl &&
      !musicUrl.startsWith("data:") &&
      (musicUrl ===
        "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" ||
        musicUrl ===
          "https://archive.org/download/PianoGuysMusic/20%20Piano%20Guys%20-%20Christina%20Perri%20-%20A%20Thousand%20Years.mp3" ||
        musicUrl ===
          "https://archive.org/download/20-piano-guys-lord-of-the-rings-the-hobbit/20%20Piano%20Guys%20-%20Christina%20Perri%20-%20A%20Thousand%20Years.mp3")
    ) {
      musicUrl =
        "https://en.freepd.cn/api/music/526f6d616e63652f4c6f76656c79205069616e6f20536f6e672e6d7033";
    } else if (
      musicUrl &&
      !musicUrl.startsWith("data:") &&
      (musicUrl ===
        "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3" ||
        musicUrl ===
          "https://archive.org/download/fave2/Ed%20Sheeran%20-%20Perfect.mp3")
    ) {
      musicUrl =
        "https://en.freepd.cn/api/music/526f6d616e63652f427572742773205265717569656d2e6d7033";
    } else if (
      musicUrl &&
      !musicUrl.startsWith("data:") &&
      (musicUrl ===
        "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3" ||
        musicUrl ===
          "https://archive.org/download/CantHelpFallingInLoveWYou/Cant%20Help%20Falling%20In%20Love%20W%20You.mp3" ||
        musicUrl ===
          "https://archive.org/download/fave2/Haley%20Reinhart%20-%20Cant%20Help%20Falling%20In%20Love%20With%20You.mp3")
    ) {
      musicUrl =
        "https://en.freepd.cn/api/music/526f6d616e63652f49736f6c6174696f6e2057616c747a2e6d7033";
    } else if (
      musicUrl &&
      !musicUrl.startsWith("data:") &&
      (musicUrl ===
        "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3" ||
        musicUrl ===
          "https://archive.org/download/AlsPlaylistMixedGenre/John%20Legend%20-%20All%20of%20Me.mp3")
    ) {
      musicUrl =
        "https://en.freepd.cn/api/music/526f6d616e63652f4368616d7020646520746f75726e65736f6c2e6d7033";
    } else if (
      musicUrl &&
      !musicUrl.startsWith("data:") &&
      musicUrl ===
        "https://archive.org/download/AlsPlaylistMixedGenre/Ed%20Sheeran%20-%20Thinking%20Out%20Loud.mp3"
    ) {
      musicUrl =
        "https://en.freepd.cn/api/music/526f6d616e63652f42726f746865727320556e6974652e6d7033";
    } else if (
      musicUrl &&
      !musicUrl.startsWith("data:") &&
      (musicUrl ===
        "https://archive.org/download/100ClassicalMusicMasterpieces/18%20Mendelssohn%20-%20Wedding%20March.mp3" ||
        musicUrl ===
          "https://archive.org/download/ClassicalMusicMidi/Mendelssohn_-_Wedding_March.mp3" ||
        musicUrl ===
          "https://archive.org/download/wedding-march/Wedding%20March.mp3")
    ) {
      musicUrl =
        "https://en.freepd.cn/api/music/526f6d616e63652f486f72697a6f6e20466c6172652e6d7033";
    }
    isDirectAudio = musicUrl && !getSpotifyEmbedUrl(musicUrl);
  }

  const countdown = useCountdown(invitation?.userId?.weddingDate);

  // Pre-load audio as soon as the music URL is known (invitation data arrives).
  // Creating the Audio object here — rather than waiting for a JSX <audio> to
  // mount — means buffering starts during the envelope screen, so by the time
  // the guest clicks "Open Card" the audio is already ready.
  useEffect(() => {
    if (!isDirectAudio || !musicUrl) return;

    const audio = new Audio();
    audio.src = musicUrl;
    audio.loop = true;
    audio.preload = "auto";

    audio.addEventListener("canplay", () => {
      setAudioReady(true);
      if (pendingPlayRef.current) {
        pendingPlayRef.current = false;
        audio
          .play()
          .then(() => setIsPlaying(true))
          .catch((err) => console.log("Deferred playback failed", err));
      }
    });

    // Kick off buffering immediately
    audio.load();
    audioRef.current = audio;

    return () => {
      audio.pause();
      audio.src = "";
      audioRef.current = null;
      setAudioReady(false);
      setIsPlaying(false);
    };
    // Re-run only when the actual audio URL changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [musicUrl]);

  useEffect(() => {
    let cancelled = false;

    const renderCheckInQr = async () => {
      if (!showCheckInQr || !checkInUrl) {
        setCheckInQrDataUrl("");
        return;
      }

      setCheckInQrLoading(true);
      try {
        const dataUrl = await QRCode.toDataURL(checkInUrl, {
          width: 420,
          margin: 2,
          errorCorrectionLevel: "M",
          color: {
            dark: "#070A13",
            light: "#FFFFFF",
          },
        });
        if (!cancelled) setCheckInQrDataUrl(dataUrl);
      } catch {
        if (!cancelled) {
          setCheckInQrDataUrl("");
          toast.error("Unable to generate your entry QR code.");
        }
      } finally {
        if (!cancelled) setCheckInQrLoading(false);
      }
    };

    renderCheckInQr();

    return () => {
      cancelled = true;
    };
  }, [checkInUrl, showCheckInQr]);

  // Pause background music when user switches tabs or minimizes browser, and resume when they return
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (isPlaying && audioRef.current) {
          audioRef.current.pause();
          wasPlayingRef.current = true;
        }
      } else {
        if (wasPlayingRef.current && audioRef.current && isOpen) {
          audioRef.current
            .play()
            .then(() => {
              wasPlayingRef.current = false;
            })
            .catch((err) =>
              console.log("Failed to resume playback on tab return", err),
            );
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isPlaying, isOpen]);

  // Autoplay slideshow for the love story gallery
  useEffect(() => {
    if (galleryPhotos.length <= 1) return;
    const interval = setInterval(() => {
      setGalleryIndex((prev) =>
        prev === galleryPhotos.length - 1 ? 0 : prev + 1,
      );
    }, 4000);
    return () => clearInterval(interval);
  }, [galleryPhotos]);

  // Handle page scroll to show/hide the floating scroll down indicator
  // Pill persists until the user reaches the bottom of the page
  useEffect(() => {
    const handleScroll = () => {
      const distanceFromBottom =
        document.documentElement.scrollHeight -
        (window.scrollY + window.innerHeight);
      if (distanceFromBottom < 80) {
        setShowScrollIndicator(false);
      } else {
        setShowScrollIndicator(true);
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Handle dynamically scaling the invitation card to fit the viewport height
  useEffect(() => {
    if (!isOpen) return;

    // scaleLocked prevents address-bar-driven resize events (which fire constantly
    // on mobile as the user scrolls and the browser chrome collapses/expands)
    // from re-running the scale calculation after the initial stable measurement.
    let scaleLocked = false;

    const computeScale = () => {
      const card = cardRef.current;
      if (!card) return;

      const actualHeight = card.offsetHeight;
      setCardHeight(actualHeight);

      const viewportWidth = window.innerWidth;

      // Use visualViewport.height when available — it reflects the stable layout
      // viewport and does NOT change when the mobile browser address bar
      // collapses/expands during scroll, unlike window.innerHeight which causes
      // the jarring zoom-on-scroll glitch on iOS/Android.
      const viewportHeight =
        window.visualViewport?.height ?? window.innerHeight;

      // Card native design layout width is 608px (38rem)
      const nativeWidth = 608;

      // Compute scale needed to fit horizontally (allow 24px layout margins)
      const scaleX = (viewportWidth - 24) / nativeWidth;

      // Compute scale needed to fit vertically (allow 60px layout margins)
      const scaleY = (viewportHeight - 60) / actualHeight;

      let newScale;
      if (viewportWidth < 640) {
        // On mobile viewports, prioritize width so the card stays readable
        // and doesn't get squeezed into an ultra-thin column.
        newScale = scaleX;
      } else {
        // On larger screens (tablets/laptops), fit the most constrained dimension
        newScale = Math.min(scaleX, scaleY);
      }

      setScale(Math.min(1.25, newScale));
    };

    const handleResize = () => {
      // Ignore resize events triggered by mobile address-bar collapse/expand
      // after the scale has been locked in by the initial measurement cycle.
      if (scaleLocked) return;
      computeScale();
    };

    window.addEventListener("resize", handleResize);

    // Trigger at multiple intervals to handle slow font loading and image renders.
    // After the last timer fires we lock the scale so that subsequent mobile
    // address-bar resize events cannot trigger another jarring rescale.
    const timers = [
      setTimeout(computeScale, 100),
      setTimeout(computeScale, 300),
      setTimeout(computeScale, 800),
      setTimeout(() => {
        computeScale();
        scaleLocked = true;
      }, 1500),
    ];

    return () => {
      window.removeEventListener("resize", handleResize);
      timers.forEach(clearTimeout);
    };
  }, [isOpen, invitation, customTextSize]);

  const handleOpenInvitation = () => {
    setIsOpen(true);
    window.scrollTo(0, 0); // Reset scroll to top to center card in viewport
    if (audioRef.current) {
      // Always call .play() synchronously within the gesture handler.
      // On iOS Safari this "registers" the play in the gesture context so
      // the browser will play as soon as the audio is ready, even if it hasn't
      // buffered yet. On desktop, Chrome/Firefox also queue the play internally.
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => setIsPlaying(true))
          .catch(() => {
            // play() rejected — audio may not be buffered yet on slow networks.
            // Set pendingPlayRef so onCanPlay can retry (desktop fallback only;
            // iOS would have already queued the play above).
            pendingPlayRef.current = true;
          });
      }
    } else {
      // Audio element not mounted yet — flag for deferred play
      pendingPlayRef.current = true;
    }
    if (musicUrl && getSpotifyEmbedUrl(musicUrl)) {
      setShowSpotifyPlayer(true);
    }
    setTimeout(() => {
      setHiddenOverlay(true);
    }, 1000);
  };

  const handleAudioToggle = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch((err) => console.log("Playback failed", err));
    }
  };
  const rsvpDeadline = invitation?.userId?.rsvpDeadline;
  const deadlinePassed = rsvpDeadline
    ? new Date(rsvpDeadline) < new Date()
    : false;

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(rsvpSchema),
    defaultValues: {
      guestName: "",
      phone: "",
      attending: "Yes",
      numberOfGuests: 1,
      mealPreference: "No Preference",
      message: "",
    },
  });

  const attending = watch("attending");

  useEffect(() => {
    api
      .get(`/invitations/slug/${slug}`)
      .then((res) => {
        setInvitation(res.data);
        try {
          const savedTheme = localStorage.getItem(
            getGuestThemeStorageKey(slug),
          );
          const hasSavedTheme = savedTheme === "light" || savedTheme === "dark";
          const defaultGuestTheme =
            res.data?.userId?.defaultGuestTheme || "dark";
          if (typeof setThemePreference === "function") {
            setThemePreference(
              hasSavedTheme
                ? savedTheme
                : resolveGuestDefaultTheme(defaultGuestTheme),
              { savePreference: false },
            );
          }
        } catch {}
        setValue("guestName", res.data.guestName);
        if (res.data.rsvp) {
          for (const key of ["guestName", "guestEmail", "phone", "attending", "mealPreference", "message"]) {
            if (res.data.rsvp[key] != null) setValue(key, res.data.rsvp[key]);
          }
          setValue("numberOfGuests", res.data.rsvp.headcountConfirmed ? Math.max(1, res.data.rsvp.numberOfGuests || 1) : 1);
        }
      })
      .catch((err) => {
        if (err.response?.status === 404) setNotFound(true);
        else setNotFound(true); // Treat server errors as not-found to prevent null crash
      })
      .finally(() => setLoading(false));

    api
      .get(`/invitations/slug/${slug}/wishes`)
      .then((res) => {
        const uniqueWishes = getUniqueWishes(res.data);
        setWishes(uniqueWishes);
        setVisibleWishCount(WISHES_PAGE_SIZE);
      })
      .catch(() => {});
  }, [slug, setValue, setThemePreference]);

  // Component lifecycle hooks

  const onRsvpSubmit = async (data) => {
    if (rsvpSubmittingRef.current) return;

    rsvpSubmittingRef.current = true;
    setRsvpSubmitting(true);

    try {
      await api.post("/rsvps", {
        invitationId: invitation._id,
        guestName: data.guestName,
        guestEmail: data.guestEmail || "",
        phone: data.phone,
        attending: data.attending,
        numberOfGuests: data.attending === "Yes" ? data.numberOfGuests : 0,
        mealPreference: data.mealPreference,
        message: data.message,
      });
      navigate("/rsvp-response", {
        state: {
          partner1Name: invitation.userId?.partner1Name,
          partner2Name: invitation.userId?.partner2Name,
          weddingDate: invitation.userId?.weddingDate,
          attending: data.attending,
          registryEnabled: invitation.userId?.registryEnabled,
          registryBankName: invitation.userId?.registryBankName,
          registryAccountName: invitation.userId?.registryAccountName,
          registryAccountNumber: invitation.userId?.registryAccountNumber,
          registryNotes: invitation.userId?.registryNotes,
          honeymoonFundTarget: invitation.userId?.honeymoonFundTarget,
          honeymoonFundCurrent: invitation.userId?.honeymoonFundCurrent,
        },
      });
    } catch (err) {
      rsvpSubmittingRef.current = false;
      setRsvpSubmitting(false);
      toast.error(
        err.response?.data?.message ||
          "Failed to submit RSVP. Please try again.",
      );
    }
  };

  const handleOpenCheckInQr = () => {
    if (!checkInUrl) {
      toast.info(
        "Your entry QR is still being prepared. Please try again in a moment.",
      );
      return;
    }

    setShowCheckInQr(true);
  };

  const handleDownloadCheckInQr = () => {
    if (!checkInQrDataUrl) {
      toast.info("Your entry QR is still loading.");
      return;
    }

    const link = document.createElement("a");
    link.href = checkInQrDataUrl;
    link.download = `entry-qr-${invitation?.guestName?.toLowerCase().replace(/\s+/g, "-") || "guest"}.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handleDownload = async () => {
    if (downloadingRef.current) return;

    const cardElement = cardRef.current;
    if (!cardElement) return;

    let exportPoster = null;

    downloadingRef.current = true;
    setDownloading(true);
    toast.info("Preparing your invite image...", {
      autoClose: 1800,
      toastId: "invite-download-preparing",
    });

    cardElement.classList.add("is-exporting");

    try {
      if (document.fonts?.ready) {
        await document.fonts.ready;
      }

      await new Promise((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(resolve));
      });

      const exportWidth = cardElement.offsetWidth || 608;
      const isMobileExport = window.matchMedia?.("(max-width: 640px)")?.matches;
      const cardClone = cardElement.cloneNode(true);
      cardClone.classList.add("download-export-card");
      cardClone.style.width = `${exportWidth}px`;
      cardClone.style.maxWidth = `${exportWidth}px`;
      cardClone.style.transform = "none";
      cardClone.style.transformOrigin = "top center";
      cardClone.style.margin = "0 auto";

      const addDetail = (parent, label, value) => {
        const item = document.createElement("div");
        item.style.border = "1px solid rgba(216, 183, 106, 0.18)";
        item.style.borderRadius = "14px";
        item.style.background = "rgba(255, 255, 255, 0.045)";
        item.style.padding = "13px 15px";
        item.style.minHeight = "68px";
        item.style.display = "flex";
        item.style.flexDirection = "row";
        item.style.alignItems = "center";
        item.style.justifyContent = "space-between";
        item.style.gap = "14px";
        item.style.textAlign = "left";

        const labelNode = document.createElement("p");
        labelNode.textContent = label;
        labelNode.style.margin = "0";
        labelNode.style.fontSize = "9px";
        labelNode.style.letterSpacing = "0.16em";
        labelNode.style.textTransform = "uppercase";
        labelNode.style.color = "rgba(245, 235, 214, 0.58)";
        labelNode.style.fontWeight = "700";
        labelNode.style.flex = "0 0 42%";

        const valueNode = document.createElement("p");
        valueNode.textContent = value || "To be announced";
        valueNode.style.margin = "0";
        valueNode.style.fontFamily = "'Jost', Arial, sans-serif";
        valueNode.style.fontSize = "13px";
        valueNode.style.lineHeight = "1.35";
        valueNode.style.color = "#FFF8EA";
        valueNode.style.fontWeight = "600";
        valueNode.style.textAlign = "right";
        valueNode.style.flex = "1";
        valueNode.style.overflowWrap = "anywhere";

        item.appendChild(labelNode);
        item.appendChild(valueNode);
        parent.appendChild(item);
      };

      exportPoster = document.createElement("div");
      exportPoster.className = "download-export-poster";
      if (isMobileExport) {
        exportPoster.classList.add("is-mobile-export");
      }
      exportPoster.style.position = "fixed";
      exportPoster.style.left = "0";
      exportPoster.style.top = "0";
      exportPoster.style.zIndex = "-1";
      exportPoster.style.pointerEvents = "none";
      exportPoster.style.width = `${exportWidth}px`;
      exportPoster.style.boxSizing = "border-box";
      exportPoster.style.padding = "0 0 34px";
      exportPoster.style.background =
        "radial-gradient(ellipse 120% 80% at 50% 0%, #0D1730 0%, #070A13 60%)";
      exportPoster.style.fontFamily = activeFont;

      const detailsPanel = document.createElement("div");
      detailsPanel.style.width = `${exportWidth}px`;
      detailsPanel.style.boxSizing = "border-box";
      detailsPanel.style.padding = "26px 34px 0";
      detailsPanel.style.color = "#FFF8EA";
      detailsPanel.style.fontFamily = "'Jost', Arial, sans-serif";

      const eyebrow = document.createElement("p");
      eyebrow.textContent = "The Details";
      eyebrow.style.margin = "0 0 8px";
      eyebrow.style.textAlign = "center";
      eyebrow.style.fontSize = "10px";
      eyebrow.style.letterSpacing = "0.28em";
      eyebrow.style.textTransform = "uppercase";
      eyebrow.style.color = "#D8B76A";
      eyebrow.style.fontWeight = "800";

      const title = document.createElement("h2");
      title.textContent = "Wedding Day";
      title.style.margin = "0 0 20px";
      title.style.textAlign = "center";
      title.style.fontFamily = "'Cormorant Garamond', serif";
      title.style.fontSize = "30px";
      title.style.lineHeight = "1";
      title.style.color = "#FFF8EA";
      title.style.fontWeight = "500";

      const detailsGrid = document.createElement("div");
      detailsGrid.style.display = "grid";
      detailsGrid.style.gridTemplateColumns = "repeat(2, minmax(0, 1fr))";
      detailsGrid.style.gap = "10px";

      addDetail(detailsGrid, "Date", formattedDate || "To be announced");
      addDetail(
        detailsGrid,
        "Time",
        formattedTimeWithFormat || "To be announced",
      );
      addDetail(detailsGrid, "Venue", venueName || venue || "To be announced");
      if (receptionLocation) {
        addDetail(detailsGrid, "Reception", receptionName || receptionLocation);
      }
      addDetail(detailsGrid, "Dress Code", dressCode || "To be announced");
      addDetail(detailsGrid, "Category", invitation.category || "Guest");
      addDetail(
        detailsGrid,
        "Additional Guest",
        plusOnePolicy === "plus_one_allowed"
          ? "Plus one allowed"
          : "Strictly by invitation",
      );
      addDetail(
        detailsGrid,
        "Children",
        kidsAllowed ? "Children are welcome" : "Adults only",
      );

      if (weddingColors.length > 0) {
        const colorsItem = document.createElement("div");
        colorsItem.style.gridColumn = "1 / -1";
        colorsItem.style.border = "1px solid rgba(216, 183, 106, 0.18)";
        colorsItem.style.borderRadius = "14px";
        colorsItem.style.background = "rgba(255, 255, 255, 0.045)";
        colorsItem.style.padding = "14px 16px";
        colorsItem.style.textAlign = "center";

        const colorsLabel = document.createElement("p");
        colorsLabel.textContent = "Colour of the Day";
        colorsLabel.style.margin = "0 0 10px";
        colorsLabel.style.fontSize = "9px";
        colorsLabel.style.letterSpacing = "0.16em";
        colorsLabel.style.textTransform = "uppercase";
        colorsLabel.style.color = "rgba(245, 235, 214, 0.58)";
        colorsLabel.style.fontWeight = "700";

        const chips = document.createElement("div");
        chips.style.display = "flex";
        chips.style.flexWrap = "wrap";
        chips.style.justifyContent = "center";
        chips.style.gap = "8px";

        weddingColors.forEach((name) => {
          const hex = getWeddingColorHex(name);
          const chip = document.createElement("div");
          chip.style.display = "inline-flex";
          chip.style.alignItems = "center";
          chip.style.gap = "6px";
          chip.style.border = `1px solid ${hex}66`;
          chip.style.borderRadius = "999px";
          chip.style.padding = "6px 12px";
          chip.style.background = "rgba(255, 255, 255, 0.08)";
          chip.style.color = "#FFF8EA";
          chip.style.fontFamily = "'Jost', Arial, sans-serif";
          chip.style.fontSize = "10px";
          chip.style.fontWeight = "700";
          chip.style.whiteSpace = "nowrap";
          chip.style.flex = "0 0 auto";

          const dot = document.createElement("span");
          dot.style.width = "10px";
          dot.style.height = "10px";
          dot.style.borderRadius = "999px";
          dot.style.background = hex;
          dot.style.display = "inline-block";

          const text = document.createElement("span");
          text.textContent = name;
          text.style.whiteSpace = "nowrap";

          chip.appendChild(dot);
          chip.appendChild(text);
          chips.appendChild(chip);
        });

        colorsItem.appendChild(colorsLabel);
        colorsItem.appendChild(chips);
        detailsGrid.appendChild(colorsItem);
      }

      detailsPanel.appendChild(eyebrow);
      detailsPanel.appendChild(title);
      detailsPanel.appendChild(detailsGrid);
      exportPoster.appendChild(cardClone);
      exportPoster.appendChild(detailsPanel);
      document.body.appendChild(exportPoster);

      await new Promise((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(resolve));
      });

      const exportHeight = exportPoster.scrollHeight;

      const dataUrl = await toPng(exportPoster, {
        cacheBust: true,
        pixelRatio: 2,
        width: exportWidth,
        height: exportHeight,
        skipFonts: true,
        fontEmbedCSS: "",
        skipAutoScale: true,
        style: {
          width: `${exportWidth}px`,
          height: `${exportHeight}px`,
          background:
            "radial-gradient(ellipse 120% 80% at 50% 0%, #0D1730 0%, #070A13 60%)",
        },
        filter: (node) => {
          if (
            node.id === "rsvp-open-btn" ||
            node.id === "download-actions-bar"
          ) {
            return false;
          }
          if (node.classList && node.classList.contains("download-exclude")) {
            return false;
          }
          return true;
        },
      });
      const link = document.createElement("a");
      link.download = `invitation-${invitation.guestName?.toLowerCase().replace(/\s+/g, "-") || "card"}.png`;
      link.href = dataUrl;
      link.click();
      toast.success("Your invite image is ready.");
    } catch (e) {
      console.error("Download failed", e);
      toast.error("We couldn't prepare the invite image. Please try again.");
    } finally {
      cardElement.classList.remove("is-exporting");
      if (exportPoster?.parentNode) {
        exportPoster.parentNode.removeChild(exportPoster);
      }
      downloadingRef.current = false;
      setDownloading(false);
    }
  };

  if (loading)
    return (
      <section className="flex min-h-screen items-center justify-center bg-[#070A13]">
        <p className="text-white/40 text-sm tracking-widest uppercase animate-pulse">
          Loading your invitation...
        </p>
      </section>
    );

  if (notFound)
    return (
      <section className="flex min-h-screen items-center justify-center bg-[#070A13] text-center px-6">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[#D8B76A] mb-4">
            Not Found
          </p>
          <h1 className="font-serif text-5xl text-white mb-4">
            Invitation Not Found
          </h1>
          <div className="mx-auto my-6 h-px w-16 bg-[#D8B76A]" />
          <p className="text-white/60">Please check the link you received.</p>
        </div>
      </section>
    );


  const venue = invitation.userId?.venue;
  const venueName = invitation.userId?.venueName || "";
  const receptionLocation = invitation.userId?.receptionLocation || "";
  const receptionName = invitation.userId?.receptionName || "";
  const weddingDate = invitation.userId?.weddingDate;
  const weddingTime = invitation?.userId?.weddingTime;
  const dressCode = invitation.userId?.dressCode || "";
  const weddingColors = invitation.userId?.weddingColors || [];
  const plusOnePolicy = invitation.userId?.plusOnePolicy || "invitation_only";
  const kidsAllowed =
    typeof invitation.userId?.kidsAllowed === "boolean"
      ? invitation.userId.kidsAllowed
      : true;
  const invitedCount = getInvitedGuestCount(invitation, plusOnePolicy);

  // Premium settings unpacked
  const cardTheme = invitation.userId?.cardTheme || "floral";
  const customCardBg = normalizePublicImageUrl(invitation.userId?.customCardBg);
  const customTextColor = invitation.userId?.customTextColor || "#1A2E4A";
  const customTextColors = invitation.userId?.customTextColors || {};
  const customFontFamily = invitation.userId?.customFontFamily || "classic";
  const customVerticalOffset = invitation.userId?.customVerticalOffset || 0;
  const customHorizontalOffset = invitation.userId?.customHorizontalOffset || 0;
  const customTextBoldness = invitation.userId?.customTextBoldness || "normal";
  const customTextAlign = invitation.userId?.customTextAlign || "center";
  const userHasCustomAlignment =
    invitation.userId?.userHasCustomAlignment || false;
  const userHasCustomTextColor =
    invitation.userId?.userHasCustomTextColor || false;

  const layout = getTemplateLayout(cardTheme, customCardBg);
  const textAlignment = userHasCustomAlignment
    ? customTextAlign || "center"
    : layout.align || "center";

  const baseWeight =
    customTextBoldness === "bold"
      ? "700"
      : customTextBoldness === "medium"
        ? "500"
        : "400";
  const headingWeight =
    customTextBoldness === "bold"
      ? "950"
      : customTextBoldness === "medium"
        ? "750"
        : "600";
  const couplePhotoUrl = invitation.userId?.couplePhotoUrl || "";
  const coupleOverlayOpacity = invitation.userId?.coupleOverlayOpacity ?? 0.45;

  const script = { fontFamily: "'Dancing Script', cursive" };
  const serif = { fontFamily: "'Cormorant Garamond', serif" };

  const formattedDate = weddingDate
    ? new Date(weddingDate).toLocaleDateString("en-GB", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  const formattedTime = weddingTime
    ? new Date(`1970-01-01T${weddingTime}:00`).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
    : null;

  const formattedTimeWithFormat = formattedTime;

  const fontMap = {
    classic: "'Cormorant Garamond', serif",
    serif: "'Cormorant Garamond', serif",
    script: "'Dancing Script', cursive",
    modern: "'Outfit', sans-serif",
  };
  const activeFont = fontMap[customFontFamily] || fontMap.classic;

  const {
    primary: priHex,
    secondary: secHex,
    tertiary: terHex,
    selectedBgHex,
  } = resolveWeddingColors(weddingColors, WEDDING_COLORS);
  const isFreeUser = invitation.userId?.tier === "free";

  // Plan-based Card Theme styling configuration
  const cardStyles = getInvitationCardStyles({ activeFont, cardTheme, selectedBgHex, customTextColor, secHex, customCardBg });

  // Adjust theme color tags
  const primaryTextColor = cardStyles.color;
  const accentColor =
    cardTheme === "navy" || cardTheme === "forest" || cardTheme === "stardust"
      ? secHex
      : isFreeUser
        ? "#B8963A"
        : priHex;

  const isPlusTemplate = layout.tier === "plus";
  const isProTemplate = layout.tier === "pro";

  const scalePadding = (val) => {
    if (customTextSize > 1.0) {
      return Math.max(16, Math.round(val / customTextSize));
    }
    return val;
  };

  const customTextSizesObj = {
    global: customTextSize,
    title: customTextSizeTitle,
    subtitle: customTextSizeSubtitle,
    coupleNames: customTextSizeCoupleNames,
    greeting: customTextSizeGreeting,
    message: customTextSizeMessage,
    details: customTextSizeDetails,
    reception: customTextSizeReception,
    colors: customTextSizeColors,
  };

  const getBlockProps = (blockName, delay) => {
    const blockStyles = getBlockStyles(
      blockName,
      layout,
      customTextAlign,
      userHasCustomAlignment,
      "invite",
      customTextColor,
      primaryTextColor,
      userHasCustomTextColor,
      customTextSizesObj,
      customTextColors,
    );

    let className = "";
    const style = { ...blockStyles };

    if (isPlusTemplate) {
      className = "animate-plus-fade-up";
    } else if (isProTemplate) {
      className = "animate-pro-text-reveal";
      style.animationDelay = delay;
    }

    return { className, style };
  };

  const isEnvelopeDark = ["navy", "stardust", "forest", "custom"].includes(
    cardTheme,
  );
  const envelopeBg =
    cardTheme === "custom"
      ? "linear-gradient(to bottom, #0F172A, #070A13)"
      : cardStyles.background;
  const envelopeBgValue = String(envelopeBg || "").toLowerCase();
  const needsDarkEnvelopeText =
    isEnvelopeDark ||
    envelopeBgValue.includes("#070a13") ||
    envelopeBgValue.includes("#0f172a") ||
    envelopeBgValue.includes("navy") ||
    envelopeBgValue.includes("0d0b1c") ||
    envelopeBgValue.includes("05040b") ||
    envelopeBgValue.includes("071c11") ||
    envelopeBgValue.includes("030c07") ||
    envelopeBgValue.includes("elegant_gold_frame_with_navy_backdrop");
  const envelopeTextColor = isEnvelopeDark
    ? "#F8ECD2"
    : selectedBgHex
      ? getReadableTextColor(selectedBgHex, customTextColor, "#1A2E4A", "#FFFFFF")
      : customTextColor && customTextColor !== "#1A2E4A"
        ? customTextColor
        : "#1A2E4A";
  const envelopeTextStyle = {
    color: needsDarkEnvelopeText ? "#F8ECD2" : envelopeTextColor,
    WebkitTextFillColor: needsDarkEnvelopeText ? "#F8ECD2" : envelopeTextColor,
    textShadow: needsDarkEnvelopeText
      ? "0 2px 18px rgba(0,0,0,0.72), 0 0 18px rgba(248,236,210,0.12)"
      : "0 1px 8px rgba(255,255,255,0.45)",
  };
  const envelopeAccentColor = isEnvelopeDark
    ? secHex
    : isFreeUser
      ? "#B8963A"
      : priHex;
  const pulseColor = isEnvelopeDark ? envelopeAccentColor : envelopeTextColor;

  const isTodayWeddingDay =
    weddingDate &&
    new Date(weddingDate).toDateString() === new Date().toDateString();

  return (
    <div
      className={`invite-page min-h-screen relative ${isOpen ? "overflow-x-hidden" : "h-screen overflow-hidden"}`}
      style={{ background: "#070A13" }}
    >
      {showCheckInQr && (
        <div className="download-exclude fixed inset-0 z-90 flex items-end justify-center bg-black/65 px-4 pb-4 backdrop-blur-md sm:items-center sm:pb-0">
          <div className="w-full max-w-sm rounded-3xl border border-[#D8B76A]/25 bg-[#0D1220] p-5 text-white shadow-2xl">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#D8B76A]">
                  Entry QR
                </p>
                <h3 className="mt-2 font-serif text-2xl">
                  {invitation.guestName}
                </h3>
                <p className="mt-1 text-xs text-white/45">
                  Show this at the entrance for usher check-in.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCheckInQr(false)}
                className="rounded-full border border-white/10 bg-white/5 p-2 text-white/55 transition hover:text-white"
                aria-label="Close entry QR"
              >
                <Icon icon="lucide:x" className="h-4 w-4" />
              </button>
            </div>

            <div className="flex min-h-72 items-center justify-center rounded-3xl bg-white p-4">
              {checkInQrLoading ? (
                <div className="flex flex-col items-center gap-3 text-[#070A13]/55">
                  <Icon
                    icon="lucide:loader-2"
                    className="h-8 w-8 animate-spin"
                  />
                  <p className="text-[10px] font-bold uppercase tracking-wider">
                    Preparing QR
                  </p>
                </div>
              ) : checkInQrDataUrl ? (
                <img
                  src={checkInQrDataUrl}
                  alt={`Entry QR for ${invitation.guestName}`}
                  className="h-64 w-64 max-w-full"
                />
              ) : (
                <div className="flex flex-col items-center gap-3 text-center text-[#070A13]/55">
                  <Icon icon="lucide:triangle-alert" className="h-8 w-8" />
                  <p className="text-[10px] font-bold uppercase tracking-wider">
                    QR unavailable
                  </p>
                </div>
              )}
            </div>

            <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-3 text-[11px] leading-relaxed text-white/55">
              Ushers will scan this code and enter the event PIN on their own
              device. This QR alone cannot check you in.
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(checkInUrl);
                  toast.success("Entry QR link copied.");
                }}
                disabled={!checkInUrl}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-white/75 transition hover:bg-white/10 disabled:opacity-50"
              >
                <Icon icon="lucide:copy" className="h-3.5 w-3.5" />
                Copy Link
              </button>
              <button
                type="button"
                onClick={handleDownloadCheckInQr}
                disabled={checkInQrLoading || !checkInQrDataUrl}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#D8B76A] px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-[#070A13] transition hover:bg-[#F2D894] disabled:opacity-60"
              >
                <Icon icon="lucide:download" className="h-3.5 w-3.5" />
                Save QR
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .is-exporting .download-exclude,
        .is-exporting #rsvp-open-btn,
        .is-exporting #download-actions-bar {
          display: none !important;
        }
        .download-export-poster,
        .download-export-poster * {
          animation: none !important;
          transition: none !important;
        }
        .download-export-poster .animate-plus-fade-in,
        .download-export-poster .animate-plus-fade-up,
        .download-export-poster .animate-pro-card-entrance,
        .download-export-poster .animate-pro-text-reveal {
          opacity: 1 !important;
          filter: none !important;
        }
        .download-export-poster .download-export-card {
          opacity: 1 !important;
          transform: none !important;
        }
        .download-export-poster.is-mobile-export .download-export-card .invite-card-content {
          min-height: 720px !important;
          padding-top: 76px !important;
          padding-bottom: 88px !important;
        }
        .download-export-poster.is-mobile-export .download-export-card .invite-card-inner {
          max-width: 82% !important;
        }
        .download-export-poster.is-mobile-export .download-export-card .invite-card-message {
          margin-bottom: 30px !important;
          line-height: 1.74 !important;
        }
        .download-export-poster.is-mobile-export .download-export-card .invite-card-detail {
          display: block !important;
          margin-bottom: 11px !important;
          line-height: 1.48 !important;
        }
        .download-export-poster.is-mobile-export .download-export-card .invite-card-location-text {
          margin-bottom: 13px !important;
          line-height: 1.48 !important;
        }
        .download-export-poster.is-mobile-export .download-export-card .invite-card-reception {
          margin-bottom: 20px !important;
        }
        .download-export-poster.is-mobile-export .download-export-card .invite-card-bottom-divider {
          margin-top: 8px !important;
          margin-bottom: 12px !important;
        }
        .download-export-poster.is-mobile-export .download-export-card .invite-card-colors {
          margin-top: 6px !important;
          margin-bottom: 20px !important;
        }
        .download-export-poster.is-mobile-export .download-export-card .invite-card-color-chips {
          gap: 7px 8px !important;
        }
      `}</style>
      {downloading && (
        <div className="download-exclude fixed inset-0 z-80 flex items-center justify-center bg-[#070A13]/72 px-6 backdrop-blur-md">
          <div className="w-full max-w-xs rounded-3xl border border-[#D8B76A]/30 bg-[#0D1220]/95 p-6 text-center shadow-[0_24px_80px_rgba(0,0,0,0.55)]">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-[#D8B76A]/40 bg-[#D8B76A]/10">
              <Icon
                icon="lucide:download"
                className="h-6 w-6 animate-pulse text-[#D8B76A]"
              />
            </div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#D8B76A]">
              Preparing Invite
            </p>
            <p className="mt-2 text-sm leading-6 text-white/70">
              We are arranging the card and wedding details into a downloadable
              image.
            </p>
            <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div className="h-full w-full animate-pulse rounded-full bg-linear-to-r from-[#D8B76A] to-[#F2D894]" />
            </div>
          </div>
        </div>
      )}
      {isTodayWeddingDay && <WeddingDayParticles />}
      {isTodayWeddingDay && (
        <div className="bg-linear-to-r from-[#D8B76A] via-[#F2D894] to-[#D8B76A] text-[#070A13] px-4 py-3 text-center text-xs font-bold uppercase tracking-widest relative z-35 shadow-lg flex items-center justify-center gap-2">
          <Icon icon="mdi:ring" className="h-4 w-4" />
          <span>
            Happy Wedding Day! Today is the Big Day for{" "}
            {invitation.userId?.partner1Name} &{" "}
            {invitation.userId?.partner2Name}!
          </span>
          <Icon icon="lucide:sparkles" className="h-4 w-4" />
        </div>
      )}
      {/* Premium page background: deep dark with radial gold bokeh */}
      <div
        className="pointer-events-none fixed inset-x-0 top-0 h-screen z-0"
        aria-hidden="true"
      >
        {/* Dark base */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 120% 80% at 50% 0%, #0D1730 0%, #070A13 60%)",
          }}
        />

        {/* Page Background Image (Couple Photo) */}
        {couplePhotoUrl && (
          <>
            <img
              src={couplePhotoUrl}
              alt=""
              className="absolute inset-0 h-full w-full object-cover object-center scale-105 blur-xl opacity-55 transition-all duration-500"
              aria-hidden="true"
            />
            <img
              src={couplePhotoUrl}
              alt=""
              className="absolute inset-0 h-full w-full object-contain object-center transition-all duration-500"
              aria-hidden="true"
            />
            <div
              className="absolute inset-0 transition-all duration-300"
              style={{
                backgroundColor: `rgba(0, 0, 0, ${coupleOverlayOpacity})`,
              }}
            />
          </>
        )}

        {/* Gold shimmer top-left */}
        <div
          className="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-10"
          style={{
            background: "radial-gradient(circle, #D8B76A 0%, transparent 70%)",
            filter: "blur(60px)",
          }}
        />
        {/* Gold shimmer bottom-right */}
        <div
          className="absolute -bottom-40 -right-20 w-96 h-96 rounded-full opacity-8"
          style={{
            background: "radial-gradient(circle, #B8963A 0%, transparent 70%)",
            filter: "blur(80px)",
          }}
        />
        {/* Subtle star dots */}
        <div className="absolute top-10 left-[15%] w-1 h-1 rounded-full bg-white opacity-30" />
        <div className="absolute top-24 left-[42%] w-0.5 h-0.5 rounded-full bg-white opacity-20" />
        <div className="absolute top-16 right-[25%] w-1 h-1 rounded-full bg-[#D8B76A] opacity-25" />
        <div className="absolute top-48 left-[70%] w-0.5 h-0.5 rounded-full bg-white opacity-15" />
        <div className="absolute top-[35%] left-[8%] w-1 h-1 rounded-full bg-white opacity-20" />
        <div className="absolute top-[60%] right-[12%] w-0.5 h-0.5 rounded-full bg-[#D8B76A] opacity-20" />
        <div className="absolute bottom-[30%] left-[30%] w-1 h-1 rounded-full bg-white opacity-15" />
      </div>
      {/* Audio is managed programmatically via audioRef (see useEffect above) */}

      {/* Fullscreen Envelope Welcome Overlay */}
      {!hiddenOverlay && (
        <div
          className={`fixed inset-0 z-50 flex flex-col items-center justify-center transition-all duration-1000 ease-in-out select-none ${
            isOpen
              ? "translate-y-[-100vh] opacity-0 pointer-events-none"
              : "translate-y-0 opacity-100"
          }`}
          style={{
            background: envelopeBg,
            fontFamily: cardStyles.fontFamily,
          }}
        >
          {<ThemeOrnaments theme={cardTheme} pri={priHex} sec={secHex} ter={terHex} isFreeUser={isFreeUser} />}

          <div className="max-w-md w-full px-8 text-center flex flex-col items-center justify-center z-10">
            <p
              className="text-xs uppercase tracking-[0.4em] mb-3 opacity-60 font-semibold"
              style={envelopeTextStyle}
            >
              VowLink Invitation
            </p>

            <div
              className="my-6 h-px w-24"
              style={{ background: envelopeAccentColor, opacity: 0.6 }}
            />

            <p
              className="italic mb-2"
              style={{
                ...envelopeTextStyle,
                ...script,
                fontSize: "1.8rem",
              }}
            >
              You are cordially invited to the wedding of
            </p>

            <h1
              className="mb-8"
              style={{
                ...envelopeTextStyle,
                ...script,
                fontSize: "3.2rem",
                lineHeight: 1.1,
              }}
            >
              {invitation.userId?.partner1Name || "Partner 1"}
              <span
                className="block my-1 text-2xl font-serif not-italic opacity-80"
                style={envelopeTextStyle}
              >
                &
              </span>
              {invitation.userId?.partner2Name || "Partner 2"}
            </h1>

            <button
              onClick={handleOpenInvitation}
              className="relative group h-28 w-28 rounded-full flex flex-col items-center justify-center shadow-[0_15px_35px_rgba(0,0,0,0.3)] border transition-all duration-500 hover:scale-105 active:scale-95"
              style={{
                backgroundColor: envelopeAccentColor,
                borderColor: `${envelopeTextColor}22`,
                color: isEnvelopeDark ? "#070A13" : "#FFFFFF",
              }}
            >
              {/* Outer pulsing ring for high-contrast visibility on light/dark themes */}
              <span
                className="absolute -inset-2 rounded-full animate-pulse pointer-events-none"
                style={{
                  border: `2px solid ${pulseColor}`,
                  boxShadow: `0 0 20px ${pulseColor}${isEnvelopeDark ? "55" : "33"}`,
                  opacity: isEnvelopeDark ? 0.4 : 0.6,
                }}
              />
              {/* Inner expanding ping ring */}
              <span
                className="absolute inset-0 rounded-full animate-ping pointer-events-none"
                style={{
                  backgroundColor: pulseColor,
                  opacity: isEnvelopeDark ? 0.6 : 0.25,
                }}
              />
              <div
                className="absolute inset-2 rounded-full border border-dashed opacity-40"
                style={{ borderColor: isEnvelopeDark ? "#FFFFFF" : "#070A13" }}
              />
              <Icon icon="lucide:mail" className="mb-1 h-6 w-6 z-10" />
              <span className="text-[10px] uppercase font-bold tracking-widest z-10">
                Open
              </span>
            </button>

            <p
              className="mt-8 text-[10px] uppercase tracking-[0.2em] opacity-40"
              style={envelopeTextStyle}
            >
              {musicUrl
                ? "Click to unveil details & play music"
                : "Click to unveil details"}
            </p>
            {/* Music buffering hint — only visible while audio is still loading */}
            {isDirectAudio && !audioReady && (
              <p
                className="mt-2 text-[9px] uppercase tracking-widest opacity-30 flex items-center gap-1"
                style={envelopeTextStyle}
              >
                <Icon icon="lucide:loader-2" className="h-3 w-3 animate-spin" />
                Loading music...
              </p>
            )}
          </div>
        </div>
      )}

      {/* Scroll Down Floating Indicator (un-downloadable) */}
      {isOpen && showScrollIndicator && !showForm && !rsvpFormActive && (
        <div
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-35 flex items-center gap-2 select-none animate-bounce download-exclude bg-[#0D1220]/75 backdrop-blur-md border border-[#D8B76A]/30 px-4 py-2.5 rounded-full shadow-[0_10px_30px_rgba(0,0,0,0.6)]"
          style={{
            color: "#D8B76A",
            pointerEvents: "none",
            transition: "opacity 0.6s ease",
          }}
        >
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#E6C45A ]">
            Scroll down for details
          </span>
          <span className="text-xs font-bold animate-pulse text-[#E6C45A ]">
            ↓
          </span>
        </div>
      )}

      {/* Background Animated Stardust Effect (Pro) */}
      {cardTheme === "stardust" && (
        <div className="absolute inset-0 pointer-events-none z-0">
          <div className="absolute inset-0 bg-[#06080F]" />
          {/* Sparkles simulation using styled animated divs */}
          <div
            className="absolute -bottom-25 left-1/4 h-2 w-2 rounded-full bg-yellow-400 opacity-60 animate-bounce"
            style={{ animationDuration: "5s", animationDelay: "1s" }}
          />
          <div
            className="absolute -bottom-25 left-1/2 h-3 w-3 rounded-full bg-white opacity-40 animate-bounce"
            style={{ animationDuration: "7s", animationDelay: "3s" }}
          />
          <div
            className="absolute -bottom-25 left-3/4 h-2 w-2 rounded-full bg-yellow-200 opacity-80 animate-bounce"
            style={{ animationDuration: "4s", animationDelay: "2s" }}
          />
          <div
            className="absolute -bottom-25 left-10 h-3 w-3 rounded-full bg-yellow-300 opacity-50 animate-bounce"
            style={{ animationDuration: "8s", animationDelay: "0s" }}
          />
        </div>
      )}

      {/* Background Animated Forest Leaves Effect (Pro) */}
      {cardTheme === "forest" && (
        <div className="absolute inset-0 pointer-events-none z-0">
          <div className="absolute inset-0 bg-[#09150E]" />
          <Icon
            icon="mdi:leaf"
            className="absolute top-10 left-10 h-8 w-8 rotate-45 select-none text-amber-500/20"
          />
          <Icon
            icon="mdi:leaf-maple"
            className="absolute top-40 right-20 h-7 w-7 -rotate-12 select-none text-amber-500/10"
          />
          <Icon
            icon="mdi:leaf"
            className="absolute bottom-60 left-1/3 h-6 w-6 rotate-90 select-none text-amber-500/15"
          />
        </div>
      )}

      {/* Floating Audio Soundtrack Player (Spotify) */}
      <MusicControls
        musicUrl={musicUrl}
        showSpotifyPlayer={showSpotifyPlayer}
        setShowSpotifyPlayer={setShowSpotifyPlayer}
        isDirectAudio={isDirectAudio}
        isOpen={isOpen}
        handleAudioToggle={handleAudioToggle}
        isPlaying={isPlaying}
        accentColor={accentColor}
      />

      {/* ── INVITATION CARD SECTION ── */}
      <div id="main-invitation-container" className="w-full relative z-10">
        {/* Section 1: Invitation Card centered vertically in viewport */}
        <section className="download-card-section flex flex-col items-center justify-center py-0 px-4 relative z-10 w-full min-h-screen">
          {/* ═══ THE CARD (this gets downloaded) ═══ */}
          <div
            className="w-full flex items-start justify-center relative"
            style={{
              height:
                cardHeight > 0 && isOpen && !downloading
                  ? `${cardHeight * (downloading ? 1 : scale)}px`
                  : "auto",
              transition: "height 0.3s ease-out",
            }}
          >
            <div
              style={{
                width: "100%",
                display: "flex",
                justifyContent: "center",
                transform: isOpen && !downloading ? `scale(${scale})` : "none",
                transformOrigin: "top center",
                transition: "transform 0.3s ease-out",
              }}
            >
              <div
                ref={cardRef}
                key={customCardBg || cardTheme}
                className={`w-152 flex-none rounded-2xl overflow-hidden transition-all duration-300 ${
                  isPlusTemplate ? "animate-plus-fade-in shadow-2xl" : ""
                } ${
                  isProTemplate
                    ? "animate-pro-card-entrance animate-pro-border-glow shadow-[0_0_25px_rgba(216,183,106,0.15)]"
                    : "shadow-[0_30px_80px_rgba(0,0,0,0.7)]"
                }`}
              >
                {/* Card background container */}
                <div
                  className="relative w-full overflow-hidden"
                  style={cardStyles}
                >
                  {isProTemplate && (
                    <div className="pro-card-shimmer-overlay" />
                  )}

                  <div
                    key={`${cardTheme}__${customCardBg}`}
                    className={isProTemplate ? "animate-pro-float" : ""}
                  >
                    {<ThemeOrnaments theme={cardTheme} pri={priHex} sec={secHex} ter={terHex} isFreeUser={isFreeUser} />}
                    {cardTheme === "custom" &&
                      <TemplateBackgroundGraphics customCardBg={customCardBg} />}
                  </div>
                  {<FrameBorder frameBorder={layout.frameBorder} />}
                  {/* Custom Spacing & Scaling wrapper */}
                  <div
                    className={`invite-card-content relative z-10 flex flex-col justify-center w-full min-h-155 transition-all ${
                      textAlignment === "left"
                        ? "items-start text-left"
                        : textAlignment === "right"
                          ? "items-end text-right"
                          : "items-center text-center"
                    }`}
                    style={{
                      /* fontSize intentionally NOT set here — applied per-block via getBlockStyles */
                      fontWeight: baseWeight,
                      paddingTop: `calc(${layout.pt}px + ${customVerticalOffset}px)`,
                      paddingBottom: `calc(${layout.pb}px - ${customVerticalOffset}px)`,
                      paddingLeft: `${scalePadding(layout.pl)}px`,
                      paddingRight: `${scalePadding(layout.pr)}px`,
                      transform: `translateX(${customHorizontalOffset || 0}px)`,
                      ...(layout?.contrastHelpers?.overlayBehindText
                        ? {
                            background:
                              layout.contrastHelpers.overlayBehindText === true
                                ? layout.tier === "free"
                                  ? "rgba(255, 255, 255, 0.25)"
                                  : "rgba(0, 0, 0, 0.2)"
                                : layout.contrastHelpers.overlayBehindText,
                            borderRadius: "16px",
                            backdropFilter: "blur(4px)",
                            boxShadow: "inset 0 0 10px rgba(0,0,0,0.05)",
                            padding: "16px",
                            width: "90%",
                            margin: "0 auto",
                          }
                        : {}),
                    }}
                  >
                    <div
                      className={`invite-card-inner w-full flex flex-col justify-center transition-all ${
                        textAlignment === "left"
                          ? "items-start text-left"
                          : textAlignment === "right"
                            ? "items-end text-right"
                            : "items-center text-center"
                      }`}
                      style={{
                        maxWidth:
                          layout.layoutConfig?.safeArea?.maxWidth || "85%",
                        margin:
                          textAlignment === "left"
                            ? "0 auto 0 0"
                            : textAlignment === "right"
                              ? "0 0 0 auto"
                              : "0 auto",
                      }}
                    >
                      {/* ── Wedding Invitation title ── */}
                      <h2
                        {...getBlockProps("title", "100ms")}
                        style={{
                          ...getBlockProps("title", "100ms").style,
                          fontFamily: activeFont,
                          fontWeight: headingWeight,
                        }}
                      >
                        Wedding Invitation
                      </h2>

                      {/* ornament divider */}
                      <div
                        {...getBlockProps("divider1", "300ms")}
                        className={`${getBlockProps("divider1", "300ms").className} flex justify-center w-full`}
                      >
                        {<OrnamentDivider dividerType={layout.dividerType} color={getBlockProps("divider1", "300ms").style.color} spacing={"my-3"} />}
                      </div>

                      {/* ── Marriage between ── */}
                      <p
                        {...getBlockProps("subtitle", "500ms")}
                        style={{
                          ...getBlockProps("subtitle", "500ms").style,
                          ...script,
                          fontStyle: "italic",
                        }}
                      >
                        Marriage between
                      </p>

                      {/* ── Couple names ── */}
                      <h1
                        {...getBlockProps("coupleNames", "700ms")}
                        className={`${getBlockProps("coupleNames", "700ms").className} leading-tight`}
                        style={{
                          ...getBlockProps("coupleNames", "700ms").style,
                          fontFamily: activeFont,
                          fontWeight: headingWeight,
                          backgroundImage:
                            layout.dividerType?.includes("gold") ||
                            layout.dividerType === "glitter" ||
                            cardTheme === "navy"
                              ? "linear-gradient(135deg, #FFF 0%, #D8B76A 60%, #A37F28 100%)"
                              : "none",
                          WebkitBackgroundClip:
                            layout.dividerType?.includes("gold") ||
                            layout.dividerType === "glitter" ||
                            cardTheme === "navy"
                              ? "text"
                              : "border-box",
                          WebkitTextFillColor:
                            layout.dividerType?.includes("gold") ||
                            layout.dividerType === "glitter" ||
                            cardTheme === "navy"
                              ? "transparent"
                              : "initial",
                          display:
                            layout.dividerType?.includes("gold") ||
                            layout.dividerType === "glitter" ||
                            cardTheme === "navy"
                              ? "inline-block"
                              : "block",
                        }}
                      >
                        {invitation.userId?.partner1Name || "Partner 1"}{" "}
                        <span
                          style={{
                            color:
                              layout.dividerType?.includes("gold") ||
                              layout.dividerType === "glitter" ||
                              cardTheme === "navy"
                                ? "#D8B76A"
                                : getBlockProps("coupleNames", "700ms").style
                                    .color,
                            WebkitTextFillColor:
                              layout.dividerType?.includes("gold") ||
                              layout.dividerType === "glitter" ||
                              cardTheme === "navy"
                                ? "#D8B76A"
                                : "initial",
                            opacity: 0.9,
                          }}
                        >
                          and
                        </span>{" "}
                        {invitation.userId?.partner2Name || "Partner 2"}
                      </h1>

                      {/* ornament */}
                      <div
                        {...getBlockProps("divider2", "900ms")}
                        className={`${getBlockProps("divider2", "900ms").className} flex justify-center w-full`}
                      >
                        {<OrnamentDivider dividerType={layout.dividerType} color={getBlockProps("divider2", "900ms").style.color} spacing={"my-3"} isSecondary={true} />}
                      </div>

                      {/* ── You are cordially invited ── */}
                      <p
                        {...getBlockProps("greeting", "1100ms")}
                        style={{
                          ...getBlockProps("greeting", "1100ms").style,
                        }}
                      >
                        You are cordially invited
                      </p>

                      {/* ── Salutation (customized greeting) ── */}
                      <p
                        {...getBlockProps("greeting", "1100ms")}
                        style={{
                          ...getBlockProps("greeting", "1100ms").style,
                          ...script,
                          fontStyle: "italic",
                        }}
                      >
                        {invitation.greeting || `Dear ${invitation.guestName},`}
                      </p>

                      {/* ── Custom message ── */}
                      <p
                        {...getBlockProps("message", "1300ms")}
                        className={`${getBlockProps("message", "1300ms").className} invite-card-message opacity-90`}
                        style={{
                          ...getBlockProps("message", "1300ms").style,
                        }}
                      >
                        {invitation.customMessage}
                      </p>

                      {/* ── Date ── */}
                      {formattedDate && (
                        <p
                          {...getBlockProps("details", "1500ms")}
                          className={`${getBlockProps("details", "1500ms").className} invite-card-detail`}
                          style={{
                            ...getBlockProps("details", "1500ms").style,
                          }}
                        >
                          Date : {formattedDate}
                        </p>
                      )}

                      {/* ── Time ── */}
                      <p
                        {...getBlockProps("details", "1600ms")}
                        className={`${getBlockProps("details", "1600ms").className} invite-card-detail`}
                        style={{
                          ...getBlockProps("details", "1600ms").style,
                        }}
                      >
                        Time : {formattedTimeWithFormat || "To be announced"}
                      </p>

                      {/* Venue (clickable -> Maps Selector Modal) */}
                      {venue &&
                        (isFreeUser ? (
                          <div
                            {...getBlockProps("details", "1700ms")}
                            className={`${getBlockProps("details", "1700ms").className} invite-card-location-text block w-full px-2`}
                            style={getBlockProps("details", "1700ms").style}
                          >
                            Location: {venueName || venue}
                          </div>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              setMapSelectAddress({
                                label: venueName || venue,
                                query: venue,
                              });
                            }}
                            {...getBlockProps("details", "1700ms")}
                            style={{
                              ...getBlockProps("details", "1700ms").style,
                              textDecoration: "underline",
                              textDecorationColor: `${accentColor}55`,
                              textUnderlineOffset: "3px",
                            }}
                            className={`${getBlockProps("details", "1700ms").className} invite-card-location-text invite-card-map-link cursor-pointer hover:opacity-90 transition block w-full px-2`}
                          >
                            Location: {venueName || venue}
                          </button>
                        ))}

                      {receptionLocation &&
                        (isFreeUser ? (
                          <div
                            {...getBlockProps("reception", "1800ms")}
                            className={`${getBlockProps("reception", "1800ms").className} invite-card-location-text invite-card-reception block w-full px-2`}
                            style={getBlockProps("reception", "1800ms").style}
                          >
                            Reception at: {receptionName || receptionLocation}
                          </div>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              setMapSelectAddress({
                                label: receptionName || receptionLocation,
                                query: receptionLocation,
                              });
                            }}
                            {...getBlockProps("reception", "1800ms")}
                            style={{
                              ...getBlockProps("reception", "1800ms").style,
                              textDecoration: "underline",
                              textDecorationColor: `${accentColor}55`,
                              textUnderlineOffset: "3px",
                            }}
                            className={`${getBlockProps("reception", "1800ms").className} invite-card-location-text invite-card-reception invite-card-map-link cursor-pointer hover:opacity-90 transition block w-full px-2`}
                          >
                            Reception at: {receptionName || receptionLocation}
                          </button>
                        ))}

                      {/* bottom ornament */}
                      <div
                        {...getBlockProps("divider2", "1900ms")}
                        className={`${getBlockProps("divider2", "1900ms").className} invite-card-bottom-divider flex justify-center w-full`}
                      >
                        {<OrnamentDivider dividerType={layout.dividerType} color={primaryTextColor} spacing={"my-3"} isSecondary={true} />}
                      </div>

                      {/* Colors */}
                      {weddingColors.length > 0 && (
                        <div
                          {...getBlockProps("colors", "2000ms")}
                          className={`${getBlockProps("colors", "2000ms").className} invite-card-colors`}
                          style={{
                            ...getBlockProps("colors", "2000ms").style,
                          }}
                        >
                          <p
                            style={{
                              color: getBlockProps("colors", "2000ms").style
                                .color,
                              opacity: 0.8,
                              textShadow:
                                getBlockProps("colors", "2000ms").style
                                  .textShadow || "none",
                            }}
                            className="uppercase mb-2 tracking-widest"
                          >
                            Colour of the Day
                          </p>
                          <div className="invite-card-color-chips flex flex-wrap justify-center gap-1.5">
                            {weddingColors.map((name, i) => {
                              const hex = getWeddingColorHex(name);
                              const blockStyles = getBlockProps(
                                "colors",
                                "2000ms",
                              ).style;
                              const isDark = isDarkColor(hex);
                              return (
                                <div
                                  key={i}
                                  className="flex items-center gap-1.5 rounded-full px-2.5 py-0.75 border text-[1.2em] font-extrabold shadow-xs whitespace-nowrap"
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
                                    className={`h-2.5 w-2.5 rounded-full shrink-0 shadow-xs border ${isDark ? "border-white/60" : "border-white/20"}`}
                                    style={{ backgroundColor: hex }}
                                  />
                                  <span style={{ color: blockStyles.color }}>
                                    {name}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Category badge */}
                      <p
                        {...getBlockProps("details", "2100ms")}
                        style={{
                          ...getBlockProps("details", "2100ms").style,
                          letterSpacing: "0.18em",
                          fontWeight: 700,
                        }}
                        className={`${getBlockProps("details", "2100ms").className} uppercase`}
                      >
                        {invitation.category || "Guest"}
                      </p>
                    </div>

                    {isFreeUser && (
                      <div className="absolute bottom-2.5 left-0 right-0 text-center select-none pointer-events-none opacity-45 z-20">
                        <span
                          className="text-[10px] font-mono tracking-widest uppercase"
                          style={{ color: cardStyles.color || "#000000" }}
                        >
                          Powered by VowLink
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* ═══ END CARD ═══ */}
        </section>

        {/* Section 2: Details & RSVP actions below the card */}
        <section
          id="details-start-anchor"
          className="flex flex-col items-center justify-center py-10 px-4 gap-6 relative z-10 w-full download-exclude"
        >
          {/* ── Countdown (outside card, not downloaded) ── */}
          {countdown &&
            (countdown.days > 0 ||
              countdown.hours > 0 ||
              countdown.minutes > 0) && (
              <Countdown
                countdown={countdown}
                scale={scale}
              />
            )}

          {/* RSVP Deadline badge */}
          {rsvpDeadline && (
            <div
              className={`invite-rsvp-deadline flex items-center gap-2 rounded-xl border px-5 py-2.5 download-exclude ${
                deadlinePassed
                  ? "border-red-400/30 bg-red-400/10 text-red-400"
                  : "border-amber-400/30 bg-amber-400/10 text-amber-300"
              }`}
            >
              <Icon
                icon={deadlinePassed ? "lucide:lock" : "lucide:clock"}
                className="h-4 w-4 shrink-0"
              />
              <p className="text-xs font-medium">
                {deadlinePassed
                  ? "RSVP is now closed"
                  : `RSVP by ${new Date(rsvpDeadline).toLocaleDateString(
                      "en-GB",
                      {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      },
                    )}`}
              </p>
            </div>
          )}

          {/* RSVP Status / Button */}
          {invitation.hasRSVPed ? (
            <div className="invite-rsvp-status rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-8 py-4 download-exclude">
              <p className="flex items-center justify-center gap-1.5 text-sm text-emerald-400">
                <Icon icon="lucide:check" className="h-4 w-4" />
                We've received your RSVP. Thank you!
              </p>
              {!deadlinePassed && <button type="button" onClick={() => setShowForm(true)} className="mt-3 rounded-full border border-emerald-400/30 px-4 py-2 text-sm text-emerald-400">Update RSVP</button>}
            </div>
          ) : deadlinePassed ? (
            <div className="invite-rsvp-status invite-rsvp-status-closed rounded-2xl border border-red-400/20 bg-red-400/10 px-8 py-4 download-exclude">
              <p className="flex items-center justify-center gap-1.5 text-sm text-red-400">
                <Icon icon="lucide:lock" className="h-4 w-4" />
                RSVP is now closed.
              </p>
            </div>
          ) : (
            <button
              id="rsvp-open-btn"
              onClick={() => setShowForm(true)}
              className={`rounded-full bg-linear-to-r from-[#D8B76A] to-[#F2D894] px-10 py-4 text-sm font-bold uppercase tracking-widest text-[#1A2E4A] transition duration-300 hover:-translate-y-1 hover:shadow-[0_15px_40px_rgba(216,183,106,0.45)] download-exclude ${
                isProTemplate ? "animate-pro-btn-glow" : ""
              }`}
            >
              <Icon icon="lucide:sparkle" className="mr-1 inline h-4 w-4" />
              RSVP Now
            </button>
          )}

          {/* Download */}
          <div
            id="download-actions-bar"
            className="flex flex-wrap items-center justify-center gap-3 pb-4 download-exclude"
          >
            <button
              type="button"
              onClick={handleOpenCheckInQr}
              disabled={!checkInUrl}
              className="invite-action-button flex items-center gap-2 rounded-full border border-[#D8B76A]/40 bg-[#1A2E4A]/80 px-6 py-2.5 text-xs font-semibold uppercase tracking-widest text-[#D8B76A] backdrop-blur-sm transition hover:bg-[#1A2E4A] hover:shadow-[0_8px_24px_rgba(216,183,106,0.2)] disabled:opacity-50"
            >
              <Icon icon="lucide:qr-code" className="h-4 w-4" />
              Entry QR
            </button>
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="invite-action-button flex items-center gap-2 rounded-full border border-[#D8B76A]/40 bg-[#1A2E4A]/80 px-6 py-2.5 text-xs font-semibold uppercase tracking-widest text-[#D8B76A] backdrop-blur-sm transition hover:bg-[#1A2E4A] hover:shadow-[0_8px_24px_rgba(216,183,106,0.2)] disabled:opacity-50"
            >
              {downloading ? (
                <span className="animate-pulse">Downloading...</span>
              ) : (
                <>
                  <Icon icon="lucide:download" className="h-4 w-4" /> Download
                </>
              )}
            </button>
          </div>
        </section>
        <div id="details-start-anchor" className="scroll-mt-10" />

        {/* Love Story Couple Gallery Section (Plus/Pro) */}
        {galleryPhotos.length > 0 && (
          <GallerySection
            galleryPhotos={galleryPhotos}
            galleryIndex={galleryIndex}
            setGalleryIndex={setGalleryIndex}
          />
        )}

        {/* Timeline / Schedule Section */}
        {invitation.userId?.timeline &&
          invitation.userId.timeline.length > 0 && (
            <ScheduleSection invitation={invitation} />
          )}

        {/* Details Section */}
        <EventDetails
          invitation={invitation}
          isFreeUser={isFreeUser}
          venue={venue}
          venueName={venueName}
          receptionLocation={receptionLocation}
          receptionName={receptionName}
          serif={serif}
          weddingDate={weddingDate}
          formattedTimeWithFormat={formattedTimeWithFormat}
          dressCode={dressCode}
          weddingColors={weddingColors}
          plusOnePolicy={plusOnePolicy}
          kidsAllowed={kidsAllowed}
          setMapSelectAddress={setMapSelectAddress}
        />

        {/* RSVP MODAL */}
        {showForm && (
          <RsvpModal
            setShowForm={setShowForm}
            handleSubmit={handleSubmit}
            onRsvpSubmit={onRsvpSubmit}
            setRsvpFormActive={setRsvpFormActive}
            register={register}
            errors={errors}
            control={control}
            attending={attending}
            invitedCount={invitedCount}
            isSubmitting={isSubmitting}
            rsvpSubmitting={rsvpSubmitting}
          />
        )}

        {/* Gift Registry Section */}
        {invitation.userId?.registryEnabled && (
          <RegistrySection invitation={invitation} />
        )}
      </div>

      {/* Wish Wall / Guestbook Section */}
      {wishes.length > 0 && (
        <WishWall
          visibleWishes={visibleWishes}
          hasMoreWishes={hasMoreWishes}
          canShowLessWishes={canShowLessWishes}
          setVisibleWishCount={setVisibleWishCount}
          wishes={wishes}
        />
      )}

      {/* Map Selector Modal */}
      {mapSelectAddress && (
        <MapSelector
          mapSelectAddress={mapSelectAddress}
          setMapSelectAddress={setMapSelectAddress}
        />
      )}
    </div>
  );
};

export default InvitePage;
