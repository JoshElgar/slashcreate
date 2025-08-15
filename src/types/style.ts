export type StylePaletteColor = {
  name?: string;
  hex: string; // e.g. #D6C6B8
};

export type StyleGuide = {
  palette: StylePaletteColor[];
  lighting: string;
  medium: string;
  composition: string;
  camera?: string | null;
  texture?: string;
  influences: string[];
  keywords: string[];
  negativeKeywords: string[];
  aspect?: string;
};
