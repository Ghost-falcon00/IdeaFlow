"""
Support Models - مدل‌های پشتیبانی و تیکتینگ
"""

from django.db import models
from django.conf import settings

class SupportTicket(models.Model):
    class Status(models.TextChoices):
        OPEN = 'open', 'باز'
        ANSWERED = 'answered', 'پاسخ داده شده'
        CLOSED = 'closed', 'بسته شده'
        
    class Priority(models.TextChoices):
        LOW = 'low', 'کم'
        MEDIUM = 'medium', 'متوسط'
        HIGH = 'high', 'زیاد'
        
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='tickets',
        verbose_name='کاربر'
    )
    subject = models.CharField(max_length=200, verbose_name='موضوع')
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.OPEN,
        verbose_name='وضعیت'
    )
    priority = models.CharField(
        max_length=20,
        choices=Priority.choices,
        default=Priority.MEDIUM,
        verbose_name='اولویت'
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='تاریخ ایجاد')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='آخرین بروزرسانی')
    
    class Meta:
        verbose_name = 'تیکت پشتیبانی'
        verbose_name_plural = 'تیکت‌های پشتیبانی'
        ordering = ['-updated_at']
        
    def __str__(self):
        return f"{self.subject} ({self.get_status_display()})"


class TicketMessage(models.Model):
    ticket = models.ForeignKey(
        SupportTicket,
        on_delete=models.CASCADE,
        related_name='messages',
        verbose_name='تیکت'
    )
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        verbose_name='فرستنده'
    )
    content = models.TextField(verbose_name='پيام')
    attachment = models.FileField(
        upload_to='ticket_attachments/',
        null=True,
        blank=True,
        verbose_name='فایل ضمیمه'
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='تاریخ ارسال')
    
    class Meta:
        verbose_name = 'پیام تیکت'
        verbose_name_plural = 'پیام‌های تیکت'
        ordering = ['created_at']
        
    def __str__(self):
        return f"{self.sender}: {self.content[:30]}..."
