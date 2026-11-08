# 🦖 Khủng long 3D (Dino 3D)

Trò chơi **endless-runner 3D** lấy cảm hứng từ Khủng long Chrome, viết bằng **HTML + CSS + JavaScript thuần** với thư viện **Three.js** — không cần cài đặt, không cần build, mở lên là chơi.

> Được làm bởi: **Minh Long**

---

## 🎮 Giới thiệu

Bạn điều khiển chú khủng long chạy vô tận trên đường thảo nguyên, né các chướng ngại vật và ghi điểm càng cao càng tốt. Điểm càng cao:

- Tốc độ chạy **tăng dần** (20 → 52 đơn vị/giây).
- Bầu trời **chuyển day → hoàng hôn → đêm → bình minh** theo chu kỳ 2.000 điểm.
- Đạt **10.000 điểm**, khủng long **cất cánh vào vũ trụ**: mặt đất và đường chạy chìm hẳn xuống, khủng long khoác mũ phi hành gia, giáp ngực, bình dưỡng khí và jetpack có vòi phun, đèn điểm cùng luồng khí xả phát sáng; camera hạ thấp, nghiêng bên như cảnh phim trên màn hình ngang, còn trên màn hình dọc camera tự lùi về sau lưng và nới FOV để thấy vật cản từ xa, có sway/roll nhẹ. Phía sau là tinh vân phát sáng mềm, dải ngân hà, các hành tinh có quầng sáng, bụi sao, thiên thạch trôi chậm và vignette tối góc. **Lối chơi giữ nguyên 100% như trên mặt đất** — vẫn chạm để nhảy né vật cản với đúng lực nhảy/trọng lực cũ, chỉ đổi hoạt ảnh bay, góc quay và hiệu ứng hình ảnh. 🚀

---

## ✨ Tính năng nổi bật

| Nhóm | Chi tiết |
| --- | --- |
| 🌍 Cảnh 3D | Núi tuyết, mây trôi, cỏ hoa, đá, xương rồng; mặt trời & mặt trăng 3D di chuyển theo chu kỳ, sao đêm lấp lánh |
| 🌙 Chu kỳ ngày đêm | 4 pha (ngày / hoàng hôn / đêm / bình minh) với bảng màu riêng cho trời, sương mù, mặt đất, đường chạy và ánh sáng |
| 🚀 Chế độ bay vũ trụ | Chuyển cảnh mượt bằng warp-flash + banner + cú zoom FOV; mặt đất/đường chạy biến mất. Khủng long bay tư thế phi hành gia: thân ngả tới, chân co về sau, tay dang, đầu ngẩng; jetpack có vỏ kim loại, vòi phun, đèn PointLight cyan, lửa phản lực và hạt khí xả. Camera hạ thấp, nghiêng bên, sway/roll/FOV nhẹ; **trên màn hình dọc, camera tự lùi về sau lưng và nới FOV để thấy vật cản từ xa**; hành tinh – tinh vân – sao – thiên thạch trôi **chậm**, vệt tốc độ nền nhẹ, vignette tối góc. Vật lý nhảy/trọng lực giữ nguyên 100% |
| 🌌 Hình ảnh vũ trụ | Tinh vân và quầng hành tinh dùng sprite phát sáng mềm (CanvasTexture), thêm dải ngân hà, bụi sao nhiều màu, vignette tối góc và warp-flash; nền vũ trụ trôi chậm, không lao nhanh |
| 🧱 10 loại vật cản mặt đất | Xương rồng (1–3 cây), xương khủng long, khúc gỗ, tổ trứng, tảng đá xếp chồng, thằn lằn bay (cánh đập động), bụi gai, trụ đá cổ đại |
| 🛸 4 loại vật cản không gian | Thiên thạch rực lửa (đuôi lửa nhấp nháy + quầng cam), cụm tinh thể neon (quầng tím), UFO đĩa bay có chùm tia đập nhịp, vệ tinh hỏng với đèn cảnh báo chớp và quầng xanh |
| 🔊 Âm thanh thủ tục (Web Audio API) | Nhạc nền 8-bit tự sinh (melody + bass + hi-hat + kick), tiếng nhảy, tiếng jetpack khi bay, tiếng ghi điểm mỗi 100 điểm, nhạc game-over, tiếng warp siêu không gian — tất cả sinh bằng oscillator, không cần file âm thanh |
| 📱 Tối ưu mobile | Nhận diện thiết bị để tắt antialias, giảm pixel-ratio, giảm số mesh (mây, sao, vật trang trí, vạch kẻ đường), dùng chung geometry tránh rò rỉ RAM |
| 🎬 Sắc màu & cảm giác | Camera nghiêng khi nhảy, sway/roll/FOV điện ảnh trong vũ trụ, rung khi chạm đất/va chạm, FOV "punch" khi thua và khi warp, mảnh vỡ bay tung tóe, nhún nhảy hoạt ảnh sinh động |
| 🏆 Lưu kỷ lục | Lưu điểm cao nhất vào `localStorage` (khóa `dino3d_hi`) |

---

## 🕹️ Cách chơi

