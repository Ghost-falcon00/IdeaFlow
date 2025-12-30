"""
AI Service - سرویس هوش مصنوعی برای امتیازدهی ایده
با استفاده از Groq API
"""

import json
import re
import requests
from django.conf import settings
from decouple import config


class IdeaAnalyzer:
    """
    AI Agent برای تحلیل و امتیازدهی ایده‌ها
    """
    
    SYSTEM_PROMPT = """تو یک سرمایه‌گذار خطرپذیر (Venture Capitalist) بسیار سخت‌گیر، دقیق و بی‌رحم هستی. وظیفه تو این است که ایده‌های استارتاپی را برای سرمایه‌گذاری احتمالی ارزیابی کنی.

### اصول ارزیابی تو:
1. **بی‌رحم باش**: هیچ ارفاقی نکن. اکثر استارتاپ‌ها شکست می‌خورند، پس باید سخت‌گیر باشی.
2. **شفافیت**: اگر ایده‌ای گنگ، کلی یا بی‌معنی است، صریحاً بگو و امتیاز 0 بده.
3. **تشخیص تقلب**: در صورت امتیازدهی مجدد، اگر کاربر سعی کرده با تغییر کامل ایده سیستم را فریب دهد، شدیداً جریمه کن.

### سناریوی امتیازدهی مجدد (Re-Scoring Rules):
اگر کاربر ایده را ویرایش کرده و درخواست امتیاز مجدد دارد، متن جدید را با متن قبلی (که در پرامپت می‌آید) مقایسه کن:
1. **تغییر ماهیت (Cheat Detection)**: اگر ایده کاملاً عوض شده (مثلاً از "نانوایی" به "هوش مصنوعی" تبدیل شده)، این تقلب است. **امتیاز کل را 0 بده** و در فیدبک بنویس: "تغییر کامل ماهیت ایده در ویرایش مجاز نیست. لطفاً ایده جدید ثبت کنید."
2. **تغییرات جزئی**: اگر فقط چند کلمه تغییر کرده و ارزش افزوده‌ای ایجاد نشده، امتیاز را تغییر نده یا حتی کم کن.
3. **بهبود واقعی**: تنها در صورتی امتیاز را بالا ببر که استراتژی، مدل درآمدی یا جزئیات فنی واقعاً شفاف‌تر و پخته‌تر شده باشند.

### معیارهای "امتیاز صفر" (Kill Switch):
در موارد زیر، بدون بررسی سایر معیارها، **امتیاز کل را 0 بده**:
- ایده کمتر از ۳ جمله باشد یا توضیحات کافی نداشته باشد.
- ایده نامفهوم، بی‌معنی یا اسپم باشد.
- ایده کپی‌برداری آشکار از سرویس‌های مشهور باشد (بدون هیچ نوآوری).

### معیارهای امتیازدهی (اگر از فیلترهای بالا رد شد): (0 تا 20 برای هر کدام)
1. **نوآوری (Innovation)**: چقدر منحصربه‌فرد است؟ (ایده‌های تکراری = امتیاز زیر 5)
2. **قابلیت اجرا (Feasibility)**: آیا با تکنولوژی امروز شدنی است؟ تیم فنی می‌خواهد؟
3. **پتانسیل بازار (Market Potential)**: آیا مشتری حاضر است پول بدهد؟ اندازه بازار چقدر است؟
4. **تأثیرگذاری (Impact)**: مقیاس‌پذیری و اثر آن چقدر است؟
5. **مزیت رقابتی (Competitive Advantage)**: چرا گوگل یا آمازون نمی‌توانند فردا همین را بسازند؟

### فرمت خروجی (فقط JSON معتبر):
```json
{
  "scores": {
    "innovation": <0-20>,
    "feasibility": <0-20>,
    "market_potential": <0-20>,
    "impact": <0-20>,
    "competitive_advantage": <0-20>
  },
  "total_score": <0-100>,
  "feedback": {
    "strengths": ["نقطه قوت 1 (اگر وجود دارد)"],
    "weaknesses": ["نقطه ضعف مهم 1", "نقطه ضعف مهم 2"],
    "suggestions": ["پیشنهاد عملی و انتقادی 1"],
    "comparison": "تحلیل صریح تغییرات نسبت به نسخه قبل (فقط در امتیازدهی مجدد)"
  },
  "summary": "یک جمله بی‌رحمانه و دقیق درباره کلیت ایده",
  "verdict": "عالی|خوب|متوسط|نیاز به تلاش بیشتر|ضعیف|تقلب/اسپم"
}
```

### قوانین مهم:
1. همیشه فارسی پاسخ بده
2. فقط JSON خالص برگردان
3. امتیازدهی منصفانه و سخت‌گیرانه باشد
4. اگر تقلب تشخیص دادی، total_score = 0"""

    def __init__(self):
        self.api_key = config('GROQ_API_KEY', default='')
        self.model = config('GROQ_MODEL', default='llama-3.3-70b-versatile')
        self.api_url = 'https://api.groq.com/openai/v1/chat/completions'
    
    def analyze_idea(self, title: str, description: str, category: str = None, 
                    previous_description: str = None, previous_score: float = None,
                    blocks: list = None, budget: str = None, 
                    execution_steps: str = None, required_skills: str = None) -> dict:
        """
        تحلیل و امتیازدهی یک ایده به همراه جزئیات پیشرفته
        """
        if not self.api_key:
            return {
                'error': 'Groq API key not configured',
                'total_score': 0
            }
        
        # ساخت پرامپت کاربر
        user_prompt = f"""لطفاً این ایده رو تحلیل و امتیازدهی کن:

**عنوان ایده:** {title}

**توضیحات فعلی:** {description}

**دسته‌بندی:** {category or 'مشخص نشده'}"""

        # Add advanced fields if present
        if budget:
            user_prompt += f"\n\n**بودجه تقریبی:** {budget}"
        
        if execution_steps:
            user_prompt += f"\n\n**مراحل اجرا:** {execution_steps}"
        
        if required_skills:
            user_prompt += f"\n\n**تخصص‌های مورد نیاز:** {required_skills}"

        # Add blocks information
        if blocks and len(blocks) > 0:
            user_prompt += "\n\n**بلوک‌های پیشرفته ایده:**"
            for block in blocks:
                block_type = block.get('type', 'unknown')
                block_name = block.get('name', 'بدون نام')
                block_value = block.get('value', {})
                
                if block_type == 'checklist':
                    items = block_value if isinstance(block_value, list) else []
                    completed = len([i for i in items if i.get('done', False)])
                    user_prompt += f"\n- چک‌لیست «{block_name}»: {completed}/{len(items)} تکمیل"
                    for item in items[:5]:  # Max 5 items
                        status = "✓" if item.get('done') else "○"
                        user_prompt += f"\n  {status} {item.get('text', '')}"
                
                elif block_type == 'tags':
                    tags = block_value if isinstance(block_value, list) else []
                    user_prompt += f"\n- تگ‌های «{block_name}»: {', '.join([t.get('text', '') for t in tags[:10]])}"
                
                elif block_type == 'progress':
                    progress = block_value if isinstance(block_value, (int, float)) else 0
                    user_prompt += f"\n- پیشرفت «{block_name}»: {progress}%"
                
                elif block_type == 'link':
                    links = block_value if isinstance(block_value, list) else []
                    user_prompt += f"\n- لینک‌های «{block_name}»:"
                    for link in links[:3]:  # Max 3 links
                        user_prompt += f"\n  - {link.get('title', link.get('url', ''))}"
                
                elif block_type == 'node_graph':
                    nodes = block_value.get('nodes', []) if isinstance(block_value, dict) else []
                    edges = block_value.get('edges', []) if isinstance(block_value, dict) else []
                    user_prompt += f"\n- گراف نودی «{block_name}»: {len(nodes)} نود، {len(edges)} اتصال"
                    for node in nodes[:5]:  # Max 5 nodes
                        user_prompt += f"\n  - {node.get('type', '?')}: {node.get('label', '')}"

        if previous_description:
            user_prompt += f"""

---
**اطلاعات نسخه قبلی (برای مقایسه):**
**توضیحات قبلی:** {previous_description}
**امتیاز قبلی:** {previous_score}

لطفاً تغییرات را بررسی کن. اگر ماهیت ایده کاملاً عوض شده، امتیاز 0 بده. اگر بهبود یافته، امتیاز را متناسب افزایش بده.
"""

        user_prompt += "\nJSON خروجی:"

        try:
            response = requests.post(
                self.api_url,
                headers={
                    'Authorization': f'Bearer {self.api_key}',
                    'Content-Type': 'application/json'
                },
                json={
                    'model': self.model,
                    'messages': [
                        {'role': 'system', 'content': self.SYSTEM_PROMPT},
                        {'role': 'user', 'content': user_prompt}
                    ],
                    'temperature': 0.3, # Less random for consistent scoring
                    'max_tokens': 2000,
                    'response_format': {'type': 'json_object'}
                },
                timeout=60
            )
            
            response.raise_for_status()
            data = response.json()
            
            # استخراج پاسخ AI
            ai_response = data['choices'][0]['message']['content']
            
            # پارس JSON
            result = json.loads(ai_response)
            
            # اطمینان از وجود فیلدهای ضروری
            if 'total_score' not in result:
                scores = result.get('scores', {})
                result['total_score'] = sum(scores.values())
            
            return result
            
        except requests.exceptions.RequestException as e:
            return {
                'error': f'API request failed: {str(e)}',
                'total_score': 0
            }
        except json.JSONDecodeError as e:
            return {
                'error': f'Invalid JSON response: {str(e)}',
                'total_score': 0
            }
        except Exception as e:
            return {
                'error': f'Analysis failed: {str(e)}',
                'total_score': 0
            }


# Singleton instance
idea_analyzer = IdeaAnalyzer()
