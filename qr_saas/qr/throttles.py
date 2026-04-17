from rest_framework.throttling import UserRateThrottle

class QRCreateThrottle(UserRateThrottle):
    scope = 'qr_create'