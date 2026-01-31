const Account = require("../../model/Account");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const accountControllers = {
  createAccount: async (req, res) => {
    const { fullname, email, password } = req.body;
    try {
      if (fullname === "" || email === "" || password === "") {
        return res
          .status(403)
          .json({ success: false, message: "Hãy điền đầy đủ thông tin" });
      }
      const checkEmail = await Account.findOne({ email });
      if (checkEmail) {
        return res
          .status(403)
          .json({ success: false, message: "Email đã tồn tại" });
      }
      const hashPassword = await bcrypt.hash(password, 12);
      const newAccount = new Account({
        fullname,
        email,
        password: hashPassword,
      });
      await newAccount.save();
      return res
        .status(200)
        .json({ success: true, message: "Tạo mới tài khoản thành công" });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ success: false, message: "Lỗi" });
    }
  },

  generateAccessToken: (user) => {
    return jwt.sign(
      { id: user._id, role: user.role },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "7d" }
    );
  },

  loginAccount: async (req, res) => {
    const { email, password } = req.body;
    console.log("Request body:", req.body);

    try {
      if (!email || !password) {
        return res
          .status(403)
          .json({ success: false, message: "Hãy điền đầy đủ thông tin" });
      }

      const checkAccount = await Account.findOne({ email });
      if (!checkAccount) {
        return res
          .status(403)
          .json({ success: false, message: "Không tồn tại tài khoản" });
      }

      const checkPassword = await bcrypt.compare(
        password,
        checkAccount.password
      );
      if (!checkPassword) {
        return res.status(403).json({
          success: false,
          message: "Email hoặc password sai hãy kiểm tra lại",
        });
      }
      if (checkAccount.role !== "admin" && checkAccount.role !== "subadmin") {
        return res
          .status(403)
          .json({ success: false, message: "Bạn không đủ quyền truy cập" });
      }

      const { password: pwd, ...others } = checkAccount._doc;
      const token = accountControllers.generateAccessToken(checkAccount);

      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });

      return res.status(200).json({
        success: true,
        message: "Đăng nhập thành công",
        user: { ...others },
      });
    } catch (error) {
      console.log(error);
      return res
        .status(500)
        .json({ success: false, message: "Đăng nhập thất bại" });
    }
  },

  getAllAccount: async (req, res) => {
    try {
      const AccountList = await Account.find({ role: { $ne: "admin" } }).select(
        "-password"
      );
      if (!AccountList) {
        return res
          .status(403)
          .json({ success: false, message: "Danh sách trống" });
      } else {
        return res
          .status(200)
          .json({ success: true, message: "Danh sách account", AccountList });
      }
    } catch (error) {
      return res.status(500).json({ success: false, message: "Error" });
    }
  },

  logoutAccount: async (req, res) => {
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
  getDetailAccount: async (req, res) => {
    const accountID = req.params.id;
    try {
      const checkAccountID = await Account.findById(accountID).select(
        "-password"
      );
      if (!checkAccountID) {
        return res
          .status(403)
          .json({ success: false, message: "Không tìm thấy tài khoản" });
      }

      return res
        .status(200)
        .json({ message: true, message: "Chi tiết Account", checkAccountID });
    } catch (error) {
      return res.status(500).json({ success: false, message: "Error" });
    }
  },

  updateAccount: async (req, res) => {
    const accountID = req.params.id;
    const { fullname, email } = req.body;
    try {
      const checkAccountID = await Account.findById(accountID);
      if (!checkAccountID) {
        return res
          .status(403)
          .json({ success: false, message: "Không tìm thấy tài khoản" });
      }
      const newUpdateAccount = await Account.findByIdAndUpdate(
        accountID,
        {
          fullname: fullname,
          email: email,
        },
        { new: true }
      );
      await newUpdateAccount.save();
      return res
        .status(200)
        .json({ success: true, message: "Cập nhật thành công" });
    } catch (error) {
      return res
        .status(500)
        .json({ success: false, message: "Cập nhật thất bại" });
    }
  },

  deleteAccount: async (req, res) => {
    const accountID = req.params.id;
    try {
      const checkAccount = await Account.findById(accountID);
      if (!checkAccount) {
        return res
          .status(403)
          .json({ success: false, message: "Không tìm thấy tài khoản" });
      }
      await Account.findByIdAndDelete(accountID);
      return res
        .status(200)
        .json({ success: false, message: "Xóa thành công tài khoản" });
    } catch (error) {
      console.log("error", error);
      return res.status(500).json({ success: false, message: "error" });
    }
  },
};

module.exports = accountControllers;
