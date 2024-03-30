# Create your views here.
from django.http import HttpResponse
from django.shortcuts import render, redirect
from django.views.decorators.clickjacking import xframe_options_exempt

def index(request):
    return render(request, 'G863/index.html')

@xframe_options_exempt
def lesson2(request):
    return render(request, "G863/lesson2.html", {})

def lesson3(request, suffix):
    return render(request, "G863/lesson3.html", {
        "suffix": suffix
    })

def lesson4(request):
    return render(request, "G863/lesson4.html", {})

def lesson5(request):
    return render(request, "G863/lesson5.html", {})

def lesson6(request):
    return render(request, "G863/lesson6.html", {})

def lesson7(request):
    return render(request, "G863/lesson7.html", {})

def final(request):
    return render(request, "G863/final.html", {})

def test(request):
    return render(request, "G863/test.html", {})
