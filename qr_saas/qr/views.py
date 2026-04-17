from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.core.paginator import Paginator
from django.core.files.base import ContentFile
from django.shortcuts import get_object_or_404, redirect
from django.http import HttpResponse
from django.urls import reverse
from django.core.validators import URLValidator
from django.core.exceptions import ValidationError
from django.utils import timezone
from django.conf import settings
from urllib.parse import urlparse, urlunparse
from user_agents import parse
import socket

import uuid

from .models import QRCode, QRScan
from .serializers import QRCodeSerializer
from .utils import generate_qr


def get_client_ip(request):
    """Extract client IP address from request"""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip


def parse_user_agent(user_agent_string):
    """Parse user agent to extract device and browser info"""
    try:
        ua = parse(user_agent_string)
        device = 'mobile' if ua.is_mobile else ('tablet' if ua.is_tablet else 'desktop')
        browser = ua.browser.family
        return device, browser
    except:
        return 'unknown', 'unknown'


def get_local_ip():
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
            s.connect(('8.8.8.8', 80))
            local_ip = s.getsockname()[0]
            return local_ip
    except Exception:
        return None


def normalize_redirect_target(request, redirect_url):
    """Normalize redirect URLs and rewrite localhost to LAN IP for remote scans."""
    if not redirect_url:
        return redirect_url

    redirect_url = redirect_url.strip()

    # Automatically add scheme for local host URLs when missing
    if redirect_url.startswith('localhost:') or redirect_url.startswith('127.0.0.1:'):
        redirect_url = f'http://{redirect_url}'

    parsed = urlparse(redirect_url)
    if not parsed.scheme:
        redirect_url = f'http://{redirect_url}'
        parsed = urlparse(redirect_url)

    if parsed.hostname in ('localhost', '127.0.0.1'):
        requester_ip = request.META.get('REMOTE_ADDR', '')
        if requester_ip and requester_ip not in ('127.0.0.1', '::1'):
            local_ip = get_local_ip() or requester_ip
            parsed = parsed._replace(netloc=f'{local_ip}:{parsed.port}' if parsed.port else local_ip)
            return urlunparse(parsed)

    return redirect_url


def get_qr_base_url(request):
    """Return a friendly public base URL for QR redirect generation."""
    if settings.QR_BASE_URL:
        return settings.QR_BASE_URL

    # Try to get from request headers
    origin = request.headers.get('Origin')
    referer = request.headers.get('Referer')
    
    if origin:
        parsed = urlparse(origin)
        host = parsed.hostname
        scheme = parsed.scheme or 'http'
        backend_port = settings.QR_BACKEND_PORT
        
        if host in ('127.0.0.1', 'localhost'):
            # For localhost, try to get the actual IP
            local_ip = get_local_ip() or '127.0.0.1'
            return f"{scheme}://{local_ip}:{backend_port}" if backend_port else f"{scheme}://{local_ip}"
        elif host:
            return f"{scheme}://{host}:{backend_port}" if backend_port else f"{scheme}://{host}"
    
    if referer:
        parsed = urlparse(referer)
        host = parsed.hostname
        scheme = parsed.scheme or 'http'
        backend_port = settings.QR_BACKEND_PORT
        
        if host in ('127.0.0.1', 'localhost'):
            local_ip = get_local_ip() or '127.0.0.1'
            return f"{scheme}://{local_ip}:{backend_port}" if backend_port else f"{scheme}://{local_ip}"
        elif host:
            return f"{scheme}://{host}:{backend_port}" if backend_port else f"{scheme}://{host}"
    
    # Fallback to request's base URL
    local_ip = get_local_ip()
    if local_ip:
        backend_port = settings.QR_BACKEND_PORT
        return f"http://{local_ip}:{backend_port}" if backend_port else f"http://{local_ip}"

    return request.build_absolute_uri('/').rstrip('/')