| Thao tác | Nút |
| --- | --- |
| Bắt đầu / Nhảy (hoạt ảnh bay khi ở vũ trụ) | Chạm màn hình, **Space**, **↑**, hoặc **Enter** |
| Tắt / Bật âm thanh | Nút loa 🔊 ở góc dưới phải |
| chơi lại | sau khi thua |

💡 *Phím tắt dành cho người thử nghiệm:* nhấn **T** hoặc **G** để nhảy nhanh sát mốc 10.000 điểm, xem ngay hiệu ứng vào không gian.

**Luật chơi:** giữ khoảng cách cao hơn vật cản để vượt qua (vật cản bay thì phải né theo độ cao tương ứng). Va chạm là thua — bấm lại để chơi tiếp.

---

## ▶️ Chạy dự án

Dự án được tách thành các tệp nhỏ để dễ quản lý: `index.html`, `css/style.css`, `js/audio.js`, `js/game.js` và `README.md`.

1. Mở trực tiếp `index.html` bằng trình duyệt **hoặc** chạy máy chủ tĩnh:

   ```bash
   # Ví dụ với Python
   python -m http.server 8000
   # → truy cập http://localhost:8000
   ```

2. ⚠️ Cần **kết nối Internet** khi lần đầu mở trang, để tải Three.js r128 từ CDN:

   ```
   https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js
   ```

Hotspot: nếu không tải được thư viện 3D, giao diện sẽ hiện thông báo *"Không tải được thư viện 3D"*.

---

## 🗂️ Cấu trúc dự án

```
Dino/
├── index.html        # Khung trang: HUD, canvas, banner, nút âm thanh
├── css/
│   └── style.css     # Toàn bộ giao diện, HUD, hiệu ứng chuyển cảnh
├── js/
│   ├── audio.js      # Hệ thống âm thanh (Web Audio API) + nút loa
│   └── game.js       # Khởi tạo Three.js, cảnh vật, vật cản, vòng lặp game
└── README.md
```

Phân chia trách nhiệm giữa các tệp:

- **`index.html`** — khung HTML: canvas, lớp vignette không gian, HUD điểm/kỷ lục, banner không gian, màn hình chờ và nạp CSS/JS.
- **`css/style.css`** — toàn bộ CSS: bảng màu, HUD, nút âm thanh, vignette `body.space-mode`, hiệu ứng warp-flash và banner.
- **`js/audio.js`** — `initAudio`, `playBgmNote`, `playJumpSound`, `playFlySound`, `playGameOverSound`, `playScoreSound`, `playWarpSound`, `toggleSound` và sự kiện nút loa.
- **`js/game.js`** — khởi tạo Three.js (renderer tối ưu theo thiết bị, camera, ánh sáng, mặt đất/đường chạy), cảnh vật (núi, mây, sao, mặt trời/trăng, `spaceGroup` gồm hành tinh – tinh vân sprite phát sáng – dải ngân hà – bụi sao – thiên thạch trôi – vệt tốc độ), vật cản (`cactus`, `fossil`, `log`, `eggNest`, `rockStack`, `pterodactyl`, `thornBush`, `stonePillar`, `makeSpaceObs` kèm hiệu ứng lửa/chùm tia/đèn), nhân vật (khủng long có khớp gối, bóng đổ, mũ phi hành gia, giáp ngực, bình dưỡng khí, jetpack + hạt khí xả + PointLight) và vòng lặp game với chuyển cảnh chạy → bay, camera điện ảnh và hiệu ứng va chạm.

---

## 🔧 Tham số hay chỉnh sửa

Các tham số game nằm trong `js/game.js` (riêng âm lượng `bgmGain` / `sfxGain` ở `js/audio.js`):

| Tham số | Mặc định | Ý nghĩa |
| --- | --- | --- |
| `SPACE_THRESHOLD` | `10000` | Mốc điểm tiến vào không gian |
| `DAY_CYCLE` | `2000` | Độ dài chu kỳ ngày/đêm (theo điểm) |
| `JUMP` / `GRAV` | `23` / `52` | Lực nhảy và trọng lực — dùng chung cho cả mặt đất và vũ trụ |
| `speed = 20 + min(32, score*.02)` | — | Công thức tăng tốc (max 52) |
| `score = Math.floor(dist*.4)` | — | Quy đổi quãng đường thành điểm |
| `cloudCount`, `starCount`, `decorCount`… | — | Số mesh cho bản mobile / desktop |
| `bgmGain`, `sfxGain` | `0.22` / `0.45` | Âm lượng nhạc nền / hiệu ứng |

---

## 🌐 Tương thích

- Trình duyệt hiện đại có **WebGL** và **Web Audio API** (Chrome, Edge, Firefox, Safari).
- Hỗ trợ cả **desktop** (bàn phím + chuột) và **mobile** (chạm, `touch-action:none`, full-screen, an toàn notch với `env(safe-area-inset-*)`).

---

## 📄 Giấy phép

Phần mềm nhỏ mang tính cá nhân/học tập — tự do chỉnh sửa và chia sẻ. Three.js được tải qua CDN theo giấy phép riêng của dự án.
