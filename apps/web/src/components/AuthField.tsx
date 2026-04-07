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
      <span className="text-sm font-medium text-stone-700">{label}</span>
      <input
        required
        type={type}
        value={value}
        minLength={minLength}
        autoComplete={autoComplete}
        onChange={(event) => onChange(event.target.value)}
        className={[
          "mt-2 w-full rounded-2xl border bg-white px-4 py-3 text-ink outline-none transition",
          error
            ? "border-rose-500/70 focus:border-rose-600"
            : "border-stone-900/10 focus:border-ember"
        ].join(" ")}
        placeholder={placeholder}
      />
      {error ? (
        <p className="mt-2 text-sm leading-6 text-rose-700">{error}</p>
      ) : null}
    </label>
  );
}
