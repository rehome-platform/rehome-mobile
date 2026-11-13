export const membershipKeys = {
  all: ["membership"],
  plans: ["membership", "plans"],
  me: ["membership", "me"],
  history: ["membership", "history"],
  vouchers: (status) => ["vouchers", status],
};
