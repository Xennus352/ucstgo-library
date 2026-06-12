import TextToSvgComponent from "./TextToSvg";

export default function SplashScreen() {
  return (
    <main
      className="flex min-h-screen w-full flex-col items-center justify-center p-6 sm:p-12 md:p-24 relative overflow-hidden"
      style={{
        background:
          "linear-gradient(135deg, #F0F7FF 0%, #E0EEFF 50%, #D4E8FF 100%)",
      }}
    >
      <div
        className="absolute top-[-20%] left-[-10%] w-full hfu rounded-full blur-[120px] opacity-20 pointer-events-none"
        style={{ backgroundColor: "#3B82F6" }}
      />
      <div
        className="absolute bottom-[-25%] right-[-10%] w-150 h-150 rounded-full blur-[150px] opacity-15 pointer-events-none"
        style={{ backgroundColor: "#1D4ED8" }}
      />

      {/* Main content wrapper */}
      <div className="w-full sm:max-w-xl md:max-w-3xl lg:max-w-4xl flex flex-col items-center justify-center z-10">
        <TextToSvgComponent fill="#1D4ED8" />
        <p
          className="mt-4 text-sm sm:text-base font-medium tracking-wide animate-pulse"
          style={{ color: "#475569" }}
        >
          Loading your experience...
        </p>
      </div>
    </main>
  );
}
