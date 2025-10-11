const User = require("../../model/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const userControllers = {
  // // Register
  registerUser: async (req, res) => {
    const { username, email, password, role } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Bạn đang để trống các trường trên hãy kiểm tra lại",
      });
    }
    try {
      const user = await User.findOne({ email });
      if (user) {
        return res.status(400).json({
          success: "false",
          message: "Email đã tồn tại vui lòng thử lại",
        });
      }
      const hashPassword = await bcrypt.hash(password, 12);
      const newUser = new User({
        username,
        email,
        password: hashPassword,
        role,
      });
      await newUser.save();
      res.status(200).json({ success: true, message: "Đăng kí thành công" });
    } catch (error) {
      console.log(error);
      res.status(403).json({ success: false, message: "Đăng kí thất bại" });
    }
  },

  generateAccessToken: (user) => {
    return jwt.sign(
      { id: user._id, role: user.role },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "7d" }
    );
  },

  // Login
  loginUser: async (req, res) => {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Bạn đang để trống các trường trên hãy kiểm tra lại",
      });
    }
    try {
      const checkUser = await User.findOne({ email });

      if (!checkUser) {
        return res
          .status(400)
          .json({ success: false, message: "Không tồn tại tài khoản" });
      }
      if (checkUser.username !== username) {
        return res.status(400).json({
          success: false,
          message: "Username Email hoặc Mật khẩu sai hãy kiểm tra lại ",
        });
      }
      // password được user nhập vào
      // checkUser.password password được mã hóa trên database
      const checkPassword = await bcrypt.compare(password, checkUser.password);
      if (!checkPassword) {
        return res.status(400).json({
          success: false,
          message: "Username Email hoặc Mật khẩu sai hãy kiểm tra lại",
        });
      }
      const { password: pwd, ...others } = checkUser._doc;
      const token = userControllers.generateAccessToken(checkUser);

      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });

      return res.status(200).json({
        success: true,
        checkUser: { ...others },
        // token,
      });
    } catch (error) {
      console.log(error);
      return res
        .status(500)
        .json({ success: false, message: "Đăng nhập thất bại" });
    }
  },

  // logout
  logout: async (req, res) => {
    try {
      res.clearCookie("token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      });
      return res
        .status(200)
        .json({ success: true, message: "Đăng xuất thành công" });
    } catch (error) {
      console.log(error);
      return res
        .status(500)
        .json({ success: false, message: "Đăng xuất thất bại" });
    }
  },

  // get all
  // getAllUser: async (req, res) => {
  //   const getAll = await User.find().select("-password");
  //   try {
  //     if (!getAll) {
  //       return res
  //         .status(400)
  //         .json({ success: false, message: "Xem thất bại" });
  //     }
  //     const usersWithEndpoints = getAll.map((user) => {
  //       const endpointMap = {};

  //       // Nối các endpoint từ tất cả permission của user
  //       user.permissions.forEach((permission) => {
  //         permission.endpoints.forEach((endpoint) => {
  //           endpointMap[endpoint._id.toString()] = endpoint.title;
  //         });
  //       });

  //       const allowedEndpoints = user.allowedEndpoints.map((id) => ({
  //         id,
  //         title: endpointMap[id.toString()] || "không tìm thấy",
  //       }));

  //       // Trả về user mới (ẩn password) và thêm allowedEndpoints đã map
  //       const userObj = user.toObject();
  //       delete userObj.password;
  //       return {
  //         ...userObj,
  //         allowedEndpoints,
  //       };
  //     });
  //     const users = usersWithEndpoints;
  //     return res.json({
  //       users,
  //     });
  //   } catch (error) {
  //     return res.status(403).json({
  //       success: false,
  //       message: "error",

  //       getAll: {
  //         ...getAll.toObject(), // Chuyển đổi detailUser thành object
  //         allowedEndpoints: undefined, // Ẩn trường allowedEndpoints
  //       },
  //       allowedEndpoints: allowedEndpoint,
  //     });
  //   }
  // },
  getAllUser: async (req, res) => {
    const getAll = await User.find().select("-password");
    try {
      if (!getAll || getAll.length === 0) {
        res.status(403).json({ success: false, message: "Danh sách trống" });
      }
      res
        .status(200)
        .json({ success: true, message: "Danh sách người dùng", getAll });
    } catch (error) {
      res.status(500).json({ success: false, message: "Error" });
    }
  },

  // get detail user
  getDetailUser: async (req, res) => {
    const userID = req.params.id;
    const detailUser = await User.findById(userID)
      .select("-password")
      .populate("permissions");
    console.log("detailUser", detailUser.permissions);
    try {
      if (!detailUser) {
        return res
          .status(400)
          .json({ success: false, message: "Không tìm thấy user" });
      }

      const endpointMap = {};
      // lặp qua permissions trong model auth
      detailUser.permissions.forEach((permission) => {
        // lặp qua từng endpoint bên trong mỗi permission
        // sau đó lặp qua endpoints trong model permission
        permission.endpoints.forEach((endpoint) => {
          endpointMap[endpoint._id.toString()] = endpoint.title;
        });
      });

      // kết hợp sử dụng endpointMap để lấy các endpoint từ permissions
      const allowedEndpointDetails = detailUser.allowedEndpoints.map((id) => ({
        id,
        title: endpointMap[id.toString()] || "không tìm thấy",
      }));
      return res.status(200).json({
        success: true,
        message: "Chi tiết user",
        detailUser: {
          ...detailUser.toObject(), // Chuyển đổi detailUser thành object
          allowedEndpoints: undefined, // Ẩn trường allowedEndpoints
        },
        allowedEndpoints: allowedEndpointDetails,
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: "Lỗi" });
    }
  },

  deleteUser: async (req, res) => {
    const userID = req.params.id;
    try {
      const user = await User.findById(userID);
      if (!user) {
        return res
          .status(403)
          .json({ success: false, message: "Không tìm thấy người dùng" });
      } else {
        user.status = "Đã xóa";
        await user.save();
        return res
          .status(200)
          .json({ success: true, message: "Xóa người dùng thành công", user });
      }
    } catch (error) {
      return res.status(500).json({ success: false, message: "Lỗi" });
    }
  },
};

module.exports = userControllers;
