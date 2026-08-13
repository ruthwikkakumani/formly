import { FormDefinition } from "@/lib/types";

export function ThankYouScreen({ form }: { form: FormDefinition }) {
  return (
    <div className="welcome thanks">
      <div>✓</div>
      <h1>Thank you!</h1>
      <p>{form.theme.thankYou || "Your response has been submitted."}</p>
    </div>
  );
}
