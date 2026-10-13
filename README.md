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
| اتجاه النص | شاشة Cursor Agent ترسم الحروف من الشمال لليمين، فالعربي المنطقي يظهر مقلوبًا ومفصولًا. الرد يمر على `hooks/shape.mjs` فيطلع بالترتيب البصري. The Agent screen draws left to right, so logical Arabic looks reversed. Replies are passed through `hooks/shape.mjs` and shown in visual order. |

التعليمات في `rules/arabic.mdc` وتُطبَّق دائمًا. عند بداية الجلسة يعيد `hooks/cursor-session-start.mjs` نفس النص إلى Cursor. لو `node` غير موجود في `PATH` تظل القاعدة وحدها كافية.
The instructions live in `rules/arabic.mdc` and always apply. At session start, `hooks/cursor-session-start.mjs` sends the same text to Cursor. If `node` is not on `PATH`, the rule alone is enough.

لتغيير لغة التفكير إلى الإنجليزية، عدّل سطر التفكير في `rules/arabic.mdc`.
To make reasoning English, edit the thinking line in `rules/arabic.mdc`.

لو شاشة الوكيل بتعرض العربي صح من نفسها والحروف بقت مقلوبة بالعكس، استخدم وضع العرض الأصلي:
If the agent screen already displays Arabic correctly and shaped letters look reversed the other way, use native display mode. PowerShell is a shell; the terminal and the agent UI determine whether Arabic needs shaping.

في PowerShell / In PowerShell:

```powershell
$env:ARABIC_RTL = 'native'
agent
```

في Bash أو Zsh / In Bash or Zsh:

```bash
ARABIC_RTL=native agent
```

لإجبار التشكيل في PowerShell قبل تشغيل جلسة جديدة:
To force visual shaping in PowerShell before starting a new session:

```powershell
$env:ARABIC_RTL = 'visual'
agent
```

في Windows PowerShell 5.1 قد تتحول العربية إلى `????` عند إرسالها إلى Node. الإضافة تضيف تعليمات لضبط UTF-8 قبل إرسال النص. يمكن تجربة المحوّل من مجلد المستودع هكذا:
Windows PowerShell 5.1 can turn Arabic into `????` when piping text to Node. The plugin supplies UTF-8 setup instructions before the reply pipeline. Test the renderer from the repository folder:

```powershell
$env:ARABIC_RTL = 'visual'
[Console]::OutputEncoding = $OutputEncoding = [System.Text.UTF8Encoding]::new($false)
@'
مرحبا بك في Cursor
استخدم `git status` لفحص المشروع.
'@ | node ./hooks/shape.mjs
```

استخدم here-string بعلامات اقتباس مفردة حتى لا يغيّر PowerShell علامات backticks أو المتغيرات داخل الرد.
Use a single-quoted here-string so PowerShell preserves backticks and dollar signs in the reply.

خطاف السماح يوافق فقط على تشغيل المحوّل المحلي وحده. الأوامر المركبة والأنابيب تحتاج مراجعة، وقد تطلب صلاحيات Cursor الموافقة حتى مع وجود الخطاف. اختر Run once للمحوّل إذا ظهر السؤال.
The permission hook only allows a standalone invocation of this plugin's renderer. Pipelines and compound commands need review, and Cursor's own permissions may still require approval. Choose **Run once** for the renderer if prompted. See [Cursor CLI permissions](https://cursor.com/docs/cli/reference/permissions).

السطر اللي بتكتبه أنت ممكن يفضل مقلوب، لأن Cursor بيرسمه قبل ما الإضافة تشوفه. الرد هو اللي بيتشكّل.
The line you type can stay reversed, because Cursor draws it before the plugin sees it. The reply is what gets shaped.

## الاختبارات / Tests

```powershell
node --test hooks/*.test.mjs
```

يشمل الاختبار في Windows إرسال العربية إلى المحوّل عبر Windows PowerShell 5.1. يظل اختبار العرض النهائي في جلسة Cursor جديدة مطلوبًا.
On Windows, the tests include piping Arabic through Windows PowerShell 5.1 into the renderer. The final display still needs a check in a fresh Cursor session.

## الرخصة / License

MIT — انظر [LICENSE](LICENSE).
MIT — see [LICENSE](LICENSE).
