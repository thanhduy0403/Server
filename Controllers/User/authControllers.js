const User = require("../../model/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const authControllers = {
  registerUser: async (req, res) => {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(403).json({
        success: false,
        message: "Bạn đang để trống các trường trên hãy kiểm tra lại",
      });
    }
    try {
      const user = await User.findOne({ email });
      if (user) {
        return res.status(403).json({
          success: false,
          message: "Email đã tồn tại vui lòng thử lại",
        });
      }
      const hashPassword = await bcrypt.hash(password, 12);
      const newUser = new User({
        username,
        email,
        password: hashPassword,
      });
      await newUser.save();
      const { password: pwd, ...others } = newUser._doc;
      const accessToken = await authControllers.generateAccessToken(newUser);
      res.cookie("token", accessToken, {
        httpOnly: true,
        secure: false,
        sameSite: "Strict",
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 ngày
      });
      return res.status(200).json({
        success: true,
        message: "Đăng kí thành công",
        user: { ...others },
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ success: false, message: "Error" });
    }
  },

  generateAccessToken: (user) => {
    return jwt.sign(
      { id: user._id, isAdmin: user.isAdmin },
      process.env.ACCESS_TOKEN_SECRET
      //  { expiresIn: "1day" }
    );
  },

  // Login
  LoginUser: async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(403).json({
        success: false,
        message: "Bạn đang để trống các trường trên hãy kiểm tra lại",
      });
    }
    try {
      const checkUser = await User.findOne({ email });
      if (!checkUser) {
        return res
          .status(403)
          .json({ success: false, message: "Email không tồn tại" });
      }
      if (checkUser.isDelete === true) {
        return res.status(403).json({
          success: false,
          message: "Tài khoản của bạn không thể đăng nhập được",
        });
      }
      const checkPassword = await bcrypt.compare(password, checkUser.password);
      if (!checkPassword) {
        return res
          .status(403)
          .json({ success: false, message: "Mật khẩu sai hãy thử lại" });
      }
      const { password: pwd, ...others } = checkUser._doc;
      const accessToken = await authControllers.generateAccessToken(checkUser);

      // lưu token vào cookie
      res.cookie("token", accessToken, {
        httpOnly: true,
        secure: false, // `false` khi chạy trên localhost
        sameSite: "Strict",
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 ngày
      });
      return res.status(200).json({
        success: true,
        message: "Đăng nhập thành công",
        user: { ...others },
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: "Error" });
    }
  },
  // update profile
  updateProfile: async (req, res) => {
    const {
      phoneNumber,
      address,
      introduce_yourself,
      last_name,
      first_name,
      date_of_birth,
      gender,
    } = req.body;
    try {
      const updateUser = await User.findByIdAndUpdate(
        req.user.id,
        {
          phoneNumber: phoneNumber,
          address: address,
          introduce_yourself: introduce_yourself,
          last_name: last_name,
          first_name: first_name,
          date_of_birth: date_of_birth,
          gender: gender,
        },
        { new: true }
      );
      if (!updateUser) {
        return res
          .status(404)
          .json({ success: false, message: "Cập nhật thông tin thất bại" });
      }
      return res.status(200).json({
        success: true,
        message: "Cập nhật thông tin thành công",
        updateUser,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ success: false, message: "Error" });
    }
  },

  // delete user
  deleteUser: async (req, res) => {
    const userID = req.params.id;
    try {
      const user = await User.findById(userID);
      if (!user) {
        return res
          .status(403)
          .json({ success: false, message: "Không tìm thấy tài khoản" });
      }
      user.status = "Đã xóa";
      user.isDelete = true;
      await user.save();
      return res
        .status(200)
        .json({ success: true, message: "Xóa tài khoản thành công", user });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ success: false, message: "Lỗi server" });
    }
  },

  // logout
  logout: async (req, res) => {
    try {
      // xóa accessToken ra khỏi cookie
      res.cookie("token", "", {
        httpOnly: true,
        secure: false,
        path: "/",
        sameSite: "strict",
        expires: new Date(0),
      });
      return res
        .status(200)
        .json({ success: true, message: "Đăng xuất thành công" });
    } catch (error) {
      return res
        .status(500)
        .json({ success: false, message: "Đăng xuất thất bại" });
    }
  },

  getProfile: async (req, res) => {
    try {
      const user = await User.findById(req.user.id).select("-password");
      if (!user) return res.status(404).json({ message: "User not found" });

      res.status(200).json({ success: true, user });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
};

module.exports = authControllers;
