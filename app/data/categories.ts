export const CATEGORIES = ["TODOS", "ARCADE", "PUZZLE", "SHOOTER", "VERSUS"] as const;

export type CategoryFilter = (typeof CATEGORIES)[number];
