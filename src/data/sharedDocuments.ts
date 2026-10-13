export interface SharedDocument {
  id: string;
  name: string;
  category: string;
  client: string;
  size: number;
  mimeType: string;
  updatedAt: string;
  hasFile?: boolean;
}

const request = async <T,>(url: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(url, { ...init, credentials: "include" });
  const result = await response.json().catch(() => ({})) as { error?: string } & T;
  if (!response.ok) throw new Error(result.error || `Request failed (${response.status})`);
  return result;
};

export const listSharedDocuments = async () => {
  const result = await request<{ data: SharedDocument[] }>("/api/documents?limit=10000");
  return result.data;
};

export const uploadSharedDocument = async (
  metadata: Pick<SharedDocument, "id" | "name" | "category" | "client" | "size" | "mimeType">,
  file: Blob
) => {
  const { data } = await request<{ data: { uploadUrl: string } }>("/api/documents/upload-url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(metadata)
  });
  const uploaded = await fetch(data.uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": metadata.mimeType },
    body: file
  });
  if (!uploaded.ok) throw new Error(`Cloud document upload failed (${uploaded.status})`);
  await request("/api/documents/confirm-upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: metadata.id })
  });
};

export const getSharedDocumentDownloadUrl = async (id: string) => {
  const { data } = await request<{ data: { url: string } }>(`/api/documents/${encodeURIComponent(id)}/download-url`);
  return data.url;
};

export const deleteSharedDocument = async (id: string) => {
  const response = await fetch(`/api/documents/${encodeURIComponent(id)}`, {
    method: "DELETE",
    credentials: "include"
  });
  if (!response.ok) {
    const result = await response.json().catch(() => ({})) as { error?: string };
    throw new Error(result.error || `Could not delete document (${response.status})`);
  }
};
