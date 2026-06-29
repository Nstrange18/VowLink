import { toast } from "react-toastify";

export const showConfirmToast = ({
  message,
  confirmLabel = "Confirm",
  onConfirm,
  toastId,
}) => {
  toast.warn(
    ({ closeToast }) => (
      <div className="flex flex-col gap-2 p-1 text-white">
        <p className="text-xs font-semibold leading-relaxed">{message}</p>
        <div className="mt-1 flex justify-end gap-2">
          <button
            type="button"
            onClick={closeToast}
            className="rounded bg-white/10 px-2.5 py-1 text-[10px] font-semibold text-white transition hover:bg-white/20"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={async () => {
              closeToast();
              await onConfirm();
            }}
            className="rounded bg-red-600 px-2.5 py-1 text-[10px] font-semibold text-white transition hover:bg-red-700"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    ),
    {
      toastId,
      position: "top-center",
      autoClose: false,
      closeOnClick: false,
      draggable: false,
      closeButton: false,
    }
  );
};
