export const APP_VERSION = "1.0.0";

export const IS_DESKTOP =
    typeof window !== "undefined" &&
    window.location.search.includes("desktop=true");
