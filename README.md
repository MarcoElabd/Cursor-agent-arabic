# Cursor بالعربي — Arabic for Cursor

يجعل Cursor يرد ويفكر بالعربية، ويبقي الكود والأوامر والمسارات والمصطلحات الإنجليزية كما هي.
Makes Cursor reply and think in Arabic, and keeps code, commands, paths, and English technical terms in English.

نسخة Claude Code ما زالت في نفس المستودع، وسلوكها لم يتغير.
The Claude Code build is still in this repository, and its behavior is unchanged.

## التثبيت على Cursor / Install on Cursor

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
| اتجاه النص | اكتب العربية بالترتيب المنطقي. شات Cursor يعرضها بشكل صحيح، ولا تُعكس الحروف. Write Arabic in logical order. Cursor's chat already displays it; letters are not reordered. |

التعليمات في `rules/arabic.mdc` وتُطبَّق دائمًا. عند بداية الجلسة يعيد `hooks/cursor-session-start.mjs` نفس النص إلى Cursor. لو `node` غير موجود في `PATH` تظل القاعدة وحدها كافية.
The instructions live in `rules/arabic.mdc` and always apply. At session start, `hooks/cursor-session-start.mjs` sends the same text to Cursor. If `node` is not on `PATH`, the rule alone is enough.

لتغيير لغة التفكير إلى الإنجليزية، عدّل سطر التفكير في `rules/arabic.mdc`.
To make reasoning English, edit the thinking line in `rules/arabic.mdc`.

## ما الذي تغيّر عن نسخة Claude Code / What changed from Claude Code

Cursor لا يشغّل `hooks/register.tsx`، لأن هذا الملف مربوط بمحرك Claude Code. السلوك انتقل كالتالي:
Cursor does not run `hooks/register.tsx`, because that file is tied to the Claude Code engine. The behavior moved like this:

- **الرد والتفكير:** من حدث `prompt.compose` إلى القاعدة الدائمة `rules/arabic.mdc`، ونفس النص يُحقن عند `sessionStart`.
  **Replies and thinking:** from the `prompt.compose` event to the always-on rule `rules/arabic.mdc`, with the same text injected on `sessionStart`.
- **ترجمة قائمة `/config` ووصف الأوامر:** لم تُنقل. Cursor ليس فيه `command.describe` ولا `config.describe`.
  **`/config` menu and command descriptions:** not ported. Cursor has no `command.describe` or `config.describe` events.
- **إصلاح RTL البصري:** لم يُطبَّق على الشات. كان يعيد ترتيب الحروف لطرفيات Claude Code التي تعرض العربية مقلوبة، وهذا سيعكس النص في Cursor. الكود بقي في `hooks/bidi.ts` لنسخة Claude Code.
  **Visual RTL fix:** not applied to chat. It reordered letters for Claude Code terminals that show Arabic reversed, which would reverse text in Cursor. The code remains in `hooks/bidi.ts` for Claude Code.
- **إعدادات `/config`:** `rtl` و `menus` و `thinking` خاصة بـ Claude Code. على Cursor الافتراضي هو رد عربي وتفكير عربي.
  **`/config` settings:** `rtl`, `menus`, and `thinking` belong to Claude Code. On Cursor the default is Arabic replies and Arabic thinking.

## Claude Code

في جلسة Claude Code:

```text
/plugin install arabic --marketplace Abo-Eyad/ClaudeCode-arabic
```

أجب `y` لإضافة المتجر، ثم اختر نطاق **user**.
Answer `y` to add the marketplace, then pick the **user** scope.

`hooks/hooks.json` ما زال يحمّل `hooks/register.tsx`.
`hooks/hooks.json` still loads `hooks/register.tsx`.

### الإعدادات / Settings (`/config` → arabic)

| Setting | Values | Meaning |
| --- | --- | --- |
| RTL mode | `auto` (default) | Detects the terminal: `visual` for VS Code, kitty, Alacritty, Ghostty and WezTerm; `native` for everything else (tested on Windows Terminal). |
| | `native` | Your terminal shows Arabic itself. |
| | `visual` | Use only if Arabic shows reversed or with disconnected letters: the mod reorders and joins it itself. |
| Menu language | `arabic` (default) / `english` | Language of the `/config` menu and the slash-command descriptions. |
| Thinking language | `arabic` (default) / `english` | Language Claude reasons in, and of the spinner words. English is slightly cheaper; replies stay Arabic either way. |

### إعدادات الطرفية / Terminal setup

- **Windows:** use Windows Terminal (not the old `cmd` console window). Nothing to change.
- **Arabic reversed or letters disconnected?** Your terminal doesn't do right-to-left: `/config` → arabic → RTL mode → `visual`.
- **Font:** one with Arabic glyphs, e.g. Cascadia Mono (2404+), DejaVu Sans Mono, Kawkab Mono, Vazir Code.
- **WezTerm (optional):** turn on its own RTL support in `~/.wezterm.lua`, then set RTL mode to `native`:

```lua
config.bidi_enabled = true
config.bidi_direction = 'AutoLeftToRight'
```

### حدود معروفة / Known limits

في وضع `visual` فقط:
In `visual` mode only:

- صندوق الكتابة أثناء الإدخال وعرض التفكير (ctrl+o) لا يمكن ربطهما، فتبقى العربية كما تعرضها الطرفية.
  The prompt box while you type and the thinking view (ctrl+o) can't be hooked, so Arabic there stays as your terminal shows it.
- نسخ العربية من الشاشة ينسخ النص بعد إعادة ترتيبه، والمحادثة المحفوظة لا تتغير.
  Copying Arabic from the screen copies the reordered text; the saved conversation is untouched.
- ردود العربية تُرسم كسطور عادية: العناوين عريضة، وكتل الكود تبقى، وعلامات `**` و `` ` `` تُحذف. التشكيل يُحذف.
  Arabic replies are drawn as plain lines: headings bold, code blocks kept, `**` and `` ` `` markers dropped. Tashkeel is dropped.

دائمًا:
Always:

- ترجمة القوائم تعمل مرة في الخلفية بنموذج صغير (Haiku) وتُخزَّن. إلى أن تنتهي، أو لأي نص جديد، تظهر القوائم بالإنجليزية. قيم الإعدادات (`true`/`false` وأسماء الخيارات) وأسماء الأوامر تبقى إنجليزية.
  Menu translation runs once in the background with a small model (Haiku) and is cached. Until it finishes, or for anything new, the menus show English. Setting values (`true`/`false`, option names) and command names stay English.

## الرخصة / License

MIT — انظر [LICENSE](LICENSE).
MIT — see [LICENSE](LICENSE).
