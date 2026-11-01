# 🦖 Khủng long 3D (Dino 3D)

Trò chơi **endless-runner 3D** lấy cảm hứng từ Khủng long Chrome, viết hoàn toàn bằng **một file HTML duy nhất** với thư viện **Three.js** — không cần cài đặt, không cần build, mở lên là chơi.

> Được làm bởi: **Minh Long**

---

## 🎮 Giới thiệu

Bạn điều khiển chú khủng long chạy vô tận trên đường thảo nguyên, né các chướng ngại vật và ghi điểm càng cao càng tốt. Điểm càng cao:

- Tốc độ chạy **tăng dần** (20 → 52 đơn vị/giây).
- Bầu trời **chuyển day → hoàng hôn → đêm → bình minh** theo chu kỳ 2.000 điểm.
- Đạt **10.000 điểm**, khủng long **tiến vào không gian thiên hà**: mặt đất chìm xuống, đường chạy biến thành đường cao tốc neon, xuất hiện hành tinh – tinh vân – Trái Đất, khủng long đội mũ phi hành gia, và vật cản chuyển thành thiên thạch, tinh thể, UFO… 🚀

---

## ✨ Tính năng nổi bật

| Nhóm | Chi tiết |
| --- | --- |
| 🌍 Cảnh 3D | Núi tuyết, mây trôi, cỏ hoa, đá, xương rồng; mặt trời & mặt trăng 3D di chuyển theo chu kỳ, sao đêm lấp lánh |
| 🌙 Chu kỳ ngày đêm | 4 pha (ngày / hoàng hôn / đêm / bình minh) với bảng màu riêng cho trời, sương mù, mặt đất, đường chạy và ánh sáng |
| 🚀 Chế độ không gian | Hiệu ứng warp-flash, banner "Tiến vào không gian thiên hà!", mũ phi hành gia + bình dưỡng khí, viền/vạch đường đổi thành neon cyan–magenta, sương mù giãn ra để quan sát xa |
| 🧱 10 loại vật cản mặt đất | Xương rồng (1–3 cây), xương khủng long, khúc gỗ, tổ trứng, tảng đá xếp chồng, thằn lằn bay (cánh đập động), bụi gai, trụ đá cổ đại |
| 🛸 4 loại vật cản không gian | Thiên thạch rực lửa, cụm tinh thể neon, UFO đĩa bay có chùm tia, vệ tinh hỏng với tấm pin mặt trời |
| 🔊 Âm thanh thủ tục (Web Audio API) | Nhạc nền 8-bit tự sinh (melody + bass + hi-hat + kick), tiếng nhảy, tiếng ghi điểm mỗi 100 điểm, nhạc game-over, tiếng warp siêu không gian — tất cả sinh bằng oscillator, không cần file âm thanh |
| 🎱 Nhảy kép & cúi | Nhảy lần 2 trên không (khói trắng + tiếng riêng), giữ ↓/**S** để cúi né vật cản bay hoặc **rơi nhanh** để ép nhịp, nhả phím giữa chừng khi nhảy kép để hạ đỉnh nhảy |
| 🥚 Trứng vàng | Cụm trứng treo thành vòng cung — nhảy đúng nhịp ăn +50 điểm, kèm tiếng "ting" và popup |
| 🧪 4 Power-up | 🛡 **Khiên** (chặn 1 cú va chạm + 1,5s bất tử), 🧲 **Nam châm** 10s hút trứng, ⏱ **Chậm lại** 3,2s, 🚀 **Tăng tốc** 5s — phá tan vật cản +15 điểm, kèm đuôi lửa |
| 🔥 COMBO né sát | Mỗi lần chủ động né (nhảy/cúi) liên tục +1 combo trong 5s → điểm thưởng +25×combo (tối đa ×9) |
| 🏆 Boss tàu mẹ | Mỗi **20.000 điểm**: UFO hạ cánh xuống, phóng bom plasma (nổ thành vòng sóng xung kích) & tia laser quét — sống sót 8 đòn để **+500 điểm** |
| 🌧 Thời tiết tuyết | Đêm rơi tuyết dày, hoàng hôn muộn vừa — mặt đất/núi/đường phủ trắng dần |
| 🎵 Nhạc đổi theo bối cảnh | Mặt đất: chiptune squares; vào không gian: đổi sang **synthwave sawtooth** chậm nhịp hơn, tự chuyển mượt |
| ⚡ Sự kiện 2.500 điểm | Banner "TỐC ĐỘ TĂNG!" + tiếng zap + FOV punch cho từng mốc |
| 📱 Tối ưu mobile | Nhận diện thiết bị để tắt antialias, giảm pixel-ratio, giảm số mesh (mây, sao, vật trang trí, vạch kẻ đường), dùng chung geometry tránh rò rỉ RAM |
| 🎬 Sắc màu & cảm giác | Camera nghiêng khi nhảy, rung khi chạm đất/va chạm, FOV "punch" khi thua, mảnh vỡ bay tung tóe, nhún nhảy hoạt ảnh sinh động |
| 🏆 Lưu kỷ lục | Lưu điểm cao nhất vào `localStorage` (khóa `dino3d_hi`) |

---

## 🕹️ Cách chơi

| Thao tác | Nút |
| --- | --- |
| Bắt đầu / Nhảy | Chạm màn hình, **Space**, **↑**, hoặc **Enter** |
| **Nhảy kép** | Nhảy lần 2 khi đang trên không (tối đa 1 lần/chuyến bay) |
| **Cúi** (tư thế thấp) | Giữ **↓** hoặc **S** trên bàn phím; trên mobile: **vuốt tay xuống** |
| **Rơi nhanh** | Giữ ↓ khi đang trên không |
| Nhả giữa chừng nhảy kép | Hạ nhẹ độ cao đỉnh nhảy kép (tap nhanh = nhảy kép thấp hơn) |
| Tắt / Bật âm thanh | Nút loa 🔊 ở góc dưới phải |
| Chơi lại | Chạm/Space sau màn Game over |

💡 *Phím tắt người thử nghiệm:* **T**/**G** — nhảy nhanh tới mốc không gian 10.000 điểm; **B** — triệu hồi ngay trận boss tàu mẹ.

