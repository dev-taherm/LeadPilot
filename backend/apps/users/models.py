from django.contrib.auth.models import AbstractUser
from django.db import models

from .managers import CustomUserManager


class User(AbstractUser):
    class Role(models.TextChoices):
        SUPER_ADMIN = 'super_admin', 'Super Admin'
        BUSINESS_OWNER = 'business_owner', 'Business Owner'
        STAFF = 'staff', 'Staff'

    username = None
    email = models.EmailField('email address', unique=True)
    first_name = models.CharField('first name', max_length=150)
    last_name = models.CharField('last name', max_length=150)
    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.STAFF,
    )
    business = models.ForeignKey(
        'businesses.Business',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='users',
    )
    phone = models.CharField(max_length=20, blank=True, default='')
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)
    is_active = models.BooleanField(default=True)
    date_joined = models.DateTimeField(auto_now_add=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']

    objects = CustomUserManager()

    class Meta:
        ordering = ['-date_joined']

    def __str__(self):
        return self.email
