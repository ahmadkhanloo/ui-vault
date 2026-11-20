<div dir="rtl">

# گنجینهٔ UI — ui-vault

مجموعهٔ شخصی الهام‌های رابط کاربری: **50 آیتم** که بر اساس *کارکرد* دسته‌بندی شده‌اند تا هر چیزی را که لازم داری، کنار همکاران خودش پیدا کنی. هر آیتم با اسکرین‌شات زنده ذخیره می‌شود و کد/دمویش کنارش هست.

```text
ui-vault/
├─ index.html            ← گالری زندهٔ همهٔ آیتم‌ها (بخش‌بندی کارکردی + جستجو)
├─ SOURCES.md            ← منبع هر آیتم، تاریخ جمع‌آوری و وضعیت حقوق
├─ charts/               ← نمودارها (13) — ۱۲ کارت مالی Quix + اسپارک‌لاین d3motion
├─ indicators/           ← نشانگرها و گیج‌ها (17) — ۱۲ گیج Quix + ۵ نشانگر d3motion
├─ toggles/              ← سوییچ‌ها (3)
├─ buttons/              ← دکمه‌ها (2)
├─ cards/                ← کارت‌ها (3)
├─ inputs/               ← ورودی‌ها (3)
├─ navigation/           ← ناوبری (4)
├─ interactions/         ← تعاملات (4)
└─ showcase/             ← ویترین محصول انیمیشنی (۱)
```

## چطور مرور کنم؟

- **گالری زنده:** `index.html` را باز کنید (ترجیحاً با سرور محلی — `python -m http.server 4173` — تا همهٔ پیش‌نمایش‌ها زنده بارگذاری شوند). همهٔ آیتم‌ها انیمیشن‌دار، بخش‌بندی کارکردی و با جستجو.
- **روی گیت‌هاب:** همین README تصاویر را رندر می‌کند؛ کلیک روی هر تصویر، پوشهٔ آیتم را باز می‌کند.
- **محلی:** هر `component.html` / `demo.html` / `index.html` داخل پوشهٔ آیتم را مستقیم در مرورگر باز کنید.

---

## نمودارها — charts