def build_redirect_path(request, unique_id):
    base_url = get_qr_base_url(request)
    redirect_suffix = reverse('redirect-qr', args=[str(unique_id)])
    # Ensure the /api prefix is included in the path
    if not redirect_suffix.startswith('/api'):
        redirect_suffix = f"/api{redirect_suffix}"
    return f"{base_url}{redirect_suffix}"


# 🔹 STATIC QR CREATE
class CreateStaticQRView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        data = request.data.get('data')
        name = request.data.get('name', 'My QR Code')

        if not data:
            return Response({"error": "Data is required"}, status=400)

        qr_buffer = generate_qr(data)
        file_name = f"{uuid.uuid4()}.png"

        qr_instance = QRCode.objects.create(
            user=request.user,
            data=data,
            name=name
        )

        qr_instance.qr_image.save(
            file_name,
            ContentFile(qr_buffer.getvalue()),
            save=True
        )

        return Response(QRCodeSerializer(qr_instance).data, status=201)


# 🔹 LIST QR
class QRListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qr_codes = QRCode.objects.filter(user=request.user).order_by('-created_at')
        serializer = QRCodeSerializer(qr_codes, many=True)
        return Response(serializer.data)


# 🔹 DELETE QR (single clean version)
class QRDeleteView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):
        qr = get_object_or_404(QRCode, id=pk, user=request.user)
        qr.delete()
        return Response({"message": "Deleted successfully"}, status=204)


# 🔹 CREATE DYNAMIC QR (PRO ONLY + VALIDATION)
class CreateDynamicQRView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):

        # ✅ PRO CHECK
        if not request.user.is_pro:
            return Response({"error": "Upgrade to PRO"}, status=403)

        redirect_url = request.data.get('redirect_url')

        if not redirect_url:
            return Response({"error": "Redirect URL required"}, status=400)

        # ✅ URL VALIDATION (support localhost and external URLs)
        validator = URLValidator()
        try:
            # For localhost URLs, add http:// if missing
            if redirect_url.startswith('localhost:') or redirect_url.startswith('127.0.0.1:'):
                redirect_url = f'http://{redirect_url}'
            validator(redirect_url)
        except ValidationError:
            return Response({"error": "Invalid URL format. Use http://localhost:3000 or https://example.com"}, status=400)

        fill_color = request.data.get('fill_color', '#000000')
        back_color = request.data.get('back_color', '#FFFFFF')
        name = request.data.get('name', 'My QR Code')

        qr_instance = QRCode.objects.create(
            user=request.user,
            is_dynamic=True,
            redirect_url=redirect_url,
            fill_color=fill_color,
            back_color=back_color,
            name=name
        )

        redirect_path = build_redirect_path(request, qr_instance.unique_id)

        qr_buffer = generate_qr(redirect_path, fill_color=fill_color, back_color=back_color)
        file_name = f"{uuid.uuid4()}.png"

        qr_instance.qr_image.save(
            file_name,
            ContentFile(qr_buffer.getvalue()),
            save=True
        )

        return Response(QRCodeSerializer(qr_instance).data, status=201)


