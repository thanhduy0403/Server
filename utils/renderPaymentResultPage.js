function renderPaymentResultPage({ success, orderId, errorCode }) {
  if (success) {
    return `
      <!DOCTYPE html>
      <html lang="vi">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Thanh toán thành công</title>
        <style>
          body {
            font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #4caf50, #2e7d32);
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
          }
          .card {
            background: #fff;
            padding: 30px;
            border-radius: 15px;
            text-align: center;
            max-width: 400px;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
            animation: fadeIn 0.8s ease;
          }
          .icon {
            font-size: 80px;
            color: #4caf50;
            margin-bottom: 15px;
          }
          h1 {
            margin: 0;
            color: #333;
            font-size: 22px;
          }
          p {
            color: #555;
            margin-top: 8px;
          }
          .order-id {
            font-weight: bold;
            color: #2e7d32;
          }
          .btn {
            display: inline-block;
            margin-top: 20px;
            padding: 10px 20px;
            background: #4caf50;
            color: #fff;
            text-decoration: none;
            border-radius: 8px;
            transition: background 0.3s;
          }
          .btn:hover {
            background: #388e3c;
          }
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-20px); }
            to { opacity: 1; transform: translateY(0); }
          }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="icon">✅</div>
          <h1>Thanh toán thành công!</h1> 
          <p>Cảm ơn bạn đã mua hàng 🛍️</p>
          <p>Mã đơn hàng: <span class="order-id">#${orderId}</span></p>
          <a href="http://localhost:3000" class="btn">Quay về trang chủ</a>
        </div>
      </body>
      </html>
    `;
  } else {
    return `
      <!DOCTYPE html>
      <html lang="vi">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Thanh toán thất bại</title>
        <style>
          body {
            font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #f44336, #b71c1c);
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
          }
          .card {
            background: #fff;
            padding: 30px;
            border-radius: 15px;
            text-align: center;
            max-width: 400px;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
            animation: fadeIn 0.8s ease;
          }
          .icon {
            font-size: 80px;
            color: #f44336;
            margin-bottom: 15px;
          }
          h1 {
            margin: 0;
            color: #333;
            font-size: 22px;
          }
          p {
            color: #555;
            margin-top: 8px;
          }
          .error-code {
            font-weight: bold;
            color: #d32f2f;
          }
          .btn {
            display: inline-block;
            margin-top: 20px;
            padding: 10px 20px;
            background: #f44336;
            color: #fff;
            text-decoration: none;
            border-radius: 8px;
            transition: background 0.3s;
          }
          .btn:hover {
            background: #d32f2f;
          }
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-20px); }
            to { opacity: 1; transform: translateY(0); }
          }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="icon">❌</div>
          <h1>Thanh toán thất bại</h1>
          <p>Mã lỗi: <span class="error-code">${errorCode}</span></p>
          <a href="http://localhost:3000/cart" class="btn">Thử lại</a>
        </div>
      </body>
      </html>
    `;
  }
}

module.exports = renderPaymentResultPage;
