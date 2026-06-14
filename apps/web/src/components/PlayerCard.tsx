import type { MatchPlayerConnectionState } from "@mtg/shared";

export interface PlayerCardProps {
  displayName: string;
  currentLifeTotal: number;
  connectionState: MatchPlayerConnectionState | string;
  isOwner?: boolean;
  isViewer?: boolean;
  seat?: number;
  disabled?: boolean;
  isUpdating?: boolean;
  onLifeChange: (delta: number) => void;
}

function getPlayerCardButtonClassName(disabled: boolean) {
  return `flex h-14 w-14 items-center justify-center rounded-full border text-3xl leading-none transition sm:h-16 sm:w-16 ${
    disabled
      ? "cursor-not-allowed border-white/10 bg-white/5 text-white/35"
      : "border-white/12 bg-black/20 text-white hover:border-gold/45 hover:bg-white/10"
  }`;
}

export function PlayerCard({
  displayName,
  currentLifeTotal,
  connectionState,
  isOwner = false,
  isViewer = false,
  seat,
  disabled = false,
  isUpdating = false,
  onLifeChange
}: PlayerCardProps) {
  const isDisabled = disabled || isUpdating;

  return (
    <div
      className={`flex w-full flex-col justify-between rounded-[30px] border p-5 shadow-card sm:p-6 ${
        isViewer
          ? "border-gold/55 bg-[linear-gradient(160deg,rgba(216,179,106,0.18),rgba(255,255,255,0.05))]"
          : "border-white/10 bg-white/5"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-xl font-semibold text-white">{displayName}</p>
          <p className="mt-2 text-xs uppercase tracking-[0.22em] text-white/65">
            {isOwner ? "Owner" : "Player"}
            {isViewer ? " • You" : ""}
          </p>
        </div>

        <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs uppercase tracking-[0.2em] text-white/65">
          Seat {seat ?? "-"}
        </span>
      </div>

      <div className="mt-8 flex items-center justify-between gap-3 sm:gap-4">
        <button
          type="button"
          aria-label={`Diminuir vida de ${displayName}`}
          disabled={isDisabled}
          onClick={() => onLifeChange(-1)}
          className={getPlayerCardButtonClassName(isDisabled)}
        >
          -
        </button>

        <div className="min-w-0 flex-1 text-center">
          <p className="text-xs uppercase tracking-[0.24em] text-white/55">Life total</p>
          <p className="mt-3 font-display text-6xl leading-none text-white sm:text-7xl">
            {currentLifeTotal}
          </p>
        </div>

        <button
          type="button"
          aria-label={`Aumentar vida de ${displayName}`}
          disabled={isDisabled}
          onClick={() => onLifeChange(1)}
          className={getPlayerCardButtonClassName(isDisabled)}
        >
          +
        </button>
      </div>

      <div className="mt-8 flex items-center justify-between gap-3 border-t border-white/10 pt-4 text-sm text-white/78">
        <span>Conexao</span>
        <span className="capitalize text-white">{connectionState}</span>
      </div>
    </div>
  );
}
