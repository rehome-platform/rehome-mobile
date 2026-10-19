// Phase 3: statuses (BR-09). Phase 4: list, detail, tracking. invalidate ["orders"] → làm mới tất cả
export const orderKeys = {
  statuses: (ids) => ["orders", "status", ...ids],
  list: (tabKey) => ["orders", "list", tabKey],
  detail: (id) => ["orders", "detail", id],
  tracking: (id) => ["orders", "tracking", id],
};
