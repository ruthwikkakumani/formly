export function BusyLabel({
  busy,
  idle,
  pending,
  done = false,
  success,
}: {
  busy: boolean;
  idle: string;
  pending: string;
  done?: boolean;
  success?: string;
}) {
  if (done && success) {
    return (
      <>
        <svg className="btncheck" width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
          <path
            d="M2.2 6.2 4.8 8.7 9.8 3.4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {success}
      </>
    );
  }
  return (
    <>
      {busy ? <span className="btnspin" aria-hidden="true" /> : null}
      {busy ? pending : idle}
    </>
  );
}