# 🔹 REDIRECT VIEW (CORE LOGIC)
def redirect_qr(request, unique_id):
    import logging
    logger = logging.getLogger(__name__)
    
    try:
        logger.info(f"QR Redirect request for UUID: {unique_id}")
        logger.info(f"Request headers: Origin={request.headers.get('Origin')}, Referer={request.headers.get('Referer')}, User-Agent={request.META.get('HTTP_USER_AGENT')}")
        
        qr = get_object_or_404(QRCode, unique_id=unique_id, is_dynamic=True)
        logger.info(f"QR found - ID: {qr.id}, is_dynamic: {qr.is_dynamic}, redirect_url: {qr.redirect_url}")
        
        # Check if redirect_url exists
        if not qr.redirect_url:
            logger.error(f"QR Code {unique_id} has no redirect_url set!")
            return HttpResponse("QR code has no target URL configured", status=400)
        
        # Track the scan
        user_agent = request.META.get('HTTP_USER_AGENT', 'unknown')
        device, browser = parse_user_agent(user_agent)
        ip_address = get_client_ip(request)
        
        scan = QRScan.objects.create(
            qr=qr,
            ip_address=ip_address,
            device=device,
            browser=browser
        )
        logger.info(f"Scan recorded - Device: {device}, Browser: {browser}, IP: {ip_address}")
        
        # Update scan count and last scanned time
        qr.scan_count += 1
        qr.last_scanned_at = timezone.now()
        qr.save()
        
        target_url = normalize_redirect_target(request, qr.redirect_url)
        logger.info(f"Redirecting to: {target_url}")
        
        # Check if this is a browser request (has Accept header with text/html)
        accept_header = request.META.get('HTTP_ACCEPT', '')
        user_agent = request.META.get('HTTP_USER_AGENT', '').lower()
        
        # If it's a browser, send an HTML page with JavaScript redirect as fallback
        if 'text/html' in accept_header or 'browser' in user_agent or 'mozilla' in user_agent:
            html_response = f'''<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="refresh" content="0; url={target_url}">
    <title>Redirecting...</title>
    <style>
        body {{
            font-family: Arial, sans-serif;
            text-align: center;
            padding: 50px;
            background: #f5f5f5;
        }}
        .redirect-msg {{
            background: white;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            display: inline-block;
        }}
        a {{
            color: #007bff;
            text-decoration: none;
        }}
        a:hover {{
            text-decoration: underline;
        }}
    </style>
</head>
<body>
    <div class="redirect-msg">
        <h2>🔄 Redirecting...</h2>
        <p>If you are not automatically redirected, <a href="{target_url}">click here</a>.</p>
        <p><small>Target: {target_url}</small></p>
    </div>
    <script>
        // JavaScript redirect as backup
        setTimeout(function() {{
            window.location.href = "{target_url}";
        }}, 100);
    </script>
</body>
</html>'''
            response = HttpResponse(html_response, content_type='text/html')
            response.status_code = 200  # Don't use 302 redirect for browsers
            return response
        else:
            # For QR scanners and other clients, use HTTP redirect
            response = redirect(target_url)
            response['Cache-Control'] = 'no-cache, no-store, must-revalidate'
            response['Pragma'] = 'no-cache'
            response['Expires'] = '0'
            return response
    except QRCode.DoesNotExist:
        logger.error(f"QR Code not found for UUID: {unique_id}")
        return HttpResponse(f"QR code not found for UUID: {unique_id}", status=404)
    except Exception as e:
        logger.error(f"QR Redirect Error for {unique_id}: {str(e)}", exc_info=True)
        return HttpResponse(f"Error redirecting: {str(e)}", status=400)


# 🔹 UPDATE DYNAMIC QR URL
class UpdateQRRedirectView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        new_url = request.data.get('redirect_url')

        if not new_url:
            return Response({"error": "URL required"}, status=400)

        # ✅ URL VALIDATION (support localhost and external URLs)
        validator = URLValidator()
        try:
            # For localhost URLs, add http:// if missing
            if new_url.startswith('localhost:') or new_url.startswith('127.0.0.1:'):
                new_url = f'http://{new_url}'
            validator(new_url)
        except ValidationError:
            return Response({"error": "Invalid URL format. Use http://localhost:3000 or https://example.com"}, status=400)

        qr = get_object_or_404(
            QRCode,
            id=pk,
            user=request.user,
            is_dynamic=True
        )

        qr.redirect_url = new_url
        qr.save()

        return Response({"message": "Redirect URL updated"})


