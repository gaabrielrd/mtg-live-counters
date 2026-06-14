export type MatchRoomViewState = "loading" | "error" | "empty" | "ready";

export interface MatchRoomGridLayout {
  gridClassName: string;
  cardClassName: string;
  maxCardWidthClassName: string;
}

export function getMatchRoomViewState(params: {
  isLoading: boolean;
  errorMessage: string | null;
  hasSnapshot: boolean;
  playerCount: number;
}): MatchRoomViewState {
  if (params.isLoading) {
    return "loading";
  }

  if (params.errorMessage || !params.hasSnapshot) {
    return "error";
  }

  if (params.playerCount <= 0) {
    return "empty";
  }

  return "ready";
}

export function getMatchRoomGridLayout(playerCount: number): MatchRoomGridLayout {
  if (playerCount <= 2) {
    return {
      gridClassName: "grid-cols-1 md:grid-cols-2",
      cardClassName: "min-h-[18rem]",
      maxCardWidthClassName: "max-w-none"
    };
  }

  if (playerCount <= 4) {
    return {
      gridClassName: "grid-cols-1 sm:grid-cols-2",
      cardClassName: "min-h-[16rem]",
      maxCardWidthClassName: "max-w-none"
    };
  }

  if (playerCount <= 6) {
    return {
      gridClassName: "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3",
      cardClassName: "min-h-[15rem]",
      maxCardWidthClassName: "max-w-none"
    };
  }

  return {
    gridClassName: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4",
    cardClassName: "min-h-[14rem]",
    maxCardWidthClassName: "max-w-none"
  };
}
