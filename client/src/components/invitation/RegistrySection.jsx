import { Icon } from "@iconify/react";

import { toast } from "react-toastify";

const RegistrySection = ({
  invitation,
}) => (
  <section className="invite-section px-4 sm:px-6 py-16 text-center bg-[#090D19] relative z-10 border-t border-white/5 flex flex-col items-center download-exclude">
    <p className="text-xs uppercase tracking-[0.35em] text-[#D8B76A] mb-3 font-semibold">
      Gifting
    </p>
    <h2 className="font-serif text-3xl sm:text-4xl text-white mb-8">
      Gift Registry
    </h2>

    <div className="invite-registry-card w-full max-w-xl rounded-3xl border border-[#D8B76A]/30 bg-[#070A13]/90 p-6 sm:p-8 shadow-2xl space-y-8 text-left relative overflow-hidden backdrop-blur-md">
      <Icon
        icon="mdi:gift-outline"
        className="absolute top-4 right-4 h-28 w-28 opacity-5 pointer-events-none text-white"
      />

      {invitation.userId?.registryNotes && (
        <p className="text-sm text-white/70 text-center leading-relaxed italic border-b border-white/5 pb-6">
          "{invitation.userId.registryNotes}"
        </p>
      )}

      {/* Bank details info */}
      {invitation.userId?.registryAccountNumber && (
        <div className="space-y-4 pt-4 border-t border-white/5">
          <h4 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-white/50">
            <Icon icon="mdi:bank-outline" className="h-4 w-4" />
            Bank Transfer Details
          </h4>
          <div className="invite-feature-card rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4">
            <div className="grid grid-cols-2 gap-4 text-xs sm:text-sm">
              <div>
                <span className="text-white/40 block text-[9px] uppercase tracking-wider">
                  Bank Name
                </span>
                <span className="text-white font-medium">
                  {invitation.userId.registryBankName ||
                    "Not Specified"}
                </span>
              </div>
              <div>
                <span className="text-white/40 block text-[9px] uppercase tracking-wider">
                  Account Name
                </span>
                <span className="text-white font-medium">
                  {invitation.userId.registryAccountName ||
                    "Not Specified"}
                </span>
              </div>
            </div>

            <div className="invite-account-number flex items-center justify-between bg-black/40 rounded-xl p-3 sm:p-4 border border-white/5">
              <div>
                <span className="text-white/40 block text-[9px] uppercase tracking-wider">
                  Account Number
                </span>
                <span className="text-white font-mono text-base tracking-wide font-bold">
                  {invitation.userId.registryAccountNumber}
                </span>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(
                    invitation.userId.registryAccountNumber,
                  );
                  toast.success("Account number copied!");
                }}
                className="px-4 py-2 rounded-lg bg-[#D8B76A] text-[#070A13] text-xs font-bold uppercase tracking-wider hover:opacity-90 active:scale-95 transition"
              >
                Copy Number
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3 pt-4 border-t border-white/5">
        <h4 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-white/50">
          <Icon icon="lucide:copy-check" className="h-4 w-4" />
          Copy and Transfer
        </h4>
        <p className="text-xs text-white/45 leading-relaxed">
          Gifts are received by direct bank transfer only. Copy the
          account number above and complete the transfer in your banking
          app.
        </p>
      </div>
    </div>
  </section>
);

export default RegistrySection;
