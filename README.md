<div dir="rtl">

# گنجینهٔ UI — ui-vault

مجموعهٔ شخصی الهام‌های رابط کاربری: هر آیتم با اسکرین‌شات زنده ذخیره می‌شود تا با یک نگاه به تصاویر پیدا شود، و کد/دموی آن کنارش هست.

## ساختار

```text
ui-vault/
├─ vibehub/                  ← اجزای ساخته‌شده در اپ VibeHub
│  └─ theme-toggle/          ← سوییچ شب و روز (کد + CSS + دمو + اسکرین‌شات)
└─ d3motion/                 ← ۲۴ کامپوننت انیمیشنی رایگان از d3motion.pro
   └─ <slug>/                ← card.png + component.html برای هر کامپوننت
```

## VibeHub — سوییچ شب و روز

صحنهٔ کامل شبانه‌روزی داخل تایتل‌بار اپ: خورشید و ماه با انیمیشن خسوف، ابرهای سه‌لایه، ستاره‌های چشمک‌زن و شهاب‌سنگ. جزئیات کامل در [vibehub/theme-toggle/README.md](vibehub/theme-toggle/README.md) — `demo.html` را در مرورگر باز کنید تا زنده ببینید.

| روز | شب |
| --- | --- |
| ![روز](vibehub/theme-toggle/shots/day.png) | ![شب](vibehub/theme-toggle/shots/night.png) |

## d3motion.pro — اجزای رایگان انیمیشنی

۲۴ کامپوننت HTML مستقل (بدون وابستگی، ۶۰FPS) که از [صفحهٔ Resources](https://d3motion.pro/resources) دانلود شده‌اند. نمایهٔ تصویری کامل با دسته‌بندی و ابعاد: [d3motion/README.md](d3motion/README.md)

| | | | |
| --- | --- | --- | --- |
| [![music-player](d3motion/music-player/card.png)](d3motion/music-player/) | [![segmented-control](d3motion/segmented-control/card.png)](d3motion/segmented-control/) | [![otp-verification](d3motion/otp-verification/card.png)](d3motion/otp-verification/) | [![weekly-calendar](d3motion/weekly-calendar/card.png)](d3motion/weekly-calendar/) |
| [![task-checklist](d3motion/task-checklist/card.png)](d3motion/task-checklist/) | [![weather-clock](d3motion/weather-clock/card.png)](d3motion/weather-clock/) | [![streak-tracker](d3motion/streak-tracker/card.png)](d3motion/streak-tracker/) | [![file-upload](d3motion/file-upload/card.png)](d3motion/file-upload/) |
| [![theme-toggle](d3motion/theme-toggle/card.png)](d3motion/theme-toggle/) | [![collaborator-presence](d3motion/collaborator-presence/card.png)](d3motion/collaborator-presence/) | [![route-navigation](d3motion/route-navigation/card.png)](d3motion/route-navigation/) | [![chat-stream](d3motion/chat-stream/card.png)](d3motion/chat-stream/) |
| [![kanban-board](d3motion/kanban-board/card.png)](d3motion/kanban-board/) | [![command-palette](d3motion/command-palette/card.png)](d3motion/command-palette/) | [![activity-rings](d3motion/activity-rings/card.png)](d3motion/activity-rings/) | [![volume-brightness-sliders](d3motion/volume-brightness-sliders/card.png)](d3motion/volume-brightness-sliders/) |
| [![countdown-timer](d3motion/countdown-timer/card.png)](d3motion/countdown-timer/) | [![battery-monitor](d3motion/battery-monitor/card.png)](d3motion/battery-monitor/) | [![social-heart-like](d3motion/social-heart-like/card.png)](d3motion/social-heart-like/) | [![stock-portfolio](d3motion/stock-portfolio/card.png)](d3motion/stock-portfolio/) |
| [![color-picker](d3motion/color-picker/card.png)](d3motion/color-picker/) | [![notification-stack](d3motion/notification-stack/card.png)](d3motion/notification-stack/) | [![pricing-toggle](d3motion/pricing-toggle/card.png)](d3motion/pricing-toggle/) | [![deploy-button](d3motion/deploy-button/card.png)](d3motion/deploy-button/) |

## چطور مرور کنم؟

- روی گیت‌هاب: همین README تصاویر را رندر می‌کند؛ روی هر تصویر کلیک کنید تا پوشهٔ آیتم باز شود.
- محلی: هر `component.html` و `demo.html` را مستقیم در مرورگر باز کنید — انیمیشن زندهٔ واقعی را می‌بینید.

> **نکتهٔ حقوقی:** فایل‌های `d3motion/` عیناً از سایت منبع دانلود شده‌اند و متعلق به سازندهٔ d3motion.pro هستند؛ این مجموعه فقط برای مرجع شخصی است و این ریپو باید خصوصی بماند.
</div>
