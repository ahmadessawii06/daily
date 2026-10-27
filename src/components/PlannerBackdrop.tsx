import plannerBackground from '../assets/images/login/login-background.webp';

export function PlannerBackdrop() {
  return <div className="planner-backdrop" aria-hidden="true">
    <img src={plannerBackground} alt="" fetchPriority="high" decoding="async" className="planner-backdrop-image" />
    <div className="planner-backdrop-overlay" />
  </div>;
}
