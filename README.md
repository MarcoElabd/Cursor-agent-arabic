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
| اتجاه النص | الـ CLI بيرسم كل حرف في خانة من الشمال لليمين، فالعربي العادي يظهر مقطّع ومقلوب. الرد يتشكّل قبل العرض. The CLI paints each character in a cell from left to right, so normal Arabic looks disconnected and reversed. The reply is shaped before display. |

التعليمات في `rules/arabic.mdc` وتُطبَّق دائمًا. عند بداية الجلسة يعيد `hooks/cursor-session-start.mjs` نفس النص إلى Cursor. لو `node` غير موجود في `PATH` تظل القاعدة وحدها كافية.
The instructions live in `rules/arabic.mdc` and always apply. At session start, `hooks/cursor-session-start.mjs` sends the same text to Cursor. If `node` is not on `PATH`, the rule alone is enough.

لتغيير لغة التفكير إلى الإنجليزية، عدّل سطر التفكير في `rules/arabic.mdc`.
To make reasoning English, edit the thinking line in `rules/arabic.mdc`.

## PowerShell

الـ CLI على PowerShell بيرسم كل حرف لوحده من الشمال لليمين. العربي العادي يظهر مقطّع ومقلوب، زي شرح `cli-config.json` لما الحروف تبقى مفصولة. على Windows الرد يتكتب في ملف UTF-8، و`node` يشكّله، والنص الظاهر هو ناتج الأمر بس.
The CLI on PowerShell paints each character from left to right. Normal Arabic looks disconnected and reversed, the way a `cli-config.json` explanation looks when the letters are separated. On Windows the reply is written to a UTF-8 file, `node` shapes it, and the visible text is only that command's output.

متبعتش العربي في أنبوب PowerShell. Windows PowerShell 5.1 بيحوّله إلى `????`.
Do not pipe Arabic through PowerShell. Windows PowerShell 5.1 turns it into `????`.

حدّث الإضافة، وبعدين افتح جلسة `agent` جديدة:

```powershell
cd "$env:USERPROFILE\.cursor\plugins\local\arabic"
git pull
agent
```

لو Cursor سأل وهو بيشغّل `shape.mjs`، اختار **Run once**. السطر اللي بتكتبه أنت في الطرفية ممكن يفضل مقلوب. اللي بيتظبط هو رد الوكيل.
If Cursor asks while running `shape.mjs`, choose **Run once**. The line you type can stay reversed. The agent's reply is what gets shaped.

لو الحروف المتشكلة اتقلبت عكس اتجاه كان سليم، ارجع للعربي الطبيعي قبل جلسة جديدة:
If the shaped letters come out backwards when they were already correct, switch back to logical Arabic before a new session:

```powershell
$env:ARABIC_RTL = 'native'
agent
```

قائمة `/config` وكلمات مؤشر الانتظار في إضافة Claude Code مالهاش مقابل في Cursor. الإضافة هنا بتغيّر رد الوكيل وتفكيره واتجاه النص بس.
The Claude Code plugin's `/config` menu and spinner words have no Cursor equivalent. This plugin changes the agent's reply, its thinking, and text direction only.

## الاختبارات / Tests

```powershell
node --test hooks/*.test.mjs
```

الاختبار يتأكد إن جلسة Windows تطلب التشكيل، وإن الرد المتشكل ما يبقاش فيه حروف عربية عادية مقطعة.
The test checks that a Windows session asks for shaping, and that a shaped reply no longer contains ordinary disconnected Arabic letters.

## الرخصة / License

MIT — انظر [LICENSE](LICENSE).
MIT — see [LICENSE](LICENSE).