کارت‌های مالی انیمیشنی از [Quix Studio](https://quixstudio.net/free/components#charts) به‌همراه اسپارک‌لاین d3motion؛ همه زنده در مرورگر اجرا می‌شوند.
|   |   |   |
| --- | --- | --- |
| [![candlestick](charts/candlestick/card.png)](charts/candlestick/) <br>کندل‌استیک BTC/USD <br>`Quix` | [![portfolio-donut](charts/portfolio-donut/card.png)](charts/portfolio-donut/) <br>دونات سبد سرمایه <br>`Quix` | [![fear-greed](charts/fear-greed/card.png)](charts/fear-greed/) <br>شاخص ترس و طمع <br>`Quix` |
| [![credit-score](charts/credit-score/card.png)](charts/credit-score/) <br>امتیاز اعتباری <br>`Quix` | [![yield-curve](charts/yield-curve/card.png)](charts/yield-curve/) <br>منحنی بازده <br>`Quix` | [![activity-heatmap](charts/activity-heatmap/card.png)](charts/activity-heatmap/) <br>هیت‌مپ فعالیت <br>`Quix` |
| [![market-depth](charts/market-depth/card.png)](charts/market-depth/) <br>عمق بازار <br>`Quix` | [![gas-tracker](charts/gas-tracker/card.png)](charts/gas-tracker/) <br>ردیاب کارمزد گس <br>`Quix` | [![budget-bars](charts/budget-bars/card.png)](charts/budget-bars/) <br>میله‌های بودجه <br>`Quix` |
| [![gradient-line](charts/gradient-line/card.png)](charts/gradient-line/) <br>خط گرادیانی <br>`Quix` | [![savings-ring](charts/savings-ring/card.png)](charts/savings-ring/) <br>حلقهٔ پس‌انداز <br>`Quix` | [![dominance-rings](charts/dominance-rings/card.png)](charts/dominance-rings/) <br>حلقه‌های سلطهٔ بازار <br>`Quix` |
| [![stock-portfolio](charts/stock-portfolio/card.png)](charts/stock-portfolio/) <br>اسپارک‌لاین پرتفوی مالی <br>`d3motion` |


## نشانگرها و گیج‌ها — indicators

گیج‌های درصدی و نوارهای پیشرفت Quix (عنصر `<lp-loader>` با اتریبیوت‌های type/color/speed/value) کنار نشانگرهای d3motion.
|   |   |   |
| --- | --- | --- |
| [![multi-arc-percent](indicators/multi-arc-percent/card.png)](indicators/multi-arc-percent/) <br>گیج درصدی سه‌قوسی <br>`Quix` | [![block-ring](indicators/block-ring/card.png)](indicators/block-ring/) <br>حلقهٔ بلوکی درصد <br>`Quix` | [![chunk-percent](indicators/chunk-percent/card.png)](indicators/chunk-percent/) <br>گیج درصدی تکه‌ای <br>`Quix` |
| [![radial-bar-percent](indicators/radial-bar-percent/card.png)](indicators/radial-bar-percent/) <br>نوار پیشرفت شعاعی <br>`Quix` | [![bar-glow](indicators/bar-glow/card.png)](indicators/bar-glow/) <br>نوار پیشرفت درخشان <br>`Quix` | [![bar-ticks](indicators/bar-ticks/card.png)](indicators/bar-ticks/) <br>نوار پیشرفت تیک‌دار <br>`Quix` |
| [![bar-chevron](indicators/bar-chevron/card.png)](indicators/bar-chevron/) <br>نوار پیشرفت شورون <br>`Quix` | [![bar-stripes](indicators/bar-stripes/card.png)](indicators/bar-stripes/) <br>نوار پیشرفت راه‌راه <br>`Quix` | [![bar-spark](indicators/bar-spark/card.png)](indicators/bar-spark/) <br>نوار پیشرفت جرقه‌ای <br>`Quix` |
| [![bar-streak](indicators/bar-streak/card.png)](indicators/bar-streak/) <br>نوار پیشرفت رگهٔ نور <br>`Quix` | [![bar-dots](indicators/bar-dots/card.png)](indicators/bar-dots/) <br>نوار پیشرفت نقطه‌ای <br>`Quix` | [![bar-dot-sparkle](indicators/bar-dot-sparkle/card.png)](indicators/bar-dot-sparkle/) <br>نوار نقطه‌ای درخشان <br>`Quix` |
| [![streak-tracker](indicators/streak-tracker/card.png)](indicators/streak-tracker/) <br>ردیاب استریک روزانه <br>`d3motion` | [![collaborator-presence](indicators/collaborator-presence/card.png)](indicators/collaborator-presence/) <br>حضور زندهٔ همکاران <br>`d3motion` | [![activity-rings](indicators/activity-rings/card.png)](indicators/activity-rings/) <br>حلقه‌های پیشرفت <br>`d3motion` |
| [![countdown-timer](indicators/countdown-timer/card.png)](indicators/countdown-timer/) <br>تایمر تمرکز (پومودورو) <br>`d3motion` | [![battery-monitor](indicators/battery-monitor/card.png)](indicators/battery-monitor/) <br>مانیتور باتری چنددستگاهی <br>`d3motion` |


## سوییچ‌ها — toggles

سوییچ شب و روز VibeHub (کد React + دموی زنده) و سوییچ‌های d3motion.
|   |   |   |
| --- | --- | --- |
| [![day-night-switch](toggles/day-night-switch/shots/day.png)](toggles/day-night-switch/) <br>سوییچ شب و روز (VibeHub) <br>`VibeHub` | [![theme-toggle](toggles/theme-toggle/card.png)](toggles/theme-toggle/) <br>سوییچ شب و روز d3motion <br>`d3motion` | [![pricing-toggle](toggles/pricing-toggle/card.png)](toggles/pricing-toggle/) <br>سوییچ پلن قیمت <br>`d3motion` |


## دکمه‌ها — buttons


|   |   |   |
| --- | --- | --- |
| [![deploy-button](buttons/deploy-button/card.png)](buttons/deploy-button/) <br>دکمهٔ دیپلوی مورف‌شونده <br>`d3motion` | [![social-heart-like](buttons/social-heart-like/card.png)](buttons/social-heart-like/) <br>دکمهٔ لایک قلب <br>`d3motion` |


## کارت‌ها — cards


|   |   |   |
| --- | --- | --- |
| [![music-player](cards/music-player/card.png)](cards/music-player/) <br>پلیر موسیقی Now Playing <br>`d3motion` | [![weather-clock](cards/weather-clock/card.png)](cards/weather-clock/) <br>ساعت جهانی و آب‌وهوا <br>`d3motion` | [![notification-stack](cards/notification-stack/card.png)](cards/notification-stack/) <br>مرکز اعلان انباشته <br>`d3motion` |


## ورودی‌ها — inputs


|   |   |   |
| --- | --- | --- |
| [![otp-verification](inputs/otp-verification/card.png)](inputs/otp-verification/) <br>تأیید کد ۶ رقمی OTP <br>`d3motion` | [![volume-brightness-sliders](inputs/volume-brightness-sliders/card.png)](inputs/volume-brightness-sliders/) <br>اسلایدر صدا و روشنایی <br>`d3motion` | [![color-picker](inputs/color-picker/card.png)](inputs/color-picker/) <br>انتخابگر رنگ HSL <br>`d3motion` |


## ناوبری — navigation


|   |   |   |
| --- | --- | --- |
| [![segmented-control](navigation/segmented-control/card.png)](navigation/segmented-control/) <br>کنترل ناوبری سگمنتی <br>`d3motion` | [![weekly-calendar](navigation/weekly-calendar/card.png)](navigation/weekly-calendar/) <br>نوار تقویم هفتگی <br>`d3motion` | [![route-navigation](navigation/route-navigation/card.png)](navigation/route-navigation/) <br>ناوبری زندهٔ GPS <br>`d3motion` |
| [![command-palette](navigation/command-palette/card.png)](navigation/command-palette/) <br>کامند پلت ⌘K <br>`d3motion` |


## تعاملات — interactions


|   |   |   |
| --- | --- | --- |
| [![task-checklist](interactions/task-checklist/card.png)](interactions/task-checklist/) <br>چک‌لیست تعاملی <br>`d3motion` | [![file-upload](interactions/file-upload/card.png)](interactions/file-upload/) <br>پیشرفت آپلود فایل <br>`d3motion` | [![chat-stream](interactions/chat-stream/card.png)](interactions/chat-stream/) <br>جریان چت زنده <br>`d3motion` |
| [![kanban-board](interactions/kanban-board/card.png)](interactions/kanban-board/) <br>برد کانبان اسپرینت <br>`d3motion` |


## ویترین محصول — showcase

**Cake Couch** — نمایش محصول انیمیشنی با سه تم چرخشی، مداری نامرئی و پنتاگون چرخان پس‌زمینه. HTML/CSS/JS خالص با SVG دست‌ساز، بدون وابستگی (~۱۲KB gzip). کد کامل در [showcase/cake-couch/](showcase/cake-couch/) — [README آیتم](showcase/cake-couch/README.md) · [دموی زنده](https://cake-couch-animation.vercel.app) · [مخزن منبع](https://github.com/HamzehGhoreyshi/cake-couch-animation)

| کارت | انیمیشن سه تم |
| --- | --- |
| [![Cake Couch](showcase/cake-couch/card.png)](showcase/cake-couch/) | ![سه تم](showcase/cake-couch/shots/loop.gif) |

> `art.svg` با `fetch` خوانده می‌شود؛ برای اجرا داخل `showcase/cake-couch/` یک `python -m http.server 4173` بالا بیاورید.

---

> **نکتهٔ حقوقی:** فایل‌های `d3motion` عیناً از [d3motion.pro/resources](https://d3motion.pro/resources) دانلود شده‌اند و متعلق به سازندهٔ آن سایت‌اند؛ اجازهٔ بازنشر صریحی داده نشده، پس این ریپو باید خصوصی بماند. کامپوننت‌های `Quix` از بخش رایگان [quixstudio.net](https://quixstudio.net/free/components) کپی شده‌اند که طبق اعلام سایت برای «استفادهٔ شخصی و تجاری» آزادند. `cake-couch` از مخزن عمومی [HamzehGhoreyshi/cake-couch-animation](https://github.com/HamzehGhoreyshi/cake-couch-animation) کپی شده و فایل لایسنس ندارد — همه جزئیات در [SOURCES.md](SOURCES.md).
</div>
