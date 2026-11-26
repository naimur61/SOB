import type { Violation } from "../../engine/rules";

type Props = {
  violations: Violation[];
};

function ViolationList({ violations }: Props) {
  if (violations.length === 0) return null;

  return (
    <ul className="violations" aria-live="polite">
      {violations.map((violation) => (
        <li key={violation.message}>{violation.message}</li>
      ))}
    </ul>
  );
}

export default ViolationList;
