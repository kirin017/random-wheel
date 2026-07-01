# Đồng bộ lead và đơn hàng vào Google Sheet

Mỗi lượt khách bấm **"Nhận quà"** sẽ tự ghi 1 dòng (Họ tên, SĐT, Giải thưởng,
Đồng ý nhận tin, Thời gian) vào Google Sheet của bạn — không cần server, không
lộ API key. Cơ chế: một **Google Apps Script Web App** nhận POST từ trang web và
`appendRow` vào Sheet.

Khi khách checkout giỏ hàng, app cũng gửi đơn hàng vào tab **"Đơn hàng"** bằng
cùng Web App URL.

> Dữ liệu vẫn luôn được lưu cục bộ trong trình duyệt và xuất được CSV trong khu
> vực quản lý, nên kể cả khi mất mạng bạn không mất lead. Sheet là bản đồng bộ
> trực tiếp/online.

## Các bước (làm 1 lần, ~3 phút)

### 1. Tạo Google Sheet
- Vào https://sheets.new, đặt tên ví dụ **"Lead Vòng Quay BYT"**.
- Script tự tạo 2 tab nếu chưa có: `Lead vòng quay` và `Đơn hàng`.

### 2. Mở Apps Script
- Trong Sheet: menu **Tiện ích mở rộng (Extensions) → Apps Script**.
- Xoá code mẫu, dán đoạn dưới đây, rồi **Lưu** (biểu tượng đĩa).

```javascript
function getOrCreateSheet_(name, headers) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
  }
  return sheet;
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var data = JSON.parse(e.postData.contents);
    var time = data.timestamp ? new Date(data.timestamp) : new Date();

    if (data.type === 'order') {
      var orderSheet = getOrCreateSheet_('Đơn hàng', [
        'Thời gian',
        'Họ tên',
        'SĐT',
        'Địa chỉ',
        'Thời gian nhận',
        'Sản phẩm',
        'Tạm tính',
        'Ghi chú',
        'Trạng thái'
      ]);
      orderSheet.appendRow([
        time,
        data.customerName || '',
        "'" + (data.phone || ''),
        data.address || '',
        data.preferredTime || '',
        data.itemSummary || '',
        data.subtotal || 0,
        data.note || '',
        data.status || 'new'
      ]);
    } else {
      var leadSheet = getOrCreateSheet_('Lead vòng quay', [
        'Thời gian',
        'Họ tên',
        'SĐT',
        'Giải thưởng',
        'Đồng ý nhận tin'
      ]);
      leadSheet.appendRow([
        time,
        data.name || '',
        "'" + (data.phone || ''),
        data.prize || '',
        data.consent ? 'Có' : 'Không'
      ]);
    }

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}
```

### 3. Triển khai (Deploy) thành Web App
- Bấm **Deploy (Triển khai) → New deployment (Bản triển khai mới)**.
- Chọn loại: **Web app**.
- **Execute as (Chạy với tư cách):** `Me` (chính bạn).
- **Who has access (Ai có quyền truy cập):** **Anyone (Bất kỳ ai)**.
  > Bắt buộc chọn "Anyone" thì trang web mới gửi được. Endpoint chỉ nhận ghi
  > thêm dòng, không đọc/lộ nội dung Sheet.
- Bấm **Deploy**, đồng ý cấp quyền (Authorize) cho tài khoản Google của bạn.
- Copy **Web app URL**, dạng:
  `https://script.google.com/macros/s/AKfy...../exec`

### 4. Dán vào ứng dụng
- Mở trang vòng quay → khu **Quản lý** (mật khẩu admin) → mục **Đồng bộ Google
  Sheet** → dán URL → **Lưu link** → bấm **Gửi thử**.
- Mở lại Sheet: sẽ thấy 1 dòng "Khách thử nghiệm". Vậy là xong! 🎉

## Lưu ý

- **Đổi code script?** Phải **Deploy → Manage deployments → Edit → New version**
  thì thay đổi mới có hiệu lực (URL giữ nguyên).
- **SĐT mất số 0 đầu?** Đã xử lý bằng dấu `'` trong script (lưu dạng text).
- **Tuỳ chọn cấu hình lúc build:** đặt biến môi trường `VITE_SHEETS_URL` =
  Web app URL để cấu hình sẵn, khỏi dán tay trong admin.
- App gửi lead và đơn hàng bằng `mode: 'no-cors'`, nên trình duyệt không đọc
  được phản hồi thật từ Apps Script. Nếu URL đúng, Apps Script sẽ ghi dòng mới;
  nếu mạng hoặc endpoint lỗi, dữ liệu vẫn còn trong admin local để xuất CSV.
- Endpoint là "ghi-thêm-only" — không trả dữ liệu Sheet về client, nên an toàn
  để công khai cho sự kiện.
