"""
Ideas Models - مدل‌های ایده‌ها
"""

from django.db import models
from django.conf import settings


class Category(models.Model):
    """
    دسته‌بندی ایده‌ها (اختیاری - قابل توسعه)
    """
    name = models.CharField(max_length=100, verbose_name='نام دسته')
    slug = models.SlugField(unique=True, allow_unicode=True)
    icon = models.CharField(max_length=50, blank=True, verbose_name='آیکون')
    
    class Meta:
        verbose_name = 'دسته‌بندی'
        verbose_name_plural = 'دسته‌بندی‌ها'
    
    def __str__(self):
        return self.name


class Idea(models.Model):
    """
    مدل اصلی ایده‌ها
    """
    
    class VisibilityChoices(models.TextChoices):
        PUBLIC = 'public', 'عمومی'
        PRIVATE = 'private', 'خصوصی'
    
    # Relations
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='ideas',
        verbose_name='کاربر'
    )
    category = models.ForeignKey(
        Category,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='ideas',
        verbose_name='دسته‌بندی'
    )
    
    # Content
    title = models.CharField(max_length=200, verbose_name='عنوان')
    description = models.TextField(verbose_name='توضیحات')
    
    # Enhanced Fields (Phase 2)
    budget = models.CharField(
        max_length=100, 
        blank=True,
        verbose_name='بودجه تقریبی',
        help_text='مثال: ۵۰ تا ۱۰۰ میلیون تومان'
    )
    execution_steps = models.TextField(
        blank=True,
        verbose_name='مراحل اجرا',
        help_text='توضیح مراحل پیاده‌سازی ایده'
    )
    required_skills = models.TextField(
        blank=True,
        verbose_name='تخصص‌های مورد نیاز',
        help_text='تخصص‌ها و مهارت‌های لازم برای اجرا'
    )
    
    # Advanced Blocks (Phase 2.2 - Block Builder Pro)
    # Store blocks as JSON array:
    # [{"type": "checklist", "name": "کارها", "value": [{"text": "...", "done": true}]}, ...]
    # Block types: checklist, tags, progress, link, node_graph
    blocks = models.JSONField(
        default=list,
        blank=True,
        verbose_name='بلوک‌های پیشرفته',
        help_text='''
        JSON array of blocks. Each block has:
        - type: checklist | tags | progress | link | node_graph
        - name: string (display name)
        - value: varies by type
          - checklist: [{text, done}, ...]
          - tags: [{text, color}, ...]
          - progress: number (0-100)
          - link: [{url, title}, ...]
          - node_graph: {nodes: [{id, type, label, x, y, color}], edges: [{from, to}]}
        '''
    )
    
    # AI Analysis
    ai_score = models.FloatField(
        null=True, 
        blank=True,
        verbose_name='امتیاز هوش مصنوعی',
        help_text='امتیاز از 0 تا 100'
    )
    last_scored_description = models.TextField(
        blank=True,
        verbose_name='توضیحات در زمان آخرین امتیازدهی'
    )
    ai_feedback = models.TextField(
        blank=True,
        verbose_name='بازخورد هوش مصنوعی'
    )
    similar_count = models.PositiveIntegerField(
        default=0,
        verbose_name='تعداد ایده‌های مشابه'
    )
    
    # Limits
    scoring_count = models.PositiveIntegerField(
        default=0,
        verbose_name='تعداد امتیازگیری'
    )
    edit_count = models.PositiveIntegerField(
        default=0,
        verbose_name='تعداد ویرایش'
    )
    MAX_SCORING_ATTEMPTS = 3
    MAX_EDIT_ATTEMPTS = 3
    
    # Settings
    visibility = models.CharField(
        max_length=10,
        choices=VisibilityChoices.choices,
        default=VisibilityChoices.PUBLIC,
        verbose_name='وضعیت نمایش'
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='تاریخ ثبت')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='آخرین ویرایش')
    
    class Meta:
        verbose_name = 'ایده'
        verbose_name_plural = 'ایده‌ها'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['-created_at']),
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['visibility']),
        ]
    
    def __str__(self):
        return f"{self.title[:50]}..."
    
    @property
    def is_public(self):
        return self.visibility == self.VisibilityChoices.PUBLIC


class IdeaTag(models.Model):
    """
    تگ‌های ایده‌ها (برای توسعه آینده)
    """
    idea = models.ForeignKey(
        Idea,
        on_delete=models.CASCADE,
        related_name='tags'
    )
    name = models.CharField(max_length=50, verbose_name='تگ')
    
    class Meta:
        verbose_name = 'تگ'
        verbose_name_plural = 'تگ‌ها'
        unique_together = ['idea', 'name']
    
    def __str__(self):
        return self.name


