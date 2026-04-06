type JobApplyNotePromptOptions = {
  includeResumeSuggestions: boolean;
  quickApplyMode: boolean;
};

export function buildOutreachMessageFromReasons(scoreReasons: string[]) {
  const reasons = scoreReasons
    .map((item) =>
      item
        .trim()
        .replace(/^[\-\d\.\s]+/, "")
        .replace(/^候选人/, "")
        .replace(/^简历显示/, "")
        .replace(/^针对岗位所看重的方向，我具备/, "")
        .replace(/^我具备/, "")
        .replace(/[。；;，,]+$/g, ""),
    )
    .filter(Boolean)
    .slice(0, 3);

  if (reasons.length === 0) {
    return "";
  }

  if (reasons.length === 1) {
    return `您好！我对这个岗位很感兴趣。结合岗位要求来看，我的相关匹配主要体现在 ${reasons[0]}。如果有机会，期待进一步沟通。`;
  }

  if (reasons.length === 2) {
    return `您好！我对这个岗位很感兴趣。结合岗位要求来看，我的匹配主要体现在两点：一是 ${reasons[0]}；二是 ${reasons[1]}。如果有机会，期待进一步沟通。`;
  }

  return `您好！我对这个岗位很感兴趣。结合岗位要求来看，我的匹配主要体现在三点：一是 ${reasons[0]}；二是 ${reasons[1]}；三是 ${reasons[2]}。如果有机会，期待进一步沟通。`;
}

const workflowLines = [
  "Generate a professional outreach message that is fluent, natural, and coherent.",
  "The message must be based on the strongest score_reasons derived from resume evidence and job description requirements.",
  "Ensure the text flows smoothly, uses natural Chinese expressions, and is easy to read.",
  "Avoid awkward phrasing, redundancy, or unnatural sentence structures.",
  "The outreach message should sound like a genuine candidate's note, not a robotic list of points.",
].join("\n");

const toneAndConstraintLines = [
  "Tone rules:",
  "- Use a professional, steady, positive tone",
  "- Sound credible and restrained",
  "- Prefer specifics over praise words",
  "- Avoid emotional exaggeration",
  "Hard constraints:",
  "- Do not invent experience, tools, ownership, scope, or outcomes",
  "- Do not claim the candidate is fully qualified unless the evidence clearly supports it",
  "- Do not use phrases like 'passionate', 'hardworking', 'excellent communication', '热爱学习', '沟通能力强', or '执行力强' unless the resume proves them",
  "- Keep only the strongest 2 to 3 persuasive themes",
  "- Keep the JD-to-resume mapping explicit",
].join("\n");

export function getJobApplyNoteSystemPrompt() {
  return "You are a rigorous job application assistant. Generate fluent, natural, and coherent outreach messages based on evidence from the resume and job description. Output valid JSON only.";
}

export function buildJobApplyNotePrompt({ includeResumeSuggestions, quickApplyMode }: JobApplyNotePromptOptions) {
  const schema = {
    match_score: 0,
    score_summary: "",
    score_reasons: [""],
    score_risks: [""],
    strengths: [""],
    gaps: [""],
    ...(includeResumeSuggestions
      ? {
          suggestions: [""],
          resume_bullets: [""],
        }
      : {}),
    intro: "",
    outreach_message: "",
  };

  const fieldRules = [
    "Field rules:",
    "- match_score: overall fit score from 0 to 100",
    "- score_summary: 1 to 2 sentences on what mainly drives the score",
    "- score_reasons: 3 concise evidence-based reasons supporting the score",
    "- score_risks: 1 to 3 weaker-fit areas, missing proof points, or uncertainties",
    "- strengths: why the candidate is already credible for this role",
    "- gaps: missing evidence or weaker fit areas",
    ...(includeResumeSuggestions
      ? [
          "- suggestions: concrete edits or emphasis changes for future applications",
          "- resume_bullets: rewritten resume bullets tailored to the JD, grounded in existing experience",
        ]
      : []),
    "- intro: concise self-introduction for interview or self-summary use",
    "- outreach_message: the highest-priority output in this task",
  ].join("\n");

  const modeLines = quickApplyMode
    ? [
        "This flow is optimized for one immediate application, not for long-form resume rewriting.",
        "De-prioritize resume rewrite content and prioritize scoring clarity plus a directly usable outreach message.",
      ].join("\n")
    : [
        "This flow supports broader analysis, but the outreach message must still follow the same evidence-first workflow.",
      ].join("\n");

  const outputRules = [
    "Outreach message requirements:",
    "- Length: around 300 Chinese characters, target 260 to 340 Chinese characters",
    "- Goal: directly usable as an application note to HR or a hiring manager",
    "- Must directly reuse the strongest score_reasons as the body of the message",
    "- Do not introduce new selling points beyond score_reasons and resume evidence",
    "- Prefer concrete project context, responsibilities, and outcomes over generic adjectives",
    "- Ensure the message is fluent, natural, and coherent: improve sentence flow, use natural Chinese expressions, avoid awkward phrasing.",
    "- The text should sound like a genuine candidate's note, not a robotic list of points.",
    "Intro requirements:",
    "- Length: 120 to 180 Chinese characters",
    "- Keep it tighter and more factual than the outreach message",
    "- Also ensure fluency and natural expression.",
  ].join("\n");

  return [
    "You are analyzing how well a candidate resume matches a target job description.",
    "Return valid JSON only.",
    "Every conclusion must be grounded in the resume and JD evidence.",
    modeLines,
    "Schema:",
    JSON.stringify(schema),
    fieldRules,
    workflowLines,
    toneAndConstraintLines,
    outputRules,
    "Return raw JSON only, with no markdown fence.",
  ].join("\n");
}
