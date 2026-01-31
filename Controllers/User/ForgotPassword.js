const User = require("../../model/User");
const sendMail = require("../../utils/sendMail");
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Forgotpassword = require("../../model/forgotpassword");

const ForgotPasswordControllers = {
  // forgotPassword: async (req, res) => {
  //   const { email } = req.query;
  //   try {
  //     const user = await User.findOne({ email });
  //     if (!user) {
  //       return res.status(403).json({
  //         success: false,
  //         message: "Email không tồn tại",
  //       });
  //     }
  //     const resetToken = user.createPasswordChangedToken();
  //     await user.save();
  //     const html = `Xin vui lòng click vào link dưới đây để thay đổi mật khẩu của bạn.Link này sẽ hết hạn sau 15 phút kể từ bây giờ. <a href=${process.env.URL_SERVER}/api/user/reset-password/${resetToken}>Click here</a>`;
  //     const data = {
  //       email,
  //       html,
  //     };
  //     const rs = await sendMail(data);
  //     return res
  //       .status(200)
  //       .json({ success: true, message: "Gửi thành công", rs });
  //   } catch (error) {
  //     console.log(error);
  //     return res.status(500).json({ success: false, message: "Error" });
  //   }
  // },
  // resetPassword: async (req, res) => {
  //   const { password, token } = req.body;
  //   if (!password || !token) {
  //     return res
  //       .status(403)
  //       .json({ success: false, message: "Không có password || token" });
  //   }
  //   const passwordResetToken = crypto
  //     .createHash("sha256")
  //     .update(token)
  //     .digest("hex");
  //   const user = await User.findOne({
  //     passwordResetToken,
  //     passwordResetExpires: { $gt: Date.now() },
  //   });
  //   if (!user) {
  //     return res.status(403).json({
  //       success: false,
  //       message: "Token không hợp lệ hoặc đã hết hạn",
  //     });
  //   }
  //   // ✅ Hash mật khẩu mới
  //   const salt = await bcrypt.genSalt(10);
  //   user.password = await bcrypt.hash(password, salt);
  //   user.passwordResetToken = undefined;
  //   user.passwordChangedAt = Date.now();
  //   user.passwordResetExpires = undefined;
  //   await user.save();
  //   return res.status(200).json({
  //     success: true,
  //     message: "Đổi mật khẩu thành công",
  //   });
  // },

  sendOTP: async (req, res) => {
    const { email } = req.query;
    try {
      if (!email)
        return res
          .status(400)
          .json({ success: false, message: "Vui lòng nhập email" });

      const user = await User.findOne({ email });
      if (!user)
        return res.json({ success: false, message: "Không tìm thấy email" });

      // Xoá các bản ghi OTP cũ
      await Forgotpassword.deleteMany({ user: user._id });

      // Tạo bản ghi OTP mới
      const reset = new Forgotpassword({ user: user._id });
      const otp = reset.createOTP();
      await reset.save();

      const html = `<p>Mã OTP đặt lại mật khẩu của bạn là:</p><h2>${otp}</h2><p>OTP có hiệu lực trong vòng 5 phút.</p>`;
      await sendMail({ email, subject: "Mã OTP đặt lại mật khẩu", html });

      return res
        .status(200)
        .json({ success: true, message: "OTP đã được gửi đến email" });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ success: false, message: "Error" });
    }
  },

  // 🔹 Xác thực OTP
  verifyOTP: async (req, res) => {
    const { otp } = req.body;
    if (!otp)
      return res.status(403).json({ success: false, message: "Thiếu OTP" });

    try {
      const reset = await Forgotpassword.findOne({
        resetOTP: otp.toString().trim(),
        resetOTPExpires: { $gt: Date.now() },
      }).populate("user"); // nếu cần thông tin user

      if (!reset)
        return res.json({
          success: false,
          message: "OTP không đúng hoặc đã hết hạn",
        });

      // Xác thực thành công
      reset.resetOTP = undefined;
      reset.resetOTPExpires = undefined;
      reset.resetVerified = true;

      const resetToken = reset.createResetToken();
      await reset.save();

      return res
        .status(200)
        .json({ success: true, message: "Xác thực thành công", resetToken });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ success: false, message: "Error" });
    }
  },

  // 🔹 Đặt lại mật khẩu
  resetPassword: async (req, res) => {
    const { newPassword } = req.body;
    const resetToken = req.headers.authorization?.split(" ")[1]; // Bearer <token>

    if (!resetToken || !newPassword)
      return res
        .status(403)
        .json({ success: false, message: "Thiếu thông tin hoặc token" });

    try {
      // Tìm bản ghi ForgotPassword dựa trên token
      const reset = await Forgotpassword.findOne({
        passwordResetToken: crypto
          .createHash("sha256")
          .update(resetToken)
          .digest("hex"),
        passwordResetExpires: { $gt: Date.now() },
      }).populate("user");

      if (!reset || !reset.resetVerified)
        return res.status(403).json({
          success: false,
          message: "Token chưa xác thực hoặc đã hết hạn",
        });

      // Hash mật khẩu mới và cập nhật cho user
      const hashPassword = await bcrypt.hash(newPassword, 10);
      reset.user.password = hashPassword;
      await reset.user.save();

      // Xoá bản ghi ForgotPassword sau khi reset xong
      await Forgotpassword.deleteOne({ _id: reset._id });

      return res
        .status(200)
        .json({ success: true, message: "Đặt lại mật khẩu thành công" });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ success: false, message: "Error" });
    }
  },
};

module.exports = ForgotPasswordControllers;
