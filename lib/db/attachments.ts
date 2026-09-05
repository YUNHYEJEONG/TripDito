import "server-only";
import { ulid } from "ulid";
import { getSql } from "./client";
import { publicUrl } from "@/lib/r2/client";

export type AttachmentFile = {
  seq: number;
  fileName: string;
  originalName: string;
  extension: string;
  size: number;
  /** R2 오브젝트 키 */
  path: string;
  /** 공개 URL (R2_PUBLIC_BASE_URL 설정 시) */
  url: string | null;
};

export type Attachment = {
  id: string;
  fileCount: number;
  files: AttachmentFile[];
};

export const ALLOWED_IMAGE_EXT = ["jpg", "jpeg", "png", "webp", "gif"] as const;

export function extensionOf(name: string) {
  return name.split(".").pop()?.toLowerCase() ?? "";
}

/** 업로드 묶음 ID + 오브젝트 키 생성 (업로드 전에 호출) */
export function newAttachmentId() {
  return ulid();
}

export function buildObjectKey(
  scope: "shots" | "items" | "avatars",
  attachmentId: string,
  seq: number,
  ext: string,
) {
  return `${scope}/${attachmentId}/${seq}.${ext}`;
}

/** R2 업로드가 끝난 파일들을 ATCM_FILE_INFO / ATCM_FILE_DETL_INFO 에 기록 */
export async function registerAttachment(input: {
  id: string;
  ownerSn: number | null;
  files: Array<{
    seq: number;
    originalName: string;
    extension: string;
    size: number;
    path: string;
  }>;
}): Promise<Attachment> {
  const sql = getSql();
  await sql.query(
    `INSERT INTO atcm_file_info (atcm_file_id, file_cnt, rgstr_sn)
     VALUES ($1, $2, $3)
     ON CONFLICT (atcm_file_id) DO UPDATE SET file_cnt = EXCLUDED.file_cnt`,
    [input.id, input.files.length, input.ownerSn],
  );
  for (const f of input.files) {
    const fileName = f.path.split("/").pop() ?? f.path;
    await sql.query(
      `INSERT INTO atcm_file_detl_info
         (atcm_file_id, atcm_file_seq, file_nm, file_ortx_nm, file_xtns_nm, file_mg, file_path)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (atcm_file_id, atcm_file_seq) DO UPDATE
         SET file_nm = EXCLUDED.file_nm, file_ortx_nm = EXCLUDED.file_ortx_nm,
             file_xtns_nm = EXCLUDED.file_xtns_nm, file_mg = EXCLUDED.file_mg,
             file_path = EXCLUDED.file_path, use_at = 'Y'`,
      [input.id, f.seq, fileName, f.originalName, f.extension, f.size, f.path],
    );
  }
  return (await getAttachment(input.id))!;
}

type DetlRow = {
  atcm_file_id: string;
  atcm_file_seq: number;
  file_nm: string;
  file_ortx_nm: string;
  file_xtns_nm: string;
  file_mg: string | number;
  file_path: string;
};

function toFile(r: DetlRow): AttachmentFile {
  return {
    seq: r.atcm_file_seq,
    fileName: r.file_nm,
    originalName: r.file_ortx_nm,
    extension: r.file_xtns_nm,
    size: Number(r.file_mg),
    path: r.file_path,
    url: publicUrl(r.file_path),
  };
}

/** 이미 등록된 첨부 ID 인지 (재등록으로 다른 사람 첨부를 덮어쓰는 것을 막는다) */
export async function attachmentExists(id: string) {
  const sql = getSql();
  const rows = (await sql.query(
    `SELECT 1 FROM atcm_file_info WHERE atcm_file_id = $1`,
    [id],
  )) as unknown[];
  return rows.length > 0;
}

export async function getAttachment(id: string): Promise<Attachment | null> {
  const map = await getAttachments([id]);
  return map.get(id) ?? null;
}

/** 여러 묶음을 한 번에 조회 (목록 화면용) */
export async function getAttachments(
  ids: string[],
): Promise<Map<string, Attachment>> {
  const result = new Map<string, Attachment>();
  const unique = [...new Set(ids.filter(Boolean))];
  if (unique.length === 0) return result;
  const sql = getSql();
  const rows = (await sql.query(
    `SELECT atcm_file_id, atcm_file_seq, file_nm, file_ortx_nm, file_xtns_nm, file_mg, file_path
       FROM atcm_file_detl_info
      WHERE atcm_file_id = ANY($1) AND use_at = 'Y'
      ORDER BY atcm_file_id, atcm_file_seq`,
    [unique],
  )) as DetlRow[];
  for (const r of rows) {
    const a = result.get(r.atcm_file_id) ?? {
      id: r.atcm_file_id,
      fileCount: 0,
      files: [],
    };
    a.files.push(toFile(r));
    a.fileCount = a.files.length;
    result.set(r.atcm_file_id, a);
  }
  return result;
}

export async function softDeleteAttachment(id: string) {
  const sql = getSql();
  await sql.query(
    `UPDATE atcm_file_info SET use_at = 'N' WHERE atcm_file_id = $1`,
    [id],
  );
  await sql.query(
    `UPDATE atcm_file_detl_info SET use_at = 'N' WHERE atcm_file_id = $1`,
    [id],
  );
}
