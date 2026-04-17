from rest_framework import serializers
from .models import QRCode, QRScan

class QRCodeSerializer(serializers.ModelSerializer):

    class Meta:
        model = QRCode
        fields = '__all__'
        read_only_fields = ['user', 'qr_image', 'created_at', 'unique_id', 'scan_count', 'last_scanned_at']


class QRScanSerializer(serializers.ModelSerializer):

    class Meta:
        model = QRScan
        fields = '__all__'
        read_only_fields = ['scanned_at']