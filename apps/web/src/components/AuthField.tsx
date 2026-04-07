interface AuthFieldProps {
  label: string;
  type: "email" | "password";
  value: string;
  placeholder: string;
  error?: string;
  minLength?: number;
  autoComplete?: string;
  onChange: (value: string) => void;
}

export function AuthField({
  label,
  type,
  value,
  placeholder,
  error,
  minLength,
  autoComplete,
  onChange
}: AuthFieldProps) {
  return (
    <label className="block">
      <span className="text-sm font-medium uppercase tracking-[0.18em] text-white/78">
        {label}
      </span>
      <input
        required
        type={type}
        value={value}
        minLength={minLength}
        autoComplete={autoComplete}
        onChange={(event) => onChange(event.target.value)}
        className={[
          "mt-2 w-full rounded-[22px] border bg-black/20 px-4 py-3 text-white outline-none transition placeholder:text-white/40",
          error
            ? "border-rose-400/70 focus:border-rose-400"
            : "border-white/10 focus:border-ember"
        ].join(" ")}
        placeholder={placeholder}
      />
      {error ? (
        <p className="mt-2 text-sm leading-6 text-rose-300">{error}</p>
      ) : null}
    </label>
  );
}
