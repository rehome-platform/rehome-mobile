import { UPLOAD_FOLDER } from "@/constants/upload";
import { uploadFile } from "@/lib/api/upload";

// Ảnh đã có url (http/https — ảnh cũ của form) giữ nguyên; ảnh mới trong máy thì upload lấy url.
// folder: thư mục upload (mặc định ảnh form ký gửi)
const isRemote = (uri) => /^https?:\/\//.test(uri);

export const uploadPhotos = (
  photos,
  folder = UPLOAD_FOLDER.CONSIGNMENT_FORMS,
) =>
  Promise.all(
    photos.map((uri, i) =>
      isRemote(uri)
        ? uri
        : uploadFile(
            {
              uri,
              name: `photo-${i + 1}.jpg`,
              mimeType: "image/jpeg",
            },
            folder,
          ).then((res) => res.url),
    ),
  );
