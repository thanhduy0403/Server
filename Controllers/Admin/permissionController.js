const Permission = require("../../model/permission");
const Account = require("../../model/Account");
const permissionControllers = {
  // create permission
  create: async (req, res) => {
    try {
      const { name, endpoints } = req.body;
      if (!name || !endpoints) {
        return res
          .status(400)
          .json({ success: false, message: "name or endpoints are required" });
      }
      // Tạo bản ghi Permission (ID cha)
      // ==> Tạo 1 id cha (permission) chứa các endpoint con sau đó lưu lại
      const newPermission = new Permission({ name, endpoints });
      await newPermission.save();

      // sau đó tìm đến user đã login vào (chỉ có admin mới có quyền)
      // gán id cha (permission) cho user đã login (admin)
      const user = await Account.findById(req.user.id);
      if (user) {
        // sau đó lưu lại admin sẽ nhận được các id cha chứa các endpoint con trong permission
        user.permissions.push(newPermission._id);
        await user.save();
      }
      return res
        .status(200)
        .json({ success: true, message: "create permission thành công" });
    } catch (error) {
      console.log("error", error);
      return res.status(500).json({ success: false, message: "server error" });
    }
  },

  // create new permission
  createNewPermission: async (req, res) => {
    const { name, description } = req.body;
    try {
    } catch (error) {}
  },

  getPermission: async (req, res) => {
    try {
      const getListPermission = await Permission.find();
      return res.status(200).json({
        success: true,
        message: "Permission List",
        getListPermission,
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: "server error" });
    }
  },

  // cấp quyền cho sub admin
  // assignPermission: async (req, res) => {
  //   const userID = req.params.id;
  //   //const endpointIDs = req.body.endpointIDs lấy ra những endpoint con  trong permission gắn cho sub admin
  //   //mỗi endpoint con sẽ có 1 id riêng lấy id đó gắn cho subAdmin
  //   const endpointIDs = req.body.endpointIDs; // Mảng chứa _id của endpoint con (child)

  //   try {
  //     const user = await Account.findById(userID);
  //     if (!user || user.role !== "subadmin") {
  //       return res
  //         .status(404)
  //         .json({ success: false, message: "Không tìm thấy subadmin" });
  //     }
  //     // kiểm tra endpointIDs có phải là 1 mảng hoặc là mảng rỗng
  //     // nếu không phải mảng hoặc rỗng báo lỗi
  //     if (!Array.isArray(endpointIDs) || endpointIDs.length === 0) {
  //       return res
  //         .status(400)
  //         .json({ success: false, message: "Danh sách endpoint không hợp lệ" });
  //     }

  //     // Tìm các permission chứa các endpoint cần phân quyền
  //     // tim các endpoint con trong endpointIDs
  //     // endpoints._id lấy từ model permission $in: endpointIDs lấy tù client req.body.endpointIDs
  //     const matchedPermissions = await Permission.find({
  //       //endpoints._id sẽ lấy danh sách các endpoint trong permission
  //       //  $in: endpointIDs lấy ra id endpoint con trong danh sách đó
  //       "endpoints._id": { $in: endpointIDs },
  //     });

  //     // trả về lỗi nếu không tìm thấy
  //     // so sánh endpointIDs được gửi từ client với id endpoint._id con trong danh sách
  //     if (!matchedPermissions || matchedPermissions.length === 0) {
  //       return res.status(404).json({
  //         success: false,
  //         message: "Không tìm thấy endpoint phù hợp",
  //       });
  //     }

  //     // Lấy ra danh sách ID của Permission (ID cha)
  //     //chuyển đổi thành dạng string để so sánh
  //     //matchedPermissionIds  danh sách các id permission chuyển thành dạng chuỗi
  //     const matchedPermissionIds = matchedPermissions.map((p) =>
  //       p._id.toString()
  //     );

  //     // Thêm permission (nhóm quyền) nếu chưa có
  //     // nếu như thêm 1 endpoint con đã có trước id permission cha thì chỉ cần thêm endpoint con
  //     // nếu trường hợp thêm 1 endpoint con chưa có id permission cha thì sẽ thêm permission cha và endpoint con
  //     // dùng set để loại bỏ id permission cha  bị trùng
  //     //Giữ lại các permission cha đã có từ trước (user.permissions).
  //     // Thêm vào các permission cha mới (matchedPermissionIds) mà chưa có.

  //     // ...user.permissions đã có trước đó
  //     // ...matchedPermissionIds được tạo ra khi thêm 1 endpoint
  //     // ... trải các phần từ của mảng set để loại bỏ các phần từ trùng (permission cha trùng)
  //     user.permissions = Array.from(
  //       new Set([
  //         ...user.permissions.map((id) => id.toString()),
  //         ...matchedPermissionIds,
  //       ])
  //     );

  //     // Thêm endpoint cụ thể vào allowedEndpoints
  //     // Nếu user.allowedEndpoints chưa tồn tại thì khởi tạo 1 mảng rỗng
  //     //allowedEndpoints ở trong model user
  //     if (!user.allowedEndpoints) user.allowedEndpoints = [];
  //     //lấy ra các endpoint con của user được cấp phép chuyển thành chuỗi
  //     const currentAllowed = user.allowedEndpoints.map((id) => id.toString());
  //     // lọc ra những id endpoint con đã tồn tại trong subadmin
  //     // tạo biến currentAllowed chuyển thành chuổi để so sánh id endpoint con
  //     /* tức là khi thêm 1 id endpint con mới nếu endpoint đó
  //      chưa tồn tại thì thêm vào cho subadmin, còn đã tồn tại id endpoint con thì loại bỏ   */
  //     const newAllowed = endpointIDs.filter(
  //       (id) => !currentAllowed.includes(id)
  //     );

  //     // lưu lại và thêm vào cho subadmin
  //     user.allowedEndpoints.push(...newAllowed);

  //     await user.save();

  //     return res.status(200).json({
  //       success: true,
  //       message: "Phân quyền thành công",
  //       data: user,
  //     });
  //   } catch (error) {
  //     console.error(error);
  //     return res.status(500).json({ success: false, message: "Lỗi server" });
  //   }
  // },

  assignPermission: async (req, res) => {
    const userID = req.params.id;
    const endpointIDs = req.body.endpointIDs; // Mảng chứa _id của endpoint con

    try {
      const user = await Account.findById(userID);
      if (!user || user.role !== "subadmin") {
        return res
          .status(404)
          .json({ success: false, message: "Không tìm thấy subadmin" });
      }

      // Nếu không gửi gì thì cho là xóa hết quyền
      const validEndpointIDs = Array.isArray(endpointIDs) ? endpointIDs : [];

      // Tìm tất cả permission cha chứa các endpoint con đang được cấp
      const matchedPermissions = await Permission.find({
        "endpoints._id": { $in: validEndpointIDs },
      });

      // Lấy ra danh sách ID của permission cha tương ứng
      const matchedPermissionIds = matchedPermissions.map((p) =>
        p._id.toString()
      );

      // Gán lại toàn bộ quyền mới (có thể là [])
      user.allowedEndpoints = validEndpointIDs;
      user.permissions = matchedPermissionIds;

      await user.save();

      return res.status(200).json({
        success: true,
        message: "Phân quyền thành công",
        data: user,
      });
    } catch (error) {
      console.error("Lỗi assignPermission:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi server khi phân quyền",
      });
    }
  },

  revokeEndpointPermission: async (req, res) => {
    const { endpointID } = req.body;
    const userID = req.params.id;
    try {
      const user = await Account.findById(userID);

      if (!user) {
        return res
          .status(403)
          .json({ success: false, message: "Không tìm thấy người dùng" });
      }

      console.log("endpointID nhận từ client:", endpointID);
      console.log(
        "allowedEndpoints hiện có:",
        user.allowedEndpoints.map((ep) => ep.toString())
      );

      // tìm endpoint trong allowedEndpoints
      const endpointToRemove = user.allowedEndpoints.find(
        (ep) => ep.toString() === endpointID
      );

      if (!endpointToRemove) {
        return res
          .status(403)
          .json({ success: false, message: "Không tìm thấy endpoint" });
      }

      user.allowedEndpoints = user.allowedEndpoints.filter(
        (ep) => ep.toString() !== endpointID
      );

      await user.save();
      // tìm permisson cha chứa endpoint cần xóa
      const permission = await Permission.findOne({
        "endpoints._id": endpointID,
      });
      if (!permission) {
        return res.status(404).json({
          success: false,
          message: "Permisson chứa endpoint không tồn tại",
        });
      }
      const permissionEndpointIDs = permission.endpoints.map((ep) =>
        ep._id.toString()
      );

      const updatedUser = await Account.findById(userID);

      const stillHasEndpointInPermission = updatedUser.allowedEndpoints.some(
        (epID) => permissionEndpointIDs.includes(epID.toString())
      );
      if (!stillHasEndpointInPermission) {
        await Account.updateOne(
          { _id: userID },
          { $pull: { permissions: permission._id } }
        );
      }
      await user.save();
      return res
        .status(200)
        .json({ success: true, massage: "Hủy phân quyền thành công" });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ success: false, massage: "Error" });
    }
  },
};

module.exports = permissionControllers;
