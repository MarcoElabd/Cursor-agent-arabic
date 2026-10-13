# Cursor بالعربي — Arabic for Cursor

يجعل Cursor يرد ويفكر بالعربية، ويبقي الكود والأوامر والمسارات والمصطلحات الإنجليزية كما هي.
Makes Cursor reply and think in Arabic, and keeps code, commands, paths, and English technical terms in English.

## التثبيت / Install

1. من الشريط الجانبي افتح **Customize**.
   Open **Customize** in the sidebar.
2. اختر **From GitHub Repository** والصق المستودع:
   Choose **From GitHub Repository** and paste the repository:

   ```text
   MarcoElabd/Cursor-agent-arabic
   ```

3. ثبّت إضافة **arabic** على نطاق **user**.
   Install the **arabic** plugin at **user** scope.
4. ابدأ محادثة Agent جديدة. القاعدة لا تُضاف إلى محادثة مفتوحة من قبل.
   Start a new Agent chat. The rule is not added to a chat that is already open.

للتجربة المحلية انسخ المستودع إلى `~/.cursor/plugins/local/arabic` ثم أعد تحميل النافذة من **Developer: Reload Window**، وتأكد أن الإضافة ظاهرة في Customize.
To try it locally, copy the repository to `~/.cursor/plugins/local/arabic`, run **Developer: Reload Window**, and confirm the plugin shows up in Customize.

## ماذا يفعل / What it does

| | |
| --- | --- |
| الرد | بالعربية الفصحى، أو بلهجة المستخدم إن كتب بها. Replies in Modern Standard Arabic, or in the user's dialect. |
| التفكير | بالعربية. Reasoning stays in Arabic. |
| الكود | الأوامر والمسارات والمعرّفات والمصطلحات الإنجليزية تبقى بالإنجليزية داخل `` ` ``. Commands, paths, identifiers, and English-only terms stay in English, inside backticks. |
| التنسيق | قوائم نقطية بدل الجداول. Bullet lists instead of markdown tables. |
| اتجاه النص | اكتب العربية بالترتيب المنطقي. شات Cursor يعرضها بشكل صحيح. Write Arabic in logical order. Cursor's chat displays it correctly. |

التعليمات في `rules/arabic.mdc` وتُطبَّق دائمًا. عند بداية الجلسة يعيد `hooks/cursor-session-start.mjs` نفس النص إلى Cursor. لو `node` غير موجود في `PATH` تظل القاعدة وحدها كافية.
The instructions live in `rules/arabic.mdc` and always apply. At session start, `hooks/cursor-session-start.mjs` sends the same text to Cursor. If `node` is not on `PATH`, the rule alone is enough.

لتغيير لغة التفكير إلى الإنجليزية، عدّل سطر التفكير في `rules/arabic.mdc`.
To make reasoning English, edit the thinking line in `rules/arabic.mdc`.

## الرخصة / License

MIT — انظر [LICENSE](LICENSE).
MIT — see [LICENSE](LICENSE).
