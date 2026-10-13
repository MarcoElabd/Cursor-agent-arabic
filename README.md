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
| اتجاه النص | PowerShell داخل Windows Terminal، وشات Cursor، بيعرضوا العربي صح من غير تحويل. الطرفيات اللي مش بترسم العربي (طرفية Cursor أو VS Code) بتعدّي الرد على `hooks/shape.mjs` من ملف UTF-8. PowerShell in Windows Terminal, and the Cursor chat, show logical Arabic. Terminals that cannot draw it pass the reply through `hooks/shape.mjs` from a UTF-8 file. |

التعليمات في `rules/arabic.mdc` وتُطبَّق دائمًا. عند بداية الجلسة يعيد `hooks/cursor-session-start.mjs` نفس النص إلى Cursor. لو `node` غير موجود في `PATH` تظل القاعدة وحدها كافية.
The instructions live in `rules/arabic.mdc` and always apply. At session start, `hooks/cursor-session-start.mjs` sends the same text to Cursor. If `node` is not on `PATH`, the rule alone is enough.

لتغيير لغة التفكير إلى الإنجليزية، عدّل سطر التفكير في `rules/arabic.mdc`.
To make reasoning English, edit the thinking line in `rules/arabic.mdc`.

## PowerShell

على PowerShell في Windows Terminal مش محتاج تظبط حاجة. الإضافة بتسيب العربي بالترتيب الطبيعي، لأن Windows Terminal بيرسمه صح. متبعتش العربي في أنبوب PowerShell: Windows PowerShell 5.1 بيحوّله إلى `????` قبل ما يوصل لـ Node.
On PowerShell in Windows Terminal you do not set anything. The plugin leaves Arabic in logical order, because Windows Terminal draws it. Do not pipe Arabic through PowerShell: Windows PowerShell 5.1 turns it into `????` before Node sees it.

استخدم Windows Terminal، مش نافذة `cmd` القديمة.
Use Windows Terminal, not the old `cmd` console window.

لو الحروف ظاهرة مقطعة أو مقلوبة (طرفية Cursor أو VS Code)، اجبر التشكيل قبل جلسة جديدة:
If letters look disconnected or reversed (the Cursor or VS Code terminal), force shaping before a new session:

```powershell
$env:ARABIC_RTL = 'visual'
agent
```

في الوضع ده الوكيل بيكتب الرد في ملف UTF-8 بأداة الملفات، وبعدين يشغّل `node` على الملف. الأمر بيفتح UTF-8 في نفس سطر PowerShell عشان الخرج يرجع عربي مش علامات استفهام. اختار **Run once** لو Cursor سأل.
In that mode the agent writes the reply to a UTF-8 file with the file tool, then runs `node` on the file. The command turns on UTF-8 in the same PowerShell line so the output comes back as Arabic. Choose **Run once** if Cursor asks.

لو التشكيل خلّى حروف سليمة تتقلب بالعكس، ارجع للوضع الطبيعي:
If shaping flips letters that were already correct, switch back to native:

```powershell
$env:ARABIC_RTL = 'native'
agent
```

في Bash أو Zsh / In Bash or Zsh:

```bash
ARABIC_RTL=native agent
```

تجربة المحوّل من مجلد المستودع، من غير ما العربي يعدي على PowerShell:
Try the renderer from the repository folder without sending Arabic through PowerShell:

```powershell
$env:ARABIC_RTL = 'visual'
[Console]::OutputEncoding = $OutputEncoding = [System.Text.UTF8Encoding]::new($false)
[System.IO.File]::WriteAllText("$pwd\reply.txt", "مرحبا بك في Cursor`n", [System.Text.UTF8Encoding]::new($false))
node ./hooks/shape.mjs .\reply.txt
```

خطاف السماح يوافق على المحوّل المحلي وحده، أو مع ملف الرد بس. الأنبوب والأوامر المركبة تحتاج مراجعة، وقد تطلب صلاحيات Cursor الموافقة حتى مع وجود الخطاف.
The permission hook allows only this plugin's renderer, alone or with the reply file. Pipelines and compound commands need review, and Cursor's own permissions may still ask. See [Cursor CLI permissions](https://cursor.com/docs/cli/reference/permissions).

السطر اللي بتكتبه أنت ممكن يفضل مقلوب، لأن Cursor بيرسمه قبل ما الإضافة تشوفه.
The line you type can stay reversed, because Cursor draws it before the plugin sees it.

قائمة `/config` وكلمات مؤشر الانتظار في إضافة Claude Code مالهاش مقابل في Cursor. الإضافة هنا بتغيّر رد الوكيل وتفكيره واتجاه النص بس.
The Claude Code plugin's `/config` menu and spinner words have no Cursor equivalent. This plugin changes the agent's reply, its thinking, and text direction only.

## الاختبارات / Tests

```powershell
node --test hooks/*.test.mjs
```

يشمل الاختبار في Windows إرسال العربية إلى المحوّل عبر Windows PowerShell 5.1. يظل اختبار العرض النهائي في جلسة Cursor جديدة مطلوبًا.
On Windows, the tests include piping Arabic through Windows PowerShell 5.1 into the renderer. The final display still needs a check in a fresh Cursor session.

## الرخصة / License

MIT — انظر [LICENSE](LICENSE).
MIT — see [LICENSE](LICENSE).
