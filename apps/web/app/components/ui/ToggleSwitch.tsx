"use client";

type ToggleSwitchProps = {
  checked: boolean;
  label: string;
  onChange: (next: boolean) => void;
};

export function ToggleSwitch({ checked, label, onChange }: ToggleSwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`flex items-center justify-between rounded-xl px-3 py-2 text-sm font-semibold transition-colors ${
        checked
          ? "bg-[var(--brand-primary-soft)] text-[var(--brand-primary-ink)]"
          : "bg-[var(--brand-bg-900)] text-[var(--brand-text-muted)]"
      }`}
    >
      <span>{label}</span>
      <span
        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
          checked ? "bg-[var(--brand-primary)]" : "bg-[var(--placeholder)]"
        }`}
      >
        <span
          className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${
            checked ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </span>
    </button>
  );
}
