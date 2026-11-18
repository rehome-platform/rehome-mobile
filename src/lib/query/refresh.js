import { queryClient } from "./queryClient";

// Kéo xuống để tải lại (Screen onRefresh / RefreshControl): tải lại MỌI dữ liệu đang được màn hình dùng
// (query đang có người xem). Không phải liệt kê từng query của từng màn, màn thêm dữ liệu mới cũng tự được tải lại.
// Trả Promise → vòng xoay tắt đúng lúc tải xong
export const refreshActive = () =>
  queryClient.refetchQueries({ type: "active" });
