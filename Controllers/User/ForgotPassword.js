const User = require("../../model/User");
const sendMail = require("../../utils/sendMail");
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

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
      if (!email) {
        return res.status(400).json({
          success: false,
          message: "Vui lòng nhập email",
        });
      }
      const user = await User.findOne({ email });
      if (!user) {
        return res.json({ success: false, message: "Không tìm thấy email" });
      }
      const otp = user.createPasswordResetOTP();
      await user.save();
      const html = `
        <p>Mã OTP đặt lại mật khẩu của bạn là:</p>
        <h2>${otp}</h2>
        <p>OTP có hiệu lực trong vòng 5 phút.</p>
      `;
      await sendMail({
        email,
        subject: "Mã OTP đặt lại mật khẩu",
        html,
      });
      return res
        .status(200)
        .json({ success: true, message: "OTP đã được gửi đến email" });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ success: false, message: "Error" });
    }
  },
  verifyOTP: async (req, res) => {
    const { otp } = req.body;
    if (!otp) {
      return res
        .status(403)
        .json({ success: false, message: "Không tìm thấy otp" });
    }
    const user = await User.findOne({
      resetOTP: otp.toString().trim(),
      resetOTPExpires: { $gt: Date.now() },
    });
    if (!user) {
      return res.json({
        success: false,
        message: "OTP không đúng hoặc đã hết hạn",
      });
    }
    // sau khi xác thực thành công thì xóa otp và đánh dấu xác thực
    user.resetOTP = undefined;
    user.resetOTPExpires = undefined;
    user.resetVerified = true; // đã xác thực

    const resetToken = jwt.sign({ email: user.email }, process.env.JWT_SECRET, {
      expiresIn: "10m",
    });
    await user.save();
    return res
      .status(200)
      .json({ success: true, message: "Xác thực thành công", resetToken });
  },
  resetPassword: async (req, res) => {
    const { newPassword } = req.body;
    const resetToken = req.headers.authorization?.split(" ")[1]; // FE gửi kèm trong Header: Bearer <token>
    if (!resetToken) {
      return res
        .status(403)
        .json({ success: false, message: "Không có token" });
    }
    try {
      // giải mã token để lấy email
      const decode = jwt.verify(resetToken, process.env.JWT_SECRET);
      const user = await User.findOne({ email: decode.email });
      if (!user) {
        return res
          .status(403)
          .json({ success: false, message: "Không tìm thấy người dùng" });
      }
      if (!user.resetVerified) {
        return res.json({
          success: false,
          message: "Chưa xác thực hoặc đã hết hạn",
        });
      }
      const hashPassword = await bcrypt.hash(newPassword, 10);
      user.password = hashPassword;
      user.resetVerified = false;
      await user.save();
      return res.status(200).json({
        success: true,
        message: "Đổi mật khẩu thành công",
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ success: false, message: "Error" });
    }
  },
};

module.exports = ForgotPasswordControllers;