**Luật chơi:** giữ khoảng cách cao hơn vật cản để vượt qua (vật cản bay thì phải né theo độ cao tương ứng). Va chạm là thua — bấm lại để chơi tiếp.

---

## ▶️ Chạy dự án

Chỉ có **2 tệp**: `index.html` và `README.md`.

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
├── index.html    # Toàn bộ game: CSS + HUD + Three.js + logic
└── README.md
```

Bên trong `index.html` (từ trên xuống dưới):

- **CSS & HUD** — thẻ điểm/kỷ lục, nút âm thanh, banner không gian, màn hình chờ.
- **Hệ thống âm thanh** — `initAudio`, `playBgmNote`, `playJumpSound`, `playGameOverSound`, `playScoreSound`, `playWarpSound`, `toggleSound`.
- **Khởi tạo Three.js** — renderer (tối ưu theo thiết bị), camera, ánh sáng, mặt đất/đường chạy.
- **Cảnh vật** — núi, mây, sao, mặt trời/trăng, nhóm thiên thể `spaceGroup` (hành tinh có vành, Trái Đất, tinh vân).
- **Vật cản** — hàm dựng `cactus`, `fossil`, `log`, `eggNest`, `rockStack`, `pterodactyl`, `thornBush`, `stonePillar`, `makeSpaceObs`.
- **Nhân vật** — khủng long hộp 3D, bóng đổ, mũ phi hành gia, bình dưỡng khí.
- **Nhật ký nâng cấp V2** — nhảy kép/cúi (`jumpsLeft`, `duckLerp`), trứng vàng (`eggs`), power-up (`powerups`), COMBO graze, boss tàu mẹ (`updateBoss` + `bossGroup`), tuyết rơi (`snowPts`), đổi nhạc chủ đề (`setBgmTheme`).
- **Vòng lặp game** — điểm, tốc độ, nhảy, va chạm, chu kỳ ngày/đêm, chuyển không gian, camera, hoạt ảnh.

---

## 🔧 Tham số hay chỉnh sửa

Tất cả đều ở đầu đoạn `<script>` chính trong `index.html`:

| Tham số | Mặc định | Ý nghĩa |
| --- | --- | --- |
| `SPACE_THRESHOLD` | `10000` | Mốc điểm tiến vào không gian |
| `bossNext` | `20000` | Khoảng cách giữa 2 lần xuất hiện boss (bắt đầu từ 20.000) |
| `DAY_CYCLE` | `2000` | Độ dài chu kỳ ngày/đêm (theo điểm) |
| `milestoneNext` | `2500` | Chu kỳ banner "TỐC ĐỘ TĂNG!" |
| `JUMP` / `GRAV` | `23` / `52` | Lực nhảy và trọng lực; nhảy kép = `JUMP*.86` |
| `gap = speed*(1.1+rand)+6` | — | Khoảng cách giữa các lượt spawn vật cản |
| `eggCd`, `powerTimer` | `7±`, `10±` | Thời gian (giây) giữa các thùng trứng /.power-up |
| `speed = 20 + min(32, score*.02)` | — | Công thức tăng tốc (max 52; rocket ×1.55) |
| `score = Math.floor(dist*.4)` | — | Quy đổi quãng đường thành điểm |
| `cloudCount`, `starCount`, `snowCount`… | — | Số mesh cho bản mobile / desktop |
| `bgmGain`, `sfxGain` | `0.22` / `0.45` | Âm lượng nhạc nền / hiệu ứng |

---

## 🌐 Tương thích

- Trình duyệt hiện đại có **WebGL** và **Web Audio API** (Chrome, Edge, Firefox, Safari).
- Hỗ trợ cả **desktop** (bàn phím + chuột) và **mobile** (chạm, `touch-action:none`, full-screen, an toàn notch với `env(safe-area-inset-*)`).

---

## 📄 Giấy phép

Phần mềm nhỏ mang tính cá nhân/học tập — tự do chỉnh sửa và chia sẻ. Three.js được tải qua CDN theo giấy phép riêng của dự án.
