import uuid
from django.db import models
from django.conf import settings

User = settings.AUTH_USER_MODEL

class QRCode(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)

    data = models.TextField(blank=True, null=True)  # for static QR
    qr_image = models.ImageField(upload_to="qr_codes/")

    is_dynamic = models.BooleanField(default=False)

    # NEW FIELDS 👇
    unique_id = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    redirect_url = models.URLField(blank=True, null=True)
    name = models.CharField(max_length=255, default='My QR Code', blank=True)
    
    # Color customization
    fill_color = models.CharField(max_length=7, default='#000000')  # QR code color (hex)
    back_color = models.CharField(max_length=7, default='#FFFFFF')  # Background color (hex)
    
    # Analytics
    scan_count = models.IntegerField(default=0)
    last_scanned_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user} - {self.unique_id}"


class QRScan(models.Model):
    """Track each scan of a dynamic QR code"""
    qr = models.ForeignKey(QRCode, on_delete=models.CASCADE, related_name='scans')
    
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    country = models.CharField(max_length=100, null=True, blank=True)
    device = models.CharField(max_length=50, null=True, blank=True)  # mobile, desktop, tablet
    browser = models.CharField(max_length=50, null=True, blank=True)
    
    scanned_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.qr.unique_id} - {self.scanned_at}"
    
    class Meta:
        ordering = ['-scanned_at']