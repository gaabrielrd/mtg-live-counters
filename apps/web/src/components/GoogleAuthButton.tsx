interface GoogleAuthButtonProps {
  label: string;
  disabled?: boolean;
  onClick: () => void;
}

export function GoogleAuthButton({
  label,
  disabled = false,
  onClick
}: GoogleAuthButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="inline-flex w-full items-center justify-center gap-3 rounded-full border border-stone-900/10 bg-white px-6 py-3 text-sm font-semibold text-ink transition hover:border-stone-900/20 hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-70"
    >
      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#fff] text-[13px] font-bold text-[#4285F4] shadow-sm">
        G
      </span>
      {label}
    </button>
  );
}
