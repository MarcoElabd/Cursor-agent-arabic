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
| اتجاه النص | الـ CLI بيرسم كل حرف في خانة من الشمال لليمين، فالعربي العادي يظهر مقطّع ومقلوب. الرد يتشكّل بـ Smart RTL + أشكال العرض قبل الظهور. The CLI paints each character in a cell from left to right, so normal Arabic looks disconnected and reversed. The reply is laid out with Smart RTL spans and presentation forms before display. |

التعليمات في `rules/arabic.mdc` وتُطبَّق دائمًا. عند بداية الجلسة يعيد `hooks/cursor-session-start.mjs` نفس النص إلى Cursor. لو `node` غير موجود في `PATH` تظل القاعدة وحدها كافية.
The instructions live in `rules/arabic.mdc` and always apply. At session start, `hooks/cursor-session-start.mjs` sends the same text to Cursor. If `node` is not on `PATH`, the rule alone is enough.

لتغيير لغة التفكير إلى الإنجليزية، عدّل سطر التفكير في `rules/arabic.mdc`.
To make reasoning English, edit the thinking line in `rules/arabic.mdc`.

## PowerShell وحل `????`

الـ CLI على PowerShell بيرسم كل حرف لوحده من الشمال لليمين. على Windows الرد يتكتب في ملف UTF-8 بأداة الملفات، و`node` يشكّله بـ Smart RTL، والنص الظاهر يُنسخ من ملف الناتج فقط. أمر التشكيل يطبع `ok` على stdout ولا يطبع عربي هناك، عشان PowerShell 5.1 ما يحوّلوش لـ `????`.
On Windows the reply is written to a UTF-8 file with the file tool, `node` shapes it with Smart RTL, and the visible text is copied only from the shaped file. The shape command prints ASCII `ok` on stdout and never prints Arabic there, so PowerShell 5.1 cannot turn the reply into `????`.

متبعتش العربي في أنبوب PowerShell أبدًا.
Do not pipe Arabic through PowerShell.

```powershell
cd "$env:USERPROFILE\.cursor\plugins\local\arabic"
git pull
agent
```

عشان يشتغل من غير سؤال، حط السطر ده في `permissions.allow` جوه `~/.cursor/cli-config.json`:
To let it run without a question, add this to `permissions.allow` inside `~/.cursor/cli-config.json`:

```json
"Shell(node:*shape.mjs*)"
```

لو Cursor سأل وهو بيشغّل `shape.mjs`، اختار **Run once**.
If Cursor asks while running `shape.mjs`, choose **Run once**.

## RtlTerminal

[RtlTerminal](https://github.com/mirbehnam/RtlTerminal) محاكي طرفية لويندوز بيرسم العربي والفارسي صح (Smart RTL + ConPTY). الإضافة مش بتستبدله: Cursor بيرسم خلايا LTR، فإحنا بنقل خوارزمية الـ spans ونكمّلها بأشكال العرض.
[RtlTerminal](https://github.com/mirbehnam/RtlTerminal) is a Windows terminal that paints Arabic/Persian correctly (Smart RTL + ConPTY). This plugin does not replace it: Cursor paints LTR cells, so we port the directional-span idea and finish with presentation forms.

لو بتشغّل `agent` جوّه RtlTerminal، عطّل التشكيل عشان ما يحصلش قلب مرتين:
If you run `agent` inside RtlTerminal, disable shaping so letters are not reversed twice:

```powershell
$env:ARABIC_RTL = 'native'
# or: $env:RTLTERMINAL = '1'
agent
```

## الاختبارات / Tests

```powershell
node --test hooks/*.test.mjs
```

الاختبار يتأكد إن جلسة Windows تطلب التشكيل، وإن الرد المتشكل ما يبقاش فيه حروف عربية عادية مقطعة.
The test checks that a Windows session asks for shaping, and that a shaped reply no longer contains ordinary disconnected Arabic letters.

## الرخصة / License

MIT — انظر [LICENSE](LICENSE).
MIT — see [LICENSE](LICENSE).
