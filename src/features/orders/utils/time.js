import dayjs from "dayjs";

// BE trả Instant: thường là chuỗi ISO có "Z" (UTC). Nếu Jackson trả dạng số (giây) thì đổi về đúng mốc
export const toDate = (v) => (typeof v === "number" ? dayjs.unix(v) : dayjs(v));
