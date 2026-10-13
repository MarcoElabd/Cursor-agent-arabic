# عربي لـ Cursor و Claude Code

يخليه يرد ويفكر بالعربية، ويسيب الكود والأوامر والمسارات والمصطلحات الإنجليزية كما هي.

Makes Cursor and Claude Code reply and think in Arabic, while keeping code, commands, paths, and English technical terms in English.

## Cursor

ثبّت المستودع من Cursor: **Customize → Plugins → Add from GitHub**، والصق:

```text
MarcoElabd/Cursor-agent-arabic
```

Cursor يقرأ `.cursor-plugin/marketplace.json` ويثبّت إضافة `arabic`.

### ماذا يعمل على Cursor

| السلوك | كيف |
| --- | --- |
| الرد بالعربية، وباللهجة التي يكتب بها المستخدم | قاعدة دائمة في `rules/arabic.mdc` |
| التفكير بالعربية | نفس القاعدة |
| الكود والأوامر والمسارات والمصطلحات الإنجليزية تبقى بالإنجليزية داخل `` ` `` | نفس القاعدة |
| القوائم النقطية بدل الجداول | نفس القاعدة |
| نفس التعليمات في بداية الجلسة | `sessionStart` يحقن نص القاعدة في `additional_context` |

القاعدة هي المسار المضمون: Cursor يضيفها لسياق الوكيل من أول رسالة، وفي جلسات Cloud Agent أيضًا. الـ hook يعيد نفس النص للجلسات التي يصلها `sessionStart`. لو `node` غير موجود في `PATH`، الـ hook لا يوقف الجلسة والقاعدة تظل شغالة.

### ما لم يُنقل كما هو، ولماذا

نسخة Claude Code كانت تشتغل عبر محرك `claude-code` داخل `hooks/register.tsx`. Cursor لا يشغّل هذا الملف.

- **ترجمة قائمة `/config` ووصف الأوامر:** Claude Code يعطي الإضافة `command.describe` و `config.describe` و `model.complete`. Cursor ليس فيه هذه الأحداث، فترجمة القوائم الديناميكية لا يمكن تنفيذها. أسماء الأوامر والقيم (`true` / `false`) كانت تبقى إنجليزية هناك أيضًا.
- **إصلاح اتجاه النص `visual`:** كان يعيد ترتيب الحروف قبل رسمها في طرفية Claude Code التي لا تدعم RTL. شات Cursor يعرض العربية بالترتيب المنطقي بشكل صحيح. إعادة الترتيب هنا كانت ستظهر النص مقلوبًا، لذلك القاعدة تطلب كتابة العربية بالترتيب المنطقي. كود التشكيل والترتيب في `hooks/bidi.ts` بقي لنسخة Claude Code فقط.
- **إعدادات `/config` (`rtl` و `menus` و `thinking`):** خاصة بـ Claude Code. على Cursor السلوك هو الافتراضي الذي كان شغالًا: رد عربي، تفكير عربي. لتغيير التفكير إلى الإنجليزية، عدّل السطر الخاص به في `rules/arabic.mdc`.

## Claude Code

في جلسة Claude Code:

```text
/plugin install arabic --marketplace Abo-Eyad/ClaudeCode-arabic
```

أجب `y` لإضافة المتجر، ثم اختر نطاق **user**.

هذه النسخة لم يتغير سلوكها. `hooks/hooks.json` ما زال يحمّل `hooks/register.tsx`.

### الإعدادات (`/config` → arabic)

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

### حدود معروفة في Claude Code / Known limits

In `visual` mode only:

- The prompt box while you type and the thinking view (ctrl+o) can't be hooked, so Arabic there stays as your terminal shows it.
- Copying Arabic from the screen copies the reordered text; the saved conversation is untouched.
- Arabic replies are drawn as plain lines: headings bold, code blocks kept, `**` and `` ` `` markers dropped. Tashkeel is dropped.

Always:

- Menu translation runs once in the background with a small model (Haiku) and is cached; until it finishes, or for anything new, the menus show English. Setting values (`true`/`false`, option names) and command names stay English.

## الرخصة / License

MIT — see [LICENSE](LICENSE).
