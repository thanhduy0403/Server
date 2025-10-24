const Order = require("../../model/order");
const Product = require("../../model/product");
const User = require("../../model/User");
const {
  getMonthBoundaries,
  getTodayAndYesterday,
} = require("../../utils/dateUtils");

const getDashboardStart = async (req, res) => {
  try {
    const selectedMonth =
      parseInt(req.query.month) || new Date().getMonth() + 1;
    const selectedYear = parseInt(req.query.year) || new Date().getFullYear();
    // tháng hiện tại
    const { startOfMonth, endOfMonth } = getMonthBoundaries(
      selectedMonth,
      selectedYear
    );
    // tháng trước
    let prevMonth = selectedMonth - 1;
    let prevYear = selectedYear;
    if (prevMonth === 0) {
      prevMonth = 12;
      prevYear -= 1;
    }
    const { startOfMonth: startPrev, endOfMonth: endPrev } = getMonthBoundaries(
      prevMonth,
      prevYear
    );

    // ==== THÁNG HIỆN TẠI ====
    // tổng khách hàng trong tháng
    const total_Users = await User.countDocuments({
      createdAt: { $gte: startOfMonth, $lte: endOfMonth },
      isDelete: false,
    });
    // tổng sản phẩm trong tháng
    const total_Products = await Product.countDocuments({
      createdAt: { $gte: startOfMonth, $lte: endOfMonth },
      isDelete: false,
    });
    // tổng số đơn hàng trong tháng
    const total_orders = await Order.countDocuments({
      createdAt: { $gte: startOfMonth, $lte: endOfMonth },
    });
    //tổng doanh thu trong tháng hiện tại
    const totalRevenueAgg = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfMonth, $lte: endOfMonth },
          $or: [
            { orderStatus: "Hoàn Thành" },
            { paymentMethod: "Thanh Toán Online" },
          ],
        },
      },
      { $group: { _id: null, total: { $sum: "$totalPriceProduct" } } },
    ]);
    const totalRevenue = totalRevenueAgg[0]?.total || 0;

    // top sản phẩm bán chạy trong tháng
    const bestSellingProducts = await Order.aggregate([
      {
        $match: { createdAt: { $gte: startOfMonth, $lte: endOfMonth } },
      },
      { $unwind: "$products" },
      {
        $group: {
          _id: "$products.product",
          totalSold: { $sum: "$products.quantity" },
        },
      },
      { $sort: { totalSold: -1 } },
      { $limit: 4 },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "productInfo",
        },
      },

      { $unwind: "$productInfo" },
      {
        $lookup: {
          from: "categories", // collection category
          localField: "productInfo.categoryID",
          foreignField: "_id",
          as: "category",
        },
      },
      {
        $project: {
          productId: "$productInfo._id",
          name: "$productInfo.name",
          price: "$productInfo.price",
          categoryName: "$category.name",
          image: "$productInfo.image", // nếu có ảnh
          totalSold: 1,
        },
      },
    ]);

    // ==== THÁNG TRƯỚC ====
    const lastMonthUsers = await User.countDocuments({
      createdAt: { $gte: startPrev, $lte: endPrev },
      isDelete: false,
    });

    const lastMonthProducts = await Product.countDocuments({
      createdAt: { $gte: startPrev, $lte: endPrev },
      isDelete: false,
    });

    const lastMonthOrders = await Order.countDocuments({
      createdAt: { $gte: startPrev, $lte: endPrev },
    });

    const lastMonthRevenueAgg = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startPrev, $lte: endPrev },
          $or: [
            { orderStatus: "Hoàn Thành" },
            { paymentMethod: "Thanh Toán Online" },
          ],
        },
      },
      { $group: { _id: null, total: { $sum: "$totalPriceProduct" } } },
    ]);
    const lastMonthRevenue = lastMonthRevenueAgg[0]?.total || 0;

    // tính phần trăm thay đổi
    const calcPercent = (current, prev) => {
      if (prev === 0) return current > 0 ? 100 : 0;
      if (current === 0) return 0;
      return (((current - prev) / prev) * 100).toFixed(1);
    };
    const percentChange = {
      revenue: calcPercent(totalRevenue, lastMonthRevenue),
      orders: calcPercent(total_orders, lastMonthOrders),
      products: calcPercent(total_Products, lastMonthProducts),
      users: calcPercent(total_Users, lastMonthUsers),
    };
    res.status(200).json({
      success: true,
      month: selectedMonth,
      year: selectedYear,
      total_Users,
      total_Products,
      total_orders,
      totalRevenue,
      percentChange,
      bestSellingProducts,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Error" });
  }
};
const getDailyData = async (req, res) => {
  try {
    // order
    const { todayStart, todayEnd, yesterdayStart, yesterdayEnd } =
      getTodayAndYesterday();
    const todayOrderCount = await Order.countDocuments({
      createdAt: { $gte: todayStart, $lte: todayEnd },
      isDeleted: false,
    });
    const yesterdayOrderCount = await Order.countDocuments({
      createdAt: { $gte: yesterdayStart, $lte: yesterdayEnd },
      isDeleted: false,
    });
    // revenue
    const todayRevenueAgg = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: todayStart, $lte: todayEnd },
          isDeleted: false,
          $or: [
            { orderStatus: "Hoàn Thành" },
            { paymentMethod: "Thanh Toán Online" },
          ],
        },
      },
      { $group: { _id: null, total: { $sum: "$totalPriceProduct" } } },
    ]);
    const todayRevenue =
      todayRevenueAgg.length > 0 ? todayRevenueAgg[0].total : 0;
    const yesterdayRevenueAgg = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: yesterdayStart, $lte: yesterdayEnd },
          isDeleted: false,
          $or: [
            { orderStatus: "Hoàn Thành" },
            { paymentMethod: "Thanh Toán Online" },
          ],
        },
      },
      { $group: { _id: null, total: { $sum: "$totalPriceProduct" } } },
    ]);
    const yesterdayRevenue =
      yesterdayRevenueAgg.length > 0 ? yesterdayRevenueAgg[0].total : 0;

    // users
    const todayUsersCount = await User.countDocuments({
      createdAt: { $gte: todayStart, $lte: todayEnd },
      isDelete: false,
    });
    const yesterdayUsersCount = await User.countDocuments({
      createdAt: { $gte: yesterdayStart, $lte: yesterdayEnd },
      isDelete: false,
    });

    // tính phần trăm
    const calcPercent = (current, prev) => {
      if (prev === 0) return current > 0 ? 100 : 0; // nếu hôm qua = 0
      if (current === 0) return 0; // nếu hôm nay = 0 => phần trăm = 0
      return (((current - prev) / prev) * 100).toFixed(1);
    };
    const percentChange = {
      PercentOrders: calcPercent(todayOrderCount, yesterdayOrderCount),
      PercentRevenue: calcPercent(todayRevenue, yesterdayRevenue),
      PercentUsers: calcPercent(todayUsersCount, yesterdayUsersCount),
    };
    return res.status(200).json({
      success: true,
      todayOrderCount,
      yesterdayOrderCount,
      todayRevenue,
      yesterdayRevenue,
      todayUsersCount,
      yesterdayUsersCount,
      percentChange,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: error });
  }
};
module.exports = { getDashboardStart, getDailyData };
