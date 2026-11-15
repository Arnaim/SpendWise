from django.shortcuts import render, redirect, get_object_or_404
from .models import Expense
from django.db.models import Sum
from datetime import timedelta
from django.utils import timezone


def home(request):
    expenses = Expense.objects.order_by('-date')[:5]

    # Calculate income, expenses and balance
    total_income = Expense.objects.filter(
        transaction_type='income'
    ).aggregate(Sum('amount'))['amount__sum'] or 0

    total_expense = Expense.objects.filter(
        transaction_type='expense'
    ).aggregate(Sum('amount'))['amount__sum'] or 0

    balance = total_income - total_expense

    
    
    # Date ranges
    today = timezone.localdate()
    thirty_days_ago = today - timedelta(days=30)
    six_months_ago = today - timedelta(days=180)
    twelve_months_ago = today - timedelta(days=365)

    #current month calculations
    monthly_income = Expense.objects.filter(
        transaction_type='income',
        date__year=today.year,
        date__month=today.month,
    ).aggregate(Sum('amount'))['amount__sum'] or 0

    monthly_expense = Expense.objects.filter(
        transaction_type='expense',
        date__year=today.year,
        date__month=today.month,
    ).aggregate(Sum('amount'))['amount__sum'] or 0

    monthly_savings = monthly_income - monthly_expense

    savings_percentage = (
        (monthly_savings / monthly_income) * 100
        if monthly_income > 0
        else 0
    )

    # Previous month income
    previous_month_end = today.replace(day=1) - timedelta(days=1)
    previous_month_start = previous_month_end.replace(day=1)

    previous_month_income = Expense.objects.filter(
        transaction_type='income',
        date__gte=previous_month_start,
        date__lte=previous_month_end,
    ).aggregate(Sum('amount'))['amount__sum'] or 0

    if previous_month_income > 0:
        income_change = (
            (monthly_income - previous_month_income)
            / previous_month_income
        ) * 100
    else:
        income_change = 0 if monthly_income == 0 else None

    previous_month_expense = Expense.objects.filter(
        transaction_type='expense',
        date__gte=previous_month_start,
        date__lte=previous_month_end,
    ).aggregate(Sum('amount'))['amount__sum'] or 0

    if previous_month_expense > 0:
        expense_change = (
            (monthly_expense - previous_month_expense)
            / previous_month_expense
        ) * 100
    else:
        expense_change = 0 if monthly_expense == 0 else None

    # Retrieve individual expense records
    daily_expenses = Expense.objects.filter(
        transaction_type='expense',
        date__gte=thirty_days_ago,
        date__lte=today,
    ).order_by('date')

    six_month_expenses = Expense.objects.filter(
        transaction_type='expense',
        date__gte=six_months_ago,
        date__lte=today,
    ).order_by('date')

    twelve_month_expenses = Expense.objects.filter(
        transaction_type='expense',
        date__gte=twelve_months_ago,
        date__lte=today,
    ).order_by('date')

    # Group daily expenses using Python
    daily_totals = {}

    for expense in daily_expenses:
        day = expense.date
        daily_totals[day] = daily_totals.get(day, 0) + expense.amount

    daily_chart_data = [
        {
            'label': day.strftime('%d %b'),
            'value': float(total),
        }
        for day, total in sorted(daily_totals.items())
    ]

    # Group six-month expenses by month
    six_month_totals = {}

    for expense in six_month_expenses:
        month = expense.date.replace(day=1)
        six_month_totals[month] = (
            six_month_totals.get(month, 0) + expense.amount
        )

    six_month_chart_data = [
        {
            'label': month.strftime('%b %Y'),
            'value': float(total),
        }
        for month, total in sorted(six_month_totals.items())
    ]

    # Group twelve-month expenses by month
    twelve_month_totals = {}

    for expense in twelve_month_expenses:
        month = expense.date.replace(day=1)
        twelve_month_totals[month] = (
            twelve_month_totals.get(month, 0) + expense.amount
        )

    twelve_month_chart_data = [
        {
            'label': month.strftime('%b %Y'),
            'value': float(total),
        }
        for month, total in sorted(twelve_month_totals.items())
    ]

    context = {
        'expenses': expenses,
        'total_income': total_income,
        'total_expense': total_expense,
        'balance': balance,
        'dashboard_data': {
            'daily': daily_chart_data,
            'six_month': six_month_chart_data,
            'twelve_month': twelve_month_chart_data,
        },
        'monthly_savings': monthly_savings,
        'savings_percentage': savings_percentage,
        'income_change': income_change,
        'expense_change': expense_change,
    }

    return render(request, 'expenses/dashboard.html', context)


def transactions(request):
    expenses = Expense.objects.all()

    context = {
        'expenses': expenses,
    }

    return render(request, 'expenses/transactions.html', context)


def reports(request):
    return render(request, 'expenses/reports.html')


def settings_view(request):
    return render(request, 'expenses/settings.html')


def add_expense(request):
    if request.method == 'POST':
        print("CONTENT TYPE:", request.content_type)
        print("POST DATA:", request.POST)
        Expense.objects.create(
            title=request.POST.get('title'),
            amount=request.POST.get('amount'),
            category=request.POST.get('category'),
            transaction_type=request.POST.get('transaction_type'),
            payment_method=request.POST.get('payment_method') or '',
            date=request.POST.get('date'),
            note=request.POST.get('note'),
        )
        return redirect('home')
    return render(request, 'expenses/add_expense.html')


def edit_expense(request, pk):
    expense = get_object_or_404(Expense, pk=pk)

    if request.method == 'POST':
        expense.title = request.POST.get('title')
        expense.amount = request.POST.get('amount')
        expense.category = request.POST.get('category')
        expense.transaction_type = request.POST.get('transaction_type')
        expense.payment_method = request.POST.get('payment_method') or ''
        expense.date = request.POST.get('date')
        expense.note = request.POST.get('note', '')

        expense.save()

        return redirect('transactions')

    return render(request, 'expenses/edit_expense.html', {
        'expense': expense
    })

def delete_expense(request, pk):
    expense = get_object_or_404(Expense, pk=pk)
    expense.delete()
    return redirect('transactions')

def login_view(request):
    return render(request, 'expenses/registration/login.html')


def register_view(request):
    return render(request, 'expenses/registration/register.html')


