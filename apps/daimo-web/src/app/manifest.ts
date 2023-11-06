import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Daimo",
    short_name: "Payments on Ethereum",
    icons: [
      {
        src: "./assets/android-icons/36.png",
        sizes: "36x36",
        type: "image/png",
      },
      {
        src: "./assets/android-icons/48.png",
        sizes: "48x48",
        type: "image/png",
      },
      {
        src: "./assets/android-icons/72.png",
        sizes: "72x72",
        type: "image/png",
      },
      {
        src: "./assets/android-icons/96.png",
        sizes: "96x96",
        type: "image/png",
      },
      {
        src: "./assets/android-icons/144.png",
        sizes: "144x144",
        type: "image/png",
      },
      {
        src: "./assets/android-icons/192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "./assets/android-icons/512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
    prefer_related_applications: true,
    related_applications: [
      {
        platform: "play",
        id: "com.daimo",
        url: "https://play.google.com/store/apps/details?id=com.daimo",
      },
    ],
    start_url: "/",
    display: "standalone",
  };
}
