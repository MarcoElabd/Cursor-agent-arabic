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
| اتجاه النص | الرد عربي طبيعي. شات Cursor وWindows Terminal بيرسموه صح. تشكيل الحروف قبل العرض بيقلبها. The reply is logical Arabic. The Cursor chat and Windows Terminal draw it. Shaping the letters first makes them look reversed. |

التعليمات في `rules/arabic.mdc` وتُطبَّق دائمًا. عند بداية الجلسة يعيد `hooks/cursor-session-start.mjs` نفس النص إلى Cursor. لو `node` غير موجود في `PATH` تظل القاعدة وحدها كافية.
The instructions live in `rules/arabic.mdc` and always apply. At session start, `hooks/cursor-session-start.mjs` sends the same text to Cursor. If `node` is not on `PATH`, the rule alone is enough.

لتغيير لغة التفكير إلى الإنجليزية، عدّل سطر التفكير في `rules/arabic.mdc`.
To make reasoning English, edit the thinking line in `rules/arabic.mdc`.

## PowerShell

شات Cursor هو مكان الرد، وبيرسم العربي لوحده. الإضافة ما بتحوّلش الحروف، وما بتشغّلش أمر في PowerShell عشان تعرض الرد. تحويل الحروف لأشكال العرض كان بيخلّيها مقلوبة في الشات وفي Windows Terminal.
The Cursor chat is where the reply appears, and it draws Arabic itself. The plugin does not reshape letters and does not run a PowerShell command to display the reply. Presentation forms were showing up reversed in the chat and in Windows Terminal.

السطر اللي بتكتبه جوه نافذة PowerShell المدمجة في Cursor ممكن يفضل مقلوب. النافذة دي بترسم من الشمال لليمين، والإضافة مش بتقدر تغيّر رسمها. اقرأ الرد من شات الوكيل. لأوامر الطرفية استخدم Windows Terminal، مش نافذة `cmd` القديمة.
A line you type in Cursor's integrated PowerShell window can stay reversed. That window draws left to right, and the plugin cannot change how it paints. Read the reply in the agent chat. For a shell, use Windows Terminal, not the old `cmd` window.

متبعتش العربي في أنبوب PowerShell. Windows PowerShell 5.1 بيحوّله إلى `????`.
Do not pipe Arabic through PowerShell. Windows PowerShell 5.1 turns it into `????`.

حدّث الإضافة، وبعدين **Developer: Reload Window**، وافتح محادثة Agent جديدة:

```powershell
cd "$env:USERPROFILE\.cursor\plugins\local\arabic"
git pull
```

لو الوكيل شغّال جوه طرفية ما بترسمش العربي خالص، وحروف الرد نفسه مقطعة، اجبر التشكيل قبل جلسة جديدة. ده مش الوضع العادي:
If the agent is running inside a terminal that cannot draw Arabic at all, and the reply letters are disconnected, force shaping before a new session. This is not the normal mode:

```powershell
$env:ARABIC_RTL = 'visual'
agent
```

في الوضع ده الرد يتكتب في ملف UTF-8، و`node` يقرأه. اختار **Run once** لو Cursor سأل. لو الحروف اتقلبت، ارجع للوضع الطبيعي:
In that mode the reply is written to a UTF-8 file and `node` reads it. Choose **Run once** if Cursor asks. If the letters come out reversed, go back to native:

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

الاختبار يتأكد إن جلسة Windows تطلب عربي طبيعي، وإن أشكال العرض مش هي النص اللي يتبعت لشاشة بتعرف ترسم العربي.
The test checks that a Windows session asks for logical Arabic, and that presentation forms are not what a bidi screen should receive.

## الرخصة / License

MIT — انظر [LICENSE](LICENSE).
MIT — see [LICENSE](LICENSE).
