import { parseDataUrl } from "./vision-shared";

/**
 * Google Lens(SerpAPI)는 공개 URL만 받습니다.
 * 분석용으로 짧게 공개 호스팅한 뒤 URL을 반환합니다.
 */
export async function hostImageForLens(dataUrl: string): Promise<string> {
  const imgbbKey = process.env.IMGBB_API_KEY?.trim();
  if (imgbbKey) {
    return hostWithImgbb(dataUrl, imgbbKey);
  }
  if (process.env.IMAGE_ANALYSIS_ENABLE_PUBLIC_IMAGE_HOST !== "true") {
    throw new Error("PUBLIC_IMAGE_HOST_NOT_ENABLED");
  }
  return hostWithLitterbox(dataUrl);
}

async function hostWithImgbb(dataUrl: string, apiKey: string): Promise<string> {
  const { base64 } = parseDataUrl(dataUrl);
  const body = new URLSearchParams();
  body.set("image", base64);

  const params = new URLSearchParams({
    key: apiKey,
    // Google Lens only needs the URL during this request. Do not leave a
    // user's shopping photo publicly addressable indefinitely.
    expiration: "3600",
  });
  const res = await fetch(`https://api.imgbb.com/1/upload?${params.toString()}`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  const json = (await res.json()) as {
    success?: boolean;
    data?: { url?: string; display_url?: string };
    error?: { message?: string };
  };

  if (!res.ok || !json.success) {
    throw new Error(json.error?.message ?? `IMGBB_HTTP_${res.status}`);
  }

  const url = json.data?.display_url ?? json.data?.url;
  if (!url) throw new Error("IMGBB_NO_URL");
  return url;
}

async function hostWithLitterbox(dataUrl: string): Promise<string> {
  const { mimeType, base64 } = parseDataUrl(dataUrl);
  const ext = mimeType.includes("png")
    ? "png"
    : mimeType.includes("webp")
      ? "webp"
      : "jpg";
  const bytes = Buffer.from(base64, "base64");
  const blob = new Blob([bytes], { type: mimeType });

  const form = new FormData();
  form.set("reqtype", "fileupload");
  form.set("time", "1h");
  form.set("fileToUpload", blob, `ditto-lens.${ext}`);

  const res = await fetch("https://litterbox.catbox.moe/resources/internals/api.php", {
    method: "POST",
    body: form,
  });

  const text = (await res.text()).trim();
  if (!res.ok || !/^https?:\/\//i.test(text)) {
    throw new Error(`LITTERBOX_UPLOAD_FAILED: ${text.slice(0, 120)}`);
  }
  return text;
}
