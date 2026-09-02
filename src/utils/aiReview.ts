import { PatchesTypes } from "../types/index.js";

export async function aiReview(patches: PatchesTypes[]) {
  if (!patches || patches.length === 0) {
    return "## 🤖 AI Review\n\nNo code changes found in this PR.";
  }

  // Build diff text
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
Only report genuine issues. Do not invent problems.
If a category has no issues, explicitly say "No issues found."

Code diff:

${diffText}
`;

  try {
    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        },

        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",

          messages: [
            {
              role: "system",
              content:
                "You are a senior software engineer specializing in code review, security, performance, and software engineering best practices.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
        }),
      }
    );

    // Get actual Groq error instead of only showing status code
    if (!response.ok) {
      const errorText = await response.text();

      throw new Error(
        `Groq API error: ${response.status} - ${errorText}`
      );
    }

    const data = await response.json();

    const aiText =
      data?.choices?.[0]?.message?.content ??
      "AI review could not be generated.";

    return `## 🤖 AI Review\n\n${aiText}`;
  } catch (error) {
    console.error("Groq API error:", error);

    return `## 🤖 AI Review

❌ Failed to generate AI review.

Please check:
- GROQ_API_KEY
- Groq model availability
- API credits / limits
- Worker environment variables
`;
  }
}