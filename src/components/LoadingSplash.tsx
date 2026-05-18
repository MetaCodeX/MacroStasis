"use client"

export function LoadingSplash({ done }: { done: boolean }) {
  return (
    <div className={`loading-splash ${done ? "done" : ""}`}>
      <div className="loading-logo">MacroStasis</div>
      <div className="loading-bar-track">
        <div className="loading-bar-fill" />
      </div>
    </div>
  )
}
