import { createFileRoute } from "@tanstack/react-router";
import { MonitorPlay } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-linear-to-br from-slate-100 via-blue-100/60 to-slate-200/90" />
        <div
          className="absolute top-1/4 left-1/3 w-200 h-150 rounded-full blur-3xl"
          style={{
            background:
              "radial-gradient(circle, oklch(0.8 0.08 250 / 50%) 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute bottom-0 right-0 w-125 h-100 rounded-full blur-3xl"
          style={{
            background:
              "radial-gradient(circle, oklch(0.75 0.03 250 / 40%) 0%, transparent 70%)",
          }}
        />
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `linear-gradient(rgba(0,0,0,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.15) 1px, transparent 1px)`,
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="max-w-2xl w-full text-center space-y-10">
          {/* Icon with orbiting dot */}
          <div className="flex justify-center">
            <div className="relative h-24 w-24 flex items-center justify-center">
              <div className="h-20 w-20 rounded-2xl bg-white/80 backdrop-blur border border-white shadow-lg shadow-blue-500/5 flex items-center justify-center">
                <MonitorPlay className="h-9 w-9 text-blue-600" />
              </div>
              {/* Orbiting dot */}
              <div
                className="absolute inset-0 animate-spin"
                style={{ animationDuration: "3s" }}
              >
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-0.5 h-3.5 w-3.5 rounded-full bg-emerald-500 border-2 border-white shadow-sm" />
              </div>
            </div>
          </div>

          {/* Heading */}
          <div className="space-y-3">
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground">
              一句话，AI 帮你生成
            </h1>
          </div>

          {/* Hint */}
          <div className="-mt-4">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/60 backdrop-blur border border-white/80 shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-sm text-muted-foreground">
                试试说：&quot;帮我生成一个精美的网站首页&quot;
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
