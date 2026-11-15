from django.db import models
from django.utils import timezone

# Create your models here.
class Expense(models.Model):

    TRANSACTION_TYPES = [
        ('income', 'Income'),
        ('expense', 'Expense'),
    ]

    PAYMENT_METHODS = [
        ('cash', 'Cash'),
        ('card', 'Card'),
        ('bank', 'Bank Transfer'),
        ('mobile', 'Mobile Banking'),
    ]

    title = models.CharField(max_length=100)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    category = models.CharField(max_length=50)
    transaction_type = models.CharField(
        max_length = 10,
        choices = TRANSACTION_TYPES,
    )
    payment_method = models.CharField(
        max_length = 10,
        choices = PAYMENT_METHODS,
        blank = True,
    )
    date = models.DateField(default=timezone.localdate)
    note = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} - {self.amount} ({self.transaction_type})"

    
