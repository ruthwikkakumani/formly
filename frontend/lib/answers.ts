export function isUploadUrl(value: string): boolean {
  return /\/uploads\//.test(value || "");
}

export function displayAnswer(value?: string): string {
  const answer = (value || "").trim();
  if (!answer) return "—";
  if (isUploadUrl(answer)) {
    try {
      const name = decodeURIComponent(answer.split("/").pop() || "File");
      return name.replace(/^[0-9a-f-]{8,}-/i, "") || "File";
    } catch {
      return "File";
    }
  }
  return answer;
}
