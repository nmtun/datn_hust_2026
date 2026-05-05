import pdf from "pdf-parse";

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
const DEFAULT_MODEL = "gpt-4o-mini";
const MAX_CV_CHARS = 100000;

const EXPERIENCE_RULES = {
    intern: { min: 0, max: 0 },
    fresher: { min: 1, max: 2 },
    mid: { min: 2, max: 5 },
    senior: { min: 5, max: null },
    manager: { min: 5, max: null }
};

const safeString = (value) => {
    if (value == null) return "";
    return String(value).trim();
};

const toStringArray = (value) => {
    if (!Array.isArray(value)) return [];
    return value
        .map((item) => safeString(item))
        .filter((item) => item.length > 0);
};

const normalizeExperienceItem = (item) => {
    const safeItem = item && typeof item === "object" ? item : {};
    return {
        title: safeString(safeItem.title),
        company: safeString(safeItem.company),
        duration: safeString(safeItem.duration),
        description: safeString(safeItem.description)
    };
};

const normalizeExperienceList = (value) => {
    if (!Array.isArray(value)) return [];
    return value.map(normalizeExperienceItem);
};

const normalizeCvSchema = (data) => {
    const safeData = data && typeof data === "object" ? data : {};
    const skills = safeData.skills && typeof safeData.skills === "object" ? safeData.skills : {};
    const selfDescription = safeData["self-description"] ?? safeData.self_description ?? safeData.selfDescription;

    return {
        name: safeString(safeData.name),
        "self-description": safeString(selfDescription),
        skills: {
            core: toStringArray(skills.core),
            soft: toStringArray(skills.soft)
        },
        experience: normalizeExperienceList(safeData.experience),
        education: toStringArray(safeData.education),
        certifications: toStringArray(safeData.certifications),
        experience_years: normalizeExperienceYears(safeData.experience_years)
    };
};

const normalizeScore = (value) => {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return 0;
    return Math.max(0, Math.min(100, Math.round(numeric)));
};

const normalizeStringList = (value) => {
    if (!Array.isArray(value)) return [];
    return value
        .map((item) => safeString(item))
        .filter((item) => item.length > 0);
};

const normalizeScores = (scores) => {
    const safeScores = scores && typeof scores === "object" ? scores : {};
    return {
        skills: normalizeScore(safeScores.skills),
        education: normalizeScore(safeScores.education),
        certifications: normalizeScore(safeScores.certifications)
    };
};

const normalizeAnalysisList = (value) => {
    if (!Array.isArray(value)) return [];
    return value
        .map((item) => {
            const safeItem = item && typeof item === "object" ? item : {};
            return {
                requirement: safeString(safeItem.requirement),
                match_score: normalizeScore(safeItem.match_score),
                evidence_from_cv: safeString(safeItem.evidence_from_cv),
                reasoning: safeString(safeItem.reasoning),
                gap: safeString(safeItem.gap)
            };
        })
        .filter((item) => item.requirement || item.evidence_from_cv || item.reasoning || item.gap);
};

const normalizeExperienceYears = (value) => {
    const numeric = Number(value);
    if (!Number.isFinite(numeric) || numeric < 0) return 0;
    return Math.round(numeric * 10) / 10;
};

const buildOpenAiPrompt = (cvText, jobInfo) => {
    const schemaDescription = {
        name: "",
        "self-description": "",
        skills: { core: [""], soft: [""] },
        experience: [
            {
                title: "",
                company: "",
                duration: "",
                description: ""
            }
        ],
        education: [""],
        certifications: [""],
        experience_years: 0
    };

    return {
        system: `
            You are a senior HR expert and strict evaluator.
            You MUST analyze in a detailed, evidence-based way.
            DO NOT give generic answers.
            ALWAYS quote evidence from CV text.
            `,
        user: [
            "Nhiem vu:",
            "1) Trich xuat CV theo schema.",
            "2) Danh gia muc do phu hop CHI TIET theo tung requirement trong JD.",
            "3) Thang diem 0-100 cho tung phan.",
            "4) MOI NHAN XET BAT BUOC phai:",
            "- Co dan chung cu the tu CV",
            "- Giai thich tai sao phu hop/khong phu hop",
            "- Khong duoc noi chung chung",
            "",
            "Job description:",
            JSON.stringify(jobInfo),
            "",
            "CV text:",
            cvText,
            "",
            "Tra ve JSON theo format:",
            JSON.stringify({
                cv: schemaDescription,
                scores: { skills: 0, education: 0, certifications: 0 },
                analysis: [
                    {
                        requirement: "Mot yeu cau trong JD",
                        match_score: 0,
                        evidence_from_cv: "Trich dan CV",
                        reasoning: "Giai thich logic match",
                    }
                ],
                summary: "",
                strengths: [""],
                gaps: [""]
            }),
            "",
            "LUU Y:",
            "- Neu khong tim thay thong tin trong CV, phai ghi ro 'Khong tim thay trong CV'",
            "- Khong duoc tu suy dien",
            "- Viet bang tieng Viet co dau day du"
        ].join("\n")
    };
};

const parseJsonFromContent = (content) => {
    if (!content) return null;
    let normalized = content.trim();

    if (normalized.startsWith("```")) {
        normalized = normalized.replace(/```[a-zA-Z]*\n?/g, "").replace(/```/g, "").trim();
    }

    const firstBrace = normalized.indexOf("{");
    const lastBrace = normalized.lastIndexOf("}");
    if (firstBrace >= 0 && lastBrace >= 0) {
        normalized = normalized.slice(firstBrace, lastBrace + 1);
    }

    return JSON.parse(normalized);
};

