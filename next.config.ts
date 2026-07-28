const nextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [{ protocol: "https", hostname: "www.google.com" }],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "50mb",
      allowedOrigins: [
        "library.ucstaungoo.edu.mm",
        "*.ucstaungoo.edu.mm",
        "10.23.23.110",
        "10.23.23.110:3000",      
      ],
    },
  },
};

export default nextConfig;
