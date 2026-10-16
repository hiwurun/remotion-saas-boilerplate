import { loadFont as loadCormorant } from "@remotion/google-fonts/CormorantGaramond";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";

// Cormorant Garamond = original display serif.
// PP Neue Montreal / PPSupplyMono are commercial → free fallbacks Inter / JetBrains Mono.
export const display = loadCormorant("normal", { weights: ["300", "400", "500"], subsets: ["latin"] }).fontFamily;
export const displayItalic = loadCormorant("italic", { weights: ["300", "400"], subsets: ["latin"] }).fontFamily;
export const sans = loadInter("normal", { weights: ["300", "400", "500"], subsets: ["latin"] }).fontFamily;
export const mono = loadMono("normal", { weights: ["400"], subsets: ["latin"] }).fontFamily;
