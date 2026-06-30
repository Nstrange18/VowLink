import React from "react";
import { Icon } from "@iconify/react";

const VenueSidebar = ({
  activeTab,
  setActiveTab,
  photosLength,
  stats,
  venue,
  setSidebarOpen,
}) => {
  return (
    <div className="flex flex-col gap-6">
      {/* Navigation Card */}
      <div className="rounded-2xl border border-white/10 bg-[#0D1220] p-4 flex flex-col gap-2">
        <button
          onClick={() => {
            setActiveTab("listing");
            if (setSidebarOpen) setSidebarOpen(false);
          }}
          className={`w-full text-left px-4 py-3 rounded-xl text-xs uppercase tracking-wider font-semibold transition flex items-center gap-2 ${
            activeTab === "listing"
              ? "bg-[#D8B76A] text-[#070A13]"
              : "text-white/60 hover:bg-white/5"
          }`}
        >
          <Icon icon="lucide:building-2" className="w-4 h-4 shrink-0" />
          <span>Listing Details</span>
        </button>
        <button
          onClick={() => {
            setActiveTab("photos");
            if (setSidebarOpen) setSidebarOpen(false);
          }}
          className={`w-full text-left px-4 py-3 rounded-xl text-xs uppercase tracking-wider font-semibold transition flex justify-between items-center ${
            activeTab === "photos"
              ? "bg-[#D8B76A] text-[#070A13]"
              : "text-white/60 hover:bg-white/5"
          }`}
        >
          <span className="flex items-center gap-2">
            <Icon icon="lucide:camera" className="w-4 h-4 shrink-0" />
            <span>Gallery Photos</span>
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white font-mono">
            {photosLength}
          </span>
        </button>
        <button
          onClick={() => {
            setActiveTab("billing");
            if (setSidebarOpen) setSidebarOpen(false);
          }}
          className={`w-full text-left px-4 py-3 rounded-xl text-xs uppercase tracking-wider font-semibold transition flex items-center gap-2 ${
            activeTab === "billing"
              ? "bg-[#D8B76A] text-[#070A13]"
              : "text-white/60 hover:bg-white/5"
          }`}
        >
          <Icon icon="lucide:credit-card" className="w-4 h-4 shrink-0" />
          <span>Subscriptions</span>
        </button>
        <button
          onClick={() => {
            setActiveTab("security");
            if (setSidebarOpen) setSidebarOpen(false);
          }}
          className={`w-full text-left px-4 py-3 rounded-xl text-xs uppercase tracking-wider font-semibold transition flex items-center gap-2 ${
            activeTab === "security"
              ? "bg-[#D8B76A] text-[#070A13]"
              : "text-white/60 hover:bg-white/5"
          }`}
        >
          <Icon icon="lucide:lock" className="w-4 h-4 shrink-0" />
          <span>Security & Danger Zone</span>
        </button>
      </div>

      {/* Quick Stats Card — live-polled every 30s */}
      <div className="rounded-2xl border border-white/10 bg-[#0D1220] p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-[10px] uppercase font-bold tracking-widest text-[#D8B76A]">Performance Stats</h3>
          <span className="flex items-center gap-1.5 text-[9px] uppercase tracking-wider text-emerald-400 font-semibold">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            Live
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-1 lg:grid-cols-2 lg:gap-4">
          <div className="p-3 bg-white/3 rounded-xl transition-all flex flex-col md:flex-row md:items-center md:justify-between lg:flex-col lg:items-start">
            <span className="text-[9px] uppercase tracking-wider text-[#A1B0CB]">Total Views</span>
            <span className="text-xl font-bold font-mono">
              {stats.views !== null ? stats.views : (venue?.views ?? 0)}
            </span>
          </div>
          <div className="p-3 bg-white/3 rounded-xl transition-all flex flex-col md:flex-row md:items-center md:justify-between lg:flex-col lg:items-start">
            <span className="text-[9px] uppercase tracking-wider text-[#A1B0CB]">Inquiries</span>
            <span className="text-xl font-bold font-mono text-[#D8B76A]">
              {stats.inquiries !== null ? stats.inquiries : (venue?.inquiries ?? 0)}
            </span>
          </div>
        </div>
        <p className="text-[9px] text-white/30 italic">Auto-refreshes every 30 seconds.</p>
      </div>
    </div>
  );
};

export default VenueSidebar;
