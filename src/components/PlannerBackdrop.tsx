import plannerBackground from '../assets/images/login-background.jpg';

export function PlannerBackdrop() {
  return <div className="planner-backdrop" aria-hidden="true">
    <img src={plannerBackground} alt="" className="planner-backdrop-image" />
    <div className="planner-backdrop-overlay" />
  </div>;
}