class IdeaCustomField(models.Model):
    """
    فیلدهای سفارشی ایده‌ها - کاربر می‌تواند فیلد دلخواه بسازد
    """
    class FieldType(models.TextChoices):
        TEXT = 'text', 'متنی'
        TEXTAREA = 'textarea', 'متن بلند'
        CHECKBOX = 'checkbox', 'چک‌باکس'
        CHECKLIST = 'checklist', 'چک‌لیست'
        SELECT = 'select', 'انتخابی'
        NUMBER = 'number', 'عددی'
    
    idea = models.ForeignKey(
        Idea,
        on_delete=models.CASCADE,
        related_name='custom_fields',
        verbose_name='ایده'
    )
    name = models.CharField(max_length=100, verbose_name='نام فیلد')
    field_type = models.CharField(
        max_length=20,
        choices=FieldType.choices,
        default=FieldType.TEXT,
        verbose_name='نوع فیلد'
    )
    value = models.TextField(
        blank=True,
        verbose_name='مقدار',
        help_text='برای چک‌لیست و انتخابی از JSON استفاده کنید'
    )
    options = models.TextField(
        blank=True,
        verbose_name='گزینه‌ها',
        help_text='برای فیلد انتخابی - JSON array'
    )
    order = models.PositiveIntegerField(default=0, verbose_name='ترتیب')
    
    class Meta:
        verbose_name = 'فیلد سفارشی'
        verbose_name_plural = 'فیلدهای سفارشی'
        ordering = ['order', 'id']
    
    def __str__(self):
        return f"{self.name} ({self.idea.title[:20]})"


class ChatSession(models.Model):
    """
    جلسه چت با مشاور AI برای هر ایده
    """
    idea = models.ForeignKey(
        Idea,
        on_delete=models.CASCADE,
        related_name='chat_sessions',
        verbose_name='ایده'
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='تاریخ شروع')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='آخرین بروزرسانی')
    is_active = models.BooleanField(default=True, verbose_name='فعال')
    
    class Meta:
        verbose_name = 'جلسه چت'
        verbose_name_plural = 'جلسات چت'
        ordering = ['-updated_at']
    
    def __str__(self):
        return f"چت: {self.idea.title[:30]} ({self.created_at.strftime('%Y-%m-%d')})"
    
    @property
    def message_count(self):
        return self.messages.count()


class ChatMessage(models.Model):
    """
    پیام‌های چت با مشاور AI
    """
    class Role(models.TextChoices):
        USER = 'user', 'کاربر'
        ASSISTANT = 'assistant', 'مشاور AI'
        SYSTEM = 'system', 'سیستم'
    
    session = models.ForeignKey(
        ChatSession,
        on_delete=models.CASCADE,
        related_name='messages',
        verbose_name='جلسه'
    )
    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        verbose_name='نقش'
    )
    content = models.TextField(verbose_name='محتوا')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='تاریخ')
    
    # برای اکشن‌های پیشنهادی AI (تغییر فیلدها)
    suggested_action = models.JSONField(
        null=True,
        blank=True,
        verbose_name='اکشن پیشنهادی',
        help_text='JSON containing action type and data'
    )
    
    class Meta:
        verbose_name = 'پیام چت'
        verbose_name_plural = 'پیام‌های چت'
        ordering = ['created_at']
    
    def __str__(self):
        return f"{self.get_role_display()}: {self.content[:50]}..."


# ========== Marketplace Models ==========

class Comment(models.Model):
    """
    کامنت‌های ایده‌ها - با قابلیت ریپلای
    """
    idea = models.ForeignKey(
        Idea,
        on_delete=models.CASCADE,
        related_name='comments',
        verbose_name='ایده'
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='comments',
        verbose_name='کاربر'
    )
    parent = models.ForeignKey(
        'self',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='replies',
        verbose_name='پاسخ به'
    )
    content = models.TextField(verbose_name='محتوا', max_length=2000)
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='تاریخ')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='ویرایش')
    is_edited = models.BooleanField(default=False, verbose_name='ویرایش شده')
    
    class Meta:
        verbose_name = 'کامنت'
        verbose_name_plural = 'کامنت‌ها'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.email}: {self.content[:30]}..."


