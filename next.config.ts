import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Default Next.js untuk Server Action cuma 1MB — kalau file .db yang
      // diupload lebih besar dari itu, request langsung gagal di tengah
      // jalan (muncul sebagai "Connection closed" yang membingungkan,
      // bukan pesan soal ukuran file).
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
