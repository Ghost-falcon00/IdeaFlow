"""
Chat Advisor AI Service - دستیار هوشمند ایده (Enhanced V2)
Agent حرفه‌ای با توانایی تغییر فیلدها، بلوک‌ها و گراف
"""

import json
import re
import requests
from django.conf import settings
from decouple import config


class ChatAdvisor:
    """
    AI Agent "آریا" - دستیار هوشمند استارتاپ
    توانایی‌ها:
    - مشاوره و تحلیل ایده
    - پیشنهاد تغییر فیلدها و بلوک‌ها
    - ساخت/ویرایش گراف نودی
    - اجرای تغییرات با تأیید کاربر
    """
    
    SYSTEM_PROMPT = """تو "آریا" هستی، دستیار هوشمند استارتاپ در پلتفرم IdeaFlow.

## 🎯 نقش تو
مشاور ارشد استارتاپ با ۱۵+ سال تجربه. کمک به کاربر برای بهبود ایده‌اش.

## 🧠 شخصیت
- صمیمی و حرفه‌ای
- عملگرا با پیشنهادات قابل اجرا
- صادق (نقاط ضعف + راهکار)
- مختصر (۲-۳ پاراگراف)

---

## ⚡ سیستم پیشنهاد و اجرای تغییرات

### مرحله ۱: پیشنهاد (بدون JSON)
وقتی پیشنهاد تغییری داری، به کاربر **به زبان ساده** بگو:
- چه چیزی میخوای تغییر بدی
- چرا این تغییر مفیده
- **بپرس آیا موافقه**

مثال ✅:
"پیشنهاد میکنم بودجه رو از ۵۰ میلیون به ۱۰۰ میلیون تغییر بدیم چون باید هزینه سرور و مارکتینگ رو هم حساب کنی. موافقی؟"

### مرحله ۲: تأیید کاربر
صبر کن تا کاربر بگه "بله"، "موافقم"، "اوکی"، "آره" یا مشابه.

### مرحله ۳: اجرا (با JSON سیستمی)
بعد از تأیید، پیامت باید شامل:
1. متن تأیید برای کاربر: "عالی! الان تغییر رو اعمال میکنم..."
2. بلوک JSON سیستمی (کاربر نمیبینه):

```__SYSTEM_ACTION__
{
  "action": "update_field",
  "field": "budget",
  "value": "۱۰۰ میلیون تومان"
}
```

3. پیام نهایی: "✅ بودجه با موفقیت به ۱۰۰ میلیون تومان تغییر کرد!"

---

## 📋 انواع اکشن‌های قابل اجرا

### تغییر فیلد اصلی
```__SYSTEM_ACTION__
{
  "action": "update_field",
  "field": "title|description|budget|execution_steps|required_skills|visibility",
  "value": "مقدار جدید"
}
```

### افزودن بلوک جدید
```__SYSTEM_ACTION__
{
  "action": "add_block",
  "block": {
    "type": "checklist|tags|progress|link|node_graph",
    "name": "نام بلوک",
    "value": "..."
  }
}
```

### ویرایش بلوک موجود
```__SYSTEM_ACTION__
{
  "action": "update_block",
  "block_index": 0,
  "value": "مقدار جدید"
}
```

### افزودن آیتم به چک‌لیست
```__SYSTEM_ACTION__
{
  "action": "add_checklist_item",
  "block_index": 0,
  "item": {"text": "کار جدید", "done": false}
}
```

### تغییر پیشرفت
```__SYSTEM_ACTION__
{
  "action": "update_block",
  "block_index": 0,
  "value": 75
}
```

### ساخت/ویرایش گراف نودی
```__SYSTEM_ACTION__
{
  "action": "add_block",
  "block": {
    "type": "node_graph",
    "name": "نقشه ایده",
    "value": {
      "nodes": [
        {"id": 1, "type": "idea", "label": "ایده اصلی", "x": 200, "y": 100, "color": "#6366f1"},
        {"id": 2, "type": "problem", "label": "مشکل", "x": 100, "y": 200, "color": "#ef4444"},
        {"id": 3, "type": "solution", "label": "راه‌حل", "x": 300, "y": 200, "color": "#10b981"}
      ],
      "edges": [
        {"from": 1, "to": 2},
        {"from": 2, "to": 3}
      ]
    }
  }
}
```

### افزودن نود به گراف موجود
```__SYSTEM_ACTION__
{
  "action": "add_graph_node",
  "block_index": 0,
  "node": {"id": 4, "type": "team", "label": "تیم فنی", "x": 400, "y": 150, "color": "#06b6d4"}
}
```

### اتصال نودها
```__SYSTEM_ACTION__
{
  "action": "add_graph_edge",
  "block_index": 0,
  "edge": {"from": 1, "to": 4}
}
```

### تغییرات دسته‌ای
```__SYSTEM_ACTION__
{
  "action": "batch_update",
  "updates": [
    {"field": "budget", "value": "۱۰۰ میلیون"},
    {"field": "required_skills", "value": "برنامه‌نویس فول‌استک، طراح UI/UX"}
  ]
}
```

---

## 🎨 انواع نود گراف
- `idea` (💡 ایده) - بنفش #6366f1
- `problem` (❗ مشکل) - قرمز #ef4444
- `solution` (✓ راه‌حل) - سبز #10b981
- `team` (👥 تیم) - فیروزه‌ای #06b6d4
- `user` (👤 کاربر) - بنفش روشن #8b5cf6
- `market` (🛒 بازار) - نارنجی #f59e0b
- `competitor` (👥+ رقیب) - صورتی #ec4899
- `tech` (⌨️ تکنولوژی) - آبی #3b82f6
- `feature` (⭐ ویژگی) - زرد #eab308
- `money` (💰 مالی) - سبز #22c55e
- `risk` (⚠️ ریسک) - نارنجی #f97316
- `goal` (🎯 هدف) - بنفش #a855f7
- `milestone` (🚩 مایلستون) - سبزآبی #14b8a6
- `resource` (📦 منبع) - خاکستری #64748b
- `note` (📝 یادداشت) - خاکستری روشن #94a3b8

---

## 🛡️ قوانین مهم

### ✅ باید:
- همیشه فارسی صحبت کن
- قبل از تغییر، توضیح بده و تأیید بگیر
- بعد از اجرا، فیدبک بده
- از ایموجی به اندازه استفاده کن
- پاسخ‌ها رو با Markdown فرمت کن

### ❌ نباید:
- JSON رو به کاربر نشون نده (فقط در بلوک __SYSTEM_ACTION__)
- بدون تأیید کاربر تغییر اعمال نکن
- اطلاعات غلط یا گمراه‌کننده نده
- قول موفقیت ۱۰۰٪ نده

### ⚠️ تشخیص تأیید کاربر:
کلمات تأیید: بله، آره، اوکی، موافقم، باشه، انجام بده، اعمال کن، تغییر بده
کلمات رد: نه، نمیخوام، بعداً، فعلاً نه، کنسل

---

## 💡 مثال مکالمه کامل:

**کاربر:** بودجه این ایده چقدر باید باشه؟

**آریا:** 
با توجه به ایده‌ات برای **MVP** به این منابع نیاز داری:

| آیتم | هزینه تقریبی |
|------|-------------|
| توسعه اپ | ۴۰-۶۰ میلیون |
| سرور (۶ ماه) | ۱۰ میلیون |
| مارکتینگ اولیه | ۲۰ میلیون |

**پیشنهاد:** بودجه رو روی **۸۰ تا ۱۲۰ میلیون تومان** تنظیم کنیم. موافقی؟

**کاربر:** آره موافقم

**آریا:**
عالی! الان بودجه رو تنظیم میکنم...

```__SYSTEM_ACTION__
{"action": "update_field", "field": "budget", "value": "۸۰ تا ۱۲۰ میلیون تومان"}
```

✅ **بودجه با موفقیت ثبت شد!** حالا ایده‌ات اطلاعات مالی هم داره.

میخوای یه چک‌لیست برای مراحل اجرا هم بسازم؟"""

    def __init__(self):
        self.api_key = config('GROQ_API_KEY', default='')
        self.model = config('GROQ_MODEL', default='llama-3.3-70b-versatile')
        self.api_url = 'https://api.groq.com/openai/v1/chat/completions'
    
    def build_idea_context(self, idea, chat_count=0):
        """ساخت context کامل از اطلاعات ایده شامل بلوک‌ها"""
        context = f"""
## 📌 اطلاعات ایده فعلی

**عنوان:** {idea.title}
**توضیحات:** {idea.description}
"""
        if idea.budget:
            context += f"**💰 بودجه:** {idea.budget}\n"
        else:
            context += "**💰 بودجه:** (تعیین نشده)\n"
            
        if idea.execution_steps:
            context += f"**📋 مراحل اجرا:** {idea.execution_steps}\n"
        else:
            context += "**📋 مراحل اجرا:** (تعیین نشده)\n"
            
        if idea.required_skills:
            context += f"**👥 تخصص‌ها:** {idea.required_skills}\n"
        else:
            context += "**👥 تخصص‌ها:** (تعیین نشده)\n"
            
        if idea.ai_score:
            context += f"**📊 امتیاز AI:** {idea.ai_score}/100\n"
        
        if idea.ai_feedback:
            context += f"\n**📝 بازخورد AI:**\n{idea.ai_feedback[:500]}...\n"
        
        # بلوک‌های پیشرفته
        if hasattr(idea, 'blocks') and idea.blocks:
            context += f"\n**🧩 بلوک‌های پیشرفته ({len(idea.blocks)} عدد):**\n"
            for idx, block in enumerate(idea.blocks):
                block_type = block.get('type', 'unknown')
                block_name = block.get('name', 'بدون نام')
                block_value = block.get('value', {})
                
                context += f"\n**[بلوک {idx}] {block_name}** (نوع: {block_type})\n"
                
                if block_type == 'checklist':
                    items = block_value if isinstance(block_value, list) else []
                    completed = len([i for i in items if i.get('done', False)])
                    context += f"تکمیل: {completed}/{len(items)}\n"
                    for item in items[:5]:
                        status = "✓" if item.get('done') else "○"
                        context += f"  {status} {item.get('text', '')}\n"
                
                elif block_type == 'tags':
                    tags = block_value if isinstance(block_value, list) else []
                    tag_texts = [t.get('text', '') for t in tags[:10]]
                    context += f"تگ‌ها: {', '.join(tag_texts)}\n"
                
                elif block_type == 'progress':
                    progress = block_value if isinstance(block_value, (int, float)) else 0
                    context += f"پیشرفت: {progress}%\n"
                
                elif block_type == 'link':
                    links = block_value if isinstance(block_value, list) else []
                    for link in links[:3]:
                        context += f"  - {link.get('title', link.get('url', ''))}\n"
                
                elif block_type == 'node_graph':
                    nodes = block_value.get('nodes', []) if isinstance(block_value, dict) else []
                    edges = block_value.get('edges', []) if isinstance(block_value, dict) else []
                    context += f"گراف: {len(nodes)} نود، {len(edges)} اتصال\n"
                    for node in nodes[:8]:
                        context += f"  - [{node.get('type', '?')}] {node.get('label', '')}\n"
        
        # فیلدهای سفارشی
        try:
            custom_fields = idea.custom_fields.all()
            if custom_fields:
                context += "\n**🎨 فیلدهای سفارشی:**\n"
                for field in custom_fields:
                    context += f"- **{field.name}** ({field.get_field_type_display()}): {field.value}\n"
        except:
            pass
        
        if chat_count > 0:
            context += f"\n**💬 تعداد پیام‌های قبلی:** {chat_count}\n"
        
        return context
    
    def chat(self, idea, messages_history, user_message):
        """
        چت با دستیار AI
        """
        if not self.api_key:
            return {
                'content': '⚠️ متأسفانه سرویس AI در دسترس نیست.',
                'error': 'API key not configured'
            }
        
        idea_context = self.build_idea_context(idea, len(messages_history))
        
        api_messages = [
            {
                'role': 'system',
                'content': self.SYSTEM_PROMPT + "\n\n---\n" + idea_context
            }
        ]
        
        # تاریخچه چت (حداکثر ۲۰ پیام آخر)
        for msg in messages_history[-20:]:
            api_messages.append({
                'role': msg['role'],
                'content': msg['content']
            })
        
        api_messages.append({
            'role': 'user',
            'content': user_message
        })
        
        try:
            response = requests.post(
                self.api_url,
                headers={
                    'Authorization': f'Bearer {self.api_key}',
                    'Content-Type': 'application/json'
                },
                json={
                    'model': self.model,
                    'messages': api_messages,
                    'temperature': 0.7,
                    'max_tokens': 2000,
                },
                timeout=60
            )
            
            response.raise_for_status()
            data = response.json()
            
            ai_response = data['choices'][0]['message']['content']
            
            # استخراج اکشن‌های سیستمی
            actions = self._extract_system_actions(ai_response)
            
            # پاکسازی پاسخ از بلوک‌های سیستمی (کاربر نباید ببینه)
            clean_content = self._clean_response(ai_response)
            
            return {
                'content': clean_content,
                'suggested_action': actions[0] if actions else None,
                'all_actions': actions
            }
            
        except requests.exceptions.RequestException as e:
            return {
                'content': '⚠️ خطا در ارتباط با سرور AI.',
                'error': str(e)
            }
        except Exception as e:
            return {
                'content': '⚠️ خطای غیرمنتظره‌ای رخ داد.',
                'error': str(e)
            }
    
    def _extract_system_actions(self, response_text):
        """استخراج اکشن‌های سیستمی از پاسخ AI"""
        actions = []
        try:
            # پیدا کردن بلوک‌های __SYSTEM_ACTION__
            pattern = r'```__SYSTEM_ACTION__\s*(\{[\s\S]*?\})\s*```'
            matches = re.findall(pattern, response_text, re.DOTALL)
            
            for match in matches:
                try:
                    action = json.loads(match.strip())
                    if 'action' in action:
                        actions.append(action)
                except json.JSONDecodeError:
                    continue
            
            # Fallback: بلوک JSON معمولی با action
            if not actions:
                json_pattern = r'```json\s*(\{[^`]+\})\s*```'
                json_matches = re.findall(json_pattern, response_text, re.DOTALL)
                for match in json_matches:
                    try:
                        action = json.loads(match)
                        if 'action' in action:
                            actions.append(action)
                    except json.JSONDecodeError:
                        continue
                        
        except Exception:
            pass
        
        return actions
    
    def _clean_response(self, response_text):
        """حذف بلوک‌های سیستمی از پاسخ (کاربر نباید ببینه)"""
        # حذف بلوک‌های __SYSTEM_ACTION__
        cleaned = re.sub(r'```__SYSTEM_ACTION__[\s\S]*?```', '', response_text)
        # حذف بلوک‌های json که action دارن
        cleaned = re.sub(r'```json\s*\{[^`]*"action"[^`]*\}\s*```', '', cleaned)
        # تمیز کردن خطوط خالی اضافی
        cleaned = re.sub(r'\n{3,}', '\n\n', cleaned)
        return cleaned.strip()
    
    def _update_idea_field(self, idea, field, value):
        """
        به روز رسانی یک فیلد ایده با هندل کردن موارد خاص مثل tags
        """
        if not hasattr(idea, field):
            return False

        # FIX: Handle 'tags' specifically to avoid "Direct assignment to the reverse side of a related set"
        if field == 'tags':
            # Convert value to tags block format
            tag_list = []
            if isinstance(value, list):
                tag_list = [{'text': str(v), 'colorIndex': i % 7} for i, v in enumerate(value)]
            elif isinstance(value, str):
                tag_list = [{'text': v.strip(), 'colorIndex': i % 7} for i, v in enumerate(value.split(',')) if v.strip()]
            
            # Find existing tags block or create new one
            tags_block = None
            if idea.blocks:
                for b in idea.blocks:
                    if b.get('type') == 'tags':
                        tags_block = b
                        break
            
            if tags_block:
                tags_block['value'] = tag_list
            else:
                if not idea.blocks:
                    idea.blocks = []
                idea.blocks.append({
                    "type": "tags",
                    "name": "برچسب‌ها",
                    "value": tag_list
                })
            return True # Handled specially
        
        # Normal field update
        setattr(idea, field, value)
        return True
    
    def apply_action(self, idea, action):
        """اعمال اکشن روی ایده"""
        action_type = action.get('action')
        
        try:
            if action_type == 'update_field':
                field = action.get('field')
                value = action.get('value')
                if self._update_idea_field(idea, field, value):
                    idea.save()
                    return {'success': True, 'message': f'فیلد {field} بروزرسانی شد'}
            
            elif action_type == 'add_block':
                block = action.get('block')
                if block:
                    if not idea.blocks:
                        idea.blocks = []
                    idea.blocks.append(block)
                    idea.save()
                    return {'success': True, 'message': f"بلوک «{block.get('name')}» اضافه شد"}
            
            elif action_type == 'update_block':
                block_index = action.get('block_index', 0)
                value = action.get('value')
                if idea.blocks and 0 <= block_index < len(idea.blocks):
                    idea.blocks[block_index]['value'] = value
                    idea.save()
                    return {'success': True, 'message': 'بلوک بروزرسانی شد'}
            
            elif action_type == 'add_checklist_item':
                block_index = action.get('block_index', 0)
                item = action.get('item')
                if idea.blocks and 0 <= block_index < len(idea.blocks):
                    block = idea.blocks[block_index]
                    if block.get('type') == 'checklist':
                        if not isinstance(block.get('value'), list):
                            block['value'] = []
                        block['value'].append(item)
                        idea.save()
                        return {'success': True, 'message': f"آیتم «{item.get('text')}» اضافه شد"}
            
            elif action_type == 'add_graph_node':
                block_index = action.get('block_index', 0)
                node = action.get('node')
                if idea.blocks and 0 <= block_index < len(idea.blocks):
                    block = idea.blocks[block_index]
                    if block.get('type') == 'node_graph':
                        if not block.get('value'):
                            block['value'] = {'nodes': [], 'edges': []}
                        block['value']['nodes'].append(node)
                        idea.save()
                        return {'success': True, 'message': f"نود «{node.get('label')}» اضافه شد"}
            
            elif action_type == 'add_graph_edge':
                block_index = action.get('block_index', 0)
                edge = action.get('edge')
                if idea.blocks and 0 <= block_index < len(idea.blocks):
                    block = idea.blocks[block_index]
                    if block.get('type') == 'node_graph':
                        if not block.get('value'):
                            block['value'] = {'nodes': [], 'edges': []}
                        block['value']['edges'].append(edge)
                        idea.save()
                        return {'success': True, 'message': 'اتصال اضافه شد'}
            
            elif action_type == 'batch_update':
                updates = action.get('updates', [])
                count = 0
                for update in updates:
                    field = update.get('field')
                    value = update.get('value')
                    if self._update_idea_field(idea, field, value):
                        count += 1
                idea.save()
                return {'success': True, 'message': f'{count} تغییر اعمال شد'}
            
            return {'success': False, 'message': 'اکشن نامعتبر'}
            
        except Exception as e:
            return {'success': False, 'message': str(e)}


# Singleton instance
chat_advisor = ChatAdvisor()
