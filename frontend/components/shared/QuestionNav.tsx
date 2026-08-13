export function QuestionNav({
  onPrev,
  onNext,
  prevDisabled = false,
  nextDisabled = false,
}: {
  onPrev: () => void;
  onNext: () => void;
  prevDisabled?: boolean;
  nextDisabled?: boolean;
}) {
  return (
    <div className="fillnav">
      <button type="button" onClick={onPrev} disabled={prevDisabled} aria-label="Previous question" title="Previous">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path
            d="M3.5 10.25 8 5.75l4.5 4.5"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      <button type="button" onClick={onNext} disabled={nextDisabled} aria-label="Next question" title="Next">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path
            d="M3.5 5.75 8 10.25l4.5-4.5"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  );
}
