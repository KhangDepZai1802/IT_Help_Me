const DEFAULT_BUCKET = "it-help-me-attachments";

function storageConfig() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const bucket = process.env.SUPABASE_STORAGE_BUCKET || DEFAULT_BUCKET;

  if (!supabaseUrl || !serviceKey) {
    throw new Error("Supabase Storage is not configured.");
  }

  return {
    supabaseUrl: supabaseUrl.replace(/\/$/, ""),
    serviceKey,
    bucket
  };
}

export function safeStorageName(fileName: string) {
  const cleaned = fileName
    .normalize("NFKD")
    .replace(/[^\w.\-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return cleaned || "attachment";
}

export function fileDownloadHref(path: string) {
  return `/api/files/${path.split("/").map(encodeURIComponent).join("/")}`;
}

export async function uploadStorageObject(path: string, file: File) {
  const { supabaseUrl, serviceKey, bucket } = storageConfig();
  const response = await fetch(`${supabaseUrl}/storage/v1/object/${bucket}/${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${serviceKey}`,
      apikey: serviceKey,
      "Content-Type": file.type || "application/octet-stream",
      "x-upsert": "false"
    },
    body: file
  });

  if (!response.ok) {
    const message = await response.text().catch(() => "");
    throw new Error(message || "Không thể upload file lên Supabase Storage.");
  }
}

export async function downloadStorageObject(path: string) {
  const { supabaseUrl, serviceKey, bucket } = storageConfig();
  const response = await fetch(`${supabaseUrl}/storage/v1/object/${bucket}/${path}`, {
    headers: {
      Authorization: `Bearer ${serviceKey}`,
      apikey: serviceKey
    }
  });

  if (!response.ok) {
    throw new Error("Không thể tải file từ Supabase Storage.");
  }

  return response;
}

export async function deleteStorageObject(path: string) {
  const { supabaseUrl, serviceKey, bucket } = storageConfig();
  const response = await fetch(`${supabaseUrl}/storage/v1/object/${bucket}/${path}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${serviceKey}`,
      apikey: serviceKey
    }
  });

  if (!response.ok && response.status !== 404) {
    const message = await response.text().catch(() => "");
    throw new Error(message || "Không thể xóa file khỏi Supabase Storage.");
  }
}
