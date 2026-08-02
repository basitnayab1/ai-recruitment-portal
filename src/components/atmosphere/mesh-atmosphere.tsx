"use client";

/**
 * Full-screen soft mesh atmosphere — original implementation inspired by
 * ReactBits landing energy (not a copy of their shaders).
 */
export function MeshAtmosphere({ intensity = "full" }: { intensity?: "full" | "soft" }) {
  const opacity = intensity === "full" ? "opacity-100" : "opacity-60";

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none fixed inset-0 z-0 overflow-hidden ${opacity}`}
    >
      {/* Base void */}
      <div className="absolute inset-0 bg-[#06060a]" />

      {/* Soft animated gradient wash */}
      <div className="rb-mesh-wash absolute inset-0" />

      {/* Floating blurred blobs */}
      <div className="rb-blob rb-blob-1 absolute -top-[20%] left-[10%] h-[55vmax] w-[55vmax] rounded-full bg-[#7c3aed]/35 blur-[100px]" />
      <div className="rb-blob rb-blob-2 absolute top-[30%] -right-[15%] h-[50vmax] w-[50vmax] rounded-full bg-[#2563eb]/30 blur-[110px]" />
      <div className="rb-blob rb-blob-3 absolute -bottom-[25%] left-[25%] h-[55vmax] w-[55vmax] rounded-full bg-[#db2777]/22 blur-[120px]" />
      <div className="rb-blob rb-blob-4 absolute top-[10%] left-[40%] h-[35vmax] w-[35vmax] rounded-full bg-[#06b6d4]/18 blur-[90px]" />

      {/* Fine grid */}
      <div className="rb-grid absolute inset-0 opacity-[0.35]" />

      {/* Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(6,6,10,0.55)_70%,rgba(6,6,10,0.92)_100%)]" />

      {/* Film grain (SVG noise, CSS only) */}
      <div className="rb-noise absolute inset-0 opacity-[0.035]" />
    </div>
  );
}
