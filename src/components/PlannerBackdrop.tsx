export function PlannerBackdrop() {
  return <div className="planner-rain" aria-hidden="true">
    {Array.from({ length: 32 }, (_, index) => <span key={index} style={{
      left: `${(index * 37 + 3) % 100}%`,
      height: `${35 + (index * 19) % 85}px`,
      animationDuration: `${1.4 + (index % 7) * .32}s`,
      animationDelay: `${-(index * .73)}s`,
      opacity: .18 + (index % 5) * .09,
    }} />)}
  </div>;
}
