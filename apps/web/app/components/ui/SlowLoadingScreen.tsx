type SlowLoadingScreenProps = {
  title: string;
  description: string;
};

export function SlowLoadingScreen({ title, description }: SlowLoadingScreenProps) {
  return (
    <div className="flex min-h-[360px] items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm text-center">
        <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-[var(--brand-surface)] shadow-[var(--ui-shadow-1)]">
          <span className="h-7 w-7 animate-spin rounded-full border-2 border-[var(--brand-secondary)] border-t-transparent" />
        </div>
        <p className="text-base font-bold text-[var(--brand-text)]">{title}</p>
        <p className="mt-2 text-sm leading-6 text-[var(--brand-text-muted)]">{description}</p>
        <div className="mt-6 grid grid-cols-3 gap-2">
          <span className="h-2 rounded-full bg-[var(--brand-surface)]" />
          <span className="h-2 rounded-full bg-[var(--brand-primary)]/70" />
          <span className="h-2 rounded-full bg-[var(--brand-surface)]" />
        </div>
      </div>
    </div>
  );
}