class IdeaStar(models.Model):
    """
    ستاره‌دهی (لایک) ایده‌ها
    """
    idea = models.ForeignKey(
        Idea,
        on_delete=models.CASCADE,
        related_name='stars',
        verbose_name='ایده'
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='starred_ideas',
        verbose_name='کاربر'
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='تاریخ')
    
    class Meta:
        verbose_name = 'ستاره'
        verbose_name_plural = 'ستاره‌ها'
        unique_together = ['idea', 'user']
    
    def __str__(self):
        return f"{self.user.email} ⭐ {self.idea.title[:30]}"


class InvestmentRequest(models.Model):
    """
    درخواست سرمایه‌گذاری یا خرید ایده
    """
    class RequestType(models.TextChoices):
        INVESTMENT = 'investment', 'سرمایه‌گذاری شراکتی'
        PURCHASE = 'purchase', 'خرید کامل'
    
    class Status(models.TextChoices):
        PENDING = 'pending', 'در انتظار'
        ACCEPTED = 'accepted', 'پذیرفته شده'
        REJECTED = 'rejected', 'رد شده'
        IN_NEGOTIATION = 'negotiation', 'در حال مذاکره'
        COMPLETED = 'completed', 'تکمیل شده'
    
    idea = models.ForeignKey(
        Idea,
        on_delete=models.CASCADE,
        related_name='investment_requests',
        verbose_name='ایده'
    )
    investor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='investment_requests_sent',
        verbose_name='سرمایه‌گذار'
    )
    request_type = models.CharField(
        max_length=20,
        choices=RequestType.choices,
        verbose_name='نوع درخواست'
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
        verbose_name='وضعیت'
    )
    amount = models.CharField(
        max_length=100,
        blank=True,
        verbose_name='مبلغ پیشنهادی'
    )
    share_percentage = models.PositiveIntegerField(
        null=True,
        blank=True,
        verbose_name='درصد شراکت',
        help_text='برای سرمایه‌گذاری شراکتی'
    )
    message = models.TextField(
        blank=True,
        verbose_name='پیام',
        help_text='توضیحات اولیه سرمایه‌گذار'
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='تاریخ')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='بروزرسانی')
    
    class Meta:
        verbose_name = 'درخواست سرمایه‌گذاری'
        verbose_name_plural = 'درخواست‌های سرمایه‌گذاری'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.investor.email} → {self.idea.title[:20]} ({self.get_status_display()})"


class InvestmentMessage(models.Model):
    """
    پیام‌های چت بین سرمایه‌گذار و ایده‌پرداز
    """
    request = models.ForeignKey(
        InvestmentRequest,
        on_delete=models.CASCADE,
        related_name='messages',
        verbose_name='درخواست'
    )
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        verbose_name='فرستنده'
    )
    content = models.TextField(verbose_name='محتوا', max_length=2000)
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='تاریخ')
    is_read = models.BooleanField(default=False, verbose_name='خوانده شده')
    
    class Meta:
        verbose_name = 'پیام مذاکره'
        verbose_name_plural = 'پیام‌های مذاکره'
        ordering = ['created_at']
    
    def __str__(self):
        return f"{self.sender.email}: {self.content[:30]}..."


class DuplicateReport(models.Model):
    """
    گزارش ایده تکراری
    """
    class Status(models.TextChoices):
        PENDING = 'pending', 'در انتظار بررسی'
        CONFIRMED = 'confirmed', 'تایید شده (تکراری)'
        REJECTED = 'rejected', 'رد شده'
    
    reported_idea = models.ForeignKey(
        Idea,
        on_delete=models.CASCADE,
        related_name='duplicate_reports',
        verbose_name='ایده گزارش‌شده'
    )
    original_idea = models.ForeignKey(
        Idea,
        on_delete=models.CASCADE,
        related_name='original_for_reports',
        verbose_name='ایده اصلی'
    )
    reporter = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        verbose_name='گزارش‌دهنده'
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
        verbose_name='وضعیت'
    )
    ai_similarity_score = models.PositiveIntegerField(
        null=True,
        blank=True,
        verbose_name='درصد شباهت AI'
    )
    ai_analysis = models.TextField(
        blank=True,
        verbose_name='تحلیل AI'
    )
    admin_notes = models.TextField(
        blank=True,
        verbose_name='یادداشت ادمین'
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='تاریخ')
    resolved_at = models.DateTimeField(null=True, blank=True, verbose_name='تاریخ بررسی')
    
    class Meta:
        verbose_name = 'گزارش تکراری'
        verbose_name_plural = 'گزارش‌های تکراری'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Report: {self.reported_idea.title[:20]} vs {self.original_idea.title[:20]}"
