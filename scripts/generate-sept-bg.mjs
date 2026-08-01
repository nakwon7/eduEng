// 9월 코스모스 배경 이미지 생성 (오후/저녁/밤)
// 실행: node --env-file=.env.local scripts/generate-sept-bg.mjs
import fs from "node:fs/promises";
import path from "node:path";
import OpenAI from "openai";

const OUT_DIR = path.join(process.cwd(), "public", "tutors", "bg");

// 08월(해바라기) 세트와 동일한 구도 규칙을 코스모스로 적용:
// 태양/달은 항상 화면 왼쪽 위, 지평선은 화면 중앙 근처, 하단은 꽃밭이 채움
const SLOTS = [
  {
    file: "09-02.jpg",
    label: "오후",
    prompt:
      "A photorealistic square photo of a vast pink and white cosmos flower field in full bloom, taken in bright afternoon sunlight. The sun blazes in the upper-left of the sky with a strong lens flare, blue sky with fluffy golden-white clouds. Distant blue mountain range on the horizon, a few scattered trees at the tree line. Sharp, detailed cosmos flowers with yellow centers fill the foreground and midground. Vivid but natural colors, DSLR photo quality, no text, no watermark.",
  },
  {
    file: "09-03.jpg",
    label: "저녁",
    prompt:
      "A photorealistic square photo of a vast pink and white cosmos flower field in full bloom, taken at sunset. The sun sits low near the horizon on the left side, sky glowing in warm orange, pink and purple hues with soft clouds. Distant blue-purple mountain silhouette on the horizon, a few scattered trees at the tree line. Cosmos flowers in the foreground bathed in warm golden-pink light. DSLR photo quality, no text, no watermark.",
  },
  {
    file: "09-04.jpg",
    label: "밤",
    prompt:
      "A photorealistic square photo of a vast pink and white cosmos flower field at night. A bright full moon glows in the upper-left of a deep navy-blue starry sky, with scattered stars visible. Distant blue-black mountain silhouette on the horizon, a few scattered trees at the tree line. Cosmos flowers in the foreground softly lit by moonlight with a cool blue-toned cast. DSLR night photo quality, no text, no watermark.",
  },
];

async function main() {
  const only = process.argv.slice(2); // 예: node ... 09-03.jpg 만 재생성
  const targets = only.length ? SLOTS.filter((s) => only.includes(s.file)) : SLOTS;

  if (!process.env.OPENAI_API_KEY) {
    console.error("OPENAI_API_KEY가 없습니다. `node --env-file=.env.local scripts/generate-sept-bg.mjs` 로 실행하세요.");
    process.exit(1);
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  await fs.mkdir(OUT_DIR, { recursive: true });

  for (const slot of targets) {
    console.log(`생성 중: ${slot.file} (${slot.label})...`);
    const result = await client.images.generate({
      model: "gpt-image-1",
      prompt: slot.prompt,
      size: "1024x1024",
      quality: "high",
      output_format: "jpeg",
    });

    const b64 = result.data[0].b64_json;
    const outPath = path.join(OUT_DIR, slot.file);
    await fs.writeFile(outPath, Buffer.from(b64, "base64"));
    console.log(`저장 완료: ${outPath}`);
  }

  console.log("모두 완료. lib/monthlyBg.ts의 9월 슬롯 수를 확인/조정하세요.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
