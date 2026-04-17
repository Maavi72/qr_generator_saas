import stripe
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt
from accounts.models import User

# ✅ Set Stripe key
stripe.api_key = settings.STRIPE_SECRET_KEY


# 🔹 CREATE CHECKOUT SESSION
class CreateCheckoutSessionView(APIView):

    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            print("User:", request.user)  # DEBUG

            # fallback origin
            origin = request.data.get('origin') or "http://localhost:5173"

            session = stripe.checkout.Session.create(
                payment_method_types=['card'],
                mode='payment',

                customer_email=request.user.email,

                # ✅ IMPORTANT: ADD METADATA
                metadata={
                    "user_id": request.user.id
                },

                line_items=[{
                    'price_data': {
                        'currency': 'usd',
                        'product_data': {
                            'name': 'Pro Plan',
                        },
                        'unit_amount': 500,
                    },
                    'quantity': 1,
                }],

                success_url=f'{origin}/success',
                cancel_url=f'{origin}/cancel',
            )

            print("Stripe Session Created:", session.url)  # DEBUG

            return Response({'checkout_url': session.url})

        except Exception as e:
            print("STRIPE ERROR:", str(e))  # 🔥 VERY IMPORTANT
            return Response({'error': str(e)}, status=400)


# 🔹 WEBHOOK
@csrf_exempt
def stripe_webhook(request):
    payload = request.body
    sig_header = request.META.get('HTTP_STRIPE_SIGNATURE')
    endpoint_secret = settings.STRIPE_WEBHOOK_SECRET

    if endpoint_secret:
        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, endpoint_secret
            )
        except Exception as e:
            print("Webhook Error:", str(e))
            return HttpResponse(status=400)
    else:
        # For development, skip verification
        import json
        event = json.loads(payload)

    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']

        # ✅ GET USER FROM METADATA (BEST WAY)
        user_id = session.get('metadata', {}).get('user_id')

        try:
            user = User.objects.get(id=user_id)
            user.is_pro = True
            user.save()
            print("User upgraded to PRO:", user.email)

        except User.DoesNotExist:
            print("User not found")

    return HttpResponse(status=200)