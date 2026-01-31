const User = require("../../model/User");
const Session = require("../../model/Session");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const ACCESS_TOKEN_TTL = "10s";
const REFRESH_TOKEN_TTL = 14 * 24 * 60 * 60 * 1000;
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
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "30d" },
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
        return res.status(403).json({
          success: false,
          message: "Email hoặc Mật Khẩu không đúng hãy thử lại",
        });
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
  Signup: async (req, res) => {
    try {
      const { username, email, password } = req.body;
      if (!email || !password || !username) {
        return res
          .status(400)
          .json({ success: false, message: "hãy điền đầy đủ thông tin" });
      }
      const existingEmail = await User.findOne({ email });
      if (existingEmail) {
        return res
          .status(409)
          .json({ success: false, message: "email đã tồn tại" });
      }
      // hashPassword
      const hashPassword = await bcrypt.hash(password, 10);
      await User.create({
        username,
        email,
        hashPassword,
      });
      return res
        .status(200)
        .json({ success: true, message: "Đăng ký thành công" });
    } catch (error) {
      return res.status(500).json({ success: false, message: "Lỗi server" });
    }
  },
  Signin: async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res
          .status(400)
          .json({ success: false, message: "thiếu username và password" });
      }
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(401).json({
          success: false,
          message: "email hoặc password không tồn tại",
        });
      }
      const passwordCorrect = await bcrypt.compare(password, user.hashPassword);
      if (!passwordCorrect) {
        return res.status(401).json({
          success: false,
          message: "email và password không chính xác",
        });
      }
      // tạo accessToken nếu thành công
      const accessToken = jwt.sign(
        { userId: user._id },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: ACCESS_TOKEN_TTL },
      );
      // tạo refreshToken
      const refreshToken = crypto.randomBytes(64).toString("hex");
      await Session.create({
        userId: user._id,
        refreshToken,
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL),
      });
      // trả refreshToken về cookies
      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: false, //local
        sameSite: "lax", //local
        // secure: true, //chỉ gửi qua https
        // sameSite: "none",
        maxAge: REFRESH_TOKEN_TTL,
      });
      // trả accesstoken trong res
      return res
        .status(200)
        .json({ success: true, message: "Đăng nhập thành công", accessToken });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ success: false, message: "Lỗi server" });
    }
  },

  fetchMe: async (req, res) => {
    try {
      const user = req.user;
      return res.status(200).json({
        user,
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: "lỗi server" });
    }
  },
  refreshToken: async (req, res) => {
    try {
      const token = req.cookies?.refreshToken;
      if (!token) {
        return res.status(401).json({
          success: false,
          message: "Token không tồn tại",
        });
      }

      const session = await Session.findOne({ refreshToken: token });
      if (!session) {
        return res.status(403).json({
          success: false,
          message: "Token không hợp lệ",
        });
      }

      if (session.expiresAt < new Date()) {
        await Session.deleteOne({ _id: session._id }); //  Xóa session hết hạn
        return res.status(403).json({
          success: false,
          message: "Token đã hết hạn",
        });
      }

      const accessToken = jwt.sign(
        { userId: session.userId },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: ACCESS_TOKEN_TTL },
      );

      //  Lấy thông tin user luôn
      const user = await User.findById(session.userId).select("-hashPassword");

      return res.status(200).json({
        success: true,
        accessToken,
        user, // Trả luôn user để không phải fetch thêm
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        success: false,
        message: "Lỗi server",
      });
    }
  },
  loginFacebook: async (req, res) => {
    const { accessToken, email, userID, picture, name } = req.body;
    try {
      let user = await User.findOne({ email });
      if (!user) {
        user = await User.create({
          username: name,
          email,
          picture: picture,
          facebookID: userID,
          password: null,
        });
      }
      if (user.isDelete === true) {
        return res.status(403).json({
          success: false,
          message: "Tài khoản của bạn đã bị khóa!",
        });
      }
      const jwtToken = authControllers.generateAccessToken(user);
      res.cookie("token", jwtToken, {
        httpOnly: true,
        secure: false,
        sameSite: "Strict",
        maxAge: 30 * 24 * 60 * 60 * 1000,
      });
      const { password, ...others } = user._doc;

      return res.status(200).json({
        success: true,
        message: "Đăng nhập thành công",
        user: others,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Lỗi server",
      });
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
        { new: true },
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
      // xóa token ở cookie
      res.clearCookie("token");
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
      // lấy refreshToken từ cookies
      const token = req.cookies?.refreshToken;
      if (token) {
        // xóa refreshToken từ session (ở collection) hủy phiên đăng nhập trong db
        await Session.deleteOne({ refreshToken: token });
        // xóa refreshToken từ cookies (ở trình duyệt)
        res.clearCookie("refreshToken");
      }
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