# 🔹 DASHBOARD (WITH PAGINATION)
class DashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qr_codes = QRCode.objects.filter(user=request.user).order_by('-created_at')

        page = request.GET.get('page', 1)
        paginator = Paginator(qr_codes, 5)

        page_obj = paginator.get_page(page)
        serializer = QRCodeSerializer(page_obj, many=True)

        return Response({
            "total": paginator.count,
            "pages": paginator.num_pages,
            "current_page": page_obj.number,
            "data": serializer.data
        })


# 🔹 QR SINGLE INSTANCE OPERATIONS
class QRSingleView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        qr = get_object_or_404(QRCode, id=pk, user=request.user)
        return Response(QRCodeSerializer(qr).data)

    def patch(self, request, pk):
        qr = get_object_or_404(QRCode, id=pk, user=request.user)
        
        # Check if colors are being updated
        fill_color = request.data.get('fill_color')
        back_color = request.data.get('back_color')
        redirect_url = request.data.get('redirect_url')
        
        serializer = QRCodeSerializer(qr, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            
            # Regenerate QR image if colors or URL changed
            if fill_color or back_color or redirect_url:
                if qr.is_dynamic:
                    data_to_encode = build_redirect_path(request, qr.unique_id)
                else:
                    data_to_encode = qr.data
                
                qr_buffer = generate_qr(
                    data_to_encode,
                    fill_color=qr.fill_color,
                    back_color=qr.back_color
                )
                file_name = f"{uuid.uuid4()}.png"
                qr.qr_image.save(
                    file_name,
                    ContentFile(qr_buffer.getvalue()),
                    save=True
                )
            
            return Response(QRCodeSerializer(qr).data)
        return Response(serializer.errors, status=400)

    def delete(self, request, pk):
        qr = get_object_or_404(QRCode, id=pk, user=request.user)
        qr.delete()
        return Response({"message": "Deleted successfully"}, status=204)


# 🔹 ANALYTICS VIEW
class AnalyticsView(APIView):
    permission_classes = [IsAuthenticated]
    throttle_classes = []  # Disable throttling for analytics

    def get(self, request, pk):
        qr = get_object_or_404(QRCode, id=pk, user=request.user)
        
        # Only track analytics for dynamic QRs
        if not qr.is_dynamic:
            return Response({"error": "Analytics only available for dynamic QR codes"}, status=400)
        
        # Get device breakdown with annotations for better performance
        from django.db.models import Count
        device_breakdown = dict(
            qr.scans.values('device').annotate(count=Count('device')).values_list('device', 'count')
        )
        device_breakdown = {
            'mobile': device_breakdown.get('mobile', 0),
            'tablet': device_breakdown.get('tablet', 0),
            'desktop': device_breakdown.get('desktop', 0),
        }
        
        # Get browser breakdown
        browser_breakdown = dict(
            qr.scans.values('browser').annotate(count=Count('browser')).values_list('browser', 'count')
        )
        
        # Get scans for list
        scans = qr.scans.all().order_by('-scanned_at')[:50]
        
        # Get total scans and last scan
        total_scans = qr.scans.count()
        last_scan = qr.scans.first()
        
        return Response({
            "total_scans": total_scans,
            "last_scanned_at": last_scan.scanned_at if last_scan else None,
            "device_breakdown": device_breakdown,
            "browser_breakdown": browser_breakdown,
            "scans": [
                {
                    "device": scan.device,
                    "browser": scan.browser,
                    "ip_address": scan.ip_address,
                    "scanned_at": scan.scanned_at
                }
                for scan in scans
            ]
        })


# 🔹 DEBUG VIEW - Show QR Configuration
class QRDebugView(APIView):
    def get(self, request):
        """Show what URL is being used for QR codes"""
        return Response({
            "qr_base_url": settings.QR_BASE_URL,
            "qr_backend_port": settings.QR_BACKEND_PORT,
            "message": f"QR codes will redirect from: {settings.QR_BASE_URL}/api/qr/r/<unique_id>/",
            "note": "Make sure this URL is reachable from your mobile device on the same network"
        })