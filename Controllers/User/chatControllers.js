const Product = require("../../model/product");
const Category = require("../../model/category");
require("dotenv").config();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const chatController = {
  chatWithBot: async (req, res) => {
    //   const { message } = req.body;
    //   try {
    //     const lowerMsg = message.toLowerCase();
    //     // lấy tất cả category & products để tìm keyword
    //     const allCategories = await Category.find().lean();
    //     const allProducts = await Product.find()
    //       .populate("categoryID") // lấy cả category để hiển thị
    //       .lean({ virtuals: true });
    //     // tách các từ trong message
    //     const words = lowerMsg.split(/\s+/);
    //     // tìm từ nào match category hoặc product name
    //     let matchedKeyword = null;
    //     let matchedCategory = null;
    //     let matchedProduct = null;
    //     for (let w of words) {
    //       // tìm category khớp từng từ
    //       const cat = allCategories.find((c) => c.name.toLowerCase().includes(w));
    //       if (cat) {
    //         matchedKeyword = cat.name.toLowerCase();
    //         matchedCategory = cat;
    //         break;
    //       }
    //       // tìm product khớp từng từ
    //       const prod = allProducts.find((p) => p.name.toLowerCase().includes(w));
    //       if (prod) {
    //         matchedKeyword = w;
    //         matchedProduct = prod;
    //         break;
    //       }
    //     }
    //     // nếu không tìm được từ khóa thì fallback lấy từ cuối
    //     if (!matchedKeyword) {
    //       matchedKeyword = words[words.length - 1];
    //     }
    //     // tìm sản phẩm theo keyword
    //     let products = [];
    //     if (matchedCategory) {
    //       products = await Product.find({
    //         categoryID: matchedCategory._id,
    //         isDelete: false,
    //       })
    //         .populate("categoryID")
    //         .limit(3)
    //         .lean({ virtuals: true });
    //     } else {
    //       products = await Product.find({
    //         name: { $regex: matchedKeyword, $options: "i" },
    //         isDelete: false,
    //       })
    //         .populate("categoryID")
    //         .limit(3)
    //         .lean({ virtuals: true });
    //     }
    //     // gọi SimSimi để trả lời thêm
    //     let aiText = "";
    //     try {
    //       const simRes = await axios.get(
    //         `https://api.simsimi.net/v2/?text=${encodeURIComponent(
    //           message
    //         )}&lc=vn`
    //       );
    //       aiText = simRes.data.success || "";
    //     } catch (err) {
    //       console.error("SimSimi lỗi:", err?.message);
    //     }
    //     // nếu không có sản phẩm
    //     if (products.length === 0) {
    //       if (aiText) {
    //         aiText += `\n\nHiện mình chưa tìm thấy sản phẩm phù hợp với từ khóa "${matchedKeyword}".`;
    //       } else {
    //         aiText = `Xin lỗi, mình chưa tìm thấy sản phẩm phù hợp với từ khóa "${matchedKeyword}". Bạn có thể thử từ khóa khác nhé.`;
    //       }
    //     }
    //     // nếu có sản phẩm
    //     if (products.length > 0) {
    //       // Nếu người dùng hỏi giá / giảm giá → trả chi tiết hơn
    //       if (
    //         lowerMsg.includes("giá") ||
    //         lowerMsg.includes("bao nhiêu") ||
    //         lowerMsg.includes("giảm")
    //       ) {
    //         aiText = `Mình tìm thấy ${products.length} sản phẩm. Đây là thông tin chi tiết:`;
    //         products.forEach((p, i) => {
    //           const base = `${i + 1}. ${
    //             p.name
    //           } - Giá gốc: ${p.price.toLocaleString()}đ`;
    //           const discount =
    //             p.discount && p.discount > 0
    //               ? ` | Giá sau giảm: ${p.discountedPrice.toLocaleString()}đ (-${
    //                   p.discount
    //                 }%)`
    //               : "";
    //           const category = p.categoryID
    //             ? ` | Danh mục: ${p.categoryID.name}`
    //             : "";
    //           aiText += `\n${base}${discount}${category}`;
    //         });
    //       } else {
    //         // Nếu không hỏi giá → liệt kê tên sản phẩm
    //         const listNames = products.map((p) => p.name).join(", ");
    //         if (aiText) {
    //           aiText += `\n\nMột số sản phẩm phù hợp: ${listNames}`;
    //         } else {
    //           aiText = `Mình gợi ý bạn các sản phẩm: ${listNames}`;
    //         }
    //       }
    //     }
    //     if (!aiText) {
    //       aiText = "Xin lỗi, tôi chưa có câu trả lời.";
    //     }
    //     return res.json({
    //       reply: aiText,
    //       products,
    //     });
    //   } catch (err) {
    //     console.error(err);
    //     return res.status(500).json({
    //       reply: "Có lỗi xảy ra, vui lòng thử lại sau.",
    //       products: [],
    //     });
    //   }
  },

  // 🧠 Chat bằng AI + tìm sản phẩm
  handleMessage: async (req, res) => {
    const { message } = req.body;
    try {
      const lowerMsg = message.toLowerCase().trim();

      const keywordGroups = {
        greeting: [
          "hi",
          "hello",
          "xin chào",
          "chào",
          "alo",
          "ê",
          "hey",
          "chào bạn",
        ],

        discount: [
          "giảm giá",
          "sale",
          "giảm mạnh",
          "ưu đãi",
          "khuyến mãi",
          "giảm giá cao nhất",
          "sản phẩm giảm",
        ],

        bestseller: [
          "bán chạy",
          "best seller",
          "hot",
          "thịnh hành",
          "xu hướng",
          "hot trend",
          "sản phẩm bán chạy",
          "phổ biến",
          "nhiều người mua",
          "đang hot",
          "top trending",
        ],
        newProduct: [
          "sản phẩm mới",
          "hàng mới về",
          "gần đây",
          "xu hướng mới",
          "mới ra mắt",
        ],
      };

      const matchKeyword = (keywords) => {
        return keywords.some(
          (keyword) => lowerMsg === keyword || lowerMsg.includes(keyword)
        );
      };
      const isGreeting = matchKeyword(keywordGroups.greeting);
      const isAskDiscount = matchKeyword(keywordGroups.discount);
      const isAskBestSeller = matchKeyword(keywordGroups.bestseller);
      const isAskNewProduct = matchKeyword(keywordGroups.newProduct);

      // --- KIỂM TRA CHÀO HỎI ---
      if (isGreeting) {
        const replyMessage =
          "Chào bạn 👋! Tôi là trợ lý AI. Bạn đang tìm kiếm sản phẩm nào? Hãy mô tả để tôi tư vấn nhé!";
        return res.json({
          reply: replyMessage,
          products: [],
        });
      }

      // --- lấy dữ liệu cơ sở dữ liệu---
      const allCategories = await Category.find().lean();
      const allProducts = await Product.find()
        .populate("categoryID")
        .lean({ virtuals: true });

      // sản phẩm có giảm giá cao nhất
      const bestDiscountProduct = allProducts
        .filter((p) => !p.isDelete)
        .sort((a, b) => b.discount - a.discount)
        .slice(0, 4);

      if (isAskDiscount) {
        return res.json({
          reply: `Dưới đây là top 4 sản phẩm ${message}`,
          products: bestDiscountProduct,
          topDiscount: bestDiscountProduct,
        });
      }
      // sản phẩm hot
      const bestsellerProduct = allProducts
        .filter((p) => !p.isDelete)
        .sort((a, b) => b.soldCount - a.soldCount)
        .slice(0, 4);
      if (isAskBestSeller) {
        return res.json({
          reply: `Top 4 sản phẩm ${message}`,
          products: bestsellerProduct,
          topBestSeller: bestsellerProduct,
        });
      }

      // sản phẩm gần đây
      const newProducts = allProducts
        .filter((p) => !p.isDelete)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 4);
      if (isAskNewProduct) {
        return res.json({
          reply: `Top 4 sản phẩm ${message}`,
          products: newProducts,
          topNewProducts: newProducts,
        });
      }
      let filteredProducts = [];
      let matchedCategory = null;
      let matchedKeyword = null;

      // 1. TÌM KIẾM SẢN PHẨM (ƯU TIÊN CỤM TỪ)

      // 1.1 Ưu tiên tìm kiếm theo TÊN CATEGORY khớp với toàn bộ tin nhắn người dùng
      matchedCategory = allCategories.find(
        (c) =>
          lowerMsg.includes(c.name.toLowerCase()) ||
          c.name.toLowerCase().includes(lowerMsg)
      );

      if (matchedCategory) {
        matchedKeyword = matchedCategory.name.toLowerCase();
        // Lọc theo Category nếu tìm thấy
        filteredProducts = allProducts.filter(
          (p) =>
            String(p.categoryID?._id) === String(matchedCategory._id) &&
            !p.isDelete
        );
      } else {
        // 1.2 Nếu không khớp Category theo cụm từ, tìm kiếm theo từ khóa đơn
        const words = lowerMsg.split(/\s+/).filter((w) => w.length >= 1);

        // Lặp qua từ đơn để tìm Category hoặc Product khớp
        for (let w of words) {
          // Tìm Category khớp (ví dụ: 'nữ' khớp với 'Thời trang nữ')
          const cat = allCategories.find((c) =>
            c.name.toLowerCase().includes(w)
          );
          if (cat) {
            matchedKeyword = cat.name.toLowerCase();
            matchedCategory = cat;
            break;
          }
          // Tìm Product khớp
          const prod = allProducts.find((p) =>
            p.name.toLowerCase().includes(w)
          );
          if (prod) {
            matchedKeyword = w;
            break;
          }
        }

        // Fallback lấy từ cuối nếu không tìm thấy
        if (!matchedKeyword && words.length > 0) {
          matchedKeyword = words[words.length - 1];
        } else if (!matchedKeyword) {
          matchedKeyword = message;
        }

        // 1.3 Lọc sản phẩm dựa trên kết quả tìm kiếm từ khóa đơn
        if (matchedCategory) {
          filteredProducts = allProducts.filter(
            (p) =>
              String(p.categoryID?._id) === String(matchedCategory._id) &&
              !p.isDelete
          );
        } else {
          // Lọc theo tên sản phẩm bằng Regex
          const regex = new RegExp(matchedKeyword, "i");
          filteredProducts = allProducts.filter(
            (p) => regex.test(p.name) && !p.isDelete
          );
        }
      }

      // Chỉ trả về tối đa 3 sản phẩm để hiển thị (cho frontend)
      const productsForDisplay = filteredProducts.slice(0, 3);

      // --- 2. CHUẨN BỊ VÀ GỌI GEMINI ---

      // Dùng danh sách sản phẩm đã lọc để làm Context cho AI
      const productListForAI = filteredProducts
        .map(
          (p) =>
            // Gửi thông tin đầy đủ, bao gồm URL hình ảnh và giá
            `Tên: ${p.name}, Hình ảnh: ${p.image}, Giá: ${p.price}₫, Giảm: ${p.discount}%, Mô tả: ${p.description}, Danh mục: ${p.categoryID?.name}`
        )
        .join("\n");

      // Nếu không tìm thấy sản phẩm nào liên quan, gửi prompt tổng quát hơn
      const contextPrompt = productListForAI
        ? `Đây là danh sách sản phẩm liên quan đến truy vấn của người dùng:\n${productListForAI}`
        : `Hiện tại tôi không tìm thấy sản phẩm nào khớp chính xác với từ khóa của người dùng. Dưới đây là TẤT CẢ sản phẩm tôi đang có:\n${allProducts
            .map((p) => `Tên: ${p.name}, Danh mục: ${p.categoryID?.name}`)
            .join(", ")}`;

      const prompt = `
        Bạn là trợ lý bán hàng thân thiện. ${contextPrompt}
        Người dùng hỏi: "${message}"
        Hãy tư vấn chi tiết, thân thiện, và giới thiệu các sản phẩm TỪ danh sách có liên quan.
        Nếu danh sách rỗng, hãy xin lỗi và gợi ý các sản phẩm có sẵn (Thời trang nam, v.v.).
      `;

      // GỬI PROMPT VÀ LẤY PHẢN HỒI AI
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const result = await model.generateContent(prompt);
      const aiReply = result.response.text();

      // 4. TRẢ VỀ CẢ VĂN BẢN AI VÀ SẢN PHẨM ĐÃ TÌM ĐƯỢC
      res.json({
        reply: aiReply,
        products: productsForDisplay,
        topDiscount: bestDiscountProduct,
        topBestSeller: bestsellerProduct,
        topNewProducts: newProducts,
      });
    } catch (err) {
      console.error("Lỗi Chatbot:", err);
      res.status(500).json({ error: "Lỗi chatbot" });
    }
  },
};
module.exports = chatController;
