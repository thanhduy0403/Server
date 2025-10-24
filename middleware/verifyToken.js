const jwt = require("jsonwebtoken");
const User = require("../model/User");
const Account = require("../model/Account");
const pathToRegexp = require("path-to-regexp");
const Permission = require("../model/permission");
const { match } = require("path-to-regexp");

//save local storage
// const verifyToken = (req, res, next) => {

//   const authHeader = req.headers.authorization;

//   if (authHeader) {
//     const token = authHeader.split(" ")[1];
//     jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
//       if (err) {
//         return res
//           .status(403)
//           .json({ success: false, message: "Token không hợp lệ" });
//       }
//       req.user = user;
//       next();
//     });
//   } else {
//     return res
//       .status(401)
//       .json({ success: false, message: "Bạn chưa đăng nhập" });
//   }
// };

// save token ở cookie

const verifyToken = (req, res, next) => {
  try {
    const token = req.cookies?.token;
    if (!token) {
      return res
        .status(401)
        .json({ success: false, message: "Bạn chưa đăng nhập" });
    }
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
      if (err) {
        return res
          .status(403)
          .json({ success: false, message: "Token không hợp lệ" });
      } else {
        req.user = decoded;
        next();
      }
    });
  } catch (error) {
    console.error(" Lỗi hệ thống khi xác thực token:", error);
    return res.status(500).json({ success: false, message: "Lỗi hệ thống!" });
  }
};

// check comment
const protect = async (req, res, next) => {
  let token;

  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  } else if (req.headers.authorization?.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) return next(); // Cho phép guest

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const user = await User.findById(decoded.id);
    if (user) req.user = user;
  } catch (error) {
    console.error("Auth error:", error);
  }

  next();
};

// phân quyền riêng cho admin
const verifyTokenAdmin = (req, res, next) => {
  verifyToken(req, res, () => {
    // 1 admin, 2 subadmin
    if (req.user.role === "admin" || req.user.role === "subadmin") {
      return next();
    } else {
      return res.status(403).json({
        success: false,
        message: "Bạn không đủ quyền để thực hiện chức năng này",
      });
    }
  });
};

const verifyTokenOnLyAdmin = (req, res, next) => {
  verifyToken(req, res, () => {
    // 1 admin, 2 subadmin
    if (req.user.role === "admin") {
      return next();
    } else {
      return res.status(403).json({
        success: false,
        message: "Bạn không đủ quyền để thực hiện chức năng này",
      });
    }
  });
};

const verifyTokenAdminAndUser = (req, res, next) => {
  verifyToken(req, res, () => {
    if (req.user.role === "admin" || req.params.id === req.user.id) {
      return next();
    }
    return res.status(403).json({
      success: false,
      message: "Bạn không đủ quyền để thực hiện chức năng này",
    });
  });
};

const isMongoId = (id) => /^[0-9a-fA-F]{24}$/.test(id);

const checkPermission = async (req, res, next) => {
  try {
    const user = req.user;
    if (!user) return res.status(403).json({ message: "Chưa đăng nhập" });

    if (user.role === "admin") return next();

    if (user.role === "subadmin") {
      const subadmin = await Account.findById(user.id).lean();
      if (!subadmin)
        return res.status(403).json({ message: "Subadmin không tồn tại" });

      const allowedEndpointIDs = subadmin.allowedEndpoints.map((id) =>
        id.toString()
      );
      const allPermissions = await Permission.find();

      let allowedEndpoints = [];
      for (const perm of allPermissions) {
        for (const ep of perm.endpoints) {
          if (allowedEndpointIDs.includes(ep._id.toString())) {
            allowedEndpoints.push(ep);
          }
        }
      }

      const isAuthorized = allowedEndpoints.some((ep) => {
        console.log(`Checking path: ${ep.path} against ${req.originalUrl}`);

        const matcher = match(ep.path, {
          decode: decodeURIComponent,
          strict: true,
          sensitive: true,
        });
        const matched = matcher(req.originalUrl);

        if (!matched) return false;

        // Nếu có tham số :id thì kiểm tra hợp lệ MongoId
        if (ep.path.includes(":id") && matched.params.id) {
          if (!isMongoId(matched.params.id)) {
            console.log(
              `Invalid MongoId: ${matched.params.id} for path: ${ep.path}`
            );
            return false;
          }
        }

        return ep.methods.includes(req.method);
      });
      // kiểm tra quyền
      if (isAuthorized) return next();
      return res.status(403).json({
        message: "Không đủ quyền truy cập",
        data: [],
      });
    }

    return res.status(403).json({ message: "Vai trò không hợp lệ" });
  } catch (error) {
    console.error("❌ Lỗi kiểm tra quyền:", error);
    return res.status(500).json({ message: "Lỗi máy chủ khi kiểm tra quyền" });
  }
};

module.exports = {
  protect,
  checkPermission,
  verifyToken,
  verifyTokenAdmin,
  verifyTokenAdminAndUser,
  verifyTokenOnLyAdmin,
};
