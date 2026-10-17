import dayjs from "dayjs";

// Dữ liệu mẫu đủ trạng thái giống wireframe KG-01. Ngày tính theo "bây giờ" → lúc nào mở cũng đúng "còn X ngày"
const iso = (d) => d.toISOString(); // Instant của BE: "2026-10-17T08:00:00.000Z"
const ymd = (d) => d.format("YYYY-MM-DD"); // LocalDate của BE: "2026-10-23"
const photo = (seed) => `https://picsum.photos/seed/${seed}/400`; // ảnh minh hoạ công khai

export const WAREHOUSES = [
  {
    id: "wh-q1",
    name: "Kho Quận 1",
    address: "12 Nguyễn Trãi, P. Bến Thành, Q.1, TP.HCM",
    latitude: 10.7712,
    longitude: 106.6929,
    openingHours: "08:00–20:00, T2–CN",
  },
  {
    id: "wh-bt",
    name: "Kho Bình Thạnh",
    address: "45 Xô Viết Nghệ Tĩnh, P.17, Bình Thạnh, TP.HCM",
    latitude: 10.8011,
    longitude: 106.7112,
    openingHours: "08:00–18:00, T2–T7",
  },
  {
    id: "wh-td",
    name: "Kho Thủ Đức",
    address: "1 Võ Văn Ngân, P. Linh Chiểu, TP. Thủ Đức",
    latitude: 10.8506,
    longitude: 106.7719,
    openingHours: "08:00–18:00, T2–T7",
  },
];

// Hàm (không phải mảng) → mỗi lần gọi tạo bản mới, dữ liệu gốc không bị sửa theo
export const seedForms = () => {
  const now = dayjs();
  return [
    {
      id: "form-001",
      status: "APPROVED",
      productName: "Áo khoác jean Levi's",
      categoryName: "Áo khoác",
      brandName: "Levi's",
      description: "Size M, mặc 3 lần, không lỗi.",
      desiredPrice: 450000,
      photoUrls: [photo("rh-jean"), photo("rh-jean-2")],
      warehouse: WAREHOUSES[0],
      bringInDeadline: ymd(now.add(6, "day")),
      rejectReason: null,
      receiptId: "rc-001", // kho đã lập biên nhận, chờ Member xác nhận (KG-06)
      createdAt: iso(now.subtract(2, "day")),
    },
    {
      id: "form-002",
      status: "PENDING",
      productName: "Váy hoa Zara",
      categoryName: "Váy đầm",
      brandName: "Zara",
      description: "Size S, còn tag, chưa mặc.",
      desiredPrice: 320000,
      photoUrls: [photo("rh-dress")],
      warehouse: WAREHOUSES[1],
      bringInDeadline: null,
      rejectReason: null,
      receiptId: null,
      createdAt: iso(now.subtract(3, "hour")),
    },
    {
      id: "form-003",
      status: "PENDING",
      productName: "Giày Converse Chuck 70",
      categoryName: "Giày dép",
      brandName: "Converse",
      description: "Size 40, đế mòn nhẹ.",
      desiredPrice: 600000,
      photoUrls: [photo("rh-shoes")],
      warehouse: WAREHOUSES[0],
      bringInDeadline: null,
      rejectReason: null,
      receiptId: null,
      createdAt: iso(now.subtract(1, "day")),
    },
    {
      id: "form-004",
      status: "REJECTED",
      productName: "Túi xách Gucci",
      categoryName: "Túi xách",
      brandName: "Gucci",
      description: "Mua ở nước ngoài, không còn hoá đơn.",
      desiredPrice: 5000000,
      photoUrls: [photo("rh-bag")],
      warehouse: WAREHOUSES[2],
      bringInDeadline: null,
      rejectReason:
        "Ảnh chưa thấy rõ tem và mã sản phẩm, chưa đủ cơ sở xác định hàng chính hãng.",
      receiptId: null,
      createdAt: iso(now.subtract(5, "day")),
    },
    {
      id: "form-005",
      status: "EXPIRED",
      productName: "Áo len Uniqlo",
      categoryName: "Áo",
      brandName: "Uniqlo",
      description: "Size L, đã giặt, không xù.",
      desiredPrice: 150000,
      photoUrls: [photo("rh-sweater")],
      warehouse: WAREHOUSES[1],
      bringInDeadline: ymd(now.subtract(10, "day")),
      rejectReason: null,
      receiptId: null,
      createdAt: iso(now.subtract(18, "day")),
    },
  ];
};
