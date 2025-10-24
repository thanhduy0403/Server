const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");
// Router Admin
const accountRouterAdmin = require("./routes/AdminRoutes/Account");
const authRouterAdmin = require("./routes/AdminRoutes/user");
const categoryRouterAdmin = require("./routes/AdminRoutes/category");
const productRouterAdmin = require("./routes/AdminRoutes/product");
const cartRouterAdmin = require("./routes/AdminRoutes/cart");
const orderRouterAdmin = require("./routes/AdminRoutes/order");
const permissionRouterAdmin = require("./routes/AdminRoutes/permission");
const queryRouterAdmin = require("./routes/AdminRoutes/query");
const voucherRouterAdmin = require("./routes/AdminRoutes/voucher");
const commentRouterAdmin = require("./routes/AdminRoutes/comment");
// Router User
const authRouterUser = require("./routes/UserRoutes/user");
const categoryRouterUser = require("./routes/UserRoutes/category");
const productRouterUser = require("./routes/UserRoutes/product");
const cartRouterUser = require("./routes/UserRoutes/cart");
const orderRouterUser = require("./routes/UserRoutes/order");
const favoriteRouterUser = require("./routes/UserRoutes/favorite");
const chatRouterUser = require("./routes/UserRoutes/chat");
const voucherRouterUser = require("./routes/UserRoutes/voucher");
const forgotRouterUser = require("./routes/UserRoutes/ForgotPassword");
const VNPayRouterUser = require("./routes/UserRoutes/vnpay");
const commentRouterUser = require("./routes/UserRoutes/comment");
const feedbackRouter = require("./routes/UserRoutes/feedback");
dotenv.config();

const path = require("path");
const app = express();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.connectDB);
    console.log("connect success");
  } catch (error) {
    console.log(error.message);
    process.exit(1);
  }
};
connectDB();

const corsOptions = {
  origin: ["http://localhost:3000", "http://localhost:3001"],
  credentials: true, // Cho phép gửi cookie
};
app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json());
app.use("/images", express.static(path.join(__dirname, "images")));
// Router Admin
const adminRouter = express.Router();

adminRouter.use("/account", accountRouterAdmin);
adminRouter.use("/auth", authRouterAdmin);
adminRouter.use("/category", categoryRouterAdmin);
adminRouter.use("/product", productRouterAdmin);
adminRouter.use("/cart", cartRouterAdmin);
adminRouter.use("/order", orderRouterAdmin);
adminRouter.use("/permission", permissionRouterAdmin);
adminRouter.use("/query", queryRouterAdmin);
adminRouter.use("/voucher", voucherRouterAdmin);
adminRouter.use("/comment", commentRouterAdmin);

// Router User
const userRouter = express.Router();
userRouter.use("/category", categoryRouterUser);
userRouter.use("/product", productRouterUser);
userRouter.use("/auth", authRouterUser);
userRouter.use("/cart", cartRouterUser);
userRouter.use("/order", orderRouterUser);
userRouter.use("/favorite", favoriteRouterUser);
userRouter.use("/chat", chatRouterUser);
userRouter.use("/voucher", voucherRouterUser);
userRouter.use("/forgot", forgotRouterUser);
userRouter.use("/pay", VNPayRouterUser);
userRouter.use("/comment", commentRouterUser);
userRouter.use("/feedback", feedbackRouter);
// main router
app.use("/v1/admin", adminRouter);
app.use("/v1/user", userRouter);

const PORT = 5000;

app.listen(PORT, () => {
  console.log(`server is running ${PORT}`);
});
