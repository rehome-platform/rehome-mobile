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
      categoryId: "cat-ao-khoac",
      brandId: "br-levis",
      categoryName: "Áo khoác",
      brandName: "Levi's",
      description: "Size M, mặc 3 lần, không lỗi.",
      desiredPrice: 450000,
      photoUrls: [photo("rh-jean"), photo("rh-jean-2")],
      warehouse: WAREHOUSES[0],
      bringInDeadline: ymd(now.add(6, "day")),
      rejectReason: null,
      receiptId: "rc-001", // kho đã lập biên nhận, chờ Member xác nhận (KG-06)
      receiptConfirmed: false, // [CHỜ BE] API 17 cho biết biên nhận đã xác nhận chưa
      createdAt: iso(now.subtract(2, "day")),
    },
    {
      id: "form-002",
      status: "PENDING",
      productName: "Váy hoa Zara",
      categoryId: "cat-vay",
      brandId: "br-zara",
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
      categoryId: "cat-giay",
      brandId: "br-converse",
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
      categoryId: "cat-tui",
      brandId: "br-gucci",
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
      categoryId: "cat-ao",
      brandId: "br-uniqlo",
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
// Biên nhận kho lập tại quầy (API 19). Ngoài field của API_CONTRACT, mobile xin thêm
// formId, productName, brandName, size, sku, conditionNote, warehouseName [CHỜ BE]
export const seedReceipts = () => {
  const now = dayjs();
  return [
    {
      id: "rc-001",
      formId: "form-001",
      receiptNo: "KG-2026-000123",
      productName: "Áo khoác jean Levi's",
      brandName: "Levi's",
      size: "M",
      sku: "Q1-AK-000845",
      conditionNote: "Chính hãng, như mới, đủ điều kiện đăng bán",
      warehouseName: "Kho Quận 1",
      agreedPrice: 420000, // Moderator chốt tại quầy (Member đề xuất 450.000 đ)
      floorPrice: 210000, // 50% giá chốt
      termLengthDays: 30,
      maxRenewals: 2,
      freeWithdrawalWindowDays: 7,
      commissionRateTerm1: 0.1,
      commissionRateTerm2: 0.15,
      commissionRateTerm3: 0.2,
      withdrawalFee: 30000,
      degradedCompensationRate: 0.5,
      confirmedAt: null,
      pdfUrl: null,
      createdAt: iso(now.subtract(1, "hour")),
    },
  ];
};
// Sản phẩm ký gửi (API 21/22). Field theo entity Product + phần mobile xin thêm [CHỜ BE]:
// cấu hình biên nhận (termLengthDays, maxRenewals, commissionRateTerm1..3, floorPrice, agreedPrice),
// brandName, warehouseName, photoUrl, lastPriceChangedAt, priceChanges, order, termHistory
export const seedProducts = () => {
  const now = dayjs();
  const RECEIPT_TERMS = {
    termLengthDays: 30,
    maxRenewals: 2,
    commissionRateTerm1: 0.1,
    commissionRateTerm2: 0.15,
    commissionRateTerm3: 0.2,
    freeWithdrawalWindowDays: 7, // Phase 5: rút hàng miễn phí 7 ngày đầu mỗi kỳ
    withdrawalFee: 50000, // phí rút ngoài cửa sổ (theo wireframe KG-13)
  };
  return [
    {
      id: "Q1-AK-000845", // SKU — Product.id của BE là chuỗi
      name: "Áo khoác dạ nữ",
      brandName: "Uniqlo",
      size: "M",
      warehouseName: "Kho Quận 1",
      photoUrl: photo("rh-coat"),
      status: "ON_SALE",
      ...RECEIPT_TERMS,
      agreedPrice: 1000000,
      floorPrice: 500000,
      currentPrice: 1000000,
      currentTerm: 1,
      termStartedAt: iso(now.subtract(8, "day")), // ngày 9 / 90
      endOfTermDeadline: iso(now.add(22, "day")),
      lastPriceChangedAt: null,
      priceChanges: [
        {
          changedAt: iso(now.subtract(8, "day")),
          oldPrice: null,
          newPrice: 1000000,
        },
      ],
      order: null,
      endOfTermDecision: null,
    },
    {
      id: "Q1-CV-000921",
      name: "Chân váy xếp ly",
      brandName: "Mango",
      size: "S",
      warehouseName: "Kho Quận 1",
      photoUrl: photo("rh-skirt"),
      status: "ON_SALE",
      ...RECEIPT_TERMS,
      agreedPrice: 450000,
      floorPrice: 225000,
      currentPrice: 450000,
      currentTerm: 2, // ngày 4 của kỳ 2 → còn trong 7 ngày rút miễn phí
      termStartedAt: iso(now.subtract(3, "day")),
      endOfTermDeadline: iso(now.add(27, "day")),
      lastPriceChangedAt: null,
      priceChanges: [],
      order: null,
      endOfTermDecision: null,
    },

    {
      id: "Q1-QJ-000712",
      name: "Quần jeans ống rộng",
      brandName: "Levi's",
      size: "29",
      warehouseName: "Kho Quận 1",
      photoUrl: photo("rh-jeans"),
      status: "ON_SALE",
      ...RECEIPT_TERMS,
      agreedPrice: 600000,
      floorPrice: 300000,
      currentPrice: 420000,
      currentTerm: 3, // kỳ cuối, còn 4 ngày
      termStartedAt: iso(now.subtract(25, "day")),
      endOfTermDeadline: iso(now.add(4, "day")),
      lastPriceChangedAt: iso(now.subtract(3, "day")),
      priceChanges: [
        {
          changedAt: iso(now.subtract(3, "day")),
          oldPrice: 500000,
          newPrice: 420000,
        },
        {
          changedAt: iso(now.subtract(40, "day")),
          oldPrice: 600000,
          newPrice: 500000,
        },
        {
          changedAt: iso(now.subtract(85, "day")),
          oldPrice: null,
          newPrice: 600000,
        },
      ],
      order: null,
      endOfTermDecision: null,
    },
    {
      id: "Q1-VA-000533",
      name: "Váy hoa nhí",
      brandName: "Zara",
      size: "S",
      warehouseName: "Kho Quận 1",
      photoUrl: photo("rh-floral"),
      status: "RESERVED",
      ...RECEIPT_TERMS,
      agreedPrice: 680000,
      floorPrice: 340000,
      currentPrice: 680000,
      currentTerm: 1,
      termStartedAt: iso(now.subtract(30, "day")),
      endOfTermDeadline: iso(now),
      lastPriceChangedAt: null,
      priceChanges: [],
      // Hoa hồng CHỐT lúc đặt đơn (kỳ 1, ngày 28) — đơn giao sang kỳ 2 vẫn tính 10%
      order: {
        code: "DH-00231",
        status: "SHIPPING",
        lockedCommissionRate: 0.1,
        orderedTerm: 1,
        orderedDay: 28,
      },
      endOfTermDecision: null,
    },
    {
      id: "Q1-AL-000298",
      name: "Áo len cổ lọ",
      brandName: "Muji",
      size: "L",
      warehouseName: "Kho Quận 1",
      photoUrl: photo("rh-turtleneck"),
      status: "ON_SALE", // đã gỡ khỏi sàn, chờ Member chọn cách xử lý
      ...RECEIPT_TERMS,
      agreedPrice: 850000,
      floorPrice: 425000,
      currentPrice: 550000,
      currentTerm: 3,
      termStartedAt: iso(now.subtract(48, "day")),
      endOfTermDeadline: iso(now.subtract(18, "day")), // hết 90 ngày cách đây 18 ngày
      lastPriceChangedAt: iso(now.subtract(30, "day")),
      priceChanges: [],
      order: null,
      endOfTermDecision: {
        id: "eot-001",
        decision: null,
        deadline: iso(now.add(12, "day")),
        newReceiptId: null,
      },
      termHistory: [
        { term: 1, price: 850000 },
        { term: 2, price: 700000 },
        { term: 3, price: 550000 },
      ],
    },
    {
      id: "Q1-SM-000410",
      name: "Áo sơ mi linen",
      brandName: "H&M",
      size: "M",
      warehouseName: "Kho Quận 1",
      photoUrl: photo("rh-linen"),
      status: "ON_SALE",
      ...RECEIPT_TERMS,
      agreedPrice: 400000,
      floorPrice: 200000,
      currentPrice: 260000,
      currentTerm: 3,
      termStartedAt: iso(now.subtract(35, "day")),
      endOfTermDeadline: iso(now.subtract(5, "day")),
      lastPriceChangedAt: iso(now.subtract(20, "day")),
      priceChanges: [],
      order: null,
      // Đã chọn ký gửi lại, chờ Moderator đề xuất giá mới (KG-12)
      endOfTermDecision: {
        id: "eot-002",
        decision: "RE_CONSIGN",
        deadline: iso(now.add(25, "day")),
        newReceiptId: null,
      },
    },
    {
      id: "Q1-GI-000105",
      name: "Giày Nike Air Force 1",
      brandName: "Nike",
      size: "41",
      warehouseName: "Kho Quận 1",
      photoUrl: photo("rh-sneaker"),
      status: "SOLD",
      ...RECEIPT_TERMS,
      agreedPrice: 1200000,
      floorPrice: 600000,
      currentPrice: 1100000,
      currentTerm: 2,
      termStartedAt: iso(now.subtract(50, "day")),
      endOfTermDeadline: iso(now.subtract(20, "day")),
      lastPriceChangedAt: null,
      priceChanges: [],
      order: {
        code: "DH-00190",
        status: "COMPLETED",
        lockedCommissionRate: 0.15,
        orderedTerm: 2,
        orderedDay: 38,
      },
      endOfTermDecision: null,
    },
  ];
};