const requestOpenAiJson = async (prompt) => {
    const apiKey = (process.env.OPENAI_API_KEY || "").trim();
    if (!apiKey) {
        throw new Error("OPENAI_API_KEY is missing");
    }

    if (typeof fetch !== "function") {
        throw new Error("Global fetch is not available. Use Node.js 18+.");
    }

    const model = (process.env.OPENAI_MODEL_NAME || DEFAULT_MODEL).trim();

    const response = await fetch(OPENAI_API_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model,
            temperature: 0.2,
            response_format: { type: "json_object" },
            messages: [
                { role: "system", content: prompt.system },
                { role: "user", content: prompt.user }
            ]
        })
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenAI API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content) {
        throw new Error("OpenAI response is empty");
    }

    return parseJsonFromContent(content);
};

const computeExperienceScore = (experienceYears, level) => {
    const rule = EXPERIENCE_RULES[level];
    if (!rule) return 0;

    if (level === "intern") return 100;

    if (experienceYears < rule.min) {
        return Math.round((experienceYears / rule.min) * 100);
    }

    if (rule.max != null && experienceYears > rule.max) {
        return Math.round((rule.max / experienceYears) * 100);
    }

    return 100;
};

const buildExperienceLevelNote = (experienceYears, level) => {
    const rule = EXPERIENCE_RULES[level];
    if (!rule) return "";

    if (level === "intern") {
        if (experienceYears > 0) {
            return `Kinh nghiệm ${experienceYears} năm chưa tương ứng level intern.`;
        }
        return "";
    }

    if (experienceYears < rule.min) {
        return `Kinh nghiệm ${experienceYears} năm thấp hơn yêu cầu ${rule.min}-${rule.max ?? "+"} năm cho level ${level}.`;
    }

    if (rule.max != null && experienceYears > rule.max) {
        return `Kinh nghiệm ${experienceYears} năm cao hơn yêu cầu ${rule.min}-${rule.max} năm cho level ${level}.`;
    }

    return "";
};

const resolveWeights = (level) => {
    if (level === "intern") {
        return { skills: 0.8, experience: 0, education: 0.1, certifications: 0.1 };
    }
    return { skills: 0.4, experience: 0.4, education: 0.1, certifications: 0.1 };
};

export const extractCvTextFromPdf = async (cvBuffer) => {
    const parsed = await pdf(cvBuffer);
    const rawText = safeString(parsed?.text);
    if (!rawText) return "";
    return rawText.length > MAX_CV_CHARS ? rawText.slice(0, MAX_CV_CHARS) : rawText;
};

export const evaluateCandidatePdf = async ({ cvBuffer, jobInfo }) => {
    if (!cvBuffer) {
        throw new Error("CV buffer is required");
    }

    if (!jobInfo) {
        throw new Error("Job info is required");
    }

    const cvText = await extractCvTextFromPdf(cvBuffer);
    if (!cvText) {
        throw new Error("CV text is empty");
    }

    const prompt = buildOpenAiPrompt(cvText, jobInfo);
    const openAiResult = await requestOpenAiJson(prompt);

    const cvSchema = normalizeCvSchema(openAiResult?.cv);
    const scores = normalizeScores(openAiResult?.scores);
    const summary = safeString(openAiResult?.summary);
    const strengths = normalizeStringList(openAiResult?.strengths);
    // const gaps = normalizeStringList(openAiResult?.gaps);
    const analysis = normalizeAnalysisList(openAiResult?.analysis);

    const experienceYears = normalizeExperienceYears(cvSchema.experience_years);
    const experienceScore = computeExperienceScore(experienceYears, jobInfo.experience_level);
    const experienceNote = buildExperienceLevelNote(experienceYears, jobInfo.experience_level);

    const weights = resolveWeights(jobInfo.experience_level);
    const totalScore = Math.round(
        scores.skills * weights.skills +
        experienceScore * weights.experience +
        scores.education * weights.education +
        scores.certifications * weights.certifications
    );

    // const scoreSummary = `Diem ky nang ${scores.skills}/100, kinh nghiem ${experienceScore}/100, hoc van ${scores.education}/100, chung chi ${scores.certifications}/100. Diem tong ${totalScore}/100.`;

    const strengthsText = strengths.length > 0 ? `Điểm mạnh: ${strengths.join('; ')}.` : "";
    // const gapsText = gaps.length > 0 ? `Điểm yếu: ${gaps.join('; ')}.` : "";

    const analysisText = analysis.length > 0
        ? `Phân tích yêu cầu: ${analysis.map((item, index) => {
            const parts = [
                `(${index + 1}) ${item.requirement || 'Yêu cầu không rõ'}`,
                // item.match_score ? `Điểm ${item.match_score}/100` : "",
                item.evidence_from_cv ? `Thông tin từ cv: ${item.evidence_from_cv}` : "",
                item.reasoning ? `Kết luận: ${item.reasoning}` : "",
                // item.gap ? `Thiếu: ${item.gap}` : ""
            ].filter(Boolean);
            return parts.join(' - ');
        }).join(' | ')}`
        : "";

    const commentDetail = [
        summary,
        strengthsText,
        // gapsText,
        analysisText,
        experienceNote
    ].filter(Boolean).join(" ");

    return {
        cv_schema: cvSchema,
        jd_info: jobInfo,
        score_total: totalScore,
        score_breakdown: {
            skills: scores.skills,
            experience: experienceScore,
            education: scores.education,
            certifications: scores.certifications,
            weights
        },
        comment_short: summary,
        comment_detail: commentDetail
    };
};
