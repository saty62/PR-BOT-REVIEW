import { PatchesTypes } from "../types/index.js";

export async function aiReview(patches: PatchesTypes[]) {
  if (!patches || patches.length === 0) {
    return "## 🤖 AI Review\n\nNo code changes found in this PR.";
  }

  let diffText = "";

  for (const patch of patches) {
    diffText += `
File: ${patch.filename}
---------------------
${patch.patch ?? "No diff available"}
`;
  }

  const prompt = `
You are a senior software engineer reviewing a GitHub Pull Request.

Analyze the code changes carefully.

Provide the review in GitHub Markdown with:

1. Summary
2. Bugs / Issues
3. Suggestions
4. Performance
5. Security
6. Final Recommendation

Be specific and practical.
Only report genuine issues.
Do not invent problems.
If a category has no issues, explicitly say "No issues found."

Code diff:

${diffText}
`;

  try {
   const response = await fetch(
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": process.env.GEMINI_API_KEY ?? "",
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();

      throw new Error(
        `Gemini API error: ${response.status} - ${errorText}`
      );
    }

    const data = await response.json();

    const aiText =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ??
      "AI review could not be generated.";

    return `## 🤖 AI Review\n\n${aiText}`;
  } catch (error) {
    console.error("Gemini API error:", error);

    return `## 🤖 AI Review

❌ Failed to generate AI review.

Please check:
- GEMINI_API_KEY
- Gemini model availability
- API quota / limits
- Worker environment variables
`;
  }
}
