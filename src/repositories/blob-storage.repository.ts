import { del, getDownloadUrl } from "@vercel/blob";

export const BlobStorageRepository = {
  async deleteBlob(blobUrl: string): Promise<void> {
    await del(blobUrl);
  },

  getDownloadUrl(blobUrl: string): string {
    return getDownloadUrl(blobUrl);
  },
};
