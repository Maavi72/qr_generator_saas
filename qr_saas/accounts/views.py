from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .serializers import RegisterSerializer

class RegisterView(APIView):

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)

        if serializer.is_valid():
            serializer.save()
            return Response(
                {"message": "User registered successfully"},
                status=status.HTTP_201_CREATED
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    
from rest_framework_simplejwt.views import TokenObtainPairView

class LoginView(TokenObtainPairView):
    # You can customize later (add username/email login etc.)
    pass

from rest_framework.permissions import IsAuthenticated

class ProfileView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        data = {
            "username": user.username,
            "email": user.email,
            "is_pro": user.is_pro
        }

        return Response(data)


class ConfirmUpgradeView(APIView):

    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        if user.is_pro:
            return Response({"message": "Already Pro", "is_pro": True})

        user.is_pro = True
        user.save()
        return Response({"message": "User upgraded to PRO", "is_pro": True})
    

from .serializers import UserUpdateSerializer

class ProfileUpdateView(APIView):

    permission_classes = [IsAuthenticated]

    def put(self, request):
        serializer = UserUpdateSerializer(
            request.user,
            data=request.data
        )

        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Profile updated (full)"})

        return Response(serializer.errors, status=400)

    def patch(self, request):
        serializer = UserUpdateSerializer(
            request.user,
            data=request.data,
            partial=True
        )

        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Profile updated (partial)"})

        return Response(serializer.errors, status=400)        