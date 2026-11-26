<div dir="rtl">

# کد اصلی — Liquid Glass (دست‌نخورده)

این پوشه نسخهٔ **عیناً کپی‌شدهٔ** کیت Liquid Glass است، بدون هیچ تغییری در فایل‌ها.

- منبع: [bilalgursen/liquid-glass](https://github.com/bilalgursen/liquid-glass)
- مسیر در مخزن بالادست: `src/components/liquid-glass/`
- کامیت گرفته‌شده: `59882f24` (شاخهٔ `main`)
- تاریخ جمع‌آوری: ۲۴ نوامبر ۲۰۲۶
- لایسنس: MIT — فایل [LICENSE](../LICENSE)

## چه چیزی اینجاست

| فایل | نقش |
| --- | --- |
| `engine.ts` | رندرر و شیدر مشترک WebGL2، فنرها، نور و سایه — بدون هیچ وابستگی |
| `dom-snapshot.ts` | عکس‌برداری از DOM پشت شیشه تا شیشه بتواند آن را بشکند |
| `glass-layer.tsx` | لایهٔ شیشه‌ای که روی هر میزبان قرار می‌گیرد (press، سوج، کشش) |
| `glass-button.tsx` · `glass-action-button.tsx` · `glass-tabs.tsx` · `glass-badge.tsx` · `glass-slide-to-confirm.tsx` · `glass-card.tsx` · `glass-button-group.tsx` | کامپوننت‌های کیت |
| `glass-lens.tsx` · `glass-popup.tsx` | بلوک‌های سازنده (لنز تب‌ها، پاپ‌آپ کشیده) |
| `glass-menu.tsx` · `glass-dropdown-menu.tsx` · `glass-popover.tsx` · `glass-select.tsx` | منوها و پاپ‌اورها (نیازمند `@ui-sdk/core` و `@ui-sdk/react`) |
| `controls/` | سوییچ، چک‌باکس و اسلایدر — تنها بخش‌هایی که به `three` نیاز دارند |
| `index.ts` | نقطهٔ ورود و فهرست اکسپورت‌ها |

## چرا اینجا کامل است

دموهای این گنجینه (`../press-button/`، `../merge-action-button/`، `../hold-card/`، `../share-button-group/`، `../flow-badge/`) نسخهٔ بدون build همان رندرر هستند؛ کد شیشه در آن‌ها از همین فایل‌ها برداشته شده، نه بازنویسی. بقیهٔ کامپوننت‌ها (تب‌ها، اسلاید-تأیید، منوها، کنترل‌های `three`) دمو ندارند ولی کدشان برای مرجع اینجاست.

> این کیت با React 19 و Tailwind CSS v4 نوشته شده؛ برای استفاده در پروژهٔ خودتان باید `@/` alias داشته باشید و `tailwindcss` نصب باشد. دموهای پوشهٔ والد برای همین بدون build اجرا می‌شوند که همین رندرر را در جاوااسکریپت ساده صدا می‌زنند.

</div>
