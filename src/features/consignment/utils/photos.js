import { uploadFile } from "@/lib/api/upload";

// Ảnh đã có url (http/https — ảnh cũ của form) giữ nguyên; ảnh mới trong máy thì upload lấy url
const isRemote = (uri) => /^https?:\/\//.test(uri);

export const uploadPhotos = (photos) =>
  Promise.all(
    photos.map((uri, i) =>
      isRemote(uri)
        ? uri
        : uploadFile({
            uri,
            name: `photo-${i + 1}.jpg`,
            mimeType: "image/jpeg",
          }).then((res) => res.url),
    ),
  );
